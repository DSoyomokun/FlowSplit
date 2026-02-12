/**
 * Button Component
 * Primary, secondary, ghost, and danger variants with loading and disabled states
 */

import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  Platform,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { Colors } from '@/constants/colors';
import { FontFamily, FontSize } from '@/constants/typography';
import { BorderRadius, Size, Spacing } from '@/constants/spacing';
import { Shadows } from '@/constants/shadows';
import { SpringConfig, AnimationValues } from '@/constants/animations';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
  textStyle?: TextStyle;
  haptic?: boolean;
}

export function Button({
  children,
  onPress,
  variant = 'primary',
  size = 'lg',
  disabled = false,
  loading = false,
  fullWidth = true,
  icon,
  iconPosition = 'right',
  style,
  textStyle,
  haptic = true,
}: ButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(AnimationValues.buttonPressScale, SpringConfig.snappy);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, SpringConfig.snappy);
  };

  const handlePress = () => {
    if (disabled || loading) return;
    if (haptic && Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress?.();
  };

  const isDisabled = disabled || loading;
  const variantStyles = getVariantStyles(variant, isDisabled);
  const sizeStyles = getSizeStyles(size);

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      style={[
        styles.base,
        sizeStyles.container,
        variantStyles.container,
        fullWidth && styles.fullWidth,
        animatedStyle,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variantStyles.textColor}
          size={size === 'sm' ? 'small' : 'small'}
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && icon}
          <Text
            style={[
              styles.text,
              sizeStyles.text,
              { color: variantStyles.textColor },
              textStyle,
            ]}
          >
            {children}
          </Text>
          {icon && iconPosition === 'right' && icon}
        </>
      )}
    </AnimatedPressable>
  );
}

function getVariantStyles(variant: ButtonVariant, disabled: boolean) {
  if (disabled) {
    return {
      container: {
        backgroundColor: Colors.gray[200],
      } as ViewStyle,
      textColor: Colors.gray[400],
    };
  }

  switch (variant) {
    case 'primary':
      return {
        container: {
          backgroundColor: Colors.primary,
          ...Shadows.buttonPrimary,
        } as ViewStyle,
        textColor: '#FFFFFF',
      };
    case 'secondary':
      return {
        container: {
          backgroundColor: Colors.card,
          borderWidth: 1,
          borderColor: Colors.border.default,
        } as ViewStyle,
        textColor: Colors.text.primary,
      };
    case 'ghost':
      return {
        container: {
          backgroundColor: 'transparent',
        } as ViewStyle,
        textColor: Colors.text.muted,
      };
    case 'danger':
      return {
        container: {
          backgroundColor: Colors.error.bgSolid,
          ...Shadows.errorIcon,
        } as ViewStyle,
        textColor: '#FFFFFF',
      };
    default:
      return {
        container: {} as ViewStyle,
        textColor: Colors.text.primary,
      };
  }
}

function getSizeStyles(size: ButtonSize) {
  switch (size) {
    case 'sm':
      return {
        container: {
          paddingVertical: Spacing[2],
          paddingHorizontal: Spacing[4],
          borderRadius: BorderRadius.lg,
        } as ViewStyle,
        text: {
          fontSize: FontSize.base,
        } as TextStyle,
      };
    case 'md':
      return {
        container: {
          paddingVertical: Spacing[3],
          paddingHorizontal: Spacing[5],
          borderRadius: BorderRadius.xl,
        } as ViewStyle,
        text: {
          fontSize: FontSize.md,
        } as TextStyle,
      };
    case 'lg':
      return {
        container: {
          paddingVertical: Spacing[4],
          paddingHorizontal: Spacing[6],
          borderRadius: BorderRadius.xl,
          minHeight: Size.buttonHeight,
        } as ViewStyle,
        text: {
          fontSize: FontSize.md,
        } as TextStyle,
      };
    default:
      return {
        container: {} as ViewStyle,
        text: {} as TextStyle,
      };
  }
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
  },
  fullWidth: {
    width: '100%',
  },
  text: {
    fontFamily: FontFamily.bold,
    textAlign: 'center',
  },
});
