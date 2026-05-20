import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { BottomNav } from '../components/BottomNav';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { Screen } from '../components/Screen';
import { StatusBadge } from '../components/StatusBadge';
import { TopBar } from '../components/TopBar';
import { useApp } from '../state/AppContext';
import { colors } from '../theme/colors';
import { Frequency } from '../types';
import { todayKey } from '../utils/date';
import { formatMoney } from '../utils/money';
import { isPositiveInteger, isPositiveMoney, isValidDateKey, parseMoney } from '../utils/validation';

type ParsedCredit = {
  cliente: string;
  telefono: string;
  clienteId: string;
  valorPrestado: number;
  valorTotal: number;
  cuotas: number;
  frecuencia: Frequency;
  fechaInicio: string;
  fechaFinal: string;
  porcentaje: number;
  nota: string;
  codeudorNombre: string;
  codeudorTelefono: string;
  codeudorCpf: string;
  valid: boolean;
  error: string;
  warning: string;
};

const allowedFrequencies: Frequency[] = ['Diaria', 'Semanal', 'Quincenal', 'Mensual', 'Personalizada'];

function normalize(value: unknown) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function splitCsvLine(line: string) {
  const result: string[] = [];
  let current = '';
  let insideQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && next === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      insideQuotes = !insideQuotes;
      continue;
    }

    if (char === ',' && !insideQuotes) {
      result.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  result.push(current.trim());

  return result;
}

function safeFrequency(value: string): Frequency {
  const found = allowedFrequencies.find((item) => normalize(item) === normalize(value));
  return found || 'Diaria';
}

function parseCreditsCsv(text: string, clients: ReturnType<typeof useApp>['clients'], credits: ReturnType<typeof useApp>['credits']): ParsedCredit[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) return [];

  const first = splitCsvLine(lines[0]).map((item) => normalize(item));
  const hasHeaders = first.includes('cliente') || first.includes('valorprestado') || first.includes('valortotal') || first.includes('cuotas');

  const headers = hasHeaders
    ? first
    : [
        'cliente',
        'telefono',
        'valorprestado',
        'valortotal',
        'cuotas',
        'frecuencia',
        'fechainicio',
        'fechafinal',
        'porcentaje',
        'nota',
        'codeudornombre',
        'codeudortelefono',
        'codeudorcpf'
      ];

  const dataLines = hasHeaders ? lines.slice(1) : lines;

  return dataLines.map((line) => {
    const values = splitCsvLine(line);
    const record: Record<string, string> = {};

    headers.forEach((header, index) => {
      record[normalize(header)] = values[index] || '';
    });

    const cliente = record.cliente || record.nombre || record.name || '';
    const telefono = record.telefono || record.celular || record.phone || '';
    const valorPrestadoRaw = record.valorprestado || record.prestado || record.monto || record.valor || '';
    const valorTotalRaw = record.valortotal || record.total || record.totalpagar || '';
    const cuotasRaw = record.cuotas || record.numerocuotas || record.cantidadcuotas || '';
    const frecuenciaRaw = record.frecuencia || record.tipocobro || 'Diaria';
    const fechaInicio = record.fechainicio || record.inicio || todayKey();
    const fechaFinal = record.fechafinal || record.final || '';
    const porcentajeRaw = record.porcentaje || record.interes || '';
    const nota = record.nota || record.observacion || '';
    const codeudorNombre = record.codeudornombre || record.codeudor || '';
    const codeudorTelefono = record.codeudortelefono || record.telefonocodeudor || '';
    const codeudorCpf = (record.codeudorcpf || record.cpf || '').replace(/[^0-9]/g, '');

    const valorPrestado = parseMoney(valorPrestadoRaw);
    const valorTotal = parseMoney(valorTotalRaw);
    const cuotas = Number(cuotasRaw);
    const porcentaje = Number(porcentajeRaw || 0);
    const frecuencia = safeFrequency(frecuenciaRaw);

    const foundClient = clients.find((client) => {
      const sameName = normalize(client.nombre) === normalize(cliente);
      const samePhone = telefono ? normalize(client.telefono) === normalize(telefono) : false;
      return sameName || samePhone;
    });

    const activeCredits = foundClient
      ? credits.filter(
          (credit) =>
            credit.clienteId === foundClient.id &&
            credit.estado !== 'pagado' &&
            credit.estado !== 'anulado' &&
            credit.saldoPendiente > 0
        )
      : [];

    let valid = true;
    let error = '';
    let warning = '';

    if (!cliente.trim() && !telefono.trim()) {
      valid = false;
      error = 'Falta cliente o telefono';
    } else if (!foundClient) {
      valid = false;
      error = 'Cliente no encontrado';
    } else if (!isPositiveMoney(valorPrestado)) {
      valid = false;
      error = 'Valor prestado invalido';
    } else if (!isPositiveMoney(valorTotal)) {
      valid = false;
      error = 'Valor total invalido';
    } else if (valorTotal < valorPrestado) {
      valid = false;
      error = 'Total menor que prestado';
    } else if (!isPositiveInteger(cuotas)) {
      valid = false;
      error = 'Cuotas invalidas';
    } else if (!isValidDateKey(fechaInicio)) {
      valid = false;
      error = 'Fecha inicio invalida';
    } else if (fechaFinal.trim() && !isValidDateKey(fechaFinal.trim())) {
      valid = false;
      error = 'Fecha final invalida';
    }

    if (activeCredits.length > 0) {
      warning = 'Cliente ya tiene credito activo';
    }

    return {
      cliente: cliente.trim(),
      telefono: telefono.trim(),
      clienteId: foundClient?.id || '',
      valorPrestado,
      valorTotal,
      cuotas,
      frecuencia,
      fechaInicio,
      fechaFinal: fechaFinal.trim(),
      porcentaje: Number.isFinite(porcentaje) ? porcentaje : 0,
      nota: nota.trim(),
      codeudorNombre: codeudorNombre.trim(),
      codeudorTelefono: codeudorTelefono.trim(),
      codeudorCpf,
      valid,
      error,
      warning
    };
  });
}

