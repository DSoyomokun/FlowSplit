import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/colors';
import { FontFamily, FontSize, LetterSpacing } from '@/constants/typography';
import { BorderRadius, Spacing } from '@/constants/spacing';
import { Shadows } from '@/constants/shadows';
import { usePlaidLink } from '@/hooks/usePlaidLink';
import * as api from '@/services/api';
import type { BankAccount } from '@/types';

export default function BankAccountsScreen() {
  const insets = useSafeAreaInsets();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAccounts = useCallback(async () => {
    try {
      const data = await api.getBankAccounts();
      setAccounts(data);
    } catch {
      // silent
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const { openPlaidLink, isLoading: isLinking, error: linkError } = usePlaidLink(
    (newAccounts) => {
      setAccounts((prev) => [...prev, ...newAccounts]);
    }
  );

  useEffect(() => {
    if (linkError) Alert.alert('Link Error', linkError);
  }, [linkError]);

  const handleSetPrimary = async (account: BankAccount) => {
    try {
      const updated = await api.updateBankAccount(account.id, { is_primary: true });
      setAccounts((prev) =>
        prev.map((a) => (a.id === updated.id ? updated : { ...a, is_primary: false }))
      );
    } catch {
      Alert.alert('Error', 'Failed to set primary account');
    }
  };

  const handleRemove = (account: BankAccount) => {
    Alert.alert(
      'Remove Account',
      `Remove ${account.name}${account.mask ? ` (••••${account.mask})` : ''}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteBankAccount(account.id);
              setAccounts((prev) => prev.filter((a) => a.id !== account.id));
            } catch {
              Alert.alert('Error', 'Failed to remove account');
            }
          },
        },
      ]
    );
  };

  const handleMenu = (account: BankAccount) => {
    const options: { text: string; onPress?: () => void; style?: 'cancel' | 'destructive' }[] = [];
    if (!account.is_primary) {
      options.push({ text: 'Set as Primary', onPress: () => handleSetPrimary(account) });
    }
    options.push({ text: 'Remove Account', style: 'destructive', onPress: () => handleRemove(account) });
    options.push({ text: 'Cancel', style: 'cancel' });
    Alert.alert(account.name, undefined, options);
  };

  const getAccountIcon = (type: string): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'depository': return 'wallet-outline';
      case 'credit': return 'card-outline';
      case 'loan': return 'trending-down-outline';
      default: return 'cash-outline';
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={8}>
            <Ionicons name="chevron-back" size={24} color={Colors.text.muted} />
          </Pressable>
          <Text style={styles.headerTitle}>Bank Accounts</Text>
          <View style={styles.backButton} />
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={Colors.text.muted} />
        </Pressable>
        <Text style={styles.headerTitle}>Bank Accounts</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchAccounts(); }}
            tintColor={Colors.primary}
          />
        }
      >
        {accounts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBox}>
              <Ionicons name="wallet-outline" size={40} color={`${Colors.primary}30`} />
            </View>
            <Text style={styles.emptyTitle}>No Accounts Linked</Text>
            <Text style={styles.emptyText}>
              Connect your bank account to start auto-splitting your deposits.
            </Text>
          </View>
        ) : (
          <View style={styles.accountList}>
            {accounts.map((account) => (
              <View key={account.id} style={styles.accountCard}>
                <View style={styles.accountRow}>
                  <View style={[
                    styles.accountIcon,
                    account.is_primary && styles.accountIconPrimary,
                  ]}>
                    <Ionicons
                      name={getAccountIcon(account.type)}
                      size={22}
                      color={account.is_primary ? Colors.primary : Colors.text.secondary}
                    />
                  </View>

                  <View style={styles.accountInfo}>
                    <View style={styles.accountNameRow}>
                      <Text style={styles.accountName}>{account.name}</Text>
                      {account.is_primary && (
                        <View style={styles.primaryBadge}>
                          <Text style={styles.primaryBadgeText}>Primary</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.accountDetail}>
                      {account.institution_name || 'Bank'}
                      {account.mask ? ` • ••••${account.mask}` : ''}
                      {` • ${account.subtype || account.type}`}
                    </Text>
                  </View>

                  <Pressable style={styles.menuButton} onPress={() => handleMenu(account)} hitSlop={8}>
                    <Ionicons name="ellipsis-vertical" size={20} color={Colors.text.muted} />
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Link Account Button */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + Spacing[4] }]}>
        <Pressable
          style={[styles.linkButton, isLinking && { opacity: 0.7 }]}
          onPress={openPlaidLink}
          disabled={isLinking}
        >
          {isLinking ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Ionicons name="add-circle-outline" size={20} color="white" />
              <Text style={styles.linkButtonText}>Link Bank Account</Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

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
  backButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },

  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.page,
    paddingTop: Spacing[6],
  },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    paddingTop: Spacing[16],
    paddingHorizontal: Spacing[8],
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
  },

  // Account list
  accountList: {
    gap: Spacing[4],
  },
  accountCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.cardMedium,
    padding: Spacing[5],
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    ...Shadows.card,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[4],
  },
  accountIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  accountIconPrimary: {
    backgroundColor: Colors.primaryLight,
  },
  accountInfo: {
    flex: 1,
    gap: Spacing[1],
  },
  accountNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    flexWrap: 'wrap',
  },
  accountName: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    color: Colors.text.primary,
  },
  primaryBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing[2],
    paddingVertical: 2,
    borderRadius: BorderRadius.badge,
  },
  primaryBadgeText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xs,
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: LetterSpacing.wide,
  },
  accountDetail: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
  },
  menuButton: {
    padding: Spacing[1],
  },

  // Bottom bar
  bottomBar: {
    paddingHorizontal: Spacing.page,
    paddingTop: Spacing[4],
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border.subtle,
  },
  linkButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.xl,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    ...Shadows.buttonPrimary,
  },
  linkButtonText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    color: 'white',
  },
});
