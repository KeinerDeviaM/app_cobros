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
import { buildInstallments, getInstallmentsSummary, InstallmentStatus } from '../utils/installments';
import { formatMoney } from '../utils/money';

function getBadgeType(status: InstallmentStatus) {
  if (status === 'pagada') return 'success';
  if (status === 'vencida') return 'danger';
  if (status === 'parcial') return 'warning';
  return 'warning';
}

function getStatusLabel(status: InstallmentStatus) {
  if (status === 'pagada') return 'Pagada';
  if (status === 'parcial') return 'Parcial';
  if (status === 'vencida') return 'Vencida';
  return 'Pendiente';
}

export function InstallmentsScreen() {
  const {
    selectedCredit,
    payments,
    getClientName,
    navigate
  } = useApp();

  const installments = useMemo(() => {
    if (!selectedCredit) return [];
    return buildInstallments(selectedCredit, payments);
  }, [payments, selectedCredit]);

  const summary = useMemo(() => {
    return getInstallmentsSummary(installments);
  }, [installments]);

  if (!selectedCredit) {
    return (
      <View style={styles.root}>
        <TopBar title="Cuotas" showBack onBack={() => navigate('credits')} />
        <Screen>
          <EmptyState title="Crédito no encontrado" message="Vuelve a créditos y selecciona uno." />
          <Button title="Volver a créditos" onPress={() => navigate('credits')} />
        </Screen>
        <BottomNav />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <TopBar title="Cuotas del crédito" showBack onBack={() => navigate('creditDetail')} />

      <Screen>
        <Card style={styles.headerCard}>
          <Text style={styles.clientName}>{getClientName(selectedCredit.clienteId)}</Text>
          <Text style={styles.headerText}>Valor total: {formatMoney(selectedCredit.valorTotal)}</Text>
          <Text style={styles.headerText}>Saldo pendiente: {formatMoney(selectedCredit.saldoPendiente)}</Text>
          <Text style={styles.headerText}>Frecuencia: {selectedCredit.frecuencia}</Text>
          <Text style={styles.headerText}>Número de cuotas: {selectedCredit.numeroCuotas}</Text>
        </Card>

        <View style={styles.grid}>
          <Card style={styles.metricCard}>
            <Text style={styles.metricLabel}>Pagadas</Text>
            <Text style={styles.metricValue}>{summary.pagadas}</Text>
          </Card>

          <Card style={styles.metricCard}>
            <Text style={styles.metricLabel}>Vencidas</Text>
            <Text style={[styles.metricValue, styles.danger]}>{summary.vencidas}</Text>
          </Card>
        </View>

        <View style={styles.grid}>
          <Card style={styles.metricCard}>
            <Text style={styles.metricLabel}>Pendientes</Text>
            <Text style={styles.metricValue}>{summary.pendientes}</Text>
          </Card>

          <Card style={styles.metricCard}>
            <Text style={styles.metricLabel}>Valor pendiente</Text>
            <Text style={[styles.metricValue, styles.danger]}>{formatMoney(summary.valorPendiente)}</Text>
          </Card>
        </View>

        <Text style={styles.blockTitle}>Listado de cuotas</Text>

        {installments.length === 0 ? (
          <EmptyState title="Sin cuotas" message="Este crédito no tiene cuotas configuradas." />
        ) : (
          installments.map((installment) => (
            <Card key={installment.numero} style={styles.installmentCard}>
              <View style={styles.row}>
                <View style={styles.info}>
                  <Text style={styles.installmentTitle}>Cuota #{installment.numero}</Text>
                  <Text style={styles.installmentDate}>Fecha esperada: {installment.fecha}</Text>
                </View>

                <StatusBadge type={getBadgeType(installment.estado)} label={getStatusLabel(installment.estado)} />
              </View>

              <View style={styles.amountBox}>
                <View style={styles.amountItem}>
                  <Text style={styles.amountLabel}>Valor</Text>
                  <Text style={styles.amountValue}>{formatMoney(installment.valor)}</Text>
                </View>

                <View style={styles.amountItem}>
                  <Text style={styles.amountLabel}>Pagado</Text>
                  <Text style={styles.amountValue}>{formatMoney(installment.pagado)}</Text>
                </View>

                <View style={styles.amountItem}>
                  <Text style={styles.amountLabel}>Pendiente</Text>
                  <Text style={[styles.amountValue, installment.pendiente > 0 ? styles.danger : styles.success]}>
                    {formatMoney(installment.pendiente)}
                  </Text>
                </View>
              </View>
            </Card>
          ))
        )}

        {selectedCredit.estado !== 'anulado' && selectedCredit.saldoPendiente > 0 ? (
          <Button title="Registrar pago" onPress={() => navigate('registerPayment')} style={styles.button} />
        ) : null}
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
    fontSize: 19,
    fontWeight: '900'
  },
  headerText: {
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
    fontSize: 20,
    marginTop: 6
  },
  danger: {
    color: colors.danger
  },
  success: {
    color: colors.success
  },
  blockTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
    marginTop: 14,
    marginBottom: 10
  },
  installmentCard: {
    marginBottom: 10
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  info: {
    flex: 1
  },
  installmentTitle: {
    color: colors.text,
    fontWeight: '900',
    fontSize: 16
  },
  installmentDate: {
    color: colors.muted,
    fontWeight: '700',
    marginTop: 4
  },
  amountBox: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14
  },
  amountItem: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 14,
    padding: 10
  },
  amountLabel: {
    color: colors.muted,
    fontWeight: '800',
    fontSize: 11
  },
  amountValue: {
    color: colors.primary,
    fontWeight: '900',
    marginTop: 4,
    fontSize: 12
  },
  button: {
    marginTop: 12
  }
});