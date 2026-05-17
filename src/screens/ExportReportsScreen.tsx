import React, { useMemo } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { BottomNav } from '../components/BottomNav';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Screen } from '../components/Screen';
import { TopBar } from '../components/TopBar';
import { useApp } from '../state/AppContext';
import { colors } from '../theme/colors';
import { todayKey } from '../utils/date';

function cleanCsvValue(value: unknown) {
  const text = String(value ?? '');
  return `"${text.replace(/"/g, '""')}"`;
}

function toCsv(headers: string[], rows: unknown[][]) {
  const csvHeaders = headers.map(cleanCsvValue).join(',');
  const csvRows = rows.map((row) => row.map(cleanCsvValue).join(','));
  return [csvHeaders, ...csvRows].join('\n');
}

async function shareCsv(filename: string, content: string) {
  const available = await Sharing.isAvailableAsync();

  if (!available) {
    Alert.alert('Compartir no disponible', 'Este dispositivo no permite compartir archivos.');
    return;
  }

  const fileUri = `${FileSystem.cacheDirectory}${filename}`;

  await FileSystem.writeAsStringAsync(fileUri, content, {
    encoding: FileSystem.EncodingType.UTF8
  });

  await Sharing.shareAsync(fileUri, {
    mimeType: 'text/csv',
    dialogTitle: 'Compartir reporte',
    UTI: 'public.comma-separated-values-text'
  });
}

