/**
 * Processing Screen
 * Shows progress during split execution with live updates
 *
 * Stories: 62, 63, 64
 */

import React, { useState, useEffect } from 'react';
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
import { useBuckets, useSplitPlan } from '@/hooks';
import * as api from '@/services/api';
import type { ActionExecutionResult } from '@/types';

type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'manual_required';

export default function ProcessingScreen() {
  const router = useRouter();
  const { id: depositId } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();

  const { buckets } = useBuckets();
  const { plan } = useSplitPlan(depositId || '');

  // Animation values
  const [spinAnim] = useState(new Animated.Value(0));

  // Processing state
  const [actionResults, setActionResults] = useState<ActionExecutionResult[]>([]);
  const [overallStatus, setOverallStatus] = useState<'processing' | 'complete' | 'partial'>('processing');
  const [isRetrying, setIsRetrying] = useState(false);

  // Build display data from plan actions + buckets
  const allocations = (plan?.actions || []).map((action, index) => {
    const bucket = buckets.find((b) => b.id === action.bucket_id);
    return {
      id: action.bucket_id,
      name: bucket?.name || 'Bucket',
      destination: bucket?.name || 'Transfer',
      amount: action.amount,
      color: bucket?.color || BucketColors[index % BucketColors.length],
    };
  });

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

  // Check plan status and poll for updates
  useEffect(() => {
    if (!plan) return;

    const checkStatus = () => {
      if (plan.status === 'completed') {
        setOverallStatus('complete');
        setTimeout(() => {
          router.replace(`/deposit/${depositId}/complete`);
        }, 800);
        return true; // done polling
      }

      if (plan.status === 'executing') {
        const results: ActionExecutionResult[] = plan.actions.map((a) => ({
          action_id: a.id,
          bucket_id: a.bucket_id,
          status: a.executed ? 'completed' : 'pending',
          amount: a.amount,
          error: null,
          external_url: null,
          transaction_id: null,
        }));
        setActionResults(results);

        const allDone = results.every((r) => r.status === 'completed');
        if (allDone) {
          setOverallStatus('complete');
          setTimeout(() => {
            router.replace(`/deposit/${depositId}/complete`);
          }, 800);
          return true; // done polling
        } else {
          setOverallStatus('partial');
          return true; // partial failure, stop polling and show retry
        }
      }

      return false; // keep polling
    };

    if (checkStatus()) return;

    // Poll every 2s if plan is in a transitional state (draft/approved)
    const interval = setInterval(async () => {
      try {
        const freshPlan = await api.getSplitPlanByDeposit(depositId!);
        if (freshPlan.status === 'completed') {
          clearInterval(interval);
          setOverallStatus('complete');
          setTimeout(() => {
            router.replace(`/deposit/${depositId}/complete`);
          }, 800);
        } else if (freshPlan.status === 'executing') {
          const allDone = freshPlan.actions.every((a) => a.executed);
          if (allDone) {
            clearInterval(interval);
            setOverallStatus('complete');
            setTimeout(() => {
              router.replace(`/deposit/${depositId}/complete`);
            }, 800);
          }
        }
      } catch {
        // Plan may not exist yet, keep polling
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [plan, depositId, router]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Retry failed/pending actions
  const handleRetry = async () => {
    if (!plan?.id) return;
    setIsRetrying(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const result = await api.retrySplitPlan(plan.id);
      setActionResults(result.action_results);

      const allDone = result.action_results.every(
        (r) => r.status === 'completed' || r.status === 'manual_required'
      );
      if (allDone) {
        setOverallStatus('complete');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setTimeout(() => {
          router.replace(`/deposit/${depositId}/complete`);
        }, 1000);
      } else {
        setOverallStatus('partial');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
    } catch (error) {
      console.error('Retry failed:', error);
    } finally {
      setIsRetrying(false);
    }
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

  const getActionStatus = (bucketId: string): ProcessingStatus => {
    const result = actionResults.find((r) => r.bucket_id === bucketId);
    return result?.status || 'pending';
  };

  const getStatusIcon = (status: ProcessingStatus) => {
    switch (status) {
      case 'pending':
        return <View style={styles.pendingDot} />;
      case 'processing':
        return (
          <Animated.View style={{ transform: [{ rotate: spinInterpolation }] }}>
            <Ionicons name="sync" size={18} color={Colors.primary} />
          </Animated.View>
        );
      case 'completed':
        return <Ionicons name="checkmark-circle" size={18} color={Colors.status.success} />;
      case 'failed':
        return <Ionicons name="alert-circle" size={18} color={Colors.status.error} />;
      case 'manual_required':
        return <Ionicons name="open-outline" size={18} color={Colors.status.warning} />;
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
              <Ionicons name="sync" size={40} color={Colors.primary} />
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
          {allocations.map((allocation, index) => {
            const status = getActionStatus(allocation.id);
            return (
              <View
                key={allocation.id}
                style={[
                  styles.statusRow,
                  index < allocations.length - 1 && styles.statusRowBorder,
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
                    {getStatusIcon(status)}
                  </View>
                </View>
              </View>
            );
          })}
        </Card>

        {/* Action Buttons */}
        {overallStatus === 'partial' && (
          <View style={styles.actions}>
            <Button onPress={handleRetry} variant="primary" disabled={isRetrying}>
              {isRetrying ? 'Retrying...' : 'Retry Failed Transfers'}
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
    backgroundColor: `${Colors.primary}15`,
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
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.buttonPrimary,
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
