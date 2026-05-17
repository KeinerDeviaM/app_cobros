import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BottomNav } from '../components/BottomNav';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { Input } from '../components/Input';
import { Screen } from '../components/Screen';
import { StatusBadge } from '../components/StatusBadge';
import { TopBar } from '../components/TopBar';
import { useApp } from '../state/AppContext';
import { colors } from '../theme/colors';
import { formatMoney } from '../utils/money';

type SearchTab = 'todo' | 'clientes' | 'creditos' | 'pagos' | 'visitas';

type SearchResult = {
  id: string;
  type: SearchTab;
  title: string;
  subtitle: string;
  meta: string;
  amount?: number;
  status?: string;
  onPress?: () => void;
};

function normalize(value: unknown) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function includesQuery(values: unknown[], query: string) {
  const cleanQuery = normalize(query);
  if (!cleanQuery) return true;

  return values.some((value) => normalize(value).includes(cleanQuery));
}

function getBadgeType(status?: string) {
  if (!status) return 'warning';

  if (
    status === 'anulado' ||
    status === 'vencido' ||
    status === 'en-mora' ||
    status === 'no-pago' ||
    status === 'no-estaba' ||
    status === 'incumplida' ||
    status === 'cancelada'
  ) {
    return 'danger';
  }

  if (
    status === 'activo' ||
    status === 'pagado' ||
    status === 'al-dia' ||
    status === 'pago' ||
    status === 'visitado' ||
    status === 'cumplida'
  ) {
    return 'success';
  }

  return 'warning';
}

function getTypeLabel(type: SearchTab) {
  if (type === 'clientes') return 'Cliente';
  if (type === 'creditos') return 'Credito';
  if (type === 'pagos') return 'Pago';
  if (type === 'visitas') return 'Visita';
  return 'Resultado';
}

