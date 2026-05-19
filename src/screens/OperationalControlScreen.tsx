import React, { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
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

type TabName = 'resumen' | 'creditos' | 'pagos' | 'gastos' | 'rutas';

function csvValue(value: unknown) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

function toCsv(headers: string[], rows: unknown[][]) {
  return [headers.map(csvValue).join(','), ...rows.map((row) => row.map(csvValue).join(','))].join('\n');
}

function inRange(date: string, start: string, end: string) {
  if (start && date < start) return false;
  if (end && date > end) return false;
  return true;
}

export function OperationalControlScreen() {
  const {
    clients,
    credits,
    payments,
    expenses,
    routes,
    getClientName,
    selectClient,
    selectCredit,
    navigate
  } = useApp();

  const [startDate, setStartDate] = useState(todayKey());
  const [endDate, setEndDate] = useState(todayKey());
  const [routeId, setRouteId] = useState('');
  const [tab, setTab] = useState<TabName>('resumen');

  const routeClients = useMemo(() => {
    if (!routeId) return clients;
    return clients.filter((client) => client.routeId === routeId);
  }, [clients, routeId]);

  const routeClientIds = useMemo(() => new Set(routeClients.map((client) => client.id)), [routeClients]);

  const filteredCredits = useMemo(() => {
    return credits.filter((credit) => {
      if (routeId && !routeClientIds.has(credit.clienteId)) return false;
      return true;
    });
  }, [credits, routeClientIds, routeId]);

  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      if (payment.estado === 'anulado') return false;
      if (!inRange(payment.fechaPago, startDate, endDate)) return false;
      if (routeId && !routeClientIds.has(payment.clienteId)) return false;
      return true;
    });
  }, [endDate, payments, routeClientIds, routeId, startDate]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const data = expense as typeof expense & {
        routeId?: string;
      };

      if (expense.estado === 'anulado') return false;
      if (!inRange(expense.fecha, startDate, endDate)) return false;
      if (routeId && data.routeId && data.routeId !== routeId) return false;
      return true;
    });
  }, [endDate, expenses, routeId, startDate]);

  const todayEstimated = useMemo(() => {
    return filteredCredits
      .filter((credit) => credit.estado !== 'anulado' && credit.estado !== 'pagado')
      .reduce((total, credit) => {
        const dueToday = buildInstallments(credit, payments, todayKey()).filter(
          (item) => item.fecha <= todayKey() && item.pendiente > 0
        );

        return total + dueToday.reduce((sum, item) => sum + item.pendiente, 0);
      }, 0);
  }, [filteredCredits, payments]);

  const totals = useMemo(() => {
    const efectivo = filteredPayments
      .filter((payment) => payment.metodoPago === 'Efectivo')
      .reduce((total, payment) => total + payment.valorPagado, 0);

    const transferencia = filteredPayments
      .filter((payment) => payment.metodoPago !== 'Efectivo')
      .reduce((total, payment) => total + payment.valorPagado, 0);

    const pagos = filteredPayments.reduce((total, payment) => total + payment.valorPagado, 0);
    const gastos = filteredExpenses.reduce((total, expense) => total + expense.valor, 0);
    const pendiente = filteredCredits.reduce((total, credit) => total + credit.saldoPendiente, 0);
    const totalPrestado = filteredCredits.reduce((total, credit) => total + credit.valorPrestado, 0);
    const totalAPagar = filteredCredits.reduce((total, credit) => total + credit.valorTotal, 0);

    return {
      efectivo,
      transferencia,
      pagos,
      gastos,
      caja: pagos - gastos,
      pendiente,
      totalPrestado,
      totalAPagar
    };
  }, [filteredCredits, filteredExpenses, filteredPayments]);

  const routeSummary = useMemo(() => {
    return routes.map((route) => {
      const clientsInRoute = clients.filter((client) => client.routeId === route.id);
      const ids = new Set(clientsInRoute.map((client) => client.id));
      const routeCredits = credits.filter((credit) => ids.has(credit.clienteId) && credit.estado !== 'anulado');
      const pending = routeCredits.reduce((total, credit) => total + credit.saldoPendiente, 0);
      const paid = routeCredits.filter((credit) => credit.estado === 'pagado').length;
      const active = routeCredits.filter((credit) => credit.estado !== 'pagado').length;
      const mora = clientsInRoute.filter((client) => client.estado === 'en-mora').length;

      return {
        route,
        clients: clientsInRoute,
        pending,
        paid,
        active,
        mora
      };
    });
  }, [clients, credits, routes]);

  const exportCsv = async () => {
    const content = toCsv(
      [
        'Tipo',
        'Ruta',
        'Cliente',
        'Credito ID',
        'Fecha',
        'Metodo',
        'Pago',
        'Gasto',
        'Saldo pendiente',
        'Cobrador',
        'Estado'
      ],
      [
        ...filteredPayments.map((payment) => [
          'Pago',
          clients.find((client) => client.id === payment.clienteId)?.routeName || '',
          getClientName(payment.clienteId),
          payment.creditoId,
          payment.fechaPago,
          payment.metodoPago,
          payment.valorPagado,
          '',
          '',
          payment.usuarioEmail,
          payment.estado
        ]),
        ...filteredExpenses.map((expense) => {
          const data = expense as typeof expense & {
            routeName?: string;
            metodoPago?: string;
          };

          return [
            'Gasto',
            data.routeName || '',
            '',
            '',
            expense.fecha,
            data.metodoPago || '',
            '',
            expense.valor,
            '',
            expense.createdBy || '',
            expense.estado
          ];
        }),
        ...filteredCredits.map((credit) => [
          'Credito',
          clients.find((client) => client.id === credit.clienteId)?.routeName || '',
          getClientName(credit.clienteId),
          credit.id,
          credit.fechaInicio,
          credit.frecuencia,
          '',
          '',
          credit.saldoPendiente,
          credit.assignedToEmail || '',
          credit.estado
        ])
      ]
    );

    const available = await Sharing.isAvailableAsync();

    if (!available) {
      Alert.alert('Compartir no disponible', 'No se puede compartir en este dispositivo.');
      return;
    }

    const fileUri = `${FileSystem.cacheDirectory}control-operativo-${todayKey()}.csv`;

    await FileSystem.writeAsStringAsync(fileUri, content, {
      encoding: FileSystem.EncodingType.UTF8
    });

    await Sharing.shareAsync(fileUri, {
      mimeType: 'text/csv',
      dialogTitle: 'Exportar control operativo'
    });
  };

  return (
    <View style={styles.root}>
      <TopBar title="Control operativo" showBack onBack={() => navigate('more')} />

      <Screen>
        <Card style={styles.heroCard}>
          <Text style={styles.heroTitle}>Control de rutas, caja y reportes</Text>
          <Text style={styles.heroText}>Filtra por fechas y ruta para revisar pagos, gastos, creditos y caja estimada.</Text>
        </Card>

        <Input label="Fecha inicial" icon="I" value={startDate} onChangeText={setStartDate} placeholder="YYYY-MM-DD" />
        <Input label="Fecha final" icon="F" value={endDate} onChangeText={setEndDate} placeholder="YYYY-MM-DD" />

        <Text style={styles.label}>Ruta</Text>

        <View style={styles.chips}>
          <Pressable style={[styles.chip, routeId === '' ? styles.chipSelected : null]} onPress={() => setRouteId('')}>
            <Text style={[styles.chipText, routeId === '' ? styles.chipTextSelected : null]}>Todas</Text>
          </Pressable>

          {routes.map((route) => (
            <Pressable key={route.id} style={[styles.chip, routeId === route.id ? styles.chipSelected : null]} onPress={() => setRouteId(route.id)}>
              <Text style={[styles.chipText, routeId === route.id ? styles.chipTextSelected : null]}>{route.nombre}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.tabs}>
          <Tab label="Resumen" value="resumen" current={tab} onPress={setTab} />
          <Tab label="Creditos" value="creditos" current={tab} onPress={setTab} />
          <Tab label="Pagos" value="pagos" current={tab} onPress={setTab} />
          <Tab label="Gastos" value="gastos" current={tab} onPress={setTab} />
          <Tab label="Rutas" value="rutas" current={tab} onPress={setTab} />
        </View>

        {tab === 'resumen' ? (
          <>
            <View style={styles.grid}>
              <Metric title="Estimado ruta hoy" value={formatMoney(todayEstimated)} danger={todayEstimated > 0} />
              <Metric title="Caja final" value={formatMoney(totals.caja)} danger={totals.caja < 0} />
            </View>

            <View style={styles.grid}>
              <Metric title="Efectivo" value={formatMoney(totals.efectivo)} />
              <Metric title="Transferencias" value={formatMoney(totals.transferencia)} />
            </View>

            <View style={styles.grid}>
              <Metric title="Pagos" value={formatMoney(totals.pagos)} />
              <Metric title="Gastos" value={formatMoney(totals.gastos)} danger />
            </View>

            <View style={styles.grid}>
              <Metric title="Total prestado" value={formatMoney(totals.totalPrestado)} />
              <Metric title="Pendiente" value={formatMoney(totals.pendiente)} danger />
            </View>

            <Button title="Exportar CSV para Excel" onPress={exportCsv} />
          </>
        ) : null}

        {tab === 'creditos' ? (
          filteredCredits.length === 0 ? (
            <EmptyState title="Sin creditos" message="No hay creditos con estos filtros." />
          ) : (
            filteredCredits.map((credit) => {
              const data = credit as typeof credit & {
                fechaFinal?: string;
                porcentaje?: number;
                codeudorTiene?: boolean;
                codeudorNombreCompleto?: string;
                codeudorSobrenombre?: string;
                codeudorCpf?: string;
                codeudorTelefono?: string;
                codeudorDireccion?: string;
              };

              const installments = buildInstallments(credit, payments, todayKey());
              const paidInstallments = installments.filter((item) => item.estado === 'pagada').length;
              const overdueInstallments = installments.filter((item) => item.estado === 'vencida').length;
              const pendingInstallments = installments.filter((item) => item.pendiente > 0).length;
              const totalPaid = payments
                .filter((payment) => payment.creditoId === credit.id && payment.estado !== 'anulado')
                .reduce((total, payment) => total + payment.valorPagado, 0);

              return (
                <Card key={credit.id} style={styles.itemCard}>
                  <Text style={styles.itemTitle}>{getClientName(credit.clienteId)}</Text>
                  <Text style={styles.meta}>ID credito: {credit.id}</Text>
                  <Text style={styles.meta}>Inicio: {credit.fechaInicio} | Final: {data.fechaFinal || 'No definida'}</Text>
                  <Text style={styles.meta}>Valor credito: {formatMoney(credit.valorPrestado)}</Text>
                  <Text style={styles.meta}>Total a pagar: {formatMoney(credit.valorTotal)}</Text>
                  <Text style={styles.meta}>Total pagado: {formatMoney(totalPaid)}</Text>
                  <Text style={styles.meta}>Falta pagar: {formatMoney(credit.saldoPendiente)}</Text>
                  <Text style={styles.meta}>Frecuencia: {credit.frecuencia} | Porcentaje: {data.porcentaje || 0}%</Text>
                  <Text style={styles.meta}>Cuotas totales: {credit.numeroCuotas}</Text>
                  <Text style={styles.meta}>Cuotas pagadas: {paidInstallments}</Text>
                  <Text style={styles.meta}>Cuotas atrasadas: {overdueInstallments}</Text>
                  <Text style={styles.meta}>Cuotas pendientes: {pendingInstallments}</Text>
                  <Text style={styles.meta}>Valor cuota: {formatMoney(credit.valorCuota)}</Text>

                  {data.codeudorTiene ? (
                    <View style={styles.box}>
                      <Text style={styles.boxTitle}>Codeudor</Text>
                      <Text style={styles.meta}>Nombre: {data.codeudorNombreCompleto || 'No registrado'}</Text>
                      <Text style={styles.meta}>Sobrenombre: {data.codeudorSobrenombre || 'No registrado'}</Text>
                      <Text style={styles.meta}>CPF: {data.codeudorCpf || 'No registrado'}</Text>
                      <Text style={styles.meta}>Telefono: {data.codeudorTelefono || 'No registrado'}</Text>
                      <Text style={styles.meta}>Direccion: {data.codeudorDireccion || 'No registrada'}</Text>
                    </View>
                  ) : null}

                  <Button title="Abrir credito" variant="secondary" onPress={() => selectCredit(credit.id)} style={styles.smallButton} />
                </Card>
              );
            })
          )
        ) : null}

        {tab === 'pagos' ? (
          filteredPayments.length === 0 ? (
            <EmptyState title="Sin pagos" message="No hay pagos con estos filtros." />
          ) : (
            filteredPayments.map((payment) => {
              const data = payment as typeof payment & {
                fechaHoraPago?: string;
              };

              return (
                <Card key={payment.id} style={styles.itemCard}>
                  <Text style={styles.itemTitle}>{getClientName(payment.clienteId)}</Text>
                  <Text style={styles.meta}>Credito: {payment.creditoId}</Text>
                  <Text style={styles.meta}>Valor recibido: {formatMoney(payment.valorPagado)}</Text>
                  <Text style={styles.meta}>Metodo: {payment.metodoPago}</Text>
                  <Text style={styles.meta}>Fecha: {payment.fechaPago}</Text>
                  <Text style={styles.meta}>Fecha y hora registro: {data.fechaHoraPago || payment.createdAt}</Text>
                  <Text style={styles.meta}>Cobrador: {payment.usuarioEmail}</Text>
                  <Text style={styles.meta}>Nota: {payment.observacion || 'Sin nota'}</Text>
                  <StatusBadge type={payment.estado === 'anulado' ? 'danger' : 'success'} label={payment.estado} />
                </Card>
              );
            })
          )
        ) : null}

        {tab === 'gastos' ? (
          filteredExpenses.length === 0 ? (
            <EmptyState title="Sin gastos" message="No hay gastos con estos filtros." />
          ) : (
            filteredExpenses.map((expense) => {
              const data = expense as typeof expense & {
                routeName?: string;
                nota?: string;
              };

              return (
                <Card key={expense.id} style={styles.itemCard}>
                  <Text style={styles.itemTitle}>{expense.descripcion}</Text>
                  <Text style={styles.meta}>Valor: {formatMoney(expense.valor)}</Text>
                  <Text style={styles.meta}>Fecha: {expense.fecha}</Text>
                  <Text style={styles.meta}>Ruta: {data.routeName || 'Sin ruta'}</Text>
                  <Text style={styles.meta}>Cobrador: {expense.createdBy || 'No registrado'}</Text>
                  <Text style={styles.meta}>Nota: {data.nota || 'Sin nota'}</Text>
                </Card>
              );
            })
          )
        ) : null}

        {tab === 'rutas' ? (
          routeSummary.length === 0 ? (
            <EmptyState title="Sin rutas" message="No hay rutas registradas." />
          ) : (
            routeSummary.map((item) => (
              <Card key={item.route.id} style={styles.itemCard}>
                <Text style={styles.itemTitle}>{item.route.nombre}</Text>
                <Text style={styles.meta}>Clientes: {item.clients.length}</Text>
                <Text style={styles.meta}>Clientes en mora: {item.mora}</Text>
                <Text style={styles.meta}>Creditos activos: {item.active}</Text>
                <Text style={styles.meta}>Creditos cumplidos: {item.paid}</Text>
                <Text style={styles.meta}>Total pendiente: {formatMoney(item.pending)}</Text>

                {item.clients.map((client) => (
                  <Pressable key={client.id} onPress={() => selectClient(client.id)} style={styles.clientRow}>
                    <Text style={styles.clientName}>{client.nombre}</Text>
                    <StatusBadge type={client.estado === 'al-dia' ? 'success' : 'danger'} label={client.estado === 'al-dia' ? 'Al dia' : 'En mora'} />
                  </Pressable>
                ))}
              </Card>
            ))
          )
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
  value: TabName;
  current: TabName;
  onPress: (value: TabName) => void;
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
    fontSize: 17,
    marginTop: 6
  },
  danger: {
    color: colors.danger
  },
  itemCard: {
    marginBottom: 12
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
  box: {
    backgroundColor: colors.background,
    borderRadius: 14,
    padding: 12,
    marginTop: 10
  },
  boxTitle: {
    color: colors.text,
    fontWeight: '900',
    marginBottom: 4
  },
  smallButton: {
    marginTop: 12
  },
  clientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  clientName: {
    color: colors.text,
    fontWeight: '900',
    flex: 1
  }
});