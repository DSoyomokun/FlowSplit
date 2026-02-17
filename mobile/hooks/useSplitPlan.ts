/**
 * useSplitPlan Hook
 * Fetch, create, and manage split plans
 *
 * Story 75: API hooks - useSplitPlan(depositId)
 */

import { useCallback, useEffect, useState } from 'react';
import * as api from '@/services/api';
import type { SplitPlan, SplitPlanPreview } from '@/types';

interface UseSplitPlanOptions {
  /** Skip initial fetch */
  skip?: boolean;
  /** Auto-load preview if no plan exists */
  autoPreview?: boolean;
}

interface UseSplitPlanReturn {
  plan: SplitPlan | null;
  preview: SplitPlanPreview | null;
  isLoading: boolean;
  isCreating: boolean;
  isApproving: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  loadPreview: () => Promise<SplitPlanPreview | null>;
  createPlan: (actions: { bucket_id: string; amount: number }[]) => Promise<SplitPlan | null>;
  approvePlan: () => Promise<SplitPlan | null>;
}

export function useSplitPlan(
  depositId: string | undefined,
  options: UseSplitPlanOptions = {}
): UseSplitPlanReturn {
  const { skip = false, autoPreview = true } = options;

  const [plan, setPlan] = useState<SplitPlan | null>(null);
  const [preview, setPreview] = useState<SplitPlanPreview | null>(null);
  const [isLoading, setIsLoading] = useState(!skip && !!depositId);
  const [isCreating, setIsCreating] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPreview = useCallback(async () => {
    if (!depositId) return null;

    try {
      setIsLoading(true);
      setError(null);
      const data = await api.previewSplitPlan(depositId);
      setPreview(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load preview');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [depositId]);

  const fetchPlan = useCallback(async () => {
    if (!depositId) {
      setPlan(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Try to get existing plan by deposit ID
      try {
        const existingPlan = await api.getSplitPlanByDeposit(depositId);
        setPlan(existingPlan);
      } catch {
        // No plan exists yet — load preview instead
        setPlan(null);
        if (autoPreview) {
          await loadPreview();
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load split plan');
    } finally {
      setIsLoading(false);
    }
  }, [depositId, autoPreview, loadPreview]);

  // Initial fetch
  useEffect(() => {
    if (!skip && depositId) {
      fetchPlan();
    }
  }, [depositId, skip, fetchPlan]);

  const createPlan = useCallback(
    async (actions: { bucket_id: string; amount: number }[]) => {
      if (!depositId || !preview) return null;

      try {
        setIsCreating(true);
        setError(null);

        const newPlan = await api.createSplitPlan({
          deposit_id: depositId,
          total_amount: preview.total_amount,
          actions,
        });

        setPlan(newPlan);
        return newPlan;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create split plan');
        return null;
      } finally {
        setIsCreating(false);
      }
    },
    [depositId, preview]
  );

  const approvePlan = useCallback(async () => {
    if (!plan) return null;

    try {
      setIsApproving(true);
      setError(null);

      const approvedPlan = await api.approveSplitPlan(plan.id);
      setPlan(approvedPlan);
      return approvedPlan;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve split plan');
      return null;
    } finally {
      setIsApproving(false);
    }
  }, [plan]);

  return {
    plan,
    preview,
    isLoading,
    isCreating,
    isApproving,
    error,
    refetch: fetchPlan,
    loadPreview,
    createPlan,
    approvePlan,
  };
}
