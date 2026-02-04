/**
 * Confirmation Screen
 * Review and confirm split distribution before execution
 *
 * Stories: 58, 59, 60, 61
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

import { Colors, BucketColors } from '@/constants/colors';
import { FontFamily, FontSize } from '@/constants/typography';
import { BorderRadius, Spacing, Size } from '@/constants/spacing';
import { Shadows } from '@/constants/shadows';
import {
  Header,
  Card,
  Button,
  BottomActionBar,
} from '@/components';

// Mock data for development
const MOCK_DEPOSIT = {
  amount: 1200,
  sourceAccount: {
    name: 'Chase Checking',
    lastFour: '4920',
  },
  date: 'MAY 24, 2024',
};

const MOCK_ALLOCATIONS = [
  {
    id: 'tithe',
    name: 'Tithe',
    destination: 'Transfer to Better Together',
    amount: 120,
    percentage: 10,
    color: BucketColors[0],
  },
  {
    id: 'savings',
    name: 'Savings',
    destination: 'High-Yield Savings ••0122',
    amount: 180,
    percentage: 15,
    color: BucketColors[1],
  },
  {
    id: 'investing',
    name: 'Investing',
    destination: 'Vanguard Brokerage ••8829',
    amount: 120,
    percentage: 10,
    color: BucketColors[2],
  },
];

interface AllocationItem {
  id: string;
  name: string;
  destination: string;
  amount: number;
  percentage: number;
  color: string;
}

export default function ConfirmationScreen() {
  const router = useRouter();
  const { id: depositId } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();

  // State
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculated values
  const totalAllocated = useMemo(() => {
    return MOCK_ALLOCATIONS.reduce((sum, a) => sum + a.amount, 0);
  }, []);

  const remainder = useMemo(() => {
    return MOCK_DEPOSIT.amount - totalAllocated;
  }, [totalAllocated]);

  const remainderPercentage = useMemo(() => {
    return Math.round((remainder / MOCK_DEPOSIT.amount) * 100);
  }, [remainder]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Handlers
  const handleConfirm = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setIsSubmitting(true);

    try {
      // TODO: Execute split via API
      // Navigate to processing screen first, then complete
      router.push(`/deposit/${depositId}/processing`);
    } catch (error) {
      console.error('Failed to execute split:', error);
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  return (
    <View style={styles.container}>
      <Header showBack onBack={handleBack} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Size.bottomBarHeight + insets.bottom + Spacing[8] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Page Title */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>Review Split</Text>
          <Text style={styles.subtitle}>
            Confirm the distribution of your deposit
          </Text>
        </View>

        {/* Main Deposit Card */}
        <Card variant="large" style={styles.depositCard}>
          <View style={styles.depositHeader}>
            <View style={styles.depositIconContainer}>
              <Ionicons
                name="arrow-down"
                size={24}
                color={Colors.primary.DEFAULT}
              />
            </View>
            <View style={styles.depositInfo}>
              <Text style={styles.depositLabel}>INCOMING DEPOSIT</Text>
              <Text style={styles.depositAmount}>
                {formatCurrency(MOCK_DEPOSIT.amount)}
              </Text>
            </View>
          </View>
          <View style={styles.depositFooter}>
            <View style={styles.depositAccount}>
              <Ionicons name="business-outline" size={16} color={Colors.text.muted} />
              <Text style={styles.depositAccountText}>
                {MOCK_DEPOSIT.sourceAccount.name} ••{MOCK_DEPOSIT.sourceAccount.lastFour}
              </Text>
            </View>
            <Text style={styles.depositDate}>{MOCK_DEPOSIT.date}</Text>
          </View>
        </Card>

        {/* Distribution Section */}
        <View style={styles.distributionSection}>
          <Text style={styles.sectionLabel}>DISTRIBUTION</Text>

          <View style={styles.allocationList}>
            {MOCK_ALLOCATIONS.map((allocation) => (
              <AllocationRow key={allocation.id} allocation={allocation} />
            ))}

            {/* Remainder Row */}
            <View style={[styles.allocationRow, styles.remainderRow]}>
              <View style={styles.allocationLeft}>
                <View style={[styles.colorDot, styles.remainderDot]} />
                <View>
                  <Text style={styles.remainderName}>Remainder</Text>
                  <Text style={styles.allocationDestination}>
                    Stay in Chase Checking
                  </Text>
                </View>
              </View>
              <View style={styles.allocationRight}>
                <Text style={styles.remainderAmount}>{formatCurrency(remainder)}</Text>
                <Text style={styles.allocationPercentage}>{remainderPercentage}%</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Details Card */}
        <Card style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Execution</Text>
            <Text style={styles.detailValue}>Instant (Estimated)</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Service Fees</Text>
            <Text style={styles.detailValue}>$0.00</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Allocated</Text>
            <Text style={styles.totalValue}>{formatCurrency(MOCK_DEPOSIT.amount)}</Text>
          </View>
        </Card>
      </ScrollView>

      {/* Bottom Action Bar */}
      <BottomActionBar>
        <Button onPress={handleConfirm} loading={isSubmitting}>
          Confirm & Distribute
        </Button>
        <Pressable onPress={handleBack} style={styles.backLink}>
          <Text style={styles.backLinkText}>Back to adjustments</Text>
        </Pressable>
      </BottomActionBar>
    </View>
  );
}

