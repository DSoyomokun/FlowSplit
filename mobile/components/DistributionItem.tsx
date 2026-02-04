/**
 * DistributionItem Component
 * Confirmation screen distribution row with status
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '@/constants/colors';
import { FontFamily, FontSize, LetterSpacing } from '@/constants/typography';
import { BorderRadius, Spacing } from '@/constants/spacing';
import { StatusBadge, StatusDot, StatusType } from './StatusBadge';
import { CompactAmount } from './AmountDisplay';
import { ErrorBanner } from './ErrorBanner';

interface DistributionItemProps {
  id: string;
  name: string;
  destination: string;
  amount: number;
  percentage: number;
  color: string;
  status?: StatusType;
  error?: {
    title: string;
    description: string;
    onResolve?: () => void;
  };
  onRetry?: () => void;
  style?: ViewStyle;
}

export function DistributionItem({
  id,
  name,
  destination,
  amount,
  percentage,
  color,
  status,
  error,
  onRetry,
  style,
}: DistributionItemProps) {
  const hasError = !!error;
  const showStatus = status && status !== 'success';

  return (
    <View
      style={[
        styles.container,
        hasError && styles.containerError,
        status === 'success' && styles.containerSuccess,
        status === 'pending' && styles.containerPending,
        status === 'retrying' && styles.containerRetrying,
        style,
      ]}
    >
      {/* Error Banner (if applicable) */}
      {error && (
        <View style={styles.errorSection}>
          <View style={styles.errorHeader}>
            <Ionicons name="alert-triangle" size={16} color={Colors.error.bgSolid} />
            <Text style={styles.errorTitle}>{error.title}</Text>
          </View>
          <Text style={styles.errorDescription}>{error.description}</Text>
        </View>
      )}

      {/* Main Content */}
      <View style={styles.content}>
        {/* Left: Color dot + info */}
        <View style={styles.left}>
          <StatusDot
            color={hasError ? Colors.error.bgSolid : color}
            size={12}
          />
          <View style={styles.info}>
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.destination}>{destination}</Text>
          </View>
        </View>

        {/* Right: Amount + percentage */}
        <View style={styles.right}>
          <CompactAmount amount={amount} />
          <Text style={styles.percentage}>{Math.round(percentage)}%</Text>
        </View>
      </View>

      {/* Status Badge (if applicable) */}
      {showStatus && (
        <View style={styles.statusRow}>
          <StatusBadge status={status} />
          {(status === 'failed' || status === 'retrying') && onRetry && (
            <Pressable onPress={onRetry}>
              <Text style={styles.retryLink}>Retry</Text>
            </Pressable>
          )}
        </View>
      )}

      {/* Error Action Button */}
      {error?.onResolve && (
        <Pressable onPress={error.onResolve} style={styles.resolveButton}>
          <Text style={styles.resolveButtonText}>Resolve Issue</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing[4],
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    gap: Spacing[3],
  },
  containerError: {
    backgroundColor: Colors.card,
    borderColor: Colors.error.border,
  },
  containerSuccess: {
    backgroundColor: `${Colors.success.bgSolid}08`,
  },
  containerPending: {
    backgroundColor: Colors.warning.bg,
    borderColor: Colors.warning.borderLight,
  },
  containerRetrying: {
    backgroundColor: Colors.warning.bg,
    borderColor: Colors.warning.borderLight,
  },
  errorSection: {
    backgroundColor: Colors.error.bg,
    borderRadius: BorderRadius.lg,
    padding: Spacing[3],
    marginBottom: Spacing[1],
    gap: Spacing[1],
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  errorTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    color: Colors.error.textDark,
  },
  errorDescription: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.base,
    color: Colors.error.text,
    marginLeft: Spacing[6],
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    flex: 1,
  },
  info: {
    gap: Spacing[0.5],
  },
  name: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    color: Colors.text.secondary,
  },
  destination: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.text.muted,
  },
  right: {
    alignItems: 'flex-end',
    gap: Spacing[0.5],
  },
  percentage: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.text.muted,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing[2],
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  retryLink: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.base,
    color: Colors.error.text,
    textDecorationLine: 'underline',
  },
  resolveButton: {
    backgroundColor: Colors.error.bgSolid,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing[3],
    alignItems: 'center',
  },
  resolveButtonText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    color: Colors.card,
  },
});

// Remainder variant with dashed border
interface RemainderItemProps {
  amount: number;
  percentage: number;
  accountName?: string;
}

export function RemainderItem({
  amount,
  percentage,
  accountName = 'Chase Checking',
}: RemainderItemProps) {
  return (
    <View style={remainderStyles.container}>
      <View style={styles.content}>
        <View style={styles.left}>
          <StatusDot color={Colors.gray[300]} size={12} />
          <View style={styles.info}>
            <Text style={[styles.name, remainderStyles.name]}>Remainder</Text>
            <Text style={styles.destination}>Stay in {accountName}</Text>
          </View>
        </View>
        <View style={styles.right}>
          <CompactAmount amount={amount} color={Colors.text.muted} />
          <Text style={styles.percentage}>{Math.round(percentage)}%</Text>
        </View>
      </View>
    </View>
  );
}

const remainderStyles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: BorderRadius.xl,
    padding: Spacing[4],
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.border.dashed,
  },
  name: {
    color: Colors.text.muted,
  },
});
