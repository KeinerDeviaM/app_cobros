import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { BottomNav } from '../components/BottomNav';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Screen } from '../components/Screen';
import { TopBar } from '../components/TopBar';
import { useApp } from '../state/AppContext';
import { colors } from '../theme/colors';
import { formatMoney } from '../utils/money';

function isHexColor(value: string) {
  return /^#[0-9A-Fa-f]{6}$/.test(value.trim());
}

export function BusinessSettingsScreen() {
  const { businessSettings, updateBusinessSettings, navigate } = useApp();

  const [businessName, setBusinessName] = useState('');
  const [appName, setAppName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [receiptMessage, setReceiptMessage] = useState('');
  const [receiptLegalText, setReceiptLegalText] = useState('');
  const [receiptFooter, setReceiptFooter] = useState('');
  const [currency, setCurrency] = useState('COP');
  const [primaryColor, setPrimaryColor] = useState('#2563EB');
  const [secondaryColor, setSecondaryColor] = useState('#EFF6FF');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setBusinessName(businessSettings.businessName);
    setAppName(businessSettings.appName);
    setPhone(businessSettings.phone);
    setAddress(businessSettings.address);
    setReceiptMessage(businessSettings.receiptMessage);
    setReceiptLegalText(businessSettings.receiptLegalText);
    setReceiptFooter(businessSettings.receiptFooter);
    setCurrency(businessSettings.currency);
    setPrimaryColor(businessSettings.primaryColor || '#2563EB');
    setSecondaryColor(businessSettings.secondaryColor || '#EFF6FF');
  }, [businessSettings]);

  const handleSave = async () => {
    if (!businessName.trim()) {
      Alert.alert('Nombre requerido', 'Ingresa el nombre del negocio.');
      return;
    }

    if (!appName.trim()) {
      Alert.alert('Nombre de app requerido', 'Ingresa el nombre visible de la app.');
      return;
    }

    if (!isHexColor(primaryColor)) {
      Alert.alert('Color inválido', 'El color principal debe tener formato hexadecimal. Ejemplo: #2563EB');
      return;
    }

    if (!isHexColor(secondaryColor)) {
      Alert.alert('Color inválido', 'El color secundario debe tener formato hexadecimal. Ejemplo: #EFF6FF');
      return;
    }

    setLoading(true);

    await updateBusinessSettings({
      businessName: businessName.trim(),
      appName: appName.trim(),
      phone: phone.trim(),
      address: address.trim(),
      receiptMessage: receiptMessage.trim() || 'Gracias por su pago. Conserve este comprobante.',
      receiptLegalText: receiptLegalText.trim() || 'Este comprobante es válido como soporte del pago registrado.',
      receiptFooter: receiptFooter.trim() || 'Generado por App Cobros',
      currency: currency.trim() || 'COP',
      primaryColor: primaryColor.trim(),
      secondaryColor: secondaryColor.trim()
    });

    setLoading(false);
  };

  return (
    <View style={styles.root}>
      <TopBar title="Configuración visual" showBack onBack={() => navigate('more')} />

      <Screen>
        <Card style={styles.infoCard}>
          <Text style={styles.infoTitle}>Personalización de la app</Text>
          <Text style={styles.infoText}>
            Configura los datos visibles del negocio, colores y textos que aparecerán en los recibos.
          </Text>
        </Card>

        <Text style={styles.sectionTitle}>Datos del negocio</Text>

        <Input label="Nombre del negocio" icon="🏪" value={businessName} onChangeText={setBusinessName} placeholder="Ej: Cobros Keiner" />
        <Input label="Nombre visible de la app" icon="📱" value={appName} onChangeText={setAppName} placeholder="Ej: App Cobros" />
        <Input label="Teléfono" icon="☎️" value={phone} onChangeText={setPhone} placeholder="Teléfono del negocio" keyboardType="phone-pad" />
        <Input label="Dirección" icon="📍" value={address} onChangeText={setAddress} placeholder="Dirección del negocio" />
        <Input label="Moneda" icon="💵" value={currency} onChangeText={setCurrency} placeholder="COP" autoCapitalize="characters" />

        <Text style={styles.sectionTitle}>Colores</Text>

        <Input label="Color principal" icon="🎨" value={primaryColor} onChangeText={setPrimaryColor} placeholder="#2563EB" autoCapitalize="characters" />
        <Input label="Color secundario" icon="🎨" value={secondaryColor} onChangeText={setSecondaryColor} placeholder="#EFF6FF" autoCapitalize="characters" />

        <Card style={styles.colorPreviewCard}>
          <Text style={styles.previewTitle}>Vista previa de colores</Text>

          <View style={styles.colorRow}>
            <View style={[styles.colorBox, { backgroundColor: isHexColor(primaryColor) ? primaryColor : colors.primary }]} />
            <View style={styles.colorTextBox}>
              <Text style={styles.colorName}>Principal</Text>
              <Text style={styles.colorValue}>{primaryColor}</Text>
            </View>
          </View>

          <View style={styles.colorRow}>
            <View style={[styles.colorBox, { backgroundColor: isHexColor(secondaryColor) ? secondaryColor : colors.primarySoft }]} />
            <View style={styles.colorTextBox}>
              <Text style={styles.colorName}>Secundario</Text>
              <Text style={styles.colorValue}>{secondaryColor}</Text>
            </View>
          </View>

          <View style={[styles.sampleButton, { backgroundColor: isHexColor(primaryColor) ? primaryColor : colors.primary }]}>
            <Text style={styles.sampleButtonText}>Botón de ejemplo</Text>
          </View>
        </Card>

        <Text style={styles.sectionTitle}>Recibo de pago</Text>

        <Input
          label="Mensaje del recibo"
          icon="🧾"
          value={receiptMessage}
          onChangeText={setReceiptMessage}
          placeholder="Gracias por su pago..."
        />

        <Input
          label="Texto legal"
          icon="📄"
          value={receiptLegalText}
          onChangeText={setReceiptLegalText}
          placeholder="Este comprobante es válido..."
        />

        <Input
          label="Pie de página"
          icon="✍️"
          value={receiptFooter}
          onChangeText={setReceiptFooter}
          placeholder="Generado por App Cobros"
        />

        <Card style={styles.receiptPreviewCard}>
          <View style={[styles.receiptHeader, { backgroundColor: isHexColor(primaryColor) ? primaryColor : colors.primary }]}>
            <Text style={styles.receiptBusiness}>{businessName || 'Nombre del negocio'}</Text>
            <Text style={styles.receiptInfo}>{phone || 'Teléfono no registrado'}</Text>
            <Text style={styles.receiptInfo}>{address || 'Dirección no registrada'}</Text>
          </View>

          <View style={styles.receiptBody}>
            <Text style={styles.receiptTitle}>RECIBO No. EJEMPLO</Text>

            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Cliente</Text>
              <Text style={styles.receiptValue}>Cliente de prueba</Text>
            </View>

            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Valor pagado</Text>
              <Text style={styles.receiptAmount}>{formatMoney(50000)}</Text>
            </View>

            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Nuevo saldo</Text>
              <Text style={styles.receiptValue}>{formatMoney(150000)}</Text>
            </View>

            <View style={[styles.receiptMessageBox, { backgroundColor: isHexColor(secondaryColor) ? secondaryColor : colors.primarySoft }]}>
              <Text style={styles.receiptMessageText}>
                {receiptMessage || 'Gracias por su pago. Conserve este comprobante.'}
              </Text>
            </View>

            <Text style={styles.legalText}>
              {receiptLegalText || 'Este comprobante es válido como soporte del pago registrado.'}
            </Text>

            <Text style={styles.footerText}>
              {receiptFooter || 'Generado por App Cobros'}
            </Text>
          </View>
        </Card>

        <Button title="Guardar configuración" onPress={handleSave} loading={loading} />
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
    marginBottom: 16
  },
  infoTitle: {
    color: colors.primary,
    fontSize: 17,
    fontWeight: '900'
  },
  infoText: {
    color: colors.muted,
    marginTop: 6,
    lineHeight: 20,
    fontWeight: '700'
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
    marginTop: 10,
    marginBottom: 12
  },
  colorPreviewCard: {
    marginBottom: 16
  },
  previewTitle: {
    color: colors.text,
    fontWeight: '900',
    fontSize: 16,
    marginBottom: 12
  },
  colorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12
  },
  colorBox: {
    width: 46,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border
  },
  colorTextBox: {
    flex: 1
  },
  colorName: {
    color: colors.text,
    fontWeight: '900'
  },
  colorValue: {
    color: colors.muted,
    fontWeight: '700',
    marginTop: 3
  },
  sampleButton: {
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    marginTop: 4
  },
  sampleButtonText: {
    color: '#FFFFFF',
    fontWeight: '900'
  },
  receiptPreviewCard: {
    padding: 0,
    overflow: 'hidden',
    marginBottom: 16
  },
  receiptHeader: {
    padding: 18,
    alignItems: 'center'
  },
  receiptBusiness: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center'
  },
  receiptInfo: {
    color: '#FFFFFF',
    opacity: 0.9,
    fontWeight: '700',
    marginTop: 4,
    textAlign: 'center'
  },
  receiptBody: {
    padding: 16
  },
  receiptTitle: {
    color: colors.primary,
    textAlign: 'center',
    fontWeight: '900',
    marginBottom: 10
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 10
  },
  receiptLabel: {
    color: colors.muted,
    fontWeight: '800',
    flex: 1
  },
  receiptValue: {
    color: colors.text,
    fontWeight: '900',
    flex: 1,
    textAlign: 'right'
  },
  receiptAmount: {
    color: colors.primary,
    fontWeight: '900',
    flex: 1,
    textAlign: 'right'
  },
  receiptMessageBox: {
    padding: 12,
    borderRadius: 14,
    marginTop: 14
  },
  receiptMessageText: {
    color: colors.text,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 20
  },
  legalText: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 14,
    fontWeight: '700'
  },
  footerText: {
    color: colors.primary,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 10,
    fontWeight: '900'
  }
});