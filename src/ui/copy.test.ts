import { describe, expect, it } from 'vitest';
import { footprint } from '../footprint/engine';
import { realConstants } from '../footprint/testing';
import { TEXT_HEAVY, VIDEO_HEAVY } from '../footprint/guardrails';
import { band, sentenceFor, worldDescription } from './copy';
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
  it('the screen-reader description mentions the river and the birds', () => {
    const d = worldDescription(footprint(VIDEO_HEAVY, c));
    expect(d).toMatch(/river/);
    expect(d).toMatch(/birds/);
  });
});
