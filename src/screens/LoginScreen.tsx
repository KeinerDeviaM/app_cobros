import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { colors } from '../theme/colors';
import { useApp } from '../state/AppContext';

export function LoginScreen() {
  const { login } = useApp();
  const [email, setEmail] = useState('admin@cobroapp.com');
  const [password, setPassword] = useState('123456');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Datos incompletos', 'Ingresa correo y contraseña para continuar.');
      return;
    }

    setLoading(true);
    await login(email.trim(), password.trim());
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.root}>
      <View style={styles.logoBox}>
        <Text style={styles.logoIcon}>💼</Text>
      </View>

      <Text style={styles.appName}>CobroApp</Text>
      <Text style={styles.tagline}>Controla, cobra, crece.</Text>

      <View style={styles.form}>
        <Text style={styles.title}>Iniciar sesión</Text>

        <Input
          label="Correo electrónico"
          icon="✉️"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          placeholder="correo@empresa.com"
        />

        <Input
          label="Contraseña"
          icon="🔒"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          placeholder="Tu contraseña"
        />

        <Button title="Entrar" onPress={handleLogin} loading={loading} />
      </View>

      <Text style={styles.protected}>🛡️ Tus datos están protegidos</Text>
      <Text style={styles.demo}>Login real conectado con Firebase Authentication.</Text>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    padding: 24
  },
  logoBox: {
    width: 86,
    height: 86,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 26,
    marginBottom: 14
  },
  logoIcon: {
    fontSize: 40
  },
  appName: {
    textAlign: 'center',
    fontSize: 34,
    fontWeight: '900',
    color: colors.primary
  },
  tagline: {
    textAlign: 'center',
    color: colors.muted,
    fontWeight: '700',
    marginTop: 4,
    marginBottom: 36
  },
  form: {
    gap: 2
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 12
  },
  protected: {
    marginTop: 34,
    color: colors.muted,
    textAlign: 'center',
    fontWeight: '700'
  },
  demo: {
    marginTop: 8,
    color: colors.primaryLight,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700'
  }
});