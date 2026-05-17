import React from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { BottomNav } from '../components/BottomNav';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { Screen } from '../components/Screen';
import { TopBar } from '../components/TopBar';
import { useApp } from '../state/AppContext';
import { colors } from '../theme/colors';
import { UserRole } from '../types';

export function UsersScreen() {
  const { users, session, updateUserRole, toggleUserActive } = useApp();

  const changeRole = (userId: string, currentRole: UserRole) => {
    const nextRole: UserRole = currentRole === 'admin' ? 'cobrador' : 'admin';

    Alert.alert(
      'Cambiar rol',
      `¿Quieres cambiar este usuario a ${nextRole}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cambiar', onPress: () => updateUserRole(userId, nextRole) }
      ]
    );
  };

  const changeActive = (userId: string, activo: boolean) => {
    Alert.alert(
      activo ? 'Desactivar usuario' : 'Activar usuario',
      activo
        ? 'Este usuario no podrá iniciar sesión en la app.'
        : 'Este usuario podrá iniciar sesión nuevamente.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: activo ? 'Desactivar' : 'Activar', onPress: () => toggleUserActive(userId, !activo) }
      ]
    );
  };

  return (
    <View style={styles.root}>
      <TopBar title="Usuarios" rightText="Admin" />
      <Screen>
        <Card style={styles.infoCard}>
          <Text style={styles.infoTitle}>Gestión de cobradores</Text>
          <Text style={styles.infoText}>
            Aquí puedes cambiar roles y activar/desactivar usuarios. Para que aparezcan, primero deben existir en Firebase Authentication e iniciar sesión una vez.
          </Text>
        </Card>

        {users.length === 0 ? (
          <EmptyState title="Sin usuarios" message="Todavía no hay perfiles de usuario registrados." />
        ) : (
          users.map((user) => {
            const isCurrentUser = user.uid === session.uid;

            return (
              <Card key={user.id} style={styles.userCard}>
                <View style={styles.header}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{user.email.charAt(0).toUpperCase()}</Text>
                  </View>

                  <View style={styles.userInfo}>
                    <Text style={styles.email}>{user.email}</Text>
                    <Text style={styles.meta}>
                      {user.role === 'admin' ? 'Administrador' : 'Cobrador'} · {user.activo ? 'Activo' : 'Inactivo'}
                    </Text>
                    {isCurrentUser ? <Text style={styles.current}>Tu usuario actual</Text> : null}
                  </View>
                </View>

                <View style={styles.actions}>
                  <Button
                    title={user.role === 'admin' ? 'Hacer cobrador' : 'Hacer admin'}
                    variant="secondary"
                    onPress={() => changeRole(user.id, user.role)}
                    style={styles.actionButton}
                  />

                  <Button
                    title={user.activo ? 'Desactivar' : 'Activar'}
                    variant={user.activo ? 'danger' : 'secondary'}
                    onPress={() => changeActive(user.id, user.activo)}
                    style={styles.actionButton}
                  />
                </View>
              </Card>
            );
          })
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
  infoCard: {
    backgroundColor: colors.primarySoft,
    marginBottom: 14
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
  },
  userCard: {
    marginBottom: 12,
    gap: 14
  },
  header: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center'
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarText: {
    color: colors.primary,
    fontWeight: '900',
    fontSize: 18
  },
  userInfo: {
    flex: 1
  },
  email: {
    color: colors.text,
    fontWeight: '900',
    fontSize: 15
  },
  meta: {
    color: colors.muted,
    fontWeight: '700',
    marginTop: 3
  },
  current: {
    color: colors.primary,
    fontWeight: '900',
    marginTop: 4,
    fontSize: 12
  },
  actions: {
    flexDirection: 'row',
    gap: 10
  },
  actionButton: {
    flex: 1
  }
});