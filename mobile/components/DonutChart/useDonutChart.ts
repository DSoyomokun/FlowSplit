/**
 * useDonutChart Hook
 * Manages donut chart state and calculations
 */

import { useState, useCallback, useMemo } from 'react';
import { DonutSegment, MIN_SEGMENT_SIZE } from './types';

interface UseDonutChartProps {
  initialSegments: DonutSegment[];
  total: number;
  onSegmentsChange?: (segments: DonutSegment[]) => void;
}

interface UseDonutChartReturn {
  segments: DonutSegment[];
  splitPoints: number[];
  remainder: number;
  updateSegmentPercentage: (index: number, newPercentage: number) => void;
  updateSplitPoint: (index: number, newPoint: number) => void;
  getSegmentAmounts: () => Array<{ id: string; amount: number }>;
  resetSegments: () => void;
}

export function useDonutChart({
  initialSegments,
  total,
  onSegmentsChange,
}: UseDonutChartProps): UseDonutChartReturn {
  const [segments, setSegments] = useState<DonutSegment[]>(initialSegments);

  // Calculate split points from segments
  // Split points are cumulative percentages: [10, 25, 35] means
  // Segment 0: 0-10%, Segment 1: 10-25%, Segment 2: 25-35%, Remainder: 35-100%
  const splitPoints = useMemo(() => {
    let cumulative = 0;
    return segments.map((segment) => {
      cumulative += segment.percentage;
      return cumulative;
    });
  }, [segments]);

  // Calculate remainder percentage
  const remainder = useMemo(() => {
    const total = segments.reduce((sum, s) => sum + s.percentage, 0);
    return Math.max(0, 100 - total);
  }, [segments]);

  // Update a single segment's percentage
  const updateSegmentPercentage = useCallback(
    (index: number, newPercentage: number) => {
      setSegments((prev) => {
        const updated = [...prev];
        const clampedPercentage = Math.max(
          MIN_SEGMENT_SIZE,
          Math.min(100 - (prev.length - 1) * MIN_SEGMENT_SIZE, newPercentage)
        );
        updated[index] = { ...updated[index], percentage: clampedPercentage };

        onSegmentsChange?.(updated);
        return updated;
      });
    },
    [onSegmentsChange]
  );

  // Update split point (used by drag handles)
  const updateSplitPoint = useCallback(
    (handleIndex: number, newPoint: number) => {
      setSegments((prev) => {
        const updated = [...prev];

        // Calculate constraints
        const minPoint =
          handleIndex === 0
            ? MIN_SEGMENT_SIZE
            : splitPoints[handleIndex - 1] + MIN_SEGMENT_SIZE;

        const maxPoint =
          handleIndex === prev.length - 1
            ? 100 - MIN_SEGMENT_SIZE
            : splitPoints[handleIndex + 1] - MIN_SEGMENT_SIZE;

        // Clamp the new point
        const clampedPoint = Math.max(minPoint, Math.min(maxPoint, newPoint));

        // Calculate new percentage for this segment
        const prevPoint = handleIndex === 0 ? 0 : splitPoints[handleIndex - 1];
        const newPercentage = clampedPoint - prevPoint;
        updated[handleIndex] = { ...updated[handleIndex], percentage: newPercentage };

        // Adjust next segment if exists
        if (handleIndex < prev.length - 1) {
          const nextPoint = splitPoints[handleIndex + 1];
          const nextPercentage = nextPoint - clampedPoint;
          updated[handleIndex + 1] = {
            ...updated[handleIndex + 1],
            percentage: nextPercentage,
          };
        }

        onSegmentsChange?.(updated);
        return updated;
      });
    },
    [splitPoints, onSegmentsChange]
  );

  // Get amounts for each segment
  const getSegmentAmounts = useCallback(() => {
    return segments.map((segment) => ({
      id: segment.id,
      amount: (total * segment.percentage) / 100,
    }));
  }, [segments, total]);

  // Reset to initial segments
  const resetSegments = useCallback(() => {
    setSegments(initialSegments);
    onSegmentsChange?.(initialSegments);
  }, [initialSegments, onSegmentsChange]);

  return {
    segments,
    splitPoints,
    remainder,
    updateSegmentPercentage,
    updateSplitPoint,
    getSegmentAmounts,
    resetSegments,
  };
}

// Utility functions for angle/position calculations
export function percentageToAngle(percentage: number): number {
  // SVG starts at 3 o'clock, we want 12 o'clock (hence -90)
  return (percentage / 100) * 360 - 90;
}

export function angleToPercentage(angle: number): number {
  // Convert from SVG angle to percentage
  let adjusted = angle + 90;
  if (adjusted < 0) adjusted += 360;
  return (adjusted / 360) * 100;
}

export function getPointOnCircle(
  center: number,
  radius: number,
  percentage: number
): { x: number; y: number } {
  const angle = percentageToAngle(percentage);
  const radians = (angle * Math.PI) / 180;
  return {
    x: center + radius * Math.cos(radians),
    y: center + radius * Math.sin(radians),
  };
}

export function getMidpointPercentage(start: number, end: number): number {
  return start + (end - start) / 2;
}
