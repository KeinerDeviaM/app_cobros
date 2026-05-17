import React, { useMemo, useState } from 'react';
import { Alert, Share, StyleSheet, Text, View } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { BottomNav } from '../components/BottomNav';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Screen } from '../components/Screen';
import { TopBar } from '../components/TopBar';
import { useApp } from '../state/AppContext';
import { colors } from '../theme/colors';
import { todayKey } from '../utils/date';
import { formatMoney } from '../utils/money';

function safeFileName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function getNowFileKey() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}-${hour}${minute}`;
}

export function DataBackupScreen() {
  const {
    clients,
    credits,
    payments,
    expenses,
    users,
    routes,
    visits,
    cashClosings,
    auditLogs,
    businessSettings,
    session,
    navigate,
    isAdmin
  } = useApp();

  const [loadingJson, setLoadingJson] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);

  const today = todayKey();

  const stats = useMemo(() => {
    const validCredits = credits.filter((credit) => credit.estado !== 'anulado');
    const activePayments = payments.filter((payment) => payment.estado !== 'anulado');
    const activeExpenses = expenses.filter((expense) => expense.estado !== 'anulado');

    const totalPrestado = validCredits.reduce((total, credit) => total + credit.valorPrestado, 0);
    const totalAPagar = validCredits.reduce((total, credit) => total + credit.valorTotal, 0);
    const saldoPendiente = validCredits.reduce((total, credit) => total + credit.saldoPendiente, 0);
    const totalPagado = activePayments.reduce((total, payment) => total + payment.valorPagado, 0);
    const totalGastos = activeExpenses.reduce((total, expense) => total + expense.valor, 0);

    const pagosHoy = activePayments
      .filter((payment) => payment.fechaPago === today)
      .reduce((total, payment) => total + payment.valorPagado, 0);

    const gastosHoy = activeExpenses
      .filter((expense) => expense.fecha === today)
      .reduce((total, expense) => total + expense.valor, 0);

    return {
      totalClientes: clients.length,
      totalCreditos: credits.length,
      creditosActivos: validCredits.filter((credit) => credit.estado === 'activo').length,
      creditosPagados: validCredits.filter((credit) => credit.estado === 'pagado').length,
      creditosVencidos: validCredits.filter((credit) => credit.estado === 'vencido').length,
      creditosAnulados: credits.filter((credit) => credit.estado === 'anulado').length,
      clientesMora: clients.filter((client) => client.estado === 'en-mora').length,
      totalPrestado,
      totalAPagar,
      saldoPendiente,
      totalPagado,
      totalGastos,
      pagosHoy,
      gastosHoy,
      cajaHoy: pagosHoy - gastosHoy,
      pagosAnulados: payments.filter((payment) => payment.estado === 'anulado').length,
      gastosAnulados: expenses.filter((expense) => expense.estado === 'anulado').length,
      visitas: visits.length,
      promesas: visits.filter((visit) => visit.estado === 'promesa').length,
      cierresCaja: cashClosings.length,
      auditoria: auditLogs.length,
      usuarios: users.length,
      rutas: routes.length
    };
  }, [auditLogs, cashClosings, clients, credits, expenses, payments, routes, today, users, visits]);

  const backup = useMemo(() => {
    return {
      metadata: {
        app: businessSettings.appName || 'App Cobros',
        negocio: businessSettings.businessName || 'CobroApp',
        fechaRespaldo: new Date().toISOString(),
        generadoPor: session.email,
        version: '1.0',
        tipo: 'respaldo-completo'
      },
      resumen: stats,
      configuracion: businessSettings,
      usuarios: users,
      rutas: routes,
      clientes: clients,
      creditos: credits,
      pagos: payments,
      gastos: expenses,
      visitas: visits,
      cierresCaja: cashClosings,
      auditoria: auditLogs
    };
  }, [
    auditLogs,
    businessSettings,
    cashClosings,
    clients,
    credits,
    expenses,
    payments,
    routes,
    session.email,
    stats,
    users,
    visits
  ]);

  const summaryText = useMemo(() => {
    return [
      `${businessSettings.businessName || businessSettings.appName || 'App Cobros'}`,
      'RESUMEN DE RESPALDO',
      `Fecha: ${today}`,
      `Generado por: ${session.email}`,
      '',
      `Clientes: ${stats.totalClientes}`,
      `Clientes en mora: ${stats.clientesMora}`,
      `Créditos totales: ${stats.totalCreditos}`,
      `Créditos activos: ${stats.creditosActivos}`,
      `Créditos pagados: ${stats.creditosPagados}`,
      `Créditos vencidos: ${stats.creditosVencidos}`,
      `Créditos anulados: ${stats.creditosAnulados}`,
      '',
      `Total prestado: ${formatMoney(stats.totalPrestado)}`,
      `Total a pagar: ${formatMoney(stats.totalAPagar)}`,
      `Total pagado: ${formatMoney(stats.totalPagado)}`,
      `Saldo pendiente: ${formatMoney(stats.saldoPendiente)}`,
      '',
      `Pagos de hoy: ${formatMoney(stats.pagosHoy)}`,
      `Gastos de hoy: ${formatMoney(stats.gastosHoy)}`,
      `Caja esperada hoy: ${formatMoney(stats.cajaHoy)}`,
      '',
      `Rutas: ${stats.rutas}`,
      `Usuarios: ${stats.usuarios}`,
      `Visitas: ${stats.visitas}`,
      `Promesas: ${stats.promesas}`,
      `Cierres de caja: ${stats.cierresCaja}`,
      `Registros de auditoría: ${stats.auditoria}`
    ].join('\n');
  }, [businessSettings, session.email, stats, today]);

  const exportJson = async () => {
    if (!isAdmin) {
      Alert.alert('Acceso restringido', 'Solo el administrador puede exportar respaldos.');
      return;
    }

    try {
      setLoadingJson(true);

      const canShare = await Sharing.isAvailableAsync();

      if (!canShare) {
        Alert.alert('Compartir no disponible', 'Este dispositivo no permite compartir archivos.');
        setLoadingJson(false);
        return;
      }

      const businessName = safeFileName(businessSettings.businessName || 'app-cobros');
      const fileName = `respaldo-${businessName}-${getNowFileKey()}.json`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(backup, null, 2), {
        encoding: FileSystem.EncodingType.UTF8
      });

      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/json',
        dialogTitle: 'Compartir respaldo completo'
      });

      setLoadingJson(false);
    } catch (error) {
      console.error('Error exportando respaldo:', error);
      setLoadingJson(false);
      Alert.alert('Error', 'No se pudo exportar el respaldo completo.');
    }
  };

  const shareSummary = async () => {
    try {
      setLoadingSummary(true);

      await Share.share({
        message: summaryText
      });

      setLoadingSummary(false);
    } catch (error) {
      console.error('Error compartiendo resumen:', error);
      setLoadingSummary(false);
      Alert.alert('Error', 'No se pudo compartir el resumen.');
    }
  };

  return (
    <View style={styles.root}>
      <TopBar title="Respaldo de datos" showBack onBack={() => navigate('more')} />

      <Screen>
        <Card style={styles.heroCard}>
          <Text style={styles.heroTitle}>Respaldo completo</Text>
          <Text style={styles.heroText}>
            Exporta toda la información de la app en un archivo JSON para guardarlo como copia de seguridad.
          </Text>
        </Card>

        <View style={styles.grid}>
          <Metric title="Clientes" value={String(stats.totalClientes)} />
          <Metric title="Créditos" value={String(stats.totalCreditos)} />
        </View>

        <View style={styles.grid}>
          <Metric title="Pagado" value={formatMoney(stats.totalPagado)} />
          <Metric title="Pendiente" value={formatMoney(stats.saldoPendiente)} danger />
        </View>

        <View style={styles.grid}>
          <Metric title="Rutas" value={String(stats.rutas)} />
          <Metric title="Usuarios" value={String(stats.usuarios)} />
        </View>

        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Qué incluye el respaldo</Text>

          <InfoRow label="Configuración del negocio" value="Sí" />
          <InfoRow label="Clientes" value={String(clients.length)} />
          <InfoRow label="Créditos" value={String(credits.length)} />
          <InfoRow label="Pagos" value={String(payments.length)} />
          <InfoRow label="Gastos" value={String(expenses.length)} />
          <InfoRow label="Rutas" value={String(routes.length)} />
          <InfoRow label="Visitas" value={String(visits.length)} />
          <InfoRow label="Cierres de caja" value={String(cashClosings.length)} />
          <InfoRow label="Auditoría" value={String(auditLogs.length)} />
          <InfoRow label="Usuarios" value={String(users.length)} />
        </Card>

        <Card style={styles.warningCard}>
          <Text style={styles.warningTitle}>Importante</Text>
          <Text style={styles.warningText}>
            Este respaldo es una copia de seguridad para guardar o revisar. No reemplaza la base de datos de Firebase.
          </Text>
          <Text style={styles.warningText}>
            Guárdalo en un lugar seguro porque contiene información sensible del negocio.
          </Text>
        </Card>

        <Button
          title="Exportar respaldo JSON"
          onPress={exportJson}
          loading={loadingJson}
          style={styles.button}
        />

        <Button
          title="Compartir resumen"
          variant="secondary"
          onPress={shareSummary}
          loading={loadingSummary}
          style={styles.button}
        />
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
  value
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
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
    fontSize: 17,
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
    fontWeight: '900'
  },
  warningCard: {
    backgroundColor: '#FFF8E1',
    marginBottom: 14
  },
  warningTitle: {
    color: colors.text,
    fontWeight: '900',
    fontSize: 16
  },
  warningText: {
    color: colors.muted,
    fontWeight: '700',
    lineHeight: 20,
    marginTop: 6
  },
  button: {
    marginBottom: 10
  }
});