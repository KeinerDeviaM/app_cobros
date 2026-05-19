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

type PeriodFilter = 'dia' | 'semana' | 'quincena' | 'mes' | 'personalizado';
type ReportTab = 'resumen' | 'pagos' | 'gastos' | 'creditos' | 'clientes' | 'caja';

function csvValue(value: unknown) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

function toCsv(headers: string[], rows: unknown[][]) {
  return [headers.map(csvValue).join(','), ...rows.map((row) => row.map(csvValue).join(','))].join('\n');
}

function parseDateKey(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(value: string, days: number) {
  const date = parseDateKey(value);
  date.setDate(date.getDate() + days);
  return formatDateKey(date);
}

function startOfMonth(value: string) {
  const date = parseDateKey(value);
  return formatDateKey(new Date(date.getFullYear(), date.getMonth(), 1));
}

function endOfMonth(value: string) {
  const date = parseDateKey(value);
  return formatDateKey(new Date(date.getFullYear(), date.getMonth() + 1, 0));
}

function inRange(date: string, start: string, end: string) {
  if (start && date < start) return false;
  if (end && date > end) return false;
  return true;
}

function normalize(value: unknown) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export function ExportReportsScreen() {
  const {
    clients,
    credits,
    payments,
    expenses,
    routes,
    users,
    cashClosings,
    businessSettings,
    getClientName,
    navigate
  } = useApp();

  const [period, setPeriod] = useState<PeriodFilter>('dia');
  const [tab, setTab] = useState<ReportTab>('resumen');
  const [startDate, setStartDate] = useState(todayKey());
  const [endDate, setEndDate] = useState(todayKey());
  const [routeId, setRouteId] = useState('');
  const [collectorUid, setCollectorUid] = useState('');
  const [method, setMethod] = useState('');
  const [creditStatus, setCreditStatus] = useState('');
  const [query, setQuery] = useState('');

  const selectedRoute = routes.find((route) => route.id === routeId);
  const selectedCollector = users.find((user) => user.uid === collectorUid || user.id === collectorUid);

  const applyPeriod = (nextPeriod: PeriodFilter) => {
    const today = todayKey();

    setPeriod(nextPeriod);

    if (nextPeriod === 'dia') {
      setStartDate(today);
      setEndDate(today);
    }

    if (nextPeriod === 'semana') {
      setStartDate(addDays(today, -6));
      setEndDate(today);
    }

    if (nextPeriod === 'quincena') {
      setStartDate(addDays(today, -14));
      setEndDate(today);
    }

    if (nextPeriod === 'mes') {
      setStartDate(startOfMonth(today));
      setEndDate(endOfMonth(today));
    }
  };

  const routeClients = useMemo(() => {
    if (!routeId) return clients;
    return clients.filter((client) => client.routeId === routeId);
  }, [clients, routeId]);

  const routeClientIds = useMemo(() => {
    return new Set(routeClients.map((client) => client.id));
  }, [routeClients]);

  const filteredClients = useMemo(() => {
    const value = normalize(query);

    return routeClients.filter((client) => {
      if (collectorUid && client.assignedToUid !== collectorUid) return false;

      if (value) {
        const text = [
          client.nombre,
          client.telefono,
          client.direccion,
          client.routeName,
          client.assignedToEmail,
          client.estado
        ].join(' ');

        if (!normalize(text).includes(value)) return false;
      }

      return true;
    });
  }, [collectorUid, query, routeClients]);

  const filteredClientIds = useMemo(() => {
    return new Set(filteredClients.map((client) => client.id));
  }, [filteredClients]);

  const filteredCredits = useMemo(() => {
    return credits.filter((credit) => {
      if (!filteredClientIds.has(credit.clienteId)) return false;
      if (creditStatus && credit.estado !== creditStatus) return false;
      if (collectorUid && credit.assignedToUid !== collectorUid) return false;

      if (query.trim()) {
        const text = [
          getClientName(credit.clienteId),
          credit.id,
          credit.estado,
          credit.frecuencia,
          credit.assignedToEmail,
          credit.createdBy
        ].join(' ');

        if (!normalize(text).includes(normalize(query))) return false;
      }

      return true;
    });
  }, [collectorUid, creditStatus, credits, filteredClientIds, getClientName, query]);

  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      if (payment.estado === 'anulado') return false;
      if (!inRange(payment.fechaPago, startDate, endDate)) return false;
      if (!filteredClientIds.has(payment.clienteId)) return false;
      if (collectorUid && payment.assignedToUid !== collectorUid) return false;
      if (method && payment.metodoPago !== method) return false;

      if (query.trim()) {
        const text = [
          getClientName(payment.clienteId),
          payment.usuarioEmail,
          payment.metodoPago,
          payment.observacion,
          payment.estado,
          payment.creditoId
        ].join(' ');

        if (!normalize(text).includes(normalize(query))) return false;
      }

      return true;
    });
  }, [collectorUid, endDate, filteredClientIds, getClientName, method, payments, query, startDate]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const data = expense as typeof expense & {
        routeId?: string;
        routeName?: string;
        metodoPago?: string;
        nota?: string;
        usuarioUid?: string;
        createdByUid?: string;
      };

      if (expense.estado === 'anulado') return false;
      if (!inRange(expense.fecha, startDate, endDate)) return false;
      if (routeId && data.routeId && data.routeId !== routeId) return false;
      if (routeId && !data.routeId && selectedRoute && data.routeName && data.routeName !== selectedRoute.nombre) return false;
      if (collectorUid && data.usuarioUid !== collectorUid && data.createdByUid !== collectorUid) return false;

      if (query.trim()) {
        const text = [
          expense.descripcion,
          expense.createdBy,
          data.routeName,
          data.metodoPago,
          data.nota,
          expense.estado
        ].join(' ');

        if (!normalize(text).includes(normalize(query))) return false;
      }

      return true;
    });
  }, [collectorUid, endDate, expenses, query, routeId, selectedRoute, startDate]);

  const filteredCashClosings = useMemo(() => {
    return cashClosings.filter((closing) => {
      const data = closing as typeof closing & {
        routeId?: string;
        routeName?: string;
      };

      if (!inRange(closing.fecha, startDate, endDate)) return false;
      if (collectorUid && closing.usuarioUid !== collectorUid) return false;
      if (routeId && data.routeId && data.routeId !== routeId) return false;
      if (routeId && !data.routeId && selectedRoute && data.routeName && data.routeName !== selectedRoute.nombre) return false;

      return true;
    });
  }, [cashClosings, collectorUid, endDate, routeId, selectedRoute, startDate]);

  const creditPaymentMap = useMemo(() => {
    const map = new Map<string, number>();

    payments
      .filter((payment) => payment.estado !== 'anulado')
      .forEach((payment) => {
        map.set(payment.creditoId, (map.get(payment.creditoId) || 0) + payment.valorPagado);
      });

    return map;
  }, [payments]);

  const totals = useMemo(() => {
    return buildTotals(filteredClients, filteredCredits, filteredPayments, filteredExpenses, payments);
  }, [filteredClients, filteredCredits, filteredExpenses, filteredPayments, payments]);

  const allTotals = useMemo(() => {
    return buildTotals(clients, credits, payments.filter((payment) => payment.estado !== 'anulado'), expenses.filter((expense) => expense.estado !== 'anulado'), payments);
  }, [clients, credits, expenses, payments]);

  const routeSummary = useMemo(() => {
    return buildRouteSummary(routes, clients, credits, payments, expenses, startDate, endDate);
  }, [clients, credits, endDate, expenses, payments, routes, startDate]);

  const exportReport = async (mode: 'filtered' | 'all') => {
    const isAll = mode === 'all';

    const reportClients = isAll ? clients : filteredClients;
    const reportCredits = isAll ? credits : filteredCredits;
    const reportPayments = isAll ? payments.filter((payment) => payment.estado !== 'anulado') : filteredPayments;
    const reportExpenses = isAll ? expenses.filter((expense) => expense.estado !== 'anulado') : filteredExpenses;
    const reportCashClosings = isAll ? cashClosings : filteredCashClosings;
    const reportRouteSummary = isAll ? buildRouteSummary(routes, clients, credits, payments, expenses, '', '') : routeSummary;
    const reportTotals = isAll ? allTotals : totals;

    const title = isAll ? 'Reporte general completo' : 'Reporte filtrado';

    const headers = [
      'Reporte',
      'Ruta',
      'Cliente',
      'Cobrador',
      'Credito ID',
      'Fecha',
      'Metodo',
      'Estado',
      'Valor prestado',
      'Total a pagar',
      'Total pagado',
      'Saldo pendiente',
      'Pago',
      'Gasto',
      'Caja neta',
      'Nota'
    ];

    const summaryRows: unknown[][] = [
      [title, '', '', '', '', isAll ? 'Todo el historial' : `${startDate} a ${endDate}`, '', '', reportTotals.totalLoaned, reportTotals.totalToPay, reportTotals.totalPayments, reportTotals.totalPending, reportTotals.totalPayments, reportTotals.totalExpenses, reportTotals.netCash, 'Totales generales'],
      ['Resumen efectivo', '', '', '', '', isAll ? 'Todo el historial' : `${startDate} a ${endDate}`, 'Efectivo', '', '', '', '', '', reportTotals.totalCash, '', '', 'Total efectivo'],
      ['Resumen transferencia', '', '', '', '', isAll ? 'Todo el historial' : `${startDate} a ${endDate}`, 'Transferencia/Otros', '', '', '', '', '', reportTotals.totalTransfer, '', '', 'Total transferencia y otros'],
      ['Resumen clientes', '', `${reportClients.length} clientes`, '', '', '', '', '', '', '', '', '', '', '', '', `Al dia: ${reportTotals.clientsOk} | En mora: ${reportTotals.clientsMora}`],
      ['Resumen creditos', '', '', '', '', '', '', '', '', '', '', '', '', '', '', `Activos: ${reportTotals.activeCredits} | Pagados: ${reportTotals.paidCredits} | Vencidos: ${reportTotals.overdueCredits} | Anulados: ${reportTotals.canceledCredits}`]
    ];

    const paymentRows = reportPayments.map((payment) => {
      const client = clients.find((item) => item.id === payment.clienteId);
      const credit = credits.find((item) => item.id === payment.creditoId);

      return [
        'Pago',
        client?.routeName || '',
        client?.nombre || getClientName(payment.clienteId),
        payment.usuarioEmail,
        payment.creditoId,
        payment.fechaPago,
        payment.metodoPago,
        payment.estado,
        credit?.valorPrestado || '',
        credit?.valorTotal || '',
        '',
        credit?.saldoPendiente || '',
        payment.valorPagado,
        '',
        '',
        payment.observacion || ''
      ];
    });

    const expenseRows = reportExpenses.map((expense) => {
      const data = expense as typeof expense & {
        routeName?: string;
        metodoPago?: string;
        nota?: string;
      };

      return [
        'Gasto',
        data.routeName || '',
        '',
        expense.createdBy || '',
        '',
        expense.fecha,
        data.metodoPago || '',
        expense.estado,
        '',
        '',
        '',
        '',
        '',
        expense.valor,
        '',
        data.nota || expense.descripcion
      ];
    });

    const creditRows = reportCredits.map((credit) => {
      const client = clients.find((item) => item.id === credit.clienteId);
      const totalPaid = creditPaymentMap.get(credit.id) || 0;

      return [
        'Credito',
        client?.routeName || '',
        client?.nombre || getClientName(credit.clienteId),
        credit.assignedToEmail || '',
        credit.id,
        credit.fechaInicio,
        credit.frecuencia,
        credit.estado,
        credit.valorPrestado,
        credit.valorTotal,
        totalPaid,
        credit.saldoPendiente,
        '',
        '',
        '',
        credit.nota || ''
      ];
    });

    const clientRows = reportClients.map((client) => {
      const clientCredits = credits.filter((credit) => credit.clienteId === client.id && credit.estado !== 'anulado');
      const clientPending = clientCredits.reduce((total, credit) => total + credit.saldoPendiente, 0);

      return [
        'Cliente',
        client.routeName || '',
        client.nombre,
        client.assignedToEmail || '',
        '',
        '',
        '',
        client.estado,
        '',
        '',
        '',
        clientPending,
        '',
        '',
        '',
        client.telefono
      ];
    });

    const routeRows = reportRouteSummary.map((item) => [
      'Resumen ruta',
      item.route.nombre,
      `${item.clients} clientes`,
      '',
      '',
      isAll ? 'Todo el historial' : `${startDate} a ${endDate}`,
      '',
      '',
      '',
      '',
      item.paid,
      item.pending,
      item.paid,
      item.spent,
      item.net,
      ''
    ]);

    const cashRows = reportCashClosings.map((closing) => {
      const data = closing as typeof closing & {
        routeName?: string;
      };

      return [
        'Cierre caja',
        data.routeName || '',
        '',
        closing.usuarioEmail,
        '',
        closing.fecha,
        '',
        '',
        '',
        '',
        closing.totalPagos,
        '',
        closing.totalPagos,
        closing.totalGastos,
        closing.cajaEsperada,
        `Entregado: ${closing.cajaEntregada} | Diferencia: ${closing.diferencia} | ${closing.observacion || ''}`
      ];
    });

    const csv = toCsv(headers, [...summaryRows, ...paymentRows, ...expenseRows, ...creditRows, ...clientRows, ...routeRows, ...cashRows]);
    const available = await Sharing.isAvailableAsync();

    if (!available) {
      Alert.alert('Compartir no disponible', 'Este dispositivo no permite compartir archivos.');
      return;
    }

    const name = isAll
      ? `reporte-general-cobroapp-${todayKey()}.csv`
      : `reporte-filtrado-cobroapp-${startDate}-a-${endDate}.csv`;

    const uri = `${FileSystem.cacheDirectory}${name}`;

    await FileSystem.writeAsStringAsync(uri, csv, {
      encoding: FileSystem.EncodingType.UTF8
    });

    await Sharing.shareAsync(uri, {
      mimeType: 'text/csv',
      dialogTitle: isAll ? 'Exportar todo general' : 'Exportar reporte filtrado'
    });
  };

  return (
    <View style={styles.root}>
      <TopBar title="Exportar reportes" showBack onBack={() => navigate('more')} />

      <Screen>
        <Card style={styles.heroCard}>
          <Text style={styles.heroTitle}>{businessSettings.appName || 'CobroApp'} - Reportes Excel</Text>
          <Text style={styles.heroText}>
            Exporta todo el historial general o genera reportes filtrados por fecha, ruta, cobrador, cliente, metodo y estado.
          </Text>
        </Card>

        <Card style={styles.exportCard}>
          <Text style={styles.exportTitle}>Exportacion rapida</Text>
          <Text style={styles.exportText}>
            Usa el reporte general para sacar toda la informacion de la app. Usa el reporte filtrado para fechas, rutas o cobradores especificos.
          </Text>

          <Button title="Exportar todo general" onPress={() => exportReport('all')} style={styles.exportButton} />
          <Button title="Exportar reporte filtrado" variant="secondary" onPress={() => exportReport('filtered')} style={styles.exportButton} />
        </Card>

        <Text style={styles.label}>Periodo para reporte filtrado</Text>

        <View style={styles.chips}>
          <Chip label="Diario" selected={period === 'dia'} onPress={() => applyPeriod('dia')} />
          <Chip label="Semanal" selected={period === 'semana'} onPress={() => applyPeriod('semana')} />
          <Chip label="Quincenal" selected={period === 'quincena'} onPress={() => applyPeriod('quincena')} />
          <Chip label="Mensual" selected={period === 'mes'} onPress={() => applyPeriod('mes')} />
          <Chip label="Personalizado" selected={period === 'personalizado'} onPress={() => setPeriod('personalizado')} />
        </View>

        <Input label="Fecha inicial" icon="I" value={startDate} onChangeText={(value) => { setStartDate(value); setPeriod('personalizado'); }} placeholder="YYYY-MM-DD" />
        <Input label="Fecha final" icon="F" value={endDate} onChangeText={(value) => { setEndDate(value); setPeriod('personalizado'); }} placeholder="YYYY-MM-DD" />
        <Input label="Buscar" icon="B" value={query} onChangeText={setQuery} placeholder="Cliente, cobrador, credito, metodo o nota" />

        <Text style={styles.label}>Ruta</Text>

        <View style={styles.chips}>
          <Chip label="Todas" selected={routeId === ''} onPress={() => setRouteId('')} />
          {routes.map((route) => (
            <Chip key={route.id} label={route.nombre} selected={routeId === route.id} onPress={() => setRouteId(route.id)} />
          ))}
        </View>

        <Text style={styles.label}>Cobrador</Text>

        <View style={styles.chips}>
          <Chip label="Todos" selected={collectorUid === ''} onPress={() => setCollectorUid('')} />
          {users.map((user) => (
            <Chip key={user.id} label={user.email} selected={collectorUid === user.uid || collectorUid === user.id} onPress={() => setCollectorUid(user.uid || user.id)} />
          ))}
        </View>

        <Text style={styles.label}>Metodo de pago</Text>

        <View style={styles.chips}>
          <Chip label="Todos" selected={method === ''} onPress={() => setMethod('')} />
          <Chip label="Efectivo" selected={method === 'Efectivo'} onPress={() => setMethod('Efectivo')} />
          <Chip label="Transferencia" selected={method === 'Transferencia'} onPress={() => setMethod('Transferencia')} />
          <Chip label="Nequi" selected={method === 'Nequi'} onPress={() => setMethod('Nequi')} />
          <Chip label="Daviplata" selected={method === 'Daviplata'} onPress={() => setMethod('Daviplata')} />
          <Chip label="Otro" selected={method === 'Otro'} onPress={() => setMethod('Otro')} />
        </View>

        <Text style={styles.label}>Estado del credito</Text>

        <View style={styles.chips}>
          <Chip label="Todos" selected={creditStatus === ''} onPress={() => setCreditStatus('')} />
          <Chip label="Activo" selected={creditStatus === 'activo'} onPress={() => setCreditStatus('activo')} />
          <Chip label="Pagado" selected={creditStatus === 'pagado'} onPress={() => setCreditStatus('pagado')} />
          <Chip label="Vencido" selected={creditStatus === 'vencido'} onPress={() => setCreditStatus('vencido')} />
          <Chip label="Anulado" selected={creditStatus === 'anulado'} onPress={() => setCreditStatus('anulado')} />
        </View>

        <View style={styles.tabs}>
          <Tab label="Resumen" value="resumen" current={tab} onPress={setTab} />
          <Tab label="Pagos" value="pagos" current={tab} onPress={setTab} />
          <Tab label="Gastos" value="gastos" current={tab} onPress={setTab} />
          <Tab label="Creditos" value="creditos" current={tab} onPress={setTab} />
          <Tab label="Clientes" value="clientes" current={tab} onPress={setTab} />
          <Tab label="Caja" value="caja" current={tab} onPress={setTab} />
        </View>

        {tab === 'resumen' ? (
          <>
            <View style={styles.grid}>
              <Metric title="Pagos filtrados" value={formatMoney(totals.totalPayments)} />
              <Metric title="Gastos filtrados" value={formatMoney(totals.totalExpenses)} danger={totals.totalExpenses > 0} />
            </View>

            <View style={styles.grid}>
              <Metric title="Efectivo" value={formatMoney(totals.totalCash)} />
              <Metric title="Transferencia" value={formatMoney(totals.totalTransfer)} />
            </View>

            <View style={styles.grid}>
              <Metric title="Caja neta" value={formatMoney(totals.netCash)} danger={totals.netCash < 0} />
              <Metric title="Pendiente" value={formatMoney(totals.totalPending)} danger={totals.totalPending > 0} />
            </View>

            <Card style={styles.infoCard}>
              <Text style={styles.infoTitle}>Resumen general completo</Text>
              <Text style={styles.infoText}>Pagos totales: {formatMoney(allTotals.totalPayments)}</Text>
              <Text style={styles.infoText}>Gastos totales: {formatMoney(allTotals.totalExpenses)}</Text>
              <Text style={styles.infoText}>Caja neta general: {formatMoney(allTotals.netCash)}</Text>
              <Text style={styles.infoText}>Saldo pendiente general: {formatMoney(allTotals.totalPending)}</Text>
            </Card>

            <Card style={styles.infoCard}>
              <Text style={styles.infoTitle}>Filtros aplicados</Text>
              <Text style={styles.infoText}>Periodo: {startDate} a {endDate}</Text>
              <Text style={styles.infoText}>Ruta: {selectedRoute?.nombre || 'Todas'}</Text>
              <Text style={styles.infoText}>Cobrador: {selectedCollector?.email || 'Todos'}</Text>
              <Text style={styles.infoText}>Metodo: {method || 'Todos'}</Text>
              <Text style={styles.infoText}>Estado credito: {creditStatus || 'Todos'}</Text>
            </Card>
          </>
        ) : null}

        {tab === 'pagos' ? (
          filteredPayments.length === 0 ? (
            <EmptyState title="Sin pagos" message="No hay pagos con estos filtros." />
          ) : (
            filteredPayments.map((payment) => (
              <Card key={payment.id} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemTitle}>{getClientName(payment.clienteId)}</Text>
                    <Text style={styles.meta}>Valor: {formatMoney(payment.valorPagado)}</Text>
                    <Text style={styles.meta}>Metodo: {payment.metodoPago}</Text>
                    <Text style={styles.meta}>Fecha: {payment.fechaPago}</Text>
                    <Text style={styles.meta}>Hora: {payment.fechaHoraPago || payment.createdAt}</Text>
                    <Text style={styles.meta}>Cobrador: {payment.usuarioEmail}</Text>
                    <Text style={styles.meta}>Nota: {payment.observacion || 'Sin nota'}</Text>
                  </View>
                  <StatusBadge type={payment.estado === 'editado' ? 'warning' : 'success'} label={payment.estado} />
                </View>
              </Card>
            ))
          )
        ) : null}

        {tab === 'gastos' ? (
          filteredExpenses.length === 0 ? (
            <EmptyState title="Sin gastos" message="No hay gastos con estos filtros." />
          ) : (
            filteredExpenses.map((expense) => {
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
                  <Text style={styles.meta}>Ruta: {data.routeName || selectedRoute?.nombre || 'Sin ruta'}</Text>
                  <Text style={styles.meta}>Metodo: {data.metodoPago || 'No registrado'}</Text>
                  <Text style={styles.meta}>Cobrador: {expense.createdBy || 'No registrado'}</Text>
                  <Text style={styles.meta}>Nota: {data.nota || 'Sin nota'}</Text>
                </Card>
              );
            })
          )
        ) : null}

        {tab === 'creditos' ? (
          filteredCredits.length === 0 ? (
            <EmptyState title="Sin creditos" message="No hay creditos con estos filtros." />
          ) : (
            filteredCredits.map((credit) => {
              const totalPaid = creditPaymentMap.get(credit.id) || 0;
              const installments = buildInstallments(credit, payments, todayKey());
              const paidInstallments = installments.filter((item) => item.estado === 'pagada').length;
              const overdueInstallments = installments.filter((item) => item.estado === 'vencida').length;
              const pendingInstallments = installments.filter((item) => item.pendiente > 0).length;

              return (
                <Card key={credit.id} style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemTitle}>{getClientName(credit.clienteId)}</Text>
                      <Text style={styles.meta}>ID credito: {credit.id}</Text>
                      <Text style={styles.meta}>Inicio: {credit.fechaInicio}</Text>
                      <Text style={styles.meta}>Final: {credit.fechaFinal || 'No registrada'}</Text>
                      <Text style={styles.meta}>Prestado: {formatMoney(credit.valorPrestado)}</Text>
                      <Text style={styles.meta}>Total a pagar: {formatMoney(credit.valorTotal)}</Text>
                      <Text style={styles.meta}>Total pagado: {formatMoney(totalPaid)}</Text>
                      <Text style={styles.meta}>Pendiente: {formatMoney(credit.saldoPendiente)}</Text>
                      <Text style={styles.meta}>Cuotas: {credit.numeroCuotas}</Text>
                      <Text style={styles.meta}>Pagadas: {paidInstallments} | Atrasadas: {overdueInstallments} | Pendientes: {pendingInstallments}</Text>
                    </View>
                    <StatusBadge type={credit.estado === 'pagado' ? 'success' : credit.estado === 'vencido' || credit.estado === 'anulado' ? 'danger' : 'warning'} label={credit.estado} />
                  </View>
                </Card>
              );
            })
          )
        ) : null}

        {tab === 'clientes' ? (
          filteredClients.length === 0 ? (
            <EmptyState title="Sin clientes" message="No hay clientes con estos filtros." />
          ) : (
            filteredClients.map((client) => {
              const clientCredits = credits.filter((credit) => credit.clienteId === client.id && credit.estado !== 'anulado');
              const clientPending = clientCredits.reduce((total, credit) => total + credit.saldoPendiente, 0);

              return (
                <Card key={client.id} style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemTitle}>{client.nombre}</Text>
                      <Text style={styles.meta}>Telefono: {client.telefono}</Text>
                      <Text style={styles.meta}>Direccion: {client.direccion}</Text>
                      <Text style={styles.meta}>Ruta: {client.routeName || 'Sin ruta'}</Text>
                      <Text style={styles.meta}>Cobrador: {client.assignedToEmail || 'Sin asignar'}</Text>
                      <Text style={styles.meta}>Saldo pendiente: {formatMoney(clientPending)}</Text>
                    </View>
                    <StatusBadge type={client.estado === 'al-dia' ? 'success' : 'danger'} label={client.estado === 'al-dia' ? 'Al dia' : 'En mora'} />
                  </View>
                </Card>
              );
            })
          )
        ) : null}

        {tab === 'caja' ? (
          <>
            {routeSummary.map((item) => (
              <Card key={item.route.id} style={styles.itemCard}>
                <Text style={styles.itemTitle}>{item.route.nombre}</Text>
                <Text style={styles.meta}>Clientes: {item.clients}</Text>
                <Text style={styles.meta}>Pagos: {formatMoney(item.paid)}</Text>
                <Text style={styles.meta}>Gastos: {formatMoney(item.spent)}</Text>
                <Text style={styles.meta}>Caja neta: {formatMoney(item.net)}</Text>
                <Text style={styles.meta}>Pendiente por cobrar: {formatMoney(item.pending)}</Text>
              </Card>
            ))}

            {filteredCashClosings.map((closing) => (
              <Card key={closing.id} style={styles.itemCard}>
                <Text style={styles.itemTitle}>Cierre de caja</Text>
                <Text style={styles.meta}>Fecha: {closing.fecha}</Text>
                <Text style={styles.meta}>Cobrador: {closing.usuarioEmail}</Text>
                <Text style={styles.meta}>Caja esperada: {formatMoney(closing.cajaEsperada)}</Text>
                <Text style={styles.meta}>Caja entregada: {formatMoney(closing.cajaEntregada)}</Text>
                <Text style={styles.meta}>Diferencia: {formatMoney(closing.diferencia)}</Text>
              </Card>
            ))}
          </>
        ) : null}
      </Screen>

      <BottomNav />
    </View>
  );
}

