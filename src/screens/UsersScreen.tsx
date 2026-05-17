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
import { UserProfile, UserRole } from '../types';

type UserFilter = 'todos' | 'admin' | 'cobrador' | 'activos' | 'inactivos';

function normalize(value: unknown) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function getRoleDescription(role: UserRole) {
  if (role === 'admin') {
    return 'Puede gestionar usuarios, clientes, creditos, reportes, auditoria, respaldo y configuracion.';
  }

  return 'Puede gestionar su cartera asignada, registrar pagos, visitas, promesas y cierre de caja.';
}

export function UsersScreen() {
  const {
    users,
    session,
    updateUserRole,
    toggleUserActive,
    navigate
  } = useApp();

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<UserFilter>('todos');

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesQuery = !query.trim() || normalize(user.email).includes(normalize(query));

      if (!matchesQuery) return false;

      if (filter === 'admin') return user.role === 'admin';
      if (filter === 'cobrador') return user.role === 'cobrador';
      if (filter === 'activos') return user.activo;
      if (filter === 'inactivos') return !user.activo;

      return true;
    });
  }, [filter, query, users]);

  const summary = useMemo(() => {
    return {
      total: users.length,
      admins: users.filter((user) => user.role === 'admin').length,
      collectors: users.filter((user) => user.role === 'cobrador').length,
      active: users.filter((user) => user.activo).length,
      inactive: users.filter((user) => !user.activo).length
    };
  }, [users]);

  const confirmChangeRole = (user: UserProfile, nextRole: UserRole) => {
    if (user.uid === session.uid && nextRole !== 'admin') {
      Alert.alert('Acción no permitida', 'No puedes quitarte tu propio rol de administrador.');
      return;
    }

    Alert.alert(
      'Cambiar rol',
      `¿Deseas cambiar el rol de ${user.email} a ${nextRole}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cambiar',
          onPress: () => updateUserRole(user.uid, nextRole)
        }
      ]
    );
  };

  const confirmToggleActive = (user: UserProfile) => {
    const nextValue = !user.activo;

    if (user.uid === session.uid && !nextValue) {
      Alert.alert('Acción no permitida', 'No puedes desactivar tu propio usuario.');
      return;
    }

    Alert.alert(
      nextValue ? 'Activar usuario' : 'Desactivar usuario',
      nextValue
        ? `¿Deseas activar el usuario ${user.email}?`
        : `¿Deseas desactivar el usuario ${user.email}? Este usuario no debería poder seguir usando la app.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: nextValue ? 'Activar' : 'Desactivar',
          style: nextValue ? 'default' : 'destructive',
          onPress: () => toggleUserActive(user.uid, nextValue)
        }
      ]
    );
  };

  return (
    <View style={styles.root}>
      <TopBar title="Usuarios y permisos" showBack onBack={() => navigate('more')} />

      <Screen>
        <Card style={styles.heroCard}>
          <Text style={styles.heroTitle}>Gestión de usuarios</Text>
          <Text style={styles.heroText}>
            Administra roles, permisos y acceso de cobradores y administradores.
          </Text>
          <Text style={styles.heroMeta}>Tu sesión: {session.email}</Text>
        </Card>

        <View style={styles.grid}>
          <Metric title="Total" value={String(summary.total)} />
          <Metric title="Admins" value={String(summary.admins)} />
        </View>

        <View style={styles.grid}>
          <Metric title="Cobradores" value={String(summary.collectors)} />
          <Metric title="Inactivos" value={String(summary.inactive)} danger={summary.inactive > 0} />
        </View>

        <Input
          label="Buscar usuario"
          icon="🔎"
          value={query}
          onChangeText={setQuery}
          placeholder="Correo del usuario"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <View style={styles.filters}>
          <FilterChip label="Todos" value="todos" current={filter} onPress={setFilter} />
          <FilterChip label="Admin" value="admin" current={filter} onPress={setFilter} />
          <FilterChip label="Cobrador" value="cobrador" current={filter} onPress={setFilter} />
          <FilterChip label="Activos" value="activos" current={filter} onPress={setFilter} />
          <FilterChip label="Inactivos" value="inactivos" current={filter} onPress={setFilter} danger />
        </View>

        <Card style={styles.guideCard}>
          <Text style={styles.guideTitle}>Cómo crear un usuario nuevo</Text>
          <Text style={styles.guideText}>
            Primero crea el usuario en Firebase Authentication con correo y contraseña. Luego ese usuario inicia sesión en la app una vez y aparecerá aquí para asignarle rol y estado.
          </Text>
        </Card>

        <Text style={styles.blockTitle}>Usuarios encontrados: {filteredUsers.length}</Text>

        {filteredUsers.length === 0 ? (
          <EmptyState title="Sin usuarios" message="No hay usuarios con ese filtro o búsqueda." />
        ) : (
          filteredUsers.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              isCurrentUser={user.uid === session.uid}
              onChangeRole={confirmChangeRole}
              onToggleActive={confirmToggleActive}
            />
          ))
        )}

        <Card style={styles.permissionsCard}>
          <Text style={styles.permissionsTitle}>Permisos por rol</Text>

          <View style={styles.permissionBlock}>
            <Text style={styles.permissionRole}>Administrador</Text>
            <Text style={styles.permissionText}>
              Puede crear y editar clientes, creditos, rutas, usuarios, reportes, auditoria, configuracion, respaldo y generar APKs nuevas.
            </Text>
          </View>

          <View style={styles.permissionBlock}>
            <Text style={styles.permissionRole}>Cobrador</Text>
            <Text style={styles.permissionText}>
              Puede ver su cartera asignada, registrar pagos, generar recibos, gestionar visitas, promesas y cerrar su caja diaria.
            </Text>
          </View>
        </Card>
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

