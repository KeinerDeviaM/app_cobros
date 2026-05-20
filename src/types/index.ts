export type ScreenName =
  | 'dashboard'
  | 'clients'
  | 'clientDetail'
  | 'clientHistory'
  | 'globalSearch'
  | 'advancedAnalytics'
  | 'dataBackup'
  | 'restoreBackup'
  | 'templatesManual'
  | 'auditLog'
  | 'systemChecklist'
  | 'importClients'
  | 'importCredits'
  | 'help'
  | 'offlineStatus'
  | 'reminders'
  | 'operationalControl'
  | 'editClient'
  | 'credits'
  | 'creditDetail'
  | 'installments'
  | 'collectionsCalendar'
  | 'promises'
  | 'editCredit'
  | 'payments'
  | 'paymentReceipt'
  | 'editPayment'
  | 'newClient'
  | 'newCredit'
  | 'registerPayment'
  | 'dailyCash'
  | 'editExpense'
  | 'reports'
  | 'users'
  | 'routes'
  | 'visits'
  | 'audit'
  | 'businessSettings'
  | 'exportReports'
  | 'preApkChecklist'
  | 'more';

export type UserRole = 'admin' | 'supervisor' | 'cobrador';

export type ClientStatus = 'al-dia' | 'en-mora';
export type CreditStatus = 'activo' | 'pagado' | 'vencido' | 'anulado';
export type Frequency = 'Diaria' | 'Semanal' | 'Quincenal' | 'Mensual' | 'Personalizada';
export type PaymentMethod = 'Efectivo' | 'Transferencia' | 'Nequi' | 'Daviplata' | 'Otro';
export type PaymentStatus = 'activo' | 'editado' | 'anulado';
export type ExpenseStatus = 'activo' | 'anulado';
export type VisitStatus = 'pendiente' | 'visitado' | 'pago' | 'no-pago' | 'no-estaba' | 'promesa';
export type PromiseStatus = 'pendiente' | 'cumplida' | 'incumplida' | 'cancelada';

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
  updatedAt?: string;
  updatedBy?: string;
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
  fechaFinal?: string;
  porcentaje?: number;
  tipoCobro?: Frequency;
  nota?: string;
  codeudorTiene?: boolean;
  codeudorTipo?: 'cliente' | 'nuevo';
  codeudorClienteId?: string;
  codeudorNombreCompleto?: string;
  codeudorSobrenombre?: string;
  codeudorCpf?: string;
  codeudorDireccion?: string;
  codeudorTelefono?: string;
  codeudorNota?: string;
  createdAt: string;
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;
  assignedToUid?: string;
  assignedToEmail?: string;
  anuladoPor?: string;
  anuladoEn?: string;
  motivoAnulacion?: string;
}

export interface Payment {
  id: string;
  creditoId: string;
  clienteId: string;
  usuarioEmail: string;
  valorPagado: number;
  metodoPago: PaymentMethod;
  fechaPago: string;
  saldoAnterior?: number;
  saldoNuevo?: number;
  fechaHoraPago?: string;
  editadoPor?: string;
  editadoEn?: string;
  motivoEdicion?: string;
  valorOriginal?: number;
  observacion: string;
  estado: PaymentStatus;
  createdAt: string;
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;
  assignedToUid?: string;
  assignedToEmail?: string;
  anuladoPor?: string;
  anuladoEn?: string;
  motivoAnulacion?: string;
}

export interface Expense {
  id: string;
  descripcion: string;
  valor: number;
  fecha: string;
  estado: ExpenseStatus;
  createdAt: string;
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;
  anuladoPor?: string;
  anuladoEn?: string;
  motivoAnulacion?: string;
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
  promesaValor?: number;
  promesaEstado?: PromiseStatus;
  promesaCumplidaEn?: string;
  routeId?: string;
  routeName?: string;
  assignedToUid?: string;
  assignedToEmail?: string;
  createdAt: string;
  createdBy?: string;
  updatedAt?: string;
}

export interface CashClosing {
  id: string;
  fecha: string;
  usuarioEmail: string;
  usuarioUid: string;
  totalPagos: number;
  totalGastos: number;
  cajaEsperada: number;
  cajaEntregada: number;
  diferencia: number;
  observacion: string;
  createdAt: string;
  createdBy?: string;
}

export interface AuditLog {
  id: string;
  tipo: string;
  descripcion: string;
  pagoId?: string;
  creditoId?: string;
  clienteId?: string;
  valor?: number;
  motivo?: string;
  usuarioEmail: string;
  createdAt: string;
}

export interface BusinessSettings {
  id: string;
  businessName: string;
  appName: string;
  phone: string;
  address: string;
  receiptMessage: string;
  receiptLegalText: string;
  receiptFooter: string;
  currency: string;
  primaryColor: string;
  secondaryColor: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface PaymentReceipt {
  id: string;
  clienteId: string;
  clienteNombre: string;
  creditoId: string;
  valorPagado: number;
  saldoAnterior: number;
  saldoNuevo: number;
  metodoPago: PaymentMethod;
  fechaPago: string;
  observacion: string;
  cobradorEmail: string;
  createdAt: string;
}
