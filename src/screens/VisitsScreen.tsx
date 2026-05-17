import React, { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { BottomNav } from '../components/BottomNav';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { Input } from '../components/Input';
import { Screen } from '../components/Screen';
import { StatusBadge } from '../components/StatusBadge';
import { TopBar } from '../components/TopBar';
import { useApp } from '../state/AppContext';
import { colors } from '../theme/colors';
import { PromiseStatus, Visit, VisitStatus } from '../types';
import { todayKey } from '../utils/date';
import { formatMoney } from '../utils/money';
import { isPositiveMoney, isValidDateKey, parseMoney } from '../utils/validation';

type VisitFilter = 'hoy' | 'pendientes' | 'gestionadas' | 'promesas' | 'todas';

function getVisitBadge(status: VisitStatus) {
  if (status === 'pago' || status === 'visitado') return 'success';
  if (status === 'promesa') return 'warning';
  if (status === 'pendiente') return 'warning';
  return 'danger';
}

function getVisitLabel(status: VisitStatus) {
  if (status === 'pendiente') return 'Pendiente';
  if (status === 'visitado') return 'Visitado';
  if (status === 'pago') return 'Pagó';
  if (status === 'no-pago') return 'No pagó';
  if (status === 'no-estaba') return 'No estaba';
  if (status === 'promesa') return 'Promesa';
  return status;
}

export function VisitsScreen() {
  const {
    visits,
    createTodayVisits,
    updateVisitStatus,
    navigate,
    isAdmin,
    session
  } = useApp();

  const [filter, setFilter] = useState<VisitFilter>('hoy');
  const today = todayKey();

  const visibleVisits = useMemo(() => {
    return visits.filter((visit) => {
      if (!isAdmin && visit.assignedToUid !== session.uid) return false;

      if (filter === 'hoy') return visit.fecha === today;
      if (filter === 'pendientes') return visit.estado === 'pendiente';
      if (filter === 'gestionadas') return visit.estado !== 'pendiente';
      if (filter === 'promesas') return visit.estado === 'promesa';

      return true;
    });
  }, [filter, isAdmin, session.uid, today, visits]);

  const pendingCount = visibleVisits.filter((visit) => visit.estado === 'pendiente').length;
  const promiseCount = visibleVisits.filter((visit) => visit.estado === 'promesa').length;
  const doneCount = visibleVisits.filter((visit) => visit.estado !== 'pendiente').length;

  return (
    <View style={styles.root}>
      <TopBar title="Visitas" showBack onBack={() => navigate('more')} />

      <Screen>
        <Card style={styles.heroCard}>
          <Text style={styles.heroTitle}>Gestión de visitas</Text>
          <Text style={styles.heroText}>
            Registra visitas, pagos, no pagos y promesas con valor prometido.
          </Text>

          <Button title="Generar visitas de hoy" onPress={createTodayVisits} style={styles.heroButton} />
        </Card>

        <View style={styles.grid}>
          <Card style={styles.metricCard}>
            <Text style={styles.metricLabel}>Pendientes</Text>
            <Text style={[styles.metricValue, styles.warning]}>{pendingCount}</Text>
          </Card>

          <Card style={styles.metricCard}>
            <Text style={styles.metricLabel}>Gestionadas</Text>
            <Text style={styles.metricValue}>{doneCount}</Text>
          </Card>

          <Card style={styles.metricCard}>
            <Text style={styles.metricLabel}>Promesas</Text>
            <Text style={styles.metricValue}>{promiseCount}</Text>
          </Card>
        </View>

        <View style={styles.filters}>
          <FilterChip label="Hoy" value="hoy" current={filter} onPress={setFilter} />
          <FilterChip label="Pendientes" value="pendientes" current={filter} onPress={setFilter} />
          <FilterChip label="Gestionadas" value="gestionadas" current={filter} onPress={setFilter} />
          <FilterChip label="Promesas" value="promesas" current={filter} onPress={setFilter} />
          <FilterChip label="Todas" value="todas" current={filter} onPress={setFilter} />
        </View>

        {visibleVisits.length === 0 ? (
          <EmptyState title="Sin visitas" message="No hay visitas con este filtro." />
        ) : (
          visibleVisits.map((visit) => (
            <VisitCard key={visit.id} visit={visit} updateVisitStatus={updateVisitStatus} />
          ))
        )}
      </Screen>

      <BottomNav />
    </View>
  );
}

function FilterChip({
  label,
  value,
  current,
  onPress
}: {
  label: string;
  value: VisitFilter;
  current: VisitFilter;
  onPress: (value: VisitFilter) => void;
}) {
  const selected = value === current;

  return (
    <Pressable style={[styles.filterChip, selected ? styles.filterChipSelected : null]} onPress={() => onPress(value)}>
      <Text style={[styles.filterText, selected ? styles.filterTextSelected : null]}>{label}</Text>
    </Pressable>
  );
}

function VisitCard({
  visit,
  updateVisitStatus
}: {
  visit: Visit;
  updateVisitStatus: (
    visitId: string,
    status: VisitStatus,
    observacion?: string,
    promesaFecha?: string,
    promesaValor?: number,
    promesaEstado?: PromiseStatus
  ) => Promise<void>;
}) {
  const [observacion, setObservacion] = useState(visit.observacion || '');
  const [promesaFecha, setPromesaFecha] = useState(visit.promesaFecha || todayKey());
  const [promesaValor, setPromesaValor] = useState(visit.promesaValor ? String(visit.promesaValor) : '');

  const saveStatus = async (status: VisitStatus) => {
    await updateVisitStatus(visit.id, status, observacion.trim());
  };

  const savePromise = async () => {
    const value = parseMoney(promesaValor);

    if (!isValidDateKey(promesaFecha)) {
      Alert.alert('Fecha inválida', 'La fecha de promesa debe tener formato YYYY-MM-DD.');
      return;
    }

    if (!isPositiveMoney(value)) {
      Alert.alert('Valor inválido', 'Ingresa el valor prometido por el cliente.');
      return;
    }

    await updateVisitStatus(
      visit.id,
      'promesa',
      observacion.trim(),
      promesaFecha,
      value,
      'pendiente'
    );
  };

  return (
    <Card style={styles.visitCard}>
      <View style={styles.visitHeader}>
        <View style={styles.visitInfo}>
          <Text style={styles.clientName}>{visit.clienteNombre}</Text>
          <Text style={styles.clientMeta}>Teléfono: {visit.clienteTelefono}</Text>
          <Text style={styles.clientMeta}>Dirección: {visit.clienteDireccion}</Text>
          <Text style={styles.clientMeta}>Barrio: {visit.clienteBarrio}</Text>
          <Text style={styles.clientMeta}>Ruta: {visit.routeName || 'Sin ruta'}</Text>
          <Text style={styles.clientMeta}>Fecha visita: {visit.fecha}</Text>
        </View>

        <StatusBadge type={getVisitBadge(visit.estado)} label={getVisitLabel(visit.estado)} />
      </View>

      {visit.estado === 'promesa' ? (
        <View style={styles.promiseInfo}>
          <Text style={styles.promiseTitle}>Promesa registrada</Text>
          <Text style={styles.promiseText}>Fecha prometida: {visit.promesaFecha || 'Sin fecha'}</Text>
          <Text style={styles.promiseText}>Valor prometido: {formatMoney(visit.promesaValor || 0)}</Text>
          <Text style={styles.promiseText}>Estado: {visit.promesaEstado || 'pendiente'}</Text>
        </View>
      ) : null}

      <Input
        label="Observación"
        icon="📝"
        value={observacion}
        onChangeText={setObservacion}
        placeholder="Ej: cliente pagó, no estaba, promete pagar..."
      />

      <View style={styles.actionGrid}>
        <Button title="Visitado" variant="secondary" onPress={() => saveStatus('visitado')} style={styles.actionButton} />
        <Button title="Pagó" variant="secondary" onPress={() => saveStatus('pago')} style={styles.actionButton} />
      </View>

      <View style={styles.actionGrid}>
        <Button title="No pagó" variant="danger" onPress={() => saveStatus('no-pago')} style={styles.actionButton} />
        <Button title="No estaba" variant="danger" onPress={() => saveStatus('no-estaba')} style={styles.actionButton} />
      </View>

      <Card style={styles.promiseBox}>
        <Text style={styles.promiseFormTitle}>Registrar promesa</Text>

        <Input
          label="Fecha prometida"
          icon="📅"
          value={promesaFecha}
          onChangeText={setPromesaFecha}
          placeholder="YYYY-MM-DD"
        />

        <Input
          label="Valor prometido"
          icon="💰"
          value={promesaValor}
          onChangeText={setPromesaValor}
          keyboardType="numeric"
          placeholder="Ej: 20000"
        />

        <Button title="Guardar promesa" onPress={savePromise} />
      </Card>
    </Card>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  heroCard: { backgroundColor: colors.primary, marginBottom: 12 },
  heroTitle: { color: '#FFFFFF', fontSize: 21, fontWeight: '900' },
  heroText: { color: '#FFFFFF', opacity: 0.86, marginTop: 6, lineHeight: 20, fontWeight: '700' },
  heroButton: { marginTop: 14 },
  grid: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  metricCard: { flex: 1 },
  metricLabel: { color: colors.muted, fontWeight: '800', fontSize: 11 },
  metricValue: { color: colors.primary, fontWeight: '900', fontSize: 20, marginTop: 5 },
  warning: { color: colors.danger },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  filterChip: { borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#FFFFFF' },
  filterChipSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  filterText: { color: colors.muted, fontWeight: '900', fontSize: 12 },
  filterTextSelected: { color: colors.primary },
  visitCard: { marginBottom: 12 },
  visitHeader: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  visitInfo: { flex: 1 },
  clientName: { color: colors.text, fontWeight: '900', fontSize: 16 },
  clientMeta: { color: colors.muted, fontWeight: '700', marginTop: 4 },
  promiseInfo: { backgroundColor: '#FFF8E1', borderRadius: 14, padding: 12, marginTop: 12 },
  promiseTitle: { color: colors.text, fontWeight: '900' },
  promiseText: { color: colors.muted, fontWeight: '700', marginTop: 4 },
  actionGrid: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  actionButton: { flex: 1 },
  promiseBox: { backgroundColor: colors.background, marginTop: 8 },
  promiseFormTitle: { color: colors.text, fontWeight: '900', fontSize: 16, marginBottom: 10 }
});