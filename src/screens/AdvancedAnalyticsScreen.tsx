import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BottomNav } from '../components/BottomNav';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { Screen } from '../components/Screen';
import { StatusBadge } from '../components/StatusBadge';
import { TopBar } from '../components/TopBar';
import { useApp } from '../state/AppContext';
import { colors } from '../theme/colors';
import { todayKey } from '../utils/date';
import { formatMoney } from '../utils/money';

function percent(value: number, total: number) {
  if (!total || total <= 0) return 0;
  return Math.round((value / total) * 100);
}

function currentMonthKey() {
  return todayKey().slice(0, 7);
}

function currentDayKey() {
  return todayKey();
}

export function AdvancedAnalyticsScreen() {
  const {
    clients,
    credits,
    payments,
    expenses,
    users,
    routes,
    visits,
    cashClosings,
    navigate
  } = useApp();

  const today = currentDayKey();
  const month = currentMonthKey();

  const activePayments = useMemo(() => {
    return payments.filter((payment) => payment.estado !== 'anulado');
  }, [payments]);

  const validCredits = useMemo(() => {
    return credits.filter((credit) => credit.estado !== 'anulado');
  }, [credits]);

  const validExpenses = useMemo(() => {
    return expenses.filter((expense) => expense.estado !== 'anulado');
  }, [expenses]);

  const global = useMemo(() => {
    const totalPrestado = validCredits.reduce((total, credit) => total + credit.valorPrestado, 0);
    const totalAPagar = validCredits.reduce((total, credit) => total + credit.valorTotal, 0);
    const saldoPendiente = validCredits.reduce((total, credit) => total + credit.saldoPendiente, 0);
    const recuperado = activePayments.reduce((total, payment) => total + payment.valorPagado, 0);
    const carteraVencida = validCredits
      .filter((credit) => credit.estado === 'vencido')
      .reduce((total, credit) => total + credit.saldoPendiente, 0);

    const cobradoHoy = activePayments
      .filter((payment) => payment.fechaPago === today)
      .reduce((total, payment) => total + payment.valorPagado, 0);

    const gastosHoy = validExpenses
      .filter((expense) => expense.fecha === today)
      .reduce((total, expense) => total + expense.valor, 0);

    const cobradoMes = activePayments
      .filter((payment) => payment.fechaPago.startsWith(month))
      .reduce((total, payment) => total + payment.valorPagado, 0);

    const gastosMes = validExpenses
      .filter((expense) => expense.fecha.startsWith(month))
      .reduce((total, expense) => total + expense.valor, 0);

    return {
      totalPrestado,
      totalAPagar,
      saldoPendiente,
      recuperado,
      carteraVencida,
      tasaRecuperacion: percent(recuperado, totalAPagar),
      tasaMora: percent(carteraVencida, totalAPagar),
      cobradoHoy,
      gastosHoy,
      cajaHoy: cobradoHoy - gastosHoy,
      cobradoMes,
      gastosMes,
      cajaMes: cobradoMes - gastosMes,
      creditosActivos: validCredits.filter((credit) => credit.estado === 'activo').length,
      creditosPagados: validCredits.filter((credit) => credit.estado === 'pagado').length,
      creditosVencidos: validCredits.filter((credit) => credit.estado === 'vencido').length,
      clientesMora: clients.filter((client) => client.estado === 'en-mora').length
    };
  }, [activePayments, clients, month, today, validCredits, validExpenses]);

  const collectorReports = useMemo(() => {
    return users
      .filter((user) => user.role === 'cobrador')
      .map((collector) => {
        const collectorClients = clients.filter((client) => client.assignedToUid === collector.uid);
        const collectorCredits = validCredits.filter((credit) => credit.assignedToUid === collector.uid);
        const collectorPayments = activePayments.filter((payment) => payment.assignedToUid === collector.uid);
        const collectorVisits = visits.filter((visit) => visit.assignedToUid === collector.uid);

        const recovered = collectorPayments.reduce((total, payment) => total + payment.valorPagado, 0);
        const pending = collectorCredits.reduce((total, credit) => total + credit.saldoPendiente, 0);
        const debt = collectorCredits.reduce((total, credit) => total + credit.valorTotal, 0);
        const overdue = collectorCredits
          .filter((credit) => credit.estado === 'vencido')
          .reduce((total, credit) => total + credit.saldoPendiente, 0);

        const todayPayments = collectorPayments
          .filter((payment) => payment.fechaPago === today)
          .reduce((total, payment) => total + payment.valorPagado, 0);

        return {
          collector,
          clients: collectorClients.length,
          credits: collectorCredits.length,
          recovered,
          pending,
          overdue,
          todayPayments,
          recoveryRate: percent(recovered, debt),
          visits: collectorVisits.length,
          promises: collectorVisits.filter((visit) => visit.estado === 'promesa').length
        };
      })
      .sort((a, b) => b.recovered - a.recovered);
  }, [activePayments, clients, today, users, validCredits, visits]);

  const routeReports = useMemo(() => {
    return routes
      .map((route) => {
        const routeClients = clients.filter((client) => client.routeId === route.id);
        const clientIds = new Set(routeClients.map((client) => client.id));

        const routeCredits = validCredits.filter((credit) => clientIds.has(credit.clienteId));
        const routePayments = activePayments.filter((payment) => clientIds.has(payment.clienteId));
        const routeVisits = visits.filter((visit) => visit.routeId === route.id);

        const recovered = routePayments.reduce((total, payment) => total + payment.valorPagado, 0);
        const pending = routeCredits.reduce((total, credit) => total + credit.saldoPendiente, 0);
        const debt = routeCredits.reduce((total, credit) => total + credit.valorTotal, 0);
        const overdue = routeCredits
          .filter((credit) => credit.estado === 'vencido')
          .reduce((total, credit) => total + credit.saldoPendiente, 0);

        return {
          route,
          clients: routeClients.length,
          credits: routeCredits.length,
          recovered,
          pending,
          overdue,
          recoveryRate: percent(recovered, debt),
          visits: routeVisits.length,
          promises: routeVisits.filter((visit) => visit.estado === 'promesa').length
        };
      })
      .sort((a, b) => b.pending - a.pending);
  }, [activePayments, clients, routes, validCredits, visits]);

  const paymentMethods = useMemo(() => {
    const map = new Map<string, { method: string; count: number; total: number }>();

    activePayments.forEach((payment) => {
      const current = map.get(payment.metodoPago) ?? {
        method: payment.metodoPago,
        count: 0,
        total: 0
      };

      current.count += 1;
      current.total += payment.valorPagado;

      map.set(payment.metodoPago, current);
    });

    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [activePayments]);

  const visitSummary = useMemo(() => {
    const statuses = ['pendiente', 'visitado', 'pago', 'no-pago', 'no-estaba', 'promesa'];

    return statuses.map((status) => ({
      status,
      count: visits.filter((visit) => visit.estado === status).length
    }));
  }, [visits]);

  const cashSummary = useMemo(() => {
    const totalClosings = cashClosings.length;
    const totalExpected = cashClosings.reduce((total, closing) => total + closing.cajaEsperada, 0);
    const totalDelivered = cashClosings.reduce((total, closing) => total + closing.cajaEntregada, 0);
    const totalDifference = cashClosings.reduce((total, closing) => total + closing.diferencia, 0);
    const balanced = cashClosings.filter((closing) => closing.diferencia === 0).length;

    return {
      totalClosings,
      totalExpected,
      totalDelivered,
      totalDifference,
      balanced
    };
  }, [cashClosings]);

  const bestCollector = collectorReports[0];
  const riskiestRoute = routeReports[0];

  return (
    <View style={styles.root}>
      <TopBar title="Indicadores avanzados" showBack onBack={() => navigate('more')} />

      <Screen>
        <Card style={styles.heroCard}>
          <Text style={styles.heroTitle}>Panel avanzado</Text>
          <Text style={styles.heroText}>
            Analiza recuperacion, cartera, cobradores, rutas, visitas y caja.
          </Text>
        </Card>

        <View style={styles.grid}>
          <KpiCard title="Recuperacion" value={`${global.tasaRecuperacion}%`} />
          <KpiCard title="Mora" value={`${global.tasaMora}%`} danger={global.tasaMora > 0} />
        </View>

        <View style={styles.grid}>
          <KpiCard title="Recuperado" value={formatMoney(global.recuperado)} />
          <KpiCard title="Pendiente" value={formatMoney(global.saldoPendiente)} danger />
        </View>

        <View style={styles.grid}>
          <KpiCard title="Caja hoy" value={formatMoney(global.cajaHoy)} danger={global.cajaHoy < 0} />
          <KpiCard title="Caja mes" value={formatMoney(global.cajaMes)} danger={global.cajaMes < 0} />
        </View>

        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Resumen de cartera</Text>

          <InfoRow label="Total prestado" value={formatMoney(global.totalPrestado)} />
          <InfoRow label="Total a pagar" value={formatMoney(global.totalAPagar)} />
          <InfoRow label="Cartera vencida" value={formatMoney(global.carteraVencida)} danger />
          <InfoRow label="Creditos activos" value={String(global.creditosActivos)} />
          <InfoRow label="Creditos pagados" value={String(global.creditosPagados)} />
          <InfoRow label="Creditos vencidos" value={String(global.creditosVencidos)} danger />
          <InfoRow label="Clientes en mora" value={String(global.clientesMora)} danger />
        </Card>

        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Destacados</Text>

          {bestCollector ? (
            <>
              <Text style={styles.highlightTitle}>Mejor cobrador</Text>
              <Text style={styles.highlightText}>{bestCollector.collector.email}</Text>
              <Text style={styles.highlightMeta}>
                Recuperado: {formatMoney(bestCollector.recovered)} | Hoy: {formatMoney(bestCollector.todayPayments)}
              </Text>
            </>
          ) : (
            <Text style={styles.emptyText}>No hay cobradores registrados.</Text>
          )}

          <View style={styles.divider} />

          {riskiestRoute ? (
            <>
              <Text style={styles.highlightTitle}>Ruta con mas cartera pendiente</Text>
              <Text style={styles.highlightText}>{riskiestRoute.route.nombre}</Text>
              <Text style={styles.highlightMeta}>
                Pendiente: {formatMoney(riskiestRoute.pending)} | Mora: {formatMoney(riskiestRoute.overdue)}
              </Text>
            </>
          ) : (
            <Text style={styles.emptyText}>No hay rutas registradas.</Text>
          )}
        </Card>

        <Text style={styles.blockTitle}>Ranking de cobradores</Text>

        {collectorReports.length === 0 ? (
          <EmptyState title="Sin cobradores" message="No hay informacion de cobradores para analizar." />
        ) : (
          collectorReports.map((report, index) => (
            <Card key={report.collector.id} style={styles.listCard}>
              <View style={styles.cardHeader}>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle}>#{index + 1} {report.collector.email}</Text>
                  <Text style={styles.cardMeta}>
                    Clientes: {report.clients} | Creditos: {report.credits} | Visitas: {report.visits}
                  </Text>
                </View>

                <StatusBadge type={report.collector.activo ? 'success' : 'danger'} label={report.collector.activo ? 'Activo' : 'Inactivo'} />
              </View>

              <InfoRow label="Recuperado" value={formatMoney(report.recovered)} />
              <InfoRow label="Pendiente" value={formatMoney(report.pending)} danger />
              <InfoRow label="Vencido" value={formatMoney(report.overdue)} danger />
              <InfoRow label="Tasa recuperacion" value={`${report.recoveryRate}%`} />
              <InfoRow label="Promesas" value={String(report.promises)} />
            </Card>
          ))
        )}

        <Text style={styles.blockTitle}>Ranking de rutas</Text>

        {routeReports.length === 0 ? (
          <EmptyState title="Sin rutas" message="No hay informacion de rutas para analizar." />
        ) : (
          routeReports.map((report, index) => (
            <Card key={report.route.id} style={styles.listCard}>
              <Text style={styles.cardTitle}>#{index + 1} {report.route.nombre}</Text>
              <Text style={styles.cardMeta}>{report.route.zona || 'Sin zona'}</Text>

              <InfoRow label="Clientes" value={String(report.clients)} />
              <InfoRow label="Creditos" value={String(report.credits)} />
              <InfoRow label="Recuperado" value={formatMoney(report.recovered)} />
              <InfoRow label="Pendiente" value={formatMoney(report.pending)} danger />
              <InfoRow label="Vencido" value={formatMoney(report.overdue)} danger />
              <InfoRow label="Tasa recuperacion" value={`${report.recoveryRate}%`} />
              <InfoRow label="Promesas" value={String(report.promises)} />
            </Card>
          ))
        )}

        <Text style={styles.blockTitle}>Pagos por metodo</Text>

        {paymentMethods.length === 0 ? (
          <EmptyState title="Sin pagos" message="No hay pagos activos para analizar." />
        ) : (
          paymentMethods.map((method) => (
            <Card key={method.method} style={styles.listCard}>
              <Text style={styles.cardTitle}>{method.method}</Text>
              <InfoRow label="Cantidad de pagos" value={String(method.count)} />
              <InfoRow label="Total recaudado" value={formatMoney(method.total)} />
            </Card>
          ))
        )}

        <Text style={styles.blockTitle}>Visitas por estado</Text>

        <Card style={styles.sectionCard}>
          {visitSummary.map((item) => (
            <InfoRow key={item.status} label={item.status} value={String(item.count)} />
          ))}
        </Card>

        <Text style={styles.blockTitle}>Caja y cierres</Text>

        <Card style={styles.sectionCard}>
          <InfoRow label="Cierres registrados" value={String(cashSummary.totalClosings)} />
          <InfoRow label="Caja esperada acumulada" value={formatMoney(cashSummary.totalExpected)} />
          <InfoRow label="Caja entregada acumulada" value={formatMoney(cashSummary.totalDelivered)} />
          <InfoRow label="Diferencia acumulada" value={formatMoney(cashSummary.totalDifference)} danger={cashSummary.totalDifference !== 0} />
          <InfoRow label="Cierres cuadrados" value={String(cashSummary.balanced)} />
        </Card>
      </Screen>

      <BottomNav />
    </View>
  );
}

