/**
 * FlowSplit Animation System
 * Timing and easing configurations for Reanimated
 */

import { Easing } from 'react-native-reanimated';

// Duration constants (in milliseconds)
export const Duration = {
  instant: 0,
  fast: 150,
  normal: 250,
  slow: 350,
  slower: 500,
} as const;

// Easing presets
export const Easings = {
  // Standard easings
  linear: Easing.linear,
  easeIn: Easing.in(Easing.ease),
  easeOut: Easing.out(Easing.ease),
  easeInOut: Easing.inOut(Easing.ease),

  // Cubic easings
  easeInCubic: Easing.in(Easing.cubic),
  easeOutCubic: Easing.out(Easing.cubic),
  easeInOutCubic: Easing.inOut(Easing.cubic),

  // Bounce/spring-like
  bounce: Easing.bezier(0.175, 0.885, 0.32, 1.275),
} as const;

// Spring configurations for withSpring
export const SpringConfig = {
  // Default spring
  default: {
    damping: 15,
    stiffness: 150,
  },

  // Snappy spring for button presses
  snappy: {
    damping: 20,
    stiffness: 300,
  },

  // Gentle spring for larger movements
  gentle: {
    damping: 20,
    stiffness: 100,
  },

  // Bouncy spring for playful animations
  bouncy: {
    damping: 10,
    stiffness: 150,
  },

  // Stiff spring for quick snaps
  stiff: {
    damping: 25,
    stiffness: 400,
  },

  // Drag handle spring
  dragHandle: {
    damping: 15,
    stiffness: 200,
  },
} as const;

// Timing configurations for withTiming
export const TimingConfig = {
  // View transitions (fade in/out)
  fadeOut: {
    duration: Duration.normal,
    easing: Easings.easeOut,
  },
  fadeIn: {
    duration: Duration.normal,
    easing: Easings.easeIn,
  },

  // Button press
  buttonPress: {
    duration: Duration.fast,
    easing: Easings.easeOut,
  },

  // Skeleton shimmer
  shimmer: {
    duration: 1500,
    easing: Easings.linear,
  },

  // Modal appear
  modalAppear: {
    duration: Duration.normal,
    easing: Easings.easeOut,
  },
} as const;

// Animation values
export const AnimationValues = {
  // Button press scale
  buttonPressScale: 0.98,

  // Drag handle grab scale
  handleGrabScale: 1.4,

  // Card press scale
  cardPressScale: 0.98,

  // Donut segment hover stroke width increase
  segmentHoverStrokeIncrease: 2,
} as const;

// Shimmer gradient stops (for skeleton loading)
export const ShimmerConfig = {
  // Colors for gradient
  colors: [
    'rgba(255, 255, 255, 0)',
    'rgba(255, 255, 255, 0.4)',
    'rgba(255, 255, 255, 0)',
  ],

  // Gradient positions
  start: { x: 0, y: 0 },
  end: { x: 1, y: 0 },

  // Animation duration
  duration: 1500,
} as const;

// Pulse animation config (for loading states)
export const PulseConfig = {
  minOpacity: 0.4,
  maxOpacity: 1,
  duration: 1000,
} as const;

// Spin animation config (for loading spinners)
export const SpinConfig = {
  duration: 1000,
} as const;

// Success checkmark draw animation
export const CheckmarkConfig = {
  duration: Duration.slow,
  easing: Easings.easeOut,
} as const;
