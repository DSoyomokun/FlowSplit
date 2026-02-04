/**
 * AccountSelector Component
 * List of bank accounts with single selection
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '@/constants/colors';
import { FontFamily, FontSize } from '@/constants/typography';
import { BorderRadius, Spacing } from '@/constants/spacing';
import { AccountCard } from './AccountCard';
import { SectionLabel } from './SectionLabel';

interface Account {
  id: string;
  name: string;
  type?: string;
  lastFour?: string;
  bankId?: string;
}

interface AccountSelectorProps {
  accounts: Account[];
  selectedId?: string;
  onSelect: (id: string) => void;
  onAddAccount?: () => void;
  label?: string;
  style?: ViewStyle;
  showAddButton?: boolean;
}

export function AccountSelector({
  accounts,
  selectedId,
  onSelect,
  onAddAccount,
  label = 'Source Account',
  style,
  showAddButton = true,
}: AccountSelectorProps) {
  return (
    <View style={[styles.container, style]}>
      {/* Label */}
      <SectionLabel size="sm">{label}</SectionLabel>

      {/* Account List */}
      <View style={styles.list}>
        {accounts.map((account) => (
          <AccountCard
            key={account.id}
            id={account.id}
            name={account.name}
            type={account.type}
            lastFour={account.lastFour}
            bankId={account.bankId}
            selected={account.id === selectedId}
            onPress={onSelect}
          />
        ))}

        {/* Add Account Button */}
        {showAddButton && (
          <Pressable onPress={onAddAccount} style={styles.addButton}>
            <Ionicons name="add" size={18} color={Colors.text.muted} />
            <Text style={styles.addButtonText}>Connect new source</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing[4],
  },
  list: {
    gap: Spacing[3],
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    padding: Spacing[5],
    borderRadius: BorderRadius.cardMedium,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.border.dashed,
  },
  addButtonText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    color: Colors.text.muted,
  },
});
