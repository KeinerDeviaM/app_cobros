import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextStyle, ViewStyle } from 'react-native';
import { colors } from '../theme/colors';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

type Props = {
  title: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
};

function textStyleForVariant(variant: Variant): TextStyle {
  if (variant === 'primary') return styles.primaryText;
  if (variant === 'secondary') return styles.secondaryText;
  if (variant === 'danger') return styles.dangerText;
  return styles.ghostText;
}

export function Button({ title, onPress, variant = 'primary', disabled, loading, style }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        disabled ? styles.disabled : null,
        pressed ? styles.pressed : null,
        style
      ]}
    >
      {loading ? <ActivityIndicator color={variant === 'primary' ? '#FFFFFF' : colors.primary} /> : <Text style={[styles.text, textStyleForVariant(variant)]}>{title}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16
  },
  primary: {
    backgroundColor: colors.primary
  },
  secondary: {
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.border
  },
  danger: {
    backgroundColor: colors.danger
  },
  ghost: {
    backgroundColor: 'transparent'
  },
  disabled: {
    opacity: 0.5
  },
  pressed: {
    transform: [{ scale: 0.99 }],
    opacity: 0.9
  },
  text: {
    fontSize: 15,
    fontWeight: '700'
  },
  primaryText: {
    color: '#FFFFFF'
  },
  secondaryText: {
    color: colors.primary
  },
  dangerText: {
    color: '#FFFFFF'
  },
  ghostText: {
    color: colors.primary
  }
});
