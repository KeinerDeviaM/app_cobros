import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BottomNav } from '../components/BottomNav';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { Screen } from '../components/Screen';
import { TopBar } from '../components/TopBar';
import { useApp } from '../state/AppContext';
import { colors } from '../theme/colors';
import { todayKey } from '../utils/date';
import { formatMoney } from '../utils/money';

type ReportTab = 'general' | 'cobradores' | 'rutas' | 'visitas';

export function ReportsScreen() {
  const {
    stats,
    clients,
    credits,
    payments,
    expenses,
    users,
    routes,
    visits,
    navigate
  } = useApp();

  const [tab, setTab] = useState<ReportTab>('general');

  const today = todayKey();

  const activePayments = useMemo(() => {
    return activePayments.filter((payment) => payment.estado !== 'anulado');
  }, [payments]);

  const collectors = useMemo(() => {
    return users.filter((user) => user.role === 'cobrador');
  }, [users]);

  const todayPayments = useMemo(() => {
    return activePayments.filter((payment) => payment.fechaPago === today);
  }, [payments, today]);

  const todayExpenses = useMemo(() => {
    return expenses.filter((expense) => expense.fecha === today);
  }, [expenses, today]);

  const todayVisits = useMemo(() => {
    return visits.filter((visit) => visit.fecha === today);
  }, [today, visits]);

  const collectorReports = useMemo(() => {
    return collectors.map((collector) => {
      const collectorClients = clients.filter((client) => client.assignedToUid === collector.uid);
      const collectorCredits = credits.filter((credit) => credit.assignedToUid === collector.uid);
      const collectorPayments = activePayments.filter((payment) => payment.assignedToUid === collector.uid);
      const collectorPaymentsToday = todayactivePayments.filter((payment) => payment.assignedToUid === collector.uid);
      const collectorVisitsToday = todayVisits.filter((visit) => visit.assignedToUid === collector.uid);

      const pending = collectorCredits.reduce((total, credit) => total + credit.saldoPendiente, 0);
      const recovered = collectorPayments.reduce((total, payment) => total + payment.valorPagado, 0);
      const collectedToday = collectorPaymentsToday.reduce((total, payment) => total + payment.valorPagado, 0);

      return {
        collector,
        clients: collectorClients.length,
        activeCredits: collectorCredits.filter((credit) => credit.estado === 'activo').length,
        pending,
        recovered,
        collectedToday,
        visitsToday: collectorVisitsToday.length,
        visitsDone: collectorVisitsToday.filter((visit) => visit.estado !== 'pendiente').length,
        visitsPaid: collectorVisitsToday.filter((visit) => visit.estado === 'pago').length,
        promises: collectorVisitsToday.filter((visit) => visit.estado === 'promesa').length
      };
    });
  }, [clients, collectors, credits, activePayments, todayPayments, todayVisits]);

  const routeReports = useMemo(() => {
    return routes.map((route) => {
      const routeClients = clients.filter((client) => client.routeId === route.id);
      const routeClientIds = new Set(routeClients.map((client) => client.id));
      const routeCredits = credits.filter((credit) => routeClientIds.has(credit.clienteId));
      const routePayments = activePayments.filter((payment) => routeClientIds.has(payment.clienteId));
      const routePaymentsToday = todayactivePayments.filter((payment) => routeClientIds.has(payment.clienteId));
      const routeVisitsToday = todayVisits.filter((visit) => visit.routeId === route.id);

      const pending = routeCredits.reduce((total, credit) => total + credit.saldoPendiente, 0);
      const recovered = routePayments.reduce((total, payment) => total + payment.valorPagado, 0);
      const collectedToday = routePaymentsToday.reduce((total, payment) => total + payment.valorPagado, 0);
      const overdue = routeClients.filter((client) => client.estado === 'en-mora').length;

      return {
        route,
        clients: routeClients.length,
        activeCredits: routeCredits.filter((credit) => credit.estado === 'activo').length,
        overdue,
        pending,
        recovered,
        collectedToday,
        visitsToday: routeVisitsToday.length,
        visitsDone: routeVisitsToday.filter((visit) => visit.estado !== 'pendiente').length,
        promises: routeVisitsToday.filter((visit) => visit.estado === 'promesa').length
      };
    });
  }, [clients, credits, activePayments, routes, todayPayments, todayVisits]);

  const visitSummary = useMemo(() => {
    return {
      total: todayVisits.length,
      pending: todayVisits.filter((visit) => visit.estado === 'pendiente').length,
      visited: todayVisits.filter((visit) => visit.estado === 'visitado').length,
      paid: todayVisits.filter((visit) => visit.estado === 'pago').length,
      noPaid: todayVisits.filter((visit) => visit.estado === 'no-pago').length,
      notFound: todayVisits.filter((visit) => visit.estado === 'no-estaba').length,
      promises: todayVisits.filter((visit) => visit.estado === 'promesa').length
    };
  }, [todayVisits]);

  const todayExpenseTotal = todayExpenses.reduce((total, expense) => total + expense.valor, 0);
  const todayPaymentTotal = todayPayments.reduce((total, payment) => total + payment.valorPagado, 0);

  return (
    <View style={styles.root}>
      <TopBar title="Reportes" showBack onBack={() => navigate('dashboard')} />
      <Screen>
        <Text style={styles.title}>Centro de reportes</Text>
        <Text style={styles.subtitle}>
          Revisa el estado de cartera, recaudos, rutas, cobradores y visitas.
        </Text>

        <View style={styles.tabs}>
          <ReportTabButton label="General" value="general" current={tab} onPress={setTab} />
          <ReportTabButton label="Cobradores" value="cobradores" current={tab} onPress={setTab} />
          <ReportTabButton label="Rutas" value="rutas" current={tab} onPress={setTab} />
          <ReportTabButton label="Visitas" value="visitas" current={tab} onPress={setTab} />
        </View>

        {tab === 'general' ? (
          <>
            <View style={styles.grid}>
              <ReportMetric title="Total clientes" value={String(stats.totalClients)} />
              <ReportMetric title="Clientes en mora" value={String(stats.overdueClients)} danger />
            </View>

            <View style={styles.grid}>
              <ReportMetric title="CrÃ©ditos activos" value={String(stats.activeCredits)} />
              <ReportMetric title="Pendiente total" value={formatMoney(stats.pendingTotal)} danger />
            </View>

            <View style={styles.grid}>
              <ReportMetric title="Total prestado" value={formatMoney(stats.lentTotal)} />
              <ReportMetric title="Total recuperado" value={formatMoney(stats.recoveredTotal)} />
            </View>

            <Card style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Caja de hoy</Text>

              <View style={styles.row}>
                <Text style={styles.rowLabel}>Recaudado hoy</Text>
                <Text style={styles.rowValue}>{formatMoney(todayPaymentTotal)}</Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.rowLabel}>Gastos hoy</Text>
                <Text style={styles.rowValueDanger}>{formatMoney(todayExpenseTotal)}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.row}>
                <Text style={styles.totalLabel}>Caja esperada</Text>
                <Text style={styles.totalValue}>{formatMoney(todayPaymentTotal - todayExpenseTotal)}</Text>
              </View>
            </Card>

            <Card style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Resumen rÃ¡pido</Text>
              <Text style={styles.paragraph}>
                La cartera pendiente actual es de {formatMoney(stats.pendingTotal)}. Hoy se han recaudado {formatMoney(todayPaymentTotal)} y se han registrado gastos por {formatMoney(todayExpenseTotal)}.
              </Text>
            </Card>
          </>
        ) : null}

        {tab === 'cobradores' ? (
          <>
            {collectorReports.length === 0 ? (
              <EmptyState title="Sin cobradores" message="TodavÃ­a no hay usuarios con rol cobrador." />
            ) : (
              collectorReports.map((report) => (
                <Card key={report.collector.id} style={styles.sectionCard}>
                  <Text style={styles.cardTitle}>{report.collector.email}</Text>
                  <Text style={styles.cardSubtitle}>
                    Estado: {report.collector.activo ? 'Activo' : 'Inactivo'}
                  </Text>

                  <View style={styles.miniGrid}>
                    <MiniMetric title="Clientes" value={String(report.clients)} />
                    <MiniMetric title="CrÃ©ditos" value={String(report.activeCredits)} />
                    <MiniMetric title="Cobrado hoy" value={formatMoney(report.collectedToday)} />
                    <MiniMetric title="Pendiente" value={formatMoney(report.pending)} danger />
                  </View>

                  <View style={styles.row}>
                    <Text style={styles.rowLabel}>Recuperado total</Text>
                    <Text style={styles.rowValue}>{formatMoney(report.recovered)}</Text>
                  </View>

                  <View style={styles.row}>
                    <Text style={styles.rowLabel}>Visitas hoy</Text>
                    <Text style={styles.rowValue}>{report.visitsDone}/{report.visitsToday}</Text>
                  </View>

                  <View style={styles.row}>
                    <Text style={styles.rowLabel}>Pagaron en visita</Text>
                    <Text style={styles.rowValue}>{report.visitsPaid}</Text>
                  </View>

                  <View style={styles.row}>
                    <Text style={styles.rowLabel}>Promesas</Text>
                    <Text style={styles.rowValue}>{report.promises}</Text>
                  </View>
                </Card>
              ))
            )}
          </>
        ) : null}

        {tab === 'rutas' ? (
          <>
            {routeReports.length === 0 ? (
              <EmptyState title="Sin rutas" message="TodavÃ­a no hay rutas creadas." />
            ) : (
              routeReports.map((report) => (
                <Card key={report.route.id} style={styles.sectionCard}>
                  <Text style={styles.cardTitle}>{report.route.nombre}</Text>
                  <Text style={styles.cardSubtitle}>
                    {report.route.zona || 'Sin zona registrada'}
                  </Text>

                  {report.route.descripcion ? (
                    <Text style={styles.paragraph}>{report.route.descripcion}</Text>
                  ) : null}

                  <View style={styles.miniGrid}>
                    <MiniMetric title="Clientes" value={String(report.clients)} />
                    <MiniMetric title="En mora" value={String(report.overdue)} danger />
                    <MiniMetric title="Cobrado hoy" value={formatMoney(report.collectedToday)} />
                    <MiniMetric title="Pendiente" value={formatMoney(report.pending)} danger />
                  </View>

                  <View style={styles.row}>
                    <Text style={styles.rowLabel}>CrÃ©ditos activos</Text>
                    <Text style={styles.rowValue}>{report.activeCredits}</Text>
                  </View>

                  <View style={styles.row}>
                    <Text style={styles.rowLabel}>Recuperado total</Text>
                    <Text style={styles.rowValue}>{formatMoney(report.recovered)}</Text>
                  </View>

                  <View style={styles.row}>
                    <Text style={styles.rowLabel}>Visitas gestionadas hoy</Text>
                    <Text style={styles.rowValue}>{report.visitsDone}/{report.visitsToday}</Text>
                  </View>

                  <View style={styles.row}>
                    <Text style={styles.rowLabel}>Promesas de pago</Text>
                    <Text style={styles.rowValue}>{report.promises}</Text>
                  </View>
                </Card>
              ))
            )}
          </>
        ) : null}

        {tab === 'visitas' ? (
          <>
            <View style={styles.grid}>
              <ReportMetric title="Visitas hoy" value={String(visitSummary.total)} />
              <ReportMetric title="Pendientes" value={String(visitSummary.pending)} danger />
            </View>

            <View style={styles.grid}>
              <ReportMetric title="Visitados" value={String(visitSummary.visited)} />
              <ReportMetric title="Pagaron" value={String(visitSummary.paid)} />
            </View>

            <View style={styles.grid}>
              <ReportMetric title="No pagaron" value={String(visitSummary.noPaid)} danger />
              <ReportMetric title="No estaban" value={String(visitSummary.notFound)} danger />
            </View>

            <View style={styles.grid}>
              <ReportMetric title="Promesas" value={String(visitSummary.promises)} />
              <ReportMetric title="Avance" value={visitSummary.total === 0 ? '0%' : `${Math.round(((visitSummary.total - visitSummary.pending) / visitSummary.total) * 100)}%`} />
            </View>

            <Card style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Lectura del dÃ­a</Text>
              <Text style={styles.paragraph}>
                Hoy se han gestionado {visitSummary.total - visitSummary.pending} de {visitSummary.total} visitas. Hay {visitSummary.promises} promesas de pago registradas y {visitSummary.pending} visitas pendientes.
              </Text>
            </Card>
          </>
        ) : null}
      </Screen>
      <BottomNav />
    </View>
  );
}

