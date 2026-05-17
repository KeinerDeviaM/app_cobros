import { Credit, Payment } from '../types';
import { todayKey } from './date';

export type InstallmentStatus = 'pagada' | 'parcial' | 'vencida' | 'pendiente';

export type Installment = {
  numero: number;
  fecha: string;
  valor: number;
  pagado: number;
  pendiente: number;
  estado: InstallmentStatus;
};

function toDate(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function addMonths(date: Date, months: number) {
  const copy = new Date(date);
  const originalDay = copy.getDate();

  copy.setMonth(copy.getMonth() + months);

  if (copy.getDate() < originalDay) {
    copy.setDate(0);
  }

  return copy;
}

function getInstallmentDate(credit: Credit, index: number) {
  const start = toDate(credit.fechaInicio || todayKey());

  if (credit.frecuencia === 'Diaria') return addDays(start, index);
  if (credit.frecuencia === 'Semanal') return addDays(start, index * 7);
  if (credit.frecuencia === 'Quincenal') return addDays(start, index * 15);
  if (credit.frecuencia === 'Mensual') return addMonths(start, index);

  return addDays(start, index);
}

export function buildInstallments(credit: Credit, payments: Payment[], today = todayKey()): Installment[] {
  const activePayments = payments.filter(
    (payment) => payment.creditoId === credit.id && payment.estado !== 'anulado'
  );

  let availablePaid = activePayments.reduce((total, payment) => total + payment.valorPagado, 0);

  const installments: Installment[] = [];

  for (let index = 0; index < credit.numeroCuotas; index += 1) {
    const numero = index + 1;
    const isLast = numero === credit.numeroCuotas;

    const normalValue = credit.valorCuota || Math.ceil(credit.valorTotal / credit.numeroCuotas);
    const previousValue = normalValue * (credit.numeroCuotas - 1);
    const lastValue = Math.max(credit.valorTotal - previousValue, 0);
    const valor = isLast ? lastValue || normalValue : normalValue;

    const paidForInstallment = Math.min(availablePaid, valor);
    availablePaid = Math.max(availablePaid - valor, 0);

    const pendiente = Math.max(valor - paidForInstallment, 0);
    const fecha = toDateKey(getInstallmentDate(credit, index));

    let estado: InstallmentStatus = 'pendiente';

    if (pendiente === 0) {
      estado = 'pagada';
    } else if (paidForInstallment > 0) {
      estado = 'parcial';
    } else if (fecha < today) {
      estado = 'vencida';
    }

    installments.push({
      numero,
      fecha,
      valor,
      pagado: paidForInstallment,
      pendiente,
      estado
    });
  }

  return installments;
}

export function getInstallmentsSummary(installments: Installment[]) {
  return {
    total: installments.length,
    pagadas: installments.filter((item) => item.estado === 'pagada').length,
    parciales: installments.filter((item) => item.estado === 'parcial').length,
    vencidas: installments.filter((item) => item.estado === 'vencida').length,
    pendientes: installments.filter((item) => item.estado === 'pendiente').length,
    valorPendiente: installments.reduce((total, item) => total + item.pendiente, 0)
  };
}