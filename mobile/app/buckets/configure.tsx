/**
 * Bucket Configuration Screen
 * Manage destination buckets with loading, empty, and error states
 *
 * Stories: 53, 54, 55, 56, 57
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { Colors, BucketColors } from '@/constants/colors';
import { FontFamily, FontSize } from '@/constants/typography';
import { BorderRadius, Spacing, Size } from '@/constants/spacing';
import { Shadows } from '@/constants/shadows';
import {
  Header,
  BucketConfigCard,
  AddBucketButton,
  Button,
  BottomActionBar,
  Skeleton,
  SkeletonCard,
  EmptyBuckets,
} from '@/components';
import { useBuckets } from '@/hooks';

// Mock buckets for development
const MOCK_BUCKETS = [
  {
    id: '1',
    name: 'Tithe',
    percentage: 10,
    color: BucketColors[0],
    icon: 'tithe',
    destination: {
      name: 'Giving.com / FaithChurch',
      type: 'external' as const,
    },
  },
  {
    id: '2',
    name: 'Savings',
    percentage: 15,
    color: BucketColors[1],
    icon: 'savings',
    destination: {
      name: 'Ally Bank',
      type: 'bank' as const,
      lastFour: '9928',
    },
  },
  {
    id: '3',
    name: 'Investing',
    percentage: 10,
    color: BucketColors[2],
    icon: 'investing',
    destination: {
      name: 'Wealthfront IRA',
      type: 'bank' as const,
      lastFour: '1104',
    },
  },
];

// Simulated bucket with error for demo
const MOCK_BUCKET_WITH_ERROR = {
  ...MOCK_BUCKETS[1],
  error: {
    title: 'Connection Issue',
    description: 'Destination account unavailable. Please reconnect.',
  },
};

interface BucketConfig {
  id: string;
  name: string;
  percentage: number;
  color: string;
  icon?: string;
  destination?: {
    name: string;
    type: 'bank' | 'external';
    lastFour?: string;
  };
  error?: {
    title: string;
    description: string;
  };
}

export default function BucketConfigurationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // State
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [buckets, setBuckets] = useState<BucketConfig[]>([]);
  const [showError, setShowError] = useState(false); // Toggle to demo error state

  // Simulate data loading
  useEffect(() => {
    const loadBuckets = async () => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Set mock data (toggle showError to see error state)
      if (showError) {
        setBuckets([
          MOCK_BUCKETS[0],
          MOCK_BUCKET_WITH_ERROR,
          MOCK_BUCKETS[2],
        ]);
      } else {
        setBuckets(MOCK_BUCKETS);
      }
      setIsLoading(false);
    };

    loadBuckets();
  }, [showError]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Simulate refresh
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setIsRefreshing(false);
  };

  const handleBucketPress = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // TODO: Navigate to edit bucket screen
    console.log('Edit bucket:', id);
  };

  const handleMorePress = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // TODO: Show action sheet (edit, delete)
    console.log('More options for bucket:', id);
  };

  const handleDestinationPress = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // TODO: Navigate to destination settings
    console.log('Edit destination for bucket:', id);
  };

  const handleReconnect = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // TODO: Initiate reconnection flow
    console.log('Reconnect bucket:', id);
  };

  const handleAddBucket = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // TODO: Navigate to add bucket screen
    console.log('Add new bucket');
  };

  const handleCreateFirstBucket = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // TODO: Navigate to add bucket screen
    console.log('Create first bucket');
  };

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.back();
  };

  const hasErrors = buckets.some((b) => b.error);
  const hasBuckets = buckets.length > 0;

  // Loading State
  if (isLoading) {
    return (
      <View style={styles.container}>
        <Header showBack />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Size.bottomBarHeight + insets.bottom + Spacing[8] },
          ]}
        >
          {/* Title */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>Configure{'\n'}Destination Buckets</Text>
            <Skeleton width={200} height={14} style={styles.subtitleSkeleton} />
          </View>

          {/* Skeleton Bucket Cards */}
          <View style={styles.bucketList}>
            {[1, 2, 3].map((i) => (
              <SkeletonCard key={i} />
            ))}

            {/* Disabled Add Button */}
            <View style={{ opacity: 0.5 }}>
              <AddBucketButton onPress={() => {}} />
            </View>
          </View>
        </ScrollView>

        <BottomActionBar>
          <Button disabled loading>
            Loading Settings
          </Button>
          <Text style={styles.footerText}>
            Changes will apply to the current $1,200 split.
          </Text>
        </BottomActionBar>
      </View>
    );
  }

  // Empty State
  if (!hasBuckets) {
    return (
      <View style={styles.container}>
        <Header showBack />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            styles.emptyContent,
            { paddingBottom: Size.bottomBarHeight + insets.bottom + Spacing[8] },
          ]}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
          }
        >
          {/* Title */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>Configure{'\n'}Destination Buckets</Text>
            <Text style={styles.subtitle}>
              Review where each split will be delivered.
            </Text>
          </View>

          {/* Empty State */}
          <View style={styles.emptyState}>
            <EmptyBuckets onCreateBucket={handleCreateFirstBucket} />
          </View>
        </ScrollView>

        <BottomActionBar>
          <Button disabled>Continue to Confirmation</Button>
          <Text style={styles.footerText}>
            Add at least one bucket to proceed with the split.
          </Text>
        </BottomActionBar>
      </View>
    );
  }

  // Normal State (with possible errors)
  return (
    <View style={styles.container}>
      <Header showBack />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Size.bottomBarHeight + insets.bottom + Spacing[8] },
        ]}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>Configure{'\n'}Destination Buckets</Text>
          <Text style={styles.subtitle}>
            Review where each split will be delivered.
          </Text>
        </View>

        {/* Bucket Cards */}
        <View style={styles.bucketList}>
          {buckets.map((bucket) => (
            <BucketConfigCard
              key={bucket.id}
              id={bucket.id}
              name={bucket.name}
              percentage={bucket.percentage}
              color={bucket.color}
              icon={bucket.icon}
              destination={bucket.destination}
              error={
                bucket.error
                  ? {
                      ...bucket.error,
                      onReconnect: () => handleReconnect(bucket.id),
                    }
                  : undefined
              }
              onPress={handleBucketPress}
              onMorePress={handleMorePress}
              onDestinationPress={handleDestinationPress}
            />
          ))}

          {/* Add Bucket Button */}
          <AddBucketButton onPress={handleAddBucket} />
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <BottomActionBar>
        <Button onPress={handleContinue} variant={hasErrors ? 'secondary' : 'primary'}>
          Continue to Confirmation
        </Button>
        <Text style={styles.footerText}>
          Changes will apply to the current $1,200 split.
        </Text>
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
  },
  emptyContent: {
    flex: 1,
  },
  titleSection: {
    marginBottom: Spacing[6],
  },
  title: {
    fontFamily: FontFamily.black,
    fontSize: FontSize['2xl'],
    color: Colors.text.primary,
    lineHeight: 32,
  },
  subtitle: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.md,
    color: Colors.text.muted,
    marginTop: Spacing[2],
  },
  subtitleSkeleton: {
    marginTop: Spacing[2],
  },
  bucketList: {
    gap: Spacing[4],
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
  },
  footerText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.text.muted,
    textAlign: 'center',
  },
});
