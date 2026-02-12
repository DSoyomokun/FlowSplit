/**
 * FlowSplit Color System
 * Based on design spec from SuperDesign
 */

export const Colors = {
  // Primary Brand
  primary: '#0EA5A5',
  primaryHover: '#0C8F8F',
  primaryLight: 'rgba(14, 165, 165, 0.1)',
  primaryShadow: 'rgba(14, 165, 165, 0.4)',

  // Background
  background: '#F8F8F8',
  card: '#FFFFFF',
  cardMuted: 'rgba(249, 250, 251, 0.5)',

  // Text (from design spec)
  text: {
    primary: '#1F2937',   // Dark Gray - Headings and primary text
    secondary: '#6B7280', // Gray - Body text and descriptions
    muted: '#9CA3AF',     // Light Gray - Secondary labels and metadata
    light: '#D1D5DB',     // Lighter gray
    disabled: '#6B7280',  // Same as secondary
  },

  // Bucket Colors
  bucket: {
    teal: '#0EA5A5',
    blue: '#3B82F6',
    green: '#10B981',
    purple: '#8B5CF6',
    orange: '#F59E0B',
    pink: '#EC4899',
    gray: '#E5E7EB',
  },

  // State Colors - Success
  success: {
    bg: 'rgba(16, 185, 129, 0.1)',
    bgSolid: '#10B981',
    text: '#16A34A',      // Green-600
    border: 'rgba(16, 185, 129, 0.2)',
  },

  // State Colors - Warning/Pending
  warning: {
    bg: '#FFFBEB',
    bgSolid: '#F59E0B',
    text: '#D97706',      // Amber-600
    textDark: '#92400E',
    border: '#FDE68A',
    borderLight: 'rgba(251, 191, 36, 0.5)',
  },

  // State Colors - Error
  error: {
    bg: '#FEF2F2',
    bgSolid: '#EF4444',
    text: '#DC2626',      // Red-600
    textDark: '#B91C1C',
    border: '#FECACA',
    borderLight: 'rgba(239, 68, 68, 0.2)',
  },

  // Borders (from design spec)
  border: {
    subtle: 'rgba(0, 0, 0, 0.04)',  // Main border color
    light: '#F3F4F6',
    default: '#E2E8F0',
    dashed: '#D1D5DB',
  },

  // Gray Scale
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },

  // Teal scale (for donut chart, etc.)
  teal: {
    50: '#E0F2F1',
    100: '#B2DFDB',
    500: '#0EA5A5',
    600: '#0C8F8F',
  },

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.4)',
  overlayLight: 'rgba(0, 0, 0, 0.1)',

  // Status colors (shorthand aliases)
  status: {
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
  },
} as const;

// Type helper for bucket colors
export type BucketColorKey = keyof typeof Colors.bucket;

// Get bucket color by index (cycles through available colors)
export const getBucketColor = (index: number): string => {
  const colorKeys = Object.keys(Colors.bucket) as BucketColorKey[];
  return Colors.bucket[colorKeys[index % colorKeys.length]];
};

// Array of bucket colors for easy indexing
export const BucketColors = [
  '#0EA5A5', // Teal (primary)
  '#3B82F6', // Blue
  '#10B981', // Green
  '#8B5CF6', // Purple
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
];
