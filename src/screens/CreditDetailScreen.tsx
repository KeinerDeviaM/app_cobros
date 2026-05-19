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
    cancelCredit,
    isAdmin
  } = useApp();

  const client = useMemo(() => {
    if (!selectedCredit) return undefined;
    return clients.find((item) => item.id === selectedCredit.clienteId);
  }, [clients, selectedCredit]);

  const codeudorClient = useMemo(() => {
    if (!selectedCredit?.codeudorClienteId) return undefined;
    return clients.find((item) => item.id === selectedCredit.codeudorClienteId);
  }, [clients, selectedCredit]);

  const creditPayments = useMemo(() => {
    if (!selectedCredit) return [];
    return payments.filter((payment) => payment.creditoId === selectedCredit.id);
  }, [payments, selectedCredit]);

  const activeCreditPayments = creditPayments.filter((payment) => payment.estado !== 'anulado');
  const totalPaid = activeCreditPayments.reduce((total, payment) => total + payment.valorPagado, 0);

  if (!selectedCredit) {
    return (
      <View style={styles.root}>
        <TopBar title="Detalle credito" showBack onBack={() => navigate('credits')} />

        <Screen>
          <EmptyState title="Credito no encontrado" message="Vuelve a creditos y selecciona uno." />
          <Button title="Volver a creditos" onPress={() => navigate('credits')} />
        </Screen>

        <BottomNav />
      </View>
    );
  }

  const statusType =
    selectedCredit.estado === 'pagado'
      ? 'success'
      : selectedCredit.estado === 'vencido' || selectedCredit.estado === 'anulado'
        ? 'danger'
        : 'warning';

  const confirmStatus = (status: CreditStatus) => {
    if (selectedCredit.estado === 'anulado') {
      Alert.alert('Credito anulado', 'No puedes cambiar el estado de un credito anulado.');
      return;
    }

    Alert.alert(
      'Cambiar estado',
      status === 'pagado'
        ? 'Marcar como pagado pondra el saldo pendiente en $0. Deseas continuar?'
        : `Deseas marcar este credito como ${status}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Confirmar', onPress: () => updateCreditStatus(selectedCredit.id, status) }
      ]
    );
  };

  const confirmCancelCredit = () => {
    Alert.alert(
      'Anular credito',
      'Esta accion marcara el credito como anulado, pondra su saldo en $0 y guardara auditoria. No se borraran los pagos historicos. Deseas continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Anular',
          style: 'destructive',
          onPress: () => cancelCredit(selectedCredit.id, 'Anulacion manual desde detalle del credito')
        }
      ]
    );
  };

  return (
    <View style={styles.root}>
      <TopBar title="Detalle credito" showBack onBack={() => navigate('credits')} />

      <Screen>
        <Card style={styles.headerCard}>
          <View style={styles.headerTop}>
            <View style={styles.iconBox}>
              <Text style={styles.icon}>$</Text>
            </View>

            <View style={styles.headerInfo}>
              <Text style={styles.clientName}>{client?.nombre ?? 'Cliente no encontrado'}</Text>
              <Text style={styles.clientMeta}>{client?.telefono ?? 'Sin telefono'}</Text>
              <Text style={styles.clientMeta}>{client?.direccion ?? 'Sin direccion'}</Text>
            </View>

            <StatusBadge type={statusType} label={selectedCredit.estado} />
          </View>

          <Text style={styles.collector}>
            Cobrador: {selectedCredit.assignedToEmail || client?.assignedToEmail || 'Sin asignar'}
          </Text>

          {selectedCredit.estado === 'anulado' ? (
            <Text style={styles.cancelWarning}>
              Este credito fue anulado. No suma en cartera y no permite nuevos pagos.
            </Text>
          ) : null}
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
            <Text style={styles.metricLabel}>Pagado activo</Text>
            <Text style={styles.metricValue}>{formatMoney(totalPaid)}</Text>
          </Card>

          <Card style={styles.metricCard}>
            <Text style={styles.metricLabel}>Saldo</Text>
            <Text style={[styles.metricValue, styles.danger]}>{formatMoney(selectedCredit.saldoPendiente)}</Text>
          </Card>
        </View>

        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Datos del credito</Text>
          <Text style={styles.detail}>ID credito: {selectedCredit.id}</Text>
          <Text style={styles.detail}>Numero de cuotas: {selectedCredit.numeroCuotas}</Text>
          <Text style={styles.detail}>Valor cuota: {formatMoney(selectedCredit.valorCuota)}</Text>
          <Text style={styles.detail}>Frecuencia: {selectedCredit.frecuencia}</Text>
          <Text style={styles.detail}>Fecha inicio: {selectedCredit.fechaInicio}</Text>
          <Text style={styles.detail}>Fecha final: {selectedCredit.fechaFinal || 'No registrada'}</Text>
          <Text style={styles.detail}>Porcentaje: {selectedCredit.porcentaje || 0}%</Text>
          <Text style={styles.detail}>Nota: {selectedCredit.nota || 'Sin nota'}</Text>
          <Text style={styles.detail}>Creado por: {selectedCredit.createdBy || 'No registrado'}</Text>
        </Card>

        {selectedCredit.codeudorTiene ? (
          <Card style={styles.codebtorCard}>
            <Text style={styles.sectionTitle}>Codeudor</Text>
            <Text style={styles.detail}>Tipo: {selectedCredit.codeudorTipo === 'cliente' ? 'Cliente existente' : 'Persona nueva'}</Text>
            <Text style={styles.detail}>Cliente vinculado: {codeudorClient?.nombre || 'No vinculado'}</Text>
            <Text style={styles.detail}>Nombre completo: {selectedCredit.codeudorNombreCompleto || 'No registrado'}</Text>
            <Text style={styles.detail}>Sobrenombre: {selectedCredit.codeudorSobrenombre || 'No registrado'}</Text>
            <Text style={styles.detail}>CPF: {selectedCredit.codeudorCpf || 'No registrado'}</Text>
            <Text style={styles.detail}>Telefono: {selectedCredit.codeudorTelefono || 'No registrado'}</Text>
            <Text style={styles.detail}>Direccion: {selectedCredit.codeudorDireccion || 'No registrada'}</Text>
            <Text style={styles.detail}>Nota: {selectedCredit.codeudorNota || 'Sin nota'}</Text>
          </Card>
        ) : (
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Codeudor</Text>
            <Text style={styles.detail}>Este credito no tiene codeudor registrado.</Text>
          </Card>
        )}

        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Acciones</Text>

          <Button title="Ver cuotas" variant="secondary" onPress={() => navigate('installments')} style={styles.actionButton} />

          {selectedCredit.estado !== 'anulado' ? (
            <Button title="Registrar pago" onPress={() => navigate('registerPayment')} style={styles.actionButton} />
          ) : null}

          {isAdmin ? (
            <>
              {selectedCredit.estado !== 'anulado' ? (
                <>
                  <Button title="Editar credito" variant="secondary" onPress={() => navigate('editCredit')} style={styles.actionButton} />
                  <Button title="Marcar activo" variant="secondary" onPress={() => confirmStatus('activo')} style={styles.actionButton} />
                  <Button title="Marcar vencido" variant="danger" onPress={() => confirmStatus('vencido')} style={styles.actionButton} />
                  <Button title="Marcar pagado" variant="secondary" onPress={() => confirmStatus('pagado')} style={styles.actionButton} />
                  <Button title="Anular credito" variant="danger" onPress={confirmCancelCredit} style={styles.actionButton} />
                </>
              ) : null}
            </>
          ) : null}
        </Card>

        <Text style={styles.blockTitle}>Pagos de este credito</Text>

        {creditPayments.length === 0 ? (
          <EmptyState title="Sin pagos" message="Este credito todavia no tiene pagos registrados." />
        ) : (
          creditPayments.map((payment) => {
            const isCanceled = payment.estado === 'anulado';

            return (
              <Card key={payment.id} style={[styles.paymentCard, isCanceled ? styles.canceledPayment : null]}>
                <View style={styles.paymentHeader}>
                  <Text style={[styles.paymentAmount, isCanceled ? styles.danger : null]}>
                    {formatMoney(payment.valorPagado)}
                  </Text>

                  <StatusBadge type={isCanceled ? 'danger' : 'success'} label={isCanceled ? 'Anulado' : payment.fechaPago} />
                </View>

                <Text style={styles.detail}>Metodo: {payment.metodoPago}</Text>
                <Text style={styles.detail}>Registrado por: {payment.usuarioEmail}</Text>
                {payment.observacion ? <Text style={styles.detail}>Nota: {payment.observacion}</Text> : null}
                {isCanceled ? <Text style={styles.detail}>Motivo anulacion: {payment.motivoAnulacion || 'Sin motivo'}</Text> : null}
              </Card>
            );
          })
        )}
      </Screen>

      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  headerCard: { marginBottom: 12 },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center'
  },
  icon: { fontSize: 26, color: colors.primary, fontWeight: '900' },
  headerInfo: { flex: 1 },
  clientName: { color: colors.text, fontWeight: '900', fontSize: 17 },
  clientMeta: { color: colors.muted, fontWeight: '700', marginTop: 3 },
  collector: { color: colors.primary, fontWeight: '800', marginTop: 12 },
  cancelWarning: { color: colors.danger, fontWeight: '900', lineHeight: 20, marginTop: 10 },
  grid: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  metricCard: { flex: 1 },
  metricLabel: { color: colors.muted, fontWeight: '800', fontSize: 12 },
  metricValue: { color: colors.primary, fontWeight: '900', fontSize: 18, marginTop: 6 },
  danger: { color: colors.danger },
  sectionCard: { marginBottom: 12 },
  codebtorCard: { backgroundColor: colors.primarySoft, marginBottom: 12 },
  sectionTitle: { color: colors.text, fontWeight: '900', fontSize: 16, marginBottom: 10 },
  detail: { color: colors.muted, fontWeight: '700', marginTop: 5, lineHeight: 20 },
  actionButton: { marginBottom: 10 },
  blockTitle: { color: colors.text, fontWeight: '900', fontSize: 18, marginTop: 12, marginBottom: 10 },
  paymentCard: { marginBottom: 10 },
  canceledPayment: { backgroundColor: '#FFF5F5' },
  paymentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  paymentAmount: { color: colors.primary, fontWeight: '900', fontSize: 18 }
});