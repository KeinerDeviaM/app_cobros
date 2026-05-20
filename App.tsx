import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AppProvider, useApp } from './src/state/AppContext';
import { LoginScreen } from './src/screens/LoginScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { ClientsScreen } from './src/screens/ClientsScreen';
import { ClientDetailScreen } from './src/screens/ClientDetailScreen';
import { ClientHistoryScreen } from './src/screens/ClientHistoryScreen';
import { GlobalSearchScreen } from './src/screens/GlobalSearchScreen';
import { AdvancedAnalyticsScreen } from './src/screens/AdvancedAnalyticsScreen';
import { EditClientScreen } from './src/screens/EditClientScreen';
import { NewClientScreen } from './src/screens/NewClientScreen';
import { CreditsScreen } from './src/screens/CreditsScreen';
import { CreditDetailScreen } from './src/screens/CreditDetailScreen';
import { InstallmentsScreen } from './src/screens/InstallmentsScreen';
import { CollectionsCalendarScreen } from './src/screens/CollectionsCalendarScreen';
import { PromisesScreen } from './src/screens/PromisesScreen';
import { EditCreditScreen } from './src/screens/EditCreditScreen';
import { NewCreditScreen } from './src/screens/NewCreditScreen';
import { PaymentsScreen } from './src/screens/PaymentsScreen';
import { PaymentReceiptScreen } from './src/screens/PaymentReceiptScreen';
import { EditPaymentScreen } from './src/screens/EditPaymentScreen';
import { RegisterPaymentScreen } from './src/screens/RegisterPaymentScreen';
import { DailyCashScreen } from './src/screens/DailyCashScreen';
import { EditExpenseScreen } from './src/screens/EditExpenseScreen';
import { ReportsScreen } from './src/screens/ReportsScreen';
import { UsersScreen } from './src/screens/UsersScreen';
import { RoutesScreen } from './src/screens/RoutesScreen';
import { VisitsScreen } from './src/screens/VisitsScreen';
import { AuditScreen } from './src/screens/AuditScreen';
import { BusinessSettingsScreen } from './src/screens/BusinessSettingsScreen';
import { ExportReportsScreen } from './src/screens/ExportReportsScreen';
import { PreApkChecklistScreen } from './src/screens/PreApkChecklistScreen';
import { MoreScreen } from './src/screens/MoreScreen';
import { HelpScreen } from './src/screens/HelpScreen';
import { TemplatesManualScreen } from './src/screens/TemplatesManualScreen';
import { AuditLogScreen } from './src/screens/AuditLogScreen';
import { SystemChecklistScreen } from './src/screens/SystemChecklistScreen';
import { AdvancedModulesScreen } from './src/screens/AdvancedModulesScreen';
import { OfflineStatusScreen } from './src/screens/OfflineStatusScreen';
import { RemindersScreen } from './src/screens/RemindersScreen';
import { OperationalControlScreen } from './src/screens/OperationalControlScreen';
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
  const { session, currentScreen, authLoading, isAdmin, canManagePayments } = useApp();

  if (authLoading) return <LoadingScreen />;
  if (!session.loggedIn) return <LoginScreen />;

  const adminOnlyScreens = [
    'newClient',
    'editClient',
    'newCredit',
    'editCredit',
    'reports',
    'users',
    'audit',
    'businessSettings',
    'exportReports',
    'preApkChecklist'
  ];

  if (!isAdmin && adminOnlyScreens.includes(currentScreen)) {
    return <DashboardScreen />;
  }

  switch (currentScreen) {
    case 'clients':
      return <ClientsScreen />;
    case 'clientDetail':
      return <ClientDetailScreen />;
    case 'clientHistory':
      return <ClientHistoryScreen />;
    case 'globalSearch':
      return <GlobalSearchScreen />;
    case 'advancedAnalytics':
      return <AdvancedAnalyticsScreen />;
    case 'editClient':
      return <EditClientScreen />;
    case 'newClient':
      return <NewClientScreen />;
    case 'credits':
      return <CreditsScreen />;
    case 'creditDetail':
      return <CreditDetailScreen />;
    case 'installments':
      return <InstallmentsScreen />;
    case 'collectionsCalendar':
      return <CollectionsCalendarScreen />;
    case 'promises':
      return <PromisesScreen />;
    case 'editCredit':
      return <EditCreditScreen />;
    case 'newCredit':
      return <NewCreditScreen />;
    case 'payments':
      return <PaymentsScreen />;
    case 'paymentReceipt':
      return <PaymentReceiptScreen />;
    case 'editPayment':
      return <EditPaymentScreen />;
    case 'registerPayment':
      return <RegisterPaymentScreen />;
    case 'dailyCash':
      return <DailyCashScreen />;
    case 'editExpense':
      return <EditExpenseScreen />;
    case 'reports':
      return <ReportsScreen />;
    case 'users':
      return <UsersScreen />;
    case 'routes':
      return <RoutesScreen />;
    case 'visits':
      return <VisitsScreen />;
    case 'audit':
      return <AuditScreen />;
    case 'businessSettings':
      return <BusinessSettingsScreen />;
    case 'exportReports':
      return <ExportReportsScreen />;
    case 'preApkChecklist':
      return <PreApkChecklistScreen />;
    case 'more':
      return <MoreScreen />;
    case 'help':
      return <HelpScreen />;
    case 'templatesManual':
      return <TemplatesManualScreen />;
    case 'auditLog':
      return <AuditLogScreen />;
    case 'systemChecklist':
      return <SystemChecklistScreen />;
    case 'advancedModules':
      return <AdvancedModulesScreen />;
    case 'offlineStatus':
      return <OfflineStatusScreen />;
    case 'reminders':
      return <RemindersScreen />;
    case 'operationalControl':
      return <OperationalControlScreen />;
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
