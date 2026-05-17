import { Client, Credit, Expense, Payment } from '../types';
import { nowIso, todayKey } from '../utils/date';

const today = todayKey();

export const seedClients: Client[] = [
  {
    id: 'cliente-1',
    nombre: 'Juan Perez',
    documento: '1001234567',
    telefono: '300 123 4567',
    direccion: 'Calle 12 # 4-56',
    barrio: 'Centro',
    estado: 'al-dia',
    createdAt: nowIso()
  },
  {
    id: 'cliente-2',
    nombre: 'Maria Gomez',
    documento: '1019876543',
    telefono: '310 987 6543',
    direccion: 'Carrera 8 # 20-15',
    barrio: 'San Jose',
    estado: 'en-mora',
    createdAt: nowIso()
  },
  {
    id: 'cliente-3',
    nombre: 'Carlos Ruiz',
    documento: '1022223333',
    telefono: '311 222 3333',
    direccion: 'Diagonal 5 # 11-30',
    barrio: 'La Esperanza',
    estado: 'al-dia',
    createdAt: nowIso()
  },
  {
    id: 'cliente-4',
    nombre: 'Luisa Martinez',
    documento: '1035556677',
    telefono: '320 555 6677',
    direccion: 'Manzana 3 Casa 9',
    barrio: 'El Prado',
    estado: 'en-mora',
    createdAt: nowIso()
  }
];

export const seedCredits: Credit[] = [
  {
    id: 'credito-1',
    clienteId: 'cliente-1',
    valorPrestado: 1000000,
    valorTotal: 1250000,
    saldoPendiente: 900000,
    numeroCuotas: 25,
    valorCuota: 50000,
    frecuencia: 'Diaria',
    estado: 'activo',
    fechaInicio: today,
    createdAt: nowIso()
  },
  {
    id: 'credito-2',
    clienteId: 'cliente-2',
    valorPrestado: 500000,
    valorTotal: 650000,
    saldoPendiente: 650000,
    numeroCuotas: 13,
    valorCuota: 50000,
    frecuencia: 'Semanal',
    estado: 'vencido',
    fechaInicio: today,
    createdAt: nowIso()
  },
  {
    id: 'credito-3',
    clienteId: 'cliente-3',
    valorPrestado: 800000,
    valorTotal: 960000,
    saldoPendiente: 760000,
    numeroCuotas: 24,
    valorCuota: 40000,
    frecuencia: 'Diaria',
    estado: 'activo',
    fechaInicio: today,
    createdAt: nowIso()
  }
];

export const seedPayments: Payment[] = [
  {
    id: 'pago-1',
    creditoId: 'credito-1',
    clienteId: 'cliente-1',
    usuarioEmail: 'admin@cobroapp.com',
    valorPagado: 50000,
    metodoPago: 'Efectivo',
    fechaPago: today,
    observacion: 'Pago inicial de prueba',
    estado: 'activo',
    createdAt: nowIso()
  },
  {
    id: 'pago-2',
    creditoId: 'credito-3',
    clienteId: 'cliente-3',
    usuarioEmail: 'admin@cobroapp.com',
    valorPagado: 40000,
    metodoPago: 'Nequi',
    fechaPago: today,
    observacion: 'Pago recibido por Nequi',
    estado: 'activo',
    createdAt: nowIso()
  }
];

export const seedExpenses: Expense[] = [
  {
    id: 'gasto-1',
    descripcion: 'Transporte del cobrador',
    valor: 12000,
    fecha: todayKey(),
    estado: 'activo',
    createdAt: nowIso()
  }
];
