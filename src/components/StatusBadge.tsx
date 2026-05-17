import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { colors } from '../theme/colors';

type Props = {
  type: 'success' | 'danger' | 'warning';
  label: string;
};

export function StatusBadge({ type, label }: Props) {
  return <Text style={[styles.badge, styles[type]]}>{label}</Text>;
}

const styles = StyleSheet.create({
  badge: {
    overflow: 'hidden',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    fontSize: 11,
    fontWeight: '800'
  },
  success: {
    backgroundColor: colors.successSoft,
    color: colors.success
  },
  danger: {
    backgroundColor: colors.dangerSoft,
    color: colors.danger
  },
  warning: {
    backgroundColor: colors.warningSoft,
    color: colors.warning
  }
});
