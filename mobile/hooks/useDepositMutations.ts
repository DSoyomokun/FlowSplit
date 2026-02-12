/**
 * Deposit Mutations Hook
 * Create deposit operations
 */

import { useCallback, useState } from 'react';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as api from '@/services/api';
import type { Deposit } from '@/types';

interface CreateDepositData {
  amount: number;
  description?: string;
}

interface UseDepositMutationsReturn {
  isCreating: boolean;
  error: string | null;
  createDeposit: (data: CreateDepositData) => Promise<Deposit | null>;
  clearError: () => void;
}

export function useDepositMutations(): UseDepositMutationsReturn {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const createDeposit = useCallback(
    async (data: CreateDepositData): Promise<Deposit | null> => {
      try {
        setIsCreating(true);
        setError(null);
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }

        const deposit = await api.createDeposit({
          ...data,
          source: 'manual',
        });

        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        return deposit;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create deposit';
        setError(message);
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
        return null;
      } finally {
        setIsCreating(false);
      }
    },
    []
  );

  return {
    isCreating,
    error,
    createDeposit,
    clearError,
  };
}
