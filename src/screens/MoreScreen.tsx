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
  const { session, navigate, logout, isAdmin, canManagePayments, businessSettings } = useApp();

  return (
    <View style={styles.root}>
      <TopBar title="MÃ¡s opciones" rightText="âš™ï¸" />

      <Screen>
        <Card style={styles.menuCard}>
          <Button title="Ayuda / Manual" variant="secondary" onPress={() => navigate('help')} style={styles.menuButton} />
              <Button title="Modo offline" variant="secondary" onPress={() => navigate('offlineStatus')} style={styles.menuButton} />
              <Button title="Recordatorios" variant="secondary" onPress={() => navigate('reminders')} style={styles.menuButton} />
              <Button title="Control operativo" variant="secondary" onPress={() => navigate('operationalControl')} style={styles.menuButton} />
              <Button title="Checklist APK" variant="secondary" onPress={() => navigate('preApkChecklist')} style={styles.menuButton} />
        </Card>
        <Card style={styles.profileCard}>
          <Text style={styles.avatar}>ðŸ‘¤</Text>

          <View style={styles.profileInfo}>
            <Text style={styles.name}>{session.email}</Text>
            <Text style={styles.role}>{isAdmin ? 'Administrador' : 'Cobrador'} Â· Firebase Auth</Text>
            <Text style={styles.business}>{businessSettings.businessName}</Text>
          </View>
        </Card>

        <Text style={styles.sectionTitle}>OperaciÃ³n diaria</Text>
        <Card style={styles.menuCard}>
          <Button title="Registrar pago" variant="secondary" onPress={() => navigate('registerPayment')} style={styles.menuButton} />
          <Button title="Visitas de hoy" variant="secondary" onPress={() => navigate('visits')} style={styles.menuButton} />
          <Button title="Calendario de cobros" variant="secondary" onPress={() => navigate('collectionsCalendar')} style={styles.menuButton} />
          <Button title="Promesas de pago" variant="secondary" onPress={() => navigate('promises')} style={styles.menuButton} />
          <Button title="Rutas de cobro" variant="secondary" onPress={() => navigate('routes')} style={styles.menuButton} />
          <Button title="Caja diaria" variant="secondary" onPress={() => navigate('dailyCash')} style={styles.menuButton} />
        </Card>

        {(isAdmin || canManagePayments) ? (
          <>
            <Text style={styles.sectionTitle}>AdministraciÃ³n</Text>
            <Card style={styles.menuCard}>
              <Button title="Reportes" variant="secondary" onPress={() => navigate('reports')} style={styles.menuButton} />
              <Button title="Indicadores avanzados" variant="secondary" onPress={() => navigate('advancedAnalytics')} style={styles.menuButton} />
              <Button title="Exportar reportes" variant="secondary" onPress={() => navigate('exportReports')} style={styles.menuButton} />
              <Button title="GestiÃ³n de usuarios" variant="secondary" onPress={() => navigate('users')} style={styles.menuButton} />
              <Button title="AuditorÃ­a" variant="secondary" onPress={() => navigate('audit')} style={styles.menuButton} />
              <Button title="ConfiguraciÃ³n del negocio" variant="secondary" onPress={() => navigate('businessSettings')} style={styles.menuButton} />
              <Button title="Checklist antes del APK" variant="secondary" onPress={() => navigate('preApkChecklist')} style={styles.menuButton} />
            </Card>
          </>
        ) : null}

        <Text style={styles.sectionTitle}>Estado del proyecto</Text>
        <Card>
          <Text style={styles.stateTitle}>VersiÃ³n pre-APK</Text>
          <Text style={styles.stateText}>
            La app ya incluye clientes, crÃ©ditos, pagos, recibos, caja, cierres, rutas, visitas, reportes, auditorÃ­a, configuraciÃ³n y exportaciones CSV.
          </Text>
        </Card>

        <Button title="Cerrar sesiÃ³n" variant="danger" onPress={logout} style={styles.logout} />
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
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14
  },
  avatar: {
    fontSize: 38
  },
  profileInfo: {
    flex: 1
  },
  name: {
    color: colors.text,
    fontWeight: '900',
    fontSize: 16
  },
  role: {
    color: colors.muted,
    marginTop: 3,
    fontWeight: '700'
  },
  business: {
    color: colors.primary,
    marginTop: 4,
    fontWeight: '900'
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
    marginTop: 18,
    marginBottom: 10
  },
  menuCard: {
    gap: 10
  },
  menuButton: {
    marginBottom: 10
  },
  stateTitle: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '900'
  },
  stateText: {
    color: colors.muted,
    marginTop: 6,
    lineHeight: 20,
    fontWeight: '700'
  },
  logout: {
    marginTop: 18
  }
});
