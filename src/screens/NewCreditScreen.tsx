import React, { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Screen } from '../components/Screen';
import { TopBar } from '../components/TopBar';
import { useApp } from '../state/AppContext';
import { colors } from '../theme/colors';
import { Frequency } from '../types';
import { todayKey } from '../utils/date';
import { parseMoney, formatMoney } from '../utils/money';

const frequencies: Frequency[] = ['Diaria', 'Semanal', 'Quincenal', 'Mensual'];

export function NewCreditScreen() {
  const { clients, addCredit } = useApp();
  const [clienteId, setClienteId] = useState(clients[0]?.id ?? '');
  const [valorPrestado, setValorPrestado] = useState('');
  const [valorTotal, setValorTotal] = useState('');
  const [numeroCuotas, setNumeroCuotas] = useState('');
  const [frecuencia, setFrecuencia] = useState<Frequency>('Diaria');
  const [fechaInicio, setFechaInicio] = useState(todayKey());

  const cuotaPreview = useMemo(() => {
    const total = parseMoney(valorTotal);
    const cuotas = Number(numeroCuotas || 0);
    return cuotas > 0 ? Math.ceil(total / cuotas) : 0;
  }, [numeroCuotas, valorTotal]);

  const save = () => {
    const prestado = parseMoney(valorPrestado);
    const total = parseMoney(valorTotal);
    const cuotas = Number(numeroCuotas);
    if (!clienteId || prestado <= 0 || total <= 0 || cuotas <= 0) {
      Alert.alert('Datos incompletos', 'Selecciona cliente y completa valores mayores a cero.');
      return;
    }
    addCredit({ clienteId, valorPrestado: prestado, valorTotal: total, numeroCuotas: cuotas, frecuencia, fechaInicio });
  };

  return (
    <View style={styles.root}>
      <TopBar title="Nuevo credito" showBack />
      <Screen withBottomNav={false}>
        <Text style={styles.label}>Cliente</Text>
        <View style={styles.clientList}>
          {clients.map((client) => (
            <Pressable key={client.id} style={[styles.clientOption, clienteId === client.id ? styles.selected : null]} onPress={() => setClienteId(client.id)}>
              <Text style={[styles.clientText, clienteId === client.id ? styles.selectedText : null]}>{client.nombre}</Text>
              <Text style={[styles.clientPhone, clienteId === client.id ? styles.selectedText : null]}>{client.telefono}</Text>
            </Pressable>
          ))}
        </View>

        <Input label="Valor prestado" icon="$" value={valorPrestado} onChangeText={setValorPrestado} keyboardType="numeric" placeholder="Ej: 500000" />
        <Input label="Valor total a pagar" icon="$" value={valorTotal} onChangeText={setValorTotal} keyboardType="numeric" placeholder="Ej: 650000" />
        <Input label="Numero de cuotas" icon="🧮" value={numeroCuotas} onChangeText={setNumeroCuotas} keyboardType="numeric" placeholder="Ej: 13" />

        <Text style={styles.label}>Frecuencia</Text>
        <View style={styles.frequencyRow}>
          {frequencies.map((item) => (
            <Pressable key={item} style={[styles.chip, frecuencia === item ? styles.selectedChip : null]} onPress={() => setFrecuencia(item)}>
              <Text style={[styles.chipText, frecuencia === item ? styles.selectedChipText : null]}>{item}</Text>
            </Pressable>
          ))}
        </View>

        <Input label="Fecha de inicio" icon="📅" value={fechaInicio} onChangeText={setFechaInicio} placeholder="YYYY-MM-DD" />

        <Card style={styles.preview}>
          <Text style={styles.previewTitle}>Calculo automatico</Text>
          <Text style={styles.previewText}>Cuota aproximada: {formatMoney(cuotaPreview)}</Text>
          <Text style={styles.previewText}>El saldo se actualizara con cada pago registrado.</Text>
        </Card>

        <Button title="Crear credito" onPress={save} style={styles.button} />
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  label: { color: colors.text, fontWeight: '900', marginBottom: 8, marginTop: 4 },
  clientList: { gap: 8, marginBottom: 16 },
  clientOption: { padding: 12, backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border },
  selected: { backgroundColor: colors.primary, borderColor: colors.primary },
  clientText: { color: colors.text, fontWeight: '900' },
  clientPhone: { color: colors.muted, marginTop: 2, fontSize: 12 },
  selectedText: { color: '#FFFFFF' },
  frequencyRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 999, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  selectedChip: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontWeight: '800', fontSize: 12 },
  selectedChipText: { color: '#FFFFFF' },
  preview: { marginTop: 2, marginBottom: 14, backgroundColor: colors.primarySoft },
  previewTitle: { color: colors.primary, fontSize: 15, fontWeight: '900' },
  previewText: { color: colors.muted, marginTop: 5, fontWeight: '700' },
  button: { marginTop: 4 }
});
