import React from 'react';
import { Platform, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { useApp } from '../state/AppContext';

type Props = {
  title: string;
  showBack?: boolean;
  rightText?: string;
  onRightPress?: () => void;
  onBack?: () => void;
};

export function TopBar({ title, showBack, rightText, onRightPress, onBack }: Props) {
  const { navigate } = useApp();
  const topPadding = Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;

  const handleLeftPress = () => {
    if (showBack) {
      if (onBack) {
        onBack();
        return;
      }

      navigate('dashboard');
      return;
    }

    navigate('more');
  };

  return (
    <View style={[styles.bar, { paddingTop: topPadding + 10 }]}>
      <View style={styles.row}>
        <Pressable style={styles.iconButton} onPress={handleLeftPress}>
          <Text style={styles.icon}>{showBack ? '‹' : '☰'}</Text>
        </Pressable>

        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>

        {rightText ? (
          <Pressable style={styles.rightButton} onPress={onRightPress}>
            <Text style={styles.rightText}>{rightText}</Text>
          </Pressable>
        ) : (
          <View style={styles.iconButton} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingBottom: 12
  },
  row: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center'
  },
  iconButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center'
  },
  icon: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '700'
  },
  title: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800'
  },
  rightButton: {
    minWidth: 42,
    minHeight: 42,
    justifyContent: 'center',
    alignItems: 'center'
  },
  rightText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13
  }
});
