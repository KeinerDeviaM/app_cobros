import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { useApp } from '../state/AppContext';
import { colors } from '../theme/colors';

export function LoginScreen() {
  const { login, businessSettings } = useApp();

  const [email, setEmail] = useState('admin@cobroapp.com');
  const [password, setPassword] = useState('123456');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Datos incompletos', 'Ingresa correo y contraseña.');
      return;
    }

    setLoading(true);
    await login(email.trim(), password.trim());
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.hero}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>$</Text>
        </View>

        <Text style={styles.appName}>{businessSettings?.appName || 'CobroApp'}</Text>
        <Text style={styles.businessName}>{businessSettings?.businessName || 'Sistema de cobranza'}</Text>
        <Text style={styles.subtitle}>Gestión de clientes, créditos, pagos, rutas y caja diaria.</Text>
      </View>

      <Card style={styles.card}>
        <Text style={styles.title}>Iniciar sesión</Text>
        <Text style={styles.description}>Ingresa con tu usuario administrador o cobrador.</Text>

        <Input
          label="Correo"
          icon="📧"
          value={email}
          onChangeText={setEmail}
          placeholder="correo@ejemplo.com"
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Input
          label="Contraseña"
          icon="🔒"
          value={password}
          onChangeText={setPassword}
          placeholder="Contraseña"
          secureTextEntry
        />

        <Button title="Entrar" onPress={handleLogin} loading={loading} />

        <View style={styles.helpBox}>
          <Text style={styles.helpTitle}>Usuarios de prueba</Text>
          <Text style={styles.helpText}>Admin: admin@cobroapp.com</Text>
          <Text style={styles.helpText}>Cobrador: cobrador@cobroapp.com</Text>
        </View>
      </Card>

      <Text style={styles.footer}>APK privada Android · Firebase</Text>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    padding: 20
  },
  hero: {
    alignItems: 'center',
    marginBottom: 24
  },
  logo: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14
  },
  logoText: {
    color: colors.primary,
    fontSize: 42,
    fontWeight: '900'
  },
  appName: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '900',
    textAlign: 'center'
  },
  businessName: {
    color: '#FFFFFF',
    opacity: 0.95,
    fontSize: 17,
    fontWeight: '800',
    marginTop: 4,
    textAlign: 'center'
  },
  subtitle: {
    color: '#FFFFFF',
    opacity: 0.85,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
    fontWeight: '600'
  },
  card: {
    padding: 18
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900'
  },
  description: {
    color: colors.muted,
    marginTop: 5,
    marginBottom: 16,
    fontWeight: '700',
    lineHeight: 20
  },
  helpBox: {
    backgroundColor: colors.background,
    borderRadius: 14,
    padding: 12,
    marginTop: 16
  },
  helpTitle: {
    color: colors.text,
    fontWeight: '900',
    marginBottom: 5
  },
  helpText: {
    color: colors.muted,
    fontWeight: '700',
    marginTop: 2
  },
  footer: {
    color: '#FFFFFF',
    opacity: 0.8,
    textAlign: 'center',
    marginTop: 18,
    fontWeight: '700'
  }
});
