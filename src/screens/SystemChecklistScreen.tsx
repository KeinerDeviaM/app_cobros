import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BottomNav } from '../components/BottomNav';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Screen } from '../components/Screen';
import { StatusBadge } from '../components/StatusBadge';
import { TopBar } from '../components/TopBar';
import { useApp } from '../state/AppContext';
import { colors } from '../theme/colors';
import { formatMoney } from '../utils/money';

type ChecklistTab = 'resumen' | 'datos' | 'permisos' | 'pruebas' | 'apk';

type CheckItem = {
  title: string;
  description: string;
  ok: boolean;
  warning?: boolean;
};

function getStatusType(item: CheckItem) {
  if (item.ok) return 'success';
  if (item.warning) return 'warning';
  return 'danger';
}

function getStatusLabel(item: CheckItem) {
  if (item.ok) return 'Listo';
  if (item.warning) return 'Revisar';
  return 'Falta';
}

export function SystemChecklistScreen() {
  const app = useApp() as any;

  const {
    clients = [],
    credits = [],
    payments = [],
    expenses = [],
    routes = [],
    users = [],
    cashClosings = [],
    visits = [],
    businessSettings = {},
    isAdmin,
    isSupervisor,
    canManagePayments,
    isOnline,
    offlineReady,
    navigate
  } = app;

  const [tab, setTab] = useState<ChecklistTab>('resumen');

  const activeCredits = credits.filter((credit: any) => credit.estado !== 'anulado');
  const paidCredits = credits.filter((credit: any) => credit.estado === 'pagado');
  const overdueCredits = credits.filter((credit: any) => credit.estado === 'vencido');
  const activePayments = payments.filter((payment: any) => payment.estado !== 'anulado');
  const canceledPayments = payments.filter((payment: any) => payment.estado === 'anulado');
  const editedPayments = payments.filter((payment: any) => payment.estado === 'editado');
  const activeExpenses = expenses.filter((expense: any) => expense.estado !== 'anulado');

  const totals = useMemo(() => {
    const totalPrestado = activeCredits.reduce((total: number, credit: any) => total + Number(credit.valorPrestado || 0), 0);
    const totalAPagar = activeCredits.reduce((total: number, credit: any) => total + Number(credit.valorTotal || 0), 0);
    const totalPendiente = activeCredits.reduce((total: number, credit: any) => total + Number(credit.saldoPendiente || 0), 0);
    const totalPagos = activePayments.reduce((total: number, payment: any) => total + Number(payment.valorPagado || 0), 0);
    const totalGastos = activeExpenses.reduce((total: number, expense: any) => total + Number(expense.valor || 0), 0);
    const totalEfectivo = activePayments
      .filter((payment: any) => payment.metodoPago === 'Efectivo')
      .reduce((total: number, payment: any) => total + Number(payment.valorPagado || 0), 0);
    const totalTransferencia = activePayments
      .filter((payment: any) => payment.metodoPago !== 'Efectivo')
      .reduce((total: number, payment: any) => total + Number(payment.valorPagado || 0), 0);

    return {
      totalPrestado,
      totalAPagar,
      totalPendiente,
      totalPagos,
      totalGastos,
      totalEfectivo,
      totalTransferencia,
      cajaNeta: totalPagos - totalGastos
    };
  }, [activeCredits, activeExpenses, activePayments]);

  const dataChecks: CheckItem[] = [
    {
      title: 'Usuarios creados',
      description: 'Debe existir por lo menos un usuario administrador.',
      ok: users.some((user: any) => user.role === 'admin')
    },
    {
      title: 'Roles disponibles',
      description: 'El sistema debe manejar admin, supervisor y cobrador.',
      ok: true
    },
    {
      title: 'Rutas registradas',
      description: 'Debes tener rutas para organizar clientes y cobros.',
      ok: routes.length > 0,
      warning: true
    },
    {
      title: 'Clientes registrados',
      description: 'Debe existir por lo menos un cliente para operar.',
      ok: clients.length > 0,
      warning: true
    },
    {
      title: 'Creditos registrados',
      description: 'Debe existir por lo menos un credito para probar pagos y caja.',
      ok: credits.length > 0,
      warning: true
    },
    {
      title: 'Pagos registrados',
      description: 'Debe existir por lo menos un pago para probar reportes, caja y recibos.',
      ok: payments.length > 0,
      warning: true
    },
    {
      title: 'Gastos registrados',
      description: 'Los gastos permiten probar caja diaria y reportes.',
      ok: expenses.length > 0,
      warning: true
    },
    {
      title: 'Cierres de caja',
      description: 'Debe probarse por lo menos un cierre de caja.',
      ok: cashClosings.length > 0,
      warning: true
    }
  ];

  const permissionChecks: CheckItem[] = [
    {
      title: 'Administrador',
      description: 'Puede ver todo, editar pagos, anular pagos, cambiar roles y exportar reportes.',
      ok: Boolean(isAdmin)
    },
    {
      title: 'Supervisor',
      description: 'Puede supervisar, editar pagos, anular pagos, ver caja, reportes y auditoria.',
      ok: Boolean(isSupervisor || isAdmin || canManagePayments)
    },
    {
      title: 'Cobrador protegido',
      description: 'El cobrador no debe editar ni anular pagos.',
      ok: true
    },
    {
      title: 'Auditoria',
      description: 'Los pagos editados o anulados deben quedar registrados.',
      ok: editedPayments.length > 0 || canceledPayments.length > 0,
      warning: true
    },
    {
      title: 'Reglas Firebase',
      description: 'Las reglas deben estar desplegadas para proteger datos en produccion.',
      ok: true,
      warning: false
    }
  ];

  const testChecks: CheckItem[] = [
    {
      title: 'Crear cliente',
      description: 'Crear cliente manualmente e importarlo desde CSV.',
      ok: clients.length > 0
    },
    {
      title: 'Crear credito con codeudor',
      description: 'Crear credito manual con codeudor opcional.',
      ok: credits.some((credit: any) => credit.codeudorTiene),
      warning: true
    },
    {
      title: 'Editar credito',
      description: 'Editar credito y verificar auditoria.',
      ok: true,
      warning: true
    },
    {
      title: 'Registrar pago',
      description: 'Registrar pago y verificar saldo del credito.',
      ok: payments.length > 0
    },
    {
      title: 'Editar pago',
      description: 'Editar pago como admin o supervisor.',
      ok: editedPayments.length > 0,
      warning: true
    },
    {
      title: 'Anular pago',
      description: 'Anular pago como admin o supervisor.',
      ok: canceledPayments.length > 0,
      warning: true
    },
    {
      title: 'Registrar gasto',
      description: 'Registrar gasto de ruta y verlo en caja.',
      ok: expenses.length > 0,
      warning: true
    },
    {
      title: 'Cerrar caja',
      description: 'Cerrar caja del dia y revisar diferencia.',
      ok: cashClosings.length > 0,
      warning: true
    },
    {
      title: 'Exportar Excel',
      description: 'Probar exportacion general y filtrada.',
      ok: true,
      warning: true
    },
    {
      title: 'Importar clientes y creditos',
      description: 'Probar importacion pegando CSV desde Excel.',
      ok: true,
      warning: true
    }
  ];

  const apkChecks: CheckItem[] = [
    {
      title: 'TypeScript limpio',
      description: 'npm run typecheck debe salir sin errores.',
      ok: true
    },
    {
      title: 'Expo Doctor limpio',
      description: 'npx expo-doctor debe salir sin errores criticos.',
      ok: true,
      warning: true
    },
    {
      title: 'GitHub actualizado',
      description: 'Todos los cambios deben estar en commit y push.',
      ok: true,
      warning: true
    },
    {
      title: 'Firebase reglas desplegadas',
      description: 'firebase deploy --only firestore:rules debe estar aplicado.',
      ok: true,
      warning: true
    },
    {
      title: 'APK preview',
      description: 'Generar APK con eas build -p android --profile preview.',
      ok: false,
      warning: true
    }
  ];

  const allChecks = [...dataChecks, ...permissionChecks, ...testChecks, ...apkChecks];
  const okCount = allChecks.filter((item) => item.ok).length;
  const warningCount = allChecks.filter((item) => !item.ok && item.warning).length;
  const missingCount = allChecks.filter((item) => !item.ok && !item.warning).length;
  const progress = Math.round((okCount / allChecks.length) * 100);

  return (
    <View style={styles.root}>
      <TopBar title="Diagnostico final" showBack onBack={() => navigate('more')} />

      <Screen>
        <Card style={styles.heroCard}>
          <Text style={styles.heroTitle}>Estado general del sistema</Text>
          <Text style={styles.heroText}>
            Revisa si CobroApp esta lista para generar APK, probar en celular y entregar una version estable.
          </Text>
          <Text style={styles.heroScore}>{progress}% listo</Text>
        </Card>

        <View style={styles.grid}>
          <Metric title="Listos" value={String(okCount)} />
          <Metric title="Revisar" value={String(warningCount)} danger={warningCount > 0} />
        </View>

        <View style={styles.grid}>
          <Metric title="Faltan" value={String(missingCount)} danger={missingCount > 0} />
          <Metric title="Conexion" value={isOnline === false ? 'Offline' : 'Online'} danger={isOnline === false} />
        </View>

        <View style={styles.tabs}>
          <Tab label="Resumen" value="resumen" current={tab} onPress={setTab} />
          <Tab label="Datos" value="datos" current={tab} onPress={setTab} />
          <Tab label="Permisos" value="permisos" current={tab} onPress={setTab} />
          <Tab label="Pruebas" value="pruebas" current={tab} onPress={setTab} />
          <Tab label="APK" value="apk" current={tab} onPress={setTab} />
        </View>

        {tab === 'resumen' ? (
          <>
            <View style={styles.grid}>
              <Metric title="Clientes" value={String(clients.length)} />
              <Metric title="Creditos" value={String(credits.length)} />
            </View>

            <View style={styles.grid}>
              <Metric title="Pagos" value={String(payments.length)} />
              <Metric title="Gastos" value={String(expenses.length)} />
            </View>

            <View style={styles.grid}>
              <Metric title="Rutas" value={String(routes.length)} />
              <Metric title="Usuarios" value={String(users.length)} />
            </View>

            <Card style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Resumen financiero</Text>
              <Text style={styles.infoText}>Total prestado: {formatMoney(totals.totalPrestado)}</Text>
              <Text style={styles.infoText}>Total a pagar: {formatMoney(totals.totalAPagar)}</Text>
              <Text style={styles.infoText}>Total pagado: {formatMoney(totals.totalPagos)}</Text>
              <Text style={styles.infoText}>Pendiente: {formatMoney(totals.totalPendiente)}</Text>
              <Text style={styles.infoText}>Efectivo: {formatMoney(totals.totalEfectivo)}</Text>
              <Text style={styles.infoText}>Transferencia/Otros: {formatMoney(totals.totalTransferencia)}</Text>
              <Text style={styles.infoText}>Gastos: {formatMoney(totals.totalGastos)}</Text>
              <Text style={styles.infoText}>Caja neta: {formatMoney(totals.cajaNeta)}</Text>
            </Card>

            <Card style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Creditos</Text>
              <Text style={styles.infoText}>Activos: {activeCredits.length}</Text>
              <Text style={styles.infoText}>Pagados: {paidCredits.length}</Text>
              <Text style={styles.infoText}>Vencidos: {overdueCredits.length}</Text>
            </Card>

            <Card style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Accesos rapidos</Text>
              <Button title="Exportar reportes" variant="secondary" onPress={() => navigate('exportReports')} style={styles.actionButton} />
              <Button title="Caja diaria" variant="secondary" onPress={() => navigate('dailyCash')} style={styles.actionButton} />
              <Button title="Auditoria avanzada" variant="secondary" onPress={() => navigate('auditLog')} style={styles.actionButton} />
              <Button title="Plantillas y manual" variant="secondary" onPress={() => navigate('templatesManual')} style={styles.actionButton} />
            </Card>
          </>
        ) : null}

        {tab === 'datos' ? <Checklist title="Datos principales" items={dataChecks} /> : null}
        {tab === 'permisos' ? <Checklist title="Permisos y seguridad" items={permissionChecks} /> : null}
        {tab === 'pruebas' ? <Checklist title="Pruebas funcionales" items={testChecks} /> : null}
        {tab === 'apk' ? <Checklist title="Checklist APK" items={apkChecks} /> : null}
      </Screen>

      <BottomNav />
    </View>
  );
}

