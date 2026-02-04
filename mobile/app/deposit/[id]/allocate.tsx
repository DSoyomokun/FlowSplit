/**
 * Split Allocation Screen
 * Interactive donut chart for adjusting allocation percentages
 *
 * Stories: 49, 50, 51, 52
 */

import React, { useState, useCallback, useMemo } from 'react';
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
  DonutChart,
  DonutSkeleton,
  BucketCard,
  BucketCardList,
  RemainderCard,
  Button,
  BottomActionBar,
  TabBar,
  SectionLabel,
} from '@/components';
import { DonutSegment as DonutSegmentType } from '@/components/DonutChart/types';

// Mock data for development
const MOCK_DEPOSIT_AMOUNT = 1200;
const MOCK_BUCKETS: DonutSegmentType[] = [
  { id: 'tithe', name: 'Tithe', percentage: 10, color: BucketColors[0] },
  { id: 'savings', name: 'Savings', percentage: 15, color: BucketColors[1] },
  { id: 'investing', name: 'Investing', percentage: 10, color: BucketColors[2] },
];

export default function SplitAllocationScreen() {
  const router = useRouter();
  const { id: depositId } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();

  // State
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [segments, setSegments] = useState<DonutSegmentType[]>(MOCK_BUCKETS);
  const [depositAmount] = useState(MOCK_DEPOSIT_AMOUNT);

  // Calculated values
  const totalAllocated = useMemo(() => {
    return segments.reduce((sum, s) => sum + s.percentage, 0);
  }, [segments]);

  const remainder = useMemo(() => {
    return 100 - totalAllocated;
  }, [totalAllocated]);

  const remainderAmount = useMemo(() => {
    return (remainder / 100) * depositAmount;
  }, [remainder, depositAmount]);

  // Convert segments to bucket cards format with calculated amounts
  const bucketCards = useMemo(() => {
    return segments.map((segment) => ({
      id: segment.id,
      name: segment.name,
      percentage: segment.percentage,
      amount: (segment.percentage / 100) * depositAmount,
      color: segment.color,
    }));
  }, [segments, depositAmount]);

  // Handlers
  const handleSegmentsChange = useCallback((newSegments: DonutSegmentType[]) => {
    setSegments(newSegments);
    Haptics.selectionAsync();
  }, []);

  const handleConfirm = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);

    try {
      // TODO: Save allocation to backend
      router.push(`/deposit/${depositId}/confirm`);
    } catch (error) {
      console.error('Failed to save allocation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeepInChecking = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // TODO: Handle keep all in checking flow
    router.back();
  };

  const handleTabPress = (tabId: string) => {
    Haptics.selectionAsync();
    switch (tabId) {
      case 'split':
        // Already on split screen
        break;
      case 'buckets':
        router.push('/buckets/configure');
        break;
      case 'history':
        router.push('/(tabs)/history');
        break;
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Donut center content
  const centerContent = (
    <View style={styles.centerContent}>
      <Text style={styles.centerLabel}>Split Plan</Text>
      <Text style={styles.centerAmount}>{formatCurrency(depositAmount)}</Text>
      <Text style={styles.centerHint}>Drag to adjust</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header
        showBack
        rightAction="settings"
        onRightAction={() => router.push('/buckets/configure')}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Size.bottomBarHeight + insets.bottom + Spacing[8] + 60 }, // Extra for tabs
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Interactive Chart Card */}
        <Card variant="large" style={styles.chartCard}>
          {isFetching ? (
            <DonutSkeleton size={260} />
          ) : (
            <DonutChart
              segments={segments}
              total={depositAmount}
              onSegmentsChange={handleSegmentsChange}
              editable={true}
              size={260}
              centerContent={centerContent}
            />
          )}

          {/* Allocation List */}
          <View style={styles.allocationList}>
            {bucketCards.map((bucket) => (
              <BucketCard
                key={bucket.id}
                id={bucket.id}
                name={bucket.name}
                percentage={bucket.percentage}
                amount={bucket.amount}
                color={bucket.color}
                compact
              />
            ))}
          </View>
        </Card>

        {/* Remainder Section */}
        <RemainderCard
          amount={remainderAmount}
          percentage={remainder}
          label="Checking Remainder"
          subLabel="Main Wallet"
        />
      </ScrollView>

      {/* Bottom Action Bar */}
      <BottomActionBar>
        <Button onPress={handleConfirm} loading={isLoading}>
          Confirm {formatCurrency(depositAmount)} Split
        </Button>
        <Pressable onPress={handleKeepInChecking} style={styles.secondaryLink}>
          <Text style={styles.secondaryLinkText}>KEEP EVERYTHING IN CHECKING</Text>
        </Pressable>

        {/* Tab Bar */}
        <View style={styles.tabBarContainer}>
          <TabBar
            tabs={[
              { id: 'split', label: 'Split', icon: 'pie-chart-outline' },
              { id: 'buckets', label: 'Buckets', icon: 'layers-outline' },
              { id: 'history', label: 'History', icon: 'time-outline' },
            ]}
            activeTab="split"
            onTabPress={handleTabPress}
          />
        </View>
      </BottomActionBar>
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
    paddingTop: Spacing[5],
    gap: Spacing[6],
  },
  chartCard: {
    alignItems: 'center',
    paddingVertical: Spacing[8],
    ...Shadows.card,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerLabel: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xs,
    color: Colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: Spacing[1],
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
    marginTop: Spacing[1],
  },
  allocationList: {
    width: '100%',
    marginTop: Spacing[10],
    gap: Spacing[3],
  },
  secondaryLink: {
    alignItems: 'center',
    paddingVertical: Spacing[2],
  },
  secondaryLinkText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xs,
    color: Colors.text.muted,
    letterSpacing: 0.5,
  },
  tabBarContainer: {
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    paddingTop: Spacing[2],
    marginTop: Spacing[1],
  },
});
