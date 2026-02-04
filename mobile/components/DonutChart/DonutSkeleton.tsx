/**
 * DonutSkeleton Component
 * Loading state for donut chart
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Svg, Circle } from 'react-native-svg';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import { DEFAULT_CONFIG } from './types';
import { Colors } from '@/constants/colors';
import { FontFamily, FontSize } from '@/constants/typography';
import { ShimmerConfig } from '@/constants/animations';

interface DonutSkeletonProps {
  size?: number;
  message?: string;
}

export function DonutSkeleton({
  size = DEFAULT_CONFIG.size,
  message = 'Calculating...',
}: DonutSkeletonProps) {
  const translateX = useSharedValue(-1);

  React.useEffect(() => {
    translateX.value = withRepeat(
      withTiming(1, { duration: ShimmerConfig.duration }),
      -1,
      false
    );
  }, []);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(translateX.value, [-1, 1], [-size, size]),
      },
    ],
  }));

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Skeleton Ring */}
      <Svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${DEFAULT_CONFIG.viewBox} ${DEFAULT_CONFIG.viewBox}`}
      >
        <Circle
          cx={DEFAULT_CONFIG.center}
          cy={DEFAULT_CONFIG.center}
          r={DEFAULT_CONFIG.radius}
          fill="transparent"
          stroke={Colors.gray[200]}
          strokeWidth={DEFAULT_CONFIG.strokeWidth}
        />
      </Svg>

      {/* Shimmer Overlay */}
      <View style={styles.shimmerContainer}>
        <Animated.View style={[styles.shimmer, shimmerStyle]}>
          <LinearGradient
            colors={ShimmerConfig.colors as [string, string, string]}
            start={ShimmerConfig.start}
            end={ShimmerConfig.end}
            style={styles.gradient}
          />
        </Animated.View>
      </View>

      {/* Center Content */}
      <View style={styles.centerContent}>
        <Text style={styles.label}>Split Plan</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shimmerContainer: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 9999,
    overflow: 'hidden',
  },
  shimmer: {
    ...StyleSheet.absoluteFillObject,
  },
  gradient: {
    flex: 1,
  },
  centerContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.sm,
    color: Colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  message: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.base,
    color: Colors.text.muted,
  },
});
