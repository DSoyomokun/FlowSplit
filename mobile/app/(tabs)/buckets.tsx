/**
 * Buckets Tab
 * Manage all allocation buckets — tap ⋯ to edit, FAB to create new
 */

import React from 'react';
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

import { Colors, BucketColors } from '@/constants/colors';
import { FontFamily, FontSize, LetterSpacing } from '@/constants/typography';
import { BorderRadius, Spacing } from '@/constants/spacing';
import { Shadows } from '@/constants/shadows';
import { BucketConfigCard, FloatingActionButton } from '@/components';
import { useBuckets } from '@/hooks';
import type { Bucket } from '@/types';

function mapDestination(bucket: Bucket) {
  if (bucket.destination_type === 'external_link') {
    return { name: bucket.external_name || 'External Link', type: 'external' as const };
  }
  if (bucket.destination_type === 'internal_transfer') {
    return { name: 'Internal Transfer', type: 'bank' as const };
  }
  return undefined;
}

export default function BucketsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { buckets, isLoading, refetch } = useBuckets();

  const totalAllocated = buckets
    .filter((b) => b.bucket_type === 'percentage')
    .reduce((sum, b) => sum + b.allocation_value, 0);

  const remaining = Math.max(0, 100 - totalAllocated);

  function handleEdit(id: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/buckets/${id}`);
  }

  function handleAdd() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/buckets/new');
  }

  if (isLoading && buckets.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Buckets</Text>
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
        <Text style={styles.headerTitle}>My Buckets</Text>
        <Pressable
          style={styles.configureButton}
          onPress={() => router.push('/buckets/configure')}
          hitSlop={8}
        >
          <Ionicons name="settings-outline" size={20} color={Colors.text.secondary} />
        </Pressable>
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
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor={Colors.primary}
          />
        }
      >
        {/* Allocation summary pill */}
        {buckets.length > 0 && (
          <View style={styles.summaryRow}>
            <View style={styles.summaryPill}>
              <View style={[styles.summaryDot, { backgroundColor: Colors.primary }]} />
              <Text style={styles.summaryText}>
                <Text style={styles.summaryBold}>{Math.round(totalAllocated)}%</Text>
                {' '}allocated
              </Text>
            </View>
            <View style={styles.summaryPill}>
              <View style={[styles.summaryDot, { backgroundColor: Colors.gray[300] }]} />
              <Text style={styles.summaryText}>
                <Text style={styles.summaryBold}>{Math.round(remaining)}%</Text>
                {' '}to checking
              </Text>
            </View>
          </View>
        )}

        {/* Bucket list */}
        {buckets.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBox}>
              <Ionicons name="pie-chart-outline" size={40} color={`${Colors.primary}30`} />
            </View>
            <Text style={styles.emptyTitle}>No buckets yet</Text>
            <Text style={styles.emptyText}>
              Create your first bucket to start automatically splitting deposits.
            </Text>
            <Pressable
              style={({ pressed }) => [styles.createButton, pressed && { opacity: 0.85 }]}
              onPress={handleAdd}
            >
              <Ionicons name="add" size={18} color="white" />
              <Text style={styles.createButtonText}>Create First Bucket</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.bucketList}>
            {buckets.map((bucket, index) => (
              <BucketConfigCard
                key={bucket.id}
                id={bucket.id}
                name={bucket.name}
                percentage={
                  bucket.bucket_type === 'percentage' ? bucket.allocation_value : 0
                }
                color={bucket.color || BucketColors[index % BucketColors.length]}
                icon={bucket.emoji || undefined}
                destination={mapDestination(bucket)}
                onMorePress={handleEdit}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {buckets.length > 0 && (
        <FloatingActionButton onPress={handleAdd} />
      )}
    </View>
  );
}

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
  configureButton: {
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

  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.page,
    paddingTop: Spacing[5],
    gap: Spacing[4],
  },

  // Summary
  summaryRow: {
    flexDirection: 'row',
    gap: Spacing[3],
  },
  summaryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    ...Shadows.subtle,
  },
  summaryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  summaryText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
  },
  summaryBold: {
    fontFamily: FontFamily.bold,
    color: Colors.text.primary,
  },

  bucketList: {
    gap: Spacing[4],
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
    marginBottom: Spacing[6],
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    paddingHorizontal: Spacing[6],
    paddingVertical: Spacing[4],
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius['2xl'],
    ...Shadows.buttonPrimary,
  },
  createButtonText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    color: 'white',
  },
});
