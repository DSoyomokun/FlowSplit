/**
 * DonutHandle Component
 * Draggable handle at segment boundaries
 */

import React from 'react';
import { Circle, G } from 'react-native-svg';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { DonutConfig, DEFAULT_CONFIG } from './types';
import { getPointOnCircle } from './useDonutChart';
import { SpringConfig, AnimationValues } from '@/constants/animations';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedG = Animated.createAnimatedComponent(G);

interface DonutHandleProps {
  percentage: number;
  config?: DonutConfig;
  isActive?: boolean;
}

export function DonutHandle({
  percentage,
  config = DEFAULT_CONFIG,
  isActive = false,
}: DonutHandleProps) {
  const scale = useSharedValue(1);

  React.useEffect(() => {
    scale.value = withSpring(
      isActive ? AnimationValues.handleGrabScale : 1,
      SpringConfig.dragHandle
    );
  }, [isActive]);

  const position = getPointOnCircle(config.center, config.radius, percentage);

  const animatedProps = useAnimatedProps(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <G>
      {/* Handle Circle */}
      <AnimatedCircle
        cx={position.x}
        cy={position.y}
        r={config.handleRadius}
        fill="#FFFFFF"
        stroke="#CBD5E1"
        strokeWidth={1}
        animatedProps={animatedProps}
      />
    </G>
  );
}
