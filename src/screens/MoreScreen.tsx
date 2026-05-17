import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BottomNav } from '../components/BottomNav';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Screen } from '../components/Screen';
import { TopBar } from '../components/TopBar';
import { useApp } from '../state/AppContext';
import { colors } from '../theme/colors';

export function MoreScreen() {
  const { session, navigate, logout, isAdmin } = useApp();

  return (
    <View style={styles.root}>
      <TopBar title="Más opciones" rightText="⚙️" />
      <Screen>
        <Card style={styles.profileCard}>
          <Text style={styles.avatar}>👤</Text>
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{session.email}</Text>
            <Text style={styles.role}>{isAdmin ? 'Administrador' : 'Cobrador'} · Firebase Auth</Text>
          </View>
        </Card>

        <Text style={styles.sectionTitle}>Acciones</Text>
        <Card style={styles.menuCard}>
          <Button title="Visitas de hoy" variant="secondary" onPress={() => navigate('visits')} style={styles.menuButton} />
          <Button title="Rutas de cobro" variant="secondary" onPress={() => navigate('routes')} style={styles.menuButton} />
          <Button title="Caja diaria" variant="secondary" onPress={() => navigate('dailyCash')} style={styles.menuButton} />
          <Button title="Registrar pago" variant="secondary" onPress={() => navigate('registerPayment')} style={styles.menuButton} />

          {isAdmin ? (
            <>
              <Button title="Reportes" variant="secondary" onPress={() => navigate('reports')} style={styles.menuButton} />
              <Button title="Gestión de usuarios" variant="secondary" onPress={() => navigate('users')} style={styles.menuButton} />
            </>
          ) : null}
        </Card>

        <Text style={styles.sectionTitle}>Estado del proyecto</Text>
        <Card>
          <Text style={styles.stateTitle}>Visitas diarias</Text>
          <Text style={styles.stateText}>
            La app ya puede generar visitas del día, marcar estados de visita y controlar el recorrido del cobrador.
          </Text>
        </Card>

        <Button title="Cerrar sesión" variant="danger" onPress={logout} style={styles.logout} />
      </Screen>
      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { fontSize: 36 },
  profileInfo: { flex: 1 },
  name: { color: colors.text, fontWeight: '900', fontSize: 16 },
  role: { color: colors.muted, marginTop: 3, fontWeight: '700' },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '900', marginTop: 18, marginBottom: 10 },
  menuCard: { gap: 10 },
  menuButton: { marginBottom: 10 },
  stateTitle: { color: colors.primary, fontSize: 16, fontWeight: '900' },
  stateText: { color: colors.muted, marginTop: 6, lineHeight: 20 },
  logout: { marginTop: 18 }
});