function FilterChip({
  label,
  value,
  current,
  onPress,
  danger = false
}: {
  label: string;
  value: UserFilter;
  current: UserFilter;
  onPress: (value: UserFilter) => void;
  danger?: boolean;
}) {
  const selected = value === current;

  return (
    <Pressable
      style={[
        styles.filterChip,
        selected ? styles.filterChipSelected : null,
        selected && danger ? styles.filterChipDanger : null
      ]}
      onPress={() => onPress(value)}
    >
      <Text
        style={[
          styles.filterText,
          selected ? styles.filterTextSelected : null,
          selected && danger ? styles.filterTextDanger : null
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function UserCard({
  user,
  isCurrentUser,
  onChangeRole,
  onToggleActive
}: {
  user: UserProfile;
  isCurrentUser: boolean;
  onChangeRole: (user: UserProfile, nextRole: UserRole) => void;
  onToggleActive: (user: UserProfile) => void;
}) {
  const nextRole: UserRole = user.role === 'admin' ? 'cobrador' : 'admin';

  return (
    <Card style={[styles.userCard, !user.activo ? styles.inactiveCard : null]}>
      <View style={styles.userHeader}>
        <View style={styles.userInfo}>
          <Text style={styles.userEmail}>{user.email}</Text>
          <Text style={styles.userMeta}>
            Rol: {user.role} · Estado: {user.activo ? 'Activo' : 'Inactivo'}
          </Text>
          <Text style={styles.userDescription}>{getRoleDescription(user.role)}</Text>
          {isCurrentUser ? (
            <Text style={styles.currentUserText}>Este es tu usuario actual.</Text>
          ) : null}
        </View>

        <StatusBadge type={user.activo ? 'success' : 'danger'} label={user.activo ? 'Activo' : 'Inactivo'} />
      </View>

      <View style={styles.roleBox}>
        <StatusBadge type={user.role === 'admin' ? 'warning' : 'success'} label={user.role === 'admin' ? 'Admin' : 'Cobrador'} />
        <Text style={styles.createdText}>Creado: {user.createdAt?.slice(0, 10) || 'Sin fecha'}</Text>
      </View>

      <View style={styles.buttonGrid}>
        <Button
          title={`Cambiar a ${nextRole}`}
          variant="secondary"
          onPress={() => onChangeRole(user, nextRole)}
          style={styles.actionButton}
        />

        <Button
          title={user.activo ? 'Desactivar' : 'Activar'}
          variant={user.activo ? 'danger' : 'secondary'}
          onPress={() => onToggleActive(user)}
          style={styles.actionButton}
        />
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
    opacity: 0.9,
    marginTop: 6,
    lineHeight: 20,
    fontWeight: '700'
  },
  heroMeta: {
    color: '#FFFFFF',
    opacity: 0.85,
    marginTop: 12,
    fontWeight: '800'
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
    fontSize: 20,
    marginTop: 6
  },
  danger: {
    color: colors.danger
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14
  },
  filterChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF'
  },
  filterChipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft
  },
  filterChipDanger: {
    borderColor: colors.danger,
    backgroundColor: '#FFF5F5'
  },
  filterText: {
    color: colors.muted,
    fontWeight: '900',
    fontSize: 12
  },
  filterTextSelected: {
    color: colors.primary
  },
  filterTextDanger: {
    color: colors.danger
  },
  guideCard: {
    backgroundColor: '#FFF8E1',
    marginBottom: 14
  },
  guideTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900'
  },
  guideText: {
    color: colors.muted,
    fontWeight: '700',
    lineHeight: 20,
    marginTop: 6
  },
  blockTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 10
  },
  userCard: {
    marginBottom: 12
  },
  inactiveCard: {
    backgroundColor: '#FFF5F5'
  },
  userHeader: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start'
  },
  userInfo: {
    flex: 1
  },
  userEmail: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900'
  },
  userMeta: {
    color: colors.muted,
    fontWeight: '800',
    marginTop: 4
  },
  userDescription: {
    color: colors.muted,
    fontWeight: '700',
    lineHeight: 20,
    marginTop: 7
  },
  currentUserText: {
    color: colors.primary,
    fontWeight: '900',
    marginTop: 8
  },
  roleBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 14,
    padding: 12,
    marginTop: 12
  },
  createdText: {
    color: colors.muted,
    fontWeight: '800',
    fontSize: 12
  },
  buttonGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12
  },
  actionButton: {
    flex: 1
  },
  permissionsCard: {
    marginTop: 8,
    marginBottom: 12
  },
  permissionsTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 10
  },
  permissionBlock: {
    backgroundColor: colors.background,
    borderRadius: 14,
    padding: 12,
    marginTop: 10
  },
  permissionRole: {
    color: colors.primary,
    fontWeight: '900',
    fontSize: 15
  },
  permissionText: {
    color: colors.muted,
    fontWeight: '700',
    lineHeight: 20,
    marginTop: 5
  }
});