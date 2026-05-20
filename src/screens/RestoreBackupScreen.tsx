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

type BackupSummary = {
  valid: boolean;
  error: string;
  clientes: any[];
  creditos: any[];
  rutas: any[];
  gastos: any[];
  pagos: any[];
  cierres: any[];
};

function normalize(value: unknown) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function readArray(source: any, keys: string[]) {
  for (const key of keys) {
    if (Array.isArray(source?.[key])) return source[key];
  }

  return [];
}

function parseBackup(text: string): BackupSummary {
  if (!text.trim()) {
    return {
      valid: false,
      error: '',
      clientes: [],
      creditos: [],
      rutas: [],
      gastos: [],
      pagos: [],
      cierres: []
    };
  }

  try {
    const json = JSON.parse(text);

    const data = json?.data || json?.backup || json;

    return {
      valid: true,
      error: '',
      clientes: readArray(data, ['clientes', 'clients']),
      creditos: readArray(data, ['creditos', 'credits']),
      rutas: readArray(data, ['rutas', 'routes']),
      gastos: readArray(data, ['gastos', 'expenses']),
      pagos: readArray(data, ['pagos', 'payments']),
      cierres: readArray(data, ['cierresCaja', 'cashClosings', 'cierres', 'closings'])
    };
  } catch (error) {
    return {
      valid: false,
      error: 'El JSON no es valido. Revisa comas, llaves y comillas.',
      clientes: [],
      creditos: [],
      rutas: [],
      gastos: [],
      pagos: [],
      cierres: []
    };
  }
}

function pickString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }

  return '';
}

function pickNumber(...values: unknown[]) {
  for (const value of values) {
    const numberValue = Number(value);

    if (Number.isFinite(numberValue)) return numberValue;
  }

  return 0;
}

