import React, { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
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

export function RoutesScreen() {
  const { routes, clients, credits, isAdmin, addRoute, selectClient } = useApp();

  const [nombre, setNombre] = useState('');
  const [zona, setZona] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [loading, setLoading] = useState(false);

  const visibleRoutes = useMemo(() => {
    if (isAdmin) return routes;

    const routeIds = new Set(clients.map((client) => client.routeId).filter(Boolean));
    return routes.filter((route) => routeIds.has(route.id));
  }, [clients, isAdmin, routes]);

  const unassignedClients = useMemo(() => {
    return clients.filter((client) => !client.routeId);
  }, [clients]);

  const handleCreateRoute = async () => {
    if (!nombre.trim()) {
      Alert.alert('Nombre requerido', 'Escribe el nombre de la ruta.');
      return;
    }

    setLoading(true);

    await addRoute({
      nombre: nombre.trim(),
      zona: zona.trim(),
      descripcion: descripcion.trim()
    });

    setNombre('');
    setZona('');
    setDescripcion('');
    setLoading(false);
  };

  return (
    <View style={styles.root}>
      <TopBar title="Rutas de cobro" rightText={isAdmin ? 'Admin' : 'Mi ruta'} />
      <Screen>
        {isAdmin ? (
          <Card style={styles.formCard}>
            <Text style={styles.sectionTitle}>Crear nueva ruta</Text>

            <Input
              label="Nombre de la ruta"
              icon="🛣️"
              value={nombre}
              onChangeText={setNombre}
              placeholder="Ej: Ruta Centro"
            />

            <Input
              label="Zona"
              icon="📍"
              value={zona}
              onChangeText={setZona}
              placeholder="Ej: Centro / Norte / Sur"
            />

            <Input
              label="Descripción"
              icon="📝"
              value={descripcion}
              onChangeText={setDescripcion}
              placeholder="Notas de la ruta"
            />

            <Button title="Crear ruta" onPress={handleCreateRoute} loading={loading} />
          </Card>
        ) : (
          <Card style={styles.infoCard}>
            <Text style={styles.infoTitle}>Tus rutas asignadas</Text>
            <Text style={styles.infoText}>
              Aquí ves las rutas donde tienes clientes asignados por el administrador.
            </Text>
          </Card>
        )}

        <Text style={styles.blockTitle}>{isAdmin ? 'Todas las rutas' : 'Mis rutas'}</Text>

        {visibleRoutes.length === 0 ? (
          <EmptyState
            title="Sin rutas"
            message={isAdmin ? 'Crea la primera ruta de cobro.' : 'Todavía no tienes clientes con ruta asignada.'}
          />
        ) : (
          visibleRoutes.map((route) => {
            const routeClients = clients.filter((client) => client.routeId === route.id);
            const routeCredits = credits.filter((credit) =>
              routeClients.some((client) => client.id === credit.clienteId)
            );
            const pendingTotal = routeCredits.reduce((total, credit) => total + credit.saldoPendiente, 0);
            const overdueCount = routeClients.filter((client) => client.estado === 'en-mora').length;

            return (
              <Card key={route.id} style={styles.routeCard}>
                <View style={styles.routeHeader}>
                  <View style={styles.routeIcon}>
                    <Text style={styles.routeIconText}>🛵</Text>
                  </View>

                  <View style={styles.routeInfo}>
                    <Text style={styles.routeName}>{route.nombre}</Text>
                    <Text style={styles.routeZone}>{route.zona || 'Sin zona registrada'}</Text>
                    {route.descripcion ? <Text style={styles.routeDesc}>{route.descripcion}</Text> : null}
                  </View>
                </View>

                <View style={styles.statsRow}>
                  <View style={styles.statBox}>
                    <Text style={styles.statValue}>{routeClients.length}</Text>
                    <Text style={styles.statLabel}>Clientes</Text>
                  </View>

                  <View style={styles.statBox}>
                    <Text style={styles.statValue}>{overdueCount}</Text>
                    <Text style={styles.statLabel}>En mora</Text>
                  </View>

                  <View style={styles.statBox}>
                    <Text style={styles.statValue}>{formatMoney(pendingTotal)}</Text>
                    <Text style={styles.statLabel}>Pendiente</Text>
                  </View>
                </View>

                <Text style={styles.clientsTitle}>Clientes de esta ruta</Text>

                {routeClients.length === 0 ? (
                  <Text style={styles.emptyText}>No hay clientes asignados a esta ruta.</Text>
                ) : (
                  routeClients.map((client) => (
                    <Pressable key={client.id} style={styles.clientRow} onPress={() => selectClient(client.id)}>
                      <View style={styles.clientAvatar}>
                        <Text style={styles.clientAvatarText}>{client.nombre.charAt(0).toUpperCase()}</Text>
                      </View>

                      <View style={styles.clientInfo}>
                        <Text style={styles.clientName}>{client.nombre}</Text>
                        <Text style={styles.clientMeta}>{client.barrio} · {client.direccion}</Text>
                        <Text style={styles.clientMeta}>Cobrador: {client.assignedToEmail || 'Sin asignar'}</Text>
                      </View>

                      <StatusBadge
                        type={client.estado === 'al-dia' ? 'success' : 'danger'}
                        label={client.estado === 'al-dia' ? 'Al día' : 'En mora'}
                      />
                    </Pressable>
                  ))
                )}
              </Card>
            );
          })
        )}

        {isAdmin && unassignedClients.length > 0 ? (
          <>
            <Text style={styles.blockTitle}>Clientes sin ruta</Text>

            <Card style={styles.warningCard}>
              <Text style={styles.warningTitle}>{unassignedClients.length} clientes sin ruta</Text>
              <Text style={styles.warningText}>
                Puedes asignarlos desde la pantalla Clientes usando los botones de ruta de cada tarjeta.
              </Text>
            </Card>
          </>
        ) : null}
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
  formCard: {
    marginBottom: 16
  },
  infoCard: {
    backgroundColor: colors.primarySoft,
    marginBottom: 16
  },
  infoTitle: {
    color: colors.primary,
    fontWeight: '900',
    fontSize: 16
  },
  infoText: {
    color: colors.muted,
    marginTop: 6,
    lineHeight: 20,
    fontWeight: '700'
  },
  sectionTitle: {
    color: colors.text,
    fontWeight: '900',
    fontSize: 17,
    marginBottom: 10
  },
  blockTitle: {
    color: colors.text,
    fontWeight: '900',
    fontSize: 18,
    marginTop: 10,
    marginBottom: 10
  },
  routeCard: {
    marginBottom: 14
  },
  routeHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center'
  },
  routeIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center'
  },
  routeIconText: {
    fontSize: 24
  },
  routeInfo: {
    flex: 1
  },
  routeName: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900'
  },
  routeZone: {
    color: colors.primary,
    fontWeight: '800',
    marginTop: 3
  },
  routeDesc: {
    color: colors.muted,
    fontWeight: '700',
    marginTop: 3
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 14,
    padding: 10
  },
  statValue: {
    color: colors.primary,
    fontWeight: '900',
    fontSize: 15
  },
  statLabel: {
    color: colors.muted,
    fontWeight: '700',
    fontSize: 11,
    marginTop: 4
  },
  clientsTitle: {
    color: colors.text,
    fontWeight: '900',
    marginTop: 16,
    marginBottom: 8
  },
  emptyText: {
    color: colors.muted,
    fontWeight: '700'
  },
  clientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
    marginTop: 10
  },
  clientAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center'
  },
  clientAvatarText: {
    color: colors.primary,
    fontWeight: '900'
  },
  clientInfo: {
    flex: 1
  },
  clientName: {
    color: colors.text,
    fontWeight: '900'
  },
  clientMeta: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2
  },
  warningCard: {
    backgroundColor: '#FFF8E1'
  },
  warningTitle: {
    color: colors.text,
    fontWeight: '900',
    fontSize: 16
  },
  warningText: {
    color: colors.muted,
    marginTop: 6,
    lineHeight: 20,
    fontWeight: '700'
  }
});
