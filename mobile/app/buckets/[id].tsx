/**
 * Edit Bucket Screen
 * Pre-populated form for editing an existing bucket's name, color,
 * allocation rule, and delivery method. Also handles deletion.
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
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '@/constants/colors';
import { FontFamily, FontSize } from '@/constants/typography';
import { BorderRadius, Spacing } from '@/constants/spacing';
import { Shadows } from '@/constants/shadows';
import { Header, Button } from '@/components';
import { useBuckets } from '@/hooks';
import * as api from '@/services/api';

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
      <View style={[styles.deliveryIcon, selected && { backgroundColor: Colors.primaryLight }]}>
        <Ionicons name={icon} size={20} color={selected ? Colors.primary : Colors.text.muted} />
      </View>
      <View style={styles.deliveryText}>
        <Text style={styles.deliveryTitle}>{title}</Text>
        <Text style={styles.deliveryDescription}>{description}</Text>
      </View>
      {selected && <Ionicons name="checkmark-circle" size={20} color={selectedColor} />}
    </Pressable>
  );
}

export default function EditBucketScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { buckets, isLoading: bucketsLoading } = useBuckets();

  // Form state — initialized once bucket loads
  const [name, setName] = useState('');
  const [nameFocused, setNameFocused] = useState(false);
  const [selectedColor, setSelectedColor] = useState(PALETTE_COLORS[0]);
  const [allocationType, setAllocationType] = useState<AllocationType>('percentage');
  const [allocationValue, setAllocationValue] = useState('');
  const [valueFocused, setValueFocused] = useState(false);
  const [deliveryType, setDeliveryType] = useState<DeliveryType | null>(null);
  const [externalUrl, setExternalUrl] = useState('');
  const [externalName, setExternalName] = useState('');
  const [externalUrlFocused, setExternalUrlFocused] = useState(false);
  const [externalNameFocused, setExternalNameFocused] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bucket = buckets.find((b) => b.id === id);

  // Populate form once bucket data arrives
  useEffect(() => {
    if (bucket && !initialized) {
      setName(bucket.name);
      setSelectedColor(bucket.color || PALETTE_COLORS[0]);
      setAllocationType(bucket.bucket_type);
      setAllocationValue(String(bucket.allocation_value));
      setDeliveryType(
        bucket.destination_type === 'external_link'
          ? 'external_link'
          : bucket.destination_type === 'internal_transfer'
          ? 'internal_transfer'
          : null
      );
      setExternalUrl(bucket.external_url || '');
      setExternalName(bucket.external_name || '');
      setInitialized(true);
    }
  }, [bucket, initialized]);

  const parsedValue = parseFloat(allocationValue);
  const externalLinkValid =
    deliveryType !== 'external_link' ||
    (externalUrl.trim().length > 0 && externalName.trim().length > 0);

  const isFormValid =
    name.trim().length > 0 &&
    !isNaN(parsedValue) &&
    parsedValue > 0 &&
    (allocationType === 'fixed' || parsedValue <= 100) &&
    deliveryType !== null &&
    externalLinkValid;

  const handleSave = async () => {
    if (!isFormValid || !id) return;
    setIsSaving(true);
    setError(null);
    try {
      await api.updateBucket(id, {
        name: name.trim(),
        color: selectedColor,
        bucket_type: allocationType,
        allocation_value: parsedValue,
        destination_type: deliveryType,
        external_url: deliveryType === 'external_link' ? externalUrl.trim() : null,
        external_name: deliveryType === 'external_link' ? externalName.trim() : null,
      });
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save bucket');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Delete Bucket',
      `Are you sure you want to delete "${bucket?.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!id) return;
            setIsDeleting(true);
            try {
              await api.deleteBucket(id);
              router.back();
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Failed to delete bucket');
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  // Loading state while buckets fetch
  if (bucketsLoading && !initialized) {
    return (
      <View style={styles.root}>
        <Header title="Edit Bucket" showBack rightAction="none" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      </View>
    );
  }

  // Bucket not found
  if (!bucketsLoading && !bucket) {
    return (
      <View style={styles.root}>
        <Header title="Edit Bucket" showBack rightAction="none" />
        <View style={styles.loadingContainer}>
          <Text style={styles.notFoundText}>Bucket not found.</Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Header title="Edit Bucket" showBack rightAction="none" />

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
                      style={[styles.colorRing, isSelected && { borderColor: color }]}
                    >
                      <View style={[styles.colorCircle, { backgroundColor: color }]}>
                        {isSelected && <Ionicons name="checkmark" size={16} color="white" />}
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
            <View style={styles.segmentedControl}>
              {(['percentage', 'fixed'] as AllocationType[]).map((type) => {
                const isActive = allocationType === type;
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
                      {type === 'percentage' ? 'Percentage' : 'Fixed Amount'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

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
              selected={deliveryType === 'internal_transfer'}
              selectedColor={selectedColor}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setDeliveryType('internal_transfer');
              }}
            />
            <DeliveryCard
              icon="open-outline"
              title="External Link"
              description="Generate a pre-filled link for manual payments (e.g. Pushpay)."
              selected={deliveryType === 'external_link'}
              selectedColor={selectedColor}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setDeliveryType('external_link');
              }}
            />
          </View>

          {/* External link fields — shown inline when external_link is selected */}
          {deliveryType === 'external_link' && (
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
                <Text style={styles.fieldLabel}>Destination URL</Text>
                <TextInput
                  style={[styles.input, externalUrlFocused && styles.inputFocused]}
                  value={externalUrl}
                  onChangeText={setExternalUrl}
                  onFocus={() => setExternalUrlFocused(true)}
                  onBlur={() => setExternalUrlFocused(false)}
                  placeholder="https://pushpay.com/g/your-org"
                  placeholderTextColor={Colors.text.muted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                />
              </View>
            </View>
          )}
        </View>

        {/* ── Danger Zone ── */}
        <View style={styles.section}>
          <SectionLabel>Danger Zone</SectionLabel>
          <Pressable
            style={({ pressed }) => [styles.deleteButton, pressed && { opacity: 0.75 }]}
            onPress={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <ActivityIndicator color={Colors.error.text} size="small" />
            ) : (
              <>
                <Ionicons name="trash-outline" size={18} color={Colors.error.text} />
                <Text style={styles.deleteButtonText}>Delete Bucket</Text>
              </>
            )}
          </Pressable>
        </View>
      </ScrollView>

      {/* ── Footer ── */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing[4] }]}>
        {error && <Text style={styles.errorText}>{error}</Text>}
        <Button onPress={handleSave} disabled={!isFormValid} loading={isSaving}>
          Save Changes
        </Button>
      </View>
    </KeyboardAvoidingView>
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFoundText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.md,
    color: Colors.text.muted,
  },

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

  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    paddingVertical: Spacing[4],
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    borderColor: Colors.error.border,
    backgroundColor: Colors.error.bg,
  },
  deleteButtonText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    color: Colors.error.text,
  },

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
