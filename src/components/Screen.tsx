import React, { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { colors } from '../theme/colors';

type Props = {
  children: ReactNode;
  withBottomNav?: boolean;
};

export function Screen({ children, withBottomNav = true }: Props) {
  return (
    <View style={styles.root}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.content, withBottomNav ? styles.withBottom : null]}
      >
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background
  },
  content: {
    padding: 16,
    paddingBottom: 24
  },
  withBottom: {
    paddingBottom: 96
  }
});
