/**
 * Skeleton Component
 * Loading placeholder with shimmer animation
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import { Colors } from '@/constants/colors';
import { BorderRadius } from '@/constants/spacing';
import { ShimmerConfig } from '@/constants/animations';

type SkeletonVariant = 'text' | 'circular' | 'rectangular' | 'rounded';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  variant?: SkeletonVariant;
  style?: ViewStyle;
  shimmer?: boolean;
}

export function Skeleton({
  width = '100%',
  height = 16,
  variant = 'text',
  style,
  shimmer = true,
}: SkeletonProps) {
  const translateX = useSharedValue(-1);

  useEffect(() => {
    if (shimmer) {
      translateX.value = withRepeat(
        withTiming(1, { duration: ShimmerConfig.duration }),
        -1,
        false
      );
    }
  }, [shimmer]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: interpolate(translateX.value, [-1, 1], [-200, 200]),
        },
      ],
    };
  });

  const getBorderRadius = () => {
    switch (variant) {
      case 'circular':
        return BorderRadius.full;
      case 'text':
        return BorderRadius.sm;
      case 'rounded':
        return BorderRadius.xl;
      case 'rectangular':
        return BorderRadius.md;
      default:
        return BorderRadius.sm;
    }
  };

  const containerStyle: ViewStyle = {
    width: typeof width === 'number' ? width : undefined,
    height: variant === 'circular' ? (typeof width === 'number' ? width : height) : height,
    borderRadius: getBorderRadius(),
    backgroundColor: Colors.gray[200],
    overflow: 'hidden',
  };

  if (typeof width === 'string') {
    (containerStyle as any).width = width;
  }

  return (
    <View style={[containerStyle, style]}>
      {shimmer && (
        <Animated.View style={[styles.shimmer, animatedStyle]}>
          <LinearGradient
            colors={ShimmerConfig.colors as [string, string, string]}
            start={ShimmerConfig.start}
            end={ShimmerConfig.end}
            style={styles.gradient}
          />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '200%',
  },
  gradient: {
    flex: 1,
  },
});

// Convenience component for skeleton text lines
interface SkeletonTextProps {
  lines?: number;
  lineHeight?: number;
  lastLineWidth?: string;
  gap?: number;
}

export function SkeletonText({
  lines = 3,
  lineHeight = 14,
  lastLineWidth = '70%',
  gap = 8,
}: SkeletonTextProps) {
  return (
    <View style={{ gap }}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          height={lineHeight}
          width={index === lines - 1 ? lastLineWidth : '100%'}
          variant="text"
        />
      ))}
    </View>
  );
}

// Skeleton card for bucket/distribution items
export function SkeletonCard() {
  return (
    <View style={skeletonCardStyles.container}>
      <View style={skeletonCardStyles.row}>
        <Skeleton width={48} height={48} variant="rounded" />
        <View style={skeletonCardStyles.content}>
          <Skeleton width={100} height={14} />
          <Skeleton width={60} height={10} />
        </View>
        <Skeleton width={60} height={16} />
      </View>
    </View>
  );
}

const skeletonCardStyles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.cardMedium,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  content: {
    flex: 1,
    gap: 6,
  },
});
