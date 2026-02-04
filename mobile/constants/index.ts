/**
 * FlowSplit Constants
 * Re-exports all design system tokens
 */

// API Configuration
export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// Design System Exports
export * from './colors';
export * from './typography';
export * from './spacing';
export * from './shadows';
export * from './animations';

// Legacy exports for backwards compatibility (can be removed later)
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