export function GlobalSearchScreen() {
  const {
    clients,
    credits,
    payments,
    visits,
    routes,
    users,
    selectClient,
    selectCredit,
    getClientName,
    navigate
  } = useApp();

  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<SearchTab>('todo');

  const results = useMemo(() => {
    const items: SearchResult[] = [];

    clients.forEach((client) => {
      if (
        includesQuery(
          [
            client.nombre,
            client.documento,
            client.telefono,
            client.direccion,
            client.barrio,
            client.estado,
            client.assignedToEmail,
            client.routeName
          ],
          query
        )
      ) {
        items.push({
          id: `client-${client.id}`,
          type: 'clientes',
          title: client.nombre,
          subtitle: `Telefono: ${client.telefono || 'Sin telefono'} | Documento: ${client.documento || 'Sin documento'}`,
          meta: `${client.direccion || 'Sin direccion'} | ${client.routeName || 'Sin ruta'}`,
          status: client.estado,
          onPress: () => selectClient(client.id)
        });
      }
    });

    credits.forEach((credit) => {
      const clientName = getClientName(credit.clienteId);

      if (
        includesQuery(
          [
            clientName,
            credit.estado,
            credit.frecuencia,
            credit.valorTotal,
            credit.saldoPendiente,
            credit.assignedToEmail
          ],
          query
        )
      ) {
        items.push({
          id: `credit-${credit.id}`,
          type: 'creditos',
          title: clientName,
          subtitle: `Total: ${formatMoney(credit.valorTotal)} | Saldo: ${formatMoney(credit.saldoPendiente)}`,
          meta: `${credit.numeroCuotas} cuotas | ${credit.frecuencia} | Cobrador: ${credit.assignedToEmail || 'Sin cobrador'}`,
          amount: credit.saldoPendiente,
          status: credit.estado,
          onPress: () => selectCredit(credit.id)
        });
      }
    });

    payments.forEach((payment) => {
      const clientName = getClientName(payment.clienteId);

      if (
        includesQuery(
          [
            clientName,
            payment.valorPagado,
            payment.metodoPago,
            payment.fechaPago,
            payment.estado,
            payment.usuarioEmail,
            payment.observacion
          ],
          query
        )
      ) {
        items.push({
          id: `payment-${payment.id}`,
          type: 'pagos',
          title: clientName,
          subtitle: `Pago: ${formatMoney(payment.valorPagado)} | Metodo: ${payment.metodoPago}`,
          meta: `${payment.fechaPago} | Cobrador: ${payment.usuarioEmail}`,
          amount: payment.valorPagado,
          status: payment.estado
        });
      }
    });

    visits.forEach((visit) => {
      if (
        includesQuery(
          [
            visit.clienteNombre,
            visit.clienteTelefono,
            visit.clienteDireccion,
            visit.clienteBarrio,
            visit.estado,
            visit.observacion,
            visit.promesaFecha,
            visit.promesaValor,
            visit.promesaEstado,
            visit.routeName,
            visit.assignedToEmail
          ],
          query
        )
      ) {
        items.push({
          id: `visit-${visit.id}`,
          type: 'visitas',
          title: visit.clienteNombre,
          subtitle:
            visit.estado === 'promesa'
              ? `Promesa: ${formatMoney(visit.promesaValor || 0)} para ${visit.promesaFecha || 'sin fecha'}`
              : `Estado: ${visit.estado} | Fecha: ${visit.fecha}`,
          meta: `${visit.clienteDireccion || 'Sin direccion'} | ${visit.routeName || 'Sin ruta'}`,
          amount: visit.estado === 'promesa' ? visit.promesaValor || 0 : undefined,
          status: visit.estado === 'promesa' ? visit.promesaEstado || 'pendiente' : visit.estado
        });
      }
    });

    routes.forEach((route) => {
      if (includesQuery([route.nombre, route.zona, route.descripcion], query)) {
        items.push({
          id: `route-${route.id}`,
          type: 'todo',
          title: route.nombre,
          subtitle: `Ruta | Zona: ${route.zona || 'Sin zona'}`,
          meta: route.descripcion || 'Sin descripcion',
          status: 'activo'
        });
      }
    });

    users.forEach((user) => {
      if (includesQuery([user.email, user.role, user.activo ? 'activo' : 'inactivo'], query)) {
        items.push({
          id: `user-${user.id}`,
          type: 'todo',
          title: user.email,
          subtitle: `Usuario | Rol: ${user.role}`,
          meta: user.activo ? 'Usuario activo' : 'Usuario inactivo',
          status: user.activo ? 'activo' : 'anulado'
        });
      }
    });

    const filtered = tab === 'todo' ? items : items.filter((item) => item.type === tab);

    return filtered.sort((a, b) => {
      const typeCompare = a.type.localeCompare(b.type);
      if (typeCompare !== 0) return typeCompare;
      return a.title.localeCompare(b.title);
    });
  }, [clients, credits, getClientName, payments, query, routes, selectClient, selectCredit, tab, users, visits]);

  const counters = useMemo(() => {
    return {
      clientes: results.filter((item) => item.type === 'clientes').length,
      creditos: results.filter((item) => item.type === 'creditos').length,
      pagos: results.filter((item) => item.type === 'pagos').length,
      visitas: results.filter((item) => item.type === 'visitas').length
    };
  }, [results]);

  return (
    <View style={styles.root}>
      <TopBar title="Busqueda global" showBack onBack={() => navigate('dashboard')} />

      <Screen>
        <Card style={styles.heroCard}>
          <Text style={styles.heroTitle}>Buscar en toda la app</Text>
          <Text style={styles.heroText}>
            Encuentra clientes, creditos, pagos, visitas, promesas, rutas o cobradores.
          </Text>
        </Card>

        <Input
          label="Buscar"
          icon="🔎"
          value={query}
          onChangeText={setQuery}
          placeholder="Nombre, telefono, documento, ruta, valor..."
        />

        <View style={styles.tabs}>
          <SearchTabButton label="Todo" value="todo" current={tab} onPress={setTab} />
          <SearchTabButton label="Clientes" value="clientes" current={tab} onPress={setTab} />
          <SearchTabButton label="Creditos" value="creditos" current={tab} onPress={setTab} />
          <SearchTabButton label="Pagos" value="pagos" current={tab} onPress={setTab} />
          <SearchTabButton label="Visitas" value="visitas" current={tab} onPress={setTab} />
        </View>

        <View style={styles.grid}>
          <MiniCounter label="Clientes" value={counters.clientes} />
          <MiniCounter label="Creditos" value={counters.creditos} />
          <MiniCounter label="Pagos" value={counters.pagos} />
          <MiniCounter label="Visitas" value={counters.visitas} />
        </View>

        <Text style={styles.resultTitle}>
          Resultados: {results.length}
        </Text>

        {results.length === 0 ? (
          <EmptyState title="Sin resultados" message="No encontramos informacion con esa busqueda." />
        ) : (
          results.map((item) => (
            <SearchResultCard key={item.id} item={item} />
          ))
        )}
      </Screen>

      <BottomNav />
    </View>
  );
}

