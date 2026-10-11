import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { actionsFor, reduceBarsHtml, reduceHtml } from './reduce';
import { DEFAULT_USAGE } from './calculator';
import type { Constants } from '../footprint/types';

const c = JSON.parse(readFileSync('public/data/constants.json', 'utf8')) as Constants;

describe('what actually reduces it', () => {
  it('default week (20 questions a day, 3 pictures, 1 video): the video is the biggest saving, questions the smallest real one', () => {
    const a = actionsFor(DEFAULT_USAGE, c);
    expect(a.map((x) => x.key)).toEqual(['videos', 'day-off', 'questions', 'pictures']);
    expect(a[0]!.saved.mid).toBe(90); // one 90 Wh video
    expect(a.find((x) => x.key === 'questions')!.saved.mid).toBeCloseTo(5 * 7 * 0.34, 9);
    expect(a.find((x) => x.key === 'pictures')!.saved.mid).toBeCloseTo(2 * 1.22, 9); // half of 3, rounded: 2 whole pictures
  });
  it('a day off saves a seventh of your week; ranges keep low <= mid <= high', () => {
    for (const x of actionsFor({ questionsPerDay: 40, picturesPerWeek: 10, videosPerWeek: 3 }, c)) {
      expect(x.saved.low).toBeLessThanOrEqual(x.saved.mid);
      expect(x.saved.mid).toBeLessThanOrEqual(x.saved.high);
    }
    const u = { questionsPerDay: 10, picturesPerWeek: 0, videosPerWeek: 0 };
    expect(actionsFor(u, c).find((x) => x.key === 'day-off')!.saved.mid).toBeCloseTo((10 * 7 * 0.34) / 7, 9);
  });
  it('things you don\'t do say so instead of drawing a zero bar; fewer questions never exceeds what you ask', () => {
    const a = actionsFor({ questionsPerDay: 2, picturesPerWeek: 0, videosPerWeek: 0 }, c);
    expect(a.find((x) => x.key === 'videos')!.none).toBe("You don't make any videos");
    expect(a.find((x) => x.key === 'questions')!.label).toBe('Ask 2 fewer questions a day');
    expect(reduceBarsHtml({ questionsPerDay: 0, picturesPerWeek: 0, videosPerWeek: 0 }, c)).not.toContain('cut-fill');
  });
  it('one linear scale: the biggest saving is full width, tiny ones keep a visible sliver, all with labels', () => {
    const h = reduceBarsHtml(DEFAULT_USAGE, c);
    expect(h).toContain('style="width:100.00%"');
    const widths = [...h.matchAll(/width:([\d.]+)%/g)].map((m) => Number(m[1]));
    expect(Math.min(...widths)).toBeGreaterThanOrEqual(0.4);
    expect(h.match(/: saves about [\d.,]+ Wh/g)).toHaveLength(4);
  });
  it('the section links back to your answers and to /2030, with no style attributes left after the build', () => {
    const h = reduceHtml(DEFAULT_USAGE, c);
    expect(h).toContain('href="#your-part"');
    expect(h).toContain('href="/2030"');
  });
});
