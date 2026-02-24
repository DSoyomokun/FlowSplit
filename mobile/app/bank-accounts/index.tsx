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
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/colors';
import { usePlaidLink } from '@/hooks/usePlaidLink';
import * as api from '@/services/api';
import type { BankAccount } from '@/types';

export default function BankAccountsScreen() {
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
    if (linkError) {
      Alert.alert('Link Error', linkError);
    }
  }, [linkError]);

  const handleSetPrimary = async (account: BankAccount) => {
    try {
      const updated = await api.updateBankAccount(account.id, { is_primary: true });
      setAccounts((prev) =>
        prev.map((a) =>
          a.id === updated.id ? updated : { ...a, is_primary: false }
        )
      );
    } catch {
      Alert.alert('Error', 'Failed to set primary account');
    }
  };

  const handleRemove = (account: BankAccount) => {
    Alert.alert(
      'Remove Account',
      `Remove ${account.name} (••••${account.mask})?`,
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

  const getAccountIcon = (type: string): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'depository':
        return 'wallet-outline';
      case 'credit':
        return 'card-outline';
      case 'loan':
        return 'trending-down-outline';
      default:
        return 'cash-outline';
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </Pressable>
        <Text style={styles.title}>Bank Accounts</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchAccounts();
            }}
            tintColor={Colors.primary}
          />
        }
      >
        {accounts.length === 0 ? (
          /* Empty State */
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="wallet-outline" size={48} color={Colors.text.muted} />
            </View>
            <Text style={styles.emptyTitle}>No Accounts Linked</Text>
            <Text style={styles.emptySubtitle}>
              Connect your bank account to start auto-splitting your deposits.
            </Text>
          </View>
        ) : (
          /* Account List */
          <View style={styles.accountList}>
            {accounts.map((account) => (
              <Pressable
                key={account.id}
                style={styles.accountCard}
                onLongPress={() => handleRemove(account)}
              >
                <View style={styles.accountRow}>
                  <View style={[styles.accountIcon, account.is_primary && styles.accountIconPrimary]}>
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
                      {account.institution_name || 'Bank'} • ••••{account.mask} • {account.subtype || account.type}
                    </Text>
                  </View>
                  <Pressable
                    style={styles.menuButton}
                    onPress={() => {
                      const options: { text: string; onPress?: () => void; style?: 'cancel' | 'destructive' }[] = [];
                      if (!account.is_primary) {
                        options.push({
                          text: 'Set as Primary',
                          onPress: () => handleSetPrimary(account),
                        });
                      }
                      options.push({
                        text: 'Remove Account',
                        style: 'destructive',
                        onPress: () => handleRemove(account),
                      });
                      options.push({ text: 'Cancel', style: 'cancel' });
                      Alert.alert(account.name, undefined, options);
                    }}
                  >
                    <Ionicons name="ellipsis-vertical" size={20} color={Colors.text.muted} />
                  </Pressable>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Link Account Button */}
      <View style={styles.bottomBar}>
        <Pressable
          style={[styles.linkButton, isLinking && styles.linkButtonDisabled]}
          onPress={openPlaidLink}
          disabled={isLinking}
        >
          {isLinking ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="add-circle-outline" size={22} color="#fff" />
              <Text style={styles.linkButtonText}>Link Bank Account</Text>
            </>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 4,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Account list
  accountList: {
    gap: 12,
  },
  accountCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accountIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  accountIconPrimary: {
    backgroundColor: Colors.primaryLight,
  },
  accountInfo: {
    flex: 1,
  },
  accountNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  primaryBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  primaryBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primary,
  },
  accountDetail: {
    fontSize: 13,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  menuButton: {
    padding: 8,
  },

  // Bottom bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 32,
    backgroundColor: Colors.background,
  },
  linkButton: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  linkButtonDisabled: {
    opacity: 0.7,
  },
  linkButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
