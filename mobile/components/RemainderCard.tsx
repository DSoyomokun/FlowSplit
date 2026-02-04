/**
 * RemainderCard Component
 * Display for remaining funds after split
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '@/constants/colors';
import { FontFamily, FontSize, LetterSpacing } from '@/constants/typography';
import { BorderRadius, Spacing } from '@/constants/spacing';
import { Shadows } from '@/constants/shadows';
import { CompactAmount } from './AmountDisplay';

interface RemainderCardProps {
  amount: number;
  percentage: number;
  accountName?: string;
  style?: ViewStyle;
  variant?: 'default' | 'compact';
}

export function RemainderCard({
  amount,
  percentage,
  accountName = 'Checking Account',
  style,
  variant = 'default',
}: RemainderCardProps) {
  if (variant === 'compact') {
    return (
      <View style={[compactStyles.container, style]}>
        <Text style={compactStyles.label}>Remaining in Checking</Text>
        <Text style={compactStyles.amount}>
          ${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {/* Left: Icon + labels */}
      <View style={styles.left}>
        <View style={styles.iconContainer}>
          <Ionicons name="wallet-outline" size={20} color={Colors.text.muted} />
        </View>
        <View style={styles.info}>
          <Text style={styles.label}>{accountName}</Text>
          <Text style={styles.sublabel}>Remainder kept</Text>
        </View>
      </View>

      {/* Right: Amount + percentage */}
      <View style={styles.right}>
        <Text style={styles.percentage}>{Math.round(percentage)}%</Text>
        <Text style={styles.amount}>
          ${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing[4],
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    ...Shadows.card,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.gray[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    gap: Spacing[0.5],
  },
  label: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xs,
    color: Colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: LetterSpacing.tight,
  },
  sublabel: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    color: Colors.text.secondary,
  },
  right: {
    alignItems: 'flex-end',
    gap: Spacing[0.5],
  },
  percentage: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xs,
    color: Colors.text.muted,
  },
  amount: {
    fontFamily: FontFamily.black,
    fontSize: FontSize.lg,
    color: Colors.primary,
  },
});

const compactStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[3],
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  label: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    color: Colors.text.muted,
  },
  amount: {
    fontFamily: FontFamily.black,
    fontSize: FontSize.md,
    color: Colors.primary,
  },
});
