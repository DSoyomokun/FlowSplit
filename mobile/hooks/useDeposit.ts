/**
 * useDeposit Hook
 * Fetch and manage a single deposit
 *
 * Story 75: API hooks - useDeposit(id)
 */

import { useCallback, useEffect, useState } from 'react';
import * as api from '@/services/api';
import type { Deposit } from '@/types';

interface UseDepositOptions {
  /** Skip initial fetch */
  skip?: boolean;
  /** Poll for updates at this interval (ms) */
  pollInterval?: number;
}

interface UseDepositReturn {
  deposit: Deposit | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useDeposit(
  depositId: string | undefined,
  options: UseDepositOptions = {}
): UseDepositReturn {
  const { skip = false, pollInterval } = options;

  const [deposit, setDeposit] = useState<Deposit | null>(null);
  const [isLoading, setIsLoading] = useState(!skip && !!depositId);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDeposit = useCallback(
    async (isRefresh = false) => {
      if (!depositId) {
        setDeposit(null);
        setIsLoading(false);
        return;
      }

      try {
        if (isRefresh) {
          setIsRefreshing(true);
        } else {
          setIsLoading(true);
        }
        setError(null);

        const data = await api.getDeposit(depositId);
        setDeposit(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load deposit');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [depositId]
  );

  // Initial fetch
  useEffect(() => {
    if (!skip && depositId) {
      fetchDeposit();
    }
  }, [depositId, skip, fetchDeposit]);

  // Polling
  useEffect(() => {
    if (!pollInterval || !depositId || skip) return;

    const interval = setInterval(() => {
      fetchDeposit(true);
    }, pollInterval);

    return () => clearInterval(interval);
  }, [pollInterval, depositId, skip, fetchDeposit]);

  const refetch = useCallback(() => fetchDeposit(true), [fetchDeposit]);

  return {
    deposit,
    isLoading,
    isRefreshing,
    error,
    refetch,
  };
}
