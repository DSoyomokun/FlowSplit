/**
 * BucketCard Component
 * Simple bucket display with color, percentage, and amount
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable, ViewStyle, Platform } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { Colors } from '@/constants/colors';
import { FontFamily, FontSize } from '@/constants/typography';
import { BorderRadius, Spacing } from '@/constants/spacing';
import { SpringConfig, AnimationValues } from '@/constants/animations';
import { StatusDot } from './StatusBadge';
import { CompactAmount } from './AmountDisplay';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface BucketCardProps {
  id: string;
  name: string;
  percentage: number;
  amount: number;
  color: string;
  onPress?: (id: string) => void;
  style?: ViewStyle;
  showAmount?: boolean;
  compact?: boolean;
}

export function BucketCard({
  id,
  name,
  percentage,
  amount,
  color,
  onPress,
  style,
  showAmount = true,
  compact = false,
}: BucketCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (onPress) {
      scale.value = withSpring(AnimationValues.cardPressScale, SpringConfig.snappy);
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, SpringConfig.snappy);
  };

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress?.(id);
  };

  const content = (
    <View style={[styles.container, compact && styles.compact, style]}>
      {/* Left: Color dot + name */}
      <View style={styles.left}>
        <StatusDot color={color} size={compact ? 8 : 12} />
        <Text style={[styles.name, compact && styles.nameCompact]}>{name}</Text>
      </View>

      {/* Right: Percentage + amount */}
      <View style={styles.right}>
        <Text style={[styles.percentage, compact && styles.percentageCompact]}>
          {Math.round(percentage)}%
        </Text>
        {showAmount && (
          <CompactAmount amount={amount} color={Colors.text.muted} size="sm" />
        )}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <AnimatedPressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={animatedStyle}
      >
        {content}
      </AnimatedPressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing[4],
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
  compact: {
    padding: Spacing[3],
    backgroundColor: Colors.cardMuted,
    borderWidth: 0,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
  },
  right: {
    alignItems: 'flex-end',
    gap: Spacing[0.5],
  },
  name: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    color: Colors.text.secondary,
  },
  nameCompact: {
    fontSize: FontSize.base,
  },
  percentage: {
    fontFamily: FontFamily.black,
    fontSize: FontSize.md,
    color: Colors.text.primary,
  },
  percentageCompact: {
    fontSize: FontSize.base,
  },
});

// List wrapper for multiple bucket cards
interface BucketCardListProps {
  buckets: Array<{
    id: string;
    name: string;
    percentage: number;
    amount: number;
    color: string;
  }>;
  onBucketPress?: (id: string) => void;
  style?: ViewStyle;
}

export function BucketCardList({
  buckets,
  onBucketPress,
  style,
}: BucketCardListProps) {
  return (
    <View style={[listStyles.container, style]}>
      {buckets.map((bucket) => (
        <BucketCard
          key={bucket.id}
          {...bucket}
          onPress={onBucketPress}
        />
      ))}
    </View>
  );
}

const listStyles = StyleSheet.create({
  container: {
    gap: Spacing[3],
  },
});
