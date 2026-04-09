/**
 * Tests for formatting utilities (Story 091)
 */

import { formatCurrency, formatAmount, formatPercentage, formatDate } from '@/utils/formatting';

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

// ── formatDate ────────────────────────────────────────────────────────────────

describe('formatDate', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns "Today" for a date within the same day', () => {
    jest.setSystemTime(new Date('2026-04-09T12:00:00Z'));
    expect(formatDate('2026-04-09T08:00:00Z')).toBe('Today');
  });

  it('returns "Yesterday" for a date 1 day ago', () => {
    jest.setSystemTime(new Date('2026-04-09T12:00:00Z'));
    expect(formatDate('2026-04-08T08:00:00Z')).toBe('Yesterday');
  });

  it('returns a weekday name for dates 2-6 days ago', () => {
    jest.setSystemTime(new Date('2026-04-09T12:00:00Z')); // Thursday
    const result = formatDate('2026-04-06T08:00:00Z'); // Monday
    expect(result).toBe('Mon');
  });

  it('returns month/day for dates 7+ days ago', () => {
    jest.setSystemTime(new Date('2026-04-09T12:00:00Z'));
    expect(formatDate('2026-03-20T08:00:00Z')).toBe('Mar 20');
  });
});
