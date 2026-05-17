import React, { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { BottomNav } from '../components/BottomNav';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Screen } from '../components/Screen';
import { TopBar } from '../components/TopBar';
import { useApp } from '../state/AppContext';
import { colors } from '../theme/colors';
import { UserProfile } from '../types';

export function NewClientScreen() {
  const { addClient, navigate, users } = useApp();

  const collectors = useMemo(
    () => users.filter((user) => user.role === 'cobrador' && user.activo),
    [users]
  );

  const [nombre, setNombre] = useState('');
  const [documento, setDocumento] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [barrio, setBarrio] = useState('');
  const [collector, setCollector] = useState<UserProfile | null>(collectors[0] ?? null);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!nombre.trim() || !telefono.trim() || !direccion.trim()) {
      Alert.alert('Datos incompletos', 'Nombre, teléfono y dirección son obligatorios.');
      return;
    }

    setLoading(true);

    await addClient({
      nombre: nombre.trim(),
      documento: documento.trim(),
      telefono: telefono.trim(),
      direccion: direccion.trim(),
      barrio: barrio.trim(),
      assignedToUid: collector?.uid ?? '',
      assignedToEmail: collector?.email ?? ''
    });

    setLoading(false);
  };

  return (
    <View style={styles.root}>
      <TopBar title="Nuevo cliente" showBack onBack={() => navigate('clients')} />
      <Screen>
        <Input label="Nombre completo" icon="👤" value={nombre} onChangeText={setNombre} placeholder="Ej: Juan Pérez" />
        <Input label="Documento" icon="🪪" value={documento} onChangeText={setDocumento} placeholder="Número de documento" keyboardType="numeric" />
        <Input label="Teléfono" icon="📱" value={telefono} onChangeText={setTelefono} placeholder="Número de teléfono" keyboardType="phone-pad" />
        <Input label="Dirección" icon="📍" value={direccion} onChangeText={setDireccion} placeholder="Dirección completa" />
        <Input label="Barrio" icon="🗺️" value={barrio} onChangeText={setBarrio} placeholder="Barrio o zona" />

        <Card style={styles.assignCard}>
          <Text style={styles.assignTitle}>Asignar cobrador</Text>
          <Text style={styles.assignText}>
            El cobrador seleccionado será quien vea este cliente en su APK.
          </Text>

          {collectors.length === 0 ? (
            <Text style={styles.emptyCollector}>
              Todavía no hay usuarios cobradores activos. Puedes guardar el cliente y asignarlo después.
            </Text>
          ) : (
            collectors.map((item) => {
              const selected = collector?.uid === item.uid;

              return (
                <Pressable
                  key={item.id}
                  style={[styles.collectorOption, selected ? styles.collectorSelected : null]}
                  onPress={() => setCollector(item)}
                >
                  <Text style={[styles.collectorEmail, selected ? styles.collectorEmailSelected : null]}>
                    {item.email}
                  </Text>
                  <Text style={styles.collectorRole}>Cobrador activo</Text>
                </Pressable>
              );
            })
          )}

          <Pressable style={styles.unassigned} onPress={() => setCollector(null)}>
            <Text style={styles.unassignedText}>Dejar sin asignar</Text>
          </Pressable>
        </Card>

        <Button title="Guardar cliente" onPress={handleSave} loading={loading} />
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
  assignCard: {
    marginBottom: 16
  },
  assignTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900'
  },
  assignText: {
    color: colors.muted,
    marginTop: 6,
    marginBottom: 12,
    lineHeight: 20
  },
  emptyCollector: {
    color: colors.danger,
    fontWeight: '700',
    lineHeight: 20,
    marginBottom: 10
  },
  collectorOption: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    backgroundColor: '#FFFFFF'
  },
  collectorSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft
  },
  collectorEmail: {
    color: colors.text,
    fontWeight: '900'
  },
  collectorEmailSelected: {
    color: colors.primary
  },
  collectorRole: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 3,
    fontWeight: '700'
  },
  unassigned: {
    marginTop: 4,
    alignSelf: 'flex-start'
  },
  unassignedText: {
    color: colors.danger,
    fontWeight: '900'
  }
});