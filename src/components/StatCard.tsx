import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from './Card';
import { colors } from '../theme/colors';

type Props = {
  icon: string;
  value: string;
  label: string;
  helper?: string;
};

export function StatCard({ icon, value, label, helper }: Props) {
  return (
    <Card style={styles.card}>
      <View style={styles.iconBox}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
      {helper ? <Text style={styles.helper}>{helper}</Text> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 130
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
    marginBottom: 10
  },
  icon: {
    fontSize: 20
  },
  value: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900'
  },
  label: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2
  },
  helper: {
    color: colors.primaryLight,
    marginTop: 8,
    fontSize: 12,
    fontWeight: '700'
  }
});