export function RestoreBackupScreen() {
  const app = useApp() as any;

  const {
    clients,
    credits,
    routes,
    expenses,
    addClient,
    addCredit,
    addExpense,
    addRoute,
    navigate
  } = app;

  const [jsonText, setJsonText] = useState('');
  const [loading, setLoading] = useState(false);

  const parsed = useMemo(() => parseBackup(jsonText), [jsonText]);

  const newRoutes = useMemo(() => {
    return parsed.rutas.filter((item) => {
      const nombre = pickString(item.nombre, item.name, item.routeName);
      if (!nombre) return false;

      return !routes.some((route: any) => normalize(route.nombre) === normalize(nombre));
    });
  }, [parsed.rutas, routes]);

  const newClients = useMemo(() => {
    return parsed.clientes.filter((item) => {
      const nombre = pickString(item.nombre, item.name);
      const telefono = pickString(item.telefono, item.phone, item.celular);
      if (!nombre || !telefono) return false;

      return !clients.some((client: any) => {
        const sameName = normalize(client.nombre) === normalize(nombre);
        const samePhone = normalize(client.telefono) === normalize(telefono);
        return sameName || samePhone;
      });
    });
  }, [clients, parsed.clientes]);

  const restorableCredits = useMemo(() => {
    return parsed.creditos.filter((item) => {
      const clienteNombre = pickString(item.clienteNombre, item.cliente, item.clientName);
      const clienteId = pickString(item.clienteId, item.clientId);
      const valorPrestado = pickNumber(item.valorPrestado, item.monto, item.valor);
      const valorTotal = pickNumber(item.valorTotal, item.total, item.totalPagar);
      const cuotas = pickNumber(item.numeroCuotas, item.cuotas);

      const clientExists = clienteId
        ? clients.some((client: any) => client.id === clienteId)
        : clients.some((client: any) => normalize(client.nombre) === normalize(clienteNombre));

      return clientExists && valorPrestado > 0 && valorTotal > 0 && cuotas > 0;
    });
  }, [clients, parsed.creditos]);

  const newExpenses = useMemo(() => {
    return parsed.gastos.filter((item) => {
      const descripcion = pickString(item.descripcion, item.description, item.nota);
      const valor = pickNumber(item.valor, item.amount);
      const fecha = pickString(item.fecha, item.date);

      if (!descripcion || valor <= 0 || !fecha) return false;

      return !expenses.some((expense: any) => {
        return normalize(expense.descripcion) === normalize(descripcion) && Number(expense.valor) === valor && expense.fecha === fecha;
      });
    });
  }, [expenses, parsed.gastos]);

  const restore = async () => {
    if (!parsed.valid) {
      Alert.alert('JSON invalido', parsed.error || 'Debes pegar un JSON valido.');
      return;
    }

    if (newRoutes.length === 0 && newClients.length === 0 && restorableCredits.length === 0 && newExpenses.length === 0) {
      Alert.alert('Sin datos nuevos', 'No hay rutas, clientes, creditos o gastos nuevos para restaurar.');
      return;
    }

    Alert.alert(
      'Restaurar respaldo',
      `Se restauraran ${newRoutes.length} rutas, ${newClients.length} clientes, ${restorableCredits.length} creditos y ${newExpenses.length} gastos. Los pagos y cierres no se restauran automaticamente por seguridad. Deseas continuar?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Restaurar',
          onPress: async () => {
            setLoading(true);

            try {
              if (typeof addRoute === 'function') {
                for (const item of newRoutes) {
                  await addRoute({
                    nombre: pickString(item.nombre, item.name, item.routeName),
                    descripcion: pickString(item.descripcion, item.description, item.nota)
                  });
                }
              }

              for (const item of newClients) {
                const routeName = pickString(item.routeName, item.ruta, item.route);
                const route = routes.find((routeItem: any) => normalize(routeItem.nombre) === normalize(routeName));

                await addClient({
                  nombre: pickString(item.nombre, item.name),
                  telefono: pickString(item.telefono, item.phone, item.celular),
                  direccion: pickString(item.direccion, item.address),
                  routeId: pickString(item.routeId, item.rutaId) || route?.id || '',
                  routeName: routeName || route?.nombre || '',
                  nota: pickString(item.nota, item.observacion)
                });
              }

              for (const item of restorableCredits) {
                const clienteId = pickString(item.clienteId, item.clientId);
                const clienteNombre = pickString(item.clienteNombre, item.cliente, item.clientName);
                const client = clienteId
                  ? clients.find((clientItem: any) => clientItem.id === clienteId)
                  : clients.find((clientItem: any) => normalize(clientItem.nombre) === normalize(clienteNombre));

                if (!client) continue;

                await addCredit({
                  clienteId: client.id,
                  valorPrestado: pickNumber(item.valorPrestado, item.monto, item.valor),
                  valorTotal: pickNumber(item.valorTotal, item.total, item.totalPagar),
                  numeroCuotas: pickNumber(item.numeroCuotas, item.cuotas),
                  frecuencia: pickString(item.frecuencia, item.tipoCobro) || 'Diaria',
                  fechaInicio: pickString(item.fechaInicio, item.inicio) || new Date().toISOString().slice(0, 10),
                  fechaFinal: pickString(item.fechaFinal, item.final),
                  porcentaje: pickNumber(item.porcentaje, item.interes),
                  tipoCobro: pickString(item.tipoCobro, item.frecuencia) || 'Diaria',
                  nota: pickString(item.nota, item.observacion),
                  codeudorTiene: Boolean(item.codeudorTiene || item.codeudorNombreCompleto || item.codeudorNombre),
                  codeudorTipo: pickString(item.codeudorTipo) || 'nuevo',
                  codeudorClienteId: pickString(item.codeudorClienteId),
                  codeudorNombreCompleto: pickString(item.codeudorNombreCompleto, item.codeudorNombre, item.codeudor),
                  codeudorSobrenombre: pickString(item.codeudorSobrenombre),
                  codeudorCpf: pickString(item.codeudorCpf, item.cpf).replace(/[^0-9]/g, ''),
                  codeudorDireccion: pickString(item.codeudorDireccion),
                  codeudorTelefono: pickString(item.codeudorTelefono),
                  codeudorNota: pickString(item.codeudorNota)
                });
              }

              if (typeof addExpense === 'function') {
                for (const item of newExpenses) {
                  await addExpense({
                    descripcion: pickString(item.descripcion, item.description, item.nota),
                    valor: pickNumber(item.valor, item.amount),
                    fecha: pickString(item.fecha, item.date)
                  });
                }
              }

              Alert.alert('Restauracion completada', 'Los datos compatibles fueron restaurados correctamente.');
              setJsonText('');
            } catch (error) {
              console.error('Error restaurando respaldo:', error);
              Alert.alert('Error', 'No se pudo terminar la restauracion.');
            }

            setLoading(false);
          }
        }
      ]
    );
  };

  return (
    <View style={styles.root}>
      <TopBar title="Restaurar respaldo" showBack onBack={() => navigate('more')} />

      <Screen>
        <Card style={styles.heroCard}>
          <Text style={styles.heroTitle}>Restaurar respaldo JSON</Text>
          <Text style={styles.heroText}>
            Pega aqui un respaldo JSON. La restauracion segura crea rutas, clientes, creditos y gastos compatibles.
          </Text>
        </Card>

        <Card style={styles.warningCard}>
          <Text style={styles.warningTitle}>Modo seguro</Text>
          <Text style={styles.warningText}>
            Los pagos y cierres se muestran en la vista previa, pero no se restauran automaticamente porque pueden modificar saldos, caja y auditoria.
          </Text>
        </Card>

        <Text style={styles.label}>JSON del respaldo</Text>

        <TextInput
          value={jsonText}
          onChangeText={setJsonText}
          placeholder="Pega aqui el JSON del respaldo"
          placeholderTextColor={colors.muted}
          multiline
          textAlignVertical="top"
          style={styles.textArea}
        />

        {parsed.error ? (
          <Card style={styles.errorCard}>
            <Text style={styles.errorText}>{parsed.error}</Text>
          </Card>
        ) : null}

        <View style={styles.grid}>
          <Metric title="Rutas" value={`${newRoutes.length}/${parsed.rutas.length}`} />
          <Metric title="Clientes" value={`${newClients.length}/${parsed.clientes.length}`} />
        </View>

        <View style={styles.grid}>
          <Metric title="Creditos" value={`${restorableCredits.length}/${parsed.creditos.length}`} />
          <Metric title="Gastos" value={`${newExpenses.length}/${parsed.gastos.length}`} />
        </View>

        <View style={styles.grid}>
          <Metric title="Pagos vista" value={String(parsed.pagos.length)} danger={parsed.pagos.length > 0} />
          <Metric title="Cierres vista" value={String(parsed.cierres.length)} danger={parsed.cierres.length > 0} />
        </View>

        <Button title="Restaurar datos compatibles" onPress={restore} loading={loading} />

        <Text style={styles.blockTitle}>Vista previa</Text>

        {!jsonText.trim() ? (
          <EmptyState title="Sin respaldo" message="Pega un JSON para ver el resumen." />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.previewTable}>
              <PreviewCard title="Rutas nuevas" count={newRoutes.length} total={parsed.rutas.length} />
              <PreviewCard title="Clientes nuevos" count={newClients.length} total={parsed.clientes.length} />
              <PreviewCard title="Creditos compatibles" count={restorableCredits.length} total={parsed.creditos.length} />
              <PreviewCard title="Gastos nuevos" count={newExpenses.length} total={parsed.gastos.length} />
              <PreviewCard title="Pagos solo vista" count={parsed.pagos.length} total={parsed.pagos.length} warning />
              <PreviewCard title="Cierres solo vista" count={parsed.cierres.length} total={parsed.cierres.length} warning />
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

function PreviewCard({
  title,
  count,
  total,
  warning = false
}: {
  title: string;
  count: number;
  total: number;
  warning?: boolean;
}) {
  return (
    <Card style={styles.previewCard}>
      <View style={styles.previewHeader}>
        <Text style={styles.previewTitle}>{title}</Text>
        <StatusBadge type={warning ? 'warning' : count > 0 ? 'success' : 'danger'} label={`${count}/${total}`} />
      </View>
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
  warningCard: {
    backgroundColor: '#FFF8E1',
    marginBottom: 12
  },
  warningTitle: {
    color: colors.text,
    fontWeight: '900',
    fontSize: 16
  },
  warningText: {
    color: colors.muted,
    fontWeight: '700',
    lineHeight: 20,
    marginTop: 6
  },
  label: {
    color: colors.text,
    fontWeight: '900',
    marginBottom: 8
  },
  textArea: {
    minHeight: 190,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 14,
    backgroundColor: '#FFFFFF',
    color: colors.text,
    fontWeight: '700',
    marginBottom: 12
  },
  errorCard: {
    backgroundColor: '#FFF5F5',
    marginBottom: 12
  },
  errorText: {
    color: colors.danger,
    fontWeight: '900',
    lineHeight: 20
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
  blockTitle: {
    color: colors.text,
    fontWeight: '900',
    fontSize: 18,
    marginTop: 16,
    marginBottom: 10
  },
  previewTable: {
    minWidth: 320,
    paddingBottom: 20
  },
  previewCard: {
    width: 320,
    marginBottom: 10
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10
  },
  previewTitle: {
    color: colors.text,
    fontWeight: '900',
    fontSize: 15,
    flex: 1
  }
});