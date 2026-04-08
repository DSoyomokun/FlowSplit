/**
 * Bucket Configuration Screen
 * Manage destination buckets with loading, empty, and error states
 *
 * Stories: 53, 54, 55, 56, 57
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Modal,
  TextInput,
  Switch,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

import { Colors, BucketColors } from '@/constants/colors';
import { FontFamily, FontSize } from '@/constants/typography';
import { BorderRadius, Spacing, Size } from '@/constants/spacing';
import { Shadows } from '@/constants/shadows';
import {
  Header,
  BucketConfigCard,
  AddBucketButton,
  Button,
  BottomActionBar,
  Skeleton,
  SkeletonCard,
  EmptyBuckets,
} from '@/components';
import { useBuckets } from '@/hooks';
import * as api from '@/services/api';
import type { Bucket, BankAccount } from '@/types';

interface BucketConfig {
  id: string;
  name: string;
  percentage: number;
  color: string;
  icon?: string;
  destination?: {
    name: string;
    type: 'bank' | 'external';
    lastFour?: string;
  };
  error?: {
    title: string;
    description: string;
  };
}

function mapBucket(bucket: Bucket, index: number, bankAccounts: BankAccount[]): BucketConfig {
  let destination: BucketConfig['destination'];
  if (bucket.destination_type === 'external_link') {
    destination = { name: bucket.external_name || 'External Link', type: 'external' as const };
  } else if (bucket.destination_type === 'internal_transfer') {
    const acct = bankAccounts.find((a) => a.id === bucket.destination_account_id);
    const name = acct
      ? `${acct.name}${acct.mask ? ` ••••${acct.mask}` : ''}`
      : 'Internal Transfer';
    destination = { name, type: 'bank' as const };
  }
  return {
    id: bucket.id,
    name: bucket.name,
    percentage: bucket.bucket_type === 'percentage' ? bucket.allocation_value : 10,
    color: bucket.color || BucketColors[index % BucketColors.length],
    icon: bucket.emoji || undefined,
    destination,
  };
}

export default function BucketConfigurationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { buckets: rawBuckets, isLoading, refetch, updateBucket } = useBuckets();
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    api.getBankAccounts().then(setBankAccounts).catch(() => {});
  }, []);

  // Delivery method modal state
  const [editingBucketId, setEditingBucketId] = useState<string | null>(null);
  const [deliveryType, setDeliveryType] = useState<'internal_transfer' | 'external_link'>('external_link');
  const [externalUrl, setExternalUrl] = useState('');
  const [externalName, setExternalName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const buckets: BucketConfig[] = rawBuckets.map((b, i) => mapBucket(b, i, bankAccounts));

  const handleRefresh = async () => {
    setIsRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await refetch();
    setIsRefreshing(false);
  };

  const handleBucketPress = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // TODO: Navigate to edit bucket screen
  };

  const handleMorePress = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/buckets/${id}`);
  };

  const handleDestinationPress = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const bucket = rawBuckets.find((b) => b.id === id);
    if (bucket) {
      setEditingBucketId(id);
      setDeliveryType(
        bucket.destination_type === 'external_link' ? 'external_link' : 'internal_transfer'
      );
      setExternalUrl(bucket.external_url || '');
      setExternalName(bucket.external_name || '');
    }
  };

  const handleReconnect = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // TODO: Initiate reconnection flow
  };

  const handleAddBucket = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/buckets/new');
  };

  const handleCreateFirstBucket = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/buckets/new');
  };

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.back();
  };

  const handleSaveDelivery = async () => {
    if (!editingBucketId) return;
    setIsSaving(true);
    try {
      await updateBucket(editingBucketId, {
        destination_type: deliveryType,
        external_url: deliveryType === 'external_link' ? externalUrl : null,
        external_name: deliveryType === 'external_link' ? externalName : null,
      });
      setEditingBucketId(null);
    } catch (err) {
      console.error('Failed to save delivery method:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const hasErrors = buckets.some((b) => b.error);
  const hasBuckets = buckets.length > 0;

  // Loading State
  if (isLoading) {
    return (
      <View style={styles.container}>
        <Header showBack />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Size.bottomBarHeight + insets.bottom + Spacing[8] },
          ]}
        >
          <View style={styles.titleSection}>
            <Text style={styles.title}>Configure{'\n'}Destination Buckets</Text>
            <Skeleton width={200} height={14} style={styles.subtitleSkeleton} />
          </View>

          <View style={styles.bucketList}>
            {[1, 2, 3].map((i) => (
              <SkeletonCard key={i} />
            ))}
            <View style={{ opacity: 0.5 }}>
              <AddBucketButton onPress={() => {}} />
            </View>
          </View>
        </ScrollView>

        <BottomActionBar>
          <Button disabled loading>
            Loading Settings
          </Button>
          <Text style={styles.footerText}>
            Changes will apply to the current $1,200 split.
          </Text>
        </BottomActionBar>
      </View>
    );
  }

  // Empty State
  if (!hasBuckets) {
    return (
      <View style={styles.container}>
        <Header showBack />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            styles.emptyContent,
            { paddingBottom: Size.bottomBarHeight + insets.bottom + Spacing[8] },
          ]}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
          }
        >
          <View style={styles.titleSection}>
            <Text style={styles.title}>Configure{'\n'}Destination Buckets</Text>
            <Text style={styles.subtitle}>
              Review where each split will be delivered.
            </Text>
          </View>

          <View style={styles.emptyState}>
            <EmptyBuckets onCreateBucket={handleCreateFirstBucket} />
          </View>
        </ScrollView>

        <BottomActionBar>
          <Button disabled>Continue to Confirmation</Button>
          <Text style={styles.footerText}>
            Add at least one bucket to proceed with the split.
          </Text>
        </BottomActionBar>
      </View>
    );
  }

  // Normal State
  return (
    <View style={styles.container}>
      <Header showBack />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Size.bottomBarHeight + insets.bottom + Spacing[8] },
        ]}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleSection}>
          <Text style={styles.title}>Configure{'\n'}Destination Buckets</Text>
          <Text style={styles.subtitle}>
            Review where each split will be delivered.
          </Text>
        </View>

        <View style={styles.bucketList}>
          {buckets.map((bucket) => (
            <BucketConfigCard
              key={bucket.id}
              id={bucket.id}
              name={bucket.name}
              percentage={bucket.percentage}
              color={bucket.color}
              icon={bucket.icon}
              destination={bucket.destination}
              error={
                bucket.error
                  ? {
                      ...bucket.error,
                      onReconnect: () => handleReconnect(bucket.id),
                    }
                  : undefined
              }
              onPress={handleBucketPress}
              onMorePress={handleMorePress}
              onDestinationPress={handleDestinationPress}
            />
          ))}

          <AddBucketButton onPress={handleAddBucket} />
        </View>
      </ScrollView>

      <BottomActionBar>
        <Button onPress={handleContinue} variant={hasErrors ? 'secondary' : 'primary'}>
          Continue to Confirmation
        </Button>
        <Text style={styles.footerText}>
          Changes will apply to the current $1,200 split.
        </Text>
      </BottomActionBar>

      {/* Delivery Method Modal */}
      <Modal
        visible={editingBucketId !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setEditingBucketId(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setEditingBucketId(null)}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalSheet}
        >
          {/* Handle */}
          <View style={styles.sheetHandle} />

          <Text style={styles.sheetTitle}>Delivery Method</Text>
          <Text style={styles.sheetSubtitle}>
            Choose how funds are sent when this bucket is filled.
          </Text>

          {/* Toggle row */}
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[
                styles.toggleOption,
                deliveryType === 'internal_transfer' && styles.toggleOptionActive,
              ]}
              onPress={() => setDeliveryType('internal_transfer')}
            >
              <Ionicons
                name="swap-horizontal-outline"
                size={20}
                color={deliveryType === 'internal_transfer' ? Colors.primary : Colors.text.muted}
              />
              <Text
                style={[
                  styles.toggleOptionText,
                  deliveryType === 'internal_transfer' && styles.toggleOptionTextActive,
                ]}
              >
                Internal Transfer
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.toggleOption,
                deliveryType === 'external_link' && styles.toggleOptionActive,
              ]}
              onPress={() => setDeliveryType('external_link')}
            >
              <Ionicons
                name="link-outline"
                size={20}
                color={deliveryType === 'external_link' ? Colors.primary : Colors.text.muted}
              />
              <Text
                style={[
                  styles.toggleOptionText,
                  deliveryType === 'external_link' && styles.toggleOptionTextActive,
                ]}
              >
                External Link
              </Text>
            </TouchableOpacity>
          </View>

          {deliveryType === 'external_link' && (
            <View style={styles.externalFields}>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Display Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={externalName}
                  onChangeText={setExternalName}
                  placeholder="e.g. Pushpay / FaithChurch"
                  placeholderTextColor={Colors.text.muted}
                  autoCorrect={false}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Destination URL</Text>
                <TextInput
                  style={styles.textInput}
                  value={externalUrl}
                  onChangeText={setExternalUrl}
                  placeholder="https://pushpay.com/g/your-org"
                  placeholderTextColor={Colors.text.muted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                />
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[styles.saveButton, isSaving && { opacity: 0.7 }]}
            onPress={handleSaveDelivery}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.saveButtonText}>Save Delivery Method</Text>
            )}
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.page,
    paddingTop: Spacing[5],
  },
  emptyContent: {
    flex: 1,
  },
  titleSection: {
    marginBottom: Spacing[6],
  },
  title: {
    fontFamily: FontFamily.black,
    fontSize: FontSize['2xl'],
    color: Colors.text.primary,
    lineHeight: 32,
  },
  subtitle: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.md,
    color: Colors.text.muted,
    marginTop: Spacing[2],
  },
  subtitleSkeleton: {
    marginTop: Spacing[2],
  },
  bucketList: {
    gap: Spacing[4],
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
  },
  footerText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.text.muted,
    textAlign: 'center',
  },

  // Delivery Method Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalSheet: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: Spacing.page,
    paddingBottom: 40,
    paddingTop: Spacing[4],
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border.light,
    alignSelf: 'center',
    marginBottom: Spacing[5],
  },
  sheetTitle: {
    fontFamily: FontFamily.black,
    fontSize: FontSize.xl,
    color: Colors.text.primary,
    marginBottom: Spacing[1],
  },
  sheetSubtitle: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.text.muted,
    marginBottom: Spacing[6],
  },

  // Toggle
  toggleRow: {
    flexDirection: 'row',
    gap: Spacing[3],
    marginBottom: Spacing[6],
  },
  toggleOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    paddingVertical: Spacing[3],
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    borderColor: Colors.border.light,
    backgroundColor: Colors.background,
  },
  toggleOptionActive: {
    borderColor: Colors.primary,
    backgroundColor: `${Colors.primary}10`,
  },
  toggleOptionText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.sm,
    color: Colors.text.muted,
  },
  toggleOptionTextActive: {
    color: Colors.primary,
  },

  // External fields
  externalFields: {
    gap: Spacing[4],
    marginBottom: Spacing[6],
  },
  fieldGroup: {
    gap: Spacing[2],
  },
  fieldLabel: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
  },
  textInput: {
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: Colors.border.light,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[4],
    fontFamily: FontFamily.medium,
    fontSize: FontSize.md,
    color: Colors.text.primary,
  },

  // Save button
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.xl,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    color: 'white',
  },
});
