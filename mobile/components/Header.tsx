/**
 * Header Component
 * App header with back button, title, and right action
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '@/constants/colors';
import { FontFamily, FontSize } from '@/constants/typography';
import { Size, Spacing } from '@/constants/spacing';

type RightAction = 'menu' | 'settings' | 'close' | 'none';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: RightAction;
  onRightAction?: () => void;
  rightIcon?: React.ReactNode;
  transparent?: boolean;
}

export function Header({
  title = 'FlowSplit',
  showBack = false,
  onBack,
  rightAction = 'menu',
  onRightAction,
  rightIcon,
  transparent = false,
}: HeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (router.canGoBack()) {
      router.back();
    }
  };

  const handleRightAction = () => {
    onRightAction?.();
  };

  const getRightIcon = () => {
    if (rightIcon) return rightIcon;

    switch (rightAction) {
      case 'menu':
        return <Ionicons name="menu" size={24} color={Colors.text.secondary} />;
      case 'settings':
        return <Ionicons name="settings-outline" size={24} color={Colors.text.secondary} />;
      case 'close':
        return <Ionicons name="close" size={24} color={Colors.text.secondary} />;
      case 'none':
        return null;
      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, transparent && styles.transparent]}>
      {/* Left: Back button or spacer */}
      <View style={styles.leftSection}>
        {showBack ? (
          <Pressable onPress={handleBack} style={styles.iconButton} hitSlop={8}>
            <Ionicons name="chevron-back" size={24} color={Colors.text.muted} />
          </Pressable>
        ) : (
          <View style={styles.spacer} />
        )}
      </View>

      {/* Center: Title */}
      <Text style={styles.title}>{title}</Text>

      {/* Right: Action button or spacer */}
      <View style={styles.rightSection}>
        {rightAction !== 'none' ? (
          <Pressable onPress={handleRightAction} style={styles.iconButton} hitSlop={8}>
            {getRightIcon()}
          </Pressable>
        ) : (
          <View style={styles.spacer} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: Size.headerHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.page,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  transparent: {
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
  },
  leftSection: {
    width: 32,
    alignItems: 'flex-start',
  },
  rightSection: {
    width: 32,
    alignItems: 'flex-end',
  },
  iconButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spacer: {
    width: 32,
  },
  title: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xl,
    color: Colors.text.primary,
    letterSpacing: -0.25,
  },
});
