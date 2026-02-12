/**
 * BottomActionBar Component
 * Fixed bottom container for primary actions
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';

import { Colors } from '@/constants/colors';
import { Spacing, Size } from '@/constants/spacing';
import { Shadows } from '@/constants/shadows';

interface BottomActionBarProps {
  children: React.ReactNode;
  style?: ViewStyle;
  blur?: boolean;
  showBorder?: boolean;
}

export function BottomActionBar({
  children,
  style,
  blur = true,
  showBorder = true,
}: BottomActionBarProps) {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, Size.safeAreaBottom);

  const content = (
    <View
      style={[
        styles.content,
        { paddingBottom: bottomPadding },
        showBorder && styles.border,
        style,
      ]}
    >
      {children}
    </View>
  );

  if (blur) {
    return (
      <View style={[styles.container, Shadows.bottomBar]}>
        <BlurView intensity={80} tint="light" style={styles.blur}>
          {content}
        </BlurView>
      </View>
    );
  }

  return (
    <View style={[styles.container, styles.solidBackground, Shadows.bottomBar]}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  blur: {
    width: '100%',
  },
  solidBackground: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  content: {
    paddingHorizontal: Spacing.page,
    paddingTop: Spacing[5],
    gap: Spacing[3],
  },
  border: {
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
});

// Helper component for secondary links in bottom bar
interface SecondaryLinkProps {
  children: React.ReactNode;
  onPress?: () => void;
}

export function BottomSecondaryLink({ children, onPress }: SecondaryLinkProps) {
  return (
    <View style={linkStyles.container}>
      {React.isValidElement(children) ? (
        children
      ) : (
        <Text style={linkStyles.text}>{children}</Text>
      )}
    </View>
  );
}

const linkStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: Spacing[2],
  },
  text: {
    color: Colors.text.muted,
  },
});
