/**
 * DonutHandle Component
 * Draggable handle at segment boundaries
 */

import React from 'react';
import { Circle, G } from 'react-native-svg';

import { DonutConfig, DEFAULT_CONFIG } from './types';
import { getPointOnCircle } from './useDonutChart';

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
  const position = getPointOnCircle(config.center, config.radius, percentage);

  // Scale handle when active (simple state-based, not animated)
  const handleRadius = isActive ? config.handleRadius * 1.3 : config.handleRadius;

  return (
    <G>
      {/* Handle Circle */}
      <Circle
        cx={position.x}
        cy={position.y}
        r={handleRadius}
        fill="#FFFFFF"
        stroke={isActive ? '#0EA5A5' : '#CBD5E1'}
        strokeWidth={isActive ? 2 : 1}
      />
    </G>
  );
}
