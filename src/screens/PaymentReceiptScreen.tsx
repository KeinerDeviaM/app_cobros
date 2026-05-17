import React from 'react';
import { Share, StyleSheet, Text, View } from 'react-native';
import { BottomNav } from '../components/BottomNav';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { Screen } from '../components/Screen';
import { TopBar } from '../components/TopBar';
import { useApp } from '../state/AppContext';
import { colors } from '../theme/colors';
import { formatMoney } from '../utils/money';

export function PaymentReceiptScreen() {
  const { lastReceipt, businessSettings, navigate, clearReceipt } = useApp();

  if (!lastReceipt) {
    return (
      <View style={styles.root}>
        <TopBar title="Recibo de pago" showBack onBack={() => navigate('payments')} />
        <Screen>
          <EmptyState title="Sin recibo" message="Todavía no hay un recibo generado en esta sesión." />
          <Button title="Volver a pagos" onPress={() => navigate('payments')} />
        </Screen>
        <BottomNav />
      </View>
    );
  }

  const receiptText = [
    `RECIBO DE PAGO - ${businessSettings.businessName}`,
    businessSettings.phone ? `Tel: ${businessSettings.phone}` : '',
    businessSettings.address ? `Dirección: ${businessSettings.address}` : '',
    '',
    `Cliente: ${lastReceipt.clienteNombre}`,
    `Valor pagado: ${formatMoney(lastReceipt.valorPagado)}`,
    `Saldo anterior: ${formatMoney(lastReceipt.saldoAnterior)}`,
    `Nuevo saldo: ${formatMoney(lastReceipt.saldoNuevo)}`,
    `Fecha: ${lastReceipt.fechaPago}`,
    `Método: ${lastReceipt.metodoPago}`,
    `Cobrador: ${lastReceipt.cobradorEmail}`,
    lastReceipt.observacion ? `Observación: ${lastReceipt.observacion}` : '',
    '',
    businessSettings.receiptMessage || 'Gracias por su pago.'
  ]
    .filter(Boolean)
    .join('\n');

  const shareReceipt = async () => {
    await Share.share({
      message: receiptText
    });
  };

  const finish = () => {
    clearReceipt();
    navigate('payments');
  };

  return (
    <View style={styles.root}>
      <TopBar title="Recibo de pago" showBack onBack={() => navigate('payments')} />
      <Screen>
        <Card style={styles.receiptCard}>
          <View style={styles.header}>
            <View style={styles.iconBox}>
              <Text style={styles.icon}>✅</Text>
            </View>

            <Text style={styles.businessName}>{businessSettings.businessName}</Text>
            {businessSettings.phone ? <Text style={styles.businessMeta}>Tel: {businessSettings.phone}</Text> : null}
            {businessSettings.address ? <Text style={styles.businessMeta}>{businessSettings.address}</Text> : null}

            <Text style={styles.title}>Pago registrado</Text>
            <Text style={styles.subtitle}>Comprobante generado correctamente</Text>
          </View>

          <View style={styles.amountBox}>
            <Text style={styles.amountLabel}>Valor pagado</Text>
            <Text style={styles.amount}>{formatMoney(lastReceipt.valorPagado)}</Text>
          </View>

          <View style={styles.divider} />

          <ReceiptRow label="Cliente" value={lastReceipt.clienteNombre} />
          <ReceiptRow label="Fecha" value={lastReceipt.fechaPago} />
          <ReceiptRow label="Método" value={lastReceipt.metodoPago} />
          <ReceiptRow label="Cobrador" value={lastReceipt.cobradorEmail} />

          <View style={styles.divider} />

          <ReceiptRow label="Saldo anterior" value={formatMoney(lastReceipt.saldoAnterior)} />
          <ReceiptRow label="Nuevo saldo" value={formatMoney(lastReceipt.saldoNuevo)} highlight />

          {lastReceipt.observacion ? (
            <>
              <View style={styles.divider} />
              <Text style={styles.noteTitle}>Observación</Text>
              <Text style={styles.note}>{lastReceipt.observacion}</Text>
            </>
          ) : null}

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {businessSettings.receiptMessage || 'Gracias por su pago. Conserve este comprobante.'}
            </Text>
          </View>
        </Card>

        <Button title="Compartir recibo" onPress={shareReceipt} style={styles.button} />
        <Button title="Finalizar" variant="secondary" onPress={finish} style={styles.button} />
        <Button title="Registrar otro pago" variant="secondary" onPress={() => navigate('registerPayment')} style={styles.button} />
      </Screen>
      <BottomNav />
    </View>
  );
}

function ReceiptRow({
  label,
  value,
  highlight = false
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, highlight ? styles.rowValueHighlight : null]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background
  },
  receiptCard: {
    marginBottom: 14
  },
  header: {
    alignItems: 'center',
    marginBottom: 18
  },
  iconBox: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12
  },
  icon: {
    fontSize: 36
  },
  businessName: {
    color: colors.primary,
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center'
  },
  businessMeta: {
    color: colors.muted,
    fontWeight: '700',
    marginTop: 3,
    textAlign: 'center'
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
    marginTop: 16
  },
  subtitle: {
    color: colors.muted,
    fontWeight: '700',
    marginTop: 4
  },
  amountBox: {
    backgroundColor: colors.primarySoft,
    borderRadius: 18,
    padding: 16,
    alignItems: 'center'
  },
  amountLabel: {
    color: colors.primary,
    fontWeight: '900'
  },
  amount: {
    color: colors.primary,
    fontSize: 30,
    fontWeight: '900',
    marginTop: 6
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 14
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 10
  },
  rowLabel: {
    color: colors.muted,
    fontWeight: '800',
    flex: 1
  },
  rowValue: {
    color: colors.text,
    fontWeight: '900',
    flex: 1,
    textAlign: 'right'
  },
  rowValueHighlight: {
    color: colors.danger,
    fontSize: 16
  },
  noteTitle: {
    color: colors.text,
    fontWeight: '900',
    marginBottom: 6
  },
  note: {
    color: colors.muted,
    fontWeight: '700',
    lineHeight: 20
  },
  footer: {
    marginTop: 14,
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 14,
    padding: 12
  },
  footerText: {
    color: colors.muted,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 20
  },
  button: {
    marginBottom: 10
  }
});