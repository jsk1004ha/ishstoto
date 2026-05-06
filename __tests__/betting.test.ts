import { describe, expect, it } from 'vitest';
import { allocatePayouts, calculateOdds, computePools } from '@/lib/betting';

describe('betting pool math', () => {
  it('calculates pool odds and percentages', () => {
    const options = [{ id: 'a', label: '1반' }, { id: 'b', label: '2반' }];
    const result = computePools(options, [
      { userId: 'u1', optionId: 'a', points: 100, status: 'ACTIVE' },
      { userId: 'u2', optionId: 'a', points: 100, status: 'ACTIVE' },
      { userId: 'u3', optionId: 'b', points: 300, status: 'ACTIVE' }
    ]);
    expect(result.totalPoints).toBe(500);
    expect(result.totalParticipants).toBe(3);
    expect(result.optionPools[0].percentage).toBe(40);
    expect(result.optionPools[0].odds).toBe(2.5);
    expect(result.optionPools[1].odds).toBeCloseTo(1.67, 2);
  });

  it('does not display odds when no points are on an option', () => {
    expect(calculateOdds(100, 0)).toBeNull();
  });

  it('allocates rounded payouts without exceeding the total pool', () => {
    const payouts = allocatePayouts([
      { id: 'p1', userId: 'u1', points: 10 },
      { id: 'p2', userId: 'u2', points: 10 },
      { id: 'p3', userId: 'u3', points: 10 }
    ], 100, 30);
    expect(payouts.reduce((sum, payout) => sum + payout.payout, 0)).toBe(100);
    expect(payouts.map((payout) => payout.payout).sort()).toEqual([33, 33, 34]);
  });
});
