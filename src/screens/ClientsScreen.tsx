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
import { formatMoney } from '../utils/money';

type StatusFilter = 'todos' | 'al-dia' | 'en-mora';
type CreditFilter = 'todos' | 'con-credito' | 'sin-credito' | 'con-saldo' | 'sin-saldo';

export function ClientsScreen() {
  const {
    clients,
    credits,
    navigate,
    selectClient,
    isAdmin,
    users,
    routes,
    assignClientToCollector,
    assignClientToRoute
  } = useApp();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('todos');
  const [creditFilter, setCreditFilter] = useState<CreditFilter>('todos');
  const [routeFilter, setRouteFilter] = useState('todos');
  const [collectorFilter, setCollectorFilter] = useState('todos');

  const collectors = useMemo(
    () => users.filter((user) => user.role === 'cobrador' && user.activo),
    [users]
  );

  const clientCreditSummary = useMemo(() => {
    const summary: Record<string, { totalCredits: number; activeCredits: number; pending: number; paid: number }> = {};

    clients.forEach((client) => {
      summary[client.id] = {
        totalCredits: 0,
        activeCredits: 0,
        pending: 0,
        paid: 0
      };
    });

    credits.forEach((credit) => {
      if (!summary[credit.clienteId]) {
        summary[credit.clienteId] = {
          totalCredits: 0,
          activeCredits: 0,
          pending: 0,
          paid: 0
        };
      }

      summary[credit.clienteId].totalCredits += 1;

      if (credit.estado === 'activo' || credit.estado === 'vencido') {
        summary[credit.clienteId].activeCredits += 1;
      }

      summary[credit.clienteId].pending += credit.saldoPendiente;
      summary[credit.clienteId].paid += Math.max(credit.valorTotal - credit.saldoPendiente, 0);
    });

    return summary;
  }, [clients, credits]);

  const filtered = useMemo(() => {
    const searchQuery = search.trim().toLowerCase();

    return clients.filter((client) => {
      const summary = clientCreditSummary[client.id] ?? {
        totalCredits: 0,
        activeCredits: 0,
        pending: 0,
        paid: 0
      };

      const matchesSearch = searchQuery
        ? [
            client.nombre,
            client.telefono,
            client.documento,
            client.barrio,
            client.direccion,
            client.assignedToEmail,
            client.routeName
          ]
            .join(' ')
            .toLowerCase()
            .includes(searchQuery)
        : true;

      const matchesStatus = statusFilter === 'todos' ? true : client.estado === statusFilter;

      const matchesRoute =
        routeFilter === 'todos'
          ? true
          : routeFilter === 'sin-ruta'
            ? !client.routeId
            : client.routeId === routeFilter;

      const matchesCollector =
        collectorFilter === 'todos'
          ? true
          : collectorFilter === 'sin-cobrador'
            ? !client.assignedToUid
            : client.assignedToUid === collectorFilter;

      const matchesCredit =
        creditFilter === 'todos'
          ? true
          : creditFilter === 'con-credito'
            ? summary.totalCredits > 0
            : creditFilter === 'sin-credito'
              ? summary.totalCredits === 0
              : creditFilter === 'con-saldo'
                ? summary.pending > 0
                : summary.totalCredits > 0 && summary.pending === 0;

      return matchesSearch && matchesStatus && matchesRoute && matchesCollector && matchesCredit;
    });
  }, [clientCreditSummary, clients, collectorFilter, creditFilter, routeFilter, search, statusFilter]);

  const totals = useMemo(() => {
    return filtered.reduce(
      (acc, client) => {
        const summary = clientCreditSummary[client.id] ?? {
          totalCredits: 0,
          activeCredits: 0,
          pending: 0,
          paid: 0
        };

        acc.pending += summary.pending;
        acc.withDebt += summary.pending > 0 ? 1 : 0;
        acc.withoutCredit += summary.totalCredits === 0 ? 1 : 0;

        return acc;
      },
      {
        pending: 0,
        withDebt: 0,
        withoutCredit: 0
      }
    );
  }, [clientCreditSummary, filtered]);

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('todos');
    setCreditFilter('todos');
    setRouteFilter('todos');
    setCollectorFilter('todos');
  };

  return (
    <View style={styles.root}>
      <TopBar title="Clientes" rightText={isAdmin ? '+' : undefined} onRightPress={isAdmin ? () => navigate('newClient') : undefined} />

      <Screen>
        <Input
          label="Buscar cliente"
          icon="🔎"
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar por nombre, teléfono, barrio, cobrador o ruta"
        />

        <View style={styles.summaryGrid}>
          <Card style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Filtrados</Text>
            <Text style={styles.summaryValue}>{filtered.length}</Text>
          </Card>

          <Card style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Con saldo</Text>
            <Text style={[styles.summaryValue, styles.danger]}>{totals.withDebt}</Text>
          </Card>

          <Card style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Pendiente</Text>
            <Text style={[styles.summaryValue, styles.danger]}>{formatMoney(totals.pending)}</Text>
          </Card>
        </View>

        <Card style={styles.filtersCard}>
          <View style={styles.filterHeader}>
            <Text style={styles.filterTitle}>Filtros avanzados</Text>

            <Pressable onPress={clearFilters}>
              <Text style={styles.clearFilters}>Limpiar</Text>
            </Pressable>
          </View>

          <Text style={styles.filterLabel}>Estado</Text>
          <View style={styles.chipList}>
            <FilterChip label="Todos" value="todos" current={statusFilter} onPress={setStatusFilter} />
            <FilterChip label="Al día" value="al-dia" current={statusFilter} onPress={setStatusFilter} />
            <FilterChip label="En mora" value="en-mora" current={statusFilter} onPress={setStatusFilter} danger />
          </View>

          <Text style={styles.filterLabel}>Crédito</Text>
          <View style={styles.chipList}>
            <FilterChip label="Todos" value="todos" current={creditFilter} onPress={setCreditFilter} />
            <FilterChip label="Con crédito" value="con-credito" current={creditFilter} onPress={setCreditFilter} />
            <FilterChip label="Sin crédito" value="sin-credito" current={creditFilter} onPress={setCreditFilter} />
            <FilterChip label="Con saldo" value="con-saldo" current={creditFilter} onPress={setCreditFilter} danger />
            <FilterChip label="Sin saldo" value="sin-saldo" current={creditFilter} onPress={setCreditFilter} />
          </View>

          <Text style={styles.filterLabel}>Ruta</Text>
          <View style={styles.chipList}>
            <FilterChip label="Todas" value="todos" current={routeFilter} onPress={setRouteFilter} />
            <FilterChip label="Sin ruta" value="sin-ruta" current={routeFilter} onPress={setRouteFilter} />

            {routes.map((route) => (
              <FilterChip
                key={route.id}
                label={route.nombre}
                value={route.id}
                current={routeFilter}
                onPress={setRouteFilter}
              />
            ))}
          </View>

          <Text style={styles.filterLabel}>Cobrador</Text>
          <View style={styles.chipList}>
            <FilterChip label="Todos" value="todos" current={collectorFilter} onPress={setCollectorFilter} />
            <FilterChip label="Sin cobrador" value="sin-cobrador" current={collectorFilter} onPress={setCollectorFilter} />

            {collectors.map((collector) => (
              <FilterChip
                key={collector.id}
                label={collector.email}
                value={collector.uid}
                current={collectorFilter}
                onPress={setCollectorFilter}
              />
            ))}
          </View>
        </Card>

        {filtered.length === 0 ? (
          <EmptyState
            title="Sin clientes"
            message={isAdmin ? 'No encontramos clientes con esos filtros.' : 'No tienes clientes asignados con esos filtros.'}
          />
        ) : (
          filtered.map((client) => {
            const summary = clientCreditSummary[client.id] ?? {
              totalCredits: 0,
              activeCredits: 0,
              pending: 0,
              paid: 0
            };

            return (
              <Card key={client.id} style={styles.clientCard}>
                <Pressable style={styles.clientHeader} onPress={() => selectClient(client.id)}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{client.nombre.charAt(0).toUpperCase()}</Text>
                  </View>

                  <View style={styles.info}>
                    <Text style={styles.name}>{client.nombre}</Text>
                    <Text style={styles.phone}>{client.telefono}</Text>
                    <Text style={styles.address}>{client.barrio} · {client.direccion}</Text>
                    <Text style={styles.assigned}>Cobrador: {client.assignedToEmail || 'Sin asignar'}</Text>
                    <Text style={styles.route}>Ruta: {client.routeName || 'Sin ruta'}</Text>
                    <Text style={styles.openDetail}>Tocar para ver detalle</Text>
                  </View>

                  <StatusBadge type={client.estado === 'al-dia' ? 'success' : 'danger'} label={client.estado === 'al-dia' ? 'Al día' : 'En mora'} />
                </Pressable>

                <View style={styles.creditSummary}>
                  <View style={styles.creditBox}>
                    <Text style={styles.creditLabel}>Créditos</Text>
                    <Text style={styles.creditValue}>{summary.totalCredits}</Text>
                  </View>

                  <View style={styles.creditBox}>
                    <Text style={styles.creditLabel}>Activos</Text>
                    <Text style={styles.creditValue}>{summary.activeCredits}</Text>
                  </View>

                  <View style={styles.creditBox}>
                    <Text style={styles.creditLabel}>Saldo</Text>
                    <Text style={[styles.creditValue, summary.pending > 0 ? styles.danger : styles.success]}>
                      {formatMoney(summary.pending)}
                    </Text>
                  </View>
                </View>

                {isAdmin ? (
                  <>
                    <View style={styles.assignmentBox}>
                      <Text style={styles.assignmentTitle}>Reasignar cobrador</Text>

                      <View style={styles.assignmentList}>
                        {collectors.length === 0 ? (
                          <Text style={styles.noItems}>No hay cobradores activos.</Text>
                        ) : (
                          collectors.map((collector) => {
                            const selected = client.assignedToUid === collector.uid;

                            return (
                              <Pressable
                                key={collector.id}
                                style={[styles.chip, selected ? styles.chipSelected : null]}
                                onPress={() => assignClientToCollector(client.id, collector)}
                              >
                                <Text style={[styles.chipText, selected ? styles.chipTextSelected : null]}>
                                  {collector.email}
                                </Text>
                              </Pressable>
                            );
                          })
                        )}

                        <Pressable style={styles.chip} onPress={() => assignClientToCollector(client.id, null)}>
                          <Text style={styles.chipText}>Sin asignar</Text>
                        </Pressable>
                      </View>
                    </View>

                    <View style={styles.assignmentBox}>
                      <Text style={styles.assignmentTitle}>Asignar ruta</Text>

                      <View style={styles.assignmentList}>
                        {routes.length === 0 ? (
                          <Text style={styles.noItems}>No hay rutas creadas.</Text>
                        ) : (
                          routes.map((route) => {
                            const selected = client.routeId === route.id;

                            return (
                              <Pressable
                                key={route.id}
                                style={[styles.chip, selected ? styles.chipSelected : null]}
                                onPress={() => assignClientToRoute(client.id, route)}
                              >
                                <Text style={[styles.chipText, selected ? styles.chipTextSelected : null]}>
                                  {route.nombre}
                                </Text>
                              </Pressable>
                            );
                          })
                        )}

                        <Pressable style={styles.chip} onPress={() => assignClientToRoute(client.id, null)}>
                          <Text style={styles.chipText}>Sin ruta</Text>
                        </Pressable>
                      </View>
                    </View>
                  </>
                ) : null}
              </Card>
            );
          })
        )}

        {isAdmin ? (
          <>
            <Pressable style={styles.floating} onPress={() => navigate('newClient')}>
              <Text style={styles.floatingText}>+</Text>
            </Pressable>

            <Button title="Crear nuevo cliente" onPress={() => navigate('newClient')} style={styles.bottomButton} />
          </>
        ) : (
          <Card style={styles.infoCard}>
            <Text style={styles.infoTitle}>Clientes asignados</Text>
            <Text style={styles.infoText}>Solo ves los clientes que el administrador asignó a tu usuario.</Text>
          </Card>
        )}
      </Screen>

      <BottomNav />
    </View>
  );
}

