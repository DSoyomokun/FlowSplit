import { useCallback, useEffect, useState } from 'react';
import * as api from '@/services/api';
import type { Deposit } from '@/types';

export function useDeposits() {
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [pendingDeposits, setPendingDeposits] = useState<Deposit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDeposits = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [allDeposits, pending] = await Promise.all([
        api.getDeposits(),
        api.getPendingDeposits(),
      ]);
      setDeposits(allDeposits);
      setPendingDeposits(pending);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load deposits');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeposits();
  }, [fetchDeposits]);

  return {
    deposits,
    pendingDeposits,
    isLoading,
    error,
    refetch: fetchDeposits,
  };
}
