/**
 * Split Confirmation Screen
 * Review allocations before executing - matches Variants2/05-confirmation.html
 *
 * Stories: 58, 59, 60, 61
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

import { Colors, BucketColors } from '@/constants/colors';
import { FontFamily, FontSize, LetterSpacing } from '@/constants/typography';
import { BorderRadius, Spacing } from '@/constants/spacing';
import { Shadows } from '@/constants/shadows';
import { useDeposit, useBuckets, useSplitPlan } from '@/hooks';

// Mock data for testing
const MOCK_DEPOSIT_AMOUNT = 1200;
const MOCK_ALLOCATIONS = [
  { id: 'tithe', name: 'Tithe', amount: 120, percentage: 10, color: '#0EA5A5', destination: 'Transfer to Better Together' },
  { id: 'savings', name: 'Savings', amount: 180, percentage: 15, color: '#3B82F6', destination: 'High-Yield Savings ••0122' },
  { id: 'investing', name: 'Investing', amount: 120, percentage: 10, color: '#10B981', destination: 'Vanguard Brokerage ••8829' },
];

export default function SplitConfirmScreen() {
  const router = useRouter();
  const { id: depositId } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();

  // Fetch data
  const { deposit, isLoading: depositLoading } = useDeposit(depositId || '');
  const { buckets, isLoading: bucketsLoading } = useBuckets();
  const { plan, preview, isLoading: planLoading } = useSplitPlan(depositId || '');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const isLoading = depositLoading || bucketsLoading || planLoading;
  const depositAmount = deposit?.amount || preview?.total_amount || MOCK_DEPOSIT_AMOUNT;

  // Build allocation list
  const planActions = plan?.actions || [];
  const previewActions = preview?.actions || [];
  const sourceActions = planActions.length > 0 ? planActions : previewActions;

  const allocations = sourceActions.length > 0
    ? sourceActions.map((action, index) => {
        const bucket = buckets.find(b => b.id === action.bucket_id);
        return {
          id: action.bucket_id,
          name: bucket?.name || 'Bucket',
          amount: action.amount,
          percentage: Math.round((action.amount / depositAmount) * 100),
          color: bucket?.color || BucketColors[index % BucketColors.length],
          destination: bucket?.name || 'Transfer',
        };
      })
    : MOCK_ALLOCATIONS;

  const totalAllocated = allocations.reduce((sum: number, a) => sum + a.amount, 0);
  const remainder = depositAmount - totalAllocated;
  const remainderPercentage = Math.round((remainder / depositAmount) * 100);

  // Format currency
  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Handlers
  const handleBack = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  };

  const handleConfirm = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      router.push(`/deposit/${depositId}/processing`);
    } catch (error) {
      console.error('Failed to execute split:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.headerButton}>
          <Ionicons name="chevron-back" size={24} color={Colors.text.muted} />
        </Pressable>
        <Text style={styles.headerTitle}>FlowSplit</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 180 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>Review Split</Text>
          <Text style={styles.subtitle}>Confirm the distribution of your deposit</Text>
        </View>

        {/* Deposit Card */}
        <View style={styles.depositCard}>
          <View style={styles.depositHeader}>
            <View style={styles.depositIcon}>
              <Ionicons name="arrow-down" size={24} color={Colors.primary} />
            </View>
            <View>
              <Text style={styles.depositLabel}>INCOMING DEPOSIT</Text>
              <Text style={styles.depositAmount}>{formatCurrency(depositAmount)}</Text>
            </View>
          </View>
          <View style={styles.depositFooter}>
            <View style={styles.depositAccount}>
              <Ionicons name="business-outline" size={16} color={Colors.text.muted} />
              <Text style={styles.depositAccountText}>Chase Checking ••4920</Text>
            </View>
            <Text style={styles.depositDate}>MAY 24, 2024</Text>
          </View>
        </View>

        {/* Distribution Section */}
        <View style={styles.distributionSection}>
          <Text style={styles.sectionLabel}>DISTRIBUTION</Text>

          <View style={styles.distributionList}>
            {/* Allocations */}
            {allocations.map((allocation) => (
              <View key={allocation.id} style={styles.distributionCard}>
                <View style={styles.distributionLeft}>
                  <View style={[styles.colorDot, { backgroundColor: allocation.color }]} />
                  <View>
                    <Text style={styles.distributionName}>{allocation.name}</Text>
                    <Text style={styles.distributionDestination}>{allocation.destination}</Text>
                  </View>
                </View>
                <View style={styles.distributionRight}>
                  <Text style={styles.distributionAmount}>{formatCurrency(allocation.amount)}</Text>
                  <Text style={styles.distributionPercentage}>{allocation.percentage}%</Text>
                </View>
              </View>
            ))}

            {/* Remainder */}
            <View style={styles.remainderCard}>
              <View style={styles.distributionLeft}>
                <View style={[styles.colorDot, { backgroundColor: Colors.gray[300] }]} />
                <View>
                  <Text style={styles.remainderName}>Remainder</Text>
                  <Text style={styles.distributionDestination}>Stay in Chase Checking</Text>
                </View>
              </View>
              <View style={styles.distributionRight}>
                <Text style={styles.remainderAmount}>{formatCurrency(remainder)}</Text>
                <Text style={styles.distributionPercentage}>{remainderPercentage}%</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Details Card */}
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Execution</Text>
            <Text style={styles.detailValue}>Instant (Estimated)</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Service Fees</Text>
            <Text style={styles.detailValue}>$0.00</Text>
          </View>
          <View style={styles.detailDivider} />
          <View style={styles.detailRow}>
            <Text style={styles.totalLabel}>Total Allocated</Text>
            <Text style={styles.totalValue}>{formatCurrency(depositAmount)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 24 }]}>
        <Pressable
          style={[styles.primaryButton, isSubmitting && styles.buttonDisabled]}
          onPress={handleConfirm}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.primaryButtonText}>Confirm & Distribute</Text>
          )}
        </Pressable>
        <Pressable onPress={handleBack} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Back to adjustments</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 64,
    paddingHorizontal: Spacing.page,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  headerButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 18,
    color: Colors.text.primary,
    letterSpacing: -0.25,
  },

  // ScrollView
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Spacing[6],
    paddingHorizontal: Spacing.page,
    gap: Spacing[8],
  },

  // Title Section
  titleSection: {
    gap: Spacing[1],
  },
  title: {
    fontFamily: FontFamily.black,
    fontSize: FontSize['2xl'],
    color: Colors.text.primary,
  },
  subtitle: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.md,
    color: Colors.text.muted,
  },

  // Deposit Card
  depositCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.card,
    padding: Spacing[6],
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    ...Shadows.card,
  },
  depositHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[4],
    marginBottom: Spacing[4],
  },
  depositIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.xl,
    backgroundColor: `${Colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  depositLabel: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.sm,
    color: Colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: LetterSpacing.widest,
  },
  depositAmount: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.lg,
    color: Colors.text.primary,
  },
  depositFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing[4],
    borderTopWidth: 1,
    borderTopColor: Colors.gray[50],
  },
  depositAccount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  depositAccountText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.base,
    color: Colors.text.muted,
  },
  depositDate: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xs,
    color: Colors.text.light,
  },

  // Distribution Section
  distributionSection: {
    gap: Spacing[4],
  },
  sectionLabel: {
    fontFamily: FontFamily.black,
    fontSize: FontSize.xs,
    color: Colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: LetterSpacing.widest,
    paddingHorizontal: Spacing[1],
  },
  distributionList: {
    gap: Spacing[3],
  },
  distributionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    padding: Spacing[4],
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
  distributionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  distributionName: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    color: Colors.text.secondary,
  },
  distributionDestination: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.text.muted,
    marginTop: 2,
  },
  distributionRight: {
    alignItems: 'flex-end',
  },
  distributionAmount: {
    fontFamily: FontFamily.black,
    fontSize: FontSize.md,
    color: Colors.text.primary,
  },
  distributionPercentage: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.text.muted,
    marginTop: 2,
  },

  // Remainder Card
  remainderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    padding: Spacing[4],
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.gray[200],
  },
  remainderName: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    color: Colors.text.muted,
  },
  remainderAmount: {
    fontFamily: FontFamily.black,
    fontSize: FontSize.md,
    color: Colors.text.muted,
  },

  // Details Card
  detailsCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing[6],
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    ...Shadows.card,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing[2],
  },
  detailLabel: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.base,
    color: Colors.text.muted,
  },
  detailValue: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.base,
    color: Colors.text.secondary,
  },
  detailDivider: {
    height: 1,
    backgroundColor: Colors.gray[50],
    marginVertical: Spacing[4],
  },
  totalLabel: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    color: Colors.text.primary,
  },
  totalValue: {
    fontFamily: FontFamily.black,
    fontSize: FontSize.lg,
    color: Colors.primary,
  },

  // Bottom Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    paddingHorizontal: Spacing.page,
    paddingTop: Spacing[6],
    gap: Spacing[3],
    ...Shadows.card,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.xl,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.buttonPrimary,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    color: 'white',
  },
  secondaryButton: {
    paddingVertical: Spacing[2],
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.md,
    color: Colors.text.muted,
  },
});
