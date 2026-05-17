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
import { formatMoney } from '../utils/money';
import { isPositiveMoney, isValidDateKey, parseMoney } from '../utils/validation';

export function DailyCashScreen() {
  const {
    payments,
    expenses,
    cashClosings,
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
  const [loadingExpense, setLoadingExpense] = useState(false);
  const [loadingClosing, setLoadingClosing] = useState(false);

  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      const active = payment.estado !== 'anulado';
      const sameDate = payment.fechaPago === closingDate;
      if (!active || !sameDate) return false;
      if (isAdmin) return true;
      return payment.usuarioEmail === session.email || payment.assignedToUid === session.uid;
    });
  }, [closingDate, isAdmin, payments, session.email, session.uid]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const sameDate = expense.fecha === closingDate;
      if (!sameDate) return false;
      if (isAdmin) return true;
      return expense.createdBy === session.email;
    });
  }, [closingDate, expenses, isAdmin, session.email]);

  const activeExpenses = useMemo(() => {
    return filteredExpenses.filter((expense) => expense.estado !== 'anulado');
  }, [filteredExpenses]);

  const closingsForDate = useMemo(() => {
    return cashClosings.filter((closing) => {
      const sameDate = closing.fecha === closingDate;
      if (!sameDate) return false;
      if (isAdmin) return true;
      return closing.usuarioUid === session.uid;
    });
  }, [cashClosings, closingDate, isAdmin, session.uid]);

  const currentUserClosingsForDate = useMemo(() => {
    return cashClosings.filter(
      (closing) => closing.fecha === closingDate && closing.usuarioUid === session.uid
    );
  }, [cashClosings, closingDate, session.uid]);

  const totalPayments = filteredPayments.reduce((total, payment) => total + payment.valorPagado, 0);
  const totalExpenses = activeExpenses.reduce((total, expense) => total + expense.valor, 0);
  const expectedCash = totalPayments - totalExpenses;
  const deliveredNumber = parseMoney(cashDelivered);
  const difference = Number.isFinite(deliveredNumber) ? deliveredNumber - expectedCash : 0;

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

    setLoadingExpense(true);

    await addExpense({
      descripcion: expenseDescription.trim(),
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
      Alert.alert('Caja entregada requerida', 'Ingresa el valor entregado en efectivo.');
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
      `Caja esperada: ${formatMoney(expectedCash)}\nCaja entregada: ${formatMoney(deliveredNumber)}\nDiferencia: ${formatMoney(difference)}\n\n¿Deseas guardar el cierre?`,
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
        <Card style={styles.dateCard}>
          <Input label="Fecha de caja" icon="📅" value={closingDate} onChangeText={setClosingDate} placeholder="YYYY-MM-DD" />
        </Card>

        <View style={styles.grid}>
          <Card style={styles.metricCard}>
            <Text style={styles.metricLabel}>Cobrado</Text>
            <Text style={styles.metricValue}>{formatMoney(totalPayments)}</Text>
          </Card>

          <Card style={styles.metricCard}>
            <Text style={styles.metricLabel}>Gastos activos</Text>
            <Text style={[styles.metricValue, styles.danger]}>{formatMoney(totalExpenses)}</Text>
          </Card>
        </View>

        <View style={styles.grid}>
          <Card style={styles.metricCard}>
            <Text style={styles.metricLabel}>Caja esperada</Text>
            <Text style={styles.metricValue}>{formatMoney(expectedCash)}</Text>
          </Card>

          <Card style={styles.metricCard}>
            <Text style={styles.metricLabel}>Diferencia</Text>
            <Text style={[styles.metricValue, difference < 0 ? styles.danger : styles.success]}>
              {formatMoney(difference)}
            </Text>
          </Card>
        </View>

        {currentUserClosingsForDate.length > 0 ? (
          <Card style={styles.warningCard}>
            <Text style={styles.warningTitle}>Caja ya cerrada</Text>
            <Text style={styles.warningText}>Tu usuario ya tiene cierre registrado para esta fecha.</Text>
          </Card>
        ) : null}

        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Registrar gasto</Text>

          <Input label="Descripcion" icon="🧾" value={expenseDescription} onChangeText={setExpenseDescription} placeholder="Ej: Transporte, gasolina, papeleria" />
          <Input label="Valor" icon="💸" value={expenseValue} onChangeText={setExpenseValue} keyboardType="numeric" placeholder="Ej: 10000" />

          <Button title="Agregar gasto" onPress={handleAddExpense} loading={loadingExpense} />
        </Card>

        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Cerrar caja</Text>

          <Input label="Caja entregada" icon="💵" value={cashDelivered} onChangeText={setCashDelivered} keyboardType="numeric" placeholder="Ej: 250000" />
          <Input label="Observacion" icon="📝" value={closingObservation} onChangeText={setClosingObservation} placeholder="Opcional" />

          <View style={styles.previewBox}>
            <Text style={styles.previewText}>Caja esperada: {formatMoney(expectedCash)}</Text>
            <Text style={styles.previewText}>Caja entregada: {cashDelivered ? formatMoney(deliveredNumber) : formatMoney(0)}</Text>
            <Text style={[styles.previewText, difference < 0 ? styles.danger : styles.success]}>
              Diferencia: {cashDelivered ? formatMoney(difference) : formatMoney(0)}
            </Text>
          </View>

          <Button title="Cerrar caja" onPress={handleCloseCash} loading={loadingClosing} />
        </Card>

        <Text style={styles.blockTitle}>Pagos del dia</Text>

        {filteredPayments.length === 0 ? (
          <EmptyState title="Sin pagos" message="No hay pagos activos para esta fecha." />
        ) : (
          filteredPayments.map((payment) => (
            <Card key={payment.id} style={styles.itemCard}>
              <View style={styles.row}>
                <Text style={styles.itemTitle}>{formatMoney(payment.valorPagado)}</Text>
                <StatusBadge type="success" label={payment.metodoPago} />
              </View>

              <Text style={styles.itemText}>Cobrador: {payment.usuarioEmail}</Text>
              <Text style={styles.itemText}>Observacion: {payment.observacion || 'Sin observacion'}</Text>
            </Card>
          ))
        )}

        <Text style={styles.blockTitle}>Gastos del dia</Text>

        {filteredExpenses.length === 0 ? (
          <EmptyState title="Sin gastos" message="No hay gastos registrados para esta fecha." />
        ) : (
          filteredExpenses.map((expense) => {
            const isCanceled = expense.estado === 'anulado';
            const canEdit = isAdmin || expense.createdBy === session.email;

            return (
              <Pressable key={expense.id} onPress={() => canEdit ? selectExpense(expense.id) : undefined}>
                <Card style={[styles.itemCard, isCanceled ? styles.canceledCard : null]}>
                  <View style={styles.row}>
                    <Text style={[styles.itemTitle, isCanceled ? styles.danger : null]}>{expense.descripcion}</Text>
                    <StatusBadge type={isCanceled ? 'danger' : 'success'} label={isCanceled ? 'Anulado' : 'Activo'} />
                  </View>

                  <Text style={[styles.expenseValue, isCanceled ? styles.canceledText : null]}>
                    {formatMoney(expense.valor)}
                  </Text>

                  <Text style={styles.itemText}>Registrado por: {expense.createdBy || 'No registrado'}</Text>

                  {isCanceled ? (
                    <>
                      <Text style={styles.itemText}>Anulado por: {expense.anuladoPor || 'No registrado'}</Text>
                      <Text style={styles.itemText}>Motivo: {expense.motivoAnulacion || 'Sin motivo'}</Text>
                    </>
                  ) : null}

                  {canEdit ? (
                    <Text style={styles.openText}>Tocar para editar o anular</Text>
                  ) : null}
                </Card>
              </Pressable>
            );
          })
        )}

        <Text style={styles.blockTitle}>Historial de cierres</Text>

        {closingsForDate.length === 0 ? (
          <EmptyState title="Sin cierres" message="Todavia no hay cierres guardados para esta fecha." />
        ) : (
          closingsForDate.map((closing) => (
            <Card key={closing.id} style={styles.itemCard}>
              <View style={styles.row}>
                <Text style={styles.itemTitle}>{closing.usuarioEmail}</Text>
                <StatusBadge type={closing.diferencia === 0 ? 'success' : 'warning'} label={closing.diferencia === 0 ? 'Cuadrada' : 'Con diferencia'} />
              </View>

              <Text style={styles.itemText}>Pagos: {formatMoney(closing.totalPagos)}</Text>
              <Text style={styles.itemText}>Gastos: {formatMoney(closing.totalGastos)}</Text>
              <Text style={styles.itemText}>Caja esperada: {formatMoney(closing.cajaEsperada)}</Text>
              <Text style={styles.itemText}>Caja entregada: {formatMoney(closing.cajaEntregada)}</Text>
              <Text style={styles.itemText}>Diferencia: {formatMoney(closing.diferencia)}</Text>
              <Text style={styles.itemText}>Observacion: {closing.observacion || 'Sin observacion'}</Text>
            </Card>
          ))
        )}
      </Screen>
      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  dateCard: { marginBottom: 12 },
  grid: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  metricCard: { flex: 1 },
  metricLabel: { color: colors.muted, fontWeight: '800', fontSize: 12 },
  metricValue: { color: colors.primary, fontSize: 18, fontWeight: '900', marginTop: 6 },
  danger: { color: colors.danger },
  success: { color: colors.success },
  warningCard: { backgroundColor: '#FFF8E1', marginBottom: 12 },
  warningTitle: { color: colors.text, fontWeight: '900', fontSize: 16 },
  warningText: { color: colors.muted, fontWeight: '700', marginTop: 6, lineHeight: 20 },
  sectionCard: { marginTop: 8, marginBottom: 12 },
  sectionTitle: { color: colors.text, fontSize: 17, fontWeight: '900', marginBottom: 10 },
  previewBox: { backgroundColor: colors.background, borderRadius: 14, padding: 12, marginBottom: 12 },
  previewText: { color: colors.text, fontWeight: '800', marginBottom: 5 },
  blockTitle: { color: colors.text, fontSize: 18, fontWeight: '900', marginTop: 14, marginBottom: 10 },
  itemCard: { marginBottom: 10 },
  canceledCard: { backgroundColor: '#FFF5F5' },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, alignItems: 'center' },
  itemTitle: { color: colors.text, fontWeight: '900', fontSize: 15, flex: 1 },
  itemText: { color: colors.muted, fontWeight: '700', marginTop: 5, lineHeight: 20 },
  expenseValue: { color: colors.danger, fontWeight: '900', marginTop: 6 },
  canceledText: { textDecorationLine: 'line-through' },
  openText: { color: colors.primary, fontWeight: '900', marginTop: 8, fontSize: 12 }
});
