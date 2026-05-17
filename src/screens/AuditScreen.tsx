import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BottomNav } from '../components/BottomNav';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { Input } from '../components/Input';
import { Screen } from '../components/Screen';
import { StatusBadge } from '../components/StatusBadge';
import { TopBar } from '../components/TopBar';
import { useApp } from '../state/AppContext';
import { colors } from '../theme/colors';
import { formatMoney } from '../utils/money';

type AuditFilter = 'todos' | 'ANULAR_PAGO' | 'CIERRE_CAJA';

export function AuditScreen() {
  const { auditLogs, navigate } = useApp();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<AuditFilter>('todos');

  const filteredLogs = useMemo(() => {
    const query = search.trim().toLowerCase();

    return auditLogs.filter((log) => {
      const matchesType = filter === 'todos' ? true : log.tipo === filter;

      const matchesSearch = query
        ? [
            log.tipo,
            log.descripcion,
            log.usuarioEmail,
            log.pagoId,
            log.creditoId,
            log.clienteId
          ]
            .join(' ')
            .toLowerCase()
            .includes(query)
        : true;

      return matchesType && matchesSearch;
    });
  }, [auditLogs, filter, search]);

  const canceledPayments = auditLogs.filter((log) => log.tipo === 'ANULAR_PAGO').length;
  const cashClosings = auditLogs.filter((log) => log.tipo === 'CIERRE_CAJA').length;

  return (
    <View style={styles.root}>
      <TopBar title="Auditoría" showBack onBack={() => navigate('more')} />
      <Screen>
        <Card style={styles.infoCard}>
          <Text style={styles.infoTitle}>Historial de acciones</Text>
          <Text style={styles.infoText}>
            Aquí puedes revisar acciones importantes del sistema, como anulaciones de pagos y cierres de caja.
          </Text>
        </Card>

        <View style={styles.summaryGrid}>
          <Card style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Registros</Text>
            <Text style={styles.summaryValue}>{auditLogs.length}</Text>
          </Card>

          <Card style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Pagos anulados</Text>
            <Text style={[styles.summaryValue, styles.danger]}>{canceledPayments}</Text>
          </Card>

          <Card style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Cierres</Text>
            <Text style={styles.summaryValue}>{cashClosings}</Text>
          </Card>
        </View>

        <Input
          label="Buscar auditoría"
          icon="🔎"
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar por usuario, tipo o descripción"
        />

        <View style={styles.filters}>
          <FilterChip label="Todos" value="todos" current={filter} onPress={setFilter} />
          <FilterChip label="Anulación pago" value="ANULAR_PAGO" current={filter} onPress={setFilter} />
          <FilterChip label="Cierre caja" value="CIERRE_CAJA" current={filter} onPress={setFilter} />
        </View>

        {filteredLogs.length === 0 ? (
          <EmptyState title="Sin registros" message="No hay auditoría con ese filtro." />
        ) : (
          filteredLogs.map((log) => {
            const isCancel = log.tipo === 'ANULAR_PAGO';
            const isClosing = log.tipo === 'CIERRE_CAJA';

            return (
              <Card key={log.id} style={styles.logCard}>
                <View style={styles.logHeader}>
                  <View style={styles.logInfo}>
                    <Text style={styles.logTitle}>
                      {isCancel ? 'Anulación de pago' : isClosing ? 'Cierre de caja' : log.tipo || 'Acción'}
                    </Text>
                    <Text style={styles.logDate}>{log.createdAt}</Text>
                  </View>

                  <StatusBadge
                    type={isCancel ? 'danger' : 'success'}
                    label={isCancel ? 'Pago' : isClosing ? 'Caja' : 'Sistema'}
                  />
                </View>

                <Text style={styles.description}>{log.descripcion || 'Sin descripción'}</Text>

                <View style={styles.detailBox}>
                  <Text style={styles.detail}>Usuario: {log.usuarioEmail || 'No registrado'}</Text>

                  {log.valor ? (
                    <Text style={styles.detail}>Valor: {formatMoney(log.valor)}</Text>
                  ) : null}

                  {log.pagoId ? (
                    <Text style={styles.detail}>Pago ID: {log.pagoId}</Text>
                  ) : null}

                  {log.creditoId ? (
                    <Text style={styles.detail}>Crédito ID: {log.creditoId}</Text>
                  ) : null}

                  {log.clienteId ? (
                    <Text style={styles.detail}>Cliente ID: {log.clienteId}</Text>
                  ) : null}
                </View>
              </Card>
            );
          })
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
  value: AuditFilter;
  current: AuditFilter;
  onPress: (value: AuditFilter) => void;
}) {
  const selected = value === current;

  return (
    <Pressable
      style={[styles.filterChip, selected ? styles.filterChipSelected : null]}
      onPress={() => onPress(value)}
    >
      <Text style={[styles.filterText, selected ? styles.filterTextSelected : null]}>
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
  infoCard: {
    backgroundColor: colors.primarySoft,
    marginBottom: 14
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
  summaryGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12
  },
  summaryCard: {
    flex: 1
  },
  summaryLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '800'
  },
  summaryValue: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: '900',
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
  filterText: {
    color: colors.muted,
    fontWeight: '900',
    fontSize: 12
  },
  filterTextSelected: {
    color: colors.primary
  },
  logCard: {
    marginBottom: 12
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10
  },
  logInfo: {
    flex: 1
  },
  logTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900'
  },
  logDate: {
    color: colors.muted,
    fontWeight: '700',
    marginTop: 4
  },
  description: {
    color: colors.text,
    fontWeight: '700',
    lineHeight: 20,
    marginTop: 10
  },
  detailBox: {
    backgroundColor: colors.background,
    borderRadius: 14,
    padding: 12,
    marginTop: 12
  },
  detail: {
    color: colors.muted,
    fontWeight: '700',
    marginBottom: 5
  }
});
