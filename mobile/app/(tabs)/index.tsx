/**
 * Dashboard Screen
 * Balance overview, pending splits, and recent activity
 */

import { useCallback, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
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
import { useBuckets, useDeposits, useDepositMutations, useSplitTemplates } from '@/hooks';
import { FloatingActionButton, AddDepositModal } from '@/components';
import type { SplitTemplate } from '@/types';
import { Colors, BucketColors } from '@/constants/colors';
import { FontFamily, FontSize, LetterSpacing } from '@/constants/typography';
import { Spacing, BorderRadius } from '@/constants/spacing';
import { Shadows } from '@/constants/shadows';
import type { Deposit } from '@/types';

function formatCurrency(amount: number) {
  return `$${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return date.toLocaleDateString('en-US', { weekday: 'short' });
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ─── Balance Card ─────────────────────────────────────────────────────────────

function BalanceCard({ name, balance }: { name: string; balance: number }) {
  const [whole, cents] = formatCurrency(balance).split('.');
  return (
    <View style={styles.balanceCard}>
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

// ─── Pending Card ─────────────────────────────────────────────────────────────

function PendingCard({ deposit }: { deposit: Deposit }) {
  const isAutoDetected = deposit.status === 'pending_review' || deposit.status === 'detected';
  const badgeLabel = deposit.status === 'pending_review' ? 'Review plan' : 'Split now';

  return (
    <Pressable
      style={({ pressed }) => [styles.pendingCard, pressed && styles.pendingCardPressed]}
      onPress={() => router.push(`/deposit/${deposit.id}/allocate`)}
    >
      <View style={styles.pendingLeft}>
        <View style={styles.pendingIconBox}>
          <Ionicons name={isAutoDetected ? 'sparkles' : 'flash'} size={20} color={Colors.warning.text} />
        </View>
        <View>
          <View style={styles.pendingTitleRow}>
            <Text style={styles.pendingAmount}>{formatCurrency(deposit.amount)}</Text>
            {isAutoDetected && (
              <View style={styles.autoDetectedBadge}>
                <Text style={styles.autoDetectedText}>auto</Text>
              </View>
            )}
          </View>
          <Text style={styles.pendingSource}>{deposit.source || 'New deposit'}</Text>
        </View>
      </View>
      <View style={styles.pendingRight}>
        <View style={styles.pendingBadge}>
          <Text style={styles.pendingBadgeText}>{badgeLabel}</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={Colors.warning.text} />
      </View>
    </Pressable>
  );
}

// ─── Template Card ────────────────────────────────────────────────────────────

function TemplateCard({
  template,
  onPress,
}: {
  template: SplitTemplate;
  onPress: (template: SplitTemplate) => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.templateCard, pressed && { opacity: 0.8 }]}
      onPress={() => onPress(template)}
    >
      <Text style={styles.templateName} numberOfLines={1}>
        {template.name}
      </Text>
      <View style={styles.templateDots}>
        {template.items.slice(0, 4).map((item, index) => (
          <View
            key={item.id}
            style={[
              styles.templateDot,
              { backgroundColor: item.bucket?.color || BucketColors[index % BucketColors.length] },
            ]}
          />
        ))}
        {template.items.length > 4 && (
          <Text style={styles.templateMoreText}>+{template.items.length - 4}</Text>
        )}
      </View>
      <Text style={styles.templateBuckets} numberOfLines={1}>
        {template.items.map((i) => i.bucket?.name || 'Bucket').join(' · ')}
      </Text>
    </Pressable>
  );
}

// ─── Recent Activity Item ─────────────────────────────────────────────────────

function ActivityItem({ deposit, last }: { deposit: Deposit; last: boolean }) {
  const isCompleted = deposit.status === 'completed';
  const isFailed = deposit.status === 'failed';

  return (
    <>
      <Pressable
        style={({ pressed }) => [styles.activityRow, pressed && { opacity: 0.75 }]}
        onPress={() =>
          router.push(
            isCompleted
              ? `/deposit/${deposit.id}/complete`
              : `/deposit/${deposit.id}/allocate`
          )
        }
      >
        <View
          style={[
            styles.activityIcon,
            isCompleted && styles.activityIconSuccess,
            isFailed && styles.activityIconError,
          ]}
        >
          <Ionicons
            name={isFailed ? 'close' : 'checkmark'}
            size={16}
            color={isFailed ? Colors.error.text : Colors.success.text}
          />
        </View>

        <View style={styles.activityInfo}>
          <Text style={styles.activitySource} numberOfLines={1}>
            {deposit.source || deposit.description || 'Deposit'}
          </Text>
          <Text style={styles.activityDate}>
            {formatDate(deposit.detected_at)}
          </Text>
        </View>

        <Text style={styles.activityAmount}>{formatCurrency(deposit.amount)}</Text>
      </Pressable>
      {!last && <View style={styles.activityDivider} />}
    </>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function DashboardScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { buckets, isLoading: bucketsLoading, refetch: refetchBuckets } = useBuckets();
  const { deposits, pendingDeposits, isLoading: depositsLoading, refetch: refetchDeposits } = useDeposits();
  const { templates, refetch: refetchTemplates } = useSplitTemplates();
  const { createDeposit, isCreating } = useDepositMutations();
  const [showAddDeposit, setShowAddDeposit] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  const isLoading = bucketsLoading || depositsLoading;

  useFocusEffect(
    useCallback(() => {
      refetchBuckets();
      refetchDeposits();
      refetchTemplates();
    }, [refetchBuckets, refetchDeposits, refetchTemplates])
  );

  const totalBalance = buckets.reduce((sum, b) => sum + b.current_balance, 0);
  const firstName = user?.full_name?.split(' ')[0] || 'there';
  const recentActivity = deposits
    .filter((d) => d.status === 'completed' || d.status === 'failed' || d.status === 'processing')
    .slice(0, 5);

  async function onRefresh() {
    await Promise.all([refetchBuckets(), refetchDeposits()]);
  }

  function handleTemplatePress(template: SplitTemplate) {
    setSelectedTemplateId(template.id);
    setShowAddDeposit(true);
  }

  async function handleAddDeposit(amount: number, description?: string) {
    const deposit = await createDeposit({ amount, description });
    if (deposit) {
      setShowAddDeposit(false);
      const path = selectedTemplateId
        ? `/deposit/${deposit.id}/allocate?templateId=${selectedTemplateId}`
        : `/deposit/${deposit.id}/allocate`;
      setSelectedTemplateId(null);
      router.push(path as any);
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
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor="white" />
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

        {/* My Splits */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>My Splits</Text>
            <Pressable onPress={() => router.push('/split-templates/new')} hitSlop={8}>
              <Text style={styles.seeAll}>+ New</Text>
            </Pressable>
          </View>

          {templates.length === 0 ? (
            <Pressable
              style={styles.emptyTemplates}
              onPress={() => router.push('/split-templates/new')}
            >
              <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
              <Text style={styles.emptyTemplatesText}>Create a split template to get started</Text>
            </Pressable>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.templateScroll}
            >
              {templates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onPress={handleTemplatePress}
                />
              ))}
            </ScrollView>
          )}
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>Recent Activity</Text>
            <Pressable onPress={() => router.push('/(tabs)/history')} hitSlop={8}>
              <Text style={styles.seeAll}>See all</Text>
            </Pressable>
          </View>

          {recentActivity.length === 0 ? (
            <View style={styles.emptyActivity}>
              <Ionicons name="time-outline" size={32} color={Colors.gray[300]} />
              <Text style={styles.emptyActivityText}>
                {pendingDeposits.length > 0
                  ? 'Complete your first split to see activity here'
                  : 'Add a deposit to get started'}
              </Text>
            </View>
          ) : (
            <View style={styles.activityCard}>
              {recentActivity.map((deposit, index) => (
                <ActivityItem
                  key={deposit.id}
                  deposit={deposit}
                  last={index === recentActivity.length - 1}
                />
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

  scroll: { flex: 1 },
  scrollContent: {
    gap: Spacing[6],
    paddingBottom: Spacing[8],
  },

  // Balance Card
  balanceCard: {
    backgroundColor: Colors.primary,
    marginHorizontal: Spacing.page,
    borderRadius: BorderRadius.card,
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
  pendingTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  autoDetectedBadge: {
    backgroundColor: `${Colors.primary}20`,
    paddingHorizontal: Spacing[2],
    paddingVertical: 2,
    borderRadius: BorderRadius.badge,
  },
  autoDetectedText: {
    fontFamily: FontFamily.bold,
    fontSize: 10,
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: LetterSpacing.wide,
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

  // My Splits
  templateScroll: {
    gap: Spacing[3],
    paddingRight: Spacing[2],
  },
  templateCard: {
    width: 140,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.cardMedium,
    padding: Spacing[4],
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    gap: Spacing[2],
    ...Shadows.card,
  },
  templateName: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    color: Colors.text.primary,
  },
  templateDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[1],
  },
  templateDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  templateMoreText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xs,
    color: Colors.text.muted,
  },
  templateBuckets: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.base,
    color: Colors.text.muted,
  },
  emptyTemplates: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.cardMedium,
    padding: Spacing[4],
    borderWidth: 1.5,
    borderColor: `${Colors.primary}30`,
    borderStyle: 'dashed',
  },
  emptyTemplatesText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.text.muted,
    flex: 1,
  },

  // Recent Activity
  activityCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.cardMedium,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    overflow: 'hidden',
    ...Shadows.card,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[4],
    gap: Spacing[4],
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.success.bg,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  activityIconSuccess: {
    backgroundColor: Colors.success.bg,
  },
  activityIconError: {
    backgroundColor: Colors.error.bg,
  },
  activityInfo: {
    flex: 1,
    gap: 2,
  },
  activitySource: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    color: Colors.text.primary,
  },
  activityDate: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.text.muted,
  },
  activityAmount: {
    fontFamily: FontFamily.black,
    fontSize: FontSize.md,
    color: Colors.text.primary,
  },
  activityDivider: {
    height: 1,
    backgroundColor: Colors.border.light,
    marginLeft: Spacing[5] + 32 + Spacing[4],
  },
  emptyActivity: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.cardMedium,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    paddingVertical: Spacing[8],
    alignItems: 'center',
    gap: Spacing[3],
    ...Shadows.card,
  },
  emptyActivityText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.text.muted,
    textAlign: 'center',
    paddingHorizontal: Spacing[6],
    lineHeight: 20,
  },
});
