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

export function BusinessSettingsScreen() {
  const { businessSettings, updateBusinessSettings, navigate } = useApp();

  const [businessName, setBusinessName] = useState('');
  const [appName, setAppName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [receiptMessage, setReceiptMessage] = useState('');
  const [currency, setCurrency] = useState('COP');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setBusinessName(businessSettings.businessName);
    setAppName(businessSettings.appName);
    setPhone(businessSettings.phone);
    setAddress(businessSettings.address);
    setReceiptMessage(businessSettings.receiptMessage);
    setCurrency(businessSettings.currency);
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

    setLoading(true);

    await updateBusinessSettings({
      businessName: businessName.trim(),
      appName: appName.trim(),
      phone: phone.trim(),
      address: address.trim(),
      receiptMessage: receiptMessage.trim() || 'Gracias por su pago. Conserve este comprobante.',
      currency: currency.trim() || 'COP'
    });

    setLoading(false);
  };

  return (
    <View style={styles.root}>
      <TopBar title="Configuracion" showBack onBack={() => navigate('more')} />
      <Screen>
        <Card style={styles.infoCard}>
          <Text style={styles.infoTitle}>Datos del negocio</Text>
          <Text style={styles.infoText}>
            Estos datos apareceran en recibos y pantallas importantes de la aplicacion.
          </Text>
        </Card>

        <Input label="Nombre del negocio" icon="🏪" value={businessName} onChangeText={setBusinessName} placeholder="Ej: Cobros Keiner" />
        <Input label="Nombre visible de la app" icon="📱" value={appName} onChangeText={setAppName} placeholder="Ej: App Cobros" />
        <Input label="Telefono" icon="☎️" value={phone} onChangeText={setPhone} placeholder="Telefono del negocio" keyboardType="phone-pad" />
        <Input label="Direccion" icon="📍" value={address} onChangeText={setAddress} placeholder="Direccion del negocio" />
        <Input label="Moneda" icon="💵" value={currency} onChangeText={setCurrency} placeholder="COP" autoCapitalize="characters" />
        <Input label="Mensaje para recibos" icon="🧾" value={receiptMessage} onChangeText={setReceiptMessage} placeholder="Gracias por su pago..." />

        <Card style={styles.previewCard}>
          <Text style={styles.previewTitle}>Vista previa del recibo</Text>
          <Text style={styles.businessName}>{businessName || 'Nombre del negocio'}</Text>
          <Text style={styles.previewText}>{phone || 'Telefono no registrado'}</Text>
          <Text style={styles.previewText}>{address || 'Direccion no registrada'}</Text>
          <Text style={styles.previewMessage}>
            {receiptMessage || 'Gracias por su pago. Conserve este comprobante.'}
          </Text>
        </Card>

        <Button title="Guardar configuracion" onPress={handleSave} loading={loading} />
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
    fontSize: 16,
    fontWeight: '900'
  },
  infoText: {
    color: colors.muted,
    marginTop: 6,
    lineHeight: 20,
    fontWeight: '700'
  },
  previewCard: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF'
  },
  previewTitle: {
    color: colors.muted,
    fontWeight: '800',
    marginBottom: 10
  },
  businessName: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: '900'
  },
  previewText: {
    color: colors.muted,
    fontWeight: '700',
    marginTop: 4
  },
  previewMessage: {
    color: colors.text,
    fontWeight: '800',
    marginTop: 14,
    lineHeight: 20
  }
});