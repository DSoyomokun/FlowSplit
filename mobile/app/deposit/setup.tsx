/**
 * Deposit Setup Screen
 * Enter deposit amount and select source account
 *
 * Stories: 46, 47, 48
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { Colors } from '@/constants/colors';
import { FontFamily, FontSize } from '@/constants/typography';
import { BorderRadius, Spacing, Size } from '@/constants/spacing';
import {
  Header,
  AmountInput,
  AccountSelector,
  Button,
  BottomActionBar,
  Skeleton,
} from '@/components';

// Mock accounts for development
const MOCK_ACCOUNTS = [
  {
    id: '1',
    name: 'Chase Checking',
    type: 'Main Hub',
    lastFour: '4821',
    bankId: 'chase',
  },
  {
    id: '2',
    name: 'Venmo Balance',
    type: 'Gig Income',
    lastFour: undefined,
    bankId: 'venmo',
  },
];

export default function DepositSetupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Form state
  const [amount, setAmount] = useState(0);
  const [selectedAccountId, setSelectedAccountId] = useState<string | undefined>(
    MOCK_ACCOUNTS[0]?.id
  );
  const [isLoading, setIsLoading] = useState(false);

  // Validation
  const minAmount = 0.01;
  const maxAmount = 999999.99;
  const isValidAmount = amount >= minAmount && amount <= maxAmount;
  const hasSelectedAccount = !!selectedAccountId;
  const canContinue = isValidAmount && hasSelectedAccount && amount > 0;

  // Error message
  const getAmountError = useCallback(() => {
    if (amount === 0) return undefined;
    if (amount < minAmount) return `Minimum amount is $${minAmount.toFixed(2)}`;
    if (amount > maxAmount) return `Maximum amount is $${maxAmount.toLocaleString()}`;
    return undefined;
  }, [amount]);

  const handleAmountChange = (value: number) => {
    setAmount(value);
  };

  const handleAccountSelect = (id: string) => {
    setSelectedAccountId(id);
    Haptics.selectionAsync();
  };

  const handleAddAccount = () => {
    // TODO: Navigate to add account flow
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleContinue = async () => {
    if (!canContinue) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);

    try {
      // TODO: Create deposit via API and get ID
      // For now, navigate with mock ID
      const depositId = 'mock-deposit-' + Date.now();
      router.push(`/deposit/${depositId}/allocate`);
    } catch (error) {
      console.error('Failed to create deposit:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <Header showBack onBack={handleGoBack} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Size.bottomBarHeight + insets.bottom + Spacing[8] },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back Nav Label */}
          <Pressable onPress={handleGoBack} style={styles.backNav}>
            <Ionicons name="arrow-back" size={18} color={Colors.text.muted} />
            <Text style={styles.backNavText}>New Split</Text>
          </Pressable>

          {/* Amount Input Section */}
          <View style={styles.amountSection}>
            <AmountInput
              value={amount}
              onChange={handleAmountChange}
              min={minAmount}
              max={maxAmount}
              label="Deposit Amount"
              helperText="What's arriving in your account today?"
              error={getAmountError()}
              autoFocus
            />
          </View>

          {/* Account Selection Section */}
          <View style={styles.accountSection}>
            <AccountSelector
              accounts={MOCK_ACCOUNTS}
              selectedId={selectedAccountId}
              onSelect={handleAccountSelect}
              onAddAccount={handleAddAccount}
              label="Source Account"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom Action Bar */}
      <BottomActionBar>
        <Button
          onPress={handleContinue}
          disabled={!canContinue}
          loading={isLoading}
          rightIcon={<Ionicons name="arrow-forward" size={18} color="white" />}
        >
          Continue to Split
        </Button>
        <Text style={styles.footerText}>
          FlowSplit will analyze your rules and propose an allocation strategy based on this amount.
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
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.page,
    paddingTop: Spacing[6],
  },
  backNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    marginBottom: Spacing[8],
  },
  backNavText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.base,
    color: Colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  amountSection: {
    marginBottom: Spacing[8],
    paddingTop: Spacing[4],
  },
  accountSection: {
    marginBottom: Spacing[8],
  },
  footerText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.xs,
    color: Colors.text.muted,
    textAlign: 'center',
    paddingHorizontal: Spacing[8],
  },
});
