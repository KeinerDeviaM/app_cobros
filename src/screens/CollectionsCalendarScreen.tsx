import React, { useMemo, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { BottomNav } from '../components/BottomNav';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { Screen } from '../components/Screen';
import { StatusBadge } from '../components/StatusBadge';
import { TopBar } from '../components/TopBar';
import { useApp } from '../state/AppContext';
import { colors } from '../theme/colors';
import { Client, Credit, Visit } from '../types';
import { todayKey } from '../utils/date';
import { buildInstallments, Installment } from '../utils/installments';
import { formatMoney } from '../utils/money';

type CalendarTab = 'hoy' | 'vencidos' | 'semana' | 'promesas';

type CollectionItem = {
  id: string;
  credit: Credit;
  client?: Client;
  installment: Installment;
};

function toDate(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function addDays(dateKey: string, days: number) {
  const date = toDate(dateKey);
  date.setDate(date.getDate() + days);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function isBetween(dateKey: string, startKey: string, endKey: string) {
  return dateKey >= startKey && dateKey <= endKey;
}

function normalizePhone(phone: string) {
  return phone.replace(/\s/g, '').replace(/\-/g, '');
}

export function CollectionsCalendarScreen() {
  const {
    credits,
    payments,
    clients,
    visits,
    isAdmin,
    session,
    selectCredit,
    navigate
  } = useApp();

  const [tab, setTab] = useState<CalendarTab>('hoy');

  const today = todayKey();
  const weekEnd = addDays(today, 7);

  const activeCredits = useMemo(() => {
    return credits.filter((credit) => {
      if (credit.estado === 'anulado' || credit.estado === 'pagado') return false;
      if (credit.saldoPendiente <= 0) return false;
      if (isAdmin) return true;
      return credit.assignedToUid === session.uid;
    });
  }, [credits, isAdmin, session.uid]);

  const collectionItems = useMemo(() => {
    const items: CollectionItem[] = [];

    activeCredits.forEach((credit) => {
      const client = clients.find((item) => item.id === credit.clienteId);
      const installments = buildInstallments(credit, payments, today);

      installments
        .filter((installment) => installment.pendiente > 0)
        .forEach((installment) => {
          items.push({
            id: `${credit.id}-${installment.numero}`,
            credit,
            client,
            installment
          });
        });
    });

    return items.sort((a, b) => {
      if (a.installment.fecha !== b.installment.fecha) {
        return a.installment.fecha.localeCompare(b.installment.fecha);
      }

      return (a.client?.nombre ?? '').localeCompare(b.client?.nombre ?? '');
    });
  }, [activeCredits, clients, payments, today]);

  const todayItems = useMemo(() => {
    return collectionItems.filter((item) => item.installment.fecha === today);
  }, [collectionItems, today]);

  const overdueItems = useMemo(() => {
    return collectionItems.filter((item) => item.installment.fecha < today);
  }, [collectionItems, today]);

  const weekItems = useMemo(() => {
    return collectionItems.filter((item) => isBetween(item.installment.fecha, today, weekEnd));
  }, [collectionItems, today, weekEnd]);

  const promiseVisits = useMemo(() => {
    return visits
      .filter((visit) => {
        if (visit.estado !== 'promesa') return false;
        if (visit.promesaEstado === 'cumplida' || visit.promesaEstado === 'cancelada') return false;
        if (!visit.promesaFecha) return false;
        if (isAdmin) return true;
        return visit.assignedToUid === session.uid;
      })
      .sort((a, b) => {
        const dateCompare = (a.promesaFecha ?? '').localeCompare(b.promesaFecha ?? '');
        if (dateCompare !== 0) return dateCompare;
        return a.clienteNombre.localeCompare(b.clienteNombre);
      });
  }, [isAdmin, session.uid, visits]);

  const currentItems =
    tab === 'hoy'
      ? todayItems
      : tab === 'vencidos'
        ? overdueItems
        : tab === 'semana'
          ? weekItems
          : [];

  const totalToday = todayItems.reduce((total, item) => total + item.installment.pendiente, 0);
  const totalOverdue = overdueItems.reduce((total, item) => total + item.installment.pendiente, 0);
  const totalWeek = weekItems.reduce((total, item) => total + item.installment.pendiente, 0);

  const openWhatsApp = (client?: Client) => {
    if (!client?.telefono) return;

    const phone = normalizePhone(client.telefono);
    const text = encodeURIComponent(`Hola ${client.nombre}, te recordamos tu pago pendiente. Gracias.`);
    Linking.openURL(`https://wa.me/57${phone}?text=${text}`);
  };

  return (
    <View style={styles.root}>
      <TopBar title="Calendario de cobros" showBack onBack={() => navigate('dashboard')} />

      <Screen>
        <Card style={styles.heroCard}>
          <Text style={styles.heroTitle}>Agenda de cobranza</Text>
          <Text style={styles.heroText}>
            Revisa qué cuotas debes cobrar hoy, cuáles están vencidas y las próximas de la semana.
          </Text>
          <Text style={styles.heroDate}>Hoy: {today}</Text>
        </Card>

        <View style={styles.grid}>
          <Card style={styles.metricCard}>
            <Text style={styles.metricLabel}>Hoy</Text>
            <Text style={styles.metricValue}>{formatMoney(totalToday)}</Text>
            <Text style={styles.metricCount}>{todayItems.length} cuotas</Text>
          </Card>

          <Card style={styles.metricCard}>
            <Text style={styles.metricLabel}>Vencido</Text>
            <Text style={[styles.metricValue, styles.danger]}>{formatMoney(totalOverdue)}</Text>
            <Text style={styles.metricCount}>{overdueItems.length} cuotas</Text>
          </Card>
        </View>

        <View style={styles.grid}>
          <Card style={styles.metricCard}>
            <Text style={styles.metricLabel}>Semana</Text>
            <Text style={styles.metricValue}>{formatMoney(totalWeek)}</Text>
            <Text style={styles.metricCount}>{weekItems.length} cuotas</Text>
          </Card>

          <Card style={styles.metricCard}>
            <Text style={styles.metricLabel}>Promesas</Text>
            <Text style={styles.metricValue}>{promiseVisits.length}</Text>
            <Text style={styles.metricCount}>registradas</Text>
          </Card>
        </View>

        <View style={styles.tabs}>
          <CalendarTabButton label="Hoy" value="hoy" current={tab} onPress={setTab} />
          <CalendarTabButton label="Vencidos" value="vencidos" current={tab} onPress={setTab} danger />
          <CalendarTabButton label="Semana" value="semana" current={tab} onPress={setTab} />
          <CalendarTabButton label="Promesas" value="promesas" current={tab} onPress={setTab} />
        </View>

        {tab !== 'promesas' ? (
          <>
            {currentItems.length === 0 ? (
              <EmptyState
                title="Sin cobros"
                message={
                  tab === 'hoy'
                    ? 'No hay cuotas programadas para hoy.'
                    : tab === 'vencidos'
                      ? 'No hay cuotas vencidas.'
                      : 'No hay cuotas programadas para los próximos 7 días.'
                }
              />
            ) : (
              currentItems.map((item) => (
                <CollectionCard
                  key={item.id}
                  item={item}
                  onOpenCredit={() => selectCredit(item.credit.id)}
                  onWhatsApp={() => openWhatsApp(item.client)}
                />
              ))
            )}
          </>
        ) : (
          <>
            {promiseVisits.length === 0 ? (
              <EmptyState title="Sin promesas" message="No hay promesas de pago registradas." />
            ) : (
              promiseVisits.map((visit) => (
                <PromiseCard key={visit.id} visit={visit} />
              ))
            )}
          </>
        )}
      </Screen>

      <BottomNav />
    </View>
  );
}

function CalendarTabButton({
  label,
  value,
  current,
  onPress,
  danger = false
}: {
  label: string;
  value: CalendarTab;
  current: CalendarTab;
  onPress: (value: CalendarTab) => void;
  danger?: boolean;
}) {
  const selected = value === current;

  return (
    <Pressable
      style={[
        styles.tabButton,
        selected ? styles.tabButtonSelected : null,
        selected && danger ? styles.tabButtonDanger : null
      ]}
      onPress={() => onPress(value)}
    >
      <Text
        style={[
          styles.tabText,
          selected ? styles.tabTextSelected : null,
          selected && danger ? styles.tabTextDanger : null
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function CollectionCard({
  item,
  onOpenCredit,
  onWhatsApp
}: {
  item: CollectionItem;
  onOpenCredit: () => void;
  onWhatsApp: () => void;
}) {
  const isOverdue = item.installment.estado === 'vencida';

  return (
    <Card style={styles.collectionCard}>
      <View style={styles.cardHeader}>
        <View style={styles.cardInfo}>
          <Text style={styles.clientName}>{item.client?.nombre ?? 'Cliente no encontrado'}</Text>
          <Text style={styles.clientMeta}>Teléfono: {item.client?.telefono || 'Sin teléfono'}</Text>
          <Text style={styles.clientMeta}>Dirección: {item.client?.direccion || 'Sin dirección'}</Text>
          <Text style={styles.clientMeta}>Ruta: {item.client?.routeName || 'Sin ruta'}</Text>
        </View>

        <StatusBadge type={isOverdue ? 'danger' : 'warning'} label={isOverdue ? 'Vencida' : 'Pendiente'} />
      </View>

      <View style={styles.amountBox}>
        <View style={styles.amountItem}>
          <Text style={styles.amountLabel}>Cuota</Text>
          <Text style={styles.amountValue}>#{item.installment.numero}</Text>
        </View>

        <View style={styles.amountItem}>
          <Text style={styles.amountLabel}>Fecha</Text>
          <Text style={styles.amountValue}>{item.installment.fecha}</Text>
        </View>

        <View style={styles.amountItem}>
          <Text style={styles.amountLabel}>Pendiente</Text>
          <Text style={[styles.amountValue, styles.danger]}>{formatMoney(item.installment.pendiente)}</Text>
        </View>
      </View>

      <Text style={styles.collector}>Cobrador: {item.credit.assignedToEmail || 'Sin cobrador'}</Text>

      <View style={styles.buttonRow}>
        <Button title="Ver crédito" variant="secondary" onPress={onOpenCredit} style={styles.smallButton} />
        <Button title="WhatsApp" variant="secondary" onPress={onWhatsApp} style={styles.smallButton} />
      </View>
    </Card>
  );
}

function PromiseCard({ visit }: { visit: Visit }) {
  return (
    <Card style={styles.collectionCard}>
      <View style={styles.cardHeader}>
        <View style={styles.cardInfo}>
          <Text style={styles.clientName}>{visit.clienteNombre}</Text>
          <Text style={styles.clientMeta}>Teléfono: {visit.clienteTelefono}</Text>
          <Text style={styles.clientMeta}>Dirección: {visit.clienteDireccion}</Text>
          <Text style={styles.clientMeta}>Ruta: {visit.routeName || 'Sin ruta'}</Text>
        </View>

        <StatusBadge type={visit.promesaFecha && visit.promesaFecha < todayKey() ? 'danger' : 'warning'} label="Promesa" />
      </View>

      <View style={styles.promiseBox}>
        <Text style={styles.promiseTitle}>Fecha prometida</Text>
        <Text style={styles.promiseDate}>{visit.promesaFecha || 'Sin fecha'}</Text>
        <Text style={styles.promiseText}>{visit.observacion || 'Sin observación'}</Text>
      </View>
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
    opacity: 0.86,
    marginTop: 6,
    fontWeight: '700',
    lineHeight: 20
  },
  heroDate: {
    color: '#FFFFFF',
    marginTop: 12,
    fontWeight: '900'
  },
  grid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10
  },
  metricCard: {
    flex: 1
  },
  metricLabel: {
    color: colors.muted,
    fontWeight: '800',
    fontSize: 12
  },
  metricValue: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '900',
    marginTop: 5
  },
  metricCount: {
    color: colors.muted,
    fontWeight: '700',
    marginTop: 3,
    fontSize: 12
  },
  danger: {
    color: colors.danger
  },
  tabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
    marginBottom: 14
  },
  tabButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF'
  },
  tabButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft
  },
  tabButtonDanger: {
    borderColor: colors.danger,
    backgroundColor: '#FFF5F5'
  },
  tabText: {
    color: colors.muted,
    fontWeight: '900',
    fontSize: 12
  },
  tabTextSelected: {
    color: colors.primary
  },
  tabTextDanger: {
    color: colors.danger
  },
  collectionCard: {
    marginBottom: 12
  },
  cardHeader: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start'
  },
  cardInfo: {
    flex: 1
  },
  clientName: {
    color: colors.text,
    fontWeight: '900',
    fontSize: 16
  },
  clientMeta: {
    color: colors.muted,
    fontWeight: '700',
    marginTop: 4
  },
  amountBox: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14
  },
  amountItem: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 14,
    padding: 10
  },
  amountLabel: {
    color: colors.muted,
    fontWeight: '800',
    fontSize: 11
  },
  amountValue: {
    color: colors.primary,
    fontWeight: '900',
    marginTop: 4,
    fontSize: 12
  },
  collector: {
    color: colors.primary,
    fontWeight: '800',
    marginTop: 10
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12
  },
  smallButton: {
    flex: 1
  },
  promiseBox: {
    backgroundColor: colors.background,
    borderRadius: 14,
    padding: 12,
    marginTop: 12
  },
  promiseTitle: {
    color: colors.muted,
    fontWeight: '800'
  },
  promiseDate: {
    color: colors.primary,
    fontWeight: '900',
    fontSize: 18,
    marginTop: 4
  },
  promiseText: {
    color: colors.text,
    fontWeight: '700',
    lineHeight: 20,
    marginTop: 8
  }
});