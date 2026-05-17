import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BottomNav } from '../components/BottomNav';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Screen } from '../components/Screen';
import { StatusBadge } from '../components/StatusBadge';
import { TopBar } from '../components/TopBar';
import { useApp } from '../state/AppContext';
import { colors } from '../theme/colors';
import { formatMoney } from '../utils/money';

type CheckStatus = 'ok' | 'warning' | 'danger';

type CheckItem = {
  id: string;
  title: string;
  description: string;
  status: CheckStatus;
};

function getBadgeType(status: CheckStatus) {
  if (status === 'ok') return 'success';
  if (status === 'warning') return 'warning';
  return 'danger';
}

function getBadgeLabel(status: CheckStatus) {
  if (status === 'ok') return 'Listo';
  if (status === 'warning') return 'Revisar';
  return 'Falta';
}

function percent(value: number, total: number) {
  if (!total || total <= 0) return 0;
  return Math.round((value / total) * 100);
}

export function PreApkChecklistScreen() {
  const {
    businessSettings,
    clients,
    credits,
    payments,
    expenses,
    users,
    routes,
    visits,
    cashClosings,
    auditLogs,
    isOnline,
    lastSyncAt,
    navigate
  } = useApp();

  const activeCredits = credits.filter((credit) => credit.estado !== 'anulado');
  const activePayments = payments.filter((payment) => payment.estado !== 'anulado');
  const activeExpenses = expenses.filter((expense) => expense.estado !== 'anulado');

  const totalDebt = activeCredits.reduce((total, credit) => total + credit.valorTotal, 0);
  const recovered = activePayments.reduce((total, payment) => total + payment.valorPagado, 0);
  const pending = activeCredits.reduce((total, credit) => total + credit.saldoPendiente, 0);
  const recoveryRate = percent(recovered, totalDebt);

  const checks = useMemo<CheckItem[]>(() => {
    const hasBusinessInfo =
      Boolean(businessSettings.businessName?.trim()) &&
      Boolean(businessSettings.appName?.trim()) &&
      Boolean(businessSettings.receiptMessage?.trim());

    const adminCount = users.filter((user) => user.role === 'admin' && user.activo).length;
    const collectorCount = users.filter((user) => user.role === 'cobrador' && user.activo).length;

    const clientsWithoutRoute = clients.filter((client) => !client.routeId).length;
    const clientsWithoutCollector = clients.filter((client) => !client.assignedToUid).length;

    const creditsWithoutCollector = activeCredits.filter((credit) => !credit.assignedToUid).length;
    const overdueCredits = activeCredits.filter((credit) => credit.estado === 'vencido').length;

    const promiseCount = visits.filter((visit) => visit.estado === 'promesa').length;
    const pendingVisits = visits.filter((visit) => visit.estado === 'pendiente').length;

    return [
      {
        id: 'business',
        title: 'Configuración del negocio',
        description: hasBusinessInfo
          ? 'El negocio tiene nombre, nombre de app y mensaje de recibo configurados.'
          : 'Completa nombre del negocio, nombre visible de la app y mensaje del recibo.',
        status: hasBusinessInfo ? 'ok' : 'danger'
      },
      {
        id: 'users',
        title: 'Usuarios y roles',
        description:
          adminCount > 0
            ? `Hay ${adminCount} administrador(es) activo(s) y ${collectorCount} cobrador(es) activo(s).`
            : 'Debe existir al menos un administrador activo.',
        status: adminCount > 0 ? 'ok' : 'danger'
      },
      {
        id: 'routes',
        title: 'Rutas',
        description:
          routes.length > 0
            ? `Hay ${routes.length} ruta(s) registrada(s).`
            : 'No hay rutas registradas. Puedes crear rutas para organizar mejor la cobranza.',
        status: routes.length > 0 ? 'ok' : 'warning'
      },
      {
        id: 'clients',
        title: 'Clientes',
        description:
          clients.length > 0
            ? `Hay ${clients.length} cliente(s). Sin ruta: ${clientsWithoutRoute}. Sin cobrador: ${clientsWithoutCollector}.`
            : 'No hay clientes registrados todavía.',
        status: clients.length === 0 ? 'warning' : clientsWithoutCollector > 0 ? 'warning' : 'ok'
      },
      {
        id: 'credits',
        title: 'Créditos',
        description:
          activeCredits.length > 0
            ? `Hay ${activeCredits.length} crédito(s) activo(s). Sin cobrador: ${creditsWithoutCollector}. Vencidos: ${overdueCredits}.`
            : 'No hay créditos activos registrados.',
        status: activeCredits.length === 0 ? 'warning' : creditsWithoutCollector > 0 ? 'warning' : 'ok'
      },
      {
        id: 'payments',
        title: 'Pagos y recibos',
        description:
          activePayments.length > 0
            ? `Hay ${activePayments.length} pago(s) activo(s). Recuperado: ${formatMoney(recovered)}.`
            : 'No hay pagos registrados. Prueba registrar un pago y generar recibo PDF.',
        status: activePayments.length > 0 ? 'ok' : 'warning'
      },
      {
        id: 'cash',
        title: 'Caja diaria',
        description:
          cashClosings.length > 0
            ? `Hay ${cashClosings.length} cierre(s) de caja registrados.`
            : 'No hay cierres de caja registrados. Prueba cerrar caja antes de entregar la APK.',
        status: cashClosings.length > 0 ? 'ok' : 'warning'
      },
      {
        id: 'expenses',
        title: 'Gastos',
        description:
          expenses.length > 0
            ? `Hay ${activeExpenses.length} gasto(s) activo(s) y ${expenses.length - activeExpenses.length} anulado(s).`
            : 'No hay gastos registrados. Esto está bien si todavía no manejas gastos.',
        status: 'ok'
      },
      {
        id: 'visits',
        title: 'Visitas',
        description:
          visits.length > 0
            ? `Hay ${visits.length} visita(s). Pendientes: ${pendingVisits}. Promesas: ${promiseCount}.`
            : 'No hay visitas registradas. Puedes generar visitas de hoy desde el módulo Visitas.',
        status: visits.length > 0 ? 'ok' : 'warning'
      },
      {
        id: 'audit',
        title: 'Auditoría',
        description:
          auditLogs.length > 0
            ? `Hay ${auditLogs.length} movimiento(s) de auditoría.`
            : 'No hay auditoría registrada todavía. Se llenará al anular pagos, gastos, créditos o cambiar usuarios.',
        status: auditLogs.length > 0 ? 'ok' : 'warning'
      },
      {
        id: 'offline',
        title: 'Modo offline básico',
        description:
          lastSyncAt
            ? `Última sincronización local: ${lastSyncAt.slice(0, 16).replace('T', ' ')}. Estado: ${isOnline ? 'online' : 'offline'}.`
            : 'Todavía no hay sincronización local guardada. Abre la app con internet y revisa Modo offline.',
        status: lastSyncAt ? 'ok' : 'warning'
      }
    ];
  }, [
    activeCredits,
    activeExpenses,
    activePayments,
    auditLogs.length,
    businessSettings,
    cashClosings.length,
    clients,
    expenses.length,
    isOnline,
    lastSyncAt,
    recovered,
    routes.length,
    users,
    visits
  ]);

  const readyCount = checks.filter((item) => item.status === 'ok').length;
  const warningCount = checks.filter((item) => item.status === 'warning').length;
  const dangerCount = checks.filter((item) => item.status === 'danger').length;
  const readyPercent = percent(readyCount, checks.length);

  return (
    <View style={styles.root}>
      <TopBar title="Checklist APK" showBack onBack={() => navigate('more')} />

      <Screen>
        <Card style={styles.heroCard}>
          <Text style={styles.heroTitle}>Revisión antes de APK</Text>
          <Text style={styles.heroText}>
            Usa esta pantalla para validar que la app esté lista antes de generar una versión final.
          </Text>
        </Card>

        <View style={styles.grid}>
          <Metric title="Listo" value={`${readyPercent}%`} />
          <Metric title="Alertas" value={String(warningCount + dangerCount)} danger={dangerCount > 0} />
        </View>

        <View style={styles.grid}>
          <Metric title="Recuperación" value={`${recoveryRate}%`} />
          <Metric title="Saldo pendiente" value={formatMoney(pending)} danger={pending > 0} />
        </View>

        <Card style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Resumen general</Text>

          <InfoRow label="Clientes" value={String(clients.length)} />
          <InfoRow label="Créditos activos" value={String(activeCredits.length)} />
          <InfoRow label="Pagos activos" value={String(activePayments.length)} />
          <InfoRow label="Total recuperado" value={formatMoney(recovered)} />
          <InfoRow label="Saldo pendiente" value={formatMoney(pending)} danger />
          <InfoRow label="Advertencias" value={String(warningCount)} />
          <InfoRow label="Críticos" value={String(dangerCount)} danger={dangerCount > 0} />
        </Card>

        <Text style={styles.blockTitle}>Checklist funcional</Text>

        {checks.map((item) => (
          <Card key={item.id} style={styles.checkCard}>
            <View style={styles.checkHeader}>
              <View style={styles.checkInfo}>
                <Text style={styles.checkTitle}>{item.title}</Text>
                <Text style={styles.checkDescription}>{item.description}</Text>
              </View>

              <StatusBadge type={getBadgeType(item.status)} label={getBadgeLabel(item.status)} />
            </View>
          </Card>
        ))}

        <Text style={styles.blockTitle}>Comandos finales recomendados</Text>

        <Card style={styles.commandCard}>
          <Command text="npm run typecheck" />
          <Command text="npx expo-doctor" />
          <Command text="git status" />
          <Command text="git add ." />
          <Command text={'git commit -m "Prepara APK final"'} />
          <Command text="git push" />
          <Command text="eas build -p android --profile preview" />
        </Card>

        <Card style={styles.warningCard}>
          <Text style={styles.warningTitle}>Antes de entregar la APK</Text>
          <Text style={styles.warningText}>Instala la APK en un celular real.</Text>
          <Text style={styles.warningText}>Prueba login admin y login cobrador.</Text>
          <Text style={styles.warningText}>Registra un cliente, crédito, pago y recibo PDF.</Text>
          <Text style={styles.warningText}>Prueba cierre de caja, respaldo y modo offline.</Text>
          <Text style={styles.warningText}>Aumenta versionCode antes de generar una nueva APK.</Text>
        </Card>

        <Button title="Ir a respaldo de datos" variant="secondary" onPress={() => navigate('dataBackup')} style={styles.button} />
        <Button title="Ir a indicadores avanzados" variant="secondary" onPress={() => navigate('advancedAnalytics')} style={styles.button} />
      </Screen>

      <BottomNav />
    </View>
  );
}