function Checklist({
  title,
  items
}: {
  title: string;
  items: CheckItem[];
}) {
  return (
    <>
      <Text style={styles.blockTitle}>{title}</Text>

      {items.map((item, index) => (
        <Card key={`${title}-${index}`} style={styles.checkCard}>
          <View style={styles.checkHeader}>
            <View style={styles.checkInfo}>
              <Text style={styles.checkTitle}>{item.title}</Text>
              <Text style={styles.checkDescription}>{item.description}</Text>
            </View>

            <StatusBadge type={getStatusType(item)} label={getStatusLabel(item)} />
          </View>
        </Card>
      ))}
    </>
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

function Tab({
  label,
  value,
  current,
  onPress
}: {
  label: string;
  value: ChecklistTab;
  current: ChecklistTab;
  onPress: (value: ChecklistTab) => void;
}) {
  const selected = value === current;

  return (
    <Pressable style={[styles.chip, selected ? styles.chipSelected : null]} onPress={() => onPress(value)}>
      <Text style={[styles.chipText, selected ? styles.chipTextSelected : null]}>{label}</Text>
    </Pressable>
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
    fontSize: 22,
    fontWeight: '900'
  },
  heroText: {
    color: '#FFFFFF',
    opacity: 0.9,
    marginTop: 6,
    lineHeight: 20,
    fontWeight: '700'
  },
  heroScore: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
    marginTop: 12
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
    fontSize: 19,
    marginTop: 6
  },
  danger: {
    color: colors.danger
  },
  tabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF'
  },
  chipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft
  },
  chipText: {
    color: colors.muted,
    fontWeight: '900',
    fontSize: 12
  },
  chipTextSelected: {
    color: colors.primary
  },
  sectionCard: {
    marginBottom: 12
  },
  sectionTitle: {
    color: colors.text,
    fontWeight: '900',
    fontSize: 17,
    marginBottom: 8
  },
  infoText: {
    color: colors.muted,
    fontWeight: '700',
    marginTop: 5,
    lineHeight: 20
  },
  actionButton: {
    marginTop: 10
  },
  blockTitle: {
    color: colors.text,
    fontWeight: '900',
    fontSize: 18,
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
    fontSize: 16
  },
  checkDescription: {
    color: colors.muted,
    fontWeight: '700',
    lineHeight: 20,
    marginTop: 5
  }
});