function ReportTabButton({
  label,
  value,
  current,
  onPress
}: {
  label: string;
  value: ReportTab;
  current: ReportTab;
  onPress: (value: ReportTab) => void;
}) {
  const selected = value === current;

  return (
    <Pressable
      style={[styles.tabButton, selected ? styles.tabButtonSelected : null]}
      onPress={() => onPress(value)}
    >
      <Text style={[styles.tabText, selected ? styles.tabTextSelected : null]}>
        {label}
      </Text>
    </Pressable>
  );
}

function ReportMetric({
  title,
  value,
  danger = false
}: {
  title: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <Card style={styles.metricCard}>
      <Text style={styles.metricTitle}>{title}</Text>
      <Text style={[styles.metricValue, danger ? styles.metricDanger : null]}>{value}</Text>
    </Card>
  );
}

function MiniMetric({
  title,
  value,
  danger = false
}: {
  title: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <View style={styles.miniMetric}>
      <Text style={styles.miniTitle}>{title}</Text>
      <Text style={[styles.miniValue, danger ? styles.metricDanger : null]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900'
  },
  subtitle: {
    color: colors.muted,
    marginTop: 5,
    marginBottom: 16,
    fontWeight: '700',
    lineHeight: 20
  },
  tabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16
  },
  tabButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF'
  },
  tabButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft
  },
  tabText: {
    color: colors.muted,
    fontWeight: '900',
    fontSize: 12
  },
  tabTextSelected: {
    color: colors.primary
  },
  grid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10
  },
  metricCard: {
    flex: 1
  },
  metricTitle: {
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
  metricDanger: {
    color: colors.danger
  },
  sectionCard: {
    marginBottom: 12
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 10
  },
  cardTitle: {
    color: colors.text,
    fontWeight: '900',
    fontSize: 17
  },
  cardSubtitle: {
    color: colors.muted,
    fontWeight: '800',
    marginTop: 4,
    marginBottom: 8
  },
  paragraph: {
    color: colors.muted,
    fontWeight: '700',
    lineHeight: 21
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 9
  },
  rowLabel: {
    color: colors.muted,
    fontWeight: '700',
    flex: 1
  },
  rowValue: {
    color: colors.primary,
    fontWeight: '900'
  },
  rowValueDanger: {
    color: colors.danger,
    fontWeight: '900'
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginTop: 12,
    marginBottom: 4
  },
  totalLabel: {
    color: colors.text,
    fontWeight: '900',
    flex: 1
  },
  totalValue: {
    color: colors.primary,
    fontWeight: '900',
    fontSize: 16
  },
  miniGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
    marginBottom: 6
  },
  miniMetric: {
    width: '48%',
    backgroundColor: colors.background,
    borderRadius: 14,
    padding: 10
  },
  miniTitle: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '800'
  },
  miniValue: {
    color: colors.primary,
    fontWeight: '900',
    marginTop: 4
  }
});