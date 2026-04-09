/**
 * Tests for formatting utilities (Story 091)
 */

import { formatCurrency, formatAmount, formatPercentage } from '@/utils/formatting';

// ── formatCurrency ────────────────────────────────────────────────────────────

describe('formatCurrency', () => {
  it('formats whole dollars', () => {
    expect(formatCurrency(1000)).toBe('$1,000.00');
  });

  it('formats cents correctly', () => {
    expect(formatCurrency(1200.5)).toBe('$1,200.50');
  });

  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('$0.00');
  });

  it('formats large amounts with commas', () => {
    expect(formatCurrency(10000)).toBe('$10,000.00');
    expect(formatCurrency(1000000)).toBe('$1,000,000.00');
  });

  it('rounds to 2 decimal places', () => {
    expect(formatCurrency(9.999)).toBe('$10.00');
    expect(formatCurrency(1.001)).toBe('$1.00');
  });

  it('formats small amounts', () => {
    expect(formatCurrency(0.01)).toBe('$0.01');
    expect(formatCurrency(0.50)).toBe('$0.50');
  });

  it('always shows 2 decimal places', () => {
    expect(formatCurrency(5)).toBe('$5.00');
  });
});

// ── formatAmount (alias) ──────────────────────────────────────────────────────

describe('formatAmount', () => {
  it('behaves the same as formatCurrency', () => {
    expect(formatAmount(1200)).toBe('$1,200.00');
    expect(formatAmount(0)).toBe('$0.00');
  });
});

// ── formatPercentage ──────────────────────────────────────────────────────────

describe('formatPercentage', () => {
  it('formats whole percentages', () => {
    expect(formatPercentage(10)).toBe('10%');
    expect(formatPercentage(100)).toBe('100%');
    expect(formatPercentage(0)).toBe('0%');
  });

  it('rounds to 0 decimals by default', () => {
    expect(formatPercentage(10.6)).toBe('11%');
    expect(formatPercentage(10.4)).toBe('10%');
  });

  it('respects custom decimal places', () => {
    expect(formatPercentage(10.5, 1)).toBe('10.5%');
    expect(formatPercentage(33.333, 2)).toBe('33.33%');
  });
});
