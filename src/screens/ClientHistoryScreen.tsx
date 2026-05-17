import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BottomNav } from '../components/BottomNav';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { Screen } from '../components/Screen';
import { StatusBadge } from '../components/StatusBadge';
import { TopBar } from '../components/TopBar';
import { useApp } from '../state/AppContext';
import { colors } from '../theme/colors';
import { formatMoney } from '../utils/money';

type TimelineType = 'cliente' | 'credito' | 'pago' | 'visita' | 'promesa' | 'auditoria';

type TimelineItem = {
  id: string;
  type: TimelineType;
  title: string;
  subtitle: string;
  date: string;
  amount?: number;
  status?: string;
};

function getBadgeType(type: TimelineType, status?: string) {
  if (status === 'anulado' || status === 'vencido' || status === 'incumplida' || status === 'cancelada') {
    return 'danger';
  }

  if (status === 'pagado' || status === 'activo' || status === 'cumplida' || status === 'pago') {
    return 'success';
  }

  if (type === 'promesa' || type === 'visita') return 'warning';
  if (type === 'auditoria') return 'warning';

  return 'success';
}

function getIcon(type: TimelineType) {
  if (type === 'cliente') return '👤';
  if (type === 'credito') return '💳';
  if (type === 'pago') return '💰';
  if (type === 'visita') return '🛵';
  if (type === 'promesa') return '🤝';
  return '🧾';
}

function cleanDate(value?: string) {
  if (!value) return 'Sin fecha';
  return value.length > 10 ? value.slice(0, 10) : value;
}

