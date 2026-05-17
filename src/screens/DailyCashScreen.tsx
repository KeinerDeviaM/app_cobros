import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Screen } from '../components/Screen';
import { StatCard } from '../components/StatCard';
import { TopBar } from '../components/TopBar';
import { useApp } from '../state/AppContext';
import { colors } from '../theme/colors';
import { todayKey, displayDate } from '../utils/date';
import { formatMoney, parseMoney } from '../utils/money';

export function DailyCashScreen() {
  const { stats, payments, expenses, addExpense } = useApp();
  const [descripcion, setDescripcion] = useState('');
  const [valor, setValor] = useState('');
  const today = todayKey();
  const todayPayments = payments.filter((payment) => payment.fechaPago === today);
  const todayExpenses = expenses.filter((expense) => expense.fecha === today);

  const saveExpense = () => {
    const amount = parseMoney(valor);
    if (!descripcion.trim() || amount <= 0) {
      Alert.alert('Datos incompletos', 'Escribe descripcion y valor del gasto.');
      return;
    }
    addExpense({ descripcion, valor: amount, fecha: today });
    setDescripcion('');
    setValor('');
  };

  return (
    <View style={styles.root}>
      <TopBar title="Caja diaria" showBack />
      <Screen withBottomNav={false}>
        <Text style={styles.date}>Resumen de {displayDate(today)}</Text>
        <View style={styles.grid}>
          <StatCard icon="💰" value={formatMoney(stats.collectedToday)} label="Cobrado hoy" />
          <StatCard icon="🧾" value={formatMoney(stats.expensesToday)} label="Gastos" />
        </View>
        <View style={styles.grid}>
          <StatCard icon="🏦" value={formatMoney(stats.cashExpected)} label="Caja esperada" />
          <StatCard icon="⚠️" value={formatMoney(0)} label="Diferencia" />
        </View>

        <Text style={styles.sectionTitle}>Registrar gasto</Text>
        <Card>
          <Input label="Descripcion" icon="📝" value={descripcion} onChangeText={setDescripcion} placeholder="Ej: transporte" />
          <Input label="Valor" icon="$" value={valor} onChangeText={setValor} keyboardType="numeric" placeholder="Ej: 12000" />
          <Button title="Agregar gasto" onPress={saveExpense} />
        </Card>

        <Text style={styles.sectionTitle}>Movimientos recientes</Text>
        <Card>
          <Text style={styles.subheader}>Pagos de hoy</Text>
          {todayPayments.length === 0 ? <Text style={styles.muted}>No hay pagos hoy.</Text> : null}
          {todayPayments.map((payment) => (
            <View key={payment.id} style={styles.movementRow}>
              <Text style={styles.movementText}>{payment.metodoPago}</Text>
              <Text style={styles.paymentAmount}>{formatMoney(payment.valorPagado)}</Text>
            </View>
          ))}

          <Text style={[styles.subheader, styles.expenseTitle]}>Gastos de hoy</Text>
          {todayExpenses.length === 0 ? <Text style={styles.muted}>No hay gastos hoy.</Text> : null}
          {todayExpenses.map((expense) => (
            <View key={expense.id} style={styles.movementRow}>
              <Text style={styles.movementText}>{expense.descripcion}</Text>
              <Text style={styles.expenseAmount}>-{formatMoney(expense.valor)}</Text>
            </View>
          ))}
        </Card>

        <Button title="Cerrar caja" onPress={() => Alert.alert('Caja cerrada', 'Este cierre queda listo para sincronizar con Firebase.')} style={styles.closeButton} />
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  date: { color: colors.muted, fontWeight: '800', marginBottom: 14 },
  grid: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '900', marginTop: 14, marginBottom: 10 },
  subheader: { color: colors.text, fontWeight: '900', marginBottom: 8 },
  muted: { color: colors.muted, marginBottom: 8 },
  movementRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  movementText: { color: colors.text, fontWeight: '700' },
  paymentAmount: { color: colors.success, fontWeight: '900' },
  expenseTitle: { marginTop: 16 },
  expenseAmount: { color: colors.danger, fontWeight: '900' },
  closeButton: { marginTop: 16 }
});
