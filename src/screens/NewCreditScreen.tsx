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
import { Frequency } from '../types';
import { todayKey } from '../utils/date';
import { formatMoney } from '../utils/money';
import { isPositiveInteger, isPositiveMoney, isValidDateKey, parseMoney } from '../utils/validation';

const frequencies: Frequency[] = ['Diaria', 'Semanal', 'Quincenal', 'Mensual', 'Personalizada'];

export function NewCreditScreen() {
  const { clients, credits, addCredit, navigate } = useApp();

  const [clienteId, setClienteId] = useState('');
  const [valorPrestado, setValorPrestado] = useState('');
  const [valorTotal, setValorTotal] = useState('');
  const [numeroCuotas, setNumeroCuotas] = useState('');
  const [frecuencia, setFrecuencia] = useState<Frequency>('Diaria');
  const [fechaInicio, setFechaInicio] = useState(todayKey());
  const [fechaFinal, setFechaFinal] = useState('');
  const [porcentaje, setPorcentaje] = useState('');
  const [nota, setNota] = useState('');
  const [codeudorTiene, setCodeudorTiene] = useState(false);
  const [codeudorClienteId, setCodeudorClienteId] = useState('');
  const [codeudorNombreCompleto, setCodeudorNombreCompleto] = useState('');
  const [codeudorSobrenombre, setCodeudorSobrenombre] = useState('');
  const [codeudorCpf, setCodeudorCpf] = useState('');
  const [codeudorDireccion, setCodeudorDireccion] = useState('');
  const [codeudorTelefono, setCodeudorTelefono] = useState('');
  const [codeudorNota, setCodeudorNota] = useState('');
  const [loading, setLoading] = useState(false);

  const selectedClient = useMemo(() => {
    return clients.find((client) => client.id === clienteId);
  }, [clienteId, clients]);

  const selectedClientActiveCredits = useMemo(() => {
    if (!selectedClient) return [];

    return credits.filter(
      (credit) =>
        credit.clienteId === selectedClient.id &&
        credit.estado !== 'pagado' &&
        credit.estado !== 'anulado' &&
        credit.saldoPendiente > 0
    );
  }, [credits, selectedClient]);

  useEffect(() => {
    if (!clienteId && clients.length > 0) {
      setClienteId(clients[0].id);
    }
  }, [clienteId, clients]);

  const prestadoNumber = parseMoney(valorPrestado);
  const totalNumber = parseMoney(valorTotal);
  const cuotasNumber = Number(numeroCuotas);
  const cuotaPreview = cuotasNumber > 0 && totalNumber > 0 ? Math.ceil(totalNumber / cuotasNumber) : 0;
  const porcentajeNumber = Number(porcentaje || 0);

  const selectCodeudorClient = (id: string) => {
    setCodeudorClienteId(id);

    const client = clients.find((item) => item.id === id);

    if (client) {
      setCodeudorNombreCompleto(client.nombre);
      setCodeudorDireccion(client.direccion);
      setCodeudorTelefono(client.telefono);
    }
  };

  const handleSubmit = async () => {
    if (!clienteId) {
      Alert.alert('Selecciona cliente', 'Debes seleccionar el cliente del credito.');
      return;
    }

    if (!isPositiveMoney(prestadoNumber)) {
      Alert.alert('Valor invalido', 'El valor prestado debe ser mayor que cero.');
      return;
    }

    if (!isPositiveMoney(totalNumber)) {
      Alert.alert('Valor invalido', 'El valor total debe ser mayor que cero.');
      return;
    }

    if (totalNumber < prestadoNumber) {
      Alert.alert('Valor incorrecto', 'El valor total a pagar no puede ser menor que el valor prestado.');
      return;
    }

    if (!isPositiveInteger(cuotasNumber)) {
      Alert.alert('Cuotas invalidas', 'El numero de cuotas debe ser un entero mayor que cero.');
      return;
    }

    if (cuotasNumber > 365) {
      Alert.alert('Demasiadas cuotas', 'El numero de cuotas no puede ser mayor a 365.');
      return;
    }

    if (!isValidDateKey(fechaInicio)) {
      Alert.alert('Fecha invalida', 'La fecha de inicio debe tener formato YYYY-MM-DD.');
      return;
    }

    if (fechaFinal.trim() && !isValidDateKey(fechaFinal.trim())) {
      Alert.alert('Fecha invalida', 'La fecha final debe tener formato YYYY-MM-DD.');
      return;
    }

    if (selectedClientActiveCredits.length > 0) {
      Alert.alert(
        'Cliente con credito activo',
        'Este cliente ya tiene credito activo. Puedes continuar, pero revisa que no estes duplicando la deuda.',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Crear credito',
            onPress: () => saveCredit()
          }
        ]
      );
      return;
    }

    await saveCredit();
  };

  const saveCredit = async () => {
    setLoading(true);

    await addCredit({
      clienteId,
      valorPrestado: prestadoNumber,
      valorTotal: totalNumber,
      numeroCuotas: cuotasNumber,
      frecuencia,
      fechaInicio,
      fechaFinal: fechaFinal.trim(),
      porcentaje: Number.isFinite(porcentajeNumber) ? porcentajeNumber : 0,
      tipoCobro: frecuencia,
      nota: nota.trim(),
      codeudorTiene,
      codeudorTipo: codeudorClienteId ? 'cliente' : 'nuevo',
      codeudorClienteId,
      codeudorNombreCompleto: codeudorNombreCompleto.trim(),
      codeudorSobrenombre: codeudorSobrenombre.trim(),
      codeudorCpf: codeudorCpf.replace(/[^0-9]/g, ''),
      codeudorDireccion: codeudorDireccion.trim(),
      codeudorTelefono: codeudorTelefono.trim(),
      codeudorNota: codeudorNota.trim()
    });

    setLoading(false);
  };

  return (
    <View style={styles.root}>
      <TopBar title="Nuevo credito" showBack onBack={() => navigate('credits')} />

      <Screen>
        <Text style={styles.sectionTitle}>Selecciona cliente</Text>

        {clients.length === 0 ? (
          <EmptyState title="Sin clientes" message="Primero debes crear un cliente." />
        ) : (
          clients.map((client) => {
            const selected = client.id === clienteId;

            return (
              <Pressable
                key={client.id}
                style={[styles.clientOption, selected ? styles.clientSelected : null]}
                onPress={() => setClienteId(client.id)}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{client.nombre.charAt(0).toUpperCase()}</Text>
                </View>

                <View style={styles.clientInfo}>
                  <Text style={[styles.clientName, selected ? styles.clientNameSelected : null]}>
                    {client.nombre}
                  </Text>
                  <Text style={styles.clientMeta}>{client.telefono}</Text>
                  <Text style={styles.clientMeta}>{client.direccion}</Text>
                </View>
              </Pressable>
            );
          })
        )}

        {selectedClientActiveCredits.length > 0 ? (
          <Card style={styles.warningCard}>
            <Text style={styles.warningTitle}>Cliente con credito activo</Text>
            <Text style={styles.warningText}>
              Este cliente tiene {selectedClientActiveCredits.length} credito(s) activo(s). Revisa antes de crear otro.
            </Text>
          </Card>
        ) : null}

        <Card style={styles.formCard}>
          <Text style={styles.sectionTitle}>Datos del credito</Text>

          <Input label="Valor prestado" icon="$" value={valorPrestado} onChangeText={setValorPrestado} placeholder="Ej: 100000" keyboardType="numeric" />
          <Input label="Valor total a pagar" icon="$" value={valorTotal} onChangeText={setValorTotal} placeholder="Ej: 120000" keyboardType="numeric" />
          <Input label="Numero de cuotas" icon="#" value={numeroCuotas} onChangeText={setNumeroCuotas} placeholder="Ej: 12" keyboardType="numeric" />

          <Text style={styles.label}>Frecuencia</Text>

          <View style={styles.chipList}>
            {frequencies.map((item) => {
              const selected = item === frecuencia;

              return (
                <Pressable key={item} style={[styles.chip, selected ? styles.chipSelected : null]} onPress={() => setFrecuencia(item)}>
                  <Text style={[styles.chipText, selected ? styles.chipTextSelected : null]}>{item}</Text>
                </Pressable>
              );
            })}
          </View>

          <Input label="Fecha de inicio" icon="I" value={fechaInicio} onChangeText={setFechaInicio} placeholder="YYYY-MM-DD" />
          <Input label="Fecha final" icon="F" value={fechaFinal} onChangeText={setFechaFinal} placeholder="YYYY-MM-DD opcional" />
          <Input label="Porcentaje" icon="%" value={porcentaje} onChangeText={setPorcentaje} placeholder="Ej: 20" keyboardType="numeric" />
          <Input label="Nota del credito" icon="N" value={nota} onChangeText={setNota} placeholder="Nota opcional" />

          <Text style={styles.label}>Codeudor</Text>

          <View style={styles.chipList}>
            <Pressable style={[styles.chip, !codeudorTiene ? styles.chipSelected : null]} onPress={() => setCodeudorTiene(false)}>
              <Text style={[styles.chipText, !codeudorTiene ? styles.chipTextSelected : null]}>Sin codeudor</Text>
            </Pressable>

            <Pressable style={[styles.chip, codeudorTiene ? styles.chipSelected : null]} onPress={() => setCodeudorTiene(true)}>
              <Text style={[styles.chipText, codeudorTiene ? styles.chipTextSelected : null]}>Con codeudor</Text>
            </Pressable>
          </View>

          {codeudorTiene ? (
            <Card style={styles.codebtorCard}>
              <Text style={styles.sectionTitle}>Datos del codeudor</Text>

              <Text style={styles.label}>Codeudor existente o nuevo</Text>

              <View style={styles.chipList}>
                <Pressable style={[styles.chip, codeudorClienteId === '' ? styles.chipSelected : null]} onPress={() => setCodeudorClienteId('')}>
                  <Text style={[styles.chipText, codeudorClienteId === '' ? styles.chipTextSelected : null]}>Nuevo</Text>
                </Pressable>

                {clients
                  .filter((client) => client.id !== clienteId)
                  .map((client) => (
                    <Pressable
                      key={client.id}
                      style={[styles.chip, codeudorClienteId === client.id ? styles.chipSelected : null]}
                      onPress={() => selectCodeudorClient(client.id)}
                    >
                      <Text style={[styles.chipText, codeudorClienteId === client.id ? styles.chipTextSelected : null]}>
                        {client.nombre}
                      </Text>
                    </Pressable>
                  ))}
              </View>

              <Input label="Nombre completo" icon="C" value={codeudorNombreCompleto} onChangeText={setCodeudorNombreCompleto} placeholder="Nombre del codeudor" />
              <Input label="Sobrenombre" icon="S" value={codeudorSobrenombre} onChangeText={setCodeudorSobrenombre} placeholder="Sobrenombre opcional" />
              <Input label="CPF solo numeros" icon="D" value={codeudorCpf} onChangeText={(value) => setCodeudorCpf(value.replace(/[^0-9]/g, ''))} placeholder="CPF" keyboardType="numeric" />
              <Input label="Direccion" icon="U" value={codeudorDireccion} onChangeText={setCodeudorDireccion} placeholder="Direccion del codeudor" />
              <Input label="Telefono" icon="T" value={codeudorTelefono} onChangeText={setCodeudorTelefono} placeholder="Telefono del codeudor" keyboardType="phone-pad" />
              <Input label="Nota codeudor" icon="N" value={codeudorNota} onChangeText={setCodeudorNota} placeholder="Nota opcional" />
            </Card>
          ) : null}

          <View style={styles.previewBox}>
            <Text style={styles.previewTitle}>Vista previa</Text>
            <Text style={styles.previewText}>Valor cuota: {formatMoney(cuotaPreview)}</Text>
            <Text style={styles.previewText}>Total a pagar: {formatMoney(totalNumber)}</Text>
            <Text style={styles.previewText}>Saldo inicial: {formatMoney(totalNumber)}</Text>
            <Text style={styles.previewText}>Codeudor: {codeudorTiene ? codeudorNombreCompleto || 'Pendiente por llenar' : 'No aplica'}</Text>
          </View>

          <Button title="Crear credito" onPress={handleSubmit} loading={loading} />
        </Card>
      </Screen>

      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  sectionTitle: { color: colors.text, fontSize: 17, fontWeight: '900', marginBottom: 10 },
  clientOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 12,
    marginBottom: 10,
    backgroundColor: '#FFFFFF'
  },
  clientSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarText: { color: colors.primary, fontSize: 18, fontWeight: '900' },
  clientInfo: { flex: 1 },
  clientName: { color: colors.text, fontWeight: '900', fontSize: 15 },
  clientNameSelected: { color: colors.primary },
  clientMeta: { color: colors.muted, fontWeight: '700', marginTop: 3, fontSize: 12 },
  warningCard: { backgroundColor: '#FFF8E1', marginBottom: 12 },
  warningTitle: { color: colors.text, fontWeight: '900', fontSize: 16 },
  warningText: { color: colors.muted, marginTop: 6, lineHeight: 20, fontWeight: '700' },
  formCard: { marginTop: 8 },
  codebtorCard: { backgroundColor: colors.primarySoft, marginBottom: 14 },
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
  chipText: { color: colors.muted, fontWeight: '800' },
  chipTextSelected: { color: colors.primary },
  previewBox: { backgroundColor: colors.background, borderRadius: 14, padding: 12, marginBottom: 14 },
  previewTitle: { color: colors.text, fontWeight: '900', marginBottom: 6 },
  previewText: { color: colors.muted, fontWeight: '700', marginTop: 3 }
});