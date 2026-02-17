/**
 * DonutChart Types
 */

export interface DonutSegment {
  id: string;
  name: string;
  percentage: number;
  color: string;
}

export interface DonutChartProps {
  segments: DonutSegment[];
  total: number;
  onSegmentsChange?: (segments: DonutSegment[]) => void;
  editable?: boolean;
  size?: number;
  strokeWidth?: number;
  showLabels?: boolean;
  showHandles?: boolean;
  centerContent?: React.ReactNode;
}

export interface DonutConfig {
  size: number;
  viewBox: number;
  center: number;
  radius: number;
  strokeWidth: number;
  handleRadius: number;
  circumference: number;
}

export const DEFAULT_CONFIG: DonutConfig = {
  size: 280,
  viewBox: 100,
  center: 50,
  radius: 40,
  strokeWidth: 12,
  handleRadius: 6,
  circumference: 2 * Math.PI * 40,
};

// Minimum segment size (percentage)
export const MIN_SEGMENT_SIZE = 5;

// Colors for remainder segment
export const REMAINDER_COLOR = '#E5E7EB';
