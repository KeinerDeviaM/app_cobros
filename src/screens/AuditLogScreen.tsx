import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { BottomNav } from '../components/BottomNav';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { Input } from '../components/Input';
import { Screen } from '../components/Screen';
import { StatusBadge } from '../components/StatusBadge';
import { TopBar } from '../components/TopBar';
import { db } from '../services/firebase';
import { useApp } from '../state/AppContext';
import { colors } from '../theme/colors';

type AuditFilter = 'todos' | 'EDITAR_PAGO' | 'ANULAR_PAGO' | 'EDITAR_CREDITO' | 'OTROS';

type AuditLog = {
  id: string;
  tipo: string;
  descripcion?: string;
  usuarioEmail?: string;
  motivo?: string;
  clienteId?: string;
  creditoId?: string;
  pagoId?: string;
  valor?: number;
  datosAnteriores?: unknown;
  datosNuevos?: unknown;
  createdAt?: string;
};

function normalize(value: unknown) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function formatJson(value: unknown) {
  if (!value) return 'Sin datos';

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function getAuditBadge(tipo: string) {
  if (tipo === 'EDITAR_PAGO') return 'warning';
  if (tipo === 'ANULAR_PAGO') return 'danger';
  if (tipo === 'EDITAR_CREDITO') return 'warning';
  return 'success';
}

function getAuditLabel(tipo: string) {
  if (tipo === 'EDITAR_PAGO') return 'Pago editado';
  if (tipo === 'ANULAR_PAGO') return 'Pago anulado';
  if (tipo === 'EDITAR_CREDITO') return 'Credito editado';
  return tipo || 'Registro';
}

export function AuditLogScreen() {
  const { navigate, isAdmin, isSupervisor } = useApp();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<AuditFilter>('todos');
  const [expandedId, setExpandedId] = useState('');
  const [loading, setLoading] = useState(false);

  const canViewAudit = isAdmin || isSupervisor;

  const loadAudit = async () => {
    if (!canViewAudit) return;

    setLoading(true);

    try {
      const auditQuery = query(
        collection(db, 'auditoria'),
        orderBy('createdAt', 'desc'),
        limit(150)
      );

      const snap = await getDocs(auditQuery);

      const items = snap.docs.map((docItem) => {
        const data = docItem.data() as Omit<AuditLog, 'id'>;

        return {
          id: docItem.id,
          ...data
        };
      });

      setLogs(items);
    } catch (error) {
      console.error('Error cargando auditoria:', error);
      Alert.alert('Error Firebase', 'No se pudo cargar la auditoria.');
    }

    setLoading(false);
  };

  useEffect(() => {
    loadAudit();
  }, [canViewAudit]);

  const filteredLogs = useMemo(() => {
    const value = normalize(search);

    return logs.filter((item) => {
      const matchesFilter =
        filter === 'todos'
          ? true
          : filter === 'OTROS'
            ? !['EDITAR_PAGO', 'ANULAR_PAGO', 'EDITAR_CREDITO'].includes(item.tipo)
            : item.tipo === filter;

      if (!matchesFilter) return false;

      if (!value) return true;

      const text = [
        item.tipo,
        item.descripcion,
        item.usuarioEmail,
        item.motivo,
        item.clienteId,
        item.creditoId,
        item.pagoId,
        item.valor,
        item.createdAt
      ].join(' ');

      return normalize(text).includes(value);
    });
  }, [filter, logs, search]);

  const summary = useMemo(() => {
    return {
      total: logs.length,
      editedPayments: logs.filter((item) => item.tipo === 'EDITAR_PAGO').length,
      canceledPayments: logs.filter((item) => item.tipo === 'ANULAR_PAGO').length,
      editedCredits: logs.filter((item) => item.tipo === 'EDITAR_CREDITO').length
    };
  }, [logs]);

  if (!canViewAudit) {
    return (
      <View style={styles.root}>
        <TopBar title="Auditoria" showBack onBack={() => navigate('more')} />

        <Screen>
          <EmptyState title="Acceso restringido" message="Solo administrador o supervisor puede ver la auditoria." />
        </Screen>

        <BottomNav />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <TopBar title="Auditoria avanzada" showBack onBack={() => navigate('more')} rightText="Actualizar" onRightPress={loadAudit} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadAudit} />}
      >
        <Card style={styles.heroCard}>
          <Text style={styles.heroTitle}>Historial de auditoria</Text>
          <Text style={styles.heroText}>
            Revisa acciones sensibles como pagos editados, pagos anulados y creditos modificados.
          </Text>
        </Card>

        <View style={styles.grid}>
          <Metric title="Total" value={String(summary.total)} />
          <Metric title="Pagos editados" value={String(summary.editedPayments)} danger={summary.editedPayments > 0} />
        </View>

        <View style={styles.grid}>
          <Metric title="Pagos anulados" value={String(summary.canceledPayments)} danger={summary.canceledPayments > 0} />
          <Metric title="Creditos editados" value={String(summary.editedCredits)} danger={summary.editedCredits > 0} />
        </View>

        <Input
          label="Buscar auditoria"
          icon="B"
          value={search}
          onChangeText={setSearch}
          placeholder="Usuario, motivo, credito, pago o fecha"
          autoCapitalize="none"
        />

        <View style={styles.filters}>
          <FilterChip label="Todos" value="todos" current={filter} onPress={setFilter} />
          <FilterChip label="Pago editado" value="EDITAR_PAGO" current={filter} onPress={setFilter} />
          <FilterChip label="Pago anulado" value="ANULAR_PAGO" current={filter} onPress={setFilter} danger />
          <FilterChip label="Credito editado" value="EDITAR_CREDITO" current={filter} onPress={setFilter} />
          <FilterChip label="Otros" value="OTROS" current={filter} onPress={setFilter} />
        </View>

        {filteredLogs.length === 0 ? (
          <EmptyState title="Sin auditoria" message="No hay registros con ese filtro." />
        ) : (
          filteredLogs.map((item) => {
            const expanded = expandedId === item.id;

            return (
              <Card key={item.id} style={styles.logCard}>
                <Pressable onPress={() => setExpandedId(expanded ? '' : item.id)}>
                  <View style={styles.logHeader}>
                    <View style={styles.logInfo}>
                      <Text style={styles.logTitle}>{getAuditLabel(item.tipo)}</Text>
                      <Text style={styles.meta}>Usuario: {item.usuarioEmail || 'No registrado'}</Text>
                      <Text style={styles.meta}>Fecha: {item.createdAt || 'Sin fecha'}</Text>
                      <Text style={styles.meta}>Descripcion: {item.descripcion || 'Sin descripcion'}</Text>
                    </View>

                    <StatusBadge type={getAuditBadge(item.tipo)} label={expanded ? 'Ocultar' : 'Ver'} />
                  </View>
                </Pressable>

                {item.motivo ? (
                  <Text style={styles.reason}>Motivo: {item.motivo}</Text>
                ) : null}

                <View style={styles.idsBox}>
                  <Text style={styles.idText}>Pago: {item.pagoId || 'No aplica'}</Text>
                  <Text style={styles.idText}>Credito: {item.creditoId || 'No aplica'}</Text>
                  <Text style={styles.idText}>Cliente: {item.clienteId || 'No aplica'}</Text>
                </View>

                {expanded ? (
                  <View style={styles.detailBox}>
                    <Text style={styles.detailTitle}>Datos anteriores</Text>
                    <Text style={styles.jsonText}>{formatJson(item.datosAnteriores)}</Text>

                    <Text style={styles.detailTitle}>Datos nuevos</Text>
                    <Text style={styles.jsonText}>{formatJson(item.datosNuevos)}</Text>
                  </View>
                ) : null}
              </Card>
            );
          })
        )}
      </ScrollView>

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

function FilterChip({
  label,
  value,
  current,
  onPress,
  danger = false
}: {
  label: string;
  value: AuditFilter;
  current: AuditFilter;
  onPress: (value: AuditFilter) => void;
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

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background
  },
  scroll: {
    flex: 1
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 96
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
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14
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
  filterChipDanger: {
    borderColor: colors.danger,
    backgroundColor: '#FFF5F5'
  },
  filterText: {
    color: colors.muted,
    fontWeight: '900',
    fontSize: 12
  },
  filterTextSelected: {
    color: colors.primary
  },
  filterTextDanger: {
    color: colors.danger
  },
  logCard: {
    marginBottom: 12
  },
  logHeader: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start'
  },
  logInfo: {
    flex: 1
  },
  logTitle: {
    color: colors.text,
    fontWeight: '900',
    fontSize: 16
  },
  meta: {
    color: colors.muted,
    fontWeight: '700',
    marginTop: 5,
    lineHeight: 20
  },
  reason: {
    color: colors.primary,
    fontWeight: '900',
    marginTop: 10,
    lineHeight: 20
  },
  idsBox: {
    backgroundColor: colors.background,
    borderRadius: 14,
    padding: 12,
    marginTop: 12
  },
  idText: {
    color: colors.muted,
    fontWeight: '700',
    marginTop: 3
  },
  detailBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.border
  },
  detailTitle: {
    color: colors.text,
    fontWeight: '900',
    marginTop: 8,
    marginBottom: 6
  },
  jsonText: {
    color: colors.muted,
    fontWeight: '700',
    lineHeight: 18
  }
});