function Metric({
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
      <Text style={[styles.metricValue, danger ? styles.danger : null]}>{value}</Text>
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

function Command({ text }: { text: string }) {
  return (
    <View style={styles.commandLine}>
      <Text style={styles.commandText}>{text}</Text>
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
    opacity: 0.9,
    marginTop: 6,
    lineHeight: 20,
    fontWeight: '700'
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
    fontSize: 20,
    fontWeight: '900',
    marginTop: 6
  },
  danger: {
    color: colors.danger
  },
  summaryCard: {
    marginBottom: 12
  },
  summaryTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
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
  blockTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
    marginTop: 14,
    marginBottom: 10
  },
  checkCard: {
    marginBottom: 10
  },
  checkHeader: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start'
  },
  checkInfo: {
    flex: 1
  },
  checkTitle: {
    color: colors.text,
    fontWeight: '900',
    fontSize: 15
  },
  checkDescription: {
    color: colors.muted,
    fontWeight: '700',
    lineHeight: 20,
    marginTop: 6
  },
  commandCard: {
    backgroundColor: '#111827',
    marginBottom: 12
  },
  commandLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
    paddingVertical: 8
  },
  commandText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12
  },
  warningCard: {
    backgroundColor: '#FFF8E1',
    marginBottom: 14
  },
  warningTitle: {
    color: colors.text,
    fontWeight: '900',
    fontSize: 16,
    marginBottom: 8
  },
  warningText: {
    color: colors.muted,
    fontWeight: '700',
    lineHeight: 20,
    marginTop: 4
  },
  button: {
    marginBottom: 10
  }
});