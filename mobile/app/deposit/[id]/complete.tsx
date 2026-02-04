/**
 * Split Complete Screen
 * Success confirmation with allocation summary
 *
 * Stories: 65, 66, 67
 */

import React from 'react';
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
import { BorderRadius, Spacing } from '@/constants/spacing';
import { Shadows } from '@/constants/shadows';
import { Header, Card, Button } from '@/components';

// Mock data for development
const MOCK_DEPOSIT_AMOUNT = 1200;
const MOCK_ALLOCATIONS = [
  {
    id: 'tithe',
    name: 'Tithe',
    amount: 120,
    color: BucketColors[0],
  },
  {
    id: 'savings',
    name: 'Savings',
    amount: 180,
    color: BucketColors[1],
  },
  {
    id: 'investing',
    name: 'Investing',
    amount: 120,
    color: BucketColors[2],
  },
];

export default function SplitCompleteScreen() {
  const router = useRouter();
  const { id: depositId } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();

  // Calculate remainder
  const totalAllocated = MOCK_ALLOCATIONS.reduce((sum, a) => sum + a.amount, 0);
  const remainder = MOCK_DEPOSIT_AMOUNT - totalAllocated;

  // Format currency
  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Handlers
  const handleManageBuckets = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/buckets/configure');
  };

  const handleReturnToDashboard = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Navigate to home/dashboard
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <Header />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + Spacing[8] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconOuter}>
            <View style={styles.iconInner}>
              <Ionicons name="checkmark" size={40} color="white" />
            </View>
          </View>
        </View>

        {/* Success Message */}
        <View style={styles.messageSection}>
          <Text style={styles.title}>Split Complete</Text>
          <Text style={styles.subtitle}>
            Your deposit of {formatCurrency(MOCK_DEPOSIT_AMOUNT)} has been allocated according to your plan.
          </Text>
        </View>

        {/* Allocation Summary Card */}
        <Card variant="large" style={styles.summaryCard}>
          <Text style={styles.sectionLabel}>ALLOCATION SUMMARY</Text>

          <View style={styles.allocationList}>
            {MOCK_ALLOCATIONS.map((allocation) => (
              <View key={allocation.id} style={styles.allocationRow}>
                <View style={styles.allocationLeft}>
                  <View style={[styles.colorDot, { backgroundColor: allocation.color }]} />
                  <Text style={styles.allocationName}>{allocation.name}</Text>
                </View>
                <Text style={styles.allocationAmount}>{formatCurrency(allocation.amount)}</Text>
              </View>
            ))}

            {/* Remainder */}
            <View style={styles.remainderRow}>
              <Text style={styles.remainderLabel}>Remaining in Checking</Text>
              <Text style={styles.remainderAmount}>{formatCurrency(remainder)}</Text>
            </View>
          </View>
        </Card>

        {/* Manage Buckets Link */}
        <Pressable onPress={handleManageBuckets} style={styles.manageBucketsLink}>
          <Text style={styles.manageBucketsText}>Manage Buckets</Text>
        </Pressable>

        {/* Spacer */}
        <View style={styles.spacer} />

        {/* Return to Dashboard Button */}
        <View style={styles.actionSection}>
          <Button onPress={handleReturnToDashboard}>
            Return to Dashboard
          </Button>
        </View>
      </ScrollView>
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
    paddingTop: Spacing[12],
    alignItems: 'center',
    flexGrow: 1,
  },
  iconContainer: {
    marginBottom: Spacing[8],
  },
  iconOuter: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: `${Colors.primary.DEFAULT}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
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
  },
  subtitle: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.md,
    color: Colors.text.muted,
    textAlign: 'center',
    paddingHorizontal: Spacing[4],
  },
  summaryCard: {
    width: '100%',
    padding: Spacing[6],
  },
  sectionLabel: {
    fontFamily: FontFamily.black,
    fontSize: FontSize.xs,
    color: Colors.text.muted,
    letterSpacing: 2,
    marginBottom: Spacing[4],
    paddingHorizontal: Spacing[1],
  },
  allocationList: {
    gap: Spacing[3],
  },
  allocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.background,
    padding: Spacing[3],
    borderRadius: BorderRadius.lg,
  },
  allocationLeft: {
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
  allocationAmount: {
    fontFamily: FontFamily.black,
    fontSize: FontSize.md,
    color: Colors.text.primary,
  },
  remainderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing[2],
    paddingHorizontal: Spacing[3],
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    marginTop: Spacing[1],
  },
  remainderLabel: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    color: Colors.text.muted,
  },
  remainderAmount: {
    fontFamily: FontFamily.black,
    fontSize: FontSize.md,
    color: Colors.primary.DEFAULT,
  },
  manageBucketsLink: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: Spacing[4],
    marginTop: Spacing[4],
  },
  manageBucketsText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    color: Colors.text.muted,
  },
  spacer: {
    flex: 1,
    minHeight: Spacing[8],
  },
  actionSection: {
    width: '100%',
    paddingTop: Spacing[6],
  },
});
