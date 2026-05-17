import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BottomNav } from '../components/BottomNav';
import { Card } from '../components/Card';
import { Screen } from '../components/Screen';
import { StatusBadge } from '../components/StatusBadge';
import { TopBar } from '../components/TopBar';
import { useApp } from '../state/AppContext';
import { colors } from '../theme/colors';

function formatSyncDate(value: string) {
  if (!value) return 'Sin sincronización guardada';
  return value.slice(0, 16).replace('T', ' ');
}

export function OfflineStatusScreen() {
  const {
    isOnline,
    offlineReady,
    lastSyncAt,
    clients,
    credits,
    payments,
    expenses,
    routes,
    visits,
    cashClosings,
    auditLogs,
    navigate
  } = useApp();

  return (
    <View style={styles.root}>
      <TopBar title="Modo offline" showBack onBack={() => navigate('more')} />

      <Screen>
        <Card style={isOnline ? styles.onlineCard : styles.offlineCard}>
          <View style={styles.headerRow}>
            <View style={styles.headerInfo}>
              <Text style={styles.heroTitle}>{isOnline ? 'Con conexión' : 'Sin conexión'}</Text>
              <Text style={styles.heroText}>
                {isOnline
                  ? 'La app está conectada y puede sincronizar con Firebase.'
                  : 'La app está usando los últimos datos guardados en el dispositivo.'}
              </Text>
            </View>

            <StatusBadge type={isOnline ? 'success' : 'danger'} label={isOnline ? 'Online' : 'Offline'} />
          </View>

          <Text style={styles.syncText}>Última sincronización: {formatSyncDate(lastSyncAt)}</Text>
          <Text style={styles.syncText}>Caché local: {offlineReady ? 'Listo' : 'Cargando'}</Text>
        </Card>

        <Text style={styles.blockTitle}>Datos guardados localmente</Text>

        <View style={styles.grid}>
          <Metric title="Clientes" value={String(clients.length)} />
          <Metric title="Créditos" value={String(credits.length)} />
        </View>

        <View style={styles.grid}>
          <Metric title="Pagos" value={String(payments.length)} />
          <Metric title="Gastos" value={String(expenses.length)} />
        </View>

        <View style={styles.grid}>
          <Metric title="Rutas" value={String(routes.length)} />
          <Metric title="Visitas" value={String(visits.length)} />
        </View>

        <View style={styles.grid}>
          <Metric title="Cierres" value={String(cashClosings.length)} />
          <Metric title="Auditoría" value={String(auditLogs.length)} />
        </View>

        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Qué puedes hacer sin internet</Text>

          <ManualLine text="Consultar clientes, créditos, cuotas, pagos, visitas y reportes previamente cargados." />
          <ManualLine text="Revisar historial del cliente, agenda y promesas ya sincronizadas." />
          <ManualLine text="Ver datos de caja guardados en la última sincronización." />
        </Card>

        <Card style={styles.warningCard}>
          <Text style={styles.warningTitle}>Qué NO recomiendo hacer sin internet</Text>

          <ManualLine text="Registrar pagos nuevos." />
          <ManualLine text="Crear clientes o créditos." />
          <ManualLine text="Anular pagos, gastos o créditos." />
          <ManualLine text="Cerrar caja definitiva." />

          <Text style={styles.warningText}>
            Para evitar datos duplicados o inconsistencias, realiza cambios importantes cuando vuelva la conexión.
          </Text>
        </Card>
      </Screen>

      <BottomNav />
    </View>
  );
}

function Metric({ title, value }: { title: string; value: string }) {
  return (
    <Card style={styles.metricCard}>
      <Text style={styles.metricTitle}>{title}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </Card>
  );
}

function ManualLine({ text }: { text: string }) {
  return (
    <View style={styles.manualLine}>
      <Text style={styles.bullet}>•</Text>
      <Text style={styles.manualText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background
  },
  onlineCard: {
    backgroundColor: colors.primarySoft,
    marginBottom: 14
  },
  offlineCard: {
    backgroundColor: '#FFF5F5',
    marginBottom: 14
  },
  headerRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start'
  },
  headerInfo: {
    flex: 1
  },
  heroTitle: {
    color: colors.text,
    fontSize: 21,
    fontWeight: '900'
  },
  heroText: {
    color: colors.muted,
    fontWeight: '700',
    lineHeight: 20,
    marginTop: 6
  },
  syncText: {
    color: colors.muted,
    fontWeight: '800',
    marginTop: 8
  },
  blockTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 10
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
    fontSize: 12,
    fontWeight: '800'
  },
  metricValue: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: '900',
    marginTop: 6
  },
  sectionCard: {
    marginTop: 8,
    marginBottom: 12
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 10
  },
  manualLine: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 7
  },
  bullet: {
    color: colors.primary,
    fontWeight: '900'
  },
  manualText: {
    flex: 1,
    color: colors.muted,
    fontWeight: '700',
    lineHeight: 20
  },
  warningCard: {
    backgroundColor: '#FFF8E1',
    marginBottom: 14
  },
  warningTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 8
  },
  warningText: {
    color: colors.muted,
    fontWeight: '800',
    lineHeight: 20,
    marginTop: 10
  }
});