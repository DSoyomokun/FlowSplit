/**
 * New Bucket Screen
 * Create a new allocation bucket with name, color, allocation rule, and delivery method
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '@/constants/colors';
import { FontFamily, FontSize, LetterSpacing } from '@/constants/typography';
import { BorderRadius, Spacing, Size } from '@/constants/spacing';
import { Shadows } from '@/constants/shadows';
import { Header, Button } from '@/components';
import * as api from '@/services/api';
import type { BankAccount } from '@/types';

const PALETTE_COLORS = [
  '#0EA5A5',
  '#3B82F6',
  '#10B981',
  '#F59E0B',
  '#8B5CF6',
  '#EC4899',
  '#64748B',
  '#EAB308',
];

type AllocationType = 'percentage' | 'fixed';
type DeliveryType = 'internal_transfer' | 'external_link';

function SectionLabel({ children }: { children: string }) {
  return <Text style={sectionLabelStyle}>{children}</Text>;
}

const sectionLabelStyle = {
  fontFamily: FontFamily.bold,
  fontSize: 11,
  color: Colors.text.muted,
  textTransform: 'uppercase' as const,
  letterSpacing: 1.2,
  marginBottom: Spacing[3],
};

export default function NewBucketScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState('');
  const [nameFocused, setNameFocused] = useState(false);
  const [selectedColor, setSelectedColor] = useState(PALETTE_COLORS[0]);
  const [allocationType, setAllocationType] = useState<AllocationType>('percentage');
  const [allocationValue, setAllocationValue] = useState('');
  const [valueFocused, setValueFocused] = useState(false);
  const [destinationType, setDestinationType] = useState<DeliveryType | null>(null);
  const [externalName, setExternalName] = useState('');
  const [externalUrl, setExternalUrl] = useState('');
  const [externalNameFocused, setExternalNameFocused] = useState(false);
  const [externalUrlFocused, setExternalUrlFocused] = useState(false);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [showAccountPicker, setShowAccountPicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getBankAccounts().then(setBankAccounts).catch(() => {});
  }, []);

  const parsedValue = parseFloat(allocationValue);
  const externalLinkValid =
    destinationType !== 'external_link' ||
    (externalUrl.trim().startsWith('https://') && externalName.trim().length > 0);
  const internalTransferValid =
    destinationType !== 'internal_transfer' || selectedAccountId !== null;
  const isFormValid =
    name.trim().length > 0 &&
    !isNaN(parsedValue) &&
    parsedValue > 0 &&
    (allocationType === 'fixed' || parsedValue <= 100) &&
    destinationType !== null &&
    externalLinkValid &&
    internalTransferValid;

  const handleSave = async () => {
    if (!isFormValid) return;
    setIsSaving(true);
    setError(null);
    try {
      const bucket = await api.createBucket({
        name: name.trim(),
        color: selectedColor,
        bucket_type: allocationType,
        allocation_value: parsedValue,
      });
      // Persist delivery method + external link details immediately after creation
      await api.updateBucket(bucket.id, {
        destination_type: destinationType,
        destination_account_id: destinationType === 'internal_transfer' ? selectedAccountId : null,
        external_name: destinationType === 'external_link' ? externalName.trim() : null,
        external_url: destinationType === 'external_link' ? externalUrl.trim() : null,
      });
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create bucket');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Header title="Create Bucket" showBack rightAction="none" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Section 1: Bucket Identity ── */}
        <View style={styles.section}>
          <SectionLabel>Bucket Identity</SectionLabel>

          <View style={styles.card}>
            {/* Name */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Name</Text>
              <TextInput
                style={[styles.input, nameFocused && styles.inputFocused]}
                value={name}
                onChangeText={setName}
                onFocus={() => setNameFocused(true)}
                onBlur={() => setNameFocused(false)}
                placeholder="e.g., Tithe, Savings, Emergency Fund"
                placeholderTextColor={Colors.text.muted}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>

            {/* Color */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Color</Text>
              <View style={styles.colorGrid}>
                {PALETTE_COLORS.map((color) => {
                  const isSelected = color === selectedColor;
                  return (
                    <Pressable
                      key={color}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSelectedColor(color);
                      }}
                      style={[
                        styles.colorRing,
                        isSelected && { borderColor: color },
                      ]}
                    >
                      <View style={[styles.colorCircle, { backgroundColor: color }]}>
                        {isSelected && (
                          <Ionicons name="checkmark" size={16} color="white" />
                        )}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>
        </View>

        {/* ── Section 2: Allocation Rule ── */}
        <View style={styles.section}>
          <SectionLabel>Allocation Rule</SectionLabel>

          <View style={styles.card}>
            {/* Segmented control */}
            <View style={styles.segmentedControl}>
              {(['percentage', 'fixed'] as AllocationType[]).map((type) => {
                const isActive = allocationType === type;
                const label = type === 'percentage' ? 'Percentage' : 'Fixed Amount';
                return (
                  <Pressable
                    key={type}
                    style={[styles.segmentTab, isActive && styles.segmentTabActive]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setAllocationType(type);
                    }}
                  >
                    <Text style={[styles.segmentText, isActive && styles.segmentTextActive]}>
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Value input */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>
                Value {allocationType === 'percentage' ? '(%)' : '($)'}
              </Text>
              <View style={styles.inputRow}>
                <Text style={styles.inputPrefix}>
                  {allocationType === 'percentage' ? '%' : '$'}
                </Text>
                <TextInput
                  style={[styles.input, styles.inputWithPrefix, valueFocused && styles.inputFocused]}
                  value={allocationValue}
                  onChangeText={setAllocationValue}
                  onFocus={() => setValueFocused(true)}
                  onBlur={() => setValueFocused(false)}
                  placeholder={allocationType === 'percentage' ? '10' : '100'}
                  placeholderTextColor={Colors.text.muted}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
          </View>
        </View>

        {/* ── Section 3: Delivery Method ── */}
        <View style={styles.section}>
          <SectionLabel>Delivery Method</SectionLabel>

          <View style={styles.deliveryCards}>
            <DeliveryCard
              icon="swap-horizontal-outline"
              title="Internal Transfer"
              description="Move funds automatically to another linked bank account."
              selected={destinationType === 'internal_transfer'}
              selectedColor={selectedColor}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setDestinationType('internal_transfer');
                setExternalName('');
                setExternalUrl('');
              }}
            />
            <DeliveryCard
              icon="open-outline"
              title="External Link"
              description="Generate a pre-filled link for manual payments (e.g. Pushpay)."
              selected={destinationType === 'external_link'}
              selectedColor={selectedColor}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setDestinationType('external_link');
              }}
            />
          </View>

          {/* Internal transfer — bank account picker */}
          {destinationType === 'internal_transfer' && (
            <View style={[styles.card, { marginTop: Spacing[3] }]}>
              <Text style={styles.fieldLabel}>Destination Account</Text>
              {bankAccounts.length === 0 ? (
                <Text style={styles.fieldHint}>No linked bank accounts found. Add one in Settings.</Text>
              ) : (
                <Pressable
                  style={styles.accountPickerRow}
                  onPress={() => setShowAccountPicker(true)}
                >
                  {selectedAccountId ? (() => {
                    const acct = bankAccounts.find((a) => a.id === selectedAccountId)!;
                    return (
                      <>
                        <View style={styles.accountInfo}>
                          <Text style={styles.accountName}>{acct.name}</Text>
                          <Text style={styles.accountMeta}>
                            {acct.institution_name}{acct.mask ? ` •••• ${acct.mask}` : ''}
                          </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={Colors.text.muted} />
                      </>
                    );
                  })() : (
                    <>
                      <Text style={styles.accountPlaceholder}>Select a bank account</Text>
                      <Ionicons name="chevron-forward" size={18} color={Colors.text.muted} />
                    </>
                  )}
                </Pressable>
              )}
            </View>
          )}

          {/* External link fields — shown inline when external_link is selected */}
          {destinationType === 'external_link' && (
            <View style={[styles.card, { marginTop: Spacing[3] }]}>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Display Name</Text>
                <TextInput
                  style={[styles.input, externalNameFocused && styles.inputFocused]}
                  value={externalName}
                  onChangeText={setExternalName}
                  onFocus={() => setExternalNameFocused(true)}
                  onBlur={() => setExternalNameFocused(false)}
                  placeholder="e.g. Pushpay / FaithChurch"
                  placeholderTextColor={Colors.text.muted}
                  autoCorrect={false}
                />
              </View>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>URL Template</Text>
                <TextInput
                  style={[styles.input, externalUrlFocused && styles.inputFocused]}
                  value={externalUrl}
                  onChangeText={setExternalUrl}
                  onFocus={() => setExternalUrlFocused(true)}
                  onBlur={() => setExternalUrlFocused(false)}
                  placeholder="https://pushpay.com/g/org?a={{amount}}"
                  placeholderTextColor={Colors.text.muted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                />
                <Text style={styles.fieldHint}>
                  Use {'{{amount}}'} to auto-fill the split amount
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* ── Footer ── */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing[4] }]}>
        {error && <Text style={styles.errorText}>{error}</Text>}
        <Button
          onPress={handleSave}
          disabled={!isFormValid}
          loading={isSaving}
        >
          Save Bucket
        </Button>
      </View>
      {/* Bank account picker modal */}
      <Modal
        visible={showAccountPicker}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAccountPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom + Spacing[4] }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Account</Text>
              <Pressable onPress={() => setShowAccountPicker(false)} hitSlop={8}>
                <Ionicons name="close" size={22} color={Colors.text.muted} />
              </Pressable>
            </View>
            <FlatList
              data={bankAccounts}
              keyExtractor={(a) => a.id}
              renderItem={({ item: acct }) => (
                <Pressable
                  style={({ pressed }) => [styles.pickerRow, pressed && { opacity: 0.75 }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedAccountId(acct.id);
                    setShowAccountPicker(false);
                  }}
                >
                  <View style={styles.pickerAccountIcon}>
                    <Ionicons name="business-outline" size={18} color={Colors.primary} />
                  </View>
                  <View style={styles.pickerAccountInfo}>
                    <Text style={styles.pickerAccountName}>{acct.name}</Text>
                    <Text style={styles.pickerAccountMeta}>
                      {acct.institution_name}{acct.mask ? ` •••• ${acct.mask}` : ''}
                    </Text>
                  </View>
                  {selectedAccountId === acct.id && (
                    <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
                  )}
                </Pressable>
              )}
              ItemSeparatorComponent={() => <View style={styles.pickerSeparator} />}
            />
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

interface DeliveryCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  selected: boolean;
  selectedColor: string;
  onPress: () => void;
}

function DeliveryCard({ icon, title, description, selected, selectedColor, onPress }: DeliveryCardProps) {
  return (
    <Pressable
      style={[
        styles.deliveryCard,
        selected && { borderColor: selectedColor, borderWidth: 1.5 },
      ]}
      onPress={onPress}
    >
      <View
        style={[
          styles.deliveryIcon,
          selected && { backgroundColor: Colors.primaryLight },
        ]}
      >
        <Ionicons
          name={icon}
          size={20}
          color={selected ? Colors.primary : Colors.text.muted}
        />
      </View>
      <View style={styles.deliveryText}>
        <Text style={styles.deliveryTitle}>{title}</Text>
        <Text style={styles.deliveryDescription}>{description}</Text>
      </View>
      {selected && (
        <Ionicons name="checkmark-circle" size={20} color={selectedColor} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.page,
    paddingTop: Spacing[6],
    paddingBottom: Spacing[8],
    gap: Spacing[6],
  },

  // Sections
  section: {
    gap: Spacing[2],
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.card,
    padding: Spacing[5],
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    gap: Spacing[5],
    ...Shadows.card,
  },

  // Fields
  fieldGroup: {
    gap: Spacing[2],
  },
  fieldLabel: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.base,
    color: Colors.text.secondary,
  },
  input: {
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: Colors.border.light,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    fontFamily: FontFamily.medium,
    fontSize: FontSize.md,
    color: Colors.text.primary,
  },
  inputFocused: {
    borderColor: Colors.primary,
  },
  inputRow: {
    position: 'relative',
    justifyContent: 'center',
  },
  inputPrefix: {
    position: 'absolute',
    left: Spacing[4],
    zIndex: 1,
    fontFamily: FontFamily.bold,
    fontSize: FontSize.sm,
    color: Colors.text.muted,
  },
  inputWithPrefix: {
    paddingLeft: Spacing[4] + 18,
  },
  fieldHint: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.base,
    color: Colors.text.muted,
    marginTop: Spacing[1],
  },

  // Color picker
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[3],
  },
  colorRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'transparent',
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Segmented control
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: `${Colors.gray[100]}80`,
    borderRadius: BorderRadius.xl,
    padding: 4,
    gap: 4,
  },
  segmentTab: {
    flex: 1,
    paddingVertical: Spacing[2],
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentTabActive: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    ...Shadows.card,
  },
  segmentText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.text.muted,
  },
  segmentTextActive: {
    fontFamily: FontFamily.bold,
    color: Colors.text.primary,
  },

  // Delivery cards
  deliveryCards: {
    gap: Spacing[3],
  },
  deliveryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[4],
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.card,
    padding: Spacing[5],
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    ...Shadows.card,
  },
  deliveryIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.gray[50],
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  deliveryText: {
    flex: 1,
    gap: 3,
  },
  deliveryTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    color: Colors.text.primary,
  },
  deliveryDescription: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.base,
    color: Colors.text.secondary,
    lineHeight: 18,
  },

  // Account picker row (inline)
  accountPickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: Colors.border.light,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    gap: Spacing[3],
  },
  accountInfo: { flex: 1 },
  accountName: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    color: Colors.text.primary,
  },
  accountMeta: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.text.muted,
    marginTop: 2,
  },
  accountPlaceholder: {
    flex: 1,
    fontFamily: FontFamily.medium,
    fontSize: FontSize.md,
    color: Colors.text.muted,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: BorderRadius.card,
    borderTopRightRadius: BorderRadius.card,
    paddingTop: Spacing[5],
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.page,
    paddingBottom: Spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  modalTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.lg,
    color: Colors.text.primary,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.page,
    paddingVertical: Spacing[4],
    gap: Spacing[3],
  },
  pickerAccountIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  pickerAccountInfo: { flex: 1 },
  pickerAccountName: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    color: Colors.text.primary,
  },
  pickerAccountMeta: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.text.muted,
    marginTop: 2,
  },
  pickerSeparator: {
    height: 1,
    backgroundColor: Colors.border.light,
    marginLeft: Spacing.page + 36 + Spacing[3],
  },

  // Footer
  footer: {
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[100],
    paddingHorizontal: Spacing.page,
    paddingTop: Spacing[4],
    gap: Spacing[2],
  },
  errorText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.error.text,
    textAlign: 'center',
  },
});
