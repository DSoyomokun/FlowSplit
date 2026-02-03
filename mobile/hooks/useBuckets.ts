import { useCallback, useEffect, useState } from 'react';
import * as api from '@/services/api';
import type { Bucket } from '@/types';

export function useBuckets() {
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBuckets = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.getBuckets();
      setBuckets(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load buckets');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBuckets();
  }, [fetchBuckets]);

  const createBucket = async (data: Parameters<typeof api.createBucket>[0]) => {
    const bucket = await api.createBucket(data);
    setBuckets((prev) => [...prev, bucket]);
    return bucket;
  };

  const updateBucket = async (id: string, data: Partial<Bucket>) => {
    const bucket = await api.updateBucket(id, data);
    setBuckets((prev) => prev.map((b) => (b.id === id ? bucket : b)));
    return bucket;
  };

  const deleteBucket = async (id: string) => {
    await api.deleteBucket(id);
    setBuckets((prev) => prev.filter((b) => b.id !== id));
  };

  const reorderBuckets = async (ids: string[]) => {
    const reordered = await api.reorderBuckets(ids);
    setBuckets(reordered);
  };

  return {
    buckets,
    isLoading,
    error,
    refetch: fetchBuckets,
    createBucket,
    updateBucket,
    deleteBucket,
    reorderBuckets,
  };
}
