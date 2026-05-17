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

export function ClientsScreen() {
  const {
    clients,
    navigate,
    selectClient,
    isAdmin,
    users,
    routes,
    assignClientToCollector,
    assignClientToRoute
  } = useApp();

  const [search, setSearch] = useState('');

  const collectors = useMemo(
    () => users.filter((user) => user.role === 'cobrador' && user.activo),
    [users]
  );

  const filtered = useMemo(() => {
    const searchQuery = search.trim().toLowerCase();
    if (!searchQuery) return clients;
    return clients.filter((client) =>
      [client.nombre, client.telefono, client.documento, client.barrio, client.assignedToEmail, client.routeName]
        .join(' ')
        .toLowerCase()
        .includes(searchQuery)
    );
  }, [clients, search]);

  return (
    <View style={styles.root}>
      <TopBar title="Clientes" rightText={isAdmin ? '+' : undefined} onRightPress={isAdmin ? () => navigate('newClient') : undefined} />
      <Screen>
        <Input label="Buscar cliente" icon="🔎" value={search} onChangeText={setSearch} placeholder="Buscar por nombre, teléfono, barrio, cobrador o ruta" />

        {filtered.length === 0 ? (
          <EmptyState
            title="Sin clientes"
            message={isAdmin ? 'No encontramos clientes con ese filtro.' : 'No tienes clientes asignados todavía.'}
          />
        ) : (
          filtered.map((client) => (
            <Card key={client.id} style={styles.clientCard}>
              <Pressable style={styles.clientHeader} onPress={() => selectClient(client.id)}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{client.nombre.charAt(0).toUpperCase()}</Text>
                </View>

                <View style={styles.info}>
                  <Text style={styles.name}>{client.nombre}</Text>
                  <Text style={styles.phone}>{client.telefono}</Text>
                  <Text style={styles.address}>{client.barrio} · {client.direccion}</Text>
                  <Text style={styles.assigned}>Cobrador: {client.assignedToEmail || 'Sin asignar'}</Text>
                  <Text style={styles.route}>Ruta: {client.routeName || 'Sin ruta'}</Text>
                  <Text style={styles.openDetail}>Tocar para ver detalle</Text>
                </View>

                <StatusBadge type={client.estado === 'al-dia' ? 'success' : 'danger'} label={client.estado === 'al-dia' ? 'Al día' : 'En mora'} />
              </Pressable>

              {isAdmin ? (
                <>
                  <View style={styles.assignmentBox}>
                    <Text style={styles.assignmentTitle}>Reasignar cobrador</Text>

                    <View style={styles.assignmentList}>
                      {collectors.length === 0 ? (
                        <Text style={styles.noItems}>No hay cobradores activos.</Text>
                      ) : (
                        collectors.map((collector) => {
                          const selected = client.assignedToUid === collector.uid;

                          return (
                            <Pressable
                              key={collector.id}
                              style={[styles.chip, selected ? styles.chipSelected : null]}
                              onPress={() => assignClientToCollector(client.id, collector)}
                            >
                              <Text style={[styles.chipText, selected ? styles.chipTextSelected : null]}>
                                {collector.email}
                              </Text>
                            </Pressable>
                          );
                        })
                      )}

                      <Pressable style={styles.chip} onPress={() => assignClientToCollector(client.id, null)}>
                        <Text style={styles.chipText}>Sin asignar</Text>
                      </Pressable>
                    </View>
                  </View>

                  <View style={styles.assignmentBox}>
                    <Text style={styles.assignmentTitle}>Asignar ruta</Text>

                    <View style={styles.assignmentList}>
                      {routes.length === 0 ? (
                        <Text style={styles.noItems}>No hay rutas creadas.</Text>
                      ) : (
                        routes.map((route) => {
                          const selected = client.routeId === route.id;

                          return (
                            <Pressable
                              key={route.id}
                              style={[styles.chip, selected ? styles.chipSelected : null]}
                              onPress={() => assignClientToRoute(client.id, route)}
                            >
                              <Text style={[styles.chipText, selected ? styles.chipTextSelected : null]}>
                                {route.nombre}
                              </Text>
                            </Pressable>
                          );
                        })
                      )}

                      <Pressable style={styles.chip} onPress={() => assignClientToRoute(client.id, null)}>
                        <Text style={styles.chipText}>Sin ruta</Text>
                      </Pressable>
                    </View>
                  </View>
                </>
              ) : null}
            </Card>
          ))
        )}

        {isAdmin ? (
          <>
            <Pressable style={styles.floating} onPress={() => navigate('newClient')}>
              <Text style={styles.floatingText}>+</Text>
            </Pressable>

            <Button title="Crear nuevo cliente" onPress={() => navigate('newClient')} style={styles.bottomButton} />
          </>
        ) : (
          <Card style={styles.infoCard}>
            <Text style={styles.infoTitle}>Clientes asignados</Text>
            <Text style={styles.infoText}>Solo ves los clientes que el administrador asignó a tu usuario.</Text>
          </Card>
        )}
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
  clientCard: {
    marginBottom: 10
  },
  clientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft
  },
  avatarText: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '900'
  },
  info: {
    flex: 1
  },
  name: {
    color: colors.text,
    fontWeight: '900',
    fontSize: 15
  },
  phone: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 2
  },
  address: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2
  },
  assigned: {
    color: colors.primary,
    fontSize: 12,
    marginTop: 4,
    fontWeight: '800'
  },
  route: {
    color: colors.text,
    fontSize: 12,
    marginTop: 3,
    fontWeight: '800'
  },
  openDetail: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 4,
    fontWeight: '700'
  },
  assignmentBox: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12
  },
  assignmentTitle: {
    color: colors.text,
    fontWeight: '900',
    marginBottom: 8
  },
  assignmentList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  noItems: {
    color: colors.danger,
    fontWeight: '800',
    fontSize: 12
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: '#FFFFFF'
  },
  chipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft
  },
  chipText: {
    color: colors.muted,
    fontWeight: '800',
    fontSize: 12
  },
  chipTextSelected: {
    color: colors.primary
  },
  floating: {
    position: 'absolute',
    right: 18,
    bottom: 104,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4
  },
  floatingText: {
    color: '#FFFFFF',
    fontSize: 32,
    lineHeight: 36,
    fontWeight: '700'
  },
  bottomButton: {
    marginTop: 12
  },
  infoCard: {
    marginTop: 16,
    backgroundColor: colors.primarySoft
  },
  infoTitle: {
    color: colors.primary,
    fontWeight: '900',
    fontSize: 16
  },
  infoText: {
    color: colors.muted,
    marginTop: 6,
    lineHeight: 20
  }
});