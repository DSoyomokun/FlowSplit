/**
 * Card Component
 * Container with consistent styling, shadows, and border radius
 */

import React from 'react';
import { View, StyleSheet, ViewStyle, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { Colors } from '@/constants/colors';
import { BorderRadius, Spacing } from '@/constants/spacing';
import { Shadows } from '@/constants/shadows';
import { SpringConfig, AnimationValues } from '@/constants/animations';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type CardVariant = 'default' | 'large' | 'muted' | 'outline' | 'dashed';

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  onPress?: () => void;
  style?: ViewStyle;
  noPadding?: boolean;
  animated?: boolean;
}

export function Card({
  children,
  variant = 'default',
  onPress,
  style,
  noPadding = false,
  animated = false,
}: CardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (animated && onPress) {
      scale.value = withSpring(AnimationValues.cardPressScale, SpringConfig.snappy);
    }
  };

  const handlePressOut = () => {
    if (animated && onPress) {
      scale.value = withSpring(1, SpringConfig.snappy);
    }
  };

  const variantStyles = getVariantStyles(variant);
  const paddingStyles = noPadding ? {} : getPaddingStyles(variant);

  const content = (
    <View style={[styles.base, variantStyles, paddingStyles, style]}>{children}</View>
  );

  if (onPress) {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={animated ? animatedStyle : undefined}
      >
        {content}
      </AnimatedPressable>
    );
  }

  if (animated) {
    return <Animated.View style={animatedStyle}>{content}</Animated.View>;
  }

  return content;
}

function getVariantStyles(variant: CardVariant): ViewStyle {
  const baseStyle: ViewStyle = {
    backgroundColor: Colors.card,
    ...Shadows.card,
  };

  switch (variant) {
    case 'large':
      return {
        ...baseStyle,
        borderRadius: BorderRadius.card, // 32px
        borderWidth: 1,
        borderColor: Colors.border.subtle,
      };
    case 'default':
      return {
        ...baseStyle,
        borderRadius: BorderRadius.xl, // 16px
        borderWidth: 1,
        borderColor: Colors.border.subtle,
      };
    case 'muted':
      return {
        backgroundColor: Colors.cardMuted,
        borderRadius: BorderRadius.xl,
      };
    case 'outline':
      return {
        backgroundColor: 'transparent',
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        borderColor: Colors.border.default,
      };
    case 'dashed':
      return {
        backgroundColor: 'transparent',
        borderRadius: BorderRadius.cardMedium, // 24px
        borderWidth: 2,
        borderColor: Colors.border.dashed,
        borderStyle: 'dashed',
      };
    default:
      return baseStyle;
  }
}

function getPaddingStyles(variant: CardVariant): ViewStyle {
  switch (variant) {
    case 'large':
      return { padding: Spacing.card }; // 24px
    case 'default':
      return { padding: Spacing.cardSmall }; // 16px
    case 'muted':
      return { padding: Spacing[3] }; // 12px
    default:
      return { padding: Spacing.cardSmall };
  }
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
});

// Sub-component for card sections
interface CardSectionProps {
  children: React.ReactNode;
  style?: ViewStyle;
  borderTop?: boolean;
  borderBottom?: boolean;
}

export function CardSection({
  children,
  style,
  borderTop = false,
  borderBottom = false,
}: CardSectionProps) {
  return (
    <View
      style={[
        borderTop && styles.borderTop,
        borderBottom && styles.borderBottom,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  borderTop: {
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    paddingTop: Spacing[4],
    marginTop: Spacing[4],
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
    paddingBottom: Spacing[4],
    marginBottom: Spacing[4],
  },
});

Object.assign(styles, sectionStyles);
