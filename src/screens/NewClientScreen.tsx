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
import { Route, UserProfile } from '../types';
import { normalizePhone, normalizeText } from '../utils/validation';

export function NewClientScreen() {
  const { addClient, navigate, users, routes, clients } = useApp();

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
  const [route, setRoute] = useState<Route | null>(routes[0] ?? null);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    const cleanNombre = nombre.trim();
    const cleanDocumento = documento.trim();
    const cleanTelefono = telefono.trim();
    const cleanDireccion = direccion.trim();
    const cleanBarrio = barrio.trim();

    if (!cleanNombre || !cleanTelefono || !cleanDireccion) {
      Alert.alert('Datos incompletos', 'Nombre, teléfono y dirección son obligatorios.');
      return;
    }

    if (cleanNombre.length < 3) {
      Alert.alert('Nombre muy corto', 'El nombre debe tener mínimo 3 caracteres.');
      return;
    }

    if (normalizePhone(cleanTelefono).length < 7) {
      Alert.alert('Teléfono inválido', 'Ingresa un teléfono válido.');
      return;
    }

    const duplicatedByDocument = cleanDocumento
      ? clients.some((client) => normalizeText(client.documento) === normalizeText(cleanDocumento))
      : false;

    if (duplicatedByDocument) {
      Alert.alert('Cliente duplicado', 'Ya existe un cliente con ese documento.');
      return;
    }

    const duplicatedByPhone = clients.some(
      (client) => normalizePhone(client.telefono) === normalizePhone(cleanTelefono)
    );

    if (duplicatedByPhone) {
      Alert.alert('Teléfono duplicado', 'Ya existe un cliente con ese teléfono.');
      return;
    }

    setLoading(true);

    await addClient({
      nombre: cleanNombre,
      documento: cleanDocumento,
      telefono: cleanTelefono,
      direccion: cleanDireccion,
      barrio: cleanBarrio,
      assignedToUid: collector?.uid ?? '',
      assignedToEmail: collector?.email ?? '',
      routeId: route?.id ?? '',
      routeName: route?.nombre ?? ''
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
          <Text style={styles.assignText}>El cobrador seleccionado verá este cliente en su APK.</Text>

          {collectors.length === 0 ? (
            <Text style={styles.emptyText}>No hay cobradores activos. Puedes asignarlo después.</Text>
          ) : (
            collectors.map((item) => {
              const selected = collector?.uid === item.uid;

              return (
                <Pressable
                  key={item.id}
                  style={[styles.option, selected ? styles.selectedOption : null]}
                  onPress={() => setCollector(item)}
                >
                  <Text style={[styles.optionTitle, selected ? styles.selectedText : null]}>{item.email}</Text>
                  <Text style={styles.optionMeta}>Cobrador activo</Text>
                </Pressable>
              );
            })
          )}

          <Pressable style={styles.clearButton} onPress={() => setCollector(null)}>
            <Text style={styles.clearText}>Dejar sin cobrador</Text>
          </Pressable>
        </Card>

        <Card style={styles.assignCard}>
          <Text style={styles.assignTitle}>Asignar ruta</Text>
          <Text style={styles.assignText}>La ruta ayuda a ordenar el recorrido diario del cobrador.</Text>

          {routes.length === 0 ? (
            <Text style={styles.emptyText}>No hay rutas creadas. Puedes crearlas desde Más opciones → Rutas de cobro.</Text>
          ) : (
            routes.map((item) => {
              const selected = route?.id === item.id;

              return (
                <Pressable
                  key={item.id}
                  style={[styles.option, selected ? styles.selectedOption : null]}
                  onPress={() => setRoute(item)}
                >
                  <Text style={[styles.optionTitle, selected ? styles.selectedText : null]}>{item.nombre}</Text>
                  <Text style={styles.optionMeta}>{item.zona || 'Sin zona'}</Text>
                </Pressable>
              );
            })
          )}

          <Pressable style={styles.clearButton} onPress={() => setRoute(null)}>
            <Text style={styles.clearText}>Dejar sin ruta</Text>
          </Pressable>
        </Card>

        <Button title="Guardar cliente" onPress={handleSave} loading={loading} />
      </Screen>
      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  assignCard: { marginBottom: 16 },
  assignTitle: { color: colors.text, fontSize: 16, fontWeight: '900' },
  assignText: { color: colors.muted, marginTop: 6, marginBottom: 12, lineHeight: 20 },
  emptyText: { color: colors.danger, fontWeight: '700', lineHeight: 20, marginBottom: 10 },
  option: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    backgroundColor: '#FFFFFF'
  },
  selectedOption: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  optionTitle: { color: colors.text, fontWeight: '900' },
  selectedText: { color: colors.primary },
  optionMeta: { color: colors.muted, fontSize: 12, marginTop: 3, fontWeight: '700' },
  clearButton: { marginTop: 4, alignSelf: 'flex-start' },
  clearText: { color: colors.danger, fontWeight: '900' }
});
