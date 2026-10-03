import { describe, expect, it } from 'vitest';
import { calculatorHtml, calculatorOutputs, clampUsage, DEFAULT_USAGE, LIMITS, outputsHtml, sentenceFor } from './calculator';
import { realConstants } from '../footprint/testing';

const c = realConstants();

describe('calculatorOutputs: a week, always as a range in readable units', () => {
  it('the default week: electricity, CO2 and water as low · mid · high', () => {
    const o = calculatorOutputs(DEFAULT_USAGE, c);
    expect(o.energy.text).toMatch(/^[\d.,]+ · [\d.,]+ · [\d.,]+ k?Wh$/);
    expect(o.co2.text).toMatch(/ k?g CO2$/);
    expect(o.water.text).toMatch(/ litres$/);
  });

  it('switches to kWh / kg once the middle figure passes 1,000, keeping one unit per reading', () => {
    const big = calculatorOutputs({ questionsPerDay: 100, picturesPerWeek: 40, videosPerWeek: 10 }, c);
    expect(big.energy.unit).toBe('kWh');
    expect(big.energy.text).toMatch(/^[\d.,]+ · [\d.,]+ · [\d.,]+ kWh$/);
  });

  it('an empty week is zero and says so (no NaN, no ranges of zeros)', () => {
    const o = calculatorOutputs({ questionsPerDay: 0, picturesPerWeek: 0, videosPerWeek: 0 }, c);
    expect(o.energy.text).toBe('0 Wh');
    expect(o.sentence).toBe('No AI this week, so nothing to add up.');
  });
});

describe('sentenceFor: your typing is small, your video isn\'t', () => {
  it('names each activity used and the video share of the week', () => {
    expect(sentenceFor({ text: 47.6, images: 3.66, videos: 90 })).toBe('Your questions: 47.6 Wh. Your pictures: 3.66 Wh. Your videos: 90 Wh, 64% of your week.');
    expect(sentenceFor({ text: 47.6, images: 0, videos: 0 })).toBe('Your questions: 47.6 Wh.');
  });
});

describe('clampUsage: sliders, URLs and typos can never produce nonsense', () => {
  it('rounds, clamps to 0..max, and falls back to the default for junk', () => {
    expect(clampUsage({ questionsPerDay: '7.6', picturesPerWeek: -3, videosPerWeek: 999 })).toEqual({
      questionsPerDay: 8,
      picturesPerWeek: 0,
      videosPerWeek: LIMITS.videosPerWeek.max,
    });
    expect(clampUsage({ questionsPerDay: 'abc' })).toEqual(DEFAULT_USAGE);
  });
});

describe('calculatorHtml: prebuilt with the default week', () => {
  const h = calculatorHtml(c);
  it('sliders start disabled at the default values (JS wakes them), outputs already filled in', () => {
    expect(h).toMatch(/id="u-questionsPerDay" data-k="questionsPerDay" min="0" max="100" step="1" value="20" disabled/);
    expect(h).toContain(outputsHtml(calculatorOutputs(DEFAULT_USAGE, c)));
    expect(h).toContain('aria-live="polite"');
    expect(h).toContain("Your typing is small. Your video isn't. And your voice is the big one.");
  });
});
