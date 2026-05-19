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
import { todayKey } from '../utils/date';
import { buildInstallments } from '../utils/installments';
import { formatMoney } from '../utils/money';

type RouteView = 'resumen' | 'clientes' | 'creditos' | 'pagos' | 'gastos';

function normalize(value: unknown) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export function RoutesScreen() {
  const {
    routes,
    clients,
    credits,
    payments,
    expenses,
    navigate,
    selectClient,
    selectCredit
  } = useApp();

  const [query, setQuery] = useState('');
  const [selectedRouteId, setSelectedRouteId] = useState('');
  const [view, setView] = useState<RouteView>('resumen');

  const filteredRoutes = useMemo(() => {
    const value = normalize(query);

    if (!value) return routes;

    return routes.filter((route) => {
      const text = [route.nombre, route.id].join(' ');
      return normalize(text).includes(value);
    });
  }, [query, routes]);

  const selectedRoute = useMemo(() => {
    return routes.find((route) => route.id === selectedRouteId) || filteredRoutes[0];
  }, [filteredRoutes, routes, selectedRouteId]);

  const selectedRouteClients = useMemo(() => {
    if (!selectedRoute) return [];
    return clients.filter((client) => client.routeId === selectedRoute.id);
  }, [clients, selectedRoute]);

  const selectedRouteClientIds = useMemo(() => {
    return new Set(selectedRouteClients.map((client) => client.id));
  }, [selectedRouteClients]);

  const selectedRouteCredits = useMemo(() => {
    return credits.filter((credit) => selectedRouteClientIds.has(credit.clienteId));
  }, [credits, selectedRouteClientIds]);

  const selectedRoutePayments = useMemo(() => {
    return payments.filter((payment) => selectedRouteClientIds.has(payment.clienteId));
  }, [payments, selectedRouteClientIds]);

  const selectedRouteExpenses = useMemo(() => {
    if (!selectedRoute) return [];

    return expenses.filter((expense) => {
      const data = expense as typeof expense & {
        routeId?: string;
        routeName?: string;
      };

      if (data.routeId) return data.routeId === selectedRoute.id;
      if (data.routeName) return data.routeName === selectedRoute.nombre;

      return false;
    });
  }, [expenses, selectedRoute]);

  const routeStats = useMemo(() => {
    const activeCredits = selectedRouteCredits.filter((credit) => credit.estado !== 'anulado');
    const paidCredits = activeCredits.filter((credit) => credit.estado === 'pagado');
    const pendingCredits = activeCredits.filter((credit) => credit.estado !== 'pagado');
    const overdueCredits = activeCredits.filter((credit) => credit.estado === 'vencido');

    const activePayments = selectedRoutePayments.filter((payment) => payment.estado !== 'anulado');
    const activeExpenses = selectedRouteExpenses.filter((expense) => expense.estado !== 'anulado');

    const totalPrestado = activeCredits.reduce((total, credit) => total + credit.valorPrestado, 0);
    const totalAPagar = activeCredits.reduce((total, credit) => total + credit.valorTotal, 0);
    const totalPendiente = activeCredits.reduce((total, credit) => total + credit.saldoPendiente, 0);
    const totalPagado = activePayments.reduce((total, payment) => total + payment.valorPagado, 0);
    const totalGastos = activeExpenses.reduce((total, expense) => total + expense.valor, 0);

    const efectivo = activePayments
      .filter((payment) => payment.metodoPago === 'Efectivo')
      .reduce((total, payment) => total + payment.valorPagado, 0);

    const transferencia = activePayments
      .filter((payment) => payment.metodoPago !== 'Efectivo')
      .reduce((total, payment) => total + payment.valorPagado, 0);

    const estimateToday = activeCredits
      .filter((credit) => credit.estado !== 'pagado')
      .reduce((total, credit) => {
        const due = buildInstallments(credit, payments, todayKey()).filter(
          (item) => item.fecha <= todayKey() && item.pendiente > 0
        );

        return total + due.reduce((sum, item) => sum + item.pendiente, 0);
      }, 0);

    const clientsOk = selectedRouteClients.filter((client) => client.estado === 'al-dia').length;
    const clientsMora = selectedRouteClients.filter((client) => client.estado === 'en-mora').length;

    return {
      activeCredits,
      paidCredits,
      pendingCredits,
      overdueCredits,
      activePayments,
      activeExpenses,
      totalPrestado,
      totalAPagar,
      totalPendiente,
      totalPagado,
      totalGastos,
      efectivo,
      transferencia,
      cajaFinal: totalPagado - totalGastos,
      estimateToday,
      clientsOk,
      clientsMora
    };
  }, [payments, selectedRouteClients, selectedRouteCredits, selectedRouteExpenses, selectedRoutePayments]);

  return (
    <View style={styles.root}>
      <TopBar title="Rutas" showBack onBack={() => navigate('more')} />

      <Screen>
        <Card style={styles.heroCard}>
          <Text style={styles.heroTitle}>Control por rutas</Text>
          <Text style={styles.heroText}>
            Consulta clientes, creditos, pagos, gastos y caja estimada de cada ruta.
          </Text>
        </Card>

        <Input
          label="Buscar ruta"
          icon="B"
          value={query}
          onChangeText={setQuery}
          placeholder="Nombre de ruta"
        />

        {filteredRoutes.length === 0 ? (
          <EmptyState title="Sin rutas" message="No hay rutas registradas con esa busqueda." />
        ) : (
          <>
            <Text style={styles.label}>Selecciona ruta</Text>

            <View style={styles.chips}>
              {filteredRoutes.map((route) => {
                const selected = selectedRoute?.id === route.id;

                return (
                  <Pressable
                    key={route.id}
                    style={[styles.chip, selected ? styles.chipSelected : null]}
                    onPress={() => setSelectedRouteId(route.id)}
                  >
                    <Text style={[styles.chipText, selected ? styles.chipTextSelected : null]}>
                      {route.nombre}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}

        {selectedRoute ? (
          <>
            <Card style={styles.routeHeader}>
              <Text style={styles.routeTitle}>{selectedRoute.nombre}</Text>
              <Text style={styles.routeMeta}>Clientes: {selectedRouteClients.length}</Text>
              <Text style={styles.routeMeta}>Estimado a cobrar hoy: {formatMoney(routeStats.estimateToday)}</Text>
            </Card>

            <View style={styles.tabs}>
              <Tab label="Resumen" value="resumen" current={view} onPress={setView} />
              <Tab label="Clientes" value="clientes" current={view} onPress={setView} />
              <Tab label="Creditos" value="creditos" current={view} onPress={setView} />
              <Tab label="Pagos" value="pagos" current={view} onPress={setView} />
              <Tab label="Gastos" value="gastos" current={view} onPress={setView} />
            </View>

            {view === 'resumen' ? (
              <>
                <View style={styles.grid}>
                  <Metric title="A cobrar hoy" value={formatMoney(routeStats.estimateToday)} danger={routeStats.estimateToday > 0} />
                  <Metric title="Caja final" value={formatMoney(routeStats.cajaFinal)} danger={routeStats.cajaFinal < 0} />
                </View>

                <View style={styles.grid}>
                  <Metric title="Efectivo" value={formatMoney(routeStats.efectivo)} />
                  <Metric title="Transferencia" value={formatMoney(routeStats.transferencia)} />
                </View>

                <View style={styles.grid}>
                  <Metric title="Pagos" value={formatMoney(routeStats.totalPagado)} />
                  <Metric title="Gastos" value={formatMoney(routeStats.totalGastos)} danger={routeStats.totalGastos > 0} />
                </View>

                <View style={styles.grid}>
                  <Metric title="Prestado" value={formatMoney(routeStats.totalPrestado)} />
                  <Metric title="Pendiente" value={formatMoney(routeStats.totalPendiente)} danger={routeStats.totalPendiente > 0} />
                </View>

                <View style={styles.grid}>
                  <Metric title="Al dia" value={String(routeStats.clientsOk)} />
                  <Metric title="En mora" value={String(routeStats.clientsMora)} danger={routeStats.clientsMora > 0} />
                </View>

                <View style={styles.grid}>
                  <Metric title="Creditos activos" value={String(routeStats.pendingCredits.length)} />
                  <Metric title="Creditos cumplidos" value={String(routeStats.paidCredits.length)} />
                </View>

                <Card style={styles.actionsCard}>
                  <Text style={styles.sectionTitle}>Acciones rapidas</Text>
                  <Button title="Crear cliente" variant="secondary" onPress={() => navigate('newClient')} style={styles.actionButton} />
                  <Button title="Registrar gasto de ruta" variant="secondary" onPress={() => navigate('dailyCash')} style={styles.actionButton} />
                  <Button title="Ir a caja diaria" onPress={() => navigate('dailyCash')} style={styles.actionButton} />
                </Card>
              </>
            ) : null}

            {view === 'clientes' ? (
              selectedRouteClients.length === 0 ? (
                <EmptyState title="Sin clientes" message="Esta ruta todavia no tiene clientes." />
              ) : (
                selectedRouteClients.map((client) => {
                  const clientCredits = selectedRouteCredits.filter((credit) => credit.clienteId === client.id && credit.estado !== 'anulado');
                  const clientDebt = clientCredits.reduce((total, credit) => total + credit.saldoPendiente, 0);
                  const activeCredit = clientCredits.find((credit) => credit.estado !== 'pagado');

                  return (
                    <Card key={client.id} style={styles.itemCard}>
                      <View style={styles.itemHeader}>
                        <View style={styles.itemInfo}>
                          <Text style={styles.itemTitle}>{client.nombre}</Text>
                          <Text style={styles.meta}>Telefono: {client.telefono}</Text>
                          <Text style={styles.meta}>Direccion: {client.direccion}</Text>
                          <Text style={styles.meta}>Deuda pendiente: {formatMoney(clientDebt)}</Text>
                        </View>

                        <StatusBadge
                          type={client.estado === 'al-dia' ? 'success' : 'danger'}
                          label={client.estado === 'al-dia' ? 'Al dia' : 'En mora'}
                        />
                      </View>

                      <View style={styles.buttonRow}>
                        <Button title="Ver cliente" variant="secondary" onPress={() => selectClient(client.id)} style={styles.rowButton} />
                        {activeCredit ? (
                          <Button title="Pagar" onPress={() => selectCredit(activeCredit.id)} style={styles.rowButton} />
                        ) : null}
                      </View>
                    </Card>
                  );
                })
              )
            ) : null}

            {view === 'creditos' ? (
              selectedRouteCredits.length === 0 ? (
                <EmptyState title="Sin creditos" message="Esta ruta no tiene creditos registrados." />
              ) : (
                selectedRouteCredits.map((credit) => {
                  const client = clients.find((item) => item.id === credit.clienteId);
                  const creditPayments = payments.filter((payment) => payment.creditoId === credit.id && payment.estado !== 'anulado');
                  const totalPaid = creditPayments.reduce((total, payment) => total + payment.valorPagado, 0);
                  const installments = buildInstallments(credit, payments, todayKey());
                  const paidInstallments = installments.filter((item) => item.estado === 'pagada').length;
                  const overdueInstallments = installments.filter((item) => item.estado === 'vencida').length;
                  const pendingInstallments = installments.filter((item) => item.pendiente > 0).length;

                  return (
                    <Card key={credit.id} style={styles.itemCard}>
                      <View style={styles.itemHeader}>
                        <View style={styles.itemInfo}>
                          <Text style={styles.itemTitle}>{client?.nombre || 'Cliente no encontrado'}</Text>
                          <Text style={styles.meta}>ID credito: {credit.id}</Text>
                          <Text style={styles.meta}>Inicio: {credit.fechaInicio}</Text>
                          <Text style={styles.meta}>Final: {credit.fechaFinal || 'No registrado'}</Text>
                          <Text style={styles.meta}>Valor credito: {formatMoney(credit.valorPrestado)}</Text>
                          <Text style={styles.meta}>Total a pagar: {formatMoney(credit.valorTotal)}</Text>
                          <Text style={styles.meta}>Total pagado: {formatMoney(totalPaid)}</Text>
                          <Text style={styles.meta}>Falta pagar: {formatMoney(credit.saldoPendiente)}</Text>
                          <Text style={styles.meta}>Cuotas: {credit.numeroCuotas}</Text>
                          <Text style={styles.meta}>Pagadas: {paidInstallments} | Atrasadas: {overdueInstallments} | Pendientes: {pendingInstallments}</Text>
                          <Text style={styles.meta}>Valor cuota: {formatMoney(credit.valorCuota)}</Text>
                          <Text style={styles.meta}>Frecuencia: {credit.frecuencia}</Text>
                        </View>

                        <StatusBadge
                          type={credit.estado === 'pagado' ? 'success' : credit.estado === 'vencido' || credit.estado === 'anulado' ? 'danger' : 'warning'}
                          label={credit.estado}
                        />
                      </View>

                      <Button title="Abrir credito" variant="secondary" onPress={() => selectCredit(credit.id)} style={styles.actionButton} />
                    </Card>
                  );
                })
              )
            ) : null}

            {view === 'pagos' ? (
              routeStats.activePayments.length === 0 ? (
                <EmptyState title="Sin pagos" message="No hay pagos activos registrados en esta ruta." />
              ) : (
                routeStats.activePayments.map((payment) => (
                  <Card key={payment.id} style={styles.itemCard}>
                    <Text style={styles.itemTitle}>{clients.find((client) => client.id === payment.clienteId)?.nombre || 'Cliente'}</Text>
                    <Text style={styles.meta}>Valor: {formatMoney(payment.valorPagado)}</Text>
                    <Text style={styles.meta}>Metodo: {payment.metodoPago}</Text>
                    <Text style={styles.meta}>Fecha: {payment.fechaPago}</Text>
                    <Text style={styles.meta}>Hora: {payment.fechaHoraPago || payment.createdAt}</Text>
                    <Text style={styles.meta}>Cobrador: {payment.usuarioEmail}</Text>
                    <Text style={styles.meta}>Nota: {payment.observacion || 'Sin nota'}</Text>
                  </Card>
                ))
              )
            ) : null}

            {view === 'gastos' ? (
              routeStats.activeExpenses.length === 0 ? (
                <EmptyState title="Sin gastos" message="No hay gastos registrados en esta ruta." />
              ) : (
                routeStats.activeExpenses.map((expense) => {
                  const data = expense as typeof expense & {
                    routeName?: string;
                    metodoPago?: string;
                    nota?: string;
                  };

                  return (
                    <Card key={expense.id} style={styles.itemCard}>
                      <Text style={styles.itemTitle}>{expense.descripcion}</Text>
                      <Text style={styles.meta}>Valor: {formatMoney(expense.valor)}</Text>
                      <Text style={styles.meta}>Fecha: {expense.fecha}</Text>
                      <Text style={styles.meta}>Ruta: {data.routeName || selectedRoute.nombre}</Text>
                      <Text style={styles.meta}>Metodo: {data.metodoPago || 'No registrado'}</Text>
                      <Text style={styles.meta}>Cobrador: {expense.createdBy || 'No registrado'}</Text>
                      <Text style={styles.meta}>Nota: {data.nota || 'Sin nota'}</Text>
                    </Card>
                  );
                })
              )
            ) : null}
          </>
        ) : null}
      </Screen>

      <BottomNav />
    </View>
  );
}

function Tab({
  label,
  value,
  current,
  onPress
}: {
  label: string;
  value: RouteView;
  current: RouteView;
  onPress: (value: RouteView) => void;
}) {
  const selected = value === current;

  return (
    <Pressable style={[styles.chip, selected ? styles.chipSelected : null]} onPress={() => onPress(value)}>
      <Text style={[styles.chipText, selected ? styles.chipTextSelected : null]}>{label}</Text>
    </Pressable>
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

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background
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
  label: {
    color: colors.text,
    fontWeight: '900',
    marginBottom: 8
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12
  },
  tabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF'
  },
  chipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft
  },
  chipText: {
    color: colors.muted,
    fontWeight: '900',
    fontSize: 12
  },
  chipTextSelected: {
    color: colors.primary
  },
  routeHeader: {
    backgroundColor: colors.primarySoft,
    marginBottom: 12
  },
  routeTitle: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: '900'
  },
  routeMeta: {
    color: colors.muted,
    fontWeight: '800',
    marginTop: 6
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
    fontSize: 17,
    fontWeight: '900',
    marginTop: 6
  },
  danger: {
    color: colors.danger
  },
  actionsCard: {
    marginTop: 8,
    marginBottom: 12
  },
  sectionTitle: {
    color: colors.text,
    fontWeight: '900',
    fontSize: 17,
    marginBottom: 10
  },
  actionButton: {
    marginTop: 10
  },
  itemCard: {
    marginBottom: 12
  },
  itemHeader: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start'
  },
  itemInfo: {
    flex: 1
  },
  itemTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900'
  },
  meta: {
    color: colors.muted,
    fontWeight: '700',
    marginTop: 5,
    lineHeight: 20
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12
  },
  rowButton: {
    flex: 1
  }
});