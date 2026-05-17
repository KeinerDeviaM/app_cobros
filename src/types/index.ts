export type ScreenName =
  | 'dashboard'
  | 'clients'
  | 'clientDetail'
  | 'editClient'
  | 'credits'
  | 'payments'
  | 'newClient'
  | 'newCredit'
  | 'registerPayment'
  | 'dailyCash'
  | 'reports'
  | 'users'
  | 'routes'
  | 'visits'
  | 'more';

export type UserRole = 'admin' | 'cobrador';

export type ClientStatus = 'al-dia' | 'en-mora';
export type CreditStatus = 'activo' | 'pagado' | 'vencido';
export type Frequency = 'Diaria' | 'Semanal' | 'Quincenal' | 'Mensual';
export type PaymentMethod = 'Efectivo' | 'Transferencia' | 'Nequi' | 'Daviplata' | 'Otro';

export type VisitStatus = 'pendiente' | 'visitado' | 'pago' | 'no-pago' | 'no-estaba' | 'promesa';

export interface Session {
  loggedIn: boolean;
  uid: string;
  email: string;
  role: UserRole;
}

export interface UserProfile {
  id: string;
  uid: string;
  email: string;
  role: UserRole;
  activo: boolean;
  createdAt: string;
}

export interface Route {
  id: string;
  nombre: string;
  zona: string;
  descripcion: string;
  createdAt: string;
  createdBy?: string;
}

export interface Client {
  id: string;
  nombre: string;
  documento: string;
  telefono: string;
  direccion: string;
  barrio: string;
  estado: ClientStatus;
  createdAt: string;
  createdBy?: string;
  assignedToUid?: string;
  assignedToEmail?: string;
  routeId?: string;
  routeName?: string;
}

export interface Credit {
  id: string;
  clienteId: string;
  valorPrestado: number;
  valorTotal: number;
  saldoPendiente: number;
  numeroCuotas: number;
  valorCuota: number;
  frecuencia: Frequency;
  estado: CreditStatus;
  fechaInicio: string;
  createdAt: string;
  createdBy?: string;
  assignedToUid?: string;
  assignedToEmail?: string;
}

export interface Payment {
  id: string;
  creditoId: string;
  clienteId: string;
  usuarioEmail: string;
  valorPagado: number;
  metodoPago: PaymentMethod;
  fechaPago: string;
  observacion: string;
  createdAt: string;
  createdBy?: string;
  assignedToUid?: string;
  assignedToEmail?: string;
}

export interface Expense {
  id: string;
  descripcion: string;
  valor: number;
  fecha: string;
  createdAt: string;
  createdBy?: string;
}

export interface Visit {
  id: string;
  clienteId: string;
  clienteNombre: string;
  clienteTelefono: string;
  clienteDireccion: string;
  clienteBarrio: string;
  fecha: string;
  estado: VisitStatus;
  observacion: string;
  promesaFecha?: string;
  routeId?: string;
  routeName?: string;
  assignedToUid?: string;
  assignedToEmail?: string;
  createdAt: string;
  createdBy?: string;
  updatedAt?: string;
}