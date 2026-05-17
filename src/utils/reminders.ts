import { Client, Credit, Payment, Visit } from '../types';
import { todayKey } from './date';
import { buildInstallments } from './installments';

export type ReminderPriority = 'alta' | 'media' | 'baja';

export type AppReminder = {
  id: string;
  title: string;
  description: string;
  type: 'cuota-vencida' | 'promesa-hoy' | 'promesa-vencida' | 'visita-pendiente' | 'cierre-caja';
  priority: ReminderPriority;
  screen: 'collectionsCalendar' | 'promises' | 'visits' | 'dailyCash';
  amount?: number;
  clientId?: string;
  creditId?: string;
  date?: string;
};

function findClient(clients: Client[], clientId: string) {
  return clients.find((client) => client.id === clientId);
}

export function buildAppReminders({
  clients,
  credits,
  payments,
  visits,
  hasCashClosingToday,
  today = todayKey()
}: {
  clients: Client[];
  credits: Credit[];
  payments: Payment[];
  visits: Visit[];
  hasCashClosingToday: boolean;
  today?: string;
}): AppReminder[] {
  const reminders: AppReminder[] = [];

  credits
    .filter((credit) => credit.estado !== 'anulado' && credit.estado !== 'pagado' && credit.saldoPendiente > 0)
    .forEach((credit) => {
      const client = findClient(clients, credit.clienteId);
      const installments = buildInstallments(credit, payments, today);

      installments
        .filter((installment) => installment.estado === 'vencida' && installment.pendiente > 0)
        .slice(0, 3)
        .forEach((installment) => {
          reminders.push({
            id: `overdue-${credit.id}-${installment.numero}`,
            title: `Cuota vencida: ${client?.nombre || 'Cliente'}`,
            description: `Cuota #${installment.numero} vencida desde ${installment.fecha}. Pendiente por cobrar.`,
            type: 'cuota-vencida',
            priority: 'alta',
            screen: 'collectionsCalendar',
            amount: installment.pendiente,
            clientId: credit.clienteId,
            creditId: credit.id,
            date: installment.fecha
          });
        });
    });

  visits
    .filter((visit) => visit.estado === 'promesa')
    .forEach((visit) => {
      const status = visit.promesaEstado || 'pendiente';

      if (status !== 'pendiente') return;

      if (visit.promesaFecha === today) {
        reminders.push({
          id: `promise-today-${visit.id}`,
          title: `Promesa para hoy: ${visit.clienteNombre}`,
          description: `El cliente prometió pagar hoy. Revisa y confirma si cumplió.`,
          type: 'promesa-hoy',
          priority: 'alta',
          screen: 'promises',
          amount: visit.promesaValor || 0,
          clientId: visit.clienteId,
          date: visit.promesaFecha
        });
      }

      if (visit.promesaFecha && visit.promesaFecha < today) {
        reminders.push({
          id: `promise-overdue-${visit.id}`,
          title: `Promesa vencida: ${visit.clienteNombre}`,
          description: `La promesa venció el ${visit.promesaFecha}. Debes marcarla como cumplida o incumplida.`,
          type: 'promesa-vencida',
          priority: 'alta',
          screen: 'promises',
          amount: visit.promesaValor || 0,
          clientId: visit.clienteId,
          date: visit.promesaFecha
        });
      }
    });

  visits
    .filter((visit) => visit.fecha === today && visit.estado === 'pendiente')
    .slice(0, 10)
    .forEach((visit) => {
      reminders.push({
        id: `visit-${visit.id}`,
        title: `Visita pendiente: ${visit.clienteNombre}`,
        description: `Tienes una visita pendiente para hoy.`,
        type: 'visita-pendiente',
        priority: 'media',
        screen: 'visits',
        clientId: visit.clienteId,
        date: visit.fecha
      });
    });

  if (!hasCashClosingToday) {
    reminders.push({
      id: `cash-closing-${today}`,
      title: 'Cierre de caja pendiente',
      description: 'Recuerda cerrar caja al finalizar la jornada.',
      type: 'cierre-caja',
      priority: 'media',
      screen: 'dailyCash',
      date: today
    });
  }

  return reminders.sort((a, b) => {
    const priorityOrder = { alta: 0, media: 1, baja: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}