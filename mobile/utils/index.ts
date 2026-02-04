/**
 * Utils barrel export
 */

export {
  URL_PREFIX,
  linking,
  parseDepositDeepLink,
  generateDepositLink,
  handleNotificationNavigation,
  registerForPushNotifications,
  setupNotificationHandlers,
} from './linking';

export {
  SPLIT_FLOW_STEPS,
  type SplitFlowStep,
  navigateToSplitStep,
  getPreviousStep,
  getNextStep,
  canGoBack,
  navigateBackInFlow,
  exitSplitFlow,
  navigateToBuckets,
  navigateToHistory,
  startNewSplit,
} from './navigation';
