/**
 * Split Allocation Screen
 * Interactive allocation view with draggable donut chart
 *
 * Stories: 49, 50, 51, 52
 */

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  ActivityIndicator,
  Modal,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';

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
  const { id: depositId, templateId } = useLocalSearchParams<{ id: string; templateId?: string }>();
  const insets = useSafeAreaInsets();

  // Fetch real data
  const { deposit, isLoading: depositLoading } = useDeposit(depositId || '');
  const { buckets, isLoading: bucketsLoading } = useBuckets();

  // State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [allocations, setAllocations] = useState<DonutSegment[]>(MOCK_ALLOCATIONS);
  const [showAddBucket, setShowAddBucket] = useState(false);
  const [templateInitialized, setTemplateInitialized] = useState(false);

  // Swipeable refs to close open rows when adding
  const swipeableRefs = useRef<Map<string, Swipeable | null>>(new Map());

  // Use mock or real data
  const depositAmount = deposit?.amount || MOCK_DEPOSIT_AMOUNT;
  const isFetching = depositLoading || bucketsLoading;

  // Pre-fill from template if templateId provided
  useEffect(() => {
    if (!templateId || buckets.length === 0 || templateInitialized) return;
    api.getSplitTemplate(templateId).then((template) => {
      const segments: DonutSegment[] = template.items.map((item, index) => {
        const bucket = buckets.find((b) => b.id === item.bucket_id);
        const percentage =
          item.allocation_type === 'percentage'
            ? item.allocation_value
            : depositAmount > 0
            ? Math.round((item.allocation_value / depositAmount) * 1000) / 10
            : 10;
        return {
          id: item.bucket_id,
          name: bucket?.name || item.bucket?.name || 'Bucket',
          percentage,
          color: bucket?.color || item.bucket?.color || BucketColors[index % BucketColors.length],
        };
      });
      setAllocations(segments);
      setTemplateInitialized(true);
    }).catch(() => {
      setTemplateInitialized(true); // fall through to bucket defaults
    });
  }, [templateId, buckets, depositAmount, templateInitialized]);

  // Initialize from buckets when loaded (skipped if template pre-filled)
  useEffect(() => {
    if (templateId) return;
    if (buckets.length > 0) {
      const bucketAllocations: DonutSegment[] = buckets.map((bucket, index) => ({
        id: bucket.id,
        name: bucket.name,
        percentage: bucket.bucket_type === 'percentage' ? bucket.allocation_value : 10,
        color: bucket.color || BucketColors[index % BucketColors.length],
      }));
      setAllocations(bucketAllocations);
    }
  }, [buckets, templateId]);

  // Buckets not currently in the allocation
  const availableBuckets = useMemo(() => {
    const activeIds = new Set(allocations.map((a) => a.id));
    return buckets.filter((b) => !activeIds.has(b.id));
  }, [buckets, allocations]);

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

  // Remove a bucket from the current allocation
  const handleRemove = useCallback((id: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setAllocations((prev) => prev.filter((a) => a.id !== id));
    swipeableRefs.current.delete(id);
  }, []);

  // Add a bucket back to the allocation
  const handleAddBucket = useCallback(
    (bucketId: string) => {
      const bucket = buckets.find((b) => b.id === bucketId);
      if (!bucket) return;
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      const index = buckets.indexOf(bucket);
      setAllocations((prev) => [
        ...prev,
        {
          id: bucket.id,
          name: bucket.name,
          percentage: 10,
          color: bucket.color || BucketColors[index % BucketColors.length],
        },
      ]);
      setShowAddBucket(false);
    },
    [buckets]
  );

  // Handlers
  const handleConfirm = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setIsSubmitting(true);

    try {
      const actions = allocations.map((allocation) => ({
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
                <Swipeable
                  key={allocation.id}
                  ref={(ref) => {
                    if (ref) swipeableRefs.current.set(allocation.id, ref);
                    else swipeableRefs.current.delete(allocation.id);
                  }}
                  renderRightActions={() => (
                    <TouchableOpacity
                      style={styles.removeAction}
                      onPress={() => handleRemove(allocation.id)}
                    >
                      <Ionicons name="trash-outline" size={20} color="white" />
                      <Text style={styles.removeActionText}>Remove</Text>
                    </TouchableOpacity>
                  )}
                  overshootRight={false}
                >
                  <View style={styles.allocationRow}>
                    <View style={styles.allocationLeft}>
                      <View style={[styles.colorDot, { backgroundColor: allocation.color }]} />
                      <Text style={styles.allocationName}>{allocation.name}</Text>
                    </View>
                    <View style={styles.allocationRight}>
                      <Text style={styles.allocationPercent}>
                        {Math.round(allocation.percentage)}%
                      </Text>
                      <Text style={styles.allocationAmount}>{formatCurrency(amount)}</Text>
                    </View>
                  </View>
                </Swipeable>
              );
            })}

            {/* Add Bucket Button */}
            <TouchableOpacity
              style={styles.addBucketRow}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowAddBucket(true);
              }}
            >
              <View style={styles.addBucketIcon}>
                <Ionicons name="add" size={18} color={Colors.primary} />
              </View>
              <Text style={styles.addBucketText}>Add Bucket</Text>
            </TouchableOpacity>
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

      {/* Add Bucket Bottom Sheet */}
      <Modal
        visible={showAddBucket}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddBucket(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowAddBucket(false)}
        />
        <View style={[styles.addBucketSheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Add Bucket</Text>
          <Text style={styles.sheetSubtitle}>
            Tap a bucket to include it in this split.
          </Text>

          {availableBuckets.length === 0 ? (
            <View style={styles.emptySheetContent}>
              <Ionicons name="checkmark-circle-outline" size={40} color={Colors.text.muted} />
              <Text style={styles.emptySheetText}>All buckets are already in this split.</Text>
            </View>
          ) : (
            <FlatList
              data={availableBuckets}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  style={styles.bucketPickerRow}
                  onPress={() => handleAddBucket(item.id)}
                >
                  <View
                    style={[
                      styles.bucketPickerDot,
                      { backgroundColor: item.color || BucketColors[index % BucketColors.length] },
                    ]}
                  />
                  <View style={styles.bucketPickerInfo}>
                    <Text style={styles.bucketPickerName}>{item.name}</Text>
                    <Text style={styles.bucketPickerSub}>
                      {item.bucket_type === 'percentage'
                        ? `${item.allocation_value}% allocation`
                        : `$${item.allocation_value} fixed`}
                    </Text>
                  </View>
                  <Ionicons name="add-circle-outline" size={24} color={Colors.primary} />
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.bucketPickerDivider} />}
            />
          )}
        </View>
      </Modal>
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

  // Swipe remove action
  removeAction: {
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    borderRadius: BorderRadius.xl,
    flexDirection: 'column',
    gap: 4,
    marginLeft: Spacing[2],
  },
  removeActionText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xs,
    color: 'white',
  },

  // Add Bucket row
  addBucketRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    padding: Spacing[4],
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    borderColor: Colors.border.light,
    borderStyle: 'dashed',
  },
  addBucketIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: `${Colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBucketText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    color: Colors.primary,
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

  // Add Bucket Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  addBucketSheet: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: Spacing.page,
    paddingTop: Spacing[4],
    maxHeight: '60%',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border.light,
    alignSelf: 'center',
    marginBottom: Spacing[5],
  },
  sheetTitle: {
    fontFamily: FontFamily.black,
    fontSize: FontSize.xl,
    color: Colors.text.primary,
    marginBottom: Spacing[1],
  },
  sheetSubtitle: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.text.muted,
    marginBottom: Spacing[5],
  },
  emptySheetContent: {
    alignItems: 'center',
    paddingVertical: Spacing[8],
    gap: Spacing[3],
  },
  emptySheetText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.md,
    color: Colors.text.muted,
    textAlign: 'center',
  },
  bucketPickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing[4],
    gap: Spacing[4],
  },
  bucketPickerDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    flexShrink: 0,
  },
  bucketPickerInfo: {
    flex: 1,
  },
  bucketPickerName: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    color: Colors.text.primary,
  },
  bucketPickerSub: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.text.muted,
    marginTop: 2,
  },
  bucketPickerDivider: {
    height: 1,
    backgroundColor: Colors.border.subtle,
  },
});
