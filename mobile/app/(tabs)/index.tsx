/**
 * Dashboard Screen
 * Main home screen with balance overview, pending splits, and bucket summary
 */

import { useCallback, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Dimensions, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import { useAuth } from '@/contexts/AuthContext';
import { useBuckets, useDeposits, useDepositMutations } from '@/hooks';
import {
  Header,
  Card,
  SectionLabel,
  AmountDisplay,
  EmptyBuckets,
  FloatingActionButton,
  AddDepositModal,
  StatusDot,
} from '@/components';
import { Colors, BucketColors } from '@/constants/colors';
import { FontFamily, FontSize } from '@/constants/typography';
import { Spacing, BorderRadius, Size } from '@/constants/spacing';

export default function DashboardScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { buckets, isLoading: bucketsLoading, refetch: refetchBuckets } = useBuckets();
  const { pendingDeposits, isLoading: depositsLoading, refetch: refetchDeposits } = useDeposits();
  const { createDeposit, isCreating } = useDepositMutations();
  const [showAddDeposit, setShowAddDeposit] = useState(false);

  const isLoading = bucketsLoading || depositsLoading;

  // Refetch data when tab gains focus (e.g., after completing a split)
  useFocusEffect(
    useCallback(() => {
      refetchBuckets();
      refetchDeposits();
    }, [refetchBuckets, refetchDeposits])
  );

  const totalBalance = buckets.reduce((sum, b) => sum + b.current_balance, 0);

  async function onRefresh() {
    await Promise.all([refetchBuckets(), refetchDeposits()]);
  }

  async function handleAddDeposit(amount: number, description?: string) {
    const deposit = await createDeposit({ amount, description });
    if (deposit) {
      setShowAddDeposit(false);
      router.push(`/deposit/${deposit.id}/allocate`);
      refetchDeposits();
    }
  }

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <View style={styles.container}>
      <Header rightAction="settings" onRightAction={() => router.push('/settings')} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Size.tabBarHeight + insets.bottom + Spacing[4] },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Balance Card */}
        <Card variant="large" style={styles.balanceCard}>
          <Text style={styles.greeting}>
            Hello, {user?.full_name?.split(' ')[0] || 'there'}
          </Text>
          <Text style={styles.balanceLabel}>Total Balance</Text>
          <AmountDisplay
            amount={totalBalance}
            size="lg"
            color="#FFFFFF"
            currencyStyle={{ color: 'rgba(255,255,255,0.7)' }}
          />
        </Card>

        {/* Pending Splits Section */}
        {pendingDeposits.length > 0 && (
          <View style={styles.section}>
            <SectionLabel>Pending Splits</SectionLabel>
            <View style={styles.sectionContent}>
              {pendingDeposits.map((deposit) => (
                <Card
                  key={deposit.id}
                  onPress={() => router.push(`/split-plan/${deposit.id}`)}
                  animated
                  style={styles.pendingCard}
                >
                  <View style={styles.pendingContent}>
                    <View style={styles.pendingLeft}>
                      <View style={styles.pendingIconContainer}>
                        <Ionicons name="cash" size={24} color={Colors.warning.bgSolid} />
                      </View>
                      <View style={styles.pendingInfo}>
                        <Text style={styles.pendingAmount}>{formatCurrency(deposit.amount)}</Text>
                        <Text style={styles.pendingSource}>
                          {deposit.source || 'Deposit detected'}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.pendingRight}>
                      <View style={styles.pendingBadge}>
                        <Text style={styles.pendingBadgeText}>Split</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color={Colors.text.muted} />
                    </View>
                  </View>
                </Card>
              ))}
            </View>
          </View>
        )}

        {/* Buckets Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <SectionLabel>Your Buckets</SectionLabel>
            <Pressable onPress={() => router.push('/(tabs)/buckets')}>
              <Text style={styles.seeAll}>See all</Text>
            </Pressable>
          </View>

          {buckets.length === 0 ? (
            <EmptyBuckets
              onCreateBucket={() => router.push('/(tabs)/buckets')}
            />
          ) : (
            <View style={styles.bucketsGrid}>
              {buckets.slice(0, 4).map((bucket, index) => (
                <Card
                  key={bucket.id}
                  onPress={() => router.push(`/buckets/${bucket.id}` as any)}
                  animated
                  style={styles.bucketCard}
                >
                  <View style={styles.bucketContent}>
                    <Text style={styles.bucketEmoji}>{bucket.emoji || '💰'}</Text>
                    <Text style={styles.bucketName} numberOfLines={1}>
                      {bucket.name}
                    </Text>
                    <Text style={styles.bucketBalance}>
                      {formatCurrency(bucket.current_balance)}
                    </Text>
                    <View style={styles.bucketAllocationRow}>
                      <StatusDot
                        color={bucket.color || BucketColors[index % BucketColors.length]}
                        size={8}
                      />
                      <Text style={styles.bucketAllocation}>
                        {bucket.bucket_type === 'percentage'
                          ? `${bucket.allocation_value}%`
                          : formatCurrency(bucket.allocation_value)}
                      </Text>
                    </View>
                  </View>
                </Card>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <FloatingActionButton
        onPress={() => setShowAddDeposit(true)}
        icon="add"
      />

      <AddDepositModal
        visible={showAddDeposit}
        onClose={() => setShowAddDeposit(false)}
        onSubmit={handleAddDeposit}
        isSubmitting={isCreating}
      />
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
    paddingHorizontal: Spacing.page, // 24px
    paddingTop: Spacing[6],
    gap: Spacing.section, // 24px
  },

  // Balance Card
  balanceCard: {
    backgroundColor: Colors.primary,
    alignItems: 'center',
    paddingVertical: Spacing[8],
  },
  greeting: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.md,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: Spacing[2],
  },
  balanceLabel: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: Spacing[1],
  },

  // Section
  section: {
    gap: Spacing[3],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionContent: {
    gap: Spacing[3],
  },
  seeAll: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.base,
    color: Colors.primary,
  },

  // Pending Card
  pendingCard: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning.bgSolid,
  },
  pendingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pendingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
  },
  pendingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.warning.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingInfo: {
    gap: Spacing[0.5],
  },
  pendingAmount: {
    fontFamily: FontFamily.black,
    fontSize: FontSize.lg,
    color: Colors.text.primary,
  },
  pendingSource: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.base,
    color: Colors.text.muted,
  },
  pendingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  pendingBadge: {
    backgroundColor: Colors.warning.bg,
    paddingHorizontal: Spacing[2],
    paddingVertical: Spacing[1],
    borderRadius: BorderRadius.badge,
  },
  pendingBadgeText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xs,
    color: Colors.warning.text,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // Buckets Grid
  bucketsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: Spacing[3],
  },
  bucketCard: {
    width: (Dimensions.get('window').width - Spacing.page * 2 - Spacing[3]) / 2,
  },
  bucketContent: {
    alignItems: 'center',
    gap: Spacing[1],
  },
  bucketEmoji: {
    fontSize: 32,
    marginBottom: Spacing[1],
  },
  bucketName: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  bucketBalance: {
    fontFamily: FontFamily.black,
    fontSize: FontSize.lg,
    color: Colors.text.primary,
  },
  bucketAllocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[1],
  },
  bucketAllocation: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.base,
    color: Colors.text.muted,
  },
});
