import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BottomNav } from '../components/BottomNav';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { Screen } from '../components/Screen';
import { TopBar } from '../components/TopBar';
import { useApp } from '../state/AppContext';
import { colors } from '../theme/colors';
import { displayDate } from '../utils/date';
import { formatMoney } from '../utils/money';

export function PaymentsScreen() {
  const { payments, getClientName, navigate } = useApp();

  return (
    <View style={styles.root}>
      <TopBar title="Pagos" rightText="+" onRightPress={() => navigate('registerPayment')} />
      <Screen>
        {payments.length === 0 ? (
          <EmptyState title="Sin pagos" message="Registra el primer pago del dia." />
        ) : (
          payments.map((payment) => (
            <Card key={payment.id} style={styles.card}>
              <View style={styles.row}>
                <View style={styles.iconBox}><Text style={styles.icon}>💰</Text></View>
                <View style={styles.info}>
                  <Text style={styles.name}>{getClientName(payment.clienteId)}</Text>
                  <Text style={styles.meta}>{payment.metodoPago} · {displayDate(payment.fechaPago)}</Text>
                  {payment.observacion ? <Text style={styles.note}>{payment.observacion}</Text> : null}
                </View>
                <Text style={styles.amount}>{formatMoney(payment.valorPagado)}</Text>
              </View>
            </Card>
          ))
        )}
        <Button title="Registrar nuevo pago" onPress={() => navigate('registerPayment')} style={styles.button} />
      </Screen>
      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  card: { marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 44, height: 44, borderRadius: 16, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 20 },
  info: { flex: 1 },
  name: { color: colors.text, fontSize: 15, fontWeight: '900' },
  meta: { color: colors.muted, fontSize: 12, marginTop: 2, fontWeight: '700' },
  note: { color: colors.muted, fontSize: 12, marginTop: 4 },
  amount: { color: colors.success, fontSize: 16, fontWeight: '900' },
  button: { marginTop: 12 }
});
