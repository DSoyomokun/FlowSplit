/**
 * Buckets Store
 * Global state for bucket management
 *
 * Story 72: State management setup
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Bucket } from '@/types';

interface BucketsState {
  // State
  buckets: Bucket[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  lastFetched: number | null;

  // Actions
  setBuckets: (buckets: Bucket[]) => void;
  addBucket: (bucket: Bucket) => void;
  updateBucket: (id: string, updates: Partial<Bucket>) => void;
  removeBucket: (id: string) => void;
  reorderBuckets: (ids: string[]) => void;
  setLoading: (loading: boolean) => void;
  setRefreshing: (refreshing: boolean) => void;
  setError: (error: string | null) => void;
  clearBuckets: () => void;

  // Selectors
  getBucketById: (id: string) => Bucket | undefined;
  getActiveBuckets: () => Bucket[];
  getTotalAllocation: () => number;
}

export const useBucketsStore = create<BucketsState>()(
  persist(
    (set, get) => ({
      // Initial state
      buckets: [],
      isLoading: false,
      isRefreshing: false,
      error: null,
      lastFetched: null,

      // Actions
      setBuckets: (buckets) =>
        set({
          buckets: buckets.sort((a, b) => a.sort_order - b.sort_order),
          error: null,
          lastFetched: Date.now(),
        }),

      addBucket: (bucket) =>
        set((state) => ({
          buckets: [...state.buckets, bucket].sort((a, b) => a.sort_order - b.sort_order),
        })),

      updateBucket: (id, updates) =>
        set((state) => ({
          buckets: state.buckets.map((b) =>
            b.id === id ? { ...b, ...updates } : b
          ),
        })),

      removeBucket: (id) =>
        set((state) => ({
          buckets: state.buckets.filter((b) => b.id !== id),
        })),

      reorderBuckets: (ids) =>
        set((state) => {
          const reordered = ids
            .map((id, index) => {
              const bucket = state.buckets.find((b) => b.id === id);
              return bucket ? { ...bucket, sort_order: index } : null;
            })
            .filter((b): b is Bucket => b !== null);
          return { buckets: reordered };
        }),

      setLoading: (isLoading) => set({ isLoading }),

      setRefreshing: (isRefreshing) => set({ isRefreshing }),

      setError: (error) => set({ error, isLoading: false, isRefreshing: false }),

      clearBuckets: () =>
        set({ buckets: [], error: null, lastFetched: null }),

      // Selectors
      getBucketById: (id) => get().buckets.find((b) => b.id === id),

      getActiveBuckets: () => get().buckets.filter((b) => b.is_active),

      getTotalAllocation: () =>
        get()
          .buckets.filter((b) => b.is_active && b.bucket_type === 'percentage')
          .reduce((sum, b) => sum + b.allocation_value, 0),
    }),
    {
      name: 'flowsplit-buckets',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        buckets: state.buckets,
        lastFetched: state.lastFetched,
      }),
    }
  )
);
