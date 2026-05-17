import React, { useMemo } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { BottomNav } from '../components/BottomNav';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { Screen } from '../components/Screen';
import { StatusBadge } from '../components/StatusBadge';
import { TopBar } from '../components/TopBar';
import { useApp } from '../state/AppContext';
import { colors } from '../theme/colors';
import { formatMoney } from '../utils/money';

export function ClientDetailScreen() {
  const {
    selectedClient,
    credits,
    payments,
    navigate,
    changeClientStatus,
    isAdmin
  } = useApp();

  const clientCredits = useMemo(() => {
    if (!selectedClient) return [];
    return credits.filter((credit) => credit.clienteId === selectedClient.id);
  }, [credits, selectedClient]);

  const clientPayments = useMemo(() => {
    if (!selectedClient) return [];
    return payments.filter((payment) => payment.clienteId === selectedClient.id);
  }, [payments, selectedClient]);

  const pendingTotal = clientCredits.reduce((total, credit) => total + credit.saldoPendiente, 0);
  const paidTotal = clientPayments.filter((payment) => payment.estado !== 'anulado').reduce((total, payment) => total + payment.valorPagado, 0);

  if (!selectedClient) {
    return (
      <View style={styles.root}>
        <TopBar title="Detalle cliente" showBack onBack={() => navigate('clients')} />
        <Screen>
          <EmptyState title="Cliente no encontrado" message="Vuelve a la lista y selecciona un cliente." />
          <Button title="Volver a clientes" onPress={() => navigate('clients')} />
        </Screen>
        <BottomNav />
      </View>
    );
  }

  const nextStatus = selectedClient.estado === 'al-dia' ? 'en-mora' : 'al-dia';

  const handleChangeStatus = () => {
    Alert.alert(
      'Cambiar estado',
      nextStatus === 'en-mora'
        ? '¿Quieres marcar este cliente como En mora?'
        : '¿Quieres marcar este cliente como Al día?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cambiar', onPress: () => changeClientStatus(selectedClient.id, nextStatus) }
      ]
    );
  };

  return (
    <View style={styles.root}>
      <TopBar title="Detalle cliente" showBack onBack={() => navigate('clients')} />
      <Screen>
        <Card style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{selectedClient.nombre.charAt(0).toUpperCase()}</Text>
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.name}>{selectedClient.nombre}</Text>
            <Text style={styles.document}>Documento: {selectedClient.documento || 'Sin documento'}</Text>
            <Text style={styles.phone}>Teléfono: {selectedClient.telefono}</Text>
          </View>

          <StatusBadge
            type={selectedClient.estado === 'al-dia' ? 'success' : 'danger'}
            label={selectedClient.estado === 'al-dia' ? 'Al día' : 'En mora'}
          />
        </Card>

        <View style={styles.summaryGrid}>
          <Card style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Saldo pendiente</Text>
            <Text style={[styles.summaryValue, styles.dangerText]}>{formatMoney(pendingTotal)}</Text>
          </Card>

          <Card style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total pagado</Text>
            <Text style={styles.summaryValue}>{formatMoney(paidTotal)}</Text>
          </Card>
        </View>

        <Card>
          <Text style={styles.sectionTitle}>Información del cliente</Text>
          <Text style={styles.detail}>Dirección: {selectedClient.direccion}</Text>
          <Text style={styles.detail}>Barrio: {selectedClient.barrio || 'Sin barrio'}</Text>
          <Text style={styles.detail}>Cobrador: {selectedClient.assignedToEmail || 'Sin asignar'}</Text>
          <Text style={styles.detail}>Ruta: {selectedClient.routeName || 'Sin ruta'}</Text>
          <Text style={styles.detail}>Creado por: {selectedClient.createdBy || 'No registrado'}</Text>
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>Acciones</Text>

          <Button
            title="Ver historial"
            variant="secondary"
            onPress={() => navigate('clientHistory')}
            style={styles.actionButton}
          />
          <Button title="Registrar pago" onPress={() => navigate('registerPayment')} style={styles.actionButton} />
          <Button
            title={nextStatus === 'en-mora' ? 'Marcar en mora' : 'Marcar al día'}
            variant={nextStatus === 'en-mora' ? 'danger' : 'secondary'}
            onPress={handleChangeStatus}
            style={styles.actionButton}
          />

          {isAdmin ? (
            <Button title="Crear crédito para cliente" variant="secondary" onPress={() => navigate('newCredit')} style={styles.actionButton} />
          ) : null}
        </Card>

        <Text style={styles.blockTitle}>Créditos del cliente</Text>

        {clientCredits.length === 0 ? (
          <EmptyState title="Sin créditos" message="Este cliente todavía no tiene créditos registrados." />
        ) : (
          clientCredits.map((credit) => (
            <Card key={credit.id} style={styles.itemCard}>
              <View style={styles.row}>
                <Text style={styles.itemTitle}>{formatMoney(credit.valorPrestado)}</Text>
                <StatusBadge
                  type={credit.estado === 'pagado' ? 'success' : credit.estado === 'vencido' ? 'danger' : 'warning'}
                  label={credit.estado}
                />
              </View>

              <Text style={styles.detail}>Total a pagar: {formatMoney(credit.valorTotal)}</Text>
              <Text style={styles.detail}>Saldo: {formatMoney(credit.saldoPendiente)}</Text>
              <Text style={styles.detail}>Cuota: {formatMoney(credit.valorCuota)} · {credit.frecuencia}</Text>
              <Text style={styles.detail}>Inicio: {credit.fechaInicio}</Text>
            </Card>
          ))
        )}

        <Text style={styles.blockTitle}>Pagos del cliente</Text>

        {clientPayments.length === 0 ? (
          <EmptyState title="Sin pagos" message="Este cliente todavía no tiene pagos registrados." />
        ) : (
          clientPayments.map((payment) => (
            <Card key={payment.id} style={styles.itemCard}>
              <View style={styles.row}>
                <Text style={styles.itemTitle}>{formatMoney(payment.valorPagado)}</Text>
                <Text style={styles.date}>{payment.fechaPago}</Text>
              </View>

              <Text style={styles.detail}>Método: {payment.metodoPago}</Text>
              <Text style={styles.detail}>Registrado por: {payment.usuarioEmail}</Text>
              {payment.observacion ? <Text style={styles.detail}>Nota: {payment.observacion}</Text> : null}
            </Card>
          ))
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
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarText: {
    color: colors.primary,
    fontWeight: '900',
    fontSize: 22
  },
  profileInfo: {
    flex: 1
  },
  name: {
    color: colors.text,
    fontWeight: '900',
    fontSize: 18
  },
  document: {
    color: colors.muted,
    marginTop: 3,
    fontWeight: '700'
  },
  phone: {
    color: colors.muted,
    marginTop: 3,
    fontWeight: '700'
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    marginBottom: 12
  },
  summaryCard: {
    flex: 1
  },
  summaryLabel: {
    color: colors.muted,
    fontWeight: '800',
    fontSize: 12
  },
  summaryValue: {
    color: colors.primary,
    fontWeight: '900',
    fontSize: 18,
    marginTop: 6
  },
  dangerText: {
    color: colors.danger
  },
  sectionTitle: {
    color: colors.text,
    fontWeight: '900',
    fontSize: 16,
    marginBottom: 10
  },
  blockTitle: {
    color: colors.text,
    fontWeight: '900',
    fontSize: 18,
    marginTop: 18,
    marginBottom: 10
  },
  detail: {
    color: colors.muted,
    fontWeight: '700',
    marginTop: 5,
    lineHeight: 20
  },
  actionButton: {
    marginBottom: 10
  },
  itemCard: {
    marginBottom: 10
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  itemTitle: {
    color: colors.text,
    fontWeight: '900',
    fontSize: 16
  },
  date: {
    color: colors.muted,
    fontWeight: '800'
  }
});
