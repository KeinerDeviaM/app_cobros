import React, { useMemo } from 'react';
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
import { todayKey } from '../utils/date';
import { formatMoney } from '../utils/money';
import { AppReminder, buildAppReminders } from '../utils/reminders';

function getPriorityBadge(priority: string) {
  if (priority === 'alta') return 'danger';
  if (priority === 'media') return 'warning';
  return 'success';
}

function getTypeIcon(type: AppReminder['type']) {
  if (type === 'cuota-vencida') return '💳';
  if (type === 'promesa-hoy') return '🤝';
  if (type === 'promesa-vencida') return '⚠️';
  if (type === 'visita-pendiente') return '🛵';
  return '💵';
}

export function RemindersScreen() {
  const {
    clients,
    credits,
    payments,
    visits,
    cashClosings,
    session,
    isAdmin,
    navigate
  } = useApp();

  const today = todayKey();

  const userCashClosingToday = useMemo(() => {
    return cashClosings.some((closing) => {
      if (closing.fecha !== today) return false;
      if (isAdmin) return true;
      return closing.usuarioUid === session.uid;
    });
  }, [cashClosings, isAdmin, session.uid, today]);

  const reminders = useMemo(() => {
    const filteredCredits = isAdmin
      ? credits
      : credits.filter((credit) => credit.assignedToUid === session.uid);

    const filteredVisits = isAdmin
      ? visits
      : visits.filter((visit) => visit.assignedToUid === session.uid);

    return buildAppReminders({
      clients,
      credits: filteredCredits,
      payments,
      visits: filteredVisits,
      hasCashClosingToday: userCashClosingToday,
      today
    });
  }, [clients, credits, isAdmin, payments, session.uid, today, userCashClosingToday, visits]);

  const highPriority = reminders.filter((item) => item.priority === 'alta').length;
  const mediumPriority = reminders.filter((item) => item.priority === 'media').length;
  const totalAmount = reminders.reduce((total, item) => total + (item.amount || 0), 0);

  return (
    <View style={styles.root}>
      <TopBar title="Recordatorios" showBack onBack={() => navigate('more')} />

      <Screen>
        <Card style={styles.heroCard}>
          <Text style={styles.heroTitle}>Centro de recordatorios</Text>
          <Text style={styles.heroText}>
            Revisa cobros vencidos, promesas para hoy, visitas pendientes y cierres de caja.
          </Text>
        </Card>

        <View style={styles.grid}>
          <Metric title="Alertas" value={String(reminders.length)} />
          <Metric title="Alta prioridad" value={String(highPriority)} danger={highPriority > 0} />
        </View>

        <View style={styles.grid}>
          <Metric title="Prioridad media" value={String(mediumPriority)} />
          <Metric title="Valor pendiente" value={formatMoney(totalAmount)} danger={totalAmount > 0} />
        </View>

        {reminders.length === 0 ? (
          <EmptyState title="Sin recordatorios" message="No hay alertas pendientes por ahora." />
        ) : (
          reminders.map((reminder) => (
            <ReminderCard key={reminder.id} reminder={reminder} navigate={navigate} />
          ))
        )}
      </Screen>

      <BottomNav />
    </View>
  );
}

function Metric({
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

function ReminderCard({
  reminder,
  navigate
}: {
  reminder: AppReminder;
  navigate: (screen: AppReminder['screen']) => void;
}) {
  return (
    <Card style={styles.reminderCard}>
      <View style={styles.header}>
        <View style={styles.iconBox}>
          <Text style={styles.icon}>{getTypeIcon(reminder.type)}</Text>
        </View>

        <View style={styles.info}>
          <Text style={styles.title}>{reminder.title}</Text>
          <Text style={styles.description}>{reminder.description}</Text>
          {reminder.date ? <Text style={styles.date}>Fecha: {reminder.date}</Text> : null}
        </View>

        <StatusBadge type={getPriorityBadge(reminder.priority)} label={reminder.priority} />
      </View>

      {typeof reminder.amount === 'number' && reminder.amount > 0 ? (
        <Text style={styles.amount}>{formatMoney(reminder.amount)}</Text>
      ) : null}

      <Button
        title="Ir a gestionar"
        variant="secondary"
        onPress={() => navigate(reminder.screen)}
        style={styles.button}
      />
    </Card>
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
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '900'
  },
  heroText: {
    color: '#FFFFFF',
    opacity: 0.9,
    marginTop: 6,
    lineHeight: 20,
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
    fontSize: 20,
    fontWeight: '900',
    marginTop: 6
  },
  danger: {
    color: colors.danger
  },
  reminderCard: {
    marginBottom: 12
  },
  header: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start'
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft
  },
  icon: {
    fontSize: 22
  },
  info: {
    flex: 1
  },
  title: {
    color: colors.text,
    fontWeight: '900',
    fontSize: 16
  },
  description: {
    color: colors.muted,
    fontWeight: '700',
    lineHeight: 20,
    marginTop: 5
  },
  date: {
    color: colors.primary,
    fontWeight: '800',
    marginTop: 6
  },
  amount: {
    color: colors.danger,
    fontSize: 18,
    fontWeight: '900',
    marginTop: 12
  },
  button: {
    marginTop: 12
  }
});