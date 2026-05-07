import { describe, expect, it } from 'vitest';
import { SPORTS_FESTIVAL_DATE, sportsFestivalMatches } from '@/lib/sports-schedule';
import { createMatchSchema } from '@/lib/validation';

describe('sports festival schedule data', () => {
  it('contains the PDF-derived prediction matches', () => {
    expect(SPORTS_FESTIVAL_DATE).toBe('2026-05-07');
    expect(sportsFestivalMatches).toHaveLength(7);
    expect(sportsFestivalMatches.map((match) => match.title)).toEqual([
      '축구 3-4위전 1학년: 1반 vs 3반',
      '축구 3-4위전 2학년: 1반 vs 4반',
      '여학생 연합피구 1학년: 1+3반 vs 2+4반',
      '여학생 연합피구 2학년: 2+3반 vs 1+4반',
      '축구 1-2위전 1학년: 2반 vs 4반',
      '축구 1-2위전 2학년: 2반 vs 3반',
      '계주 우승반: 1반 vs 2반 vs 3반 vs 4반'
    ]);
  });

  it('uses winner options and closes predictions before each start time', () => {
    for (const match of sportsFestivalMatches) {
      expect(match.options.length).toBeGreaterThanOrEqual(2);
      expect(new Set(match.options).size).toBe(match.options.length);
      expect(match.locksAt.getTime()).toBeLessThan(match.startsAt.getTime());
      expect(match.startsAt.toISOString()).toMatch(/^2026-05-07T/);
    }
  });

  it('adds relay as a four-class winner pick', () => {
    const relay = sportsFestivalMatches.find((match) => match.sportType === 'RELAY');
    expect(relay).toBeDefined();
    if (!relay) return;
    expect(relay).toMatchObject({
      title: '계주 우승반: 1반 vs 2반 vs 3반 vs 4반',
      options: ['1반', '2반', '3반', '4반']
    });
    expect(() => createMatchSchema.parse({ ...relay, status: 'OPEN', options: relay.options.map((label) => ({ label })) })).not.toThrow();
  });

  it('uses dodgeball for the PDF 피구 rows instead of overloading another sport', () => {
    const dodgeball = sportsFestivalMatches.filter((match) => match.sportType === 'DODGEBALL');
    expect(dodgeball).toHaveLength(2);
    expect(dodgeball.every((match) => match.title.includes('피구'))).toBe(true);
  });
});
