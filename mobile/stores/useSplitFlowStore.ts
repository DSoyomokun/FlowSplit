/**
 * Split Flow Store
 * Manages the state of the deposit split wizard flow
 *
 * Story 73: Split flow state management
 */

import { create } from 'zustand';
import type { Deposit, Bucket } from '@/types';

export type SplitFlowStep = 'setup' | 'allocate' | 'confirm' | 'processing' | 'complete';

export interface Allocation {
  bucketId: string;
  bucketName: string;
  percentage: number;
  amount: number;
  color: string;
}

export interface SplitFlowState {
  // Flow state
  currentStep: SplitFlowStep;
  depositId: string | null;

  // Setup step data
  depositAmount: number;
  sourceAccountId: string | null;
  sourceAccountName: string | null;

  // Allocation data
  allocations: Allocation[];
  remainder: number;
  remainderPercentage: number;

  // Processing state
  isSubmitting: boolean;
  processingStatuses: Record<string, 'pending' | 'processing' | 'complete' | 'error'>;
  processingErrors: Record<string, string>;

  // Result state
  completedAt: string | null;
  hasPartialFailure: boolean;

  // Actions
  initFlow: (amount: number, accountId: string, accountName: string) => void;
  setDepositId: (id: string) => void;
  setStep: (step: SplitFlowStep) => void;
  setAllocations: (allocations: Allocation[]) => void;
  updateAllocation: (bucketId: string, percentage: number) => void;
  setSubmitting: (submitting: boolean) => void;
  setProcessingStatus: (bucketId: string, status: 'pending' | 'processing' | 'complete' | 'error', error?: string) => void;
  setComplete: (hasPartialFailure?: boolean) => void;
  resetFlow: () => void;

  // Computed
  canProceed: () => boolean;
  getTotalAllocated: () => number;
}

const initialState = {
  currentStep: 'setup' as SplitFlowStep,
  depositId: null,
  depositAmount: 0,
  sourceAccountId: null,
  sourceAccountName: null,
  allocations: [],
  remainder: 100,
  remainderPercentage: 100,
  isSubmitting: false,
  processingStatuses: {},
  processingErrors: {},
  completedAt: null,
  hasPartialFailure: false,
};

export const useSplitFlowStore = create<SplitFlowState>((set, get) => ({
  ...initialState,

  // Actions
  initFlow: (amount, accountId, accountName) =>
    set({
      ...initialState,
      depositAmount: amount,
      sourceAccountId: accountId,
      sourceAccountName: accountName,
      currentStep: 'setup',
    }),

  setDepositId: (id) => set({ depositId: id }),

  setStep: (step) => set({ currentStep: step }),

  setAllocations: (allocations) => {
    const totalPercentage = allocations.reduce((sum, a) => sum + a.percentage, 0);
    const remainderPercentage = Math.max(0, 100 - totalPercentage);
    const depositAmount = get().depositAmount;

    // Recalculate amounts based on current deposit amount
    const updatedAllocations = allocations.map((a) => ({
      ...a,
      amount: (a.percentage / 100) * depositAmount,
    }));

    set({
      allocations: updatedAllocations,
      remainder: (remainderPercentage / 100) * depositAmount,
      remainderPercentage,
    });
  },

  updateAllocation: (bucketId, percentage) => {
    const { allocations, depositAmount } = get();
    const updatedAllocations = allocations.map((a) =>
      a.bucketId === bucketId
        ? { ...a, percentage, amount: (percentage / 100) * depositAmount }
        : a
    );

    const totalPercentage = updatedAllocations.reduce((sum, a) => sum + a.percentage, 0);
    const remainderPercentage = Math.max(0, 100 - totalPercentage);

    set({
      allocations: updatedAllocations,
      remainder: (remainderPercentage / 100) * depositAmount,
      remainderPercentage,
    });
  },

  setSubmitting: (isSubmitting) => set({ isSubmitting }),

  setProcessingStatus: (bucketId, status, error) =>
    set((state) => ({
      processingStatuses: {
        ...state.processingStatuses,
        [bucketId]: status,
      },
      processingErrors: error
        ? { ...state.processingErrors, [bucketId]: error }
        : state.processingErrors,
    })),

  setComplete: (hasPartialFailure = false) =>
    set({
      currentStep: 'complete',
      completedAt: new Date().toISOString(),
      hasPartialFailure,
      isSubmitting: false,
    }),

  resetFlow: () => set(initialState),

  // Computed
  canProceed: () => {
    const { currentStep, depositAmount, sourceAccountId, allocations } = get();

    switch (currentStep) {
      case 'setup':
        return depositAmount > 0 && !!sourceAccountId;
      case 'allocate':
        return allocations.length > 0;
      case 'confirm':
        return true;
      default:
        return false;
    }
  },

  getTotalAllocated: () =>
    get().allocations.reduce((sum, a) => sum + a.percentage, 0),
}));

// Helper to initialize allocations from buckets
export function createAllocationsFromBuckets(
  buckets: Bucket[],
  depositAmount: number
): Allocation[] {
  return buckets
    .filter((b) => b.is_active)
    .map((bucket) => ({
      bucketId: bucket.id,
      bucketName: bucket.name,
      percentage: bucket.bucket_type === 'percentage' ? bucket.allocation_value : 0,
      amount:
        bucket.bucket_type === 'percentage'
          ? (bucket.allocation_value / 100) * depositAmount
          : Math.min(bucket.allocation_value, depositAmount),
      color: bucket.color || '#0EA5A5',
    }));
}
