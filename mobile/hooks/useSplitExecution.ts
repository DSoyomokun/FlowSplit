/**
 * Split Execution Hook
 * Execute and manage split operations
 *
 * Story 76: Mutations - useExecuteSplit
 */

import { useCallback, useState, useRef } from 'react';
import * as Haptics from 'expo-haptics';
import { useSplitFlowStore } from '@/stores';
import * as api from '@/services/api';
import type { SplitPlan } from '@/types';

export type ExecutionStatus = 'idle' | 'preparing' | 'executing' | 'complete' | 'partial' | 'failed';

interface AllocationExecution {
  bucketId: string;
  status: 'pending' | 'processing' | 'complete' | 'error';
  error?: string;
}

interface UseSplitExecutionReturn {
  // State
  status: ExecutionStatus;
  allocations: AllocationExecution[];
  completedCount: number;
  failedCount: number;
  error: string | null;

  // Actions
  execute: (planId: string) => Promise<SplitPlan | null>;
  retry: () => Promise<void>;
  cancel: () => void;
  reset: () => void;
}

export function useSplitExecution(): UseSplitExecutionReturn {
  const flowStore = useSplitFlowStore();

  const [status, setStatus] = useState<ExecutionStatus>('idle');
  const [allocations, setAllocations] = useState<AllocationExecution[]>([]);
  const [error, setError] = useState<string | null>(null);

  const cancelledRef = useRef(false);
  const planRef = useRef<SplitPlan | null>(null);

  // Computed
  const completedCount = allocations.filter((a) => a.status === 'complete').length;
  const failedCount = allocations.filter((a) => a.status === 'error').length;

  const updateAllocationStatus = useCallback(
    (bucketId: string, status: AllocationExecution['status'], error?: string) => {
      setAllocations((prev) =>
        prev.map((a) =>
          a.bucketId === bucketId ? { ...a, status, error } : a
        )
      );

      // Also update flow store for UI
      flowStore.setProcessingStatus(bucketId, status, error);
    },
    [flowStore]
  );

  const execute = useCallback(
    async (planId: string): Promise<SplitPlan | null> => {
      cancelledRef.current = false;
      setError(null);

      try {
        setStatus('preparing');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

        // Fetch the split plan
        const plan = await api.getSplitPlan(planId);
        planRef.current = plan;

        // Initialize allocation statuses
        const initialAllocations: AllocationExecution[] = plan.actions.map((action) => ({
          bucketId: action.bucket_id,
          status: 'pending',
        }));
        setAllocations(initialAllocations);

        // Approve the plan to begin execution
        setStatus('executing');
        const approvedPlan = await api.approveSplitPlan(planId);

        // Simulate processing each action
        // In a real app, you'd poll for status updates
        for (const action of approvedPlan.actions) {
          if (cancelledRef.current) {
            break;
          }

          updateAllocationStatus(action.bucket_id, 'processing');

          // Simulate API call
          await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 500));

          if (cancelledRef.current) {
            break;
          }

          // Check if action was executed (in real app, fetch updated status)
          // For demo, randomly fail ~5% of the time
          const failed = Math.random() < 0.05;

          if (failed) {
            updateAllocationStatus(action.bucket_id, 'error', 'Transfer timed out');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          } else {
            updateAllocationStatus(action.bucket_id, 'complete');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        }

        // Determine final status
        const finalAllocations = useSplitFlowStore.getState().processingStatuses;
        const hasErrors = Object.values(finalAllocations).some((s) => s === 'error');

        if (hasErrors) {
          setStatus('partial');
          flowStore.setComplete(true);
        } else {
          setStatus('complete');
          flowStore.setComplete(false);
        }

        return approvedPlan;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Execution failed';
        setError(message);
        setStatus('failed');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return null;
      }
    },
    [flowStore, updateAllocationStatus]
  );

  const retry = useCallback(async () => {
    const failedAllocations = allocations.filter((a) => a.status === 'error');

    if (failedAllocations.length === 0) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStatus('executing');

    for (const allocation of failedAllocations) {
      updateAllocationStatus(allocation.bucketId, 'pending');
    }

    // Retry each failed allocation
    for (const allocation of failedAllocations) {
      if (cancelledRef.current) break;

      updateAllocationStatus(allocation.bucketId, 'processing');

      await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 500));

      if (cancelledRef.current) break;

      // Retry has better success rate (90%)
      const failed = Math.random() < 0.1;

      if (failed) {
        updateAllocationStatus(allocation.bucketId, 'error', 'Retry failed');
      } else {
        updateAllocationStatus(allocation.bucketId, 'complete');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }

    // Check final status
    const currentAllocations = useSplitFlowStore.getState().processingStatuses;
    const stillHasErrors = Object.values(currentAllocations).some((s) => s === 'error');

    if (stillHasErrors) {
      setStatus('partial');
    } else {
      setStatus('complete');
      flowStore.setComplete(false);
    }
  }, [allocations, flowStore, updateAllocationStatus]);

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    // Mark remaining pending/processing as cancelled
    setAllocations((prev) =>
      prev.map((a) =>
        a.status === 'pending' || a.status === 'processing'
          ? { ...a, status: 'error', error: 'Cancelled' }
          : a
      )
    );
    setStatus('partial');
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setAllocations([]);
    setError(null);
    cancelledRef.current = false;
    planRef.current = null;
  }, []);

  return {
    status,
    allocations,
    completedCount,
    failedCount,
    error,
    execute,
    retry,
    cancel,
    reset,
  };
}