function KpiCard({
  title,
  value,
  danger = false
}: {
  title: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <Card style={styles.kpiCard}>
      <Text style={styles.kpiTitle}>{title}</Text>
      <Text style={[styles.kpiValue, danger ? styles.danger : null]}>{value}</Text>
    </Card>
  );
}

function InfoRow({
  label,
  value,
  danger = false
}: {
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, danger ? styles.danger : null]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background
  },
  heroCard: {
    backgroundColor: colors.primary,
    marginBottom: 12
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '900'
  },
  heroText: {
    color: '#FFFFFF',
    opacity: 0.86,
    marginTop: 6,
    lineHeight: 20,
    fontWeight: '700'
  },
  grid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10
  },
  kpiCard: {
    flex: 1
  },
  kpiTitle: {
    color: colors.muted,
    fontWeight: '800',
    fontSize: 12
  },
  kpiValue: {
    color: colors.primary,
    fontWeight: '900',
    fontSize: 18,
    marginTop: 6
  },
  danger: {
    color: colors.danger
  },
  sectionCard: {
    marginBottom: 12
  },
  sectionTitle: {
    color: colors.text,
    fontWeight: '900',
    fontSize: 17,
    marginBottom: 10
  },
  blockTitle: {
    color: colors.text,
    fontWeight: '900',
    fontSize: 18,
    marginTop: 14,
    marginBottom: 10
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 8
  },
  infoLabel: {
    color: colors.muted,
    fontWeight: '700',
    flex: 1
  },
  infoValue: {
    color: colors.primary,
    fontWeight: '900',
    textAlign: 'right',
    flex: 1
  },
  highlightTitle: {
    color: colors.muted,
    fontWeight: '800',
    marginTop: 4
  },
  highlightText: {
    color: colors.primary,
    fontWeight: '900',
    fontSize: 16,
    marginTop: 4
  },
  highlightMeta: {
    color: colors.muted,
    fontWeight: '700',
    marginTop: 4,
    lineHeight: 20
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 14
  },
  emptyText: {
    color: colors.muted,
    fontWeight: '700',
    lineHeight: 20
  },
  listCard: {
    marginBottom: 10
  },
  cardHeader: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start'
  },
  cardInfo: {
    flex: 1
  },
  cardTitle: {
    color: colors.text,
    fontWeight: '900',
    fontSize: 15
  },
  cardMeta: {
    color: colors.muted,
    fontWeight: '700',
    lineHeight: 20,
    marginTop: 4
  }
});