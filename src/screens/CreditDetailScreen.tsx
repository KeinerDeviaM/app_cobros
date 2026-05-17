import React, { useMemo } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { BottomNav } from '../components/BottomNav';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { Screen } from '../components/Screen';
import { StatusBadge } from '../components/StatusBadge';
import { TopBar } from '../components/TopBar';
import { useApp } from '../state/AppContext';
import { colors } from '../theme/colors';
import { CreditStatus } from '../types';
import { formatMoney } from '../utils/money';

export function CreditDetailScreen() {
  const {
    selectedCredit,
    clients,
    payments,
    navigate,
    updateCreditStatus,
    isAdmin
  } = useApp();

  const client = useMemo(() => {
    if (!selectedCredit) return undefined;
    return clients.find((item) => item.id === selectedCredit.clienteId);
  }, [clients, selectedCredit]);

  const creditPayments = useMemo(() => {
    if (!selectedCredit) return [];
    return payments.filter((payment) => payment.creditoId === selectedCredit.id);
  }, [payments, selectedCredit]);

  const totalPaid = creditPayments.filter((payment) => payment.estado !== 'anulado').reduce((total, payment) => total + payment.valorPagado, 0);

  if (!selectedCredit) {
    return (
      <View style={styles.root}>
        <TopBar title="Detalle crÃ©dito" showBack onBack={() => navigate('credits')} />
        <Screen>
          <EmptyState title="CrÃ©dito no encontrado" message="Vuelve a crÃ©ditos y selecciona uno." />
          <Button title="Volver a crÃ©ditos" onPress={() => navigate('credits')} />
        </Screen>
        <BottomNav />
      </View>
    );
  }

  const statusType =
    selectedCredit.estado === 'pagado'
      ? 'success'
      : selectedCredit.estado === 'vencido'
        ? 'danger'
        : 'warning';

  const confirmStatus = (status: CreditStatus) => {
    Alert.alert(
      'Cambiar estado',
      status === 'pagado'
        ? 'Marcar como pagado pondrÃ¡ el saldo pendiente en $0. Â¿Deseas continuar?'
        : `Â¿Deseas marcar este crÃ©dito como ${status}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Confirmar', onPress: () => updateCreditStatus(selectedCredit.id, status) }
      ]
    );
  };

  return (
    <View style={styles.root}>
      <TopBar title="Detalle crÃ©dito" showBack onBack={() => navigate('credits')} />
      <Screen>
        <Card style={styles.headerCard}>
          <View style={styles.headerTop}>
            <View style={styles.iconBox}>
              <Text style={styles.icon}>ðŸ’³</Text>
            </View>

            <View style={styles.headerInfo}>
              <Text style={styles.clientName}>{client?.nombre ?? 'Cliente no encontrado'}</Text>
              <Text style={styles.clientMeta}>{client?.telefono ?? 'Sin telÃ©fono'}</Text>
              <Text style={styles.clientMeta}>{client?.direccion ?? 'Sin direcciÃ³n'}</Text>
            </View>

            <StatusBadge type={statusType} label={selectedCredit.estado} />
          </View>

          <Text style={styles.collector}>
            Cobrador: {selectedCredit.assignedToEmail || client?.assignedToEmail || 'Sin asignar'}
          </Text>
        </Card>

        <View style={styles.grid}>
          <Card style={styles.metricCard}>
            <Text style={styles.metricLabel}>Prestado</Text>
            <Text style={styles.metricValue}>{formatMoney(selectedCredit.valorPrestado)}</Text>
          </Card>

          <Card style={styles.metricCard}>
            <Text style={styles.metricLabel}>Total a pagar</Text>
            <Text style={styles.metricValue}>{formatMoney(selectedCredit.valorTotal)}</Text>
          </Card>
        </View>

        <View style={styles.grid}>
          <Card style={styles.metricCard}>
            <Text style={styles.metricLabel}>Pagado</Text>
            <Text style={styles.metricValue}>{formatMoney(totalPaid)}</Text>
          </Card>

          <Card style={styles.metricCard}>
            <Text style={styles.metricLabel}>Saldo</Text>
            <Text style={[styles.metricValue, styles.danger]}>{formatMoney(selectedCredit.saldoPendiente)}</Text>
          </Card>
        </View>

        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Datos del crÃ©dito</Text>
          <Text style={styles.detail}>NÃºmero de cuotas: {selectedCredit.numeroCuotas}</Text>
          <Text style={styles.detail}>Valor cuota: {formatMoney(selectedCredit.valorCuota)}</Text>
          <Text style={styles.detail}>Frecuencia: {selectedCredit.frecuencia}</Text>
          <Text style={styles.detail}>Fecha inicio: {selectedCredit.fechaInicio}</Text>
          <Text style={styles.detail}>Creado por: {selectedCredit.createdBy || 'No registrado'}</Text>
        </Card>

        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Acciones</Text>

          <Button
            title="Registrar pago"
            onPress={() => navigate('registerPayment')}
            style={styles.actionButton}
          />

          {isAdmin ? (
            <>
              <Button
                title="Marcar activo"
                variant="secondary"
                onPress={() => confirmStatus('activo')}
                style={styles.actionButton}
              />

              <Button
                title="Marcar vencido"
                variant="danger"
                onPress={() => confirmStatus('vencido')}
                style={styles.actionButton}
              />

              <Button
                title="Marcar pagado"
                variant="secondary"
                onPress={() => confirmStatus('pagado')}
                style={styles.actionButton}
              />
            </>
          ) : null}
        </Card>

        <Text style={styles.blockTitle}>Pagos de este crÃ©dito</Text>

        {creditPayments.length === 0 ? (
          <EmptyState title="Sin pagos" message="Este crÃ©dito todavÃ­a no tiene pagos registrados." />
        ) : (
          creditPayments.map((payment) => (
            <Card key={payment.id} style={styles.paymentCard}>
              <View style={styles.paymentHeader}>
                <Text style={styles.paymentAmount}>{formatMoney(payment.valorPagado)}</Text>
                <Text style={styles.paymentDate}>{payment.fechaPago}</Text>
              </View>

              <Text style={styles.detail}>MÃ©todo: {payment.metodoPago}</Text>
              <Text style={styles.detail}>Registrado por: {payment.usuarioEmail}</Text>
              {payment.observacion ? <Text style={styles.detail}>Nota: {payment.observacion}</Text> : null}
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
    marginBottom: 12
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  iconBox: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center'
  },
  icon: {
    fontSize: 26
  },
  headerInfo: {
    flex: 1
  },
  clientName: {
    color: colors.text,
    fontWeight: '900',
    fontSize: 17
  },
  clientMeta: {
    color: colors.muted,
    fontWeight: '700',
    marginTop: 3
  },
  collector: {
    color: colors.primary,
    fontWeight: '800',
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
  sectionCard: {
    marginBottom: 12
  },
  sectionTitle: {
    color: colors.text,
    fontWeight: '900',
    fontSize: 16,
    marginBottom: 10
  },
  detail: {
    color: colors.muted,
    fontWeight: '700',
    marginTop: 5,
    lineHeight: 20
  },
  actionButton: {
    marginBottom: 10
  },
  blockTitle: {
    color: colors.text,
    fontWeight: '900',
    fontSize: 18,
    marginTop: 12,
    marginBottom: 10
  },
  paymentCard: {
    marginBottom: 10
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10
  },
  paymentAmount: {
    color: colors.primary,
    fontWeight: '900',
    fontSize: 16
  },
  paymentDate: {
    color: colors.muted,
    fontWeight: '800'
  }
});