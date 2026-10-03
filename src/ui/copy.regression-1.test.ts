import { describe, expect, it } from 'vitest';

import { realConstants } from '../footprint/testing';
import { footprint } from '../footprint/engine';
import type { Buckets } from '../footprint/types';
import { sentenceFor } from './copy';

// Regression: ISSUE-007 — trying a greener week flipped the sentence order
// ("Your world is resting. AI videos…" became "AI videos used most of it. Your world is doing great.").
// Found by /qa on 2026-10-03. Report: .gstack/qa-reports/qa-report-localhost-2026-10-03.md

const c = realConstants();

describe('world sentence order', () => {
  it('always says how the world is first, then what used the most', () => {
    for (const text of [0, 1, 2, 3] as const)
      for (const images of [0, 1, 2] as const)
        for (const videos of [0, 1, 2] as const) {
          const s = sentenceFor(footprint({ text, images, videos } as Buckets, c));
          expect(s).toMatch(/^Your (world|river)/);
          const [first] = s.split('. ');
          expect(first).not.toMatch(/used most/);
        }
  });
});
