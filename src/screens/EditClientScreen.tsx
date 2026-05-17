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
import { ClientStatus, Route, UserProfile } from '../types';

export function EditClientScreen() {
  const {
    selectedClient,
    users,
    routes,
    updateClient,
    navigate
  } = useApp();

  const collectors = useMemo(
    () => users.filter((user) => user.role === 'cobrador' && user.activo),
    [users]
  );

  const [nombre, setNombre] = useState('');
  const [documento, setDocumento] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [barrio, setBarrio] = useState('');
  const [estado, setEstado] = useState<ClientStatus>('al-dia');
  const [collector, setCollector] = useState<UserProfile | null>(null);
  const [route, setRoute] = useState<Route | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedClient) return;

    setNombre(selectedClient.nombre ?? '');
    setDocumento(selectedClient.documento ?? '');
    setTelefono(selectedClient.telefono ?? '');
    setDireccion(selectedClient.direccion ?? '');
    setBarrio(selectedClient.barrio ?? '');
    setEstado(selectedClient.estado ?? 'al-dia');

    const currentCollector = collectors.find((item) => item.uid === selectedClient.assignedToUid);
    setCollector(currentCollector ?? null);

    const currentRoute = routes.find((item) => item.id === selectedClient.routeId);
    setRoute(currentRoute ?? null);
  }, [collectors, routes, selectedClient]);

  const handleSave = async () => {
    if (!selectedClient) return;

    if (!nombre.trim() || !telefono.trim() || !direccion.trim()) {
      Alert.alert('Datos incompletos', 'Nombre, teléfono y dirección son obligatorios.');
      return;
    }

    setLoading(true);

    await updateClient(selectedClient.id, {
      nombre: nombre.trim(),
      documento: documento.trim(),
      telefono: telefono.trim(),
      direccion: direccion.trim(),
      barrio: barrio.trim(),
      estado,
      assignedToUid: collector?.uid ?? '',
      assignedToEmail: collector?.email ?? '',
      routeId: route?.id ?? '',
      routeName: route?.nombre ?? ''
    });

    setLoading(false);
  };

  if (!selectedClient) {
    return (
      <View style={styles.root}>
        <TopBar title="Editar cliente" showBack onBack={() => navigate('clients')} />
        <Screen>
          <EmptyState title="Cliente no encontrado" message="Vuelve a la lista y selecciona un cliente." />
          <Button title="Volver a clientes" onPress={() => navigate('clients')} />
        </Screen>
        <BottomNav />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <TopBar title="Editar cliente" showBack onBack={() => navigate('clientDetail')} />
      <Screen>
        <Card style={styles.infoCard}>
          <Text style={styles.infoTitle}>Editando cliente</Text>
          <Text style={styles.infoText}>
            Los cambios se guardarán en Firebase y se actualizarán en todos los celulares.
          </Text>
        </Card>

        <Input label="Nombre completo" icon="👤" value={nombre} onChangeText={setNombre} placeholder="Ej: Juan Pérez" />
        <Input label="Documento" icon="🪪" value={documento} onChangeText={setDocumento} placeholder="Número de documento" keyboardType="numeric" />
        <Input label="Teléfono" icon="📱" value={telefono} onChangeText={setTelefono} placeholder="Número de teléfono" keyboardType="phone-pad" />
        <Input label="Dirección" icon="📍" value={direccion} onChangeText={setDireccion} placeholder="Dirección completa" />
        <Input label="Barrio" icon="🗺️" value={barrio} onChangeText={setBarrio} placeholder="Barrio o zona" />

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Estado del cliente</Text>

          <View style={styles.chipList}>
            <Pressable
              style={[styles.chip, estado === 'al-dia' ? styles.chipSelected : null]}
              onPress={() => setEstado('al-dia')}
            >
              <Text style={[styles.chipText, estado === 'al-dia' ? styles.chipTextSelected : null]}>
                Al día
              </Text>
            </Pressable>

            <Pressable
              style={[styles.chip, estado === 'en-mora' ? styles.chipDangerSelected : null]}
              onPress={() => setEstado('en-mora')}
            >
              <Text style={[styles.chipText, estado === 'en-mora' ? styles.chipDangerText : null]}>
                En mora
              </Text>
            </Pressable>
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Cobrador asignado</Text>

          {collectors.length === 0 ? (
            <Text style={styles.emptyText}>No hay cobradores activos.</Text>
          ) : (
            collectors.map((item) => {
              const selected = collector?.uid === item.uid;

              return (
                <Pressable
                  key={item.id}
                  style={[styles.option, selected ? styles.optionSelected : null]}
                  onPress={() => setCollector(item)}
                >
                  <Text style={[styles.optionTitle, selected ? styles.optionTitleSelected : null]}>
                    {item.email}
                  </Text>
                  <Text style={styles.optionMeta}>Cobrador activo</Text>
                </Pressable>
              );
            })
          )}

          <Pressable style={styles.clearButton} onPress={() => setCollector(null)}>
            <Text style={styles.clearText}>Dejar sin cobrador</Text>
          </Pressable>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Ruta asignada</Text>

          {routes.length === 0 ? (
            <Text style={styles.emptyText}>No hay rutas creadas.</Text>
          ) : (
            routes.map((item) => {
              const selected = route?.id === item.id;

              return (
                <Pressable
                  key={item.id}
                  style={[styles.option, selected ? styles.optionSelected : null]}
                  onPress={() => setRoute(item)}
                >
                  <Text style={[styles.optionTitle, selected ? styles.optionTitleSelected : null]}>
                    {item.nombre}
                  </Text>
                  <Text style={styles.optionMeta}>{item.zona || 'Sin zona'}</Text>
                </Pressable>
              );
            })
          )}

          <Pressable style={styles.clearButton} onPress={() => setRoute(null)}>
            <Text style={styles.clearText}>Dejar sin ruta</Text>
          </Pressable>
        </Card>

        <Button title="Guardar cambios" onPress={handleSave} loading={loading} />
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
    marginBottom: 16
  },
  infoTitle: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '900'
  },
  infoText: {
    color: colors.muted,
    marginTop: 6,
    lineHeight: 20,
    fontWeight: '700'
  },
  card: {
    marginBottom: 16
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 12
  },
  chipList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: '#FFFFFF'
  },
  chipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft
  },
  chipDangerSelected: {
    borderColor: colors.danger,
    backgroundColor: '#FFF5F5'
  },
  chipText: {
    color: colors.muted,
    fontWeight: '900'
  },
  chipTextSelected: {
    color: colors.primary
  },
  chipDangerText: {
    color: colors.danger
  },
  option: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    backgroundColor: '#FFFFFF'
  },
  optionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft
  },
  optionTitle: {
    color: colors.text,
    fontWeight: '900'
  },
  optionTitleSelected: {
    color: colors.primary
  },
  optionMeta: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 3,
    fontWeight: '700'
  },
  emptyText: {
    color: colors.danger,
    fontWeight: '800',
    lineHeight: 20,
    marginBottom: 10
  },
  clearButton: {
    alignSelf: 'flex-start',
    marginTop: 4
  },
  clearText: {
    color: colors.danger,
    fontWeight: '900'
  }
});
