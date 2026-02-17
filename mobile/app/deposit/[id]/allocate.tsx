/**
 * Split Allocation Screen
 * Interactive allocation view with draggable donut chart
 *
 * Stories: 49, 50, 51, 52
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
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
import { DonutChart } from '@/components/DonutChart';
import type { DonutSegment } from '@/components/DonutChart/types';
import { useDeposit, useBuckets } from '@/hooks';
import * as api from '@/services/api';

// Mock data for testing when API not available
const MOCK_DEPOSIT_AMOUNT = 1200;
const MOCK_ALLOCATIONS: DonutSegment[] = [
  { id: 'tithe', name: 'Tithe', percentage: 10, color: '#0EA5A5' },
  { id: 'savings', name: 'Savings', percentage: 15, color: '#3B82F6' },
  { id: 'investing', name: 'Investing', percentage: 10, color: '#10B981' },
];

export default function SplitAllocationScreen() {
  const router = useRouter();
  const { id: depositId } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();

  // Fetch real data
  const { deposit, isLoading: depositLoading } = useDeposit(depositId || '');
  const { buckets, isLoading: bucketsLoading } = useBuckets();

  // State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [allocations, setAllocations] = useState<DonutSegment[]>(MOCK_ALLOCATIONS);

  // Use mock or real data
  const depositAmount = deposit?.amount || MOCK_DEPOSIT_AMOUNT;
  const isFetching = depositLoading || bucketsLoading;

  // Initialize from buckets when loaded
  useEffect(() => {
    if (buckets.length > 0) {
      const bucketAllocations: DonutSegment[] = buckets.map((bucket, index) => ({
        id: bucket.id,
        name: bucket.name,
        percentage: bucket.bucket_type === 'percentage' ? bucket.allocation_value : 10,
        color: bucket.color || BucketColors[index % BucketColors.length],
      }));
      setAllocations(bucketAllocations);
    }
  }, [buckets]);

  // Calculated values
  const totalAllocated = useMemo(() => {
    return allocations.reduce((sum, a) => sum + a.percentage, 0);
  }, [allocations]);

  const remainder = useMemo(() => {
    return Math.max(0, 100 - totalAllocated);
  }, [totalAllocated]);

  const remainderAmount = useMemo(() => {
    return (remainder / 100) * depositAmount;
  }, [remainder, depositAmount]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Handle segment changes from donut chart
  const handleSegmentsChange = useCallback((newSegments: DonutSegment[]) => {
    setAllocations(newSegments);
  }, []);

  // Handlers
  const handleConfirm = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setIsSubmitting(true);

    try {
      // Create split plan with current allocations
      const actions = allocations.map(allocation => ({
        bucket_id: allocation.id,
        amount: (allocation.percentage / 100) * depositAmount,
      }));

      await api.createSplitPlan({
        deposit_id: depositId || '',
        total_amount: depositAmount,
        actions,
      });

      router.push(`/deposit/${depositId}/confirm`);
    } catch (error) {
      console.error('Failed to save allocation:', error);
      // Navigate anyway for testing
      router.push(`/deposit/${depositId}/confirm`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeepInChecking = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.replace('/(tabs)');
  };

  const handleSettings = () => {
    router.push('/buckets/configure');
  };

  // Center content for donut chart
  const centerContent = (
    <View style={styles.donutCenter}>
      <Text style={styles.centerLabel}>SPLIT PLAN</Text>
      <Text style={styles.centerAmount}>{formatCurrency(depositAmount)}</Text>
      <Text style={styles.centerHint}>Drag to adjust</Text>
    </View>
  );

  // Show loading
  if (isFetching && allocations.length === 0) {
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
        <Pressable onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="chevron-back" size={24} color={Colors.text.muted} />
        </Pressable>
        <Text style={styles.headerTitle}>FlowSplit</Text>
        <Pressable onPress={handleSettings} style={styles.headerButton}>
          <Ionicons name="settings-outline" size={24} color={Colors.text.muted} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 180 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Chart Card */}
        <View style={styles.chartCard}>
          {/* Donut Chart */}
          <View style={styles.donutContainer}>
            <DonutChart
              segments={allocations}
              total={depositAmount}
              onSegmentsChange={handleSegmentsChange}
              editable={true}
              size={260}
              strokeWidth={16}
              showHandles={true}
              showLabels={false}
              centerContent={centerContent}
            />
          </View>

          {/* Allocation List */}
          <View style={styles.allocationList}>
            {allocations.map((allocation) => {
              const amount = (allocation.percentage / 100) * depositAmount;
              return (
                <View key={allocation.id} style={styles.allocationRow}>
                  <View style={styles.allocationLeft}>
                    <View style={[styles.colorDot, { backgroundColor: allocation.color }]} />
                    <Text style={styles.allocationName}>{allocation.name}</Text>
                  </View>
                  <View style={styles.allocationRight}>
                    <Text style={styles.allocationPercent}>{Math.round(allocation.percentage)}%</Text>
                    <Text style={styles.allocationAmount}>{formatCurrency(amount)}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Remainder Card */}
        <View style={styles.remainderCard}>
          <View style={styles.remainderLeft}>
            <View style={styles.remainderIcon}>
              <Ionicons name="business-outline" size={20} color={Colors.text.muted} />
            </View>
            <View>
              <Text style={styles.remainderLabel}>MAIN WALLET</Text>
              <Text style={styles.remainderTitle}>Checking Remainder</Text>
            </View>
          </View>
          <View style={styles.remainderRight}>
            <Text style={styles.remainderPercent}>{Math.round(remainder)}%</Text>
            <Text style={styles.remainderAmount}>{formatCurrency(remainderAmount)}</Text>
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
            <Text style={styles.primaryButtonText}>
              Confirm {formatCurrency(depositAmount)} Split
            </Text>
          )}
        </Pressable>
        <Pressable onPress={handleKeepInChecking} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>KEEP EVERYTHING IN CHECKING</Text>
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
    paddingTop: 56,
    paddingHorizontal: Spacing.page,
    paddingBottom: Spacing[4],
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
    fontFamily: FontFamily.black,
    fontSize: 17,
    color: Colors.text.primary,
    letterSpacing: -0.25,
  },

  // ScrollView
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing[5],
    gap: Spacing[6],
  },

  // Chart Card
  chartCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.card,
    padding: Spacing[6],
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    ...Shadows.card,
  },
  donutContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[8],
  },
  donutCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 160,
    height: 160,
  },
  centerLabel: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xs,
    color: Colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: LetterSpacing.widest,
    marginBottom: Spacing[0.5],
  },
  centerAmount: {
    fontFamily: FontFamily.black,
    fontSize: 28,
    color: Colors.text.primary,
  },
  centerHint: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.xs,
    color: Colors.text.muted,
    marginTop: Spacing[0.5],
  },

  // Allocation List
  allocationList: {
    gap: Spacing[3],
  },
  allocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: `${Colors.gray[50]}80`,
    padding: Spacing[4],
    borderRadius: BorderRadius.xl,
  },
  allocationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  allocationName: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    color: Colors.text.secondary,
  },
  allocationRight: {
    alignItems: 'flex-end',
  },
  allocationPercent: {
    fontFamily: FontFamily.black,
    fontSize: FontSize.md,
    color: Colors.text.primary,
  },
  allocationAmount: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.text.muted,
  },

  // Remainder Card
  remainderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing[5],
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    ...Shadows.card,
  },
  remainderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[4],
  },
  remainderIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.gray[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  remainderLabel: {
    fontFamily: FontFamily.black,
    fontSize: FontSize.xs,
    color: Colors.text.muted,
    letterSpacing: LetterSpacing.wider,
    marginBottom: Spacing[0.5],
  },
  remainderTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    color: Colors.text.secondary,
  },
  remainderRight: {
    alignItems: 'flex-end',
  },
  remainderPercent: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xs,
    color: Colors.text.muted,
    marginBottom: Spacing[0.5],
  },
  remainderAmount: {
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
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xs,
    color: Colors.text.muted,
    letterSpacing: 0.5,
  },
});
