import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { BottomNav } from '../components/BottomNav';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { Input } from '../components/Input';
import { Screen } from '../components/Screen';
import { TopBar } from '../components/TopBar';
import { useApp } from '../state/AppContext';
import { colors } from '../theme/colors';
import { PaymentMethod } from '../types';
import { formatMoney } from '../utils/money';
import { isPositiveMoney, isValidDateKey, parseMoney } from '../utils/validation';

const methods: PaymentMethod[] = ['Efectivo', 'Transferencia', 'Nequi', 'Daviplata', 'Otro'];

export function EditPaymentScreen() {
  const { selectedPayment, getClientName, updatePayment, navigate, canManagePayments } = useApp();

  const [valorPagado, setValorPagado] = useState('');
  const [metodoPago, setMetodoPago] = useState<PaymentMethod>('Efectivo');
  const [fechaPago, setFechaPago] = useState('');
  const [observacion, setObservacion] = useState('');
  const [motivo, setMotivo] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedPayment) return;
    setValorPagado(String(selectedPayment.valorPagado));
    setMetodoPago(selectedPayment.metodoPago);
    setFechaPago(selectedPayment.fechaPago);
    setObservacion(selectedPayment.observacion || '');
  }, [selectedPayment]);

  if (!canManagePayments) {
    return (
      <View style={styles.root}>
        <TopBar title="Editar pago" showBack onBack={() => navigate('payments')} />
        <Screen>
          <EmptyState title="Acceso restringido" message="Solo supervisor o administrador puede editar pagos." />
          <Button title="Volver a pagos" onPress={() => navigate('payments')} />
        </Screen>
        <BottomNav />
      </View>
    );
  }

  if (!selectedPayment) {
    return (
      <View style={styles.root}>
        <TopBar title="Editar pago" showBack onBack={() => navigate('payments')} />
        <Screen>
          <EmptyState title="Pago no encontrado" message="Vuelve a pagos y selecciona uno." />
          <Button title="Volver a pagos" onPress={() => navigate('payments')} />
        </Screen>
        <BottomNav />
      </View>
    );
  }

  const value = parseMoney(valorPagado);

  const save = async () => {
    if (!isPositiveMoney(value)) {
      Alert.alert('Valor invalido', 'El valor del pago debe ser mayor que cero.');
      return;
    }

    if (!isValidDateKey(fechaPago)) {
      Alert.alert('Fecha invalida', 'La fecha debe tener formato YYYY-MM-DD.');
      return;
    }

    if (!motivo.trim()) {
      Alert.alert('Motivo requerido', 'Debes escribir el motivo de la edicion.');
      return;
    }

    setLoading(true);

    await updatePayment(selectedPayment.id, {
      valorPagado: value,
      metodoPago,
      fechaPago,
      observacion: observacion.trim(),
      motivo: motivo.trim()
    });

    setLoading(false);
  };

  return (
    <View style={styles.root}>
      <TopBar title="Editar pago" showBack onBack={() => navigate('payments')} />

      <Screen>
        <Card style={styles.infoCard}>
          <Text style={styles.title}>{getClientName(selectedPayment.clienteId)}</Text>
          <Text style={styles.meta}>Pago actual: {formatMoney(selectedPayment.valorPagado)}</Text>
          <Text style={styles.meta}>Metodo actual: {selectedPayment.metodoPago}</Text>
          <Text style={styles.meta}>Fecha actual: {selectedPayment.fechaPago}</Text>
          <Text style={styles.meta}>Cobrador: {selectedPayment.usuarioEmail}</Text>
        </Card>

        <Card>
          <Input label="Nuevo valor recibido" icon="$" value={valorPagado} onChangeText={setValorPagado} keyboardType="numeric" placeholder="Ej: 50000" />

          <Text style={styles.label}>Metodo de pago</Text>

          <View style={styles.chips}>
            {methods.map((method) => {
              const selected = method === metodoPago;

              return (
                <Text key={method} style={[styles.chip, selected ? styles.chipSelected : null]} onPress={() => setMetodoPago(method)}>
                  {method}
                </Text>
              );
            })}
          </View>

          <Input label="Fecha del pago" icon="F" value={fechaPago} onChangeText={setFechaPago} placeholder="YYYY-MM-DD" />
          <Input label="Nota opcional" icon="N" value={observacion} onChangeText={setObservacion} placeholder="Observacion del pago" />
          <Input label="Motivo de la edicion" icon="M" value={motivo} onChangeText={setMotivo} placeholder="Ej: error de digitacion" />

          <Button title="Guardar edicion" onPress={save} loading={loading} />
        </Card>
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
  infoCard: {
    backgroundColor: colors.primarySoft,
    marginBottom: 12
  },
  title: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '900'
  },
  meta: {
    color: colors.muted,
    fontWeight: '700',
    marginTop: 5
  },
  label: {
    color: colors.text,
    fontWeight: '900',
    marginBottom: 8
  },
  chips: {
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
    color: colors.muted,
    fontWeight: '900'
  },
  chipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
    color: colors.primary
  }
});