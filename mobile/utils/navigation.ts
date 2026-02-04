/**
 * Navigation Utilities
 * Helper functions for flow navigation
 *
 * Story 70: Split flow navigation
 */

import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

/**
 * Split flow step order
 */
export const SPLIT_FLOW_STEPS = [
  'setup',
  'allocate',
  'confirm',
  'processing',
  'complete',
] as const;

export type SplitFlowStep = (typeof SPLIT_FLOW_STEPS)[number];

/**
 * Navigate to a split flow step
 */
export function navigateToSplitStep(depositId: string, step: SplitFlowStep): void {
  const routes: Record<SplitFlowStep, string> = {
    setup: '/deposit/setup',
    allocate: `/deposit/${depositId}/allocate`,
    confirm: `/deposit/${depositId}/confirm`,
    processing: `/deposit/${depositId}/processing`,
    complete: `/deposit/${depositId}/complete`,
  };

  const route = routes[step];

  // Use replace for complete to prevent going back
  if (step === 'complete') {
    router.replace(route);
  } else {
    router.push(route);
  }
}

/**
 * Get previous step in the flow
 */
export function getPreviousStep(currentStep: SplitFlowStep): SplitFlowStep | null {
  const index = SPLIT_FLOW_STEPS.indexOf(currentStep);

  if (index <= 0) return null;

  // Skip 'processing' when going back
  const prevStep = SPLIT_FLOW_STEPS[index - 1];
  if (prevStep === 'processing') {
    return SPLIT_FLOW_STEPS[index - 2] || null;
  }

  return prevStep;
}

/**
 * Get next step in the flow
 */
export function getNextStep(currentStep: SplitFlowStep): SplitFlowStep | null {
  const index = SPLIT_FLOW_STEPS.indexOf(currentStep);

  if (index >= SPLIT_FLOW_STEPS.length - 1) return null;

  return SPLIT_FLOW_STEPS[index + 1];
}

/**
 * Check if user can go back from current step
 */
export function canGoBack(currentStep: SplitFlowStep): boolean {
  // Can't go back from setup or complete
  return !['setup', 'complete', 'processing'].includes(currentStep);
}

/**
 * Navigate back in the split flow
 */
export function navigateBackInFlow(depositId: string, currentStep: SplitFlowStep): void {
  if (!canGoBack(currentStep)) {
    // Exit to dashboard
    router.replace('/(tabs)');
    return;
  }

  const prevStep = getPreviousStep(currentStep);

  if (prevStep) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigateToSplitStep(depositId, prevStep);
  } else {
    router.back();
  }
}

/**
 * Exit the split flow and return to dashboard
 */
export function exitSplitFlow(): void {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  router.replace('/(tabs)');
}

/**
 * Navigate to bucket configuration
 */
export function navigateToBuckets(): void {
  router.push('/buckets/configure');
}

/**
 * Navigate to history tab
 */
export function navigateToHistory(): void {
  router.push('/(tabs)/history');
}

/**
 * Start a new split flow
 */
export function startNewSplit(): void {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  router.push('/deposit/setup');
}