function buildTotals(
  reportClients: any[],
  reportCredits: any[],
  reportPayments: any[],
  reportExpenses: any[],
  allPayments: any[]
) {
  const totalPayments = reportPayments.reduce((total, payment) => total + payment.valorPagado, 0);
  const totalCash = reportPayments
    .filter((payment) => payment.metodoPago === 'Efectivo')
    .reduce((total, payment) => total + payment.valorPagado, 0);

  const totalTransfer = reportPayments
    .filter((payment) => payment.metodoPago !== 'Efectivo')
    .reduce((total, payment) => total + payment.valorPagado, 0);

  const totalExpenses = reportExpenses.reduce((total, expense) => total + expense.valor, 0);
  const activeCredits = reportCredits.filter((credit) => credit.estado !== 'anulado');
  const totalLoaned = activeCredits.reduce((total, credit) => total + credit.valorPrestado, 0);
  const totalToPay = activeCredits.reduce((total, credit) => total + credit.valorTotal, 0);
  const totalPending = activeCredits.reduce((total, credit) => total + credit.saldoPendiente, 0);

  const estimatedToday = activeCredits
    .filter((credit) => credit.estado !== 'pagado')
    .reduce((total, credit) => {
      const due = buildInstallments(credit, allPayments, todayKey()).filter(
        (item) => item.fecha <= todayKey() && item.pendiente > 0
      );

      return total + due.reduce((sum, item) => sum + item.pendiente, 0);
    }, 0);

  return {
    totalPayments,
    totalCash,
    totalTransfer,
    totalExpenses,
    netCash: totalPayments - totalExpenses,
    totalLoaned,
    totalToPay,
    totalPending,
    estimatedToday,
    activeCredits: reportCredits.filter((credit) => credit.estado === 'activo').length,
    paidCredits: reportCredits.filter((credit) => credit.estado === 'pagado').length,
    overdueCredits: reportCredits.filter((credit) => credit.estado === 'vencido').length,
    canceledCredits: reportCredits.filter((credit) => credit.estado === 'anulado').length,
    clientsOk: reportClients.filter((client) => client.estado === 'al-dia').length,
    clientsMora: reportClients.filter((client) => client.estado === 'en-mora').length
  };
}

