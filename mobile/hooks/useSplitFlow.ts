/**
 * useSplitFlow Hook
 * Orchestrates the split flow with store and API integration
 *
 * Story 73: Split flow state
 * Story 76: Mutations - useExecuteSplit()
 */

import { useCallback, useEffect } from 'react';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  useSplitFlowStore,
  createAllocationsFromBuckets,
  type SplitFlowStep,
  type Allocation,
} from '@/stores';
import { useBucketsStore } from '@/stores';
import * as api from '@/services/api';
import type { Bucket } from '@/types';

interface UseSplitFlowReturn {
  // State
  currentStep: SplitFlowStep;
  depositId: string | null;
  depositAmount: number;
  allocations: Allocation[];
  remainder: number;
  remainderPercentage: number;
  isSubmitting: boolean;
  processingStatuses: Record<string, 'pending' | 'processing' | 'complete' | 'error'>;
  hasPartialFailure: boolean;

  // Navigation
  startFlow: (amount: number, accountId: string, accountName: string) => void;
  goToStep: (step: SplitFlowStep) => void;
  goBack: () => void;
  exitFlow: () => void;

  // Allocation
  initAllocations: (buckets: Bucket[]) => void;
  updateAllocation: (bucketId: string, percentage: number) => void;
  setAllocations: (allocations: Allocation[]) => void;

  // Execution
  confirmSplit: () => Promise<boolean>;
  retrySplit: () => Promise<void>;

  // Computed
  canProceed: boolean;
  totalAllocated: number;
}

export function useSplitFlow(): UseSplitFlowReturn {
  const router = useRouter();
  const store = useSplitFlowStore();
  const bucketsStore = useBucketsStore();

  // Navigation
  const startFlow = useCallback(
    (amount: number, accountId: string, accountName: string) => {
      store.initFlow(amount, accountId, accountName);

      // Initialize allocations from existing buckets
      const buckets = bucketsStore.getActiveBuckets();
      if (buckets.length > 0) {
        const allocations = createAllocationsFromBuckets(buckets, amount);
        store.setAllocations(allocations);
      }

      // Create deposit and navigate
      // In real app, this would call API to create deposit
      const depositId = `deposit-${Date.now()}`;
      store.setDepositId(depositId);

      router.push(`/deposit/${depositId}/allocate`);
    },
    [store, bucketsStore, router]
  );

  const goToStep = useCallback(
    (step: SplitFlowStep) => {
      const { depositId } = store;

      store.setStep(step);

      switch (step) {
        case 'setup':
          router.push('/deposit/setup');
          break;
        case 'allocate':
          router.push(`/deposit/${depositId}/allocate`);
          break;
        case 'confirm':
          router.push(`/deposit/${depositId}/confirm`);
          break;
        case 'processing':
          router.push(`/deposit/${depositId}/processing`);
          break;
        case 'complete':
          router.replace(`/deposit/${depositId}/complete`);
          break;
      }
    },
    [store, router]
  );

  const goBack = useCallback(() => {
    const { currentStep } = store;

    const stepOrder: SplitFlowStep[] = ['setup', 'allocate', 'confirm', 'processing', 'complete'];
    const currentIndex = stepOrder.indexOf(currentStep);

    if (currentIndex > 0) {
      const prevStep = stepOrder[currentIndex - 1];
      // Don't go back to processing
      if (prevStep !== 'processing') {
        goToStep(prevStep);
      }
    } else {
      exitFlow();
    }
  }, [store, goToStep]);

  const exitFlow = useCallback(() => {
    store.resetFlow();
    router.replace('/(tabs)');
  }, [store, router]);

  // Allocation
  const initAllocations = useCallback(
    (buckets: Bucket[]) => {
      const allocations = createAllocationsFromBuckets(buckets, store.depositAmount);
      store.setAllocations(allocations);
    },
    [store]
  );

  // Execution
  const confirmSplit = useCallback(async () => {
    const { allocations, depositId, depositAmount } = store;

    if (!depositId) return false;

    try {
      store.setSubmitting(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

      // Navigate to processing screen
      goToStep('processing');

      // Initialize all statuses to pending
      allocations.forEach((a) => {
        store.setProcessingStatus(a.bucketId, 'pending');
      });

      // Simulate processing each allocation
      let hasErrors = false;

      for (const allocation of allocations) {
        store.setProcessingStatus(allocation.bucketId, 'processing');

        try {
          // Simulate API call with delay
          await new Promise((resolve) => setTimeout(resolve, 600 + Math.random() * 400));

          // Random failure for demo (5% chance)
          if (Math.random() < 0.05) {
            throw new Error('Transfer failed');
          }

          store.setProcessingStatus(allocation.bucketId, 'complete');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (err) {
          hasErrors = true;
          store.setProcessingStatus(
            allocation.bucketId,
            'error',
            err instanceof Error ? err.message : 'Transfer failed'
          );
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }
      }

      // Complete the flow
      store.setComplete(hasErrors);

      if (!hasErrors) {
        // Auto-navigate to complete after brief delay
        setTimeout(() => {
          goToStep('complete');
        }, 800);
      }

      return !hasErrors;
    } catch (err) {
      store.setSubmitting(false);
      return false;
    }
  }, [store, goToStep]);

  const retrySplit = useCallback(async () => {
    const { allocations, processingStatuses } = store;

    // Find failed allocations
    const failedAllocations = allocations.filter(
      (a) => processingStatuses[a.bucketId] === 'error'
    );

    if (failedAllocations.length === 0) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Reset failed to pending
    failedAllocations.forEach((a) => {
      store.setProcessingStatus(a.bucketId, 'pending');
    });

    // Retry each failed allocation
    for (const allocation of failedAllocations) {
      store.setProcessingStatus(allocation.bucketId, 'processing');

      try {
        await new Promise((resolve) => setTimeout(resolve, 600 + Math.random() * 400));
        store.setProcessingStatus(allocation.bucketId, 'complete');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (err) {
        store.setProcessingStatus(
          allocation.bucketId,
          'error',
          err instanceof Error ? err.message : 'Retry failed'
        );
      }
    }

    // Check if all complete now
    const allComplete = allocations.every(
      (a) => useSplitFlowStore.getState().processingStatuses[a.bucketId] === 'complete'
    );

    if (allComplete) {
      store.setComplete(false);
      setTimeout(() => goToStep('complete'), 800);
    }
  }, [store, goToStep]);

  return {
    // State
    currentStep: store.currentStep,
    depositId: store.depositId,
    depositAmount: store.depositAmount,
    allocations: store.allocations,
    remainder: store.remainder,
    remainderPercentage: store.remainderPercentage,
    isSubmitting: store.isSubmitting,
    processingStatuses: store.processingStatuses,
    hasPartialFailure: store.hasPartialFailure,

    // Navigation
    startFlow,
    goToStep,
    goBack,
    exitFlow,

    // Allocation
    initAllocations,
    updateAllocation: store.updateAllocation,
    setAllocations: store.setAllocations,

    // Execution
    confirmSplit,
    retrySplit,

    // Computed
    canProceed: store.canProceed(),
    totalAllocated: store.getTotalAllocated(),
  };
}
