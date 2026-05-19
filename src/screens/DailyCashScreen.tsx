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
import { todayKey } from '../utils/date';
import { buildInstallments } from '../utils/installments';
import { formatMoney } from '../utils/money';
import { isPositiveMoney, isValidDateKey, parseMoney } from '../utils/validation';

type CashView = 'resumen' | 'pagos' | 'gastos' | 'cierres';

function normalize(value: unknown) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export function DailyCashScreen() {
  const {
    payments,
    expenses,
    cashClosings,
    clients,
    credits,
    routes,
    addExpense,
    createCashClosing,
    selectExpense,
    session,
    isAdmin
  } = useApp();

  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseValue, setExpenseValue] = useState('');
  const [closingDate, setClosingDate] = useState(todayKey());
  const [cashDelivered, setCashDelivered] = useState('');
  const [closingObservation, setClosingObservation] = useState('');
  const [selectedRouteId, setSelectedRouteId] = useState('');
  const [view, setView] = useState<CashView>('resumen');
  const [loadingExpense, setLoadingExpense] = useState(false);
  const [loadingClosing, setLoadingClosing] = useState(false);

  const selectedRoute = useMemo(() => {
    return routes.find((route) => route.id === selectedRouteId);
  }, [routes, selectedRouteId]);

  const routeClients = useMemo(() => {
    if (!selectedRouteId) return clients;
    return clients.filter((client) => client.routeId === selectedRouteId);
  }, [clients, selectedRouteId]);

  const routeClientIds = useMemo(() => {
    return new Set(routeClients.map((client) => client.id));
  }, [routeClients]);

  const routeCredits = useMemo(() => {
    return credits.filter((credit) => {
      if (selectedRouteId && !routeClientIds.has(credit.clienteId)) return false;
      if (!isAdmin && credit.assignedToUid && credit.assignedToUid !== session.uid) return false;
      return credit.estado !== 'anulado';
    });
  }, [credits, isAdmin, routeClientIds, selectedRouteId, session.uid]);

  const estimatedToCollect = useMemo(() => {
    return routeCredits
      .filter((credit) => credit.estado !== 'pagado')
      .reduce((total, credit) => {
        const due = buildInstallments(credit, payments, closingDate).filter(
          (item) => item.fecha <= closingDate && item.pendiente > 0
        );

        return total + due.reduce((sum, item) => sum + item.pendiente, 0);
      }, 0);
  }, [closingDate, payments, routeCredits]);

  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      const active = payment.estado !== 'anulado';
      const sameDate = payment.fechaPago === closingDate;

      if (!active || !sameDate) return false;
      if (selectedRouteId && !routeClientIds.has(payment.clienteId)) return false;
      if (isAdmin) return true;

      return payment.usuarioEmail === session.email || payment.assignedToUid === session.uid;
    });
  }, [closingDate, isAdmin, payments, routeClientIds, selectedRouteId, session.email, session.uid]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const data = expense as typeof expense & {
        routeId?: string;
        routeName?: string;
        usuarioUid?: string;
        createdByUid?: string;
      };

      const sameDate = expense.fecha === closingDate;

      if (!sameDate) return false;

      if (selectedRouteId) {
        const routeById = data.routeId === selectedRouteId;
        const routeByName = selectedRoute ? normalize(data.routeName).includes(normalize(selectedRoute.nombre)) : false;
        const routeByDescription = selectedRoute ? normalize(expense.descripcion).includes(normalize(selectedRoute.nombre)) : false;

        if (!routeById && !routeByName && !routeByDescription) return false;
      }

      if (isAdmin) return true;

      return expense.createdBy === session.email || data.usuarioUid === session.uid || data.createdByUid === session.uid;
    });
  }, [closingDate, expenses, isAdmin, selectedRoute, selectedRouteId, session.email, session.uid]);

  const activeExpenses = useMemo(() => {
    return filteredExpenses.filter((expense) => expense.estado !== 'anulado');
  }, [filteredExpenses]);

  const closingsForDate = useMemo(() => {
    return cashClosings.filter((closing) => {
      const data = closing as typeof closing & {
        routeId?: string;
        routeName?: string;
      };

      const sameDate = closing.fecha === closingDate;

      if (!sameDate) return false;

      if (selectedRouteId) {
        const routeById = data.routeId === selectedRouteId;
        const routeByName = selectedRoute ? normalize(data.routeName).includes(normalize(selectedRoute.nombre)) : false;

        if (!routeById && !routeByName) return false;
      }

      if (isAdmin) return true;

      return closing.usuarioUid === session.uid;
    });
  }, [cashClosings, closingDate, isAdmin, selectedRoute, selectedRouteId, session.uid]);

  const currentUserClosingsForDate = useMemo(() => {
    return cashClosings.filter((closing) => closing.fecha === closingDate && closing.usuarioUid === session.uid);
  }, [cashClosings, closingDate, session.uid]);

  const totalPayments = filteredPayments.reduce((total, payment) => total + payment.valorPagado, 0);
  const totalCash = filteredPayments
    .filter((payment) => payment.metodoPago === 'Efectivo')
    .reduce((total, payment) => total + payment.valorPagado, 0);

  const totalTransfer = filteredPayments
    .filter((payment) => payment.metodoPago !== 'Efectivo')
    .reduce((total, payment) => total + payment.valorPagado, 0);

  const totalExpenses = activeExpenses.reduce((total, expense) => total + expense.valor, 0);
  const expectedCash = totalPayments - totalExpenses;
  const expectedRouteCash = estimatedToCollect - totalExpenses;
  const deliveredNumber = parseMoney(cashDelivered);
  const difference = Number.isFinite(deliveredNumber) ? deliveredNumber - expectedCash : 0;
  const pendingToCollect = Math.max(0, estimatedToCollect - totalPayments);

  const clientsWithPayments = useMemo(() => {
    return new Set(filteredPayments.map((payment) => payment.clienteId));
  }, [filteredPayments]);

  const clientsPendingToday = useMemo(() => {
    return routeCredits
      .filter((credit) => credit.estado !== 'pagado')
      .filter((credit) => {
        if (clientsWithPayments.has(credit.clienteId)) return false;

        const due = buildInstallments(credit, payments, closingDate).filter(
          (item) => item.fecha <= closingDate && item.pendiente > 0
        );

        return due.length > 0;
      });
  }, [clientsWithPayments, closingDate, payments, routeCredits]);

  const handleAddExpense = async () => {
    if (!isValidDateKey(closingDate)) {
      Alert.alert('Fecha invalida', 'La fecha debe tener formato YYYY-MM-DD.');
      return;
    }

    if (!expenseDescription.trim()) {
      Alert.alert('Descripcion requerida', 'Escribe el motivo del gasto.');
      return;
    }

    const value = parseMoney(expenseValue);

    if (!isPositiveMoney(value)) {
      Alert.alert('Valor invalido', 'Ingresa un valor valido para el gasto.');
      return;
    }

    const description = selectedRoute
      ? `[Ruta: ${selectedRoute.nombre}] ${expenseDescription.trim()}`
      : expenseDescription.trim();

    setLoadingExpense(true);

    await addExpense({
      descripcion: description,
      valor: value,
      fecha: closingDate
    });

    setExpenseDescription('');
    setExpenseValue('');
    setLoadingExpense(false);
  };

  const handleCloseCash = async () => {
    if (!isValidDateKey(closingDate)) {
      Alert.alert('Fecha invalida', 'La fecha debe tener formato YYYY-MM-DD.');
      return;
    }

    if (!cashDelivered.trim()) {
      Alert.alert('Caja entregada requerida', 'Ingresa el valor entregado.');
      return;
    }

    if (!Number.isFinite(deliveredNumber) || deliveredNumber < 0) {
      Alert.alert('Valor invalido', 'Ingresa un valor valido para la caja entregada.');
      return;
    }

    if (currentUserClosingsForDate.length > 0) {
      Alert.alert(
        'Caja ya cerrada',
        'Ya existe un cierre de caja para tu usuario en esta fecha. Puedes guardar otro cierre solo si es una correccion.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Guardar correccion', onPress: confirmCloseCash }
        ]
      );
      return;
    }

    confirmCloseCash();
  };

  const confirmCloseCash = () => {
    Alert.alert(
      'Cerrar caja',
      `Estimado ruta: ${formatMoney(estimatedToCollect)}\nCobrado: ${formatMoney(totalPayments)}\nGastos: ${formatMoney(totalExpenses)}\nCaja esperada: ${formatMoney(expectedCash)}\nCaja entregada: ${formatMoney(deliveredNumber)}\nDiferencia: ${formatMoney(difference)}\n\nDeseas guardar el cierre?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar caja',
          onPress: async () => {
            setLoadingClosing(true);

            await createCashClosing({
              fecha: closingDate,
              cajaEntregada: deliveredNumber,
              observacion: closingObservation.trim()
            });

            setCashDelivered('');
            setClosingObservation('');
            setLoadingClosing(false);
          }
        }
      ]
    );
  };

  return (
    <View style={styles.root}>
      <TopBar title="Caja diaria" rightText={isAdmin ? 'Admin' : 'Mi caja'} />

      <Screen>
        <Card style={styles.heroCard}>
          <Text style={styles.heroTitle}>Caja diaria por ruta</Text>
          <Text style={styles.heroText}>
            Revisa estimado a cobrar, efectivo, transferencias, gastos, caja esperada y diferencia.
          </Text>
        </Card>

        <Card style={styles.dateCard}>
          <Input label="Fecha de caja" icon="F" value={closingDate} onChangeText={setClosingDate} placeholder="YYYY-MM-DD" />
        </Card>

        <Text style={styles.label}>Ruta</Text>

        <View style={styles.chips}>
          <Pressable style={[styles.chip, selectedRouteId === '' ? styles.chipSelected : null]} onPress={() => setSelectedRouteId('')}>
            <Text style={[styles.chipText, selectedRouteId === '' ? styles.chipTextSelected : null]}>Todas</Text>
          </Pressable>

          {routes.map((route) => (
            <Pressable key={route.id} style={[styles.chip, selectedRouteId === route.id ? styles.chipSelected : null]} onPress={() => setSelectedRouteId(route.id)}>
              <Text style={[styles.chipText, selectedRouteId === route.id ? styles.chipTextSelected : null]}>{route.nombre}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.tabs}>
          <Tab label="Resumen" value="resumen" current={view} onPress={setView} />
          <Tab label="Pagos" value="pagos" current={view} onPress={setView} />
          <Tab label="Gastos" value="gastos" current={view} onPress={setView} />
          <Tab label="Cierres" value="cierres" current={view} onPress={setView} />
        </View>

        {view === 'resumen' ? (
          <>
            <View style={styles.grid}>
              <Metric title="Estimado a cobrar" value={formatMoney(estimatedToCollect)} danger={estimatedToCollect > 0} />
              <Metric title="Falta cobrar" value={formatMoney(pendingToCollect)} danger={pendingToCollect > 0} />
            </View>

            <View style={styles.grid}>
              <Metric title="Cobrado total" value={formatMoney(totalPayments)} />
              <Metric title="Gastos" value={formatMoney(totalExpenses)} danger={totalExpenses > 0} />
            </View>

            <View style={styles.grid}>
              <Metric title="Efectivo" value={formatMoney(totalCash)} />
              <Metric title="Transferencia" value={formatMoney(totalTransfer)} />
            </View>

            <View style={styles.grid}>
              <Metric title="Caja esperada" value={formatMoney(expectedCash)} />
              <Metric title="Caja ruta estimada" value={formatMoney(expectedRouteCash)} danger={expectedRouteCash < 0} />
            </View>

            <View style={styles.grid}>
              <Metric title="Clientes cobrados" value={String(clientsWithPayments.size)} />
              <Metric title="Pendientes hoy" value={String(clientsPendingToday.length)} danger={clientsPendingToday.length > 0} />
            </View>

            {currentUserClosingsForDate.length > 0 ? (
              <Card style={styles.warningCard}>
                <Text style={styles.warningTitle}>Caja ya cerrada</Text>
                <Text style={styles.warningText}>Tu usuario ya tiene cierre registrado para esta fecha.</Text>
              </Card>
            ) : null}

            <Card style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Registrar gasto</Text>

              <Input label="Descripcion" icon="D" value={expenseDescription} onChangeText={setExpenseDescription} placeholder="Ej: Gasolina, transporte, comida" />
              <Input label="Valor" icon="$" value={expenseValue} onChangeText={setExpenseValue} keyboardType="numeric" placeholder="Ej: 10000" />

              <Button title="Agregar gasto" onPress={handleAddExpense} loading={loadingExpense} />
            </Card>

            <Card style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Cerrar caja</Text>

              <Input label="Caja entregada" icon="$" value={cashDelivered} onChangeText={setCashDelivered} keyboardType="numeric" placeholder="Ej: 250000" />
              <Input label="Observacion" icon="N" value={closingObservation} onChangeText={setClosingObservation} placeholder="Opcional" />

              <View style={styles.previewBox}>
                <Text style={styles.previewText}>Estimado ruta: {formatMoney(estimatedToCollect)}</Text>
                <Text style={styles.previewText}>Cobrado efectivo: {formatMoney(totalCash)}</Text>
                <Text style={styles.previewText}>Cobrado transferencia: {formatMoney(totalTransfer)}</Text>
                <Text style={styles.previewText}>Gastos: {formatMoney(totalExpenses)}</Text>
                <Text style={styles.previewText}>Caja esperada: {formatMoney(expectedCash)}</Text>
                <Text style={styles.previewText}>Caja entregada: {cashDelivered ? formatMoney(deliveredNumber) : formatMoney(0)}</Text>
                <Text style={[styles.previewText, difference < 0 ? styles.danger : styles.success]}>
                  Diferencia: {cashDelivered ? formatMoney(difference) : formatMoney(0)}
                </Text>
              </View>

              <Button title="Cerrar caja" onPress={handleCloseCash} loading={loadingClosing} />
            </Card>

            <Text style={styles.blockTitle}>Clientes pendientes de cobrar hoy</Text>

            {clientsPendingToday.length === 0 ? (
              <EmptyState title="Sin pendientes" message="No hay clientes pendientes de cobrar con estos filtros." />
            ) : (
              clientsPendingToday.map((credit) => {
                const client = clients.find((item) => item.id === credit.clienteId);

                return (
                  <Card key={credit.id} style={styles.itemCard}>
                    <Text style={styles.itemTitle}>{client?.nombre || 'Cliente no encontrado'}</Text>
                    <Text style={styles.itemText}>Credito: {credit.id}</Text>
                    <Text style={styles.itemText}>Saldo pendiente: {formatMoney(credit.saldoPendiente)}</Text>
                    <Text style={styles.itemText}>Valor cuota: {formatMoney(credit.valorCuota)}</Text>
                  </Card>
                );
              })
            )}
          </>
        ) : null}

        {view === 'pagos' ? (
          <>
            <Text style={styles.blockTitle}>Historial de pagos del dia</Text>

            {filteredPayments.length === 0 ? (
              <EmptyState title="Sin pagos" message="No hay pagos activos para esta fecha." />
            ) : (
              filteredPayments.map((payment) => {
                const client = clients.find((item) => item.id === payment.clienteId);
                const data = payment as typeof payment & {
                  fechaHoraPago?: string;
                };

                return (
                  <Card key={payment.id} style={styles.itemCard}>
                    <View style={styles.row}>
                      <Text style={styles.itemTitle}>{formatMoney(payment.valorPagado)}</Text>
                      <StatusBadge type="success" label={payment.metodoPago} />
                    </View>

                    <Text style={styles.itemText}>Cliente: {client?.nombre || 'No registrado'}</Text>
                    <Text style={styles.itemText}>Fecha: {payment.fechaPago}</Text>
                    <Text style={styles.itemText}>Hora: {data.fechaHoraPago || payment.createdAt}</Text>
                    <Text style={styles.itemText}>Cobrador: {payment.usuarioEmail}</Text>
                    <Text style={styles.itemText}>Observacion: {payment.observacion || 'Sin observacion'}</Text>
                  </Card>
                );
              })
            )}
          </>
        ) : null}

        {view === 'gastos' ? (
          <>
            <Text style={styles.blockTitle}>Historial de gastos del dia</Text>

            {filteredExpenses.length === 0 ? (
              <EmptyState title="Sin gastos" message="No hay gastos registrados para esta fecha." />
            ) : (
              filteredExpenses.map((expense) => {
                const isCanceled = expense.estado === 'anulado';
                const data = expense as typeof expense & {
                  routeName?: string;
                  metodoPago?: string;
                  nota?: string;
                };

                return (
                  <Card key={expense.id} style={[styles.itemCard, isCanceled ? styles.canceledCard : null]}>
                    <View style={styles.row}>
                      <Text style={[styles.itemTitle, isCanceled ? styles.danger : null]}>{formatMoney(expense.valor)}</Text>
                      <StatusBadge type={isCanceled ? 'danger' : 'warning'} label={isCanceled ? 'Anulado' : 'Gasto'} />
                    </View>

                    <Text style={styles.itemText}>Descripcion: {expense.descripcion}</Text>
                    <Text style={styles.itemText}>Ruta: {data.routeName || selectedRoute?.nombre || 'No registrada'}</Text>
                    <Text style={styles.itemText}>Metodo: {data.metodoPago || 'No registrado'}</Text>
                    <Text style={styles.itemText}>Cobrador: {expense.createdBy || 'No registrado'}</Text>
                    <Text style={styles.itemText}>Nota: {data.nota || 'Sin nota'}</Text>

                    {!isCanceled ? (
                      <Button title="Editar gasto" variant="secondary" onPress={() => selectExpense(expense.id)} style={styles.editButton} />
                    ) : null}
                  </Card>
                );
              })
            )}
          </>
        ) : null}

        {view === 'cierres' ? (
          <>
            <Text style={styles.blockTitle}>Historial de cierres</Text>

            {closingsForDate.length === 0 ? (
              <EmptyState title="Sin cierres" message="No hay cierres de caja para esta fecha." />
            ) : (
              closingsForDate.map((closing) => {
                const data = closing as typeof closing & {
                  routeName?: string;
                };

                return (
                  <Card key={closing.id} style={styles.itemCard}>
                    <Text style={styles.itemTitle}>Cierre de caja</Text>
                    <Text style={styles.itemText}>Fecha: {closing.fecha}</Text>
                    <Text style={styles.itemText}>Ruta: {data.routeName || selectedRoute?.nombre || 'No registrada'}</Text>
                    <Text style={styles.itemText}>Cobrador: {closing.usuarioEmail}</Text>
                    <Text style={styles.itemText}>Total pagos: {formatMoney(closing.totalPagos)}</Text>
                    <Text style={styles.itemText}>Total gastos: {formatMoney(closing.totalGastos)}</Text>
                    <Text style={styles.itemText}>Caja esperada: {formatMoney(closing.cajaEsperada)}</Text>
                    <Text style={styles.itemText}>Caja entregada: {formatMoney(closing.cajaEntregada)}</Text>
                    <Text style={[styles.itemText, closing.diferencia < 0 ? styles.danger : styles.success]}>
                      Diferencia: {formatMoney(closing.diferencia)}
                    </Text>
                    <Text style={styles.itemText}>Observacion: {closing.observacion || 'Sin observacion'}</Text>
                  </Card>
                );
              })
            )}
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
  value: CashView;
  current: CashView;
  onPress: (value: CashView) => void;
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
      <Text style={styles.metricLabel}>{title}</Text>
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
  dateCard: {
    marginBottom: 12
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
  grid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10
  },
  metricCard: {
    flex: 1
  },
  metricLabel: {
    color: colors.muted,
    fontWeight: '800',
    fontSize: 12
  },
  metricValue: {
    color: colors.primary,
    fontWeight: '900',
    fontSize: 17,
    marginTop: 6
  },
  danger: {
    color: colors.danger
  },
  success: {
    color: colors.success
  },
  warningCard: {
    backgroundColor: '#FFF8E1',
    marginBottom: 12
  },
  warningTitle: {
    color: colors.text,
    fontWeight: '900',
    fontSize: 16
  },
  warningText: {
    color: colors.muted,
    marginTop: 6,
    lineHeight: 20,
    fontWeight: '700'
  },
  sectionCard: {
    marginBottom: 12
  },
  sectionTitle: {
    color: colors.text,
    fontWeight: '900',
    fontSize: 17,
    marginBottom: 10
  },
  previewBox: {
    backgroundColor: colors.background,
    borderRadius: 14,
    padding: 12,
    marginBottom: 14
  },
  previewText: {
    color: colors.muted,
    fontWeight: '700',
    marginTop: 4
  },
  blockTitle: {
    color: colors.text,
    fontWeight: '900',
    fontSize: 18,
    marginTop: 12,
    marginBottom: 10
  },
  itemCard: {
    marginBottom: 10
  },
  canceledCard: {
    backgroundColor: '#FFF5F5'
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10
  },
  itemTitle: {
    color: colors.text,
    fontWeight: '900',
    fontSize: 16
  },
  itemText: {
    color: colors.muted,
    fontWeight: '700',
    marginTop: 5,
    lineHeight: 20
  },
  editButton: {
    marginTop: 12
  }
});