export function ExportReportsScreen() {
  const {
    clients,
    credits,
    payments,
    expenses,
    visits,
    cashClosings,
    routes,
    users,
    businessSettings,
    navigate,
    getClientName
  } = useApp();

  const today = todayKey();

  const activePayments = useMemo(() => {
    return payments.filter((payment) => payment.estado !== 'anulado');
  }, [payments]);

  const exportClients = async () => {
    const content = toCsv(
      [
        'Nombre',
        'Documento',
        'Telefono',
        'Direccion',
        'Barrio',
        'Estado',
        'Cobrador',
        'Ruta',
        'Creado por',
        'Fecha creacion'
      ],
      clients.map((client) => [
        client.nombre,
        client.documento,
        client.telefono,
        client.direccion,
        client.barrio,
        client.estado,
        client.assignedToEmail || 'Sin asignar',
        client.routeName || 'Sin ruta',
        client.createdBy || '',
        client.createdAt
      ])
    );

    await shareCsv(`clientes-${today}.csv`, content);
  };

  const exportCredits = async () => {
    const content = toCsv(
      [
        'Cliente',
        'Valor prestado',
        'Valor total',
        'Saldo pendiente',
        'Numero cuotas',
        'Valor cuota',
        'Frecuencia',
        'Estado',
        'Fecha inicio',
        'Cobrador',
        'Creado por',
        'Fecha creacion'
      ],
      credits.map((credit) => [
        getClientName(credit.clienteId),
        credit.valorPrestado,
        credit.valorTotal,
        credit.saldoPendiente,
        credit.numeroCuotas,
        credit.valorCuota,
        credit.frecuencia,
        credit.estado,
        credit.fechaInicio,
        credit.assignedToEmail || 'Sin asignar',
        credit.createdBy || '',
        credit.createdAt
      ])
    );

    await shareCsv(`creditos-${today}.csv`, content);
  };

  const exportPayments = async () => {
    const content = toCsv(
      [
        'Cliente',
        'Valor pagado',
        'Metodo',
        'Fecha pago',
        'Estado',
        'Cobrador',
        'Observacion',
        'Anulado por',
        'Fecha anulacion',
        'Motivo anulacion',
        'Fecha creacion'
      ],
      payments.map((payment) => [
        getClientName(payment.clienteId),
        payment.valorPagado,
        payment.metodoPago,
        payment.fechaPago,
        payment.estado,
        payment.usuarioEmail,
        payment.observacion,
        payment.anuladoPor || '',
        payment.anuladoEn || '',
        payment.motivoAnulacion || '',
        payment.createdAt
      ])
    );

    await shareCsv(`pagos-${today}.csv`, content);
  };

  const exportDailyCash = async () => {
    const todayPayments = activePayments.filter((payment) => payment.fechaPago === today);
    const todayExpenses = expenses.filter((expense) => expense.fecha === today);

    const totalPayments = todayPayments.reduce((total, payment) => total + payment.valorPagado, 0);
    const totalExpenses = todayExpenses.reduce((total, expense) => total + expense.valor, 0);

    const content = toCsv(
      ['Tipo', 'Descripcion', 'Valor', 'Fecha', 'Usuario', 'Observacion'],
      [
        ['RESUMEN', 'Total pagos activos', totalPayments, today, '', ''],
        ['RESUMEN', 'Total gastos', totalExpenses, today, '', ''],
        ['RESUMEN', 'Caja esperada', totalPayments - totalExpenses, today, '', ''],
        ...todayPayments.map((payment) => [
          'PAGO',
          getClientName(payment.clienteId),
          payment.valorPagado,
          payment.fechaPago,
          payment.usuarioEmail,
          payment.observacion
        ]),
        ...todayExpenses.map((expense) => [
          'GASTO',
          expense.descripcion,
          expense.valor,
          expense.fecha,
          expense.createdBy || '',
          ''
        ])
      ]
    );

    await shareCsv(`caja-diaria-${today}.csv`, content);
  };

  const exportVisits = async () => {
    const content = toCsv(
      [
        'Cliente',
        'Telefono',
        'Direccion',
        'Barrio',
        'Fecha',
        'Estado',
        'Observacion',
        'Promesa fecha',
        'Ruta',
        'Cobrador',
        'Fecha creacion'
      ],
      visits.map((visit) => [
        visit.clienteNombre,
        visit.clienteTelefono,
        visit.clienteDireccion,
        visit.clienteBarrio,
        visit.fecha,
        visit.estado,
        visit.observacion,
        visit.promesaFecha || '',
        visit.routeName || 'Sin ruta',
        visit.assignedToEmail || 'Sin cobrador',
        visit.createdAt
      ])
    );

    await shareCsv(`visitas-${today}.csv`, content);
  };

  const exportClosings = async () => {
    const content = toCsv(
      [
        'Fecha',
        'Usuario',
        'Total pagos',
        'Total gastos',
        'Caja esperada',
        'Caja entregada',
        'Diferencia',
        'Observacion',
        'Fecha cierre'
      ],
      cashClosings.map((closing) => [
        closing.fecha,
        closing.usuarioEmail,
        closing.totalPagos,
        closing.totalGastos,
        closing.cajaEsperada,
        closing.cajaEntregada,
        closing.diferencia,
        closing.observacion,
        closing.createdAt
      ])
    );

    await shareCsv(`cierres-caja-${today}.csv`, content);
  };

  const exportRoutes = async () => {
    const content = toCsv(
      [
        'Ruta',
        'Zona',
        'Descripcion',
        'Clientes',
        'Clientes en mora',
        'Saldo pendiente'
      ],
      routes.map((route) => {
        const routeClients = clients.filter((client) => client.routeId === route.id);
        const routeClientIds = new Set(routeClients.map((client) => client.id));
        const routeCredits = credits.filter((credit) => routeClientIds.has(credit.clienteId));
        const pending = routeCredits.reduce((total, credit) => total + credit.saldoPendiente, 0);

        return [
          route.nombre,
          route.zona,
          route.descripcion,
          routeClients.length,
          routeClients.filter((client) => client.estado === 'en-mora').length,
          pending
        ];
      })
    );

    await shareCsv(`rutas-${today}.csv`, content);
  };

  const exportCollectors = async () => {
    const collectors = users.filter((user) => user.role === 'cobrador');

    const content = toCsv(
      [
        'Cobrador',
        'Activo',
        'Clientes',
        'Creditos activos',
        'Saldo pendiente',
        'Recaudado total'
      ],
      collectors.map((collector) => {
        const collectorClients = clients.filter((client) => client.assignedToUid === collector.uid);
        const collectorCredits = credits.filter((credit) => credit.assignedToUid === collector.uid);
        const collectorPayments = activePayments.filter((payment) => payment.assignedToUid === collector.uid);

        return [
          collector.email,
          collector.activo ? 'Si' : 'No',
          collectorClients.length,
          collectorCredits.filter((credit) => credit.estado === 'activo').length,
          collectorCredits.reduce((total, credit) => total + credit.saldoPendiente, 0),
          collectorPayments.reduce((total, payment) => total + payment.valorPagado, 0)
        ];
      })
    );

    await shareCsv(`cobradores-${today}.csv`, content);
  };

  return (
    <View style={styles.root}>
      <TopBar title="Exportar reportes" showBack onBack={() => navigate('more')} />
      <Screen>
        <Card style={styles.infoCard}>
          <Text style={styles.infoTitle}>Reportes CSV</Text>
          <Text style={styles.infoText}>
            Genera archivos CSV para abrirlos en Excel, Google Sheets o compartirlos por WhatsApp/correo.
          </Text>
          <Text style={styles.businessText}>
            Negocio: {businessSettings.businessName}
          </Text>
        </Card>

        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Información principal</Text>
          <Button title="Exportar clientes" variant="secondary" onPress={exportClients} style={styles.button} />
          <Button title="Exportar créditos" variant="secondary" onPress={exportCredits} style={styles.button} />
          <Button title="Exportar pagos" variant="secondary" onPress={exportPayments} style={styles.button} />
        </Card>

        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Operación diaria</Text>
          <Button title="Exportar caja diaria de hoy" variant="secondary" onPress={exportDailyCash} style={styles.button} />
          <Button title="Exportar visitas" variant="secondary" onPress={exportVisits} style={styles.button} />
          <Button title="Exportar cierres de caja" variant="secondary" onPress={exportClosings} style={styles.button} />
        </Card>

        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Administración</Text>
          <Button title="Exportar rutas" variant="secondary" onPress={exportRoutes} style={styles.button} />
          <Button title="Exportar cobradores" variant="secondary" onPress={exportCollectors} style={styles.button} />
        </Card>

        <Card style={styles.warningCard}>
          <Text style={styles.warningTitle}>Nota</Text>
          <Text style={styles.warningText}>
            Los pagos anulados aparecen en el reporte de pagos, pero no suman en caja diaria ni en recaudos.
          </Text>
        </Card>
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
    fontSize: 16,
    fontWeight: '900'
  },
  infoText: {
    color: colors.muted,
    marginTop: 6,
    lineHeight: 20,
    fontWeight: '700'
  },
  businessText: {
    color: colors.primary,
    fontWeight: '900',
    marginTop: 10
  },
  sectionCard: {
    marginBottom: 14
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 10
  },
  button: {
    marginBottom: 10
  },
  warningCard: {
    backgroundColor: '#FFF8E1'
  },
  warningTitle: {
    color: colors.text,
    fontWeight: '900',
    fontSize: 16
  },
  warningText: {
    color: colors.muted,
    fontWeight: '700',
    lineHeight: 20,
    marginTop: 6
  }
});