export function ImportCreditsScreen() {
  const { clients, credits, addCredit, navigate } = useApp();

  const [csvText, setCsvText] = useState('');
  const [loading, setLoading] = useState(false);

  const parsedCredits = useMemo(() => parseCreditsCsv(csvText, clients, credits), [clients, credits, csvText]);
  const validCredits = parsedCredits.filter((credit) => credit.valid);
  const invalidCredits = parsedCredits.filter((credit) => !credit.valid);
  const creditsWithWarning = validCredits.filter((credit) => credit.warning);
  const creditsToImport = validCredits;

  const totals = useMemo(() => {
    return {
      prestado: creditsToImport.reduce((total, item) => total + item.valorPrestado, 0),
      total: creditsToImport.reduce((total, item) => total + item.valorTotal, 0),
      cuotas: creditsToImport.reduce((total, item) => total + item.cuotas, 0)
    };
  }, [creditsToImport]);

  const importCredits = async () => {
    if (creditsToImport.length === 0) {
      Alert.alert('Sin creditos validos', 'No hay creditos validos para importar.');
      return;
    }

    Alert.alert(
      'Importar creditos',
      `Se van a importar ${creditsToImport.length} creditos. Valor prestado total: ${formatMoney(totals.prestado)}. Deseas continuar?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Importar',
          onPress: async () => {
            setLoading(true);

            for (const item of creditsToImport) {
              await (addCredit as any)({
                clienteId: item.clienteId,
                valorPrestado: item.valorPrestado,
                valorTotal: item.valorTotal,
                numeroCuotas: item.cuotas,
                frecuencia: item.frecuencia,
                fechaInicio: item.fechaInicio,
                fechaFinal: item.fechaFinal,
                porcentaje: item.porcentaje,
                tipoCobro: item.frecuencia,
                nota: item.nota,
                codeudorTiene: Boolean(item.codeudorNombre || item.codeudorTelefono || item.codeudorCpf),
                codeudorTipo: 'nuevo',
                codeudorClienteId: '',
                codeudorNombreCompleto: item.codeudorNombre,
                codeudorSobrenombre: '',
                codeudorCpf: item.codeudorCpf,
                codeudorDireccion: '',
                codeudorTelefono: item.codeudorTelefono,
                codeudorNota: ''
              });
            }

            setLoading(false);
            setCsvText('');

            Alert.alert('Importacion completada', 'Los creditos fueron importados correctamente.');
          }
        }
      ]
    );
  };

  return (
    <View style={styles.root}>
      <TopBar title="Importar creditos" showBack onBack={() => navigate('more')} />

      <Screen>
        <Card style={styles.heroCard}>
          <Text style={styles.heroTitle}>Importar creditos desde Excel/CSV</Text>
          <Text style={styles.heroText}>
            Copia los creditos desde Excel y pegalos aqui. Los clientes deben existir antes de importar creditos.
          </Text>
        </Card>

        <Card style={styles.formatCard}>
          <Text style={styles.formatTitle}>Formato recomendado</Text>
          <Text style={styles.formatText}>cliente,telefono,valorPrestado,valorTotal,cuotas,frecuencia,fechaInicio,fechaFinal,porcentaje,nota,codeudorNombre,codeudorTelefono,codeudorCpf</Text>
          <Text style={styles.formatText}>Juan Perez,3001234567,100000,120000,12,Diaria,2026-05-19,2026-05-31,20,Credito inicial,Pedro Perez,3005555555,123456789</Text>
        </Card>

        <Text style={styles.label}>Contenido CSV</Text>

        <TextInput
          value={csvText}
          onChangeText={setCsvText}
          placeholder="Pega aqui los creditos copiados desde Excel"
          placeholderTextColor={colors.muted}
          multiline
          textAlignVertical="top"
          style={styles.textArea}
        />

        <View style={styles.grid}>
          <Metric title="Leidos" value={String(parsedCredits.length)} />
          <Metric title="Validos" value={String(validCredits.length)} />
        </View>

        <View style={styles.grid}>
          <Metric title="Advertencias" value={String(creditsWithWarning.length)} danger={creditsWithWarning.length > 0} />
          <Metric title="Con error" value={String(invalidCredits.length)} danger={invalidCredits.length > 0} />
        </View>

        <View style={styles.grid}>
          <Metric title="Prestado" value={formatMoney(totals.prestado)} />
          <Metric title="Total a pagar" value={formatMoney(totals.total)} />
        </View>

        <Card style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Resumen</Text>
          <Text style={styles.summaryText}>Clientes existentes: {clients.length}</Text>
          <Text style={styles.summaryText}>Creditos existentes: {credits.length}</Text>
          <Text style={styles.summaryText}>Creditos nuevos para importar: {creditsToImport.length}</Text>
          <Text style={styles.summaryText}>Cuotas totales a crear: {totals.cuotas}</Text>
        </Card>

        <Button title="Importar creditos" onPress={importCredits} loading={loading} />

        <Text style={styles.blockTitle}>Vista previa</Text>

        {parsedCredits.length === 0 ? (
          <EmptyState title="Sin datos" message="Pega datos CSV para ver la vista previa." />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.previewTable}>
              {parsedCredits.map((item, index) => (
                <Card key={`${item.cliente}-${index}`} style={styles.previewCard}>
                  <View style={styles.previewHeader}>
                    <Text style={styles.previewTitle}>{index + 1}. {item.cliente || 'Sin cliente'}</Text>
                    <StatusBadge
                      type={!item.valid ? 'danger' : item.warning ? 'warning' : 'success'}
                      label={!item.valid ? 'Error' : item.warning ? 'Advertencia' : 'Listo'}
                    />
                  </View>

                  <Text style={styles.previewText}>Telefono: {item.telefono || 'Sin telefono'}</Text>
                  <Text style={styles.previewText}>Cliente ID: {item.clienteId || 'No encontrado'}</Text>
                  <Text style={styles.previewText}>Prestado: {formatMoney(item.valorPrestado)}</Text>
                  <Text style={styles.previewText}>Total: {formatMoney(item.valorTotal)}</Text>
                  <Text style={styles.previewText}>Cuotas: {item.cuotas}</Text>
                  <Text style={styles.previewText}>Frecuencia: {item.frecuencia}</Text>
                  <Text style={styles.previewText}>Inicio: {item.fechaInicio}</Text>
                  <Text style={styles.previewText}>Final: {item.fechaFinal || 'Sin fecha final'}</Text>
                  <Text style={styles.previewText}>Porcentaje: {item.porcentaje}%</Text>
                  <Text style={styles.previewText}>Codeudor: {item.codeudorNombre || 'Sin codeudor'}</Text>

                  {!item.valid ? <Text style={styles.errorText}>{item.error}</Text> : null}
                  {item.warning ? <Text style={styles.warningText}>{item.warning}</Text> : null}
                </Card>
              ))}
            </View>
          </ScrollView>
        )}
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
    lineHeight: 20,
    fontWeight: '700'
  },
  formatCard: {
    backgroundColor: '#FFF8E1',
    marginBottom: 12
  },
  formatTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 6
  },
  formatText: {
    color: colors.muted,
    fontWeight: '800',
    marginTop: 4,
    lineHeight: 20
  },
  label: {
    color: colors.text,
    fontWeight: '900',
    marginBottom: 8
  },
  textArea: {
    minHeight: 180,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 14,
    backgroundColor: '#FFFFFF',
    color: colors.text,
    fontWeight: '700',
    marginBottom: 12
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
    fontSize: 18,
    marginTop: 6
  },
  danger: {
    color: colors.danger
  },
  summaryCard: {
    marginBottom: 12
  },
  summaryTitle: {
    color: colors.text,
    fontWeight: '900',
    fontSize: 16
  },
  summaryText: {
    color: colors.muted,
    fontWeight: '700',
    marginTop: 5
  },
  blockTitle: {
    color: colors.text,
    fontWeight: '900',
    fontSize: 18,
    marginTop: 16,
    marginBottom: 10
  },
  previewTable: {
    minWidth: 330,
    paddingBottom: 20
  },
  previewCard: {
    width: 330,
    marginBottom: 10
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10
  },
  previewTitle: {
    color: colors.text,
    fontWeight: '900',
    fontSize: 15,
    flex: 1
  },
  previewText: {
    color: colors.muted,
    fontWeight: '700',
    marginTop: 5,
    lineHeight: 20
  },
  errorText: {
    color: colors.danger,
    fontWeight: '900',
    marginTop: 8
  },
  warningText: {
    color: colors.warning,
    fontWeight: '900',
    marginTop: 8
  }
});