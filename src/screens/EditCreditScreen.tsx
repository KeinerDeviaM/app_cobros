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
import { formatMoney } from '../utils/money';
import { isPositiveInteger, isPositiveMoney, isValidDateKey, parseMoney } from '../utils/validation';

const frequencies: Frequency[] = ['Diaria', 'Semanal', 'Quincenal', 'Mensual', 'Personalizada'];

export function EditCreditScreen() {
  const app = useApp() as any;

  const {
    selectedCredit,
    clients,
    updateCredit,
    navigate
  } = app;

  const [valorPrestado, setValorPrestado] = useState('');
  const [valorTotal, setValorTotal] = useState('');
  const [numeroCuotas, setNumeroCuotas] = useState('');
  const [frecuencia, setFrecuencia] = useState<Frequency>('Diaria');
  const [fechaInicio, setFechaInicio] = useState('');
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

  const client = useMemo(() => {
    if (!selectedCredit) return undefined;
    return clients.find((item: any) => item.id === selectedCredit.clienteId);
  }, [clients, selectedCredit]);

  useEffect(() => {
    if (!selectedCredit) return;

    setValorPrestado(String(selectedCredit.valorPrestado || ''));
    setValorTotal(String(selectedCredit.valorTotal || ''));
    setNumeroCuotas(String(selectedCredit.numeroCuotas || ''));
    setFrecuencia(selectedCredit.frecuencia || 'Diaria');
    setFechaInicio(selectedCredit.fechaInicio || '');
    setFechaFinal(selectedCredit.fechaFinal || '');
    setPorcentaje(String(selectedCredit.porcentaje || ''));
    setNota(selectedCredit.nota || '');
    setCodeudorTiene(Boolean(selectedCredit.codeudorTiene));
    setCodeudorClienteId(selectedCredit.codeudorClienteId || '');
    setCodeudorNombreCompleto(selectedCredit.codeudorNombreCompleto || '');
    setCodeudorSobrenombre(selectedCredit.codeudorSobrenombre || '');
    setCodeudorCpf(selectedCredit.codeudorCpf || '');
    setCodeudorDireccion(selectedCredit.codeudorDireccion || '');
    setCodeudorTelefono(selectedCredit.codeudorTelefono || '');
    setCodeudorNota(selectedCredit.codeudorNota || '');
  }, [selectedCredit]);

  if (!selectedCredit) {
    return (
      <View style={styles.root}>
        <TopBar title="Editar credito" showBack onBack={() => navigate('creditDetail')} />

        <Screen>
          <EmptyState title="Credito no encontrado" message="Vuelve al detalle del credito y selecciona editar." />
          <Button title="Volver a creditos" onPress={() => navigate('credits')} />
        </Screen>

        <BottomNav />
      </View>
    );
  }

  const prestadoNumber = parseMoney(valorPrestado);
  const totalNumber = parseMoney(valorTotal);
  const cuotasNumber = Number(numeroCuotas);
  const cuotaPreview = cuotasNumber > 0 && totalNumber > 0 ? Math.ceil(totalNumber / cuotasNumber) : 0;
  const totalPagado = Math.max(0, Number(selectedCredit.valorTotal || 0) - Number(selectedCredit.saldoPendiente || 0));
  const nuevoSaldo = Math.max(0, totalNumber - totalPagado);

  const selectCodeudorClient = (id: string) => {
    setCodeudorClienteId(id);

    const codeudor = clients.find((item: any) => item.id === id);

    if (codeudor) {
      setCodeudorNombreCompleto(codeudor.nombre);
      setCodeudorDireccion(codeudor.direccion);
      setCodeudorTelefono(codeudor.telefono);
    }
  };

  const save = async () => {
    if (typeof updateCredit !== 'function') {
      Alert.alert('Funcion no conectada', 'Falta conectar updateCredit en AppContext.');
      return;
    }

    if (!isPositiveMoney(prestadoNumber)) {
      Alert.alert('Valor invalido', 'El valor prestado debe ser mayor que cero.');
      return;
    }

    if (!isPositiveMoney(totalNumber)) {
      Alert.alert('Valor invalido', 'El valor total a pagar debe ser mayor que cero.');
      return;
    }

    if (totalNumber < prestadoNumber) {
      Alert.alert('Valor incorrecto', 'El valor total a pagar no puede ser menor que el valor prestado.');
      return;
    }

    if (!isPositiveInteger(cuotasNumber)) {
      Alert.alert('Cuotas invalidas', 'El numero de cuotas debe ser mayor que cero.');
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

    setLoading(true);

    await updateCredit(selectedCredit.id, {
      valorPrestado: prestadoNumber,
      valorTotal: totalNumber,
      saldoPendiente: nuevoSaldo,
      numeroCuotas: cuotasNumber,
      valorCuota: cuotaPreview,
      frecuencia,
      tipoCobro: frecuencia,
      fechaInicio,
      fechaFinal: fechaFinal.trim(),
      porcentaje: Number(porcentaje || 0),
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
      <TopBar title="Editar credito" showBack onBack={() => navigate('creditDetail')} />

      <Screen>
        <Card style={styles.heroCard}>
          <Text style={styles.heroTitle}>{client?.nombre || 'Cliente no encontrado'}</Text>
          <Text style={styles.heroText}>Credito: {selectedCredit.id}</Text>
          <Text style={styles.heroText}>Pagado actual: {formatMoney(totalPagado)}</Text>
          <Text style={styles.heroText}>Saldo nuevo calculado: {formatMoney(nuevoSaldo)}</Text>
        </Card>

        <Card style={styles.formCard}>
          <Text style={styles.sectionTitle}>Datos del credito</Text>

          <Input label="Valor prestado" icon="$" value={valorPrestado} onChangeText={setValorPrestado} keyboardType="numeric" />
          <Input label="Valor total a pagar" icon="$" value={valorTotal} onChangeText={setValorTotal} keyboardType="numeric" />
          <Input label="Numero de cuotas" icon="#" value={numeroCuotas} onChangeText={setNumeroCuotas} keyboardType="numeric" />

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

          <Input label="Fecha inicio" icon="I" value={fechaInicio} onChangeText={setFechaInicio} placeholder="YYYY-MM-DD" />
          <Input label="Fecha final" icon="F" value={fechaFinal} onChangeText={setFechaFinal} placeholder="YYYY-MM-DD opcional" />
          <Input label="Porcentaje" icon="%" value={porcentaje} onChangeText={setPorcentaje} keyboardType="numeric" />
          <Input label="Nota del credito" icon="N" value={nota} onChangeText={setNota} placeholder="Nota opcional" />

          <View style={styles.previewBox}>
            <Text style={styles.previewTitle}>Vista previa</Text>
            <Text style={styles.previewText}>Valor cuota nuevo: {formatMoney(cuotaPreview)}</Text>
            <Text style={styles.previewText}>Total pagado actual: {formatMoney(totalPagado)}</Text>
            <Text style={styles.previewText}>Saldo pendiente nuevo: {formatMoney(nuevoSaldo)}</Text>
          </View>
        </Card>

        <Card style={styles.formCard}>
          <Text style={styles.sectionTitle}>Codeudor</Text>

          <View style={styles.chipList}>
            <Pressable style={[styles.chip, !codeudorTiene ? styles.chipSelected : null]} onPress={() => setCodeudorTiene(false)}>
              <Text style={[styles.chipText, !codeudorTiene ? styles.chipTextSelected : null]}>Sin codeudor</Text>
            </Pressable>

            <Pressable style={[styles.chip, codeudorTiene ? styles.chipSelected : null]} onPress={() => setCodeudorTiene(true)}>
              <Text style={[styles.chipText, codeudorTiene ? styles.chipTextSelected : null]}>Con codeudor</Text>
            </Pressable>
          </View>

          {codeudorTiene ? (
            <>
              <Text style={styles.label}>Cliente existente o nuevo</Text>

              <View style={styles.chipList}>
                <Pressable style={[styles.chip, codeudorClienteId === '' ? styles.chipSelected : null]} onPress={() => setCodeudorClienteId('')}>
                  <Text style={[styles.chipText, codeudorClienteId === '' ? styles.chipTextSelected : null]}>Nuevo</Text>
                </Pressable>

                {clients
                  .filter((item: any) => item.id !== selectedCredit.clienteId)
                  .map((item: any) => (
                    <Pressable key={item.id} style={[styles.chip, codeudorClienteId === item.id ? styles.chipSelected : null]} onPress={() => selectCodeudorClient(item.id)}>
                      <Text style={[styles.chipText, codeudorClienteId === item.id ? styles.chipTextSelected : null]}>{item.nombre}</Text>
                    </Pressable>
                  ))}
              </View>

              <Input label="Nombre completo" icon="C" value={codeudorNombreCompleto} onChangeText={setCodeudorNombreCompleto} />
              <Input label="Sobrenombre" icon="S" value={codeudorSobrenombre} onChangeText={setCodeudorSobrenombre} />
              <Input label="CPF solo numeros" icon="D" value={codeudorCpf} onChangeText={(value) => setCodeudorCpf(value.replace(/[^0-9]/g, ''))} keyboardType="numeric" />
              <Input label="Direccion" icon="U" value={codeudorDireccion} onChangeText={setCodeudorDireccion} />
              <Input label="Telefono" icon="T" value={codeudorTelefono} onChangeText={setCodeudorTelefono} keyboardType="phone-pad" />
              <Input label="Nota codeudor" icon="N" value={codeudorNota} onChangeText={setCodeudorNota} />
            </>
          ) : (
            <Text style={styles.emptyText}>Este credito quedara sin codeudor.</Text>
          )}
        </Card>

        <Button title="Guardar cambios del credito" onPress={save} loading={loading} />
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
    opacity: 0.9,
    marginTop: 6,
    fontWeight: '700'
  },
  formCard: {
    marginBottom: 12
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 10
  },
  label: {
    color: colors.text,
    fontWeight: '900',
    marginBottom: 8
  },
  chipList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF'
  },
  chipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft
  },
  chipText: {
    color: colors.muted,
    fontWeight: '800'
  },
  chipTextSelected: {
    color: colors.primary
  },
  previewBox: {
    backgroundColor: colors.background,
    borderRadius: 14,
    padding: 12,
    marginBottom: 4
  },
  previewTitle: {
    color: colors.text,
    fontWeight: '900',
    marginBottom: 6
  },
  previewText: {
    color: colors.muted,
    fontWeight: '700',
    marginTop: 3
  },
  emptyText: {
    color: colors.muted,
    fontWeight: '700',
    lineHeight: 20
  }
});