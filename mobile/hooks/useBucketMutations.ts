/**
 * Bucket Mutations Hook
 * Create, update, delete bucket operations
 *
 * Story 76: Mutations - useCreateBucket, useUpdateBucket, useDeleteBucket
 */

import { useCallback, useState } from 'react';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useBucketsStore } from '@/stores';
import * as api from '@/services/api';
import type { Bucket } from '@/types';

interface CreateBucketData {
  name: string;
  emoji?: string;
  color?: string;
  bucket_type: 'percentage' | 'fixed';
  allocation_value: number;
  target_amount?: number;
}

interface UpdateBucketData {
  name?: string;
  emoji?: string;
  color?: string;
  bucket_type?: 'percentage' | 'fixed';
  allocation_value?: number;
  target_amount?: number;
  is_active?: boolean;
}

interface UseBucketMutationsReturn {
  // State
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  isReordering: boolean;
  error: string | null;

  // Mutations
  createBucket: (data: CreateBucketData) => Promise<Bucket | null>;
  updateBucket: (id: string, data: UpdateBucketData) => Promise<Bucket | null>;
  deleteBucket: (id: string) => Promise<boolean>;
  reorderBuckets: (ids: string[]) => Promise<boolean>;

  // Helpers
  clearError: () => void;
}

export function useBucketMutations(): UseBucketMutationsReturn {
  const store = useBucketsStore();

  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const createBucket = useCallback(
    async (data: CreateBucketData): Promise<Bucket | null> => {
      try {
        setIsCreating(true);
        setError(null);
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }

        const bucket = await api.createBucket(data);
        store.addBucket(bucket);

        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        return bucket;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create bucket';
        setError(message);
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
        return null;
      } finally {
        setIsCreating(false);
      }
    },
    [store]
  );

  const updateBucket = useCallback(
    async (id: string, data: UpdateBucketData): Promise<Bucket | null> => {
      try {
        setIsUpdating(true);
        setError(null);
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }

        const bucket = await api.updateBucket(id, data);
        store.updateBucket(id, bucket);

        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        return bucket;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update bucket';
        setError(message);
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
        return null;
      } finally {
        setIsUpdating(false);
      }
    },
    [store]
  );

  const deleteBucket = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        setIsDeleting(true);
        setError(null);
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }

        await api.deleteBucket(id);
        store.removeBucket(id);

        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete bucket';
        setError(message);
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
        return false;
      } finally {
        setIsDeleting(false);
      }
    },
    [store]
  );

  const reorderBuckets = useCallback(
    async (ids: string[]): Promise<boolean> => {
      try {
        setIsReordering(true);
        setError(null);

        // Optimistic update
        store.reorderBuckets(ids);

        // Sync with server
        await api.reorderBuckets(ids);

        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to reorder buckets';
        setError(message);
        // Could rollback here if needed
        return false;
      } finally {
        setIsReordering(false);
      }
    },
    [store]
  );

  return {
    isCreating,
    isUpdating,
    isDeleting,
    isReordering,
    error,
    createBucket,
    updateBucket,
    deleteBucket,
    reorderBuckets,
    clearError,
  };
}
