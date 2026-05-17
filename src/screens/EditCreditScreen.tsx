import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { BottomNav } from '../components/BottomNav';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { Input } from '../components/Input';
import { Screen } from '../components/Screen';
import { TopBar } from '../components/TopBar';
import { useApp } from '../state/AppContext';
import { colors } from '../theme/colors';
import { CreditStatus, Frequency } from '../types';
import { formatMoney } from '../utils/money';
import { isPositiveInteger, isPositiveMoney, isValidDateKey, parseMoney } from '../utils/validation';

const frequencies: Frequency[] = ['Diaria', 'Semanal', 'Quincenal', 'Mensual'];
const editableStatuses: CreditStatus[] = ['activo', 'vencido', 'pagado'];

export function EditCreditScreen() {
  const {
    selectedCredit,
    clients,
    payments,
    updateCredit,
    navigate
  } = useApp();

  const [valorPrestado, setValorPrestado] = useState('');
  const [valorTotal, setValorTotal] = useState('');
  const [numeroCuotas, setNumeroCuotas] = useState('');
  const [frecuencia, setFrecuencia] = useState<Frequency>('Diaria');
  const [fechaInicio, setFechaInicio] = useState('');
  const [estado, setEstado] = useState<CreditStatus>('activo');
  const [loading, setLoading] = useState(false);

  const client = useMemo(() => {
    if (!selectedCredit) return undefined;
    return clients.find((item) => item.id === selectedCredit.clienteId);
  }, [clients, selectedCredit]);

  const creditPayments = useMemo(() => {
    if (!selectedCredit) return [];
    return payments.filter(
      (payment) => payment.creditoId === selectedCredit.id && payment.estado !== 'anulado'
    );
  }, [payments, selectedCredit]);

  const totalPaid = creditPayments.reduce((total, payment) => total + payment.valorPagado, 0);

  useEffect(() => {
    if (!selectedCredit) return;

    setValorPrestado(String(selectedCredit.valorPrestado));
    setValorTotal(String(selectedCredit.valorTotal));
    setNumeroCuotas(String(selectedCredit.numeroCuotas));
    setFrecuencia(selectedCredit.frecuencia);
    setFechaInicio(selectedCredit.fechaInicio);
    setEstado(selectedCredit.estado === 'anulado' ? 'activo' : selectedCredit.estado);
  }, [selectedCredit]);

  if (!selectedCredit) {
    return (
      <View style={styles.root}>
        <TopBar title="Editar crédito" showBack onBack={() => navigate('credits')} />
        <Screen>
          <EmptyState title="Crédito no encontrado" message="Vuelve a créditos y selecciona uno." />
          <Button title="Volver a créditos" onPress={() => navigate('credits')} />
        </Screen>
        <BottomNav />
      </View>
    );
  }

  if (selectedCredit.estado === 'anulado') {
    return (
      <View style={styles.root}>
        <TopBar title="Editar crédito" showBack onBack={() => navigate('creditDetail')} />
        <Screen>
          <EmptyState title="Crédito anulado" message="No se puede editar un crédito anulado." />
          <Button title="Volver al detalle" onPress={() => navigate('creditDetail')} />
        </Screen>
        <BottomNav />
      </View>
    );
  }

  const prestadoNumber = parseMoney(valorPrestado);
  const totalNumber = parseMoney(valorTotal);
  const cuotasNumber = Number(numeroCuotas);
  const cuotaPreview = cuotasNumber > 0 && totalNumber > 0 ? Math.ceil(totalNumber / cuotasNumber) : 0;
  const saldoPreview = estado === 'pagado' ? 0 : Math.max(totalNumber - totalPaid, 0);

  const handleSave = async () => {
    if (!isPositiveMoney(prestadoNumber)) {
      Alert.alert('Valor inválido', 'El valor prestado debe ser mayor que cero.');
      return;
    }

    if (!isPositiveMoney(totalNumber)) {
      Alert.alert('Valor inválido', 'El valor total debe ser mayor que cero.');
      return;
    }

    if (totalNumber < prestadoNumber) {
      Alert.alert('Valor incorrecto', 'El valor total a pagar no puede ser menor que el valor prestado.');
      return;
    }

    if (totalNumber < totalPaid) {
      Alert.alert(
        'Valor total inválido',
        `Este crédito ya tiene pagos activos por ${formatMoney(totalPaid)}. El total no puede ser menor.`
      );
      return;
    }

    if (!isPositiveInteger(cuotasNumber)) {
      Alert.alert('Cuotas inválidas', 'El número de cuotas debe ser un entero mayor que cero.');
      return;
    }

    if (cuotasNumber > 365) {
      Alert.alert('Demasiadas cuotas', 'El número de cuotas no puede ser mayor a 365.');
      return;
    }

    if (!isValidDateKey(fechaInicio)) {
      Alert.alert('Fecha inválida', 'La fecha debe tener formato YYYY-MM-DD.');
      return;
    }

    setLoading(true);

    await updateCredit(selectedCredit.id, {
      valorPrestado: prestadoNumber,
      valorTotal: totalNumber,
      numeroCuotas: cuotasNumber,
      frecuencia,
      fechaInicio,
      estado
    });

    setLoading(false);
  };

  return (
    <View style={styles.root}>
      <TopBar title="Editar crédito" showBack onBack={() => navigate('creditDetail')} />
      <Screen>
        <Card style={styles.infoCard}>
          <Text style={styles.infoTitle}>Editando crédito</Text>
          <Text style={styles.infoText}>Cliente: {client?.nombre ?? 'Cliente no encontrado'}</Text>
          <Text style={styles.infoText}>Pagos activos registrados: {formatMoney(totalPaid)}</Text>
        </Card>

        <Card style={styles.formCard}>
          <Text style={styles.sectionTitle}>Datos del crédito</Text>

          <Input
            label="Valor prestado"
            icon="💵"
            value={valorPrestado}
            onChangeText={setValorPrestado}
            placeholder="Ej: 100000"
            keyboardType="numeric"
          />

          <Input
            label="Valor total a pagar"
            icon="💰"
            value={valorTotal}
            onChangeText={setValorTotal}
            placeholder="Ej: 120000"
            keyboardType="numeric"
          />

          <Input
            label="Número de cuotas"
            icon="🔢"
            value={numeroCuotas}
            onChangeText={setNumeroCuotas}
            placeholder="Ej: 12"
            keyboardType="numeric"
          />

          <Text style={styles.label}>Frecuencia</Text>
          <View style={styles.chipList}>
            {frequencies.map((item) => {
              const selected = item === frecuencia;

              return (
                <Pressable
                  key={item}
                  style={[styles.chip, selected ? styles.chipSelected : null]}
                  onPress={() => setFrecuencia(item)}
                >
                  <Text style={[styles.chipText, selected ? styles.chipTextSelected : null]}>
                    {item}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Input
            label="Fecha de inicio"
            icon="📅"
            value={fechaInicio}
            onChangeText={setFechaInicio}
            placeholder="YYYY-MM-DD"
          />

          <Text style={styles.label}>Estado</Text>
          <View style={styles.chipList}>
            {editableStatuses.map((item) => {
              const selected = item === estado;
              const danger = item === 'vencido';

              return (
                <Pressable
                  key={item}
                  style={[
                    styles.chip,
                    selected ? styles.chipSelected : null,
                    selected && danger ? styles.chipDangerSelected : null
                  ]}
                  onPress={() => setEstado(item)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selected ? styles.chipTextSelected : null,
                      selected && danger ? styles.chipDangerText : null
                    ]}
                  >
                    {item}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.previewBox}>
            <Text style={styles.previewTitle}>Vista previa</Text>
            <Text style={styles.previewText}>Valor cuota: {formatMoney(cuotaPreview)}</Text>
            <Text style={styles.previewText}>Pagado activo: {formatMoney(totalPaid)}</Text>
            <Text style={styles.previewText}>Nuevo saldo: {formatMoney(saldoPreview)}</Text>
          </View>

          <Button title="Guardar cambios" onPress={handleSave} loading={loading} />
        </Card>
      </Screen>
      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  infoCard: { backgroundColor: colors.primarySoft, marginBottom: 14 },
  infoTitle: { color: colors.primary, fontSize: 16, fontWeight: '900' },
  infoText: { color: colors.muted, marginTop: 5, lineHeight: 20, fontWeight: '700' },
  formCard: { marginBottom: 12 },
  sectionTitle: { color: colors.text, fontSize: 17, fontWeight: '900', marginBottom: 10 },
  label: { color: colors.text, fontWeight: '900', marginBottom: 8 },
  chipList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF'
  },
  chipSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  chipDangerSelected: { borderColor: colors.danger, backgroundColor: '#FFF5F5' },
  chipText: { color: colors.muted, fontWeight: '800' },
  chipTextSelected: { color: colors.primary },
  chipDangerText: { color: colors.danger },
  previewBox: { backgroundColor: colors.background, borderRadius: 14, padding: 12, marginBottom: 14 },
  previewTitle: { color: colors.text, fontWeight: '900', marginBottom: 6 },
  previewText: { color: colors.muted, fontWeight: '700', marginTop: 3 }
});
