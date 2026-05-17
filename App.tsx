import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AppProvider, useApp } from './src/state/AppContext';
import { LoginScreen } from './src/screens/LoginScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { ClientsScreen } from './src/screens/ClientsScreen';
import { ClientDetailScreen } from './src/screens/ClientDetailScreen';
import { EditClientScreen } from './src/screens/EditClientScreen';
import { NewClientScreen } from './src/screens/NewClientScreen';
import { CreditsScreen } from './src/screens/CreditsScreen';
import { NewCreditScreen } from './src/screens/NewCreditScreen';
import { PaymentsScreen } from './src/screens/PaymentsScreen';
import { RegisterPaymentScreen } from './src/screens/RegisterPaymentScreen';
import { DailyCashScreen } from './src/screens/DailyCashScreen';
import { ReportsScreen } from './src/screens/ReportsScreen';
import { UsersScreen } from './src/screens/UsersScreen';
import { RoutesScreen } from './src/screens/RoutesScreen';
import { VisitsScreen } from './src/screens/VisitsScreen';
import { MoreScreen } from './src/screens/MoreScreen';
import { colors } from './src/theme/colors';

function LoadingScreen() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.loadingText}>Cargando CobroApp...</Text>
    </View>
  );
}

function Root() {
  const { session, currentScreen, authLoading, isAdmin } = useApp();

  if (authLoading) return <LoadingScreen />;
  if (!session.loggedIn) return <LoginScreen />;

  if (!isAdmin && ['newClient', 'editClient', 'newCredit', 'reports', 'users'].includes(currentScreen)) {
    return <DashboardScreen />;
  }

  switch (currentScreen) {
    case 'clients':
      return <ClientsScreen />;
    case 'clientDetail':
      return <ClientDetailScreen />;
    case 'editClient':
      return <EditClientScreen />;
    case 'newClient':
      return <NewClientScreen />;
    case 'credits':
      return <CreditsScreen />;
    case 'newCredit':
      return <NewCreditScreen />;
    case 'payments':
      return <PaymentsScreen />;
    case 'registerPayment':
      return <RegisterPaymentScreen />;
    case 'dailyCash':
      return <DailyCashScreen />;
    case 'reports':
      return <ReportsScreen />;
    case 'users':
      return <UsersScreen />;
    case 'routes':
      return <RoutesScreen />;
    case 'visits':
      return <VisitsScreen />;
    case 'more':
      return <MoreScreen />;
    case 'dashboard':
    default:
      return <DashboardScreen />;
  }
}

export default function App() {
  return (
    <AppProvider>
      <View style={styles.app}>
        <StatusBar style="light" backgroundColor={colors.primary} />
        <Root />
      </View>
    </AppProvider>
  );
}

const styles = StyleSheet.create({
  app: {
    flex: 1,
    backgroundColor: colors.background
  },
  loading: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center'
  },
  loadingText: {
    color: colors.muted,
    fontWeight: '800',
    marginTop: 14
  }
});