function SearchTabButton({
  label,
  value,
  current,
  onPress
}: {
  label: string;
  value: SearchTab;
  current: SearchTab;
  onPress: (value: SearchTab) => void;
}) {
  const selected = value === current;

  return (
    <Pressable style={[styles.tabButton, selected ? styles.tabButtonSelected : null]} onPress={() => onPress(value)}>
      <Text style={[styles.tabText, selected ? styles.tabTextSelected : null]}>{label}</Text>
    </Pressable>
  );
}

function MiniCounter({ label, value }: { label: string; value: number }) {
  return (
    <Card style={styles.counterCard}>
      <Text style={styles.counterLabel}>{label}</Text>
      <Text style={styles.counterValue}>{value}</Text>
    </Card>
  );
}

function SearchResultCard({ item }: { item: SearchResult }) {
  return (
    <Pressable onPress={item.onPress}>
      <Card style={styles.resultCard}>
        <View style={styles.resultHeader}>
          <View style={styles.resultInfo}>
            <Text style={styles.typeLabel}>{getTypeLabel(item.type)}</Text>
            <Text style={styles.resultName}>{item.title}</Text>
            <Text style={styles.resultSubtitle}>{item.subtitle}</Text>
            <Text style={styles.resultMeta}>{item.meta}</Text>
          </View>

          {item.status ? (
            <StatusBadge type={getBadgeType(item.status)} label={item.status} />
          ) : null}
        </View>

        {typeof item.amount === 'number' ? (
          <Text style={styles.amount}>{formatMoney(item.amount)}</Text>
        ) : null}

        {item.onPress ? (
          <Text style={styles.openText}>Tocar para abrir detalle</Text>
        ) : null}
      </Card>
    </Pressable>
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
    lineHeight: 20,
    fontWeight: '700'
  },
  tabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12
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
  tabText: {
    color: colors.muted,
    fontWeight: '900',
    fontSize: 12
  },
  tabTextSelected: {
    color: colors.primary
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12
  },
  counterCard: {
    width: '48%',
    padding: 12
  },
  counterLabel: {
    color: colors.muted,
    fontWeight: '800',
    fontSize: 12
  },
  counterValue: {
    color: colors.primary,
    fontWeight: '900',
    fontSize: 20,
    marginTop: 4
  },
  resultTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
    marginTop: 6,
    marginBottom: 10
  },
  resultCard: {
    marginBottom: 10
  },
  resultHeader: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start'
  },
  resultInfo: {
    flex: 1
  },
  typeLabel: {
    color: colors.primary,
    fontWeight: '900',
    fontSize: 12,
    marginBottom: 4
  },
  resultName: {
    color: colors.text,
    fontWeight: '900',
    fontSize: 16
  },
  resultSubtitle: {
    color: colors.muted,
    fontWeight: '700',
    marginTop: 5,
    lineHeight: 20
  },
  resultMeta: {
    color: colors.muted,
    fontWeight: '700',
    marginTop: 4,
    lineHeight: 20
  },
  amount: {
    color: colors.primary,
    fontSize: 17,
    fontWeight: '900',
    marginTop: 10
  },
  openText: {
    color: colors.primary,
    fontWeight: '900',
    marginTop: 8,
    fontSize: 12
  }
});