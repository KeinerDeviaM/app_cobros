import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { useApp } from '../state/AppContext';
import { ScreenName } from '../types';

const tabs: Array<{ label: string; icon: string; screen: ScreenName }> = [
  { label: 'Inicio', icon: '⌂', screen: 'dashboard' },
  { label: 'Clientes', icon: '👥', screen: 'clients' },
  { label: 'Creditos', icon: '📋', screen: 'credits' },
  { label: 'Pagos', icon: '💰', screen: 'payments' },
  { label: 'Mas', icon: '⋯', screen: 'more' }
];

const parentMap: Partial<Record<ScreenName, ScreenName>> = {
  newClient: 'clients',
  newCredit: 'credits',
  registerPayment: 'payments',
  dailyCash: 'more',
  reports: 'more'
};

export function BottomNav() {
  const { currentScreen, navigate } = useApp();
  const activeScreen = parentMap[currentScreen] ?? currentScreen;

  return (
    <View style={styles.nav}>
      {tabs.map((tab) => {
        const active = activeScreen === tab.screen;
        return (
          <Pressable key={tab.screen} style={styles.item} onPress={() => navigate(tab.screen)}>
            <Text style={[styles.icon, active ? styles.active : null]}>{tab.icon}</Text>
            <Text style={[styles.label, active ? styles.active : null]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  nav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: 72,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
    paddingBottom: 8,
    paddingTop: 8
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2
  },
  icon: {
    fontSize: 18,
    color: colors.muted
  },
  label: {
    fontSize: 11,
    color: colors.muted,
    fontWeight: '700'
  },
  active: {
    color: colors.primary
  }
});
