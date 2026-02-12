/**
 * AddBucketButton Component
 * Dashed button for adding new buckets
 */

import React from 'react';
import { Text, StyleSheet, Pressable, ViewStyle, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolateColor,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { Colors } from '@/constants/colors';
import { FontFamily, FontSize } from '@/constants/typography';
import { BorderRadius, Spacing } from '@/constants/spacing';
import { SpringConfig } from '@/constants/animations';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface AddBucketButtonProps {
  onPress: () => void;
  label?: string;
  style?: ViewStyle;
  compact?: boolean;
}

export function AddBucketButton({
  onPress,
  label = 'Add New Bucket',
  style,
  compact = false,
}: AddBucketButtonProps) {
  const pressed = useSharedValue(0);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      pressed.value,
      [0, 1],
      [Colors.border.dashed, Colors.primary]
    ),
    backgroundColor: interpolateColor(
      pressed.value,
      [0, 1],
      ['transparent', `${Colors.primary}08`]
    ),
  }));

  const animatedIconStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      pressed.value,
      [0, 1],
      [Colors.gray[100], Colors.primary]
    ),
  }));

  const animatedTextStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      pressed.value,
      [0, 1],
      [Colors.text.muted, Colors.primary]
    ),
  }));

  const handlePressIn = () => {
    pressed.value = withSpring(1, SpringConfig.snappy);
  };

  const handlePressOut = () => {
    pressed.value = withSpring(0, SpringConfig.snappy);
  };

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.container,
        compact && styles.compact,
        animatedContainerStyle,
        style,
      ]}
    >
      <Animated.View style={[styles.iconContainer, compact && styles.iconCompact, animatedIconStyle]}>
        <Ionicons
          name="add"
          size={compact ? 16 : 20}
          color={Colors.text.muted}
        />
      </Animated.View>
      <Animated.Text style={[styles.label, compact && styles.labelCompact, animatedTextStyle]}>
        {label}
      </Animated.Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    padding: Spacing[6],
    borderRadius: BorderRadius.cardMedium,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.border.dashed,
  },
  compact: {
    flexDirection: 'row',
    padding: Spacing[4],
    gap: Spacing[3],
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCompact: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  label: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    color: Colors.text.muted,
  },
  labelCompact: {
    fontSize: FontSize.base,
  },
});
