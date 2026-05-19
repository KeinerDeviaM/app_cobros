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

type ParsedClient = {
  nombre: string;
  telefono: string;
  direccion: string;
  ruta: string;
  nota: string;
  valid: boolean;
  error: string;
};

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

function parseClientsCsv(text: string): ParsedClient[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) return [];

  const first = splitCsvLine(lines[0]).map((item) => normalize(item));
  const hasHeaders = first.includes('nombre') || first.includes('telefono') || first.includes('direccion');

  const headers = hasHeaders
    ? first
    : ['nombre', 'telefono', 'direccion', 'ruta', 'nota'];

  const dataLines = hasHeaders ? lines.slice(1) : lines;

  return dataLines.map((line) => {
    const values = splitCsvLine(line);
    const record: Record<string, string> = {};

    headers.forEach((header, index) => {
      record[header] = values[index] || '';
    });

    const nombre = record.nombre || record.cliente || record.name || '';
    const telefono = record.telefono || record.celular || record.phone || '';
    const direccion = record.direccion || record.dirección || record.address || '';
    const ruta = record.ruta || record.route || '';
    const nota = record.nota || record.observacion || record.observación || '';

    let valid = true;
    let error = '';

    if (!nombre.trim()) {
      valid = false;
      error = 'Falta nombre';
    } else if (!telefono.trim()) {
      valid = false;
      error = 'Falta telefono';
    } else if (!direccion.trim()) {
      valid = false;
      error = 'Falta direccion';
    }

    return {
      nombre: nombre.trim(),
      telefono: telefono.trim(),
      direccion: direccion.trim(),
      ruta: ruta.trim(),
      nota: nota.trim(),
      valid,
      error
    };
  });
}

export function ImportClientsScreen() {
  const { clients, routes, addClient, navigate } = useApp();

  const [csvText, setCsvText] = useState('');
  const [loading, setLoading] = useState(false);

  const parsedClients = useMemo(() => parseClientsCsv(csvText), [csvText]);
  const validClients = parsedClients.filter((client) => client.valid);
  const invalidClients = parsedClients.filter((client) => !client.valid);

  const duplicatedClients = useMemo(() => {
    return validClients.filter((item) =>
      clients.some((client) => {
        const sameName = normalize(client.nombre) === normalize(item.nombre);
        const samePhone = normalize(client.telefono) === normalize(item.telefono);
        return sameName || samePhone;
      })
    );
  }, [clients, validClients]);

  const clientsToImport = useMemo(() => {
    return validClients.filter((item) => {
      return !duplicatedClients.some((duplicated) => {
        return normalize(duplicated.nombre) === normalize(item.nombre) || normalize(duplicated.telefono) === normalize(item.telefono);
      });
    });
  }, [duplicatedClients, validClients]);

  const importClients = async () => {
    if (clientsToImport.length === 0) {
      Alert.alert('Sin clientes nuevos', 'No hay clientes validos nuevos para importar.');
      return;
    }

    Alert.alert(
      'Importar clientes',
      `Se van a importar ${clientsToImport.length} clientes nuevos. Deseas continuar?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Importar',
          onPress: async () => {
            setLoading(true);

            for (const item of clientsToImport) {
              const route = routes.find((routeItem) => normalize(routeItem.nombre) === normalize(item.ruta));

              await (addClient as any)({
                nombre: item.nombre,
                telefono: item.telefono,
                direccion: item.direccion,
                routeId: route?.id || '',
                routeName: route?.nombre || item.ruta,
                nota: item.nota
              });
            }

            setLoading(false);
            setCsvText('');

            Alert.alert('Importacion completada', 'Los clientes fueron importados correctamente.');
          }
        }
      ]
    );
  };

  return (
    <View style={styles.root}>
      <TopBar title="Importar clientes" showBack onBack={() => navigate('more')} />

      <Screen>
        <Card style={styles.heroCard}>
          <Text style={styles.heroTitle}>Importar clientes desde Excel/CSV</Text>
          <Text style={styles.heroText}>
            Copia los datos desde Excel y pegalos aqui. El sistema validara nombre, telefono, direccion y evitara duplicados por nombre o telefono.
          </Text>
        </Card>

        <Card style={styles.formatCard}>
          <Text style={styles.formatTitle}>Formato recomendado</Text>
          <Text style={styles.formatText}>nombre,telefono,direccion,ruta,nota</Text>
          <Text style={styles.formatText}>Juan Perez,3001234567,Calle 10,Ruta Centro,Cliente nuevo</Text>
        </Card>

        <Text style={styles.label}>Contenido CSV</Text>

        <TextInput
          value={csvText}
          onChangeText={setCsvText}
          placeholder="Pega aqui los datos copiados desde Excel"
          placeholderTextColor={colors.muted}
          multiline
          textAlignVertical="top"
          style={styles.textArea}
        />

        <View style={styles.grid}>
          <Metric title="Leidos" value={String(parsedClients.length)} />
          <Metric title="Validos" value={String(validClients.length)} />
        </View>

        <View style={styles.grid}>
          <Metric title="Duplicados" value={String(duplicatedClients.length)} danger={duplicatedClients.length > 0} />
          <Metric title="Con error" value={String(invalidClients.length)} danger={invalidClients.length > 0} />
        </View>

        <Card style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Resumen</Text>
          <Text style={styles.summaryText}>Clientes existentes en la app: {clients.length}</Text>
          <Text style={styles.summaryText}>Clientes nuevos para importar: {clientsToImport.length}</Text>
          <Text style={styles.summaryText}>Rutas disponibles: {routes.length}</Text>
        </Card>

        <Button title="Importar clientes nuevos" onPress={importClients} loading={loading} />

        <Text style={styles.blockTitle}>Vista previa</Text>

        {parsedClients.length === 0 ? (
          <EmptyState title="Sin datos" message="Pega datos CSV para ver la vista previa." />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.previewTable}>
              {parsedClients.map((item, index) => {
                const isDuplicated = duplicatedClients.some((duplicated) => {
                  return normalize(duplicated.nombre) === normalize(item.nombre) || normalize(duplicated.telefono) === normalize(item.telefono);
                });

                return (
                  <Card key={`${item.nombre}-${item.telefono}-${index}`} style={styles.previewCard}>
                    <View style={styles.previewHeader}>
                      <Text style={styles.previewTitle}>{index + 1}. {item.nombre || 'Sin nombre'}</Text>
                      <StatusBadge
                        type={!item.valid ? 'danger' : isDuplicated ? 'warning' : 'success'}
                        label={!item.valid ? 'Error' : isDuplicated ? 'Duplicado' : 'Nuevo'}
                      />
                    </View>

                    <Text style={styles.previewText}>Telefono: {item.telefono || 'Sin telefono'}</Text>
                    <Text style={styles.previewText}>Direccion: {item.direccion || 'Sin direccion'}</Text>
                    <Text style={styles.previewText}>Ruta: {item.ruta || 'Sin ruta'}</Text>
                    <Text style={styles.previewText}>Nota: {item.nota || 'Sin nota'}</Text>
                    {!item.valid ? <Text style={styles.errorText}>{item.error}</Text> : null}
                  </Card>
                );
              })}
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
    marginTop: 4
  },
  label: {
    color: colors.text,
    fontWeight: '900',
    marginBottom: 8
  },
  textArea: {
    minHeight: 170,
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
    fontSize: 20,
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
  }
});