import React, { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  runTransaction,
  where
} from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import {
  Client,
  ClientStatus,
  Credit,
  Expense,
  Frequency,
  Payment,
  PaymentMethod,
  PaymentReceipt,
  Route,
  ScreenName,
  Session,
  UserProfile,
  UserRole,
  Visit,
  VisitStatus
} from '../types';
import { nowIso, todayKey } from '../utils/date';

const ADMIN_EMAIL = 'admin@cobroapp.com';

type NewClientInput = Omit<Client, 'id' | 'estado' | 'createdAt'>;

type UpdateClientInput = Omit<Client, 'id' | 'createdAt' | 'createdBy'>;

type NewCreditInput = {
  clienteId: string;
  valorPrestado: number;
  valorTotal: number;
  numeroCuotas: number;
  frecuencia: Frequency;
  fechaInicio: string;
};

type NewPaymentInput = {
  creditoId: string;
  valorPagado: number;
  metodoPago: PaymentMethod;
  fechaPago: string;
  observacion: string;
};

type NewExpenseInput = {
  descripcion: string;
  valor: number;
  fecha: string;
};

type NewRouteInput = {
  nombre: string;
  zona: string;
  descripcion: string;
};

type AppContextValue = {
  session: Session;
  authLoading: boolean;
  currentScreen: ScreenName;
  selectedClientId: string;
  selectedClient: Client | undefined;
  selectedCreditId: string;
  selectedCredit: Credit | undefined;
  clients: Client[];
  credits: Credit[];
  payments: Payment[];
  lastReceipt: PaymentReceipt | null;
  expenses: Expense[];
  users: UserProfile[];
  routes: Route[];
  visits: Visit[];
  loadingClients: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  navigate: (screen: ScreenName) => void;
  clearReceipt: () => void;
  selectClient: (clientId: string) => void;
  selectCredit: (creditId: string) => void;
  addClient: (input: NewClientInput) => Promise<void>;
  updateClient: (clientId: string, input: UpdateClientInput) => Promise<void>;
  addCredit: (input: NewCreditInput) => Promise<void>;
  updateCreditStatus: (creditId: string, status: Credit['estado']) => Promise<void>;
  addPayment: (input: NewPaymentInput) => Promise<void>;
  cancelPayment: (paymentId: string, motivo?: string) => Promise<void>;
  addExpense: (input: NewExpenseInput) => Promise<void>;
  addRoute: (input: NewRouteInput) => Promise<void>;
  createTodayVisits: () => Promise<void>;
  updateVisitStatus: (visitId: string, status: VisitStatus, observacion?: string, promesaFecha?: string) => Promise<void>;
  updateUserRole: (userId: string, role: UserRole) => Promise<void>;
  toggleUserActive: (userId: string, activo: boolean) => Promise<void>;
  assignClientToCollector: (clientId: string, collector: UserProfile | null) => Promise<void>;
  assignClientToRoute: (clientId: string, route: Route | null) => Promise<void>;
  changeClientStatus: (clientId: string, status: ClientStatus) => Promise<void>;
  getClientName: (clientId: string) => string;
  getCreditClient: (creditId: string) => Client | undefined;
  stats: {
    totalClients: number;
    activeCredits: number;
    collectedToday: number;
    pendingTotal: number;
    expensesToday: number;
    cashExpected: number;
    overdueClients: number;
    recoveredTotal: number;
    lentTotal: number;
  };
};

const initialSession: Session = {
  loggedIn: false,
  uid: '',
  email: '',
  role: 'cobrador'
};

const defaultBusinessSettings: BusinessSettings = {
  id: 'negocio',
  businessName: 'CobroApp',
  appName: 'CobroApp',
  phone: '',
  address: '',
  receiptMessage: 'Gracias por su pago. Conserve este comprobante.',
  currency: 'COP'
};

const AppContext = createContext<AppContextValue | undefined>(undefined);

