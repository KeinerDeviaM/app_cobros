import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BottomNav } from '../components/BottomNav';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { Screen } from '../components/Screen';
import { StatusBadge } from '../components/StatusBadge';
import { TopBar } from '../components/TopBar';
import { useApp } from '../state/AppContext';
import { colors } from '../theme/colors';
import { displayDate } from '../utils/date';
import { formatMoney } from '../utils/money';

export function CreditsScreen() {
  const { credits, getClientName, navigate } = useApp();

  return (
    <View style={styles.root}>
      <TopBar title="Creditos" rightText="+" onRightPress={() => navigate('newCredit')} />
      <Screen>
        {credits.length === 0 ? (
          <EmptyState title="Sin creditos" message="Crea el primer credito para comenzar." />
        ) : (
          credits.map((credit) => (
            <Card key={credit.id} style={styles.card}>
              <View style={styles.header}>
                <View style={styles.iconBox}><Text style={styles.icon}>📋</Text></View>
                <View style={styles.headerInfo}>
                  <Text style={styles.client}>{getClientName(credit.clienteId)}</Text>
                  <Text style={styles.meta}>{credit.frecuencia} · inicio {displayDate(credit.fechaInicio)}</Text>
                </View>
                <StatusBadge
                  type={credit.estado === 'pagado' ? 'success' : credit.estado === 'vencido' ? 'danger' : 'warning'}
                  label={credit.estado === 'pagado' ? 'Pagado' : credit.estado === 'vencido' ? 'Vencido' : 'Activo'}
                />
              </View>
              <View style={styles.amountRow}>
                <View>
                  <Text style={styles.small}>Prestado</Text>
                  <Text style={styles.amount}>{formatMoney(credit.valorPrestado)}</Text>
                </View>
                <View>
                  <Text style={styles.small}>Saldo</Text>
                  <Text style={[styles.amount, styles.pending]}>{formatMoney(credit.saldoPendiente)}</Text>
                </View>
              </View>
              <Text style={styles.installment}>Cuota sugerida: {formatMoney(credit.valorCuota)} · {credit.numeroCuotas} cuotas</Text>
            </Card>
          ))
        )}
        <Button title="Crear nuevo credito" onPress={() => navigate('newCredit')} style={styles.button} />
      </Screen>
      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  card: { marginBottom: 12 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBox: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 20 },
  headerInfo: { flex: 1 },
  client: { color: colors.text, fontWeight: '900', fontSize: 16 },
  meta: { color: colors.muted, fontSize: 12, marginTop: 2 },
  amountRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 },
  small: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  amount: { color: colors.text, fontSize: 17, fontWeight: '900', marginTop: 3 },
  pending: { color: colors.danger },
  installment: { color: colors.muted, marginTop: 14, fontWeight: '700' },
  button: { marginTop: 8 }
});
