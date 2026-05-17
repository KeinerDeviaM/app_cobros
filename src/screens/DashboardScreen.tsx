import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BottomNav } from '../components/BottomNav';
import { Card } from '../components/Card';
import { Screen } from '../components/Screen';
import { StatusBadge } from '../components/StatusBadge';
import { TopBar } from '../components/TopBar';
import { useApp } from '../state/AppContext';
import { colors } from '../theme/colors';
import { todayKey } from '../utils/date';
import { formatMoney } from '../utils/money';

export function DashboardScreen() {
  const {
    stats,
    session,
    isAdmin,
    navigate,
    clients,
    credits,
    payments,
    expenses,
    visits,
    cashClosings,
    businessSettings
  } = useApp();

  const today = todayKey();

  const activePayments = useMemo(() => {
    return payments.filter((payment) => payment.estado !== 'anulado');
  }, [payments]);

  const todayPayments = useMemo(() => {
    return activePayments.filter((payment) => {
      if (payment.fechaPago !== today) return false;
      if (isAdmin) return true;
      return payment.usuarioEmail === session.email || payment.assignedToUid === session.uid;
    });
  }, [activePayments, isAdmin, session.email, session.uid, today]);

  const todayExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      if (expense.estado === 'anulado') return false;
      if (expense.fecha !== today) return false;
      if (isAdmin) return true;
      return expense.createdBy === session.email;
    });
  }, [expenses, isAdmin, session.email, today]);

  const todayVisits = useMemo(() => {
    return visits.filter((visit) => {
      if (visit.fecha !== today) return false;
      if (isAdmin) return true;
      return visit.assignedToUid === session.uid;
    });
  }, [isAdmin, session.uid, today, visits]);

  const todayClosings = useMemo(() => {
    return cashClosings.filter((closing) => {
      if (closing.fecha !== today) return false;
      if (isAdmin) return true;
      return closing.usuarioUid === session.uid;
    });
  }, [cashClosings, isAdmin, session.uid, today]);

  const collectedToday = todayPayments.reduce((total, payment) => total + payment.valorPagado, 0);
  const expensesToday = todayExpenses.reduce((total, expense) => total + expense.valor, 0);
  const expectedCash = collectedToday - expensesToday;

  const pendingVisits = todayVisits.filter((visit) => visit.estado === 'pendiente').length;
  const managedVisits = todayVisits.filter((visit) => visit.estado !== 'pendiente').length;
  const paidVisits = todayVisits.filter((visit) => visit.estado === 'pago').length;
  const promiseVisits = todayVisits.filter((visit) => visit.estado === 'promesa').length;

  const visibleClients = clients.length;
  const visibleCredits = credits.length;
  const overdueClients = clients.filter((client) => client.estado === 'en-mora').length;

  return (
    <View style={styles.root}>
      <TopBar title={businessSettings?.appName || 'CobroApp'} rightText={isAdmin ? 'Admin' : 'Cobrador'} />

      <Screen>
        <Card style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View>
              <Text style={styles.greeting}>Hola, {isAdmin ? 'Administrador' : 'Cobrador'}</Text>
              <Text style={styles.email}>{session.email}</Text>
            </View>

            <StatusBadge type={isAdmin ? 'success' : 'warning'} label={isAdmin ? 'Admin' : 'Cobrador'} />
          </View>

          <Text style={styles.business}>{businessSettings?.businessName || 'Sistema de cobranza'}</Text>
          <Text style={styles.dateText}>Resumen de hoy ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· {today}</Text>
        </Card>

        <View style={styles.grid}>
          <MetricCard title="Cobrado hoy" value={formatMoney(collectedToday)} />
          <MetricCard title="Caja esperada" value={formatMoney(expectedCash)} danger={expectedCash < 0} />
        </View>

        <View style={styles.grid}>
          <MetricCard title="Gastos hoy" value={formatMoney(expensesToday)} danger />
          <MetricCard title="Saldo pendiente" value={formatMoney(stats.pendingTotal)} danger />
        </View>

        <View style={styles.grid}>
          <MetricCard title="Clientes" value={String(visibleClients)} />
          <MetricCard title="En mora" value={String(overdueClients)} danger />
        </View>

        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Accesos rÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡pidos</Text>

          <View style={styles.quickGrid}>
            <QuickAction icon="ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°" label="Registrar pago" onPress={() => navigate('registerPayment')} />
            <QuickAction icon="ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¹Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¥" label="Clientes" onPress={() => navigate('clients')} />
            <QuickAction icon="ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â§ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¾" label="Caja diaria" onPress={() => navigate('dailyCash')} />
            <QuickAction icon="ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂºÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Âµ" label="Visitas" onPress={() => navigate('visits')} />
            <QuickAction icon="ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂºÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â£ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â" label="Rutas" onPress={() => navigate('routes')} />
            <QuickAction icon="ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³" label="CrÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©ditos" onPress={() => navigate('credits')} />

            {isAdmin ? (
              <>
                <QuickAction icon="ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â " label="Reportes" onPress={() => navigate('reports')} />
                <QuickAction icon="ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¾ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â" label="MÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡s" onPress={() => navigate('more')} />
              </>
            ) : (
              <QuickAction icon="ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¾ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â" label="MÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡s" onPress={() => navigate('more')} />
            )}
          </View>
        </Card>

        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Visitas de hoy</Text>
            <Pressable onPress={() => navigate('visits')}>
              <Text style={styles.link}>Ver</Text>
            </Pressable>
          </View>

          <View style={styles.visitGrid}>
            <SmallStat label="Total" value={String(todayVisits.length)} />
            <SmallStat label="Pendientes" value={String(pendingVisits)} danger />
            <SmallStat label="Gestionadas" value={String(managedVisits)} />
            <SmallStat label="Pagaron" value={String(paidVisits)} />
            <SmallStat label="Promesas" value={String(promiseVisits)} />
          </View>
        </Card>

        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Estado operativo</Text>
            <Pressable onPress={() => navigate('dailyCash')}>
              <Text style={styles.link}>Caja</Text>
            </Pressable>
          </View>

          <InfoRow label="CrÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©ditos visibles" value={String(visibleCredits)} />
          <InfoRow label="Pagos activos hoy" value={String(todayPayments.length)} />
          <InfoRow label="Gastos hoy" value={String(todayExpenses.length)} />
          <InfoRow label="Cierres de caja hoy" value={String(todayClosings.length)} />

          {todayClosings.length > 0 ? (
            <Text style={styles.okText}>Ya existe al menos un cierre de caja para hoy.</Text>
          ) : (
            <Text style={styles.warningText}>TodavÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­a no hay cierre de caja registrado para hoy.</Text>
          )}
        </Card>

        {isAdmin ? (
          <Card style={styles.adminCard}>
            <Text style={styles.sectionTitle}>Panel administrador</Text>
            <Text style={styles.adminText}>
              Puedes gestionar usuarios, reportes, auditorÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­a, configuraciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n del negocio y exportaciones desde MÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡s opciones.
            </Text>
          </Card>
        ) : (
          <Card style={styles.adminCard}>
            <Text style={styles.sectionTitle}>Panel cobrador</Text>
            <Text style={styles.adminText}>
              Solo ves clientes, crÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©ditos, pagos, rutas y visitas asignadas a tu usuario.
            </Text>
          </Card>
        )}
      </Screen>

      <BottomNav />
    </View>
  );
}