function safeNumber(value: unknown): number {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function safeRole(value: unknown): UserRole {
  return value === 'admin' || value === 'cobrador' ? value : 'cobrador';
}

function safeVisitStatus(value: unknown): VisitStatus {
  const allowed: VisitStatus[] = ['pendiente', 'visitado', 'pago', 'no-pago', 'no-estaba', 'promesa'];
  return allowed.includes(value as VisitStatus) ? (value as VisitStatus) : 'pendiente';
}

function sortByCreatedAt<T extends { createdAt: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function getAuthErrorMessage(error: unknown): string {
  const code = typeof error === 'object' && error !== null && 'code' in error ? String((error as { code?: string }).code) : '';

  if (code.includes('auth/invalid-credential')) return 'Correo o contraseÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â±a incorrectos.';
  if (code.includes('auth/user-not-found')) return 'No existe un usuario con ese correo.';
  if (code.includes('auth/wrong-password')) return 'La contraseÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â±a es incorrecta.';
  if (code.includes('auth/invalid-email')) return 'El correo no tiene un formato vÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡lido.';
  if (code.includes('auth/too-many-requests')) return 'Demasiados intentos. Intenta mÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡s tarde.';
  if (code.includes('auth/network-request-failed')) return 'No hay conexiÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n a internet.';

  return 'No se pudo iniciar sesiÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n. Revisa los datos.';
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session>(initialSession);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentScreen, setCurrentScreen] = useState<ScreenName>('dashboard');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedCreditId, setSelectedCreditId] = useState('');

  const [clients, setClients] = useState<Client[]>([]);
  const [credits, setCredits] = useState<Credit[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [lastReceipt, setLastReceipt] = useState<PaymentReceipt | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);

  const [loadingClients, setLoadingClients] = useState(false);

  const isAdmin = session.role === 'admin';

  const selectedClient = useMemo(
    () => clients.find((client) => client.id === selectedClientId),
    [clients, selectedClientId]
  );

  const selectedCredit = useMemo(
    () => credits.find((credit) => credit.id === selectedCreditId),
    [credits, selectedCreditId]
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (!user?.email) {
          setSession(initialSession);
          setClients([]);
          setCredits([]);
          setPayments([]);
          setLastReceipt(null);
          setExpenses([]);
          setUsers([]);
          setRoutes([]);
          setVisits([]);
          setSelectedClientId('');
          setSelectedCreditId('');
          setCurrentScreen('dashboard');
          setAuthLoading(false);
          return;
        }

        const userRef = doc(db, 'usuarios', user.uid);
        const userSnap = await getDoc(userRef);

        let role: UserRole = 'cobrador';
        let activo = true;

        if (userSnap.exists()) {
          const data = userSnap.data();
          role = safeRole(data.role);
          activo = data.activo !== false;
        } else {
          role = user.email.toLowerCase() === ADMIN_EMAIL ? 'admin' : 'cobrador';

          await setDoc(userRef, {
            uid: user.uid,
            email: user.email,
            role,
            activo: true,
            createdAt: nowIso()
          });
        }

        if (!activo) {
          await signOut(auth);
          Alert.alert('Usuario inactivo', 'Tu usuario estÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ desactivado. Contacta al administrador.');
          setAuthLoading(false);
          return;
        }

        setSession({
          loggedIn: true,
          uid: user.uid,
          email: user.email,
          role
        });

        setAuthLoading(false);
      } catch (error) {
        console.error('Error cargando perfil de usuario:', error);
        Alert.alert('Error de usuario', 'No se pudo cargar el perfil del usuario.');
        setAuthLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!session.loggedIn || !isAdmin) {
      setUsers([]);
      return;
    }

    const usersQuery = query(collection(db, 'usuarios'));

    const unsubscribe = onSnapshot(
      usersQuery,
      (snapshot) => {
        const firebaseUsers: UserProfile[] = snapshot.docs.map((item) => {
          const data = item.data() as Omit<UserProfile, 'id'>;

          return {
            id: item.id,
            uid: data.uid ?? item.id,
            email: data.email ?? '',
            role: safeRole(data.role),
            activo: data.activo !== false,
            createdAt: data.createdAt ?? nowIso()
          };
        });

        setUsers(sortByCreatedAt(firebaseUsers));
      },
      (error) => {
        console.error('Error cargando usuarios:', error);
        Alert.alert('Error Firebase', 'No se pudieron cargar los usuarios.');
      }
    );

    return unsubscribe;
  }, [session.loggedIn, isAdmin]);

  useEffect(() => {
    if (!session.loggedIn) {
      setRoutes([]);
      return;
    }

    const routesQuery = query(collection(db, 'rutas'));

    const unsubscribe = onSnapshot(
      routesQuery,
      (snapshot) => {
        const firebaseRoutes: Route[] = snapshot.docs.map((item) => {
          const data = item.data() as Omit<Route, 'id'>;

          return {
            id: item.id,
            nombre: data.nombre ?? '',
            zona: data.zona ?? '',
            descripcion: data.descripcion ?? '',
            createdAt: data.createdAt ?? nowIso(),
            createdBy: data.createdBy
          };
        });

        setRoutes(sortByCreatedAt(firebaseRoutes));
      },
      (error) => {
        console.error('Error cargando rutas:', error);
        Alert.alert('Error Firebase', 'No se pudieron cargar las rutas.');
      }
    );

    return unsubscribe;
  }, [session.loggedIn]);

  useEffect(() => {
    if (!session.loggedIn) {
      setLoadingClients(false);
      return;
    }

    setLoadingClients(true);

    const clientsQuery = isAdmin
      ? query(collection(db, 'clientes'))
      : query(collection(db, 'clientes'), where('assignedToUid', '==', session.uid));

    const unsubscribe = onSnapshot(
      clientsQuery,
      (snapshot) => {
        const firebaseClients: Client[] = snapshot.docs.map((item) => {
          const data = item.data() as Omit<Client, 'id'>;

          return {
            id: item.id,
            nombre: data.nombre ?? '',
            documento: data.documento ?? '',
            telefono: data.telefono ?? '',
            direccion: data.direccion ?? '',
            barrio: data.barrio ?? '',
            estado: data.estado ?? 'al-dia',
            createdAt: data.createdAt ?? nowIso(),
            createdBy: data.createdBy,
            assignedToUid: data.assignedToUid,
            assignedToEmail: data.assignedToEmail,
            routeId: data.routeId,
            routeName: data.routeName
          };
        });

        setClients(sortByCreatedAt(firebaseClients));
        setLoadingClients(false);
      },
      (error) => {
        console.error('Error cargando clientes:', error);
        setLoadingClients(false);
        Alert.alert('Error Firebase', 'No se pudieron cargar los clientes.');
      }
    );

    return unsubscribe;
  }, [session.loggedIn, session.uid, isAdmin]);

  useEffect(() => {
    if (!session.loggedIn) return;

    const creditsQuery = isAdmin
      ? query(collection(db, 'creditos'))
      : query(collection(db, 'creditos'), where('assignedToUid', '==', session.uid));

    const unsubscribe = onSnapshot(
      creditsQuery,
      (snapshot) => {
        const firebaseCredits: Credit[] = snapshot.docs.map((item) => {
          const data = item.data() as Omit<Credit, 'id'>;

          return {
            id: item.id,
            clienteId: data.clienteId ?? '',
            valorPrestado: safeNumber(data.valorPrestado),
            valorTotal: safeNumber(data.valorTotal),
            saldoPendiente: safeNumber(data.saldoPendiente),
            numeroCuotas: safeNumber(data.numeroCuotas),
            valorCuota: safeNumber(data.valorCuota),
            frecuencia: data.frecuencia ?? 'Diaria',
            estado: data.estado ?? 'activo',
            fechaInicio: data.fechaInicio ?? todayKey(),
            createdAt: data.createdAt ?? nowIso(),
            createdBy: data.createdBy,
            assignedToUid: data.assignedToUid,
            assignedToEmail: data.assignedToEmail
          };
        });

        setCredits(sortByCreatedAt(firebaseCredits));
      },
      (error) => {
        console.error('Error cargando crÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©ditos:', error);
        Alert.alert('Error Firebase', 'No se pudieron cargar los crÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©ditos.');
      }
    );

    return unsubscribe;
  }, [session.loggedIn, session.uid, isAdmin]);

  useEffect(() => {
    if (!session.loggedIn) return;

    const paymentsQuery = isAdmin
      ? query(collection(db, 'pagos'))
      : query(collection(db, 'pagos'), where('assignedToUid', '==', session.uid));

    const unsubscribe = onSnapshot(
      paymentsQuery,
      (snapshot) => {
        const firebasePayments: Payment[] = snapshot.docs.map((item) => {
          const data = item.data() as Omit<Payment, 'id'>;

          return {
            id: item.id,
            creditoId: data.creditoId ?? '',
            clienteId: data.clienteId ?? '',
            valorPagado: safeNumber(data.valorPagado),
            metodoPago: data.metodoPago ?? 'Efectivo',
            fechaPago: data.fechaPago ?? todayKey(),
            observacion: data.observacion ?? '',
            usuarioEmail: data.usuarioEmail ?? '',
            createdAt: data.createdAt ?? nowIso(),
            createdBy: data.createdBy,
            assignedToUid: data.assignedToUid,
            assignedToEmail: data.assignedToEmail,
            estado: data.estado ?? 'activo',
            anuladoPor: data.anuladoPor ?? '',
            anuladoEn: data.anuladoEn ?? '',
            motivoAnulacion: data.motivoAnulacion ?? ''
          };
        });

        setPayments(sortByCreatedAt(firebasePayments));
      },
      (error) => {
        console.error('Error cargando pagos:', error);
        Alert.alert('Error Firebase', 'No se pudieron cargar los pagos.');
      }
    );

    return unsubscribe;
  }, [session.loggedIn, session.uid, isAdmin]);

  useEffect(() => {
    if (!session.loggedIn) return;

    const expensesQuery = isAdmin
      ? query(collection(db, 'gastos'))
      : query(collection(db, 'gastos'), where('createdBy', '==', session.email));

    const unsubscribe = onSnapshot(
      expensesQuery,
      (snapshot) => {
        const firebaseExpenses: Expense[] = snapshot.docs.map((item) => {
          const data = item.data() as Omit<Expense, 'id'>;

          return {
            id: item.id,
            descripcion: data.descripcion ?? '',
            valor: safeNumber(data.valor),
            fecha: data.fecha ?? todayKey(),
            createdAt: data.createdAt ?? nowIso(),
            createdBy: data.createdBy
          };
        });

        setExpenses(sortByCreatedAt(firebaseExpenses));
      },
      (error) => {
        console.error('Error cargando gastos:', error);
        Alert.alert('Error Firebase', 'No se pudieron cargar los gastos.');
      }
    );

    return unsubscribe;
  }, [session.loggedIn, session.email, isAdmin]);

  useEffect(() => {
    if (!session.loggedIn) {
      setVisits([]);
      return;
    }

    const visitsQuery = isAdmin
      ? query(collection(db, 'visitas'))
      : query(collection(db, 'visitas'), where('assignedToUid', '==', session.uid));

    const unsubscribe = onSnapshot(
      visitsQuery,
      (snapshot) => {
        const firebaseVisits: Visit[] = snapshot.docs.map((item) => {
          const data = item.data() as Omit<Visit, 'id'>;

          return {
            id: item.id,
            clienteId: data.clienteId ?? '',
            clienteNombre: data.clienteNombre ?? '',
            clienteTelefono: data.clienteTelefono ?? '',
            clienteDireccion: data.clienteDireccion ?? '',
            clienteBarrio: data.clienteBarrio ?? '',
            fecha: data.fecha ?? todayKey(),
            estado: safeVisitStatus(data.estado),
            observacion: data.observacion ?? '',
            promesaFecha: data.promesaFecha ?? '',
            routeId: data.routeId ?? '',
            routeName: data.routeName ?? '',
            assignedToUid: data.assignedToUid ?? '',
            assignedToEmail: data.assignedToEmail ?? '',
            createdAt: data.createdAt ?? nowIso(),
            createdBy: data.createdBy,
            updatedAt: data.updatedAt
          };
        });

        setVisits(sortByCreatedAt(firebaseVisits));
      },
      (error) => {
        console.error('Error cargando visitas:', error);
        Alert.alert('Error Firebase', 'No se pudieron cargar las visitas.');
      }
    );

    return unsubscribe;
  }, [session.loggedIn, session.uid, isAdmin]);


  useEffect(() => {
    if (!session.loggedIn || !isAdmin) {
      setAuditLogs([]);
      return;
    }

    const auditQuery = query(collection(db, 'auditoria'));

    const unsubscribe = onSnapshot(
      auditQuery,
      (snapshot) => {
        const firebaseAuditLogs: AuditLog[] = snapshot.docs.map((item) => {
          const data = item.data() as Omit<AuditLog,
  BusinessSettings, 'id'>;

          return {
            id: item.id,
            tipo: data.tipo ?? '',
            descripcion: data.descripcion ?? '',
            pagoId: data.pagoId ?? '',
            creditoId: data.creditoId ?? '',
            clienteId: data.clienteId ?? '',
            valor: safeNumber(data.valor),
            usuarioEmail: data.usuarioEmail ?? '',
            createdAt: data.createdAt ?? nowIso()
          };
        });

        setAuditLogs(sortByCreatedAt(firebaseAuditLogs));
      },
      (error) => {
        console.error('Error cargando auditoria:', error);
        Alert.alert('Error Firebase', 'No se pudo cargar la auditorÃ­a.');
      }
    );

    return unsubscribe;
  }, [session.loggedIn, isAdmin]);

  useEffect(() => {
    if (!session.loggedIn) {
      setBusinessSettings(defaultBusinessSettings);
      return;
    }

    const settingsRef = doc(db, 'configuracion', 'negocio');

    const unsubscribe = onSnapshot(
      settingsRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          setBusinessSettings(defaultBusinessSettings);
          return;
        }

        const data = snapshot.data() as Omit<BusinessSettings, 'id'>;

        setBusinessSettings({
          id: snapshot.id,
          businessName: data.businessName || defaultBusinessSettings.businessName,
          appName: data.appName || defaultBusinessSettings.appName,
          phone: data.phone || '',
          address: data.address || '',
          receiptMessage: data.receiptMessage || defaultBusinessSettings.receiptMessage,
          currency: data.currency || defaultBusinessSettings.currency,
          updatedAt: data.updatedAt,
          updatedBy: data.updatedBy
        });
      },
      (error) => {
        console.error('Error cargando configuracion del negocio:', error);
        Alert.alert('Error Firebase', 'No se pudo cargar la configuración del negocio.');
      }
    );

    return unsubscribe;
  }, [session.loggedIn]);
  const stats = useMemo(() => {
    const today = todayKey();
    const activePayments = payments.filter((payment) => payment.estado !== 'anulado');

    const collectedToday = activePayments
      .filter((payment) => payment.fechaPago === today)
      .reduce((total, payment) => total + payment.valorPagado, 0);

    const expensesToday = expenses
      .filter((expense) => expense.fecha === today)
      .reduce((total, expense) => total + expense.valor, 0);

    const pendingTotal = credits.reduce((total, credit) => total + credit.saldoPendiente, 0);
    const recoveredTotal = activePayments.reduce((total, payment) => total + payment.valorPagado, 0);
    const lentTotal = credits.reduce((total, credit) => total + credit.valorPrestado, 0);

    return {
      totalClients: clients.length,
      activeCredits: credits.filter((credit) => credit.estado === 'activo').length,
      collectedToday,
      pendingTotal,
      expensesToday,
      cashExpected: collectedToday - expensesToday,
      overdueClients: clients.filter((client) => client.estado === 'en-mora').length,
      recoveredTotal,
      lentTotal
    };
  }, [clients, credits, expenses, payments]);

  const getClientName = (clientId: string) => {
    return clients.find((client) => client.id === clientId)?.nombre ?? 'Cliente no encontrado';
  };

  const getCreditClient = (creditId: string) => {
    const credit = credits.find((item) => item.id === creditId);
    if (!credit) return undefined;
    return clients.find((client) => client.id === credit.clienteId);
  };

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password.trim());
      setCurrentScreen('dashboard');
    } catch (error) {
      console.error('Error login:', error);
      Alert.alert('No se pudo iniciar sesiÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n', getAuthErrorMessage(error));
    }
  };

  const logout = async () => {
    await signOut(auth);
    setCurrentScreen('dashboard');
  };

  const clearReceipt = () => setLastReceipt(null);

  const navigate = (screen: ScreenName) => {
    const adminOnlyScreens: ScreenName[] = ['newClient', 'newCredit', 'reports', 'users'];

    if (adminOnlyScreens.includes(screen) && !isAdmin) {
      Alert.alert('Acceso restringido', 'Esta secciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n solo estÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ disponible para administradores.');
      return;
    }

    setCurrentScreen(screen);
  };

  const selectClient = (clientId: string) => {
    setSelectedClientId(clientId);
    setCurrentScreen('clientDetail');
  };

  const selectCredit = (creditId: string) => {
    setSelectedCreditId(creditId);
    setCurrentScreen('creditDetail');
  };

  const addClient = async (input: NewClientInput) => {
    if (!isAdmin) {
      Alert.alert('Acceso restringido', 'Solo un administrador puede crear clientes.');
      return;
    }

    try {
      await addDoc(collection(db, 'clientes'), {
        ...input,
        estado: 'al-dia',
        createdAt: nowIso(),
        createdBy: session.email
      });

      Alert.alert('Cliente guardado', 'El cliente fue creado correctamente.');
      setCurrentScreen('clients');
    } catch (error) {
      console.error('Error guardando cliente:', error);
      Alert.alert('Error Firebase', 'No se pudo guardar el cliente.');
    }
  };


  const updateClient = async (clientId: string, input: UpdateClientInput) => {
    if (!isAdmin) {
      Alert.alert('Acceso restringido', 'Solo un administrador puede editar clientes.');
      return;
    }

    try {
      await updateDoc(doc(db, 'clientes', clientId), {
        nombre: input.nombre,
        documento: input.documento,
        telefono: input.telefono,
        direccion: input.direccion,
        barrio: input.barrio,
        estado: input.estado,
        assignedToUid: input.assignedToUid ?? '',
        assignedToEmail: input.assignedToEmail ?? '',
        routeId: input.routeId ?? '',
        routeName: input.routeName ?? '',
        updatedAt: nowIso(),
        updatedBy: session.email
      });

      Alert.alert('Cliente actualizado', 'Los cambios fueron guardados correctamente.');
      setCurrentScreen('clientDetail');
    } catch (error) {
      console.error('Error actualizando cliente:', error);
      Alert.alert('Error Firebase', 'No se pudo actualizar el cliente.');
    }
  };
  const addCredit = async (input: NewCreditInput) => {
    if (!isAdmin) {
      Alert.alert('Acceso restringido', 'Solo un administrador puede crear crÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©ditos.');
      return;
    }

    try {
      const client = clients.find((item) => item.id === input.clienteId);
      const valorCuota = input.numeroCuotas > 0 ? Math.ceil(input.valorTotal / input.numeroCuotas) : input.valorTotal;

      await addDoc(collection(db, 'creditos'), {
        ...input,
        saldoPendiente: input.valorTotal,
        valorCuota,
        estado: 'activo',
        createdAt: nowIso(),
        createdBy: session.email,
        assignedToUid: client?.assignedToUid ?? '',
        assignedToEmail: client?.assignedToEmail ?? ''
      });

      Alert.alert('CrÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©dito creado', 'El crÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©dito fue creado correctamente.');
      setCurrentScreen('credits');
    } catch (error) {
      console.error('Error creando crÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©dito:', error);
      Alert.alert('Error Firebase', 'No se pudo crear el crÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©dito.');
    }
  };


  const updateCreditStatus = async (creditId: string, status: Credit['estado']) => {
    if (!isAdmin) {
      Alert.alert('Acceso restringido', 'Solo un administrador puede cambiar el estado del crÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©dito.');
      return;
    }

    try {
      const updateData: Partial<Credit> = {
        estado: status
      };

      if (status === 'pagado') {
        updateData.saldoPendiente = 0;
      }

      await updateDoc(doc(db, 'creditos', creditId), {
        ...updateData,
        updatedAt: nowIso(),
        updatedBy: session.email
      });

      Alert.alert('CrÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©dito actualizado', `El crÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©dito fue marcado como ${status}.`);
    } catch (error) {
      console.error('Error actualizando crÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©dito:', error);
      Alert.alert('Error Firebase', 'No se pudo actualizar el crÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©dito.');
    }
  };
  const addPayment = async (input: NewPaymentInput) => {
    try {
      const credit = credits.find((item) => item.id === input.creditoId);

      if (!credit) {
        Alert.alert('CrÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©dito no encontrado', 'Selecciona un crÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©dito vÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡lido.');
        return;
      }

      const nextBalance = Math.max(credit.saldoPendiente - input.valorPagado, 0);
      const nextStatus = nextBalance === 0 ? 'pagado' : credit.estado === 'vencido' ? 'vencido' : 'activo';

      await addDoc(collection(db, 'pagos'), {
        ...input,
        clienteId: credit.clienteId,
        usuarioEmail: session.email,
        createdAt: nowIso(),
        createdBy: session.email,
        assignedToUid: credit.assignedToUid ?? session.uid,
        assignedToEmail: credit.assignedToEmail ?? session.email,
        estado: 'activo'
      });

      await updateDoc(doc(db, 'creditos', credit.id), {
        saldoPendiente: nextBalance,
        estado: nextStatus
      });

      Alert.alert('Pago registrado', 'El saldo del crÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©dito fue actualizado.');
      setCurrentScreen('payments');
    } catch (error) {
      console.error('Error registrando pago:', error);
      Alert.alert('Error Firebase', 'No se pudo registrar el pago.');
    }
  };


  const cancelPayment = async (paymentId: string, motivo = 'AnulaciÃƒÆ’Ã‚Â³n desde app') => {
    if (!isAdmin) {
      Alert.alert('Acceso restringido', 'Solo un administrador puede anular pagos.');
      return;
    }

    const localPayment = payments.find((payment) => payment.id === paymentId);

    if (!localPayment) {
      Alert.alert('Pago no encontrado', 'No se encontrÃƒÆ’Ã‚Â³ el pago que quieres anular.');
      return;
    }

    if (localPayment.estado === 'anulado') {
      Alert.alert('Pago ya anulado', 'Este pago ya fue anulado anteriormente.');
      return;
    }

    try {
      await runTransaction(db, async (transaction) => {
        const paymentRef = doc(db, 'pagos', paymentId);
        const creditRef = doc(db, 'creditos', localPayment.creditoId);
        const auditRef = doc(collection(db, 'auditoria'));

        const paymentSnap = await transaction.get(paymentRef);
        const creditSnap = await transaction.get(creditRef);

        if (!paymentSnap.exists()) {
          throw new Error('El pago no existe en Firebase.');
        }

        if (!creditSnap.exists()) {
          throw new Error('El crÃƒÆ’Ã‚Â©dito asociado no existe en Firebase.');
        }

        const paymentData = paymentSnap.data();
        const creditData = creditSnap.data();

        if (paymentData.estado === 'anulado') {
          throw new Error('El pago ya estÃƒÆ’Ã‚Â¡ anulado.');
        }

        const valorPagado = Number(paymentData.valorPagado || 0);
        const saldoActual = Number(creditData.saldoPendiente || 0);
        const valorTotal = Number(creditData.valorTotal || 0);

        const saldoDevuelto = valorTotal > 0
          ? Math.min(valorTotal, saldoActual + valorPagado)
          : saldoActual + valorPagado;

        const nuevoEstadoCredito = saldoDevuelto === 0
          ? 'pagado'
          : creditData.estado === 'vencido'
            ? 'vencido'
            : 'activo';

        const fecha = nowIso();

        transaction.update(paymentRef, {
          estado: 'anulado',
          anuladoPor: session.email,
          anuladoEn: fecha,
          motivoAnulacion: motivo,
          updatedAt: fecha,
          updatedBy: session.email
        });

        transaction.update(creditRef, {
          saldoPendiente: saldoDevuelto,
          estado: nuevoEstadoCredito,
          updatedAt: fecha,
          updatedBy: session.email
        });

        transaction.set(auditRef, {
          tipo: 'ANULAR_PAGO',
          descripcion: `Pago anulado por ${session.email}`,
          pagoId: paymentId,
          creditoId: localPayment.creditoId,
          clienteId: localPayment.clienteId,
          valor: valorPagado,
          motivo,
          usuarioEmail: session.email,
          createdAt: fecha
        });
      });

      Alert.alert('Pago anulado', 'El pago fue anulado y el saldo del crÃƒÆ’Ã‚Â©dito fue actualizado.');
    } catch (error) {
      console.error('Error anulando pago:', error);
      Alert.alert('Error Firebase', 'No se pudo anular el pago.');
    }
  };
  const addExpense = async (input: NewExpenseInput) => {
    try {
      await addDoc(collection(db, 'gastos'), {
        ...input,
        createdAt: nowIso(),
        createdBy: session.email
      });

      Alert.alert('Gasto registrado', 'El gasto fue agregado a la caja diaria.');
    } catch (error) {
      console.error('Error registrando gasto:', error);
      Alert.alert('Error Firebase', 'No se pudo registrar el gasto.');
    }
  };

  const addRoute = async (input: NewRouteInput) => {
    if (!isAdmin) {
      Alert.alert('Acceso restringido', 'Solo un administrador puede crear rutas.');
      return;
    }

    try {
      await addDoc(collection(db, 'rutas'), {
        ...input,
        createdAt: nowIso(),
        createdBy: session.email
      });

      Alert.alert('Ruta creada', 'La ruta fue creada correctamente.');
    } catch (error) {
      console.error('Error creando ruta:', error);
      Alert.alert('Error Firebase', 'No se pudo crear la ruta.');
    }
  };

  const createTodayVisits = async () => {
    const today = todayKey();

    const candidateClients = clients.filter((client) => {
      if (isAdmin) return Boolean(client.assignedToUid);
      return client.assignedToUid === session.uid;
    });

    if (candidateClients.length === 0) {
      Alert.alert('Sin clientes', isAdmin ? 'No hay clientes asignados a cobradores.' : 'No tienes clientes asignados.');
      return;
    }

    const existingKeys = new Set(
      visits
        .filter((visit) => visit.fecha === today)
        .map((visit) => `${visit.fecha}-${visit.clienteId}`)
    );

    const clientsToCreate = candidateClients.filter((client) => !existingKeys.has(`${today}-${client.id}`));

    if (clientsToCreate.length === 0) {
      Alert.alert('Visitas listas', 'Las visitas de hoy ya estaban generadas.');
      return;
    }

    try {
      await Promise.all(
        clientsToCreate.map((client) =>
          addDoc(collection(db, 'visitas'), {
            clienteId: client.id,
            clienteNombre: client.nombre,
            clienteTelefono: client.telefono,
            clienteDireccion: client.direccion,
            clienteBarrio: client.barrio,
            fecha: today,
            estado: 'pendiente',
            observacion: '',
            promesaFecha: '',
            routeId: client.routeId ?? '',
            routeName: client.routeName ?? '',
            assignedToUid: client.assignedToUid ?? session.uid,
            assignedToEmail: client.assignedToEmail ?? session.email,
            createdAt: nowIso(),
            createdBy: session.email
          })
        )
      );

      Alert.alert('Visitas creadas', `Se crearon ${clientsToCreate.length} visitas para hoy.`);
    } catch (error) {
      console.error('Error creando visitas:', error);
      Alert.alert('Error Firebase', 'No se pudieron crear las visitas de hoy.');
    }
  };

  const updateVisitStatus = async (
    visitId: string,
    status: VisitStatus,
    observacion = '',
    promesaFecha = ''
  ) => {
    try {
      await updateDoc(doc(db, 'visitas', visitId), {
        estado: status,
        observacion,
        promesaFecha,
        updatedAt: nowIso()
      });

      Alert.alert('Visita actualizada', 'El estado de la visita fue actualizado.');
    } catch (error) {
      console.error('Error actualizando visita:', error);
      Alert.alert('Error Firebase', 'No se pudo actualizar la visita.');
    }
  };


  const updateBusinessSettings = async (input: NewBusinessSettingsInput) => {
    if (!isAdmin) {
      Alert.alert('Acceso restringido', 'Solo un administrador puede editar la configuración del negocio.');
      return;
    }

    try {
      await setDoc(doc(db, 'configuracion', 'negocio'), {
        ...input,
        updatedAt: nowIso(),
        updatedBy: session.email
      }, { merge: true });

      await addDoc(collection(db, 'auditoria'), {
        tipo: 'CONFIG_NEGOCIO',
        descripcion: `Configuración del negocio actualizada por ${session.email}`,
        usuarioEmail: session.email,
        createdAt: nowIso()
      });

      Alert.alert('Configuración guardada', 'Los datos del negocio fueron actualizados.');
    } catch (error) {
      console.error('Error guardando configuración:', error);
      Alert.alert('Error Firebase', 'No se pudo guardar la configuración.');
    }
  };
  const updateUserRole = async (userId: string, role: UserRole) => {
    if (!isAdmin) {
      Alert.alert('Acceso restringido', 'Solo un administrador puede cambiar roles.');
      return;
    }

    if (userId === session.uid && role !== 'admin') {
      Alert.alert('AcciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n no permitida', 'No puedes quitarte tu propio rol de administrador.');
      return;
    }

    try {
      await updateDoc(doc(db, 'usuarios', userId), { role });
      Alert.alert('Rol actualizado', `El usuario ahora es ${role}.`);
    } catch (error) {
      console.error('Error cambiando rol:', error);
      Alert.alert('Error Firebase', 'No se pudo cambiar el rol.');
    }
  };

  const toggleUserActive = async (userId: string, activo: boolean) => {
    if (!isAdmin) {
      Alert.alert('Acceso restringido', 'Solo un administrador puede activar o desactivar usuarios.');
      return;
    }

    if (userId === session.uid && !activo) {
      Alert.alert('AcciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n no permitida', 'No puedes desactivar tu propio usuario.');
      return;
    }

    try {
      await updateDoc(doc(db, 'usuarios', userId), { activo });
      Alert.alert('Usuario actualizado', activo ? 'Usuario activado.' : 'Usuario desactivado.');
    } catch (error) {
      console.error('Error actualizando usuario:', error);
      Alert.alert('Error Firebase', 'No se pudo actualizar el usuario.');
    }
  };

  const assignClientToCollector = async (clientId: string, collector: UserProfile | null) => {
    if (!isAdmin) {
      Alert.alert('Acceso restringido', 'Solo un administrador puede asignar clientes.');
      return;
    }

    try {
      await updateDoc(doc(db, 'clientes', clientId), {
        assignedToUid: collector?.uid ?? '',
        assignedToEmail: collector?.email ?? ''
      });

      Alert.alert(
        'AsignaciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n actualizada',
        collector ? `Cliente asignado a ${collector.email}.` : 'Cliente quedÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³ sin cobrador asignado.'
      );
    } catch (error) {
      console.error('Error asignando cliente:', error);
      Alert.alert('Error Firebase', 'No se pudo asignar el cliente.');
    }
  };

  const assignClientToRoute = async (clientId: string, route: Route | null) => {
    if (!isAdmin) {
      Alert.alert('Acceso restringido', 'Solo un administrador puede asignar rutas.');
      return;
    }

    try {
      await updateDoc(doc(db, 'clientes', clientId), {
        routeId: route?.id ?? '',
        routeName: route?.nombre ?? ''
      });

      Alert.alert(
        'Ruta actualizada',
        route ? `Cliente asignado a la ruta ${route.nombre}.` : 'Cliente quedÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³ sin ruta.'
      );
    } catch (error) {
      console.error('Error asignando ruta:', error);
      Alert.alert('Error Firebase', 'No se pudo asignar la ruta.');
    }
  };

  const changeClientStatus = async (clientId: string, status: ClientStatus) => {
    try {
      await updateDoc(doc(db, 'clientes', clientId), {
        estado: status
      });

      Alert.alert(
        'Estado actualizado',
        status === 'al-dia' ? 'El cliente quedÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³ marcado como Al dÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­a.' : 'El cliente quedÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³ marcado como En mora.'
      );
    } catch (error) {
      console.error('Error cambiando estado:', error);
      Alert.alert('Error Firebase', 'No se pudo cambiar el estado del cliente.');
    }
  };

  const value: AppContextValue = {
    session,
    authLoading,
    currentScreen,
    selectedClientId,
    selectedClient,
    clients,
    credits,
    payments,
    expenses,
    users,
    routes,
    visits,
    loadingClients,
    isAdmin,
    login,
    logout,
    navigate,
    clearReceipt,
    selectClient,
    selectCredit,
    addClient,
    updateClient,
    addCredit,
    updateCreditStatus,
    addPayment,
    cancelPayment,
    addExpense,
    addRoute,
    createTodayVisits,
    updateVisitStatus,
    updateUserRole,
    toggleUserActive,
    assignClientToCollector,
    assignClientToRoute,
    changeClientStatus,
    getClientName,
    getCreditClient,
    stats
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error('useApp debe usarse dentro de AppProvider');
  }

  return context;
}