function FilterChip<T extends string>({
  label,
  value,
  current,
  onPress,
  danger = false
}: {
  label: string;
  value: T;
  current: T;
  onPress: (value: T) => void;
  danger?: boolean;
}) {
  const selected = value === current;

  return (
    <Pressable
      style={[
        styles.filterChip,
        selected ? styles.filterChipSelected : null,
        selected && danger ? styles.filterChipDangerSelected : null
      ]}
      onPress={() => onPress(value)}
    >
      <Text
        style={[
          styles.filterChipText,
          selected ? styles.filterChipTextSelected : null,
          selected && danger ? styles.filterChipTextDanger : null
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
    fontWeight: '800',
    fontSize: 11
  },
  summaryValue: {
    color: colors.primary,
    fontWeight: '900',
    fontSize: 16,
    marginTop: 5
  },
  danger: {
    color: colors.danger
  },
  success: {
    color: colors.success
  },
  filtersCard: {
    marginBottom: 14
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    alignItems: 'center',
    marginBottom: 8
  },
  filterTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900'
  },
  clearFilters: {
    color: colors.danger,
    fontWeight: '900'
  },
  filterLabel: {
    color: colors.text,
    fontWeight: '900',
    marginTop: 12,
    marginBottom: 8
  },
  chipList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  filterChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF'
  },
  filterChipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft
  },
  filterChipDangerSelected: {
    borderColor: colors.danger,
    backgroundColor: '#FFF5F5'
  },
  filterChipText: {
    color: colors.muted,
    fontWeight: '900',
    fontSize: 12
  },
  filterChipTextSelected: {
    color: colors.primary
  },
  filterChipTextDanger: {
    color: colors.danger
  },
  clientCard: {
    marginBottom: 10
  },
  clientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft
  },
  avatarText: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '900'
  },
  info: {
    flex: 1
  },
  name: {
    color: colors.text,
    fontWeight: '900',
    fontSize: 15
  },
  phone: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 2
  },
  address: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2
  },
  assigned: {
    color: colors.primary,
    fontSize: 12,
    marginTop: 4,
    fontWeight: '800'
  },
  route: {
    color: colors.text,
    fontSize: 12,
    marginTop: 3,
    fontWeight: '800'
  },
  openDetail: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 4,
    fontWeight: '700'
  },
  creditSummary: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14
  },
  creditBox: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 14,
    padding: 10
  },
  creditLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '800'
  },
  creditValue: {
    color: colors.primary,
    fontWeight: '900',
    marginTop: 4
  },
  assignmentBox: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12
  },
  assignmentTitle: {
    color: colors.text,
    fontWeight: '900',
    marginBottom: 8
  },
  assignmentList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  noItems: {
    color: colors.danger,
    fontWeight: '800',
    fontSize: 12
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: '#FFFFFF'
  },
  chipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft
  },
  chipText: {
    color: colors.muted,
    fontWeight: '800',
    fontSize: 12
  },
  chipTextSelected: {
    color: colors.primary
  },
  floating: {
    position: 'absolute',
    right: 18,
    bottom: 104,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4
  },
  floatingText: {
    color: '#FFFFFF',
    fontSize: 32,
    lineHeight: 36,
    fontWeight: '700'
  },
  bottomButton: {
    marginTop: 12
  },
  infoCard: {
    marginTop: 16,
    backgroundColor: colors.primarySoft
  },
  infoTitle: {
    color: colors.primary,
    fontWeight: '900',
    fontSize: 16
  },
  infoText: {
    color: colors.muted,
    marginTop: 6,
    lineHeight: 20
  }
});