function MetricCard({
  title,
  value,
  danger = false
}: {
  title: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <Card style={styles.metricCard}>
      <Text style={styles.metricTitle}>{title}</Text>
      <Text style={[styles.metricValue, danger ? styles.danger : null]}>{value}</Text>
    </Card>
  );
}

function QuickAction({
  icon,
  label,
  onPress
}: {
  icon: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.quickAction} onPress={onPress}>
      <Text style={styles.quickIcon}>{icon}</Text>
      <Text style={styles.quickLabel}>{label}</Text>
    </Pressable>
  );
}

function SmallStat({
  label,
  value,
  danger = false
}: {
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <View style={styles.smallStat}>
      <Text style={[styles.smallValue, danger ? styles.danger : null]}>{value}</Text>
      <Text style={styles.smallLabel}>{label}</Text>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background
  },
  heroCard: {
    backgroundColor: colors.primary,
    marginBottom: 12
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'flex-start'
  },
  greeting: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900'
  },
  email: {
    color: '#FFFFFF',
    opacity: 0.85,
    marginTop: 4,
    fontWeight: '700'
  },
  business: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
    marginTop: 16
  },
  dateText: {
    color: '#FFFFFF',
    opacity: 0.85,
    marginTop: 5,
    fontWeight: '700'
  },
  grid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10
  },
  metricCard: {
    flex: 1
  },
  metricTitle: {
    color: colors.muted,
    fontWeight: '800',
    fontSize: 12
  },
  metricValue: {
    color: colors.primary,
    fontWeight: '900',
    fontSize: 18,
    marginTop: 6
  },
  danger: {
    color: colors.danger
  },
  sectionCard: {
    marginBottom: 12
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    alignItems: 'center'
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 10
  },
  link: {
    color: colors.primary,
    fontWeight: '900'
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  quickAction: {
    width: '47%',
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center'
  },
  quickIcon: {
    fontSize: 28
  },
  quickLabel: {
    color: colors.text,
    fontWeight: '900',
    marginTop: 8,
    textAlign: 'center'
  },
  visitGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  smallStat: {
    width: '30%',
    backgroundColor: colors.background,
    borderRadius: 14,
    padding: 10
  },
  smallValue: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '900'
  },
  smallLabel: {
    color: colors.muted,
    fontWeight: '800',
    fontSize: 11,
    marginTop: 4
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 8
  },
  infoLabel: {
    color: colors.muted,
    fontWeight: '700',
    flex: 1
  },
  infoValue: {
    color: colors.primary,
    fontWeight: '900'
  },
  okText: {
    color: colors.success,
    fontWeight: '900',
    marginTop: 12,
    lineHeight: 20
  },
  warningText: {
    color: colors.danger,
    fontWeight: '900',
    marginTop: 12,
    lineHeight: 20
  },
  adminCard: {
    backgroundColor: colors.primarySoft,
    marginBottom: 12
  },
  adminText: {
    color: colors.muted,
    fontWeight: '700',
    lineHeight: 20
  }
});
