/**
 * ErrorBanner Component
 * Inline error/warning banner for cards and sections
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '@/constants/colors';
import { FontFamily, FontSize } from '@/constants/typography';
import { BorderRadius, Spacing } from '@/constants/spacing';

type BannerVariant = 'error' | 'warning' | 'info';

interface ErrorBannerProps {
  title: string;
  description?: string;
  variant?: BannerVariant;
  action?: {
    label: string;
    onPress: () => void;
  };
  onDismiss?: () => void;
  style?: ViewStyle;
  compact?: boolean;
}

export function ErrorBanner({
  title,
  description,
  variant = 'error',
  action,
  onDismiss,
  style,
  compact = false,
}: ErrorBannerProps) {
  const variantStyles = getVariantStyles(variant);

  return (
    <View style={[styles.container, variantStyles.container, style]}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons
            name={variantStyles.icon}
            size={compact ? 16 : 20}
            color={variantStyles.iconColor}
          />
        </View>

        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: variantStyles.titleColor }]}>
            {title}
          </Text>
          {description && !compact && (
            <Text style={[styles.description, { color: variantStyles.descColor }]}>
              {description}
            </Text>
          )}
        </View>

        {onDismiss && (
          <Pressable onPress={onDismiss} hitSlop={8} style={styles.dismissButton}>
            <Ionicons name="close" size={18} color={variantStyles.iconColor} />
          </Pressable>
        )}
      </View>

      {action && (
        <Pressable
          onPress={action.onPress}
          style={[styles.actionButton, { backgroundColor: variantStyles.actionBg }]}
        >
          <Text style={[styles.actionText, { color: '#FFFFFF' }]}>
            {action.label}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

function getVariantStyles(variant: BannerVariant) {
  switch (variant) {
    case 'error':
      return {
        container: {
          backgroundColor: Colors.error.bg,
          borderColor: Colors.error.border,
        } as ViewStyle,
        icon: 'warning' as const,
        iconColor: Colors.error.bgSolid,
        titleColor: Colors.error.textDark,
        descColor: Colors.error.text,
        actionBg: Colors.error.bgSolid,
      };
    case 'warning':
      return {
        container: {
          backgroundColor: Colors.warning.bg,
          borderColor: Colors.warning.border,
        } as ViewStyle,
        icon: 'alert-circle' as const,
        iconColor: Colors.warning.bgSolid,
        titleColor: Colors.warning.textDark,
        descColor: Colors.warning.text,
        actionBg: Colors.warning.bgSolid,
      };
    case 'info':
      return {
        container: {
          backgroundColor: Colors.primaryLight,
          borderColor: Colors.primary,
        } as ViewStyle,
        icon: 'information-circle' as const,
        iconColor: Colors.primary,
        titleColor: Colors.primary,
        descColor: Colors.primaryHover,
        actionBg: Colors.primary,
      };
    default:
      return {
        container: {} as ViewStyle,
        icon: 'alert-circle' as const,
        iconColor: Colors.text.muted,
        titleColor: Colors.text.primary,
        descColor: Colors.text.secondary,
        actionBg: Colors.primary,
      };
  }
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: Spacing[4],
    gap: Spacing[3],
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing[3],
  },
  iconContainer: {
    paddingTop: 2,
  },
  textContainer: {
    flex: 1,
    gap: Spacing[1],
  },
  title: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
  },
  description: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.base,
    lineHeight: FontSize.base * 1.4,
  },
  dismissButton: {
    padding: Spacing[1],
  },
  actionButton: {
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[4],
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  actionText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
  },
});
