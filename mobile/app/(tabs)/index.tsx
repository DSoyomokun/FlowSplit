/**
 * Dashboard Screen
 * Main home screen with balance overview, pending splits, and bucket summary
 */

import { useCallback, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  Dimensions,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import { useAuth } from '@/contexts/AuthContext';
import { useBuckets, useDeposits, useDepositMutations } from '@/hooks';
import {
  FloatingActionButton,
  AddDepositModal,
} from '@/components';
import { Colors, BucketColors } from '@/constants/colors';
import { FontFamily, FontSize, LetterSpacing } from '@/constants/typography';
import { Spacing, BorderRadius } from '@/constants/spacing';
import { Shadows } from '@/constants/shadows';
import type { Bucket, Deposit } from '@/types';

const CARD_GAP = Spacing[3];
const SCREEN_WIDTH = Dimensions.get('window').width;
const BUCKET_CARD_WIDTH = (SCREEN_WIDTH - Spacing.page * 2 - CARD_GAP) / 2;

function formatCurrency(amount: number) {
  return `$${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// ─── Balance Card ─────────────────────────────────────────────────────────────

function BalanceCard({ name, balance }: { name: string; balance: number }) {
  const [whole, cents] = formatCurrency(balance).split('.');
  return (
    <View style={styles.balanceCard}>
      {/* Decorative circles */}
      <View style={styles.balanceDecorCircle1} />
      <View style={styles.balanceDecorCircle2} />

      <Text style={styles.balanceGreeting}>Hello, {name} 👋</Text>
      <Text style={styles.balanceLabel}>TOTAL BALANCE</Text>
      <View style={styles.balanceAmountRow}>
        <Text style={styles.balanceWhole}>{whole}</Text>
        <Text style={styles.balanceCents}>.{cents}</Text>
      </View>
    </View>
  );
}

// ─── Pending Deposit Card ─────────────────────────────────────────────────────

function PendingCard({ deposit }: { deposit: Deposit }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.pendingCard, pressed && styles.pendingCardPressed]}
      onPress={() => router.push(`/deposit/${deposit.id}/allocate`)}
    >
      <View style={styles.pendingLeft}>
        <View style={styles.pendingIconBox}>
          <Ionicons name="flash" size={20} color={Colors.warning.text} />
        </View>
        <View>
          <Text style={styles.pendingAmount}>{formatCurrency(deposit.amount)}</Text>
          <Text style={styles.pendingSource}>{deposit.source || 'New deposit'}</Text>
        </View>
      </View>
      <View style={styles.pendingRight}>
        <View style={styles.pendingBadge}>
          <Text style={styles.pendingBadgeText}>Split now</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={Colors.warning.text} />
      </View>
    </Pressable>
  );
}

// ─── Bucket Card ──────────────────────────────────────────────────────────────

function BucketCard({ bucket, index }: { bucket: Bucket; index: number }) {
  const color = bucket.color || BucketColors[index % BucketColors.length];
  return (
    <Pressable
      style={({ pressed }) => [styles.bucketCard, pressed && { opacity: 0.85 }]}
      onPress={() => router.push(`/buckets/${bucket.id}`)}
    >
      {/* Color strip */}
      <View style={[styles.bucketStrip, { backgroundColor: color }]} />
      <View style={styles.bucketBody}>
        <Text style={styles.bucketEmoji}>{bucket.emoji || '💰'}</Text>
        <Text style={styles.bucketName} numberOfLines={1}>{bucket.name}</Text>
        <Text style={styles.bucketBalance}>{formatCurrency(bucket.current_balance)}</Text>
        <View style={[styles.bucketAllocationPill, { backgroundColor: `${color}18` }]}>
          <Text style={[styles.bucketAllocationText, { color }]}>
            {bucket.bucket_type === 'percentage'
              ? `${bucket.allocation_value}%`
              : formatCurrency(bucket.allocation_value)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

// ─── Empty Buckets ────────────────────────────────────────────────────────────

function EmptyBucketsCard() {
  return (
    <Pressable
      style={styles.emptyBucketsCard}
      onPress={() => router.push('/buckets/new')}
    >
      <View style={styles.emptyBucketsIcon}>
        <Ionicons name="pie-chart-outline" size={28} color={`${Colors.primary}50`} />
      </View>
      <Text style={styles.emptyBucketsTitle}>No buckets yet</Text>
      <Text style={styles.emptyBucketsText}>Create your first bucket to start splitting deposits</Text>
      <View style={styles.emptyBucketsButton}>
        <Ionicons name="add" size={16} color={Colors.primary} />
        <Text style={styles.emptyBucketsButtonText}>Create Bucket</Text>
      </View>
    </Pressable>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function DashboardScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { buckets, isLoading: bucketsLoading, refetch: refetchBuckets } = useBuckets();
  const { pendingDeposits, isLoading: depositsLoading, refetch: refetchDeposits } = useDeposits();
  const { createDeposit, isCreating } = useDepositMutations();
  const [showAddDeposit, setShowAddDeposit] = useState(false);

  const isLoading = bucketsLoading || depositsLoading;

  useFocusEffect(
    useCallback(() => {
      refetchBuckets();
      refetchDeposits();
    }, [refetchBuckets, refetchDeposits])
  );

  const totalBalance = buckets.reduce((sum, b) => sum + b.current_balance, 0);
  const firstName = user?.full_name?.split(' ')[0] || 'there';

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

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>FlowSplit</Text>
        <Pressable
          onPress={() => router.push('/(tabs)/settings')}
          style={styles.headerButton}
          hitSlop={8}
        >
          <Ionicons name="person-circle-outline" size={28} color={Colors.text.secondary} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={onRefresh}
            tintColor="white"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Balance */}
        <BalanceCard name={firstName} balance={totalBalance} />

        {/* Pending Splits */}
        {pendingDeposits.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>Pending Splits</Text>
              <View style={styles.pendingCountBadge}>
                <Text style={styles.pendingCountText}>{pendingDeposits.length}</Text>
              </View>
            </View>
            <View style={styles.sectionContent}>
              {pendingDeposits.map((deposit) => (
                <PendingCard key={deposit.id} deposit={deposit} />
              ))}
            </View>
          </View>
        )}

        {/* Buckets */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>Your Buckets</Text>
            <Pressable onPress={() => router.push('/(tabs)/buckets')} hitSlop={8}>
              <Text style={styles.seeAll}>See all</Text>
            </Pressable>
          </View>

          {buckets.length === 0 ? (
            <EmptyBucketsCard />
          ) : (
            <View style={styles.bucketsGrid}>
              {buckets.slice(0, 4).map((bucket, index) => (
                <BucketCard key={bucket.id} bucket={bucket} index={index} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <FloatingActionButton onPress={() => setShowAddDeposit(true)} icon="add" />

      <AddDepositModal
        visible={showAddDeposit}
        onClose={() => setShowAddDeposit(false)}
        onSubmit={handleAddDeposit}
        isSubmitting={isCreating}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.page,
    paddingVertical: Spacing[4],
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
  },
  headerTitle: {
    fontFamily: FontFamily.black,
    fontSize: FontSize.xl,
    color: Colors.text.primary,
    letterSpacing: -0.5,
  },
  headerButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },

  scroll: {
    flex: 1,
  },
  scrollContent: {
    gap: Spacing[6],
    paddingBottom: Spacing[8],
  },

  // Balance Card
  balanceCard: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.page,
    paddingTop: Spacing[8],
    paddingBottom: Spacing[10],
    overflow: 'hidden',
  },
  balanceDecorCircle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: -60,
    right: -40,
  },
  balanceDecorCircle2: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.06)',
    bottom: -30,
    left: -20,
  },
  balanceGreeting: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.md,
    color: 'rgba(255,255,255,0.75)',
    marginBottom: Spacing[5],
  },
  balanceLabel: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: LetterSpacing.widest,
    marginBottom: Spacing[2],
  },
  balanceAmountRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  balanceWhole: {
    fontFamily: FontFamily.black,
    fontSize: 44,
    color: 'white',
    letterSpacing: -1,
    lineHeight: 48,
  },
  balanceCents: {
    fontFamily: FontFamily.black,
    fontSize: FontSize['2xl'],
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 4,
    marginLeft: 2,
  },

  // Sections
  section: {
    paddingHorizontal: Spacing.page,
    gap: Spacing[3],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionLabel: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xs,
    color: Colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: LetterSpacing.widest,
  },
  sectionContent: {
    gap: Spacing[3],
  },
  seeAll: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.sm,
    color: Colors.primary,
  },
  pendingCountBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.warning.bgSolid,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingCountText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xs,
    color: 'white',
  },

  // Pending Card
  pendingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.cardMedium,
    padding: Spacing[4],
    borderWidth: 1,
    borderColor: Colors.warning.borderLight,
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning.bgSolid,
    ...Shadows.card,
  },
  pendingCardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  pendingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
  },
  pendingIconBox: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.warning.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingAmount: {
    fontFamily: FontFamily.black,
    fontSize: FontSize.lg,
    color: Colors.text.primary,
  },
  pendingSource: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.text.muted,
    marginTop: 1,
  },
  pendingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[1],
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
    letterSpacing: LetterSpacing.wide,
  },

  // Buckets grid
  bucketsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
  },
  bucketCard: {
    width: BUCKET_CARD_WIDTH,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.cardMedium,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    overflow: 'hidden',
    ...Shadows.card,
  },
  bucketStrip: {
    height: 5,
    width: '100%',
  },
  bucketBody: {
    padding: Spacing[4],
    alignItems: 'flex-start',
    gap: Spacing[1],
  },
  bucketEmoji: {
    fontSize: 26,
    marginBottom: Spacing[1],
  },
  bucketName: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    color: Colors.text.primary,
  },
  bucketBalance: {
    fontFamily: FontFamily.black,
    fontSize: FontSize.lg,
    color: Colors.text.primary,
    letterSpacing: -0.5,
  },
  bucketAllocationPill: {
    marginTop: Spacing[1],
    paddingHorizontal: Spacing[2],
    paddingVertical: 3,
    borderRadius: BorderRadius.badge,
  },
  bucketAllocationText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: LetterSpacing.wide,
  },

  // Empty buckets
  emptyBucketsCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.cardMedium,
    padding: Spacing[6],
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border.light,
    borderStyle: 'dashed',
    gap: Spacing[2],
  },
  emptyBucketsIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.gray[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[2],
  },
  emptyBucketsTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    color: Colors.text.primary,
  },
  emptyBucketsText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.text.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyBucketsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[1],
    marginTop: Spacing[2],
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  emptyBucketsButtonText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.sm,
    color: Colors.primary,
  },
});
