/**
 * StatusIcons Component
 * Animated icons for success, partial success, and processing states
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';

import { Colors } from '@/constants/colors';
import { Shadows } from '@/constants/shadows';
import { SpringConfig, Duration, SpinConfig, CheckmarkConfig } from '@/constants/animations';

interface StatusIconProps {
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
  animated?: boolean;
}

// Size configurations
const SIZES = {
  sm: { outer: 64, inner: 44, icon: 24 },
  md: { outer: 80, inner: 56, icon: 32 },
  lg: { outer: 96, inner: 64, icon: 40 },
};

/**
 * SuccessIcon - Teal checkmark with animated entry
 */
export function SuccessIcon({
  size = 'lg',
  style,
  animated = true,
}: StatusIconProps) {
  const scale = useSharedValue(animated ? 0 : 1);
  const checkOpacity = useSharedValue(animated ? 0 : 1);

  React.useEffect(() => {
    if (animated) {
      // Bounce in
      scale.value = withSpring(1, SpringConfig.bouncy);
      // Fade in checkmark with delay
      checkOpacity.value = withDelay(
        200,
        withTiming(1, { duration: CheckmarkConfig.duration })
      );
    }
  }, [animated]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const checkStyle = useAnimatedStyle(() => ({
    opacity: checkOpacity.value,
  }));

  const { outer, inner, icon } = SIZES[size];

  return (
    <Animated.View style={[styles.outerCircle, { width: outer, height: outer, backgroundColor: `${Colors.primary}15` }, containerStyle, style]}>
      <View style={[styles.innerCircle, { width: inner, height: inner, backgroundColor: Colors.primary }, Shadows.successIcon]}>
        <Animated.View style={checkStyle}>
          <Ionicons name="checkmark" size={icon} color="#FFFFFF" />
        </Animated.View>
      </View>
    </Animated.View>
  );
}

/**
 * PartialSuccessIcon - Amber warning with alert icon
 */
export function PartialSuccessIcon({
  size = 'lg',
  style,
  animated = true,
}: StatusIconProps) {
  const scale = useSharedValue(animated ? 0 : 1);

  React.useEffect(() => {
    if (animated) {
      scale.value = withSpring(1, SpringConfig.bouncy);
    }
  }, [animated]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const { outer, inner, icon } = SIZES[size];

  return (
    <Animated.View style={[styles.outerCircle, { width: outer, height: outer, backgroundColor: Colors.warning.bg }, containerStyle, style]}>
      <View style={[styles.innerCircle, { width: inner, height: inner, backgroundColor: Colors.warning.bgSolid }, Shadows.warningIcon]}>
        <Ionicons name="alert" size={icon} color="#FFFFFF" />
      </View>
    </Animated.View>
  );
}

/**
 * ProcessingIcon - Amber with spinning refresh icon
 */
export function ProcessingIcon({
  size = 'lg',
  style,
  animated = true,
}: StatusIconProps) {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(animated ? 0 : 1);

  React.useEffect(() => {
    if (animated) {
      scale.value = withSpring(1, SpringConfig.bouncy);
    }

    // Continuous spin
    rotation.value = withRepeat(
      withTiming(360, { duration: SpinConfig.duration }),
      -1,
      false
    );
  }, [animated]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const { outer, inner, icon } = SIZES[size];

  return (
    <Animated.View style={[styles.outerCircle, { width: outer, height: outer, backgroundColor: Colors.warning.bg }, containerStyle, style]}>
      <View style={[styles.innerCircle, { width: inner, height: inner, backgroundColor: Colors.warning.bgSolid }, Shadows.warningIcon]}>
        <Animated.View style={spinStyle}>
          <Ionicons name="refresh" size={icon} color="#FFFFFF" />
        </Animated.View>
      </View>
    </Animated.View>
  );
}

/**
 * ErrorIcon - Red with X or alert icon
 */
export function ErrorIcon({
  size = 'lg',
  style,
  animated = true,
  variant = 'alert',
}: StatusIconProps & { variant?: 'alert' | 'close' }) {
  const scale = useSharedValue(animated ? 0 : 1);
  const shake = useSharedValue(0);

  React.useEffect(() => {
    if (animated) {
      scale.value = withSpring(1, SpringConfig.bouncy);
      // Subtle shake effect
      shake.value = withSequence(
        withDelay(300, withTiming(-5, { duration: 50 })),
        withTiming(5, { duration: 50 }),
        withTiming(-3, { duration: 50 }),
        withTiming(3, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
    }
  }, [animated]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateX: shake.value },
    ],
  }));

  const { outer, inner, icon } = SIZES[size];

  return (
    <Animated.View style={[styles.outerCircle, { width: outer, height: outer, backgroundColor: Colors.error.bg }, containerStyle, style]}>
      <View style={[styles.innerCircle, { width: inner, height: inner, backgroundColor: Colors.error.bgSolid }, Shadows.errorIcon]}>
        <Ionicons
          name={variant === 'close' ? 'close' : 'alert'}
          size={icon}
          color="#FFFFFF"
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  outerCircle: {
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerCircle: {
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
