import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BottomNav } from '../components/BottomNav';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Screen } from '../components/Screen';
import { StatCard } from '../components/StatCard';
import { TopBar } from '../components/TopBar';
import { useApp } from '../state/AppContext';
import { colors } from '../theme/colors';
import { formatMoney } from '../utils/money';

export function DashboardScreen() {
  const { session, stats, navigate, isAdmin } = useApp();

  return (
    <View style={styles.root}>
      <TopBar title="Dashboard" rightText={isAdmin ? 'Admin' : 'Cobro'} />
      <Screen>
        <Text style={styles.welcome}>Bienvenido, {session.email.split('@')[0]}</Text>
        <Text style={styles.subtitle}>
          Rol actual: {isAdmin ? 'Administrador' : 'Cobrador'}
        </Text>

        <View style={styles.grid}>
          <Pressable style={styles.gridItem} onPress={() => navigate('clients')}>
            <StatCard icon="👥" value={String(stats.totalClients)} label="Clientes" helper="Ver todos" />
          </Pressable>
          <Pressable style={styles.gridItem} onPress={() => navigate('credits')}>
            <StatCard icon="📋" value={String(stats.activeCredits)} label="Créditos activos" helper="Ver detalles" />
          </Pressable>
        </View>

        <View style={styles.grid}>
          <Pressable style={styles.gridItem} onPress={() => navigate('payments')}>
            <StatCard icon="💰" value={formatMoney(stats.collectedToday)} label="Cobrado hoy" helper="Ver pagos" />
          </Pressable>
          <Pressable style={styles.gridItem} onPress={() => navigate(isAdmin ? 'reports' : 'dailyCash')}>
            <StatCard icon="⚠️" value={formatMoney(stats.pendingTotal)} label="Pendiente" helper={isAdmin ? 'Ver reportes' : 'Ver caja'} />
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>Acciones rápidas</Text>

        <Card>
          <View style={styles.actionGrid}>
            {isAdmin ? (
              <>
                <Button title="Nuevo cliente" variant="secondary" onPress={() => navigate('newClient')} style={styles.actionButton} />
                <Button title="Nuevo crédito" variant="secondary" onPress={() => navigate('newCredit')} style={styles.actionButton} />
              </>
            ) : null}

            <Button title="Registrar pago" variant="secondary" onPress={() => navigate('registerPayment')} style={styles.actionButton} />
            <Button title="Caja diaria" variant="secondary" onPress={() => navigate('dailyCash')} style={styles.actionButton} />

            {isAdmin ? (
              <Button title="Reportes" variant="secondary" onPress={() => navigate('reports')} style={styles.actionButton} />
            ) : null}
          </View>
        </Card>

        <Card style={styles.infoCard}>
          <Text style={styles.infoTitle}>Firebase Auth + Roles</Text>
          <Text style={styles.infoText}>
            La app ya diferencia entre administrador y cobrador. El administrador gestiona clientes y créditos; el cobrador registra pagos.
          </Text>
        </Card>
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
  welcome: {
    fontSize: 20,
    color: colors.text,
    fontWeight: '900'
  },
  subtitle: {
    color: colors.muted,
    marginTop: 4,
    marginBottom: 16,
    fontWeight: '600'
  },
  grid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12
  },
  gridItem: {
    flex: 1
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
    marginTop: 10,
    marginBottom: 10
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  actionButton: {
    width: '47%'
  },
  infoCard: {
    marginTop: 16,
    backgroundColor: colors.primarySoft
  },
  infoTitle: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '900'
  },
  infoText: {
    color: colors.muted,
    marginTop: 6,
    lineHeight: 20
  }
});