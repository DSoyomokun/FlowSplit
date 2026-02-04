/**
 * FlowSplit Shadow System
 * Platform-specific shadow implementations
 */

import { Platform, ViewStyle } from 'react-native';
import { Colors } from './colors';

type ShadowStyle = Pick<
  ViewStyle,
  | 'shadowColor'
  | 'shadowOffset'
  | 'shadowOpacity'
  | 'shadowRadius'
  | 'elevation'
>;

// Helper to create cross-platform shadows
const createShadow = (
  color: string,
  offsetX: number,
  offsetY: number,
  blur: number,
  opacity: number,
  elevation: number
): ShadowStyle => ({
  shadowColor: color,
  shadowOffset: { width: offsetX, height: offsetY },
  shadowOpacity: opacity,
  shadowRadius: blur,
  elevation: Platform.OS === 'android' ? elevation : 0,
});

export const Shadows = {
  // Card shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.05)
  card: createShadow('#000000', 0, 4, 10, 0.05, 2),

  // Large card shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.04)
  cardLarge: createShadow('#000000', 0, 10, 15, 0.04, 3),

  // Button shadow (teal glow): 0 10px 20px -5px rgba(14, 165, 165, 0.4)
  buttonPrimary: createShadow(Colors.primary, 0, 10, 10, 0.4, 4),

  // Success icon shadow: shadow-lg shadow-teal-500/20
  successIcon: createShadow(Colors.primary, 0, 10, 15, 0.2, 4),

  // Warning icon shadow
  warningIcon: createShadow(Colors.warning.bgSolid, 0, 10, 15, 0.2, 4),

  // Error icon shadow
  errorIcon: createShadow(Colors.error.bgSolid, 0, 10, 15, 0.2, 4),

  // Bottom bar shadow: 0 -10px 30px -15px rgba(0, 0, 0, 0.1)
  bottomBar: createShadow('#000000', 0, -10, 15, 0.1, 8),

  // Modal shadow
  modal: createShadow('#000000', 0, 25, 25, 0.15, 10),

  // Subtle shadow for list items
  subtle: createShadow('#000000', 0, 1, 3, 0.05, 1),

  // No shadow
  none: createShadow('#000000', 0, 0, 0, 0, 0),
} as const;

// Type export
export type ShadowKey = keyof typeof Shadows;
