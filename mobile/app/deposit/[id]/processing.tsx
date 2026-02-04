/**
 * Processing Screen
 * Shows progress during split execution with live updates
 *
 * Stories: 62, 63, 64
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

import { Colors, BucketColors } from '@/constants/colors';
import { FontFamily, FontSize } from '@/constants/typography';
import { BorderRadius, Spacing } from '@/constants/spacing';
import { Shadows } from '@/constants/shadows';
import { Header, Card, Button } from '@/components';

// Mock allocations with processing status
const MOCK_ALLOCATIONS = [
  {
    id: 'tithe',
    name: 'Tithe',
    destination: 'Better Together',
    amount: 120,
    color: BucketColors[0],
  },
  {
    id: 'savings',
    name: 'Savings',
    destination: 'Ally Bank ••0122',
    amount: 180,
    color: BucketColors[1],
  },
  {
    id: 'investing',
    name: 'Investing',
    destination: 'Vanguard ••8829',
    amount: 120,
    color: BucketColors[2],
  },
];

type ProcessingStatus = 'pending' | 'processing' | 'complete' | 'error';

interface AllocationStatus {
  id: string;
  status: ProcessingStatus;
  error?: string;
}

export default function ProcessingScreen() {
  const router = useRouter();
  const { id: depositId } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();

  // Animation values
  const [spinAnim] = useState(new Animated.Value(0));
  const [progressAnim] = useState(new Animated.Value(0));

  // Processing state
  const [statuses, setStatuses] = useState<AllocationStatus[]>(
    MOCK_ALLOCATIONS.map((a) => ({ id: a.id, status: 'pending' }))
  );
  const [overallStatus, setOverallStatus] = useState<'processing' | 'complete' | 'partial'>('processing');

  // Start spinner animation
  useEffect(() => {
    const spin = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    spin.start();

    return () => spin.stop();
  }, [spinAnim]);

  // Simulate processing each allocation
  useEffect(() => {
    const processAllocations = async () => {
      for (let i = 0; i < MOCK_ALLOCATIONS.length; i++) {
        const allocation = MOCK_ALLOCATIONS[i];

        // Set to processing
        setStatuses((prev) =>
          prev.map((s) =>
            s.id === allocation.id ? { ...s, status: 'processing' } : s
          )
        );

        // Simulate processing time
        await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 400));

        // Randomly fail one allocation for demo (10% chance)
        const shouldFail = Math.random() < 0.1;

        // Set to complete or error
        setStatuses((prev) =>
          prev.map((s) =>
            s.id === allocation.id
              ? {
                  ...s,
                  status: shouldFail ? 'error' : 'complete',
                  error: shouldFail ? 'Connection timeout' : undefined,
                }
              : s
          )
        );

        if (!shouldFail) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }

        // Animate progress
        Animated.timing(progressAnim, {
          toValue: (i + 1) / MOCK_ALLOCATIONS.length,
          duration: 300,
          useNativeDriver: false,
        }).start();
      }
    };

    processAllocations();
  }, [progressAnim]);

  // Check completion status
  useEffect(() => {
    const allComplete = statuses.every((s) => s.status === 'complete' || s.status === 'error');

    if (allComplete) {
      const hasErrors = statuses.some((s) => s.status === 'error');

      if (hasErrors) {
        setOverallStatus('partial');
      } else {
        setOverallStatus('complete');
        // Navigate to complete screen after a brief delay
        setTimeout(() => {
          router.replace(`/deposit/${depositId}/complete`);
        }, 1000);
      }
    }
  }, [statuses, depositId, router]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Retry failed allocations
  const handleRetry = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Reset failed items to pending and reprocess
    setStatuses((prev) =>
      prev.map((s) =>
        s.status === 'error' ? { ...s, status: 'pending', error: undefined } : s
      )
    );
    // In a real app, this would trigger the retry logic
  };

  // Continue with partial success
  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.replace(`/deposit/${depositId}/complete`);
  };

  // Spinner rotation interpolation
  const spinInterpolation = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const getStatusIcon = (status: ProcessingStatus) => {
    switch (status) {
      case 'pending':
        return <View style={styles.pendingDot} />;
      case 'processing':
        return (
          <Animated.View style={{ transform: [{ rotate: spinInterpolation }] }}>
            <Ionicons name="sync" size={18} color={Colors.primary.DEFAULT} />
          </Animated.View>
        );
      case 'complete':
        return <Ionicons name="checkmark-circle" size={18} color={Colors.status.success} />;
      case 'error':
        return <Ionicons name="alert-circle" size={18} color={Colors.status.error} />;
    }
  };

  return (
    <View style={styles.container}>
      <Header />

      <View style={[styles.content, { paddingBottom: insets.bottom + Spacing[6] }]}>
        {/* Processing Icon */}
        <View style={styles.iconContainer}>
          {overallStatus === 'processing' ? (
            <Animated.View
              style={[styles.spinnerIcon, { transform: [{ rotate: spinInterpolation }] }]}
            >
              <Ionicons name="sync" size={40} color={Colors.primary.DEFAULT} />
            </Animated.View>
          ) : overallStatus === 'partial' ? (
            <View style={styles.warningIcon}>
              <Ionicons name="alert" size={40} color={Colors.status.warning} />
            </View>
          ) : (
            <View style={styles.successIcon}>
              <Ionicons name="checkmark" size={40} color="white" />
            </View>
          )}
        </View>

        {/* Status Message */}
        <View style={styles.messageSection}>
          <Text style={styles.title}>
            {overallStatus === 'processing'
              ? 'Distributing Funds'
              : overallStatus === 'partial'
              ? 'Partial Success'
              : 'Split Complete'}
          </Text>
          <Text style={styles.subtitle}>
            {overallStatus === 'processing'
              ? 'Please wait while we process your allocations...'
              : overallStatus === 'partial'
              ? 'Some transfers could not be completed'
              : 'All allocations have been processed'}
          </Text>
        </View>

        {/* Allocation Status List */}
        <Card style={styles.statusCard}>
          {MOCK_ALLOCATIONS.map((allocation, index) => {
            const status = statuses.find((s) => s.id === allocation.id);
            return (
              <View
                key={allocation.id}
                style={[
                  styles.statusRow,
                  index < MOCK_ALLOCATIONS.length - 1 && styles.statusRowBorder,
                ]}
              >
                <View style={styles.statusLeft}>
                  <View style={[styles.colorDot, { backgroundColor: allocation.color }]} />
                  <View>
                    <Text style={styles.allocationName}>{allocation.name}</Text>
                    <Text style={styles.allocationDestination}>{allocation.destination}</Text>
                  </View>
                </View>
                <View style={styles.statusRight}>
                  <Text style={styles.allocationAmount}>{formatCurrency(allocation.amount)}</Text>
                  <View style={styles.statusIconContainer}>
                    {getStatusIcon(status?.status || 'pending')}
                  </View>
                </View>
              </View>
            );
          })}
        </Card>

        {/* Action Buttons (only show on partial failure) */}
        {overallStatus === 'partial' && (
          <View style={styles.actions}>
            <Button onPress={handleRetry} variant="primary">
              Retry Failed Transfers
            </Button>
            <Button onPress={handleContinue} variant="secondary">
              Continue Anyway
            </Button>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.page,
    paddingTop: Spacing[12],
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: Spacing[8],
  },
  spinnerIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: `${Colors.primary.DEFAULT}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  warningIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: `${Colors.status.warning}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.primary.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.button,
  },
  messageSection: {
    alignItems: 'center',
    marginBottom: Spacing[10],
  },
  title: {
    fontFamily: FontFamily.black,
    fontSize: FontSize['2xl'],
    color: Colors.text.primary,
    marginBottom: Spacing[2],
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.md,
    color: Colors.text.muted,
    textAlign: 'center',
    paddingHorizontal: Spacing[4],
  },
  statusCard: {
    width: '100%',
    padding: Spacing[4],
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[2],
  },
  statusRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  allocationName: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    color: Colors.text.secondary,
  },
  allocationDestination: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.text.muted,
    marginTop: 2,
  },
  statusRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
  },
  allocationAmount: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    color: Colors.text.primary,
  },
  statusIconContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border.default,
  },
  actions: {
    width: '100%',
    marginTop: Spacing[8],
    gap: Spacing[3],
  },
});
