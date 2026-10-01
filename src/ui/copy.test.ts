import { describe, expect, it } from 'vitest';

import { realConstants } from '../footprint/testing';
import { TEXT_HEAVY, VIDEO_HEAVY } from '../footprint/guardrails';
import { band, comparisonWords, panelCopy, planWords, quizQuestions, sentenceFor, worldDescription } from './copy';
import { footprint, kidComparisons } from '../footprint/engine';
import type { Buckets } from '../footprint/types';

const c = realConstants();
const BANNED = /\b(data cent(er|re)|gCO2e?|mL|Wh|kWh|inference|parameters?|model)\b/i;

describe('kid copy', () => {
  it('every sentence for every answer combination is short and uses glossary words only', () => {
    for (const text of [0, 1, 2, 3] as const)
      for (const images of [0, 1, 2] as const)
        for (const videos of [0, 1, 2] as const) {
          const s = sentenceFor(footprint({ text, images, videos } as Buckets, c));
          expect(s.split(/\s+/).length).toBeLessThanOrEqual(12);
          expect(s).not.toMatch(BANNED);
        }
  });
  it('a text-heavy week is "great"; a video-heavy week names videos', () => {
    expect(band(footprint(TEXT_HEAVY, c))).toBe('great');
    expect(sentenceFor(footprint(VIDEO_HEAVY, c))).toMatch(/AI videos/);
  });
  it("on a friend's world it talks about your friend's world, never yours", () => {
    const f = footprint(VIDEO_HEAVY, c);
    expect(sentenceFor(f, 'friend')).toMatch(/Your friend's/);
    expect(sentenceFor(f, 'friend')).not.toMatch(/\bYour (world|river)/);
    expect(worldDescription(f, 'friend')).not.toMatch(/\b[Yy]our (world|river)/);
  });
  it('the screen-reader description mentions the river and the birds', () => {
    const d = worldDescription(footprint(VIDEO_HEAVY, c));
    expect(d).toMatch(/river/);
    expect(d).toMatch(/birds/);
  });
});

describe('quiz, plan words and comparisons', () => {
  it('quiz has 3 questions whose option counts match the sourced quiz table', () => {
    const q = quizQuestions(c);
    expect(q.map((x) => x.key)).toEqual(['text', 'images', 'videos']);
    expect(q.map((x) => x.options.length)).toEqual([c.quiz.textPromptsPerDay.length, c.quiz.imagesPerWeek.length, c.quiz.videosPerWeek.length]);
    expect(q[1]!.options[1]!.small).toBe(`about ${c.quiz.imagesPerWeek[1]} a week`);
    for (const x of q) for (const o of x.options) expect(`${x.ask} ${o.big} ${o.small}`).not.toMatch(BANNED);
  });
  it('plan words read naturally', () => {
    expect(planWords({ fewerPictures: false, fewerVideos: false, lighterAi: false })).toBe('');
    expect(planWords({ fewerPictures: true, fewerVideos: false, lighterAi: false })).toBe('fewer AI pictures');
    expect(planWords({ fewerPictures: true, fewerVideos: true, lighterAi: true })).toBe('fewer AI pictures, fewer AI videos and a lighter AI');
  });
  it('tiny amounts read "less than 1", never "0.0"', () => {
    expect(comparisonWords({ glasses: 0.04, bathtubs: 0, fridgeMinutes: 0.3, balloons: 0.1 })).toEqual({
      air: 'less than 1 balloon of CO2',
      water: 'less than 1 glass',
      power: 'a fridge for less than a minute',
    });
  });
  it('a light text-only week is not called "lots"', () => {
    expect(sentenceFor(footprint({ text: 0, images: 0, videos: 0 }, c))).not.toMatch(/Lots/);
  });
  it('comparisons switch to bathtubs and hours when big, with no units kids do not know', () => {
    expect(comparisonWords({ glasses: 2, bathtubs: 0.003, fridgeMinutes: 45, balloons: 1 })).toEqual({ air: '1 balloon of CO2', water: '2 glasses', power: 'a fridge for 45 minutes' });
    const big = comparisonWords({ glasses: 900, bathtubs: 1.5, fridgeMinutes: 1154, balloons: 224.1 });
    expect(big).toEqual({ air: '224 balloons of CO2', water: '1.5 bathtubs', power: 'a fridge for 19 hours' });
  });
});

describe('tap panel (12A)', () => {
  it('shows a low-to-high range in kid words and a reason, for every channel', () => {
    const f = footprint(VIDEO_HEAVY, c);
    const lo = kidComparisons(f.weekly.low.totals, c);
    const hi = kidComparisons(f.weekly.high.totals, c);
    for (const ch of ['co2', 'water', 'energy'] as const) {
      const p = panelCopy(ch, lo, hi);
      expect(p.range).toMatch(/^Somewhere from .+ to .+$/);
      expect(p.whyUnsure.length).toBeGreaterThan(20);
      expect(`${p.title} ${p.range} ${p.whyUnsure}`).not.toMatch(BANNED);
    }
  });
  it('says "About" (or "Less than") when low and high read the same, and speaks about a friend on their world', () => {
    const k = { glasses: 0.1, bathtubs: 0, fridgeMinutes: 0.2, balloons: 0.1 };
    expect(panelCopy('water', k, k).range).toBe('Less than 1 glass');
    expect(panelCopy('water', { ...k, glasses: 2 }, { ...k, glasses: 2 }).range).toBe('About 2 glasses');
    expect(panelCopy('water', k, k, 'friend').title).toBe("Your friend's water this week");
  });
});
