import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
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
import { VisitStatus } from '../types';
import { todayKey } from '../utils/date';

function getVisitLabel(status: VisitStatus) {
  const labels: Record<VisitStatus, string> = {
    pendiente: 'Pendiente',
    visitado: 'Visitado',
    pago: 'Pagó',
    'no-pago': 'No pagó',
    'no-estaba': 'No estaba',
    promesa: 'Promesa'
  };

  return labels[status];
}

function getVisitBadgeType(status: VisitStatus): 'success' | 'danger' | 'warning' {
  if (status === 'pago' || status === 'visitado') return 'success';
  if (status === 'no-pago' || status === 'no-estaba') return 'danger';
  return 'warning';
}

export function VisitsScreen() {
  const {
    visits,
    createTodayVisits,
    updateVisitStatus,
    selectClient,
    isAdmin
  } = useApp();

  const [notes, setNotes] = useState<Record<string, string>>({});
  const [promiseDates, setPromiseDates] = useState<Record<string, string>>({});
  const [routeFilter, setRouteFilter] = useState('todos');

  const today = todayKey();

  const todayVisits = useMemo(() => {
    return visits.filter((visit) => visit.fecha === today);
  }, [today, visits]);

  const routeNames = useMemo(() => {
    const names = new Set(todayVisits.map((visit) => visit.routeName || 'Sin ruta'));
    return ['todos', ...Array.from(names)];
  }, [todayVisits]);

  const filteredVisits = useMemo(() => {
    if (routeFilter === 'todos') return todayVisits;
    return todayVisits.filter((visit) => (visit.routeName || 'Sin ruta') === routeFilter);
  }, [routeFilter, todayVisits]);

  const pendingCount = todayVisits.filter((visit) => visit.estado === 'pendiente').length;
  const doneCount = todayVisits.filter((visit) => visit.estado !== 'pendiente').length;
  const paidCount = todayVisits.filter((visit) => visit.estado === 'pago').length;
  const promiseCount = todayVisits.filter((visit) => visit.estado === 'promesa').length;

  const updateNote = (visitId: string, value: string) => {
    setNotes((current) => ({
      ...current,
      [visitId]: value
    }));
  };

  const updatePromiseDate = (visitId: string, value: string) => {
    setPromiseDates((current) => ({
      ...current,
      [visitId]: value
    }));
  };

  const markVisit = async (visitId: string, status: VisitStatus) => {
    const note = notes[visitId] ?? '';
    const promiseDate = promiseDates[visitId] ?? '';

    await updateVisitStatus(visitId, status, note, promiseDate);
  };

  return (
    <View style={styles.root}>
      <TopBar title="Visitas de hoy" rightText={isAdmin ? 'Admin' : 'Ruta'} />
      <Screen>
        <Card style={styles.infoCard}>
          <Text style={styles.infoTitle}>Recorrido diario</Text>
          <Text style={styles.infoText}>
            Genera las visitas del día según los clientes asignados a cada cobrador. Luego marca el resultado de cada visita.
          </Text>

          <Button title="Generar visitas de hoy" onPress={createTodayVisits} style={styles.generateButton} />
        </Card>

        <View style={styles.summaryGrid}>
          <Card style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{todayVisits.length}</Text>
            <Text style={styles.summaryLabel}>Total</Text>
          </Card>

          <Card style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{pendingCount}</Text>
            <Text style={styles.summaryLabel}>Pendientes</Text>
          </Card>

          <Card style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{doneCount}</Text>
            <Text style={styles.summaryLabel}>Gestionadas</Text>
          </Card>
        </View>

        <View style={styles.summaryGrid}>
          <Card style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{paidCount}</Text>
            <Text style={styles.summaryLabel}>Pagaron</Text>
          </Card>

          <Card style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{promiseCount}</Text>
            <Text style={styles.summaryLabel}>Promesas</Text>
          </Card>
        </View>

        <Text style={styles.sectionTitle}>Filtrar por ruta</Text>

        <View style={styles.filterList}>
          {routeNames.map((routeName) => {
            const selected = routeName === routeFilter;

            return (
              <Pressable
                key={routeName}
                style={[styles.filterChip, selected ? styles.filterChipSelected : null]}
                onPress={() => setRouteFilter(routeName)}
              >
                <Text style={[styles.filterText, selected ? styles.filterTextSelected : null]}>
                  {routeName === 'todos' ? 'Todas' : routeName}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>Clientes por visitar</Text>

        {filteredVisits.length === 0 ? (
          <EmptyState
            title="Sin visitas"
            message="Todavía no hay visitas generadas para hoy o no hay visitas en esta ruta."
          />
        ) : (
          filteredVisits.map((visit) => {
            const noteValue = notes[visit.id] ?? visit.observacion ?? '';
            const promiseValue = promiseDates[visit.id] ?? visit.promesaFecha ?? '';

            return (
              <Card key={visit.id} style={styles.visitCard}>
                <View style={styles.visitHeader}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{visit.clienteNombre.charAt(0).toUpperCase()}</Text>
                  </View>

                  <View style={styles.visitInfo}>
                    <Text style={styles.clientName}>{visit.clienteNombre}</Text>
                    <Text style={styles.clientMeta}>{visit.clienteTelefono}</Text>
                    <Text style={styles.clientMeta}>{visit.clienteBarrio} · {visit.clienteDireccion}</Text>
                    <Text style={styles.routeText}>Ruta: {visit.routeName || 'Sin ruta'}</Text>
                    <Text style={styles.routeText}>Cobrador: {visit.assignedToEmail || 'Sin cobrador'}</Text>
                  </View>

                  <StatusBadge type={getVisitBadgeType(visit.estado)} label={getVisitLabel(visit.estado)} />
                </View>

                <View style={styles.formBox}>
                  <Input
                    label="Observación"
                    icon="📝"
                    value={noteValue}
                    onChangeText={(value) => updateNote(visit.id, value)}
                    placeholder="Ej: Cliente no estaba, dijo que paga mañana..."
                  />

                  <Input
                    label="Fecha promesa de pago"
                    icon="📅"
                    value={promiseValue}
                    onChangeText={(value) => updatePromiseDate(visit.id, value)}
                    placeholder="YYYY-MM-DD, opcional"
                  />
                </View>

                <View style={styles.actions}>
                  <Button
                    title="Visitado"
                    variant="secondary"
                    onPress={() => markVisit(visit.id, 'visitado')}
                    style={styles.actionButton}
                  />

                  <Button
                    title="Pagó"
                    variant="secondary"
                    onPress={() => markVisit(visit.id, 'pago')}
                    style={styles.actionButton}
                  />

                  <Button
                    title="No pagó"
                    variant="danger"
                    onPress={() => markVisit(visit.id, 'no-pago')}
                    style={styles.actionButton}
                  />

                  <Button
                    title="No estaba"
                    variant="danger"
                    onPress={() => markVisit(visit.id, 'no-estaba')}
                    style={styles.actionButton}
                  />

                  <Button
                    title="Promesa"
                    variant="secondary"
                    onPress={() => markVisit(visit.id, 'promesa')}
                    style={styles.actionButton}
                  />

                  <Button
                    title="Ver cliente"
                    onPress={() => selectClient(visit.clienteId)}
                    style={styles.actionButton}
                  />
                </View>

                {visit.estado === 'pago' ? (
                  <Text style={styles.warningText}>
                    Recuerda registrar el pago real en la pantalla de pagos para actualizar el saldo del crédito.
                  </Text>
                ) : null}
              </Card>
            );
          })
        )}
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
    marginBottom: 14
  },
  infoTitle: {
    color: colors.primary,
    fontWeight: '900',
    fontSize: 16
  },
  infoText: {
    color: colors.muted,
    marginTop: 6,
    lineHeight: 20,
    fontWeight: '700'
  },
  generateButton: {
    marginTop: 14
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10
  },
  summaryCard: {
    flex: 1
  },
  summaryValue: {
    color: colors.primary,
    fontWeight: '900',
    fontSize: 20
  },
  summaryLabel: {
    color: colors.muted,
    fontWeight: '800',
    fontSize: 11,
    marginTop: 4
  },
  sectionTitle: {
    color: colors.text,
    fontWeight: '900',
    fontSize: 18,
    marginTop: 12,
    marginBottom: 10
  },
  filterList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10
  },
  filterChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF'
  },
  filterChipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft
  },
  filterText: {
    color: colors.muted,
    fontWeight: '800'
  },
  filterTextSelected: {
    color: colors.primary
  },
  visitCard: {
    marginBottom: 14
  },
  visitHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft
  },
  avatarText: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '900'
  },
  visitInfo: {
    flex: 1
  },
  clientName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900'
  },
  clientMeta: {
    color: colors.muted,
    fontWeight: '700',
    marginTop: 3
  },
  routeText: {
    color: colors.primary,
    fontWeight: '800',
    marginTop: 4,
    fontSize: 12
  },
  formBox: {
    marginTop: 14
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6
  },
  actionButton: {
    width: '48%',
    marginBottom: 8
  },
  warningText: {
    color: colors.danger,
    fontWeight: '800',
    marginTop: 8,
    lineHeight: 20
  }
});