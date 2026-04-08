/**
 * Create Split Template Screen
 * Name + ordered list of bucket allocations saved as a reusable preset
 */

import React, { useState, useMemo } from 'react';
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

import { Colors, BucketColors } from '@/constants/colors';
import { FontFamily, FontSize, LetterSpacing } from '@/constants/typography';
import { BorderRadius, Spacing } from '@/constants/spacing';
import { Shadows } from '@/constants/shadows';
import { Header, Button } from '@/components';
import { useBuckets } from '@/hooks';
import * as api from '@/services/api';
import type { Bucket } from '@/types';

type AllocationType = 'percentage' | 'fixed';

interface TemplateItem {
  bucket: Bucket;
  allocation_type: AllocationType;
  allocation_value: string;
}

function SectionLabel({ children }: { children: string }) {
  return (
    <Text style={styles.sectionLabel}>{children}</Text>
  );
}

export default function NewTemplateScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { buckets } = useBuckets();

  const [name, setName] = useState('');
  const [nameFocused, setNameFocused] = useState(false);
  const [items, setItems] = useState<TemplateItem[]>([]);
  const [showBucketPicker, setShowBucketPicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const usedBucketIds = useMemo(() => new Set(items.map((i) => i.bucket.id)), [items]);
  const availableBuckets = useMemo(
    () => buckets.filter((b) => !usedBucketIds.has(b.id)),
    [buckets, usedBucketIds]
  );

  const isFormValid =
    name.trim().length > 0 &&
    items.length > 0 &&
    items.every((item) => {
      const val = parseFloat(item.allocation_value);
      return !isNaN(val) && val > 0;
    });

  const handleAddBucket = (bucket: Bucket) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setItems((prev) => [
      ...prev,
      {
        bucket,
        allocation_type: (bucket.bucket_type as AllocationType) ?? 'percentage',
        allocation_value: String(bucket.allocation_value ?? 10),
      },
    ]);
    setShowBucketPicker(false);
  };

  const handleRemoveItem = (bucketId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setItems((prev) => prev.filter((i) => i.bucket.id !== bucketId));
  };

  const handleTypeToggle = (bucketId: string) => {
    setItems((prev) =>
      prev.map((i) =>
        i.bucket.id === bucketId
          ? { ...i, allocation_type: i.allocation_type === 'percentage' ? 'fixed' : 'percentage' }
          : i
      )
    );
  };

  const handleValueChange = (bucketId: string, value: string) => {
    setItems((prev) =>
      prev.map((i) => (i.bucket.id === bucketId ? { ...i, allocation_value: value } : i))
    );
  };

  const handleSave = async () => {
    if (!isFormValid) return;
    setIsSaving(true);
    setError(null);
    try {
      await api.createSplitTemplate({
        name: name.trim(),
        items: items.map((item) => ({
          bucket_id: item.bucket.id,
          allocation_type: item.allocation_type,
          allocation_value: parseFloat(item.allocation_value),
        })),
      });
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create template');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Header title="New Split" showBack rightAction="none" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Name */}
        <View style={styles.section}>
          <SectionLabel>Split Name</SectionLabel>
          <View style={styles.card}>
            <TextInput
              style={[styles.input, nameFocused && styles.inputFocused]}
              value={name}
              onChangeText={setName}
              onFocus={() => setNameFocused(true)}
              onBlur={() => setNameFocused(false)}
              placeholder="e.g. Paycheck, Side Hustle, Bonus"
              placeholderTextColor={Colors.text.muted}
              autoCapitalize="words"
              returnKeyType="done"
            />
          </View>
        </View>

        {/* Buckets */}
        <View style={styles.section}>
          <SectionLabel>Buckets</SectionLabel>

          {items.length > 0 && (
            <View style={styles.itemList}>
              {items.map((item, index) => (
                <BucketItemRow
                  key={item.bucket.id}
                  item={item}
                  index={index}
                  onTypeToggle={() => handleTypeToggle(item.bucket.id)}
                  onValueChange={(v) => handleValueChange(item.bucket.id, v)}
                  onRemove={() => handleRemoveItem(item.bucket.id)}
                />
              ))}
            </View>
          )}

          {availableBuckets.length > 0 && (
            <Pressable
              style={styles.addBucketRow}
              onPress={() => setShowBucketPicker(true)}
            >
              <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
              <Text style={styles.addBucketText}>Add Bucket</Text>
            </Pressable>
          )}

          {items.length === 0 && availableBuckets.length === 0 && (
            <Text style={styles.noBucketsText}>
              Create buckets first before making a split template.
            </Text>
          )}
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing[4] }]}>
        {error && <Text style={styles.errorText}>{error}</Text>}
        <Button onPress={handleSave} disabled={!isFormValid} loading={isSaving}>
          Save Template
        </Button>
      </View>

      {/* Bucket Picker Modal */}
      <Modal
        visible={showBucketPicker}
        animationType="slide"
        transparent
        onRequestClose={() => setShowBucketPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom + Spacing[4] }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Bucket</Text>
              <Pressable onPress={() => setShowBucketPicker(false)} hitSlop={8}>
                <Ionicons name="close" size={22} color={Colors.text.muted} />
              </Pressable>
            </View>
            <FlatList
              data={availableBuckets}
              keyExtractor={(b) => b.id}
              renderItem={({ item: bucket, index }) => (
                <Pressable
                  style={({ pressed }) => [styles.pickerRow, pressed && { opacity: 0.75 }]}
                  onPress={() => handleAddBucket(bucket)}
                >
                  <View
                    style={[
                      styles.pickerDot,
                      { backgroundColor: bucket.color || BucketColors[index % BucketColors.length] },
                    ]}
                  />
                  <Text style={styles.pickerName}>{bucket.name}</Text>
                  <Text style={styles.pickerAlloc}>
                    {bucket.bucket_type === 'percentage'
                      ? `${bucket.allocation_value}%`
                      : `$${bucket.allocation_value}`}
                  </Text>
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

interface BucketItemRowProps {
  item: TemplateItem;
  index: number;
  onTypeToggle: () => void;
  onValueChange: (v: string) => void;
  onRemove: () => void;
}

function BucketItemRow({ item, index, onTypeToggle, onValueChange, onRemove }: BucketItemRowProps) {
  const [focused, setFocused] = useState(false);
  const color = item.bucket.color || BucketColors[index % BucketColors.length];

  return (
    <View style={styles.itemRow}>
      <View style={[styles.itemColorDot, { backgroundColor: color }]} />
      <Text style={styles.itemName} numberOfLines={1}>{item.bucket.name}</Text>

      <Pressable style={styles.typeToggle} onPress={onTypeToggle}>
        <Text style={styles.typeToggleText}>
          {item.allocation_type === 'percentage' ? '%' : '$'}
        </Text>
      </Pressable>

      <TextInput
        style={[styles.itemValueInput, focused && styles.itemValueInputFocused]}
        value={item.allocation_value}
        onChangeText={onValueChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        keyboardType="decimal-pad"
        placeholder="0"
        placeholderTextColor={Colors.text.muted}
        selectTextOnFocus
      />

      <Pressable onPress={onRemove} hitSlop={8} style={styles.removeButton}>
        <Ionicons name="remove-circle-outline" size={20} color={Colors.error.text} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.page,
    paddingTop: Spacing[6],
    paddingBottom: Spacing[8],
    gap: Spacing[6],
  },

  section: { gap: Spacing[2] },
  sectionLabel: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: Colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: Spacing[1],
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.cardMedium,
    padding: Spacing[4],
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    ...Shadows.card,
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
  inputFocused: { borderColor: Colors.primary },

  // Item list
  itemList: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.cardMedium,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    overflow: 'hidden',
    ...Shadows.card,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    gap: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  itemColorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    flexShrink: 0,
  },
  itemName: {
    flex: 1,
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    color: Colors.text.primary,
  },
  typeToggle: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeToggleText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
  },
  itemValueInput: {
    width: 60,
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: Colors.border.light,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing[2],
    paddingVertical: Spacing[2],
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    color: Colors.text.primary,
    textAlign: 'right',
  },
  itemValueInputFocused: { borderColor: Colors.primary },
  removeButton: { padding: Spacing[1] },

  addBucketRow: {
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
  addBucketText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    color: Colors.primary,
  },
  noBucketsText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.text.muted,
    textAlign: 'center',
    padding: Spacing[4],
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

  // Bucket picker modal
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
  pickerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    flexShrink: 0,
  },
  pickerName: {
    flex: 1,
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    color: Colors.text.primary,
  },
  pickerAlloc: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.text.muted,
  },
  pickerSeparator: {
    height: 1,
    backgroundColor: Colors.border.light,
    marginLeft: Spacing.page + 12 + Spacing[3],
  },
});