// Allocation Row Component
function AllocationRow({ allocation }: { allocation: AllocationItem }) {
  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <View style={styles.allocationRow}>
      <View style={styles.allocationLeft}>
        <View style={[styles.colorDot, { backgroundColor: allocation.color }]} />
        <View>
          <Text style={styles.allocationName}>{allocation.name}</Text>
          <Text style={styles.allocationDestination}>{allocation.destination}</Text>
        </View>
      </View>
      <View style={styles.allocationRight}>
        <Text style={styles.allocationAmount}>{formatCurrency(allocation.amount)}</Text>
        <Text style={styles.allocationPercentage}>{allocation.percentage}%</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.page,
    paddingTop: Spacing[6],
    gap: Spacing[8],
  },
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
  depositCard: {
    padding: Spacing[6],
  },
  depositHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[4],
    marginBottom: Spacing[4],
  },
  depositIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    backgroundColor: `${Colors.primary.DEFAULT}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  depositInfo: {
    flex: 1,
  },
  depositLabel: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xs,
    color: Colors.text.muted,
    letterSpacing: 1.5,
    marginBottom: Spacing[1],
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
    borderTopColor: Colors.border.light,
  },
  depositAccount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  depositAccountText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.text.muted,
  },
  depositDate: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xs,
    color: Colors.text.tertiary,
    letterSpacing: 0.5,
  },
  distributionSection: {
    gap: Spacing[4],
  },
  sectionLabel: {
    fontFamily: FontFamily.black,
    fontSize: FontSize.xs,
    color: Colors.text.muted,
    letterSpacing: 2,
    paddingHorizontal: Spacing[1],
  },
  allocationList: {
    gap: Spacing[3],
  },
  allocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    padding: Spacing[4],
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
  remainderRow: {
    backgroundColor: 'transparent',
    borderStyle: 'dashed',
    borderColor: Colors.border.default,
  },
  allocationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  remainderDot: {
    backgroundColor: Colors.border.default,
  },
  allocationName: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    color: Colors.text.secondary,
  },
  remainderName: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    color: Colors.text.muted,
  },
  allocationDestination: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.text.muted,
    marginTop: 2,
  },
  allocationRight: {
    alignItems: 'flex-end',
  },
  allocationAmount: {
    fontFamily: FontFamily.black,
    fontSize: FontSize.md,
    color: Colors.text.primary,
  },
  remainderAmount: {
    fontFamily: FontFamily.black,
    fontSize: FontSize.md,
    color: Colors.text.muted,
  },
  allocationPercentage: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.text.muted,
    marginTop: 2,
  },
  detailsCard: {
    padding: Spacing[6],
    gap: Spacing[4],
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.text.muted,
  },
  detailValue: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing[4],
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  totalLabel: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    color: Colors.text.primary,
  },
  totalValue: {
    fontFamily: FontFamily.black,
    fontSize: FontSize.lg,
    color: Colors.primary.DEFAULT,
  },
  backLink: {
    alignItems: 'center',
    paddingVertical: Spacing[2],
  },
  backLinkText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.md,
    color: Colors.text.muted,
  },
});
