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
import { formatMoney } from '../utils/money';

type PaymentFilter = 'activos' | 'editados' | 'anulados' | 'todos';

export function PaymentsScreen() {
  const {
    payments,
    getClientName,
    navigate,
    cancelPayment,
    canManagePayments,
    selectPayment
  } = useApp();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<PaymentFilter>('activos');

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return payments.filter((payment) => {
      const matchesFilter =
        filter === 'todos'
          ? true
          : filter === 'activos'
            ? payment.estado === 'activo'
            : filter === 'editados'
              ? payment.estado === 'editado'
              : payment.estado === 'anulado';

      const matchesSearch = query
        ? [
            getClientName(payment.clienteId),
            payment.usuarioEmail,
            payment.metodoPago,
            payment.fechaPago,
            payment.observacion,
            payment.assignedToEmail
          ]
            .join(' ')
            .toLowerCase()
            .includes(query)
        : true;

      return matchesFilter && matchesSearch;
    });
  }, [filter, getClientName, payments, search]);

  const totalActive = payments
    .filter((payment) => payment.estado !== 'anulado')
    .reduce((total, payment) => total + payment.valorPagado, 0);

  const totalCanceled = payments
    .filter((payment) => payment.estado === 'anulado')
    .reduce((total, payment) => total + payment.valorPagado, 0);

  const confirmCancel = (paymentId: string) => {
    Alert.alert(
      'Anular pago',
      'Esta accion no borra el pago: lo marcara como anulado, devolvera el saldo al credito y guardara auditoria. Deseas continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Anular',
          style: 'destructive',
          onPress: () => cancelPayment(paymentId, 'Anulacion manual desde pantalla de pagos')
        }
      ]
    );
  };

  return (
    <View style={styles.root}>
      <TopBar title="Pagos" rightText="+" onRightPress={() => navigate('registerPayment')} />

      <Screen>
        <View style={styles.summaryGrid}>
          <Card style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Pagos activos</Text>
            <Text style={styles.summaryValue}>{formatMoney(totalActive)}</Text>
          </Card>

          <Card style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Pagos anulados</Text>
            <Text style={[styles.summaryValue, styles.danger]}>{formatMoney(totalCanceled)}</Text>
          </Card>
        </View>

        <Input
          label="Buscar pago"
          icon="🔎"
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar por cliente, cobrador, metodo o fecha"
        />

        <View style={styles.filters}>
          <FilterChip label="Activos" value="activos" current={filter} onPress={setFilter} />
          <FilterChip label="Editados" value="editados" current={filter} onPress={setFilter} />
          <FilterChip label="Anulados" value="anulados" current={filter} onPress={setFilter} />
          <FilterChip label="Todos" value="todos" current={filter} onPress={setFilter} />
        </View>

        {filtered.length === 0 ? (
          <EmptyState title="Sin pagos" message="No hay pagos con ese filtro." />
        ) : (
          filtered.map((payment) => {
            const isCanceled = payment.estado === 'anulado';
            const isEdited = payment.estado === 'editado';

            return (
              <Card key={payment.id} style={[styles.paymentCard, isCanceled ? styles.canceledCard : null]}>
                <View style={styles.paymentHeader}>
                  <View style={styles.paymentInfo}>
                    <Text style={styles.clientName}>{getClientName(payment.clienteId)}</Text>
                    <Text style={styles.meta}>Valor: {formatMoney(payment.valorPagado)}</Text>
                    <Text style={styles.meta}>Metodo: {payment.metodoPago}</Text>
                    <Text style={styles.meta}>Fecha: {payment.fechaPago}</Text>
                    <Text style={styles.meta}>Hora registro: {payment.fechaHoraPago || payment.createdAt}</Text>
                    <Text style={styles.meta}>Cobrador: {payment.usuarioEmail}</Text>
                  </View>

                  <StatusBadge
                    type={isCanceled ? 'danger' : isEdited ? 'warning' : 'success'}
                    label={isCanceled ? 'Anulado' : isEdited ? 'Editado' : 'Activo'}
                  />
                </View>

                {payment.observacion ? (
                  <Text style={styles.note}>Nota: {payment.observacion}</Text>
                ) : null}

                {isEdited ? (
                  <View style={styles.editBox}>
                    <Text style={styles.editTitle}>Informacion de edicion</Text>
                    <Text style={styles.cancelText}>Editado por: {payment.editadoPor || 'No registrado'}</Text>
                    <Text style={styles.cancelText}>Fecha: {payment.editadoEn || 'No registrada'}</Text>
                    <Text style={styles.cancelText}>Motivo: {payment.motivoEdicion || 'Sin motivo'}</Text>
                    <Text style={styles.cancelText}>Valor original: {formatMoney(payment.valorOriginal || 0)}</Text>
                  </View>
                ) : null}

                {isCanceled ? (
                  <View style={styles.cancelBox}>
                    <Text style={styles.cancelTitle}>Informacion de anulacion</Text>
                    <Text style={styles.cancelText}>Anulado por: {payment.anuladoPor || 'No registrado'}</Text>
                    <Text style={styles.cancelText}>Fecha: {payment.anuladoEn || 'No registrada'}</Text>
                    <Text style={styles.cancelText}>Motivo: {payment.motivoAnulacion || 'Sin motivo'}</Text>
                  </View>
                ) : canManagePayments ? (
                  <View style={styles.buttonRow}>
                    <Button title="Editar pago" variant="secondary" onPress={() => selectPayment(payment.id)} style={styles.actionButton} />
                    <Button title="Anular pago" variant="danger" onPress={() => confirmCancel(payment.id)} style={styles.actionButton} />
                  </View>
                ) : null}
              </Card>
            );
          })
        )}

        <Button title="Registrar nuevo pago" onPress={() => navigate('registerPayment')} style={styles.newButton} />
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
  value: PaymentFilter;
  current: PaymentFilter;
  onPress: (value: PaymentFilter) => void;
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
  summaryGrid: {
    flexDirection: 'row',
    gap: 10,
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
    fontSize: 18,
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
    fontWeight: '900'
  },
  filterTextSelected: {
    color: colors.primary
  },
  paymentCard: {
    marginBottom: 12
  },
  canceledCard: {
    backgroundColor: '#FFF5F5'
  },
  paymentHeader: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start'
  },
  paymentInfo: {
    flex: 1
  },
  clientName: {
    color: colors.text,
    fontWeight: '900',
    fontSize: 16
  },
  meta: {
    color: colors.muted,
    fontWeight: '700',
    marginTop: 4
  },
  note: {
    color: colors.text,
    fontWeight: '700',
    marginTop: 10,
    lineHeight: 20
  },
  cancelBox: {
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12
  },
  editBox: {
    marginTop: 12,
    backgroundColor: '#FFF8E1',
    borderRadius: 14,
    padding: 12
  },
  cancelTitle: {
    color: colors.danger,
    fontWeight: '900',
    marginBottom: 6
  },
  editTitle: {
    color: colors.primary,
    fontWeight: '900',
    marginBottom: 6
  },
  cancelText: {
    color: colors.muted,
    fontWeight: '700',
    marginTop: 3
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12
  },
  actionButton: {
    flex: 1
  },
  newButton: {
    marginTop: 10
  }
});