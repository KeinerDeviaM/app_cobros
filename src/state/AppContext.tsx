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
  runTransaction,
  setDoc,
  updateDoc,
  where
} from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import {
  AuditLog,
  BusinessSettings,
  CashClosing,
  Client,
  ClientStatus,
  Credit,
  CreditStatus,
  Expense,
  ExpenseStatus,
  Frequency,
  Payment,
  PaymentMethod,
  PaymentReceipt,
  PaymentStatus,
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

type NewClientInput = {
  nombre: string;
  documento: string;
  telefono: string;
  direccion: string;
  barrio: string;
  assignedToUid?: string;
  assignedToEmail?: string;
  routeId?: string;
  routeName?: string;
};

type UpdateClientInput = {
  nombre: string;
  documento: string;
  telefono: string;
  direccion: string;
  barrio: string;
  estado: ClientStatus;
  assignedToUid?: string;
  assignedToEmail?: string;
  routeId?: string;
  routeName?: string;
};

type NewCreditInput = {
  clienteId: string;
  valorPrestado: number;
  valorTotal: number;
  numeroCuotas: number;
  frecuencia: Frequency;
  fechaInicio: string;
};

type UpdateCreditInput = {
  valorPrestado: number;
  valorTotal: number;
  numeroCuotas: number;
  frecuencia: Frequency;
  fechaInicio: string;
  estado: CreditStatus;
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

type UpdateExpenseInput = {
  descripcion: string;
  valor: number;
  fecha: string;
};

type NewRouteInput = {
  nombre: string;
  zona: string;
  descripcion: string;
};

type NewCashClosingInput = {
  fecha: string;
  cajaEntregada: number;
  observacion: string;
};

type NewBusinessSettingsInput = {
  businessName: string;
  appName: string;
  phone: string;
  address: string;
  receiptMessage: string;
  currency: string;
};

type AppContextValue = {
  session: Session;
  authLoading: boolean;
  currentScreen: ScreenName;
  selectedClientId: string;
  selectedClient: Client | undefined;
  selectedCreditId: string;
  selectedCredit: Credit | undefined;
  selectedExpenseId: string;
  selectedExpense: Expense | undefined;
  clients: Client[];
  credits: Credit[];
  payments: Payment[];
  expenses: Expense[];
  users: UserProfile[];
  routes: Route[];
  visits: Visit[];
  cashClosings: CashClosing[];
  auditLogs: AuditLog[];
  businessSettings: BusinessSettings;
  lastReceipt: PaymentReceipt | null;
  loadingClients: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  navigate: (screen: ScreenName) => void;
  clearReceipt: () => void;
  selectClient: (clientId: string) => void;
  selectCredit: (creditId: string) => void;
  selectExpense: (expenseId: string) => void;
  addClient: (input: NewClientInput) => Promise<void>;
  updateClient: (clientId: string, input: UpdateClientInput) => Promise<void>;
  addCredit: (input: NewCreditInput) => Promise<void>;
  updateCreditStatus: (creditId: string, status: CreditStatus) => Promise<void>;
  updateCredit: (creditId: string, input: UpdateCreditInput) => Promise<void>;
  cancelCredit: (creditId: string, motivo?: string) => Promise<void>;
  addPayment: (input: NewPaymentInput) => Promise<void>;
  cancelPayment: (paymentId: string, motivo?: string) => Promise<void>;
  addExpense: (input: NewExpenseInput) => Promise<void>;
  updateExpense: (expenseId: string, input: UpdateExpenseInput) => Promise<void>;
  cancelExpense: (expenseId: string, motivo?: string) => Promise<void>;
  addRoute: (input: NewRouteInput) => Promise<void>;
  createTodayVisits: () => Promise<void>;
  updateVisitStatus: (visitId: string, status: VisitStatus, observacion?: string, promesaFecha?: string) => Promise<void>;
  createCashClosing: (input: NewCashClosingInput) => Promise<void>;
  updateBusinessSettings: (input: NewBusinessSettingsInput) => Promise<void>;
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

function safeCreditStatus(value: unknown): CreditStatus {
  const allowed: CreditStatus[] = ['activo', 'pagado', 'vencido', 'anulado'];
  return allowed.includes(value as CreditStatus) ? (value as CreditStatus) : 'activo';
}

function safePaymentStatus(value: unknown): PaymentStatus {
  return value === 'anulado' ? 'anulado' : 'activo';
}

function safeExpenseStatus(value: unknown): ExpenseStatus {
  return value === 'anulado' ? 'anulado' : 'activo';
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

  if (code.includes('auth/invalid-credential')) return 'Correo o contrasena incorrectos.';
  if (code.includes('auth/user-not-found')) return 'No existe un usuario con ese correo.';
  if (code.includes('auth/wrong-password')) return 'La contrasena es incorrecta.';
  if (code.includes('auth/invalid-email')) return 'El correo no tiene un formato valido.';
  if (code.includes('auth/too-many-requests')) return 'Demasiados intentos. Intenta mas tarde.';
  if (code.includes('auth/network-request-failed')) return 'No hay conexion a internet.';

  return 'No se pudo iniciar sesion. Revisa los datos.';
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session>(initialSession);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentScreen, setCurrentScreen] = useState<ScreenName>('dashboard');

  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedCreditId, setSelectedCreditId] = useState('');
  const [selectedExpenseId, setSelectedExpenseId] = useState('');
  const [lastReceipt, setLastReceipt] = useState<PaymentReceipt | null>(null);

  const [clients, setClients] = useState<Client[]>([]);
  const [credits, setCredits] = useState<Credit[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [cashClosings, setCashClosings] = useState<CashClosing[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings>(defaultBusinessSettings);

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

  const selectedExpense = useMemo(
    () => expenses.find((expense) => expense.id === selectedExpenseId),
    [expenses, selectedExpenseId]
  );

  const getClientName = (clientId: string) => {
    return clients.find((client) => client.id === clientId)?.nombre ?? 'Cliente no encontrado';
  };

  const getCreditClient = (creditId: string) => {
    const credit = credits.find((item) => item.id === creditId);
    if (!credit) return undefined;
    return clients.find((client) => client.id === credit.clienteId);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (!user?.email) {
          setSession(initialSession);
          setClients([]);
          setCredits([]);
          setPayments([]);
          setExpenses([]);
          setUsers([]);
          setRoutes([]);
          setVisits([]);
          setCashClosings([]);
          setAuditLogs([]);
          setBusinessSettings(defaultBusinessSettings);
          setSelectedClientId('');
          setSelectedCreditId('');
          setSelectedExpenseId('');
          setLastReceipt(null);
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
          Alert.alert('Usuario inactivo', 'Tu usuario esta desactivado. Contacta al administrador.');
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

        const data = snapshot.data() as Partial<BusinessSettings>;

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
      }
    );

    return unsubscribe;
  }, [session.loggedIn]);

  useEffect(() => {
    if (!session.loggedIn || !isAdmin) {
      setUsers([]);
      return;
    }

    const unsubscribe = onSnapshot(
      query(collection(db, 'usuarios')),
      (snapshot) => {
        const firebaseUsers: UserProfile[] = snapshot.docs.map((item) => {
          const data = item.data() as Partial<UserProfile>;

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

    const unsubscribe = onSnapshot(
      query(collection(db, 'rutas')),
      (snapshot) => {
        const firebaseRoutes: Route[] = snapshot.docs.map((item) => {
          const data = item.data() as Partial<Route>;

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
      setClients([]);
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
          const data = item.data() as Partial<Client>;

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
            updatedAt: data.updatedAt,
            updatedBy: data.updatedBy,
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
    if (!session.loggedIn) {
      setCredits([]);
      return;
    }

    const creditsQuery = isAdmin
      ? query(collection(db, 'creditos'))
      : query(collection(db, 'creditos'), where('assignedToUid', '==', session.uid));

    const unsubscribe = onSnapshot(
      creditsQuery,
      (snapshot) => {
        const firebaseCredits: Credit[] = snapshot.docs.map((item) => {
          const data = item.data() as Partial<Credit>;

          return {
            id: item.id,
            clienteId: data.clienteId ?? '',
            valorPrestado: safeNumber(data.valorPrestado),
            valorTotal: safeNumber(data.valorTotal),
            saldoPendiente: safeNumber(data.saldoPendiente),
            numeroCuotas: safeNumber(data.numeroCuotas),
            valorCuota: safeNumber(data.valorCuota),
            frecuencia: data.frecuencia ?? 'Diaria',
            estado: safeCreditStatus(data.estado),
            fechaInicio: data.fechaInicio ?? todayKey(),
            createdAt: data.createdAt ?? nowIso(),
            createdBy: data.createdBy,
            updatedAt: data.updatedAt,
            updatedBy: data.updatedBy,
            assignedToUid: data.assignedToUid,
            assignedToEmail: data.assignedToEmail,
            anuladoPor: data.anuladoPor,
            anuladoEn: data.anuladoEn,
            motivoAnulacion: data.motivoAnulacion
          };
        });

        setCredits(sortByCreatedAt(firebaseCredits));
      },
      (error) => {
        console.error('Error cargando creditos:', error);
        Alert.alert('Error Firebase', 'No se pudieron cargar los creditos.');
      }
    );

    return unsubscribe;
  }, [session.loggedIn, session.uid, isAdmin]);

  useEffect(() => {
    if (!session.loggedIn) {
      setPayments([]);
      return;
    }

    const paymentsQuery = isAdmin
      ? query(collection(db, 'pagos'))
      : query(collection(db, 'pagos'), where('assignedToUid', '==', session.uid));

    const unsubscribe = onSnapshot(
      paymentsQuery,
      (snapshot) => {
        const firebasePayments: Payment[] = snapshot.docs.map((item) => {
          const data = item.data() as Partial<Payment>;

          return {
            id: item.id,
            creditoId: data.creditoId ?? '',
            clienteId: data.clienteId ?? '',
            usuarioEmail: data.usuarioEmail ?? '',
            valorPagado: safeNumber(data.valorPagado),
            metodoPago: data.metodoPago ?? 'Efectivo',
            fechaPago: data.fechaPago ?? todayKey(),
            observacion: data.observacion ?? '',
            estado: safePaymentStatus(data.estado),
            createdAt: data.createdAt ?? nowIso(),
            createdBy: data.createdBy,
            updatedAt: data.updatedAt,
            updatedBy: data.updatedBy,
            assignedToUid: data.assignedToUid,
            assignedToEmail: data.assignedToEmail,
            anuladoPor: data.anuladoPor,
            anuladoEn: data.anuladoEn,
            motivoAnulacion: data.motivoAnulacion
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
    if (!session.loggedIn) {
      setExpenses([]);
      return;
    }

    const expensesQuery = isAdmin
      ? query(collection(db, 'gastos'))
      : query(collection(db, 'gastos'), where('createdBy', '==', session.email));

    const unsubscribe = onSnapshot(
      expensesQuery,
      (snapshot) => {
        const firebaseExpenses: Expense[] = snapshot.docs.map((item) => {
          const data = item.data() as Partial<Expense>;

          return {
            id: item.id,
            descripcion: data.descripcion ?? '',
            valor: safeNumber(data.valor),
            fecha: data.fecha ?? todayKey(),
            createdAt: data.createdAt ?? nowIso(),
            createdBy: data.createdBy,
            estado: safeExpenseStatus(data.estado),
            updatedAt: data.updatedAt,
            updatedBy: data.updatedBy,
            anuladoPor: data.anuladoPor,
            anuladoEn: data.anuladoEn,
            motivoAnulacion: data.motivoAnulacion
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
          const data = item.data() as Partial<Visit>;

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
    if (!session.loggedIn) {
      setCashClosings([]);
      return;
    }

    const closingsQuery = isAdmin
      ? query(collection(db, 'cierresCaja'))
      : query(collection(db, 'cierresCaja'), where('usuarioUid', '==', session.uid));

    const unsubscribe = onSnapshot(
      closingsQuery,
      (snapshot) => {
        const firebaseClosings: CashClosing[] = snapshot.docs.map((item) => {
          const data = item.data() as Partial<CashClosing>;

          return {
            id: item.id,
            fecha: data.fecha ?? todayKey(),
            usuarioEmail: data.usuarioEmail ?? '',
            usuarioUid: data.usuarioUid ?? '',
            totalPagos: safeNumber(data.totalPagos),
            totalGastos: safeNumber(data.totalGastos),
            cajaEsperada: safeNumber(data.cajaEsperada),
            cajaEntregada: safeNumber(data.cajaEntregada),
            diferencia: safeNumber(data.diferencia),
            observacion: data.observacion ?? '',
            createdAt: data.createdAt ?? nowIso(),
            createdBy: data.createdBy
          };
        });

        setCashClosings(sortByCreatedAt(firebaseClosings));
      },
      (error) => {
        console.error('Error cargando cierres de caja:', error);
        Alert.alert('Error Firebase', 'No se pudieron cargar los cierres de caja.');
      }
    );

    return unsubscribe;
  }, [session.loggedIn, session.uid, isAdmin]);

  useEffect(() => {
    if (!session.loggedIn || !isAdmin) {
      setAuditLogs([]);
      return;
    }

    const unsubscribe = onSnapshot(
      query(collection(db, 'auditoria')),
      (snapshot) => {
        const firebaseAuditLogs: AuditLog[] = snapshot.docs.map((item) => {
          const data = item.data() as Partial<AuditLog>;

          return {
            id: item.id,
            tipo: data.tipo ?? '',
            descripcion: data.descripcion ?? '',
            pagoId: data.pagoId ?? '',
            creditoId: data.creditoId ?? '',
            clienteId: data.clienteId ?? '',
            valor: safeNumber(data.valor),
            motivo: data.motivo ?? '',
            usuarioEmail: data.usuarioEmail ?? '',
            createdAt: data.createdAt ?? nowIso()
          };
        });

        setAuditLogs(sortByCreatedAt(firebaseAuditLogs));
      },
      (error) => {
        console.error('Error cargando auditoria:', error);
        Alert.alert('Error Firebase', 'No se pudo cargar la auditoria.');
      }
    );

    return unsubscribe;
  }, [session.loggedIn, isAdmin]);

  const stats = useMemo(() => {
    const today = todayKey();
    const activePayments = payments.filter((payment) => payment.estado !== 'anulado');
    const validCreditsForStats = credits.filter((credit) => credit.estado !== 'anulado');

    const collectedToday = activePayments
      .filter((payment) => payment.fechaPago === today)
      .reduce((total, payment) => total + payment.valorPagado, 0);

    const expensesToday = expenses
      .filter((expense) => expense.estado !== 'anulado' && expense.fecha === today)
      .reduce((total, expense) => total + expense.valor, 0);

    const pendingTotal = validCreditsForStats.reduce((total, credit) => total + credit.saldoPendiente, 0);
    const recoveredTotal = activePayments.reduce((total, payment) => total + payment.valorPagado, 0);
    const lentTotal = validCreditsForStats.reduce((total, credit) => total + credit.valorPrestado, 0);

    return {
      totalClients: clients.length,
      activeCredits: validCreditsForStats.filter((credit) => credit.estado === 'activo').length,
      collectedToday,
      pendingTotal,
      expensesToday,
      cashExpected: collectedToday - expensesToday,
      overdueClients: clients.filter((client) => client.estado === 'en-mora').length,
      recoveredTotal,
      lentTotal
    };
  }, [clients, credits, expenses, payments]);

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password.trim());
      setCurrentScreen('dashboard');
    } catch (error) {
      console.error('Error login:', error);
      Alert.alert('No se pudo iniciar sesion', getAuthErrorMessage(error));
    }
  };

  const logout = async () => {
    await signOut(auth);
    setCurrentScreen('dashboard');
  };

  const clearReceipt = () => setLastReceipt(null);

  const navigate = (screen: ScreenName) => {
    const adminOnlyScreens: ScreenName[] = [
      'newClient',
      'editClient',
      'newCredit',
      'editCredit',
      'reports',
      'users',
      'audit',
      'businessSettings',
      'exportReports',
      'preApkChecklist'
    ];

    if (adminOnlyScreens.includes(screen) && !isAdmin) {
      Alert.alert('Acceso restringido', 'Esta seccion solo esta disponible para administradores.');
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

  const selectExpense = (expenseId: string) => {
    setSelectedExpenseId(expenseId);
    setCurrentScreen('editExpense');
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
        ...input,
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
      Alert.alert('Acceso restringido', 'Solo un administrador puede crear creditos.');
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

      Alert.alert('Credito creado', 'El credito fue creado correctamente.');
      setCurrentScreen('credits');
    } catch (error) {
      console.error('Error creando credito:', error);
      Alert.alert('Error Firebase', 'No se pudo crear el credito.');
    }
  };

  const updateCreditStatus = async (creditId: string, status: CreditStatus) => {
    if (!isAdmin) {
      Alert.alert('Acceso restringido', 'Solo un administrador puede cambiar el estado del credito.');
      return;
    }

    try {
      const updateData: Record<string, unknown> = {
        estado: status,
        updatedAt: nowIso(),
        updatedBy: session.email
      };

      if (status === 'pagado' || status === 'anulado') {
        updateData.saldoPendiente = 0;
      }

      await updateDoc(doc(db, 'creditos', creditId), updateData);

      Alert.alert('Credito actualizado', `El credito fue marcado como ${status}.`);
    } catch (error) {
      console.error('Error actualizando credito:', error);
      Alert.alert('Error Firebase', 'No se pudo actualizar el credito.');
    }
  };

  const updateCredit = async (creditId: string, input: UpdateCreditInput) => {
    if (!isAdmin) {
      Alert.alert('Acceso restringido', 'Solo un administrador puede editar creditos.');
      return;
    }

    const localCredit = credits.find((credit) => credit.id === creditId);

    if (!localCredit) {
      Alert.alert('Credito no encontrado', 'No se encontro el credito que quieres editar.');
      return;
    }

    if (localCredit.estado === 'anulado') {
      Alert.alert('Credito anulado', 'No puedes editar un credito anulado.');
      return;
    }

    try {
      const activePayments = payments.filter(
        (payment) => payment.creditoId === creditId && payment.estado !== 'anulado'
      );

      const totalPaid = activePayments.reduce((total, payment) => total + payment.valorPagado, 0);

      if (input.valorTotal < totalPaid) {
        Alert.alert('Valor total invalido', `Este credito ya tiene pagos por ${totalPaid}.`);
        return;
      }

      const valorCuota = input.numeroCuotas > 0 ? Math.ceil(input.valorTotal / input.numeroCuotas) : input.valorTotal;
      const saldoCalculado = Math.max(input.valorTotal - totalPaid, 0);
      const nextStatus = input.estado === 'pagado' || saldoCalculado === 0 ? 'pagado' : input.estado;
      const nextBalance = nextStatus === 'pagado' ? 0 : saldoCalculado;

      await updateDoc(doc(db, 'creditos', creditId), {
        valorPrestado: input.valorPrestado,
        valorTotal: input.valorTotal,
        saldoPendiente: nextBalance,
        numeroCuotas: input.numeroCuotas,
        valorCuota,
        frecuencia: input.frecuencia,
        fechaInicio: input.fechaInicio,
        estado: nextStatus,
        updatedAt: nowIso(),
        updatedBy: session.email
      });

      await addDoc(collection(db, 'auditoria'), {
        tipo: 'EDITAR_CREDITO',
        descripcion: `Credito editado por ${session.email}`,
        creditoId: creditId,
        clienteId: localCredit.clienteId,
        valor: input.valorTotal,
        usuarioEmail: session.email,
        createdAt: nowIso()
      });

      Alert.alert('Credito actualizado', 'Los cambios fueron guardados correctamente.');
      setCurrentScreen('creditDetail');
    } catch (error) {
      console.error('Error editando credito:', error);
      Alert.alert('Error Firebase', 'No se pudo editar el credito.');
    }
  };

  const cancelCredit = async (creditId: string, motivo = 'Credito anulado desde app') => {
    if (!isAdmin) {
      Alert.alert('Acceso restringido', 'Solo un administrador puede anular creditos.');
      return;
    }

    const localCredit = credits.find((credit) => credit.id === creditId);

    if (!localCredit) {
      Alert.alert('Credito no encontrado', 'No se encontro el credito que quieres anular.');
      return;
    }

    if (localCredit.estado === 'anulado') {
      Alert.alert('Credito ya anulado', 'Este credito ya fue anulado anteriormente.');
      return;
    }

    try {
      await runTransaction(db, async (transaction) => {
        const creditRef = doc(db, 'creditos', creditId);
        const auditRef = doc(collection(db, 'auditoria'));
        const creditSnap = await transaction.get(creditRef);

        if (!creditSnap.exists()) {
          throw new Error('El credito no existe en Firebase.');
        }

        const creditData = creditSnap.data();
        const fecha = nowIso();

        transaction.update(creditRef, {
          estado: 'anulado',
          saldoPendiente: 0,
          updatedAt: fecha,
          updatedBy: session.email,
          motivoAnulacion: motivo,
          anuladoPor: session.email,
          anuladoEn: fecha
        });

        transaction.set(auditRef, {
          tipo: 'ANULAR_CREDITO',
          descripcion: `Credito anulado por ${session.email}`,
          creditoId: creditId,
          clienteId: localCredit.clienteId,
          valor: Number(creditData.valorTotal || 0),
          motivo,
          usuarioEmail: session.email,
          createdAt: fecha
        });
      });

      Alert.alert('Credito anulado', 'El credito fue anulado y ya no suma en cartera.');
    } catch (error) {
      console.error('Error anulando credito:', error);
      Alert.alert('Error Firebase', 'No se pudo anular el credito.');
    }
  };

  const addPayment = async (input: NewPaymentInput) => {
    try {
      const credit = credits.find((item) => item.id === input.creditoId);

      if (!credit) {
        Alert.alert('Credito no encontrado', 'Selecciona un credito valido.');
        return;
      }

      if (credit.estado === 'pagado' || credit.estado === 'anulado') {
        Alert.alert('Credito no disponible', 'Este credito no permite registrar pagos.');
        return;
      }

      const nextBalance = Math.max(credit.saldoPendiente - input.valorPagado, 0);
      const nextStatus: CreditStatus = nextBalance === 0 ? 'pagado' : credit.estado === 'vencido' ? 'vencido' : 'activo';

      await addDoc(collection(db, 'pagos'), {
        ...input,
        clienteId: credit.clienteId,
        usuarioEmail: session.email,
        estado: 'activo',
        createdAt: nowIso(),
        createdBy: session.email,
        assignedToUid: credit.assignedToUid ?? session.uid,
        assignedToEmail: credit.assignedToEmail ?? session.email
      });

      await updateDoc(doc(db, 'creditos', credit.id), {
        saldoPendiente: nextBalance,
        estado: nextStatus,
        updatedAt: nowIso(),
        updatedBy: session.email
      });

      setLastReceipt({
        id: `recibo-${Date.now()}`,
        clienteId: credit.clienteId,
        clienteNombre: getClientName(credit.clienteId),
        creditoId: credit.id,
        valorPagado: input.valorPagado,
        saldoAnterior: credit.saldoPendiente,
        saldoNuevo: nextBalance,
        metodoPago: input.metodoPago,
        fechaPago: input.fechaPago,
        observacion: input.observacion,
        cobradorEmail: session.email,
        createdAt: nowIso()
      });

      Alert.alert('Pago registrado', 'El saldo del credito fue actualizado.');
      setCurrentScreen('paymentReceipt');
    } catch (error) {
      console.error('Error registrando pago:', error);
      Alert.alert('Error Firebase', 'No se pudo registrar el pago.');
    }
  };

  const cancelPayment = async (paymentId: string, motivo = 'Anulacion desde app') => {
    if (!isAdmin) {
      Alert.alert('Acceso restringido', 'Solo un administrador puede anular pagos.');
      return;
    }

    const localPayment = payments.find((payment) => payment.id === paymentId);

    if (!localPayment) {
      Alert.alert('Pago no encontrado', 'No se encontro el pago que quieres anular.');
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

        if (!paymentSnap.exists()) throw new Error('El pago no existe.');
        if (!creditSnap.exists()) throw new Error('El credito asociado no existe.');

        const paymentData = paymentSnap.data();
        const creditData = creditSnap.data();

        if (paymentData.estado === 'anulado') {
          throw new Error('El pago ya esta anulado.');
        }

        const valorPagado = Number(paymentData.valorPagado || 0);
        const saldoActual = Number(creditData.saldoPendiente || 0);
        const valorTotal = Number(creditData.valorTotal || 0);
        const saldoDevuelto = valorTotal > 0 ? Math.min(valorTotal, saldoActual + valorPagado) : saldoActual + valorPagado;
        const nuevoEstadoCredito = saldoDevuelto === 0 ? 'pagado' : creditData.estado === 'vencido' ? 'vencido' : 'activo';
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

      Alert.alert('Pago anulado', 'El pago fue anulado y el saldo del credito fue actualizado.');
    } catch (error) {
      console.error('Error anulando pago:', error);
      Alert.alert('Error Firebase', 'No se pudo anular el pago.');
    }
  };

  const addExpense = async (input: NewExpenseInput) => {
    try {
      await addDoc(collection(db, 'gastos'), {
        ...input,
        estado: 'activo',
        createdAt: nowIso(),
        createdBy: session.email
      });

      Alert.alert('Gasto registrado', 'El gasto fue agregado a la caja diaria.');
    } catch (error) {
      console.error('Error registrando gasto:', error);
      Alert.alert('Error Firebase', 'No se pudo registrar el gasto.');
    }
  };


  const updateExpense = async (expenseId: string, input: UpdateExpenseInput) => {
    const localExpense = expenses.find((expense) => expense.id === expenseId);

    if (!localExpense) {
      Alert.alert('Gasto no encontrado', 'No se encontro el gasto que quieres editar.');
      return;
    }

    if (localExpense.estado === 'anulado') {
      Alert.alert('Gasto anulado', 'No puedes editar un gasto anulado.');
      return;
    }

    if (!isAdmin && localExpense.createdBy !== session.email) {
      Alert.alert('Acceso restringido', 'Solo puedes editar gastos creados por tu usuario.');
      return;
    }

    try {
      await updateDoc(doc(db, 'gastos', expenseId), {
        descripcion: input.descripcion,
        valor: input.valor,
        fecha: input.fecha,
        updatedAt: nowIso(),
        updatedBy: session.email
      });

      await addDoc(collection(db, 'auditoria'), {
        tipo: 'EDITAR_GASTO',
        descripcion: `Gasto editado por ${session.email}`,
        valor: input.valor,
        usuarioEmail: session.email,
        createdAt: nowIso()
      });

      Alert.alert('Gasto actualizado', 'Los cambios fueron guardados correctamente.');
      setCurrentScreen('dailyCash');
    } catch (error) {
      console.error('Error editando gasto:', error);
      Alert.alert('Error Firebase', 'No se pudo editar el gasto.');
    }
  };

  const cancelExpense = async (expenseId: string, motivo = 'Gasto anulado desde app') => {
    const localExpense = expenses.find((expense) => expense.id === expenseId);

    if (!localExpense) {
      Alert.alert('Gasto no encontrado', 'No se encontro el gasto que quieres anular.');
      return;
    }

    if (localExpense.estado === 'anulado') {
      Alert.alert('Gasto ya anulado', 'Este gasto ya fue anulado anteriormente.');
      return;
    }

    if (!isAdmin && localExpense.createdBy !== session.email) {
      Alert.alert('Acceso restringido', 'Solo puedes anular gastos creados por tu usuario.');
      return;
    }

    try {
      const fecha = nowIso();

      await updateDoc(doc(db, 'gastos', expenseId), {
        estado: 'anulado',
        anuladoPor: session.email,
        anuladoEn: fecha,
        motivoAnulacion: motivo,
        updatedAt: fecha,
        updatedBy: session.email
      });

      await addDoc(collection(db, 'auditoria'), {
        tipo: 'ANULAR_GASTO',
        descripcion: `Gasto anulado por ${session.email}`,
        valor: localExpense.valor,
        motivo,
        usuarioEmail: session.email,
        createdAt: fecha
      });

      Alert.alert('Gasto anulado', 'El gasto fue anulado y ya no resta en caja.');
      setCurrentScreen('dailyCash');
    } catch (error) {
      console.error('Error anulando gasto:', error);
      Alert.alert('Error Firebase', 'No se pudo anular el gasto.');
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
        estado: 'activo',
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
      visits.filter((visit) => visit.fecha === today).map((visit) => `${visit.fecha}-${visit.clienteId}`)
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

  const updateVisitStatus = async (visitId: string, status: VisitStatus, observacion = '', promesaFecha = '') => {
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

  const createCashClosing = async (input: NewCashClosingInput) => {
    try {
      const targetDate = input.fecha || todayKey();
      const activePayments = payments.filter((payment) => payment.estado !== 'anulado');

      const userPayments = activePayments.filter((payment) => {
        if (payment.fechaPago !== targetDate) return false;
        if (isAdmin) return true;
        return payment.usuarioEmail === session.email || payment.assignedToUid === session.uid;
      });

      const userExpenses = expenses.filter((expense) => {
        if (expense.estado === 'anulado') return false;
        if (expense.fecha !== targetDate) return false;
        if (isAdmin) return true;
        return expense.createdBy === session.email;
      });

      const totalPagos = userPayments.reduce((total, payment) => total + payment.valorPagado, 0);
      const totalGastos = userExpenses.reduce((total, expense) => total + expense.valor, 0);
      const cajaEsperada = totalPagos - totalGastos;
      const diferencia = input.cajaEntregada - cajaEsperada;

      await addDoc(collection(db, 'cierresCaja'), {
        fecha: targetDate,
        usuarioEmail: session.email,
        usuarioUid: session.uid,
        totalPagos,
        totalGastos,
        cajaEsperada,
        cajaEntregada: input.cajaEntregada,
        diferencia,
        observacion: input.observacion,
        createdAt: nowIso(),
        createdBy: session.email
      });

      await addDoc(collection(db, 'auditoria'), {
        tipo: 'CIERRE_CAJA',
        descripcion: `Cierre de caja registrado por ${session.email}`,
        valor: input.cajaEntregada,
        usuarioEmail: session.email,
        createdAt: nowIso()
      });

      Alert.alert('Caja cerrada', diferencia === 0 ? 'La caja fue cerrada sin diferencias.' : `Diferencia: ${diferencia}`);
    } catch (error) {
      console.error('Error cerrando caja:', error);
      Alert.alert('Error Firebase', 'No se pudo cerrar la caja.');
    }
  };

  const updateBusinessSettings = async (input: NewBusinessSettingsInput) => {
    if (!isAdmin) {
      Alert.alert('Acceso restringido', 'Solo un administrador puede editar la configuracion del negocio.');
      return;
    }

    try {
      await setDoc(
        doc(db, 'configuracion', 'negocio'),
        {
          ...input,
          updatedAt: nowIso(),
          updatedBy: session.email
        },
        { merge: true }
      );

      await addDoc(collection(db, 'auditoria'), {
        tipo: 'CONFIG_NEGOCIO',
        descripcion: `Configuracion del negocio actualizada por ${session.email}`,
        usuarioEmail: session.email,
        createdAt: nowIso()
      });

      Alert.alert('Configuracion guardada', 'Los datos del negocio fueron actualizados.');
    } catch (error) {
      console.error('Error guardando configuracion:', error);
      Alert.alert('Error Firebase', 'No se pudo guardar la configuracion.');
    }
  };

  const updateUserRole = async (userId: string, role: UserRole) => {
    if (!isAdmin) return;

    if (userId === session.uid && role !== 'admin') {
      Alert.alert('Accion no permitida', 'No puedes quitarte tu propio rol de administrador.');
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
    if (!isAdmin) return;

    if (userId === session.uid && !activo) {
      Alert.alert('Accion no permitida', 'No puedes desactivar tu propio usuario.');
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
    if (!isAdmin) return;

    try {
      await updateDoc(doc(db, 'clientes', clientId), {
        assignedToUid: collector?.uid ?? '',
        assignedToEmail: collector?.email ?? ''
      });

      Alert.alert('Asignacion actualizada', collector ? `Cliente asignado a ${collector.email}.` : 'Cliente sin cobrador.');
    } catch (error) {
      console.error('Error asignando cliente:', error);
      Alert.alert('Error Firebase', 'No se pudo asignar el cliente.');
    }
  };

  const assignClientToRoute = async (clientId: string, route: Route | null) => {
    if (!isAdmin) return;

    try {
      await updateDoc(doc(db, 'clientes', clientId), {
        routeId: route?.id ?? '',
        routeName: route?.nombre ?? ''
      });

      Alert.alert('Ruta actualizada', route ? `Cliente asignado a la ruta ${route.nombre}.` : 'Cliente sin ruta.');
    } catch (error) {
      console.error('Error asignando ruta:', error);
      Alert.alert('Error Firebase', 'No se pudo asignar la ruta.');
    }
  };

  const changeClientStatus = async (clientId: string, status: ClientStatus) => {
    try {
      await updateDoc(doc(db, 'clientes', clientId), { estado: status });
      Alert.alert('Estado actualizado', status === 'al-dia' ? 'Cliente al dia.' : 'Cliente en mora.');
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
    selectedCreditId,
    selectedCredit,
    selectedExpenseId,
    selectedExpense,
    clients,
    credits,
    payments,
    expenses,
    users,
    routes,
    visits,
    cashClosings,
    auditLogs,
    businessSettings,
    lastReceipt,
    loadingClients,
    isAdmin,
    login,
    logout,
    navigate,
    clearReceipt,
    selectClient,
    selectCredit,
    selectExpense,
    addClient,
    updateClient,
    addCredit,
    updateCreditStatus,
    updateCredit,
    cancelCredit,
    addPayment,
    cancelPayment,
    addExpense,
    updateExpense,
    cancelExpense,
    addRoute,
    createTodayVisits,
    updateVisitStatus,
    createCashClosing,
    updateBusinessSettings,
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
