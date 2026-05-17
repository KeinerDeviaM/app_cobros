import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { BottomNav } from '../components/BottomNav';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { Input } from '../components/Input';
import { Screen } from '../components/Screen';
import { StatusBadge } from '../components/StatusBadge';
import { TopBar } from '../components/TopBar';
import { useApp } from '../state/AppContext';
import { colors } from '../theme/colors';
import { PaymentMethod } from '../types';
import { todayKey } from '../utils/date';
import { formatMoney } from '../utils/money';
import { isPositiveMoney, isValidDateKey, parseMoney } from '../utils/validation';

const paymentMethods: PaymentMethod[] = ['Efectivo', 'Transferencia', 'Nequi', 'Daviplata', 'Otro'];

export function RegisterPaymentScreen() {
  const {
    selectedClient,
    selectedCredit,
    credits,
    addPayment,
    getClientName,
    navigate
  } = useApp();

  const [useClientFilter, setUseClientFilter] = useState(Boolean(selectedClient));
  const [selectedCreditId, setSelectedCreditId] = useState(selectedCredit?.id ?? '');
  const [valorPagado, setValorPagado] = useState('');
  const [metodoPago, setMetodoPago] = useState<PaymentMethod>('Efectivo');
  const [fechaPago, setFechaPago] = useState(todayKey());
  const [observacion, setObservacion] = useState('');
  const [loading, setLoading] = useState(false);

  const availableCredits = useMemo(() => {
    const activeCredits = credits.filter((credit) => credit.estado !== 'pagado' && credit.saldoPendiente > 0);

    if (useClientFilter && selectedClient) {
      return activeCredits.filter((credit) => credit.clienteId === selectedClient.id);
    }

    return activeCredits;
  }, [credits, selectedClient, useClientFilter]);

  const selectedCreditData = useMemo(() => {
    return availableCredits.find((credit) => credit.id === selectedCreditId);
  }, [availableCredits, selectedCreditId]);

  useEffect(() => {
    if (selectedCredit && selectedCredit.estado !== 'pagado' && selectedCredit.saldoPendiente > 0) {
      setSelectedCreditId(selectedCredit.id);
      return;
    }

    if (availableCredits.length === 0) {
      setSelectedCreditId('');
      return;
    }

    const stillExists = availableCredits.some((credit) => credit.id === selectedCreditId);

    if (!selectedCreditId || !stillExists) {
      setSelectedCreditId(availableCredits[0].id);
    }
  }, [availableCredits, selectedCredit, selectedCreditId]);

  const handleSubmit = async () => {
    if (!selectedCreditId) {
      Alert.alert('Selecciona un crédito', 'Debes seleccionar el crédito al que quieres registrar el pago.');
      return;
    }

    if (!selectedCreditData) {
      Alert.alert('Crédito inválido', 'El crédito seleccionado no está disponible para pagos.');
      return;
    }

    if (selectedCreditData.estado === 'pagado' || selectedCreditData.saldoPendiente <= 0) {
      Alert.alert('Crédito pagado', 'Este crédito ya está pagado y no permite más pagos.');
      return;
    }

    const amount = parseMoney(valorPagado);

    if (!isPositiveMoney(amount)) {
      Alert.alert('Valor inválido', 'Ingresa un valor de pago mayor que cero.');
      return;
    }

    if (amount > selectedCreditData.saldoPendiente) {
      Alert.alert(
        'Pago mayor al saldo',
        `El saldo pendiente es ${formatMoney(selectedCreditData.saldoPendiente)}. Ingresa un valor menor o igual.`
      );
      return;
    }

    if (!isValidDateKey(fechaPago)) {
      Alert.alert('Fecha inválida', 'La fecha debe tener formato YYYY-MM-DD.');
      return;
    }

    setLoading(true);

    await addPayment({
      creditoId: selectedCreditId,
      valorPagado: amount,
      metodoPago,
      fechaPago,
      observacion: observacion.trim()
    });

    setValorPagado('');
    setObservacion('');
    setLoading(false);
  };

  const goBack = () => {
    if (selectedClient && useClientFilter) {
      navigate('clientDetail');
      return;
    }

    navigate('payments');
  };

  return (
    <View style={styles.root}>
      <TopBar title="Registrar pago" showBack onBack={goBack} />
      <Screen>
        {selectedClient && useClientFilter ? (
          <Card style={styles.clientCard}>
            <View style={styles.clientHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{selectedClient.nombre.charAt(0).toUpperCase()}</Text>
              </View>

              <View style={styles.clientInfo}>
                <Text style={styles.clientName}>{selectedClient.nombre}</Text>
                <Text style={styles.clientMeta}>{selectedClient.telefono}</Text>
                <Text style={styles.clientMeta}>{selectedClient.direccion}</Text>
              </View>
            </View>

            <Text style={styles.filterText}>Mostrando solo créditos de este cliente.</Text>

            <Button
              title="Ver créditos de todos los clientes"
              variant="secondary"
              onPress={() => setUseClientFilter(false)}
              style={styles.smallButton}
            />
          </Card>
        ) : selectedClient ? (
          <Card style={styles.clientCard}>
            <Text style={styles.filterTitle}>Filtro de cliente desactivado</Text>
            <Text style={styles.filterText}>Ahora estás viendo créditos de todos los clientes.</Text>

            <Button
              title={`Volver a créditos de ${selectedClient.nombre}`}
              variant="secondary"
              onPress={() => setUseClientFilter(true)}
              style={styles.smallButton}
            />
          </Card>
        ) : null}

        <Text style={styles.sectionTitle}>Selecciona el crédito</Text>

        {availableCredits.length === 0 ? (
          <EmptyState
            title="Sin créditos disponibles"
            message={
              selectedClient && useClientFilter
                ? 'Este cliente no tiene créditos activos para registrar pagos.'
                : 'No hay créditos activos disponibles para registrar pagos.'
            }
          />
        ) : (
          availableCredits.map((credit) => {
            const selected = credit.id === selectedCreditId;

            return (
              <Pressable
                key={credit.id}
                style={[styles.creditCard, selected ? styles.creditCardSelected : null]}
                onPress={() => setSelectedCreditId(credit.id)}
              >
                <View style={styles.creditHeader}>
                  <View style={styles.creditInfo}>
                    <Text style={[styles.creditTitle, selected ? styles.creditTitleSelected : null]}>
                      {getClientName(credit.clienteId)}
                    </Text>

                    <Text style={styles.creditMeta}>Prestado: {formatMoney(credit.valorPrestado)}</Text>
                    <Text style={styles.creditMeta}>Total: {formatMoney(credit.valorTotal)}</Text>
                    <Text style={styles.creditBalance}>Saldo: {formatMoney(credit.saldoPendiente)}</Text>
                  </View>

                  <StatusBadge type={credit.estado === 'vencido' ? 'danger' : 'warning'} label={credit.estado} />
                </View>

                <Text style={styles.creditMeta}>Cuota: {formatMoney(credit.valorCuota)} · {credit.frecuencia}</Text>

                {selected ? <Text style={styles.selectedText}>Crédito seleccionado</Text> : null}
              </Pressable>
            );
          })
        )}

        <Card style={styles.formCard}>
          <Text style={styles.sectionTitle}>Datos del pago</Text>

          {selectedCreditData ? (
            <View style={styles.balanceBox}>
              <Text style={styles.balanceLabel}>Saldo pendiente</Text>
              <Text style={styles.balanceValue}>{formatMoney(selectedCreditData.saldoPendiente)}</Text>
            </View>
          ) : null}

          <Input
            label="Valor pagado"
            icon="💰"
            value={valorPagado}
            onChangeText={setValorPagado}
            placeholder="Ej: 20000"
            keyboardType="numeric"
          />

          <Text style={styles.label}>Método de pago</Text>
          <View style={styles.methodList}>
            {paymentMethods.map((method) => {
              const selected = method === metodoPago;

              return (
                <Pressable
                  key={method}
                  style={[styles.methodChip, selected ? styles.methodChipSelected : null]}
                  onPress={() => setMetodoPago(method)}
                >
                  <Text style={[styles.methodText, selected ? styles.methodTextSelected : null]}>
                    {method}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Input label="Fecha del pago" icon="📅" value={fechaPago} onChangeText={setFechaPago} placeholder="YYYY-MM-DD" />
          <Input label="Observaciones" icon="📝" value={observacion} onChangeText={setObservacion} placeholder="Opcional" />

          <Button title="Registrar pago" onPress={handleSubmit} loading={loading} style={styles.submitButton} />
        </Card>
      </Screen>
      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  clientCard: { marginBottom: 16, backgroundColor: colors.primarySoft },
  clientHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.primary, fontSize: 20, fontWeight: '900' },
  clientInfo: { flex: 1 },
  clientName: { color: colors.primary, fontWeight: '900', fontSize: 17 },
  clientMeta: { color: colors.muted, fontWeight: '700', marginTop: 2 },
  filterTitle: { color: colors.primary, fontWeight: '900', fontSize: 16 },
  filterText: { color: colors.muted, fontWeight: '700', lineHeight: 20, marginTop: 10 },
  smallButton: { marginTop: 12 },
  sectionTitle: { color: colors.text, fontWeight: '900', fontSize: 17, marginBottom: 10 },
  creditCard: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 14, marginBottom: 10 },
  creditCardSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  creditHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  creditInfo: { flex: 1 },
  creditTitle: { color: colors.text, fontSize: 16, fontWeight: '900' },
  creditTitleSelected: { color: colors.primary },
  creditMeta: { color: colors.muted, fontWeight: '700', marginTop: 4 },
  creditBalance: { color: colors.danger, fontWeight: '900', marginTop: 5 },
  selectedText: { color: colors.primary, fontWeight: '900', marginTop: 8, fontSize: 12 },
  formCard: { marginTop: 12 },
  balanceBox: { backgroundColor: '#FFF5F5', borderRadius: 14, padding: 12, marginBottom: 14 },
  balanceLabel: { color: colors.muted, fontWeight: '800' },
  balanceValue: { color: colors.danger, fontSize: 22, fontWeight: '900', marginTop: 4 },
  label: { color: colors.text, fontWeight: '900', marginBottom: 8 },
  methodList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  methodChip: { borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#FFFFFF' },
  methodChipSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  methodText: { color: colors.muted, fontWeight: '800' },
  methodTextSelected: { color: colors.primary },
  submitButton: { marginTop: 6 }
});