import React, { useMemo, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { BottomNav } from '../components/BottomNav';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { Screen } from '../components/Screen';
import { StatusBadge } from '../components/StatusBadge';
import { TopBar } from '../components/TopBar';
import { useApp } from '../state/AppContext';
import { colors } from '../theme/colors';
import { PromiseStatus, Visit } from '../types';
import { todayKey } from '../utils/date';
import { formatMoney } from '../utils/money';

type PromiseFilter = 'pendientes' | 'vencidas' | 'cumplidas' | 'incumplidas' | 'todas';

function normalizePhone(phone: string) {
  return phone.replace(/\s/g, '').replace(/\-/g, '');
}

function getPromiseType(status: PromiseStatus, expired: boolean) {
  if (status === 'cumplida') return 'success';
  if (status === 'incumplida' || status === 'cancelada' || expired) return 'danger';
  return 'warning';
}

function getPromiseLabel(status: PromiseStatus, expired: boolean) {
  if (status === 'cumplida') return 'Cumplida';
  if (status === 'incumplida') return 'Incumplida';
  if (status === 'cancelada') return 'Cancelada';
  if (expired) return 'Vencida';
  return 'Pendiente';
}

export function PromisesScreen() {
  const {
    visits,
    isAdmin,
    session,
    updatePromiseStatus,
    navigate
  } = useApp();

  const [filter, setFilter] = useState<PromiseFilter>('pendientes');
  const today = todayKey();

  const promiseVisits = useMemo(() => {
    return visits
      .filter((visit) => {
        if (visit.estado !== 'promesa') return false;
        if (!isAdmin && visit.assignedToUid !== session.uid) return false;
        return true;
      })
      .sort((a, b) => {
        const dateCompare = (a.promesaFecha ?? '').localeCompare(b.promesaFecha ?? '');
        if (dateCompare !== 0) return dateCompare;
        return a.clienteNombre.localeCompare(b.clienteNombre);
      });
  }, [isAdmin, session.uid, visits]);

  const filteredPromises = useMemo(() => {
    return promiseVisits.filter((visit) => {
      const status = visit.promesaEstado || 'pendiente';
      const expired = status === 'pendiente' && Boolean(visit.promesaFecha) && String(visit.promesaFecha) < today;

      if (filter === 'pendientes') return status === 'pendiente' && !expired;
      if (filter === 'vencidas') return expired;
      if (filter === 'cumplidas') return status === 'cumplida';
      if (filter === 'incumplidas') return status === 'incumplida';
      return true;
    });
  }, [filter, promiseVisits, today]);

  const totalPending = promiseVisits
    .filter((visit) => (visit.promesaEstado || 'pendiente') === 'pendiente')
    .reduce((total, visit) => total + (visit.promesaValor || 0), 0);

  const expiredCount = promiseVisits.filter((visit) => {
    const status = visit.promesaEstado || 'pendiente';
    return status === 'pendiente' && Boolean(visit.promesaFecha) && String(visit.promesaFecha) < today;
  }).length;

  const fulfilledCount = promiseVisits.filter((visit) => visit.promesaEstado === 'cumplida').length;

  return (
    <View style={styles.root}>
      <TopBar title="Promesas de pago" showBack onBack={() => navigate('more')} />

      <Screen>
        <Card style={styles.heroCard}>
          <Text style={styles.heroTitle}>Seguimiento de promesas</Text>
          <Text style={styles.heroText}>
            Controla promesas pendientes, vencidas, cumplidas e incumplidas.
          </Text>
        </Card>

        <View style={styles.grid}>
          <Card style={styles.metricCard}>
            <Text style={styles.metricLabel}>Pendiente</Text>
            <Text style={styles.metricValue}>{formatMoney(totalPending)}</Text>
          </Card>

          <Card style={styles.metricCard}>
            <Text style={styles.metricLabel}>Vencidas</Text>
            <Text style={[styles.metricValue, styles.danger]}>{expiredCount}</Text>
          </Card>

          <Card style={styles.metricCard}>
            <Text style={styles.metricLabel}>Cumplidas</Text>
            <Text style={styles.metricValue}>{fulfilledCount}</Text>
          </Card>
        </View>

        <View style={styles.filters}>
          <PromiseFilterChip label="Pendientes" value="pendientes" current={filter} onPress={setFilter} />
          <PromiseFilterChip label="Vencidas" value="vencidas" current={filter} onPress={setFilter} danger />
          <PromiseFilterChip label="Cumplidas" value="cumplidas" current={filter} onPress={setFilter} />
          <PromiseFilterChip label="Incumplidas" value="incumplidas" current={filter} onPress={setFilter} danger />
          <PromiseFilterChip label="Todas" value="todas" current={filter} onPress={setFilter} />
        </View>

        {filteredPromises.length === 0 ? (
          <EmptyState title="Sin promesas" message="No hay promesas con este filtro." />
        ) : (
          filteredPromises.map((visit) => (
            <PromiseCard key={visit.id} visit={visit} updatePromiseStatus={updatePromiseStatus} />
          ))
        )}
      </Screen>

      <BottomNav />
    </View>
  );
}

function PromiseFilterChip({
  label,
  value,
  current,
  onPress,
  danger = false
}: {
  label: string;
  value: PromiseFilter;
  current: PromiseFilter;
  onPress: (value: PromiseFilter) => void;
  danger?: boolean;
}) {
  const selected = value === current;

  return (
    <Pressable
      style={[
        styles.filterChip,
        selected ? styles.filterChipSelected : null,
        selected && danger ? styles.filterChipDanger : null
      ]}
      onPress={() => onPress(value)}
    >
      <Text
        style={[
          styles.filterText,
          selected ? styles.filterTextSelected : null,
          selected && danger ? styles.filterTextDanger : null
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function PromiseCard({
  visit,
  updatePromiseStatus
}: {
  visit: Visit;
  updatePromiseStatus: (visitId: string, status: PromiseStatus) => Promise<void>;
}) {
  const today = todayKey();
  const status = visit.promesaEstado || 'pendiente';
  const expired = status === 'pendiente' && Boolean(visit.promesaFecha) && String(visit.promesaFecha) < today;

  const openWhatsApp = () => {
    if (!visit.clienteTelefono) return;

    const phone = normalizePhone(visit.clienteTelefono);
    const text = encodeURIComponent(
      `Hola ${visit.clienteNombre}, te recordamos tu promesa de pago para el ${visit.promesaFecha} por ${formatMoney(visit.promesaValor || 0)}. Gracias.`
    );

    Linking.openURL(`https://wa.me/57${phone}?text=${text}`);
  };

  return (
    <Card style={styles.promiseCard}>
      <View style={styles.cardHeader}>
        <View style={styles.info}>
          <Text style={styles.clientName}>{visit.clienteNombre}</Text>
          <Text style={styles.clientMeta}>Teléfono: {visit.clienteTelefono}</Text>
          <Text style={styles.clientMeta}>Dirección: {visit.clienteDireccion}</Text>
          <Text style={styles.clientMeta}>Ruta: {visit.routeName || 'Sin ruta'}</Text>
        </View>

        <StatusBadge type={getPromiseType(status, expired)} label={getPromiseLabel(status, expired)} />
      </View>

      <View style={styles.promiseBox}>
        <Text style={styles.promiseLabel}>Fecha prometida</Text>
        <Text style={styles.promiseValue}>{visit.promesaFecha || 'Sin fecha'}</Text>

        <Text style={styles.promiseLabel}>Valor prometido</Text>
        <Text style={styles.promiseAmount}>{formatMoney(visit.promesaValor || 0)}</Text>

        <Text style={styles.promiseLabel}>Observación</Text>
        <Text style={styles.promiseText}>{visit.observacion || 'Sin observación'}</Text>
      </View>

      <View style={styles.buttonGrid}>
        <Button title="Cumplida" variant="secondary" onPress={() => updatePromiseStatus(visit.id, 'cumplida')} style={styles.actionButton} />
        <Button title="Incumplida" variant="danger" onPress={() => updatePromiseStatus(visit.id, 'incumplida')} style={styles.actionButton} />
      </View>

      <View style={styles.buttonGrid}>
        <Button title="Reactivar" variant="secondary" onPress={() => updatePromiseStatus(visit.id, 'pendiente')} style={styles.actionButton} />
        <Button title="WhatsApp" variant="secondary" onPress={openWhatsApp} style={styles.actionButton} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  heroCard: { backgroundColor: colors.primary, marginBottom: 12 },
  heroTitle: { color: '#FFFFFF', fontSize: 21, fontWeight: '900' },
  heroText: { color: '#FFFFFF', opacity: 0.86, marginTop: 6, lineHeight: 20, fontWeight: '700' },
  grid: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  metricCard: { flex: 1 },
  metricLabel: { color: colors.muted, fontWeight: '800', fontSize: 11 },
  metricValue: { color: colors.primary, fontWeight: '900', fontSize: 15, marginTop: 5 },
  danger: { color: colors.danger },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  filterChip: { borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#FFFFFF' },
  filterChipSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  filterChipDanger: { borderColor: colors.danger, backgroundColor: '#FFF5F5' },
  filterText: { color: colors.muted, fontWeight: '900', fontSize: 12 },
  filterTextSelected: { color: colors.primary },
  filterTextDanger: { color: colors.danger },
  promiseCard: { marginBottom: 12 },
  cardHeader: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  info: { flex: 1 },
  clientName: { color: colors.text, fontSize: 16, fontWeight: '900' },
  clientMeta: { color: colors.muted, fontWeight: '700', marginTop: 4 },
  promiseBox: { backgroundColor: colors.background, borderRadius: 14, padding: 12, marginTop: 12 },
  promiseLabel: { color: colors.muted, fontWeight: '800', marginTop: 8 },
  promiseValue: { color: colors.primary, fontWeight: '900', fontSize: 17, marginTop: 3 },
  promiseAmount: { color: colors.danger, fontWeight: '900', fontSize: 18, marginTop: 3 },
  promiseText: { color: colors.text, fontWeight: '700', lineHeight: 20, marginTop: 4 },
  buttonGrid: { flexDirection: 'row', gap: 10, marginTop: 10 },
  actionButton: { flex: 1 }
});