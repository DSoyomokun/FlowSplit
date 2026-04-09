/**
 * Tests for donut chart calculation logic (Story 092).
 *
 * The pure calculations (splitPoints, remainder, segment constraints)
 * are tested here without rendering the hook.
 */

import { MIN_SEGMENT_SIZE } from '@/components/DonutChart/types';
import type { DonutSegment } from '@/components/DonutChart/types';

// ── Pure calculation helpers (mirrors hook logic) ─────────────────────────────

function calcSplitPoints(segments: DonutSegment[]): number[] {
  let cumulative = 0;
  return segments.map((s) => {
    cumulative += s.percentage;
    return cumulative;
  });
}

function calcRemainder(segments: DonutSegment[]): number {
  const total = segments.reduce((sum, s) => sum + s.percentage, 0);
  return Math.max(0, 100 - total);
}

function calcSegmentAmounts(segments: DonutSegment[], total: number) {
  return segments.map((s) => ({
    id: s.id,
    amount: (total * s.percentage) / 100,
  }));
}

function clampPercentage(newPct: number, segmentCount: number): number {
  return Math.max(
    MIN_SEGMENT_SIZE,
    Math.min(100 - (segmentCount - 1) * MIN_SEGMENT_SIZE, newPct)
  );
}

// ── Fixtures ──────────────────────────────────────────────────────────────────

const seg = (id: string, pct: number): DonutSegment => ({
  id,
  name: id,
  percentage: pct,
  color: '#000',
});

// ── splitPoints ───────────────────────────────────────────────────────────────

describe('calcSplitPoints', () => {
  it('returns cumulative percentages', () => {
    const segs = [seg('a', 10), seg('b', 15), seg('c', 10)];
    expect(calcSplitPoints(segs)).toEqual([10, 25, 35]);
  });

  it('handles single segment', () => {
    expect(calcSplitPoints([seg('a', 20)])).toEqual([20]);
  });

  it('returns empty array for no segments', () => {
    expect(calcSplitPoints([])).toEqual([]);
  });

  it('handles 100% total', () => {
    const segs = [seg('a', 50), seg('b', 50)];
    expect(calcSplitPoints(segs)).toEqual([50, 100]);
  });
});

// ── remainder ─────────────────────────────────────────────────────────────────

describe('calcRemainder', () => {
  it('calculates remainder correctly', () => {
    const segs = [seg('a', 10), seg('b', 15)];
    expect(calcRemainder(segs)).toBe(75);
  });

  it('returns 0 when 100% allocated', () => {
    const segs = [seg('a', 60), seg('b', 40)];
    expect(calcRemainder(segs)).toBe(0);
  });

  it('never returns negative', () => {
    const segs = [seg('a', 60), seg('b', 50)]; // over 100%
    expect(calcRemainder(segs)).toBe(0);
  });

  it('returns 100 for empty segments', () => {
    expect(calcRemainder([])).toBe(100);
  });
});

// ── segment amounts ───────────────────────────────────────────────────────────

describe('calcSegmentAmounts', () => {
  it('calculates dollar amounts from percentages', () => {
    const segs = [seg('tithe', 10), seg('savings', 20)];
    const amounts = calcSegmentAmounts(segs, 1000);
    expect(amounts).toEqual([
      { id: 'tithe', amount: 100 },
      { id: 'savings', amount: 200 },
    ]);
  });

  it('handles zero total', () => {
    const amounts = calcSegmentAmounts([seg('a', 10)], 0);
    expect(amounts[0].amount).toBe(0);
  });

  it('preserves segment order and ids', () => {
    const segs = [seg('b', 15), seg('a', 25)];
    const amounts = calcSegmentAmounts(segs, 100);
    expect(amounts[0].id).toBe('b');
    expect(amounts[1].id).toBe('a');
  });
});

// ── clampPercentage ───────────────────────────────────────────────────────────

describe('clampPercentage', () => {
  it('respects MIN_SEGMENT_SIZE floor', () => {
    expect(clampPercentage(1, 3)).toBe(MIN_SEGMENT_SIZE);
  });

  it('respects upper bound (leaves room for other segments)', () => {
    // 3 segments: max for one is 100 - (3-1)*MIN = 100 - 10 = 90
    expect(clampPercentage(95, 3)).toBe(90);
  });

  it('passes through valid values unchanged', () => {
    expect(clampPercentage(20, 3)).toBe(20);
  });

  it('single segment can take full 100%', () => {
    // max = 100 - (1-1)*MIN = 100
    expect(clampPercentage(100, 1)).toBe(100);
  });
});

// ── MIN_SEGMENT_SIZE constant ────────────────────────────────────────────────

describe('MIN_SEGMENT_SIZE', () => {
  it('is a positive number', () => {
    expect(MIN_SEGMENT_SIZE).toBeGreaterThan(0);
  });
});
