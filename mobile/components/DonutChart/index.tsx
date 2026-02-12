/**
 * DonutChart Component
 * Interactive pie/donut chart for split allocation
 */

import React, { useRef, useCallback } from 'react';
import { View, StyleSheet, LayoutChangeEvent, Platform } from 'react-native';
import { Svg, G } from 'react-native-svg';
import {
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';

import {
  DonutChartProps,
  DonutConfig,
  DEFAULT_CONFIG,
  REMAINDER_COLOR,
} from './types';
import { DonutSegment } from './DonutSegment';
import { DonutHandle } from './DonutHandle';
import {
  useDonutChart,
  getPointOnCircle,
  angleToPercentage,
} from './useDonutChart';
import { Colors } from '@/constants/colors';

export function DonutChart({
  segments: initialSegments,
  total,
  onSegmentsChange,
  editable = true,
  size = DEFAULT_CONFIG.size,
  strokeWidth = DEFAULT_CONFIG.strokeWidth,
  showLabels = true,
  showHandles = true,
  centerContent,
}: DonutChartProps) {
  const containerRef = useRef<View>(null);
  const [layout, setLayout] = React.useState({ width: size, height: size });
  const [activeHandle, setActiveHandle] = React.useState<number | null>(null);

  const config: DonutConfig = {
    ...DEFAULT_CONFIG,
    size,
    strokeWidth,
    circumference: 2 * Math.PI * DEFAULT_CONFIG.radius,
  };

  const {
    segments,
    splitPoints,
    remainder,
    updateSplitPoint,
  } = useDonutChart({
    initialSegments,
    total,
    onSegmentsChange,
  });

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setLayout({ width, height });
  };

  // Convert touch coordinates to percentage
  const touchToPercentage = useCallback(
    (x: number, y: number): number => {
      const centerX = layout.width / 2;
      const centerY = layout.height / 2;
      const dx = x - centerX;
      const dy = y - centerY;

      let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
      if (angle < 0) angle += 360;

      return (angle / 360) * 100;
    },
    [layout]
  );

  // Find closest handle to touch point
  const findClosestHandle = useCallback(
    (x: number, y: number): number | null => {
      const centerX = layout.width / 2;
      const centerY = layout.height / 2;
      const scale = layout.width / config.viewBox;

      let closestIndex: number | null = null;
      let closestDistance = Infinity;
      const threshold = 30; // Touch threshold in pixels

      splitPoints.forEach((point, index) => {
        const handlePos = getPointOnCircle(config.center, config.radius, point);
        const handleX = handlePos.x * scale;
        const handleY = handlePos.y * scale;

        const distance = Math.sqrt(
          Math.pow(x - handleX, 2) + Math.pow(y - handleY, 2)
        );

        if (distance < threshold && distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });

      return closestIndex;
    },
    [layout, splitPoints, config]
  );

  // Pan gesture for dragging handles
  const panGesture = Gesture.Pan()
    .enabled(editable && showHandles)
    .onBegin((event) => {
      const handleIndex = findClosestHandle(event.x, event.y);
      if (handleIndex !== null) {
        setActiveHandle(handleIndex);
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
      }
    })
    .onUpdate((event) => {
      if (activeHandle !== null) {
        const newPercentage = touchToPercentage(event.x, event.y);
        updateSplitPoint(activeHandle, newPercentage);
      }
    })
    .onEnd(() => {
      if (activeHandle !== null) {
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }
      setActiveHandle(null);
    })
    .onFinalize(() => {
      setActiveHandle(null);
    });

  // Calculate segment boundaries
  const segmentBoundaries = React.useMemo(() => {
    const boundaries: Array<{ start: number; end: number }> = [];
    let start = 0;

    segments.forEach((segment, index) => {
      const end = splitPoints[index];
      boundaries.push({ start, end });
      start = end;
    });

    // Add remainder
    if (remainder > 0) {
      boundaries.push({ start, end: 100 });
    }

    return boundaries;
  }, [segments, splitPoints, remainder]);

  return (
    <GestureDetector gesture={panGesture}>
      <View
        ref={containerRef}
        style={[styles.container, { width: size, height: size }]}
        onLayout={handleLayout}
      >
        <Svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${config.viewBox} ${config.viewBox}`}
        >
          {/* Segments */}
          <G>
            {segmentBoundaries.map((boundary, index) => {
              const isRemainder = index >= segments.length;
              const segment = isRemainder ? null : segments[index];

              return (
                <DonutSegment
                  key={isRemainder ? 'remainder' : segment!.id}
                  startPercentage={boundary.start}
                  endPercentage={boundary.end}
                  color={isRemainder ? REMAINDER_COLOR : segment!.color}
                  config={config}
                  showLabel={showLabels}
                  isRemainder={isRemainder}
                />
              );
            })}
          </G>

          {/* Handles */}
          {editable && showHandles && (
            <G>
              {splitPoints.map((point, index) => (
                <DonutHandle
                  key={`handle-${index}`}
                  percentage={point}
                  config={config}
                  isActive={activeHandle === index}
                />
              ))}
            </G>
          )}
        </Svg>

        {/* Center Content */}
        {centerContent && (
          <View style={styles.centerContent} pointerEvents="none">
            {centerContent}
          </View>
        )}
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// Re-export types and hooks
export * from './types';
export * from './useDonutChart';
export { DonutSegment } from './DonutSegment';
export { DonutHandle } from './DonutHandle';
