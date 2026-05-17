import React, { useMemo, useState } from 'react';
import { Alert, Share, StyleSheet, Text, View } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { BottomNav } from '../components/BottomNav';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { Screen } from '../components/Screen';
import { TopBar } from '../components/TopBar';
import { useApp } from '../state/AppContext';
import { colors } from '../theme/colors';
import { formatMoney } from '../utils/money';

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getReceiptNumber(receiptId: string, createdAt: string) {
  const raw = receiptId || createdAt || String(Date.now());
  return raw.replace(/[^a-zA-Z0-9]/g, '').slice(-8).toUpperCase();
}

function isHexColor(value?: string) {
  return typeof value === 'string' && /^#[0-9A-Fa-f]{6}$/.test(value);
}

export function PaymentReceiptScreen() {
  const { lastReceipt, businessSettings, navigate, clearReceipt } = useApp();
  const [loadingPdf, setLoadingPdf] = useState(false);

  const primaryColor = isHexColor(businessSettings.primaryColor)
    ? businessSettings.primaryColor
    : '#2563EB';

  const secondaryColor = isHexColor(businessSettings.secondaryColor)
    ? businessSettings.secondaryColor
    : '#EFF6FF';

  const receiptNumber = useMemo(() => {
    if (!lastReceipt) return '';
    return getReceiptNumber(lastReceipt.id, lastReceipt.createdAt);
  }, [lastReceipt]);

  if (!lastReceipt) {
    return (
      <View style={styles.root}>
        <TopBar title="Recibo de pago" showBack onBack={() => navigate('payments')} />
        <Screen>
          <EmptyState title="Sin recibo" message="No hay un recibo reciente para mostrar." />
          <Button title="Volver a pagos" onPress={() => navigate('payments')} />
        </Screen>
        <BottomNav />
      </View>
    );
  }

  const businessName = businessSettings.businessName || businessSettings.appName || 'App Cobros';
  const appName = businessSettings.appName || 'App Cobros';
  const receiptMessage = businessSettings.receiptMessage || 'Gracias por su pago. Conserve este comprobante.';
  const receiptLegalText = businessSettings.receiptLegalText || 'Este comprobante es valido como soporte del pago registrado.';
  const receiptFooter = businessSettings.receiptFooter || `Generado por ${appName}`;

  const receiptText = [
    businessName,
    `Recibo No. ${receiptNumber}`,
    '',
    `Cliente: ${lastReceipt.clienteNombre}`,
    `Fecha: ${lastReceipt.fechaPago}`,
    `Metodo: ${lastReceipt.metodoPago}`,
    `Valor pagado: ${formatMoney(lastReceipt.valorPagado)}`,
    `Saldo anterior: ${formatMoney(lastReceipt.saldoAnterior)}`,
    `Nuevo saldo: ${formatMoney(lastReceipt.saldoNuevo)}`,
    `Cobrador: ${lastReceipt.cobradorEmail}`,
    lastReceipt.observacion ? `Observacion: ${lastReceipt.observacion}` : '',
    '',
    receiptMessage,
    receiptLegalText,
    receiptFooter
  ].filter(Boolean).join('\n');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />

        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 28px;
            color: #111827;
          }

          .receipt {
            border: 1px solid #D1D5DB;
            border-radius: 18px;
            overflow: hidden;
          }

          .header {
            text-align: center;
            background: ${primaryColor};
            color: #FFFFFF;
            padding: 24px;
          }

          .business {
            font-size: 26px;
            font-weight: 800;
            margin-bottom: 6px;
          }

          .muted {
            color: #FFFFFF;
            opacity: 0.9;
            font-size: 13px;
            line-height: 19px;
          }

          .receipt-number {
            background: ${secondaryColor};
            color: ${primaryColor};
            padding: 10px 14px;
            border-radius: 12px;
            font-weight: 800;
            display: inline-block;
            margin-top: 14px;
          }

          .content {
            padding: 24px;
          }

          .section-title {
            font-weight: 800;
            font-size: 16px;
            margin-top: 18px;
            margin-bottom: 10px;
          }

          .row {
            display: flex;
            justify-content: space-between;
            border-bottom: 1px solid #F3F4F6;
            padding: 10px 0;
            gap: 16px;
          }

          .label {
            color: #6B7280;
            font-weight: 700;
          }

          .value {
            font-weight: 800;
            text-align: right;
          }

          .total {
            background: ${secondaryColor};
            border-radius: 14px;
            padding: 16px;
            margin-top: 16px;
          }

          .total .label {
            color: ${primaryColor};
          }

          .total .value {
            color: ${primaryColor};
            font-size: 22px;
          }

          .message {
            background: #F9FAFB;
            border-radius: 14px;
            padding: 14px;
            margin-top: 18px;
            color: #374151;
            line-height: 21px;
            text-align: center;
          }

          .legal {
            color: #6B7280;
            font-size: 12px;
            line-height: 18px;
            text-align: center;
            margin-top: 14px;
          }

          .footer {
            text-align: center;
            margin-top: 18px;
            color: ${primaryColor};
            font-size: 12px;
            font-weight: 800;
          }
        </style>
      </head>

      <body>
        <div class="receipt">
          <div class="header">
            <div class="business">${escapeHtml(businessName)}</div>
            <div class="muted">${escapeHtml(businessSettings.phone || 'Telefono no registrado')}</div>
            <div class="muted">${escapeHtml(businessSettings.address || 'Direccion no registrada')}</div>
            <div class="receipt-number">RECIBO No. ${escapeHtml(receiptNumber)}</div>
          </div>

          <div class="content">
            <div class="section-title">Datos del pago</div>

            <div class="row">
              <div class="label">Cliente</div>
              <div class="value">${escapeHtml(lastReceipt.clienteNombre)}</div>
            </div>

            <div class="row">
              <div class="label">Fecha</div>
              <div class="value">${escapeHtml(lastReceipt.fechaPago)}</div>
            </div>

            <div class="row">
              <div class="label">Metodo</div>
              <div class="value">${escapeHtml(lastReceipt.metodoPago)}</div>
            </div>

            <div class="row">
              <div class="label">Cobrador</div>
              <div class="value">${escapeHtml(lastReceipt.cobradorEmail)}</div>
            </div>

            <div class="total">
              <div class="row">
                <div class="label">Valor pagado</div>
                <div class="value">${escapeHtml(formatMoney(lastReceipt.valorPagado))}</div>
              </div>
            </div>

            <div class="section-title">Estado del credito</div>

            <div class="row">
              <div class="label">Saldo anterior</div>
              <div class="value">${escapeHtml(formatMoney(lastReceipt.saldoAnterior))}</div>
            </div>

            <div class="row">
              <div class="label">Nuevo saldo</div>
              <div class="value">${escapeHtml(formatMoney(lastReceipt.saldoNuevo))}</div>
            </div>

            ${
              lastReceipt.observacion
                ? `<div class="message"><strong>Observacion:</strong><br />${escapeHtml(lastReceipt.observacion)}</div>`
                : ''
            }

            <div class="message">
              ${escapeHtml(receiptMessage)}
            </div>

            <div class="legal">
              ${escapeHtml(receiptLegalText)}
            </div>

            <div class="footer">
              ${escapeHtml(receiptFooter)}
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  const shareText = async () => {
    try {
      await Share.share({
        message: receiptText
      });
    } catch (error) {
      console.error('Error compartiendo recibo:', error);
      Alert.alert('Error', 'No se pudo compartir el recibo.');
    }
  };

  const sharePdf = async () => {
    try {
      setLoadingPdf(true);

      const available = await Sharing.isAvailableAsync();

      if (!available) {
        Alert.alert('Compartir no disponible', 'Este dispositivo no permite compartir archivos.');
        setLoadingPdf(false);
        return;
      }

      const file = await Print.printToFileAsync({
        html,
        base64: false
      });

      await Sharing.shareAsync(file.uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Compartir recibo PDF',
        UTI: 'com.adobe.pdf'
      });

      setLoadingPdf(false);
    } catch (error) {
      console.error('Error generando PDF:', error);
      setLoadingPdf(false);
      Alert.alert('Error', 'No se pudo generar el PDF del recibo.');
    }
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
          <View style={[styles.header, { backgroundColor: primaryColor }]}>
            <Text style={styles.businessName}>{businessName}</Text>
            <Text style={styles.businessInfo}>{businessSettings.phone || 'Telefono no registrado'}</Text>
            <Text style={styles.businessInfo}>{businessSettings.address || 'Direccion no registrada'}</Text>

            <View style={[styles.receiptNumberBox, { backgroundColor: secondaryColor }]}>
              <Text style={[styles.receiptNumber, { color: primaryColor }]}>RECIBO No. {receiptNumber}</Text>
            </View>
          </View>

          <View style={styles.body}>
            <View style={styles.row}>
              <Text style={styles.label}>Cliente</Text>
              <Text style={styles.value}>{lastReceipt.clienteNombre}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Fecha</Text>
              <Text style={styles.value}>{lastReceipt.fechaPago}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Metodo</Text>
              <Text style={styles.value}>{lastReceipt.metodoPago}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Cobrador</Text>
              <Text style={styles.value}>{lastReceipt.cobradorEmail}</Text>
            </View>

            <View style={[styles.totalBox, { backgroundColor: secondaryColor }]}>
              <Text style={[styles.totalLabel, { color: primaryColor }]}>Valor pagado</Text>
              <Text style={[styles.totalValue, { color: primaryColor }]}>{formatMoney(lastReceipt.valorPagado)}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Saldo anterior</Text>
              <Text style={styles.value}>{formatMoney(lastReceipt.saldoAnterior)}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Nuevo saldo</Text>
              <Text style={styles.value}>{formatMoney(lastReceipt.saldoNuevo)}</Text>
            </View>

            {lastReceipt.observacion ? (
              <View style={styles.noteBox}>
                <Text style={styles.noteTitle}>Observacion</Text>
                <Text style={styles.noteText}>{lastReceipt.observacion}</Text>
              </View>
            ) : null}

            <View style={[styles.messageBox, { backgroundColor: secondaryColor }]}>
              <Text style={styles.messageText}>{receiptMessage}</Text>
            </View>

            <View style={styles.legalBox}>
              <Text style={styles.legalText}>{receiptLegalText}</Text>
            </View>

            <Text style={[styles.footerText, { color: primaryColor }]}>{receiptFooter}</Text>
          </View>
        </Card>

        <Button title="Compartir texto" variant="secondary" onPress={shareText} style={styles.button} />
        <Button title="Generar y compartir PDF" onPress={sharePdf} loading={loadingPdf} style={styles.button} />
        <Button title="Finalizar" variant="secondary" onPress={finish} style={styles.button} />
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
  receiptCard: {
    marginBottom: 14,
    padding: 0,
    overflow: 'hidden'
  },
  header: {
    alignItems: 'center',
    padding: 18
  },
  body: {
    padding: 16
  },
  businessName: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center'
  },
  businessInfo: {
    color: '#FFFFFF',
    opacity: 0.9,
    fontWeight: '700',
    marginTop: 4,
    textAlign: 'center'
  },
  receiptNumberBox: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginTop: 12
  },
  receiptNumber: {
    fontWeight: '900'
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 11
  },
  label: {
    color: colors.muted,
    fontWeight: '800',
    flex: 1
  },
  value: {
    color: colors.text,
    fontWeight: '900',
    flex: 1,
    textAlign: 'right'
  },
  totalBox: {
    borderRadius: 16,
    padding: 16,
    marginVertical: 14
  },
  totalLabel: {
    fontWeight: '900',
    textAlign: 'center'
  },
  totalValue: {
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 4
  },
  noteBox: {
    backgroundColor: colors.background,
    borderRadius: 14,
    padding: 12,
    marginTop: 14
  },
  noteTitle: {
    color: colors.text,
    fontWeight: '900'
  },
  noteText: {
    color: colors.muted,
    fontWeight: '700',
    marginTop: 5,
    lineHeight: 20
  },
  messageBox: {
    borderRadius: 14,
    padding: 12,
    marginTop: 14
  },
  messageText: {
    color: colors.text,
    fontWeight: '700',
    lineHeight: 20,
    textAlign: 'center'
  },
  legalBox: {
    backgroundColor: colors.background,
    borderRadius: 14,
    padding: 12,
    marginTop: 12
  },
  legalText: {
    color: colors.muted,
    fontWeight: '700',
    lineHeight: 18,
    textAlign: 'center',
    fontSize: 12
  },
  footerText: {
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 12,
    fontSize: 12
  },
  button: {
    marginBottom: 10
  }
});