/**
 * FlowSplit Color System
 * Based on design exports from SuperDesign
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
  cardMuted: 'rgba(249, 250, 251, 0.5)', // gray-50/50

  // Text
  text: {
    primary: '#111827',   // gray-900
    secondary: '#374151', // gray-700
    muted: '#9CA3AF',     // gray-400
    light: '#D1D5DB',     // gray-300
    disabled: '#6B7280',  // gray-500
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
    bg: 'rgba(16, 185, 129, 0.1)',   // green-500/10
    bgSolid: '#10B981',
    text: '#059669',                  // green-600
    border: 'rgba(16, 185, 129, 0.2)',
  },

  // State Colors - Warning/Pending
  warning: {
    bg: '#FFFBEB',                    // amber-50
    bgSolid: '#F59E0B',               // amber-500
    text: '#D97706',                  // amber-600
    textDark: '#92400E',              // amber-800
    border: '#FDE68A',                // amber-200
    borderLight: 'rgba(251, 191, 36, 0.5)',
  },

  // State Colors - Error
  error: {
    bg: '#FEF2F2',                    // red-50
    bgSolid: '#EF4444',               // red-500
    text: '#DC2626',                  // red-600
    textDark: '#B91C1C',              // red-700
    border: '#FECACA',                // red-200
    borderLight: 'rgba(239, 68, 68, 0.2)',
  },

  // Borders
  border: {
    subtle: 'rgba(0, 0, 0, 0.04)',
    light: '#F3F4F6',                 // gray-100
    default: '#E5E7EB',               // gray-200
    dashed: '#D1D5DB',                // gray-300
  },

  // Gray Scale (for reference)
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