function buildRouteSummary(
  routes: any[],
  clients: any[],
  credits: any[],
  payments: any[],
  expenses: any[],
  startDate: string,
  endDate: string
) {
  return routes.map((route) => {
    const routeClientList = clients.filter((client) => client.routeId === route.id);
    const ids = new Set(routeClientList.map((client) => client.id));
    const routeCredits = credits.filter((credit) => ids.has(credit.clienteId) && credit.estado !== 'anulado');

    const routePayments = payments.filter((payment) => {
      if (!ids.has(payment.clienteId)) return false;
      if (payment.estado === 'anulado') return false;
      if (startDate || endDate) return inRange(payment.fechaPago, startDate, endDate);
      return true;
    });

    const routeExpenses = expenses.filter((expense) => {
      const data = expense as typeof expense & {
        routeId?: string;
        routeName?: string;
      };

      if (expense.estado === 'anulado') return false;
      if ((startDate || endDate) && !inRange(expense.fecha, startDate, endDate)) return false;
      if (data.routeId) return data.routeId === route.id;
      if (data.routeName) return data.routeName === route.nombre;

      return false;
    });

    const paid = routePayments.reduce((total, payment) => total + payment.valorPagado, 0);
    const spent = routeExpenses.reduce((total, expense) => total + expense.valor, 0);
    const pending = routeCredits.reduce((total, credit) => total + credit.saldoPendiente, 0);

    return {
      route,
      clients: routeClientList.length,
      paid,
      spent,
      pending,
      net: paid - spent
    };
  });
}

function Chip({
  label,
  selected,
  onPress
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.chip, selected ? styles.chipSelected : null]} onPress={onPress}>
      <Text style={[styles.chipText, selected ? styles.chipTextSelected : null]}>{label}</Text>
    </Pressable>
  );
}

function Tab({
  label,
  value,
  current,
  onPress
}: {
  label: string;
  value: ReportTab;
  current: ReportTab;
  onPress: (value: ReportTab) => void;
}) {
  return (
    <Chip label={label} selected={value === current} onPress={() => onPress(value)} />
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
  exportCard: {
    backgroundColor: '#FFF8E1',
    marginBottom: 14
  },
  exportTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900'
  },
  exportText: {
    color: colors.muted,
    fontWeight: '700',
    lineHeight: 20,
    marginTop: 6,
    marginBottom: 8
  },
  exportButton: {
    marginTop: 10
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
    marginBottom: 14
  },
  tabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14
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
  infoCard: {
    marginBottom: 12
  },
  infoTitle: {
    color: colors.text,
    fontWeight: '900',
    fontSize: 16,
    marginBottom: 6
  },
  infoText: {
    color: colors.muted,
    fontWeight: '700',
    marginTop: 5
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
  }
});