export function ClientHistoryScreen() {
  const {
    selectedClient,
    credits,
    payments,
    visits,
    auditLogs,
    navigate
  } = useApp();

  const clientCredits = useMemo(() => {
    if (!selectedClient) return [];
    return credits.filter((credit) => credit.clienteId === selectedClient.id);
  }, [credits, selectedClient]);

  const clientPayments = useMemo(() => {
    if (!selectedClient) return [];
    return payments.filter((payment) => payment.clienteId === selectedClient.id);
  }, [payments, selectedClient]);

  const clientVisits = useMemo(() => {
    if (!selectedClient) return [];
    return visits.filter((visit) => visit.clienteId === selectedClient.id);
  }, [selectedClient, visits]);

  const clientAudit = useMemo(() => {
    if (!selectedClient) return [];
    return auditLogs.filter((log) => log.clienteId === selectedClient.id);
  }, [auditLogs, selectedClient]);

  const totals = useMemo(() => {
    const validCredits = clientCredits.filter((credit) => credit.estado !== 'anulado');
    const activePayments = clientPayments.filter((payment) => payment.estado !== 'anulado');

    return {
      credits: validCredits.length,
      totalLent: validCredits.reduce((total, credit) => total + credit.valorPrestado, 0),
      totalDebt: validCredits.reduce((total, credit) => total + credit.valorTotal, 0),
      pending: validCredits.reduce((total, credit) => total + credit.saldoPendiente, 0),
      paid: activePayments.reduce((total, payment) => total + payment.valorPagado, 0),
      visits: clientVisits.length,
      promises: clientVisits.filter((visit) => visit.estado === 'promesa').length
    };
  }, [clientCredits, clientPayments, clientVisits]);

  const timeline = useMemo(() => {
    if (!selectedClient) return [];

    const items: TimelineItem[] = [];

    items.push({
      id: `client-${selectedClient.id}`,
      type: 'cliente',
      title: 'Cliente creado',
      subtitle: `${selectedClient.nombre} fue registrado en la app.`,
      date: selectedClient.createdAt,
      status: selectedClient.estado
    });

    clientCredits.forEach((credit) => {
      items.push({
        id: `credit-${credit.id}`,
        type: 'credito',
        title: credit.estado === 'anulado' ? 'Crédito anulado' : 'Crédito creado',
        subtitle: `Total: ${formatMoney(credit.valorTotal)} · Saldo: ${formatMoney(credit.saldoPendiente)} · ${credit.frecuencia}`,
        date: credit.createdAt,
        amount: credit.valorTotal,
        status: credit.estado
      });

      if (credit.updatedAt) {
        items.push({
          id: `credit-update-${credit.id}`,
          type: 'credito',
          title: 'Crédito actualizado',
          subtitle: `Actualizado por ${credit.updatedBy || 'usuario no registrado'}. Estado: ${credit.estado}`,
          date: credit.updatedAt,
          amount: credit.saldoPendiente,
          status: credit.estado
        });
      }
    });

    clientPayments.forEach((payment) => {
      items.push({
        id: `payment-${payment.id}`,
        type: 'pago',
        title: payment.estado === 'anulado' ? 'Pago anulado' : 'Pago registrado',
        subtitle: `${payment.metodoPago} · Registrado por ${payment.usuarioEmail}${payment.observacion ? ` · ${payment.observacion}` : ''}`,
        date: payment.createdAt,
        amount: payment.valorPagado,
        status: payment.estado
      });

      if (payment.estado === 'anulado') {
        items.push({
          id: `payment-cancel-${payment.id}`,
          type: 'auditoria',
          title: 'Anulación de pago',
          subtitle: `Anulado por ${payment.anuladoPor || 'usuario no registrado'} · Motivo: ${payment.motivoAnulacion || 'Sin motivo'}`,
          date: payment.anuladoEn || payment.updatedAt || payment.createdAt,
          amount: payment.valorPagado,
          status: 'anulado'
        });
      }
    });

    clientVisits.forEach((visit) => {
      items.push({
        id: `visit-${visit.id}`,
        type: visit.estado === 'promesa' ? 'promesa' : 'visita',
        title: visit.estado === 'promesa' ? 'Promesa de pago' : 'Visita registrada',
        subtitle:
          visit.estado === 'promesa'
            ? `Promete pagar ${formatMoney(visit.promesaValor || 0)} el ${visit.promesaFecha || 'sin fecha'} · Estado: ${visit.promesaEstado || 'pendiente'}`
            : `Estado: ${visit.estado}${visit.observacion ? ` · ${visit.observacion}` : ''}`,
        date: visit.updatedAt || visit.createdAt,
        amount: visit.estado === 'promesa' ? visit.promesaValor || 0 : undefined,
        status: visit.estado === 'promesa' ? visit.promesaEstado || 'pendiente' : visit.estado
      });
    });

    clientAudit.forEach((log) => {
      items.push({
        id: `audit-${log.id}`,
        type: 'auditoria',
        title: log.tipo || 'Auditoría',
        subtitle: `${log.descripcion || 'Movimiento registrado'} · Usuario: ${log.usuarioEmail || 'No registrado'}`,
        date: log.createdAt,
        amount: log.valor,
        status: log.tipo?.toLowerCase().includes('anular') ? 'anulado' : 'activo'
      });
    });

    return items.sort((a, b) => {
      const aDate = a.date || '';
      const bDate = b.date || '';
      return bDate.localeCompare(aDate);
    });
  }, [clientAudit, clientCredits, clientPayments, clientVisits, selectedClient]);

  if (!selectedClient) {
    return (
      <View style={styles.root}>
        <TopBar title="Historial" showBack onBack={() => navigate('clients')} />
        <Screen>
          <EmptyState title="Cliente no encontrado" message="Vuelve a clientes y selecciona uno." />
          <Button title="Volver a clientes" onPress={() => navigate('clients')} />
        </Screen>
        <BottomNav />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <TopBar title="Historial del cliente" showBack onBack={() => navigate('clientDetail')} />

      <Screen>
        <Card style={styles.headerCard}>
          <Text style={styles.clientName}>{selectedClient.nombre}</Text>
          <Text style={styles.clientMeta}>Teléfono: {selectedClient.telefono}</Text>
          <Text style={styles.clientMeta}>Dirección: {selectedClient.direccion}</Text>
          <Text style={styles.clientMeta}>Barrio: {selectedClient.barrio || 'Sin barrio'}</Text>
          <Text style={styles.clientMeta}>Ruta: {selectedClient.routeName || 'Sin ruta'}</Text>
          <Text style={styles.clientMeta}>Cobrador: {selectedClient.assignedToEmail || 'Sin cobrador'}</Text>
        </Card>

        <View style={styles.grid}>
          <Card style={styles.metricCard}>
            <Text style={styles.metricLabel}>Créditos</Text>
            <Text style={styles.metricValue}>{totals.credits}</Text>
          </Card>

          <Card style={styles.metricCard}>
            <Text style={styles.metricLabel}>Pagado</Text>
            <Text style={styles.metricValue}>{formatMoney(totals.paid)}</Text>
          </Card>
        </View>

        <View style={styles.grid}>
          <Card style={styles.metricCard}>
            <Text style={styles.metricLabel}>Saldo</Text>
            <Text style={[styles.metricValue, totals.pending > 0 ? styles.danger : styles.success]}>
              {formatMoney(totals.pending)}
            </Text>
          </Card>

          <Card style={styles.metricCard}>
            <Text style={styles.metricLabel}>Promesas</Text>
            <Text style={styles.metricValue}>{totals.promises}</Text>
          </Card>
        </View>

        <Card style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Resumen financiero</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total prestado</Text>
            <Text style={styles.summaryValue}>{formatMoney(totals.totalLent)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total a pagar</Text>
            <Text style={styles.summaryValue}>{formatMoney(totals.totalDebt)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Visitas registradas</Text>
            <Text style={styles.summaryValue}>{totals.visits}</Text>
          </View>
        </Card>

        <Text style={styles.blockTitle}>Línea de tiempo</Text>

        {timeline.length === 0 ? (
          <EmptyState title="Sin historial" message="Este cliente todavía no tiene movimientos registrados." />
        ) : (
          timeline.map((item) => (
            <Card key={item.id} style={styles.timelineCard}>
              <View style={styles.timelineHeader}>
                <View style={styles.iconBox}>
                  <Text style={styles.icon}>{getIcon(item.type)}</Text>
                </View>

                <View style={styles.timelineInfo}>
                  <Text style={styles.timelineTitle}>{item.title}</Text>
                  <Text style={styles.timelineDate}>{cleanDate(item.date)}</Text>
                </View>

                {item.status ? (
                  <StatusBadge type={getBadgeType(item.type, item.status)} label={item.status} />
                ) : null}
              </View>

              <Text style={styles.timelineText}>{item.subtitle}</Text>

              {typeof item.amount === 'number' && item.amount > 0 ? (
                <Text style={styles.amount}>{formatMoney(item.amount)}</Text>
              ) : null}
            </Card>
          ))
        )}
      </Screen>

      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background
  },
  headerCard: {
    backgroundColor: colors.primarySoft,
    marginBottom: 12
  },
  clientName: {
    color: colors.primary,
    fontSize: 21,
    fontWeight: '900'
  },
  clientMeta: {
    color: colors.muted,
    fontWeight: '700',
    marginTop: 5
  },
  grid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10
  },
  metricCard: {
    flex: 1
  },
  metricLabel: {
    color: colors.muted,
    fontWeight: '800',
    fontSize: 12
  },
  metricValue: {
    color: colors.primary,
    fontWeight: '900',
    fontSize: 18,
    marginTop: 6
  },
  danger: {
    color: colors.danger
  },
  success: {
    color: colors.success
  },
  summaryCard: {
    marginBottom: 12
  },
  summaryTitle: {
    color: colors.text,
    fontWeight: '900',
    fontSize: 17,
    marginBottom: 10
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 8
  },
  summaryLabel: {
    color: colors.muted,
    fontWeight: '700',
    flex: 1
  },
  summaryValue: {
    color: colors.primary,
    fontWeight: '900'
  },
  blockTitle: {
    color: colors.text,
    fontWeight: '900',
    fontSize: 18,
    marginTop: 12,
    marginBottom: 10
  },
  timelineCard: {
    marginBottom: 10
  },
  timelineHeader: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start'
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center'
  },
  icon: {
    fontSize: 21
  },
  timelineInfo: {
    flex: 1
  },
  timelineTitle: {
    color: colors.text,
    fontWeight: '900',
    fontSize: 15
  },
  timelineDate: {
    color: colors.muted,
    fontWeight: '700',
    marginTop: 3
  },
  timelineText: {
    color: colors.muted,
    fontWeight: '700',
    lineHeight: 20,
    marginTop: 10
  },
  amount: {
    color: colors.primary,
    fontWeight: '900',
    fontSize: 16,
    marginTop: 8
  }
});