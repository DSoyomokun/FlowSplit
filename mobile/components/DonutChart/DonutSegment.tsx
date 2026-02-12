/**
 * DonutSegment Component
 * Individual arc segment of the donut chart
 */

import React from 'react';
import { Circle, G, Text as SvgText } from 'react-native-svg';

import { DonutConfig, DEFAULT_CONFIG } from './types';
import { percentageToAngle, getMidpointPercentage, getPointOnCircle } from './useDonutChart';

interface DonutSegmentProps {
  startPercentage: number;
  endPercentage: number;
  color: string;
  config?: DonutConfig;
  showLabel?: boolean;
  isRemainder?: boolean;
  onPress?: () => void;
}

export function DonutSegment({
  startPercentage,
  endPercentage,
  color,
  config = DEFAULT_CONFIG,
  showLabel = true,
  isRemainder = false,
}: DonutSegmentProps) {
  const size = endPercentage - startPercentage;

  // Calculate dash array for this segment
  const segmentLength = (size / 100) * config.circumference;
  const dashArray = `${segmentLength} ${config.circumference}`;

  // Calculate rotation to position segment
  const rotation = percentageToAngle(startPercentage);

  // Label position at midpoint
  const midPercentage = getMidpointPercentage(startPercentage, endPercentage);
  const labelPosition = getPointOnCircle(config.center, config.radius, midPercentage);

  // Only show label if segment is large enough
  const showSegmentLabel = showLabel && size > 8;

  return (
    <G>
      {/* Arc Segment */}
      <Circle
        cx={config.center}
        cy={config.center}
        r={config.radius}
        fill="transparent"
        stroke={color}
        strokeWidth={config.strokeWidth}
        strokeDasharray={dashArray}
        transform={`rotate(${rotation} ${config.center} ${config.center})`}
      />

      {/* Percentage Label */}
      {showSegmentLabel && (
        <SvgText
          x={labelPosition.x}
          y={labelPosition.y + 1.5}
          textAnchor="middle"
          fontSize={5}
          fontWeight="800"
          fill={isRemainder ? '#6B7280' : '#FFFFFF'}
        >
          {Math.round(size)}%
        </SvgText>
      )}
    </G>
  );
}
