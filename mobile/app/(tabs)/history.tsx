/**
 * Split History Screen
 * Timeline of deposits grouped by month with status badges
 *
 * Mockup: 12-split-history-ledger.html
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '@/constants/colors';
import { FontFamily, FontSize, LetterSpacing } from '@/constants/typography';
import { BorderRadius, Spacing } from '@/constants/spacing';
import { Shadows } from '@/constants/shadows';
import { useDeposits } from '@/hooks';
import type { Deposit } from '@/types';

// ─── Types ───────────────────────────────────────────────────────────────────

type DepositStatus = Deposit['status'];

interface MonthGroup {
  label: string;
  deposits: Deposit[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatAmount(amount: number) {
  return `$${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getMonthLabel(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

function groupByMonth(deposits: Deposit[]): MonthGroup[] {
  const map = new Map<string, Deposit[]>();
  for (const d of deposits) {
    const label = getMonthLabel(d.detected_at);
    if (!map.has(label)) map.set(label, []);
    map.get(label)!.push(d);
  }
  return Array.from(map.entries()).map(([label, deposits]) => ({ label, deposits }));
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  DepositStatus,
  { label: string; icon: string; bg: string; color: string }
> = {
  completed: {
    label: 'Completed',
    icon: 'checkmark-circle',
    bg: '#ECFDF5',
    color: '#059669',
  },
  pending: {
    label: 'Pending',
    icon: 'alert-circle',
    bg: '#FFFBEB',
    color: '#D97706',
  },
  processing: {
    label: 'Processing',
    icon: 'time',
    bg: '#EFF6FF',
    color: '#2563EB',
  },
  failed: {
    label: 'Action Needed',
    icon: 'close-circle',
    bg: '#FEF2F2',
    color: '#DC2626',
  },
};

function StatusBadge({ status }: { status: DepositStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <Ionicons name={cfg.icon as any} size={12} color={cfg.color} />
      <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

// ─── Deposit Card ─────────────────────────────────────────────────────────────

function DepositCard({ deposit, onPress, onRetry }: {
  deposit: Deposit;
  onPress: () => void;
  onRetry: () => void;
}) {
  const isPending = deposit.status === 'pending';
  const isFailed = deposit.status === 'failed';

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        isPending && styles.cardPending,
        pressed && styles.cardPressed,
      ]}
      onPress={onPress}
    >
      {/* Top row: date + amount left, badge right */}
      <View style={styles.cardTop}>
        <View>
          <Text style={styles.cardDate}>{formatDate(deposit.detected_at)}</Text>
          <Text style={styles.cardAmount}>{formatAmount(deposit.amount)}</Text>
        </View>
        <StatusBadge status={deposit.status} />
      </View>

      {/* Footer */}
      <View style={styles.cardFooter}>
        {isFailed ? (
          <>
            <Text style={styles.failedLabel}>Transfer failed</Text>
            <Pressable
              style={({ pressed }) => [styles.retryButton, pressed && { opacity: 0.8 }]}
              onPress={(e) => {
                e.stopPropagation?.();
                onRetry();
              }}
              hitSlop={8}
            >
              <Text style={styles.retryButtonText}>Retry Now</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={styles.cardSubtitle}>
              {deposit.source || 'Direct Deposit'}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.gray[300]} />
          </>
        )}
      </View>
    </Pressable>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyHistory({ onLinkAccount }: { onLinkAccount: () => void }) {
  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconBox}>
        <Ionicons name="time-outline" size={40} color={`${Colors.primary}30`} />
      </View>
      <Text style={styles.emptyTitle}>No splits yet</Text>
      <Text style={styles.emptyText}>
        Your transaction history will appear here once your first deposit is detected and split.
      </Text>
      <Pressable
        style={({ pressed }) => [styles.linkButton, pressed && { opacity: 0.85 }]}
        onPress={onLinkAccount}
      >
        <Text style={styles.linkButtonText}>Link Income Account</Text>
      </Pressable>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function HistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { deposits, isLoading, refetch } = useDeposits();

  const groups = useMemo(() => groupByMonth(deposits), [deposits]);

  function handleDepositPress(deposit: Deposit) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    switch (deposit.status) {
      case 'pending':
        router.push(`/deposit/${deposit.id}/allocate`);
        break;
      case 'processing':
        router.push(`/deposit/${deposit.id}/processing`);
        break;
      case 'completed':
        router.push(`/deposit/${deposit.id}/complete`);
        break;
      case 'failed':
        router.push(`/deposit/${deposit.id}/processing`);
        break;
    }
  }

  function handleRetry(deposit: Deposit) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(`/deposit/${deposit.id}/processing`);
  }

  function handleLinkAccount() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/bank-accounts');
  }

  // Loading
  if (isLoading && deposits.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Split History</Text>
          <View style={[styles.filterButton, { opacity: 0.4 }]}>
            <Ionicons name="options-outline" size={20} color={Colors.text.secondary} />
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Split History</Text>
        <Pressable style={styles.filterButton} hitSlop={8}>
          <Ionicons name="options-outline" size={20} color={Colors.text.secondary} />
        </Pressable>
      </View>

      {deposits.length === 0 ? (
        <EmptyHistory onLinkAccount={handleLinkAccount} />
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 32 },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refetch}
              tintColor={Colors.primary}
            />
          }
        >
          {groups.map((group) => (
            <View key={group.label} style={styles.monthGroup}>
              <Text style={styles.monthLabel}>{group.label}</Text>
              {group.deposits.map((deposit) => (
                <DepositCard
                  key={deposit.id}
                  deposit={deposit}
                  onPress={() => handleDepositPress(deposit)}
                  onRetry={() => handleRetry(deposit)}
                />
              ))}
            </View>
          ))}

          {/* End of history */}
          <View style={styles.endOfHistory}>
            <Ionicons name="reader-outline" size={28} color={`${Colors.text.muted}30`} />
            <Text style={styles.endOfHistoryText}>End of history</Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xl,
    color: Colors.text.primary,
    letterSpacing: -0.25,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.card,
  },

  // Scroll
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.page,
    paddingTop: Spacing[6],
  },

  // Month group
  monthGroup: {
    marginBottom: Spacing[8],
  },
  monthLabel: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xs,
    color: Colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: LetterSpacing.widest,
    marginBottom: Spacing[4],
  },

  // Card
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing[5],
    marginBottom: Spacing[4],
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    ...Shadows.card,
  },
  cardPending: {
    borderColor: `${Colors.primary}30`,
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.95,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing[4],
  },
  cardDate: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.md,
    color: Colors.text.muted,
    marginBottom: Spacing[1],
  },
  cardAmount: {
    fontFamily: FontFamily.black,
    fontSize: FontSize['2xl'],
    color: Colors.text.primary,
    letterSpacing: -0.5,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing[4],
    borderTopWidth: 1,
    borderTopColor: Colors.gray[100],
  },
  cardSubtitle: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.md,
    color: Colors.text.secondary,
  },

  // Status badge
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: Spacing[3],
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  badgeText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: LetterSpacing.wide,
  },

  // Failed footer
  failedLabel: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.sm,
    color: Colors.error.text,
  },
  retryButton: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    backgroundColor: Colors.error.bgSolid,
    borderRadius: BorderRadius.lg,
  },
  retryButtonText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.sm,
    color: 'white',
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyIconBox: {
    width: 96,
    height: 96,
    borderRadius: 40,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[6],
    ...Shadows.card,
  },
  emptyTitle: {
    fontFamily: FontFamily.black,
    fontSize: FontSize.lg,
    color: Colors.text.primary,
    marginBottom: Spacing[2],
  },
  emptyText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.md,
    color: Colors.text.muted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing[6],
  },
  linkButton: {
    width: '100%',
    paddingVertical: Spacing[4],
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius['2xl'],
    alignItems: 'center',
    ...Shadows.buttonPrimary,
  },
  linkButtonText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    color: 'white',
  },

  // End of history
  endOfHistory: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing[10],
    gap: Spacing[2],
  },
  endOfHistoryText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.text.muted,
    fontStyle: 'italic',
  },
});
