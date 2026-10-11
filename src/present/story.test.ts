import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { impactsHtml, shareWords, whereItGoesHtml, type StoryData } from './story';
import type { SeriesFile } from '../footprint/series-types';
import type { Constants } from '../footprint/types';

const read = <T>(p: string) => JSON.parse(readFileSync(p, 'utf8')) as T;
const d = (): StoryData => ({ series: read<SeriesFile>('public/data/series.json'), constants: read<Constants>('public/data/constants.json') });

describe('where the electricity goes', () => {
  const h = whereItGoesHtml(d());
  it("AI's part of today's total, as a range computed from the shared data", () => {
    expect(h).toContain('AI was about <strong>129 to 184 TWh</strong>: roughly a quarter to two-fifths');
    expect(h).toContain('AI: 26.5%–38%');
    expect(h).toContain('style="width:26.50%"');
  });
  it('AI growth (+50%, sourced) against all data centres (+16.9%, calculated and marked so)', () => {
    expect(h).toContain('+50%');
    expect(h).toMatch(/<span class="g-v num derived" title="calculated: 415 TWh \(2024\) to 485 TWh \(2025\)">\+16.9%<\/span>/);
  });
  it('share words read naturally', () => {
    expect(shareWords(0.265, 0.38)).toBe('roughly a quarter to two-fifths');
    expect(shareWords(0.3, 0.34)).toBe('about a third');
  });
});

describe('what it does to the world (measured)', () => {
  const h = impactsHtml(d());
  it('three MEASURED rows: electricity, CO2, water', () => {
    expect((h.match(/class="badge m">MEASURED</g) ?? []).length).toBe(3);
    expect(h).toContain('485 TWh a year');
    expect(h).toContain('180 Mt CO2 a year');
    expect(h).toContain('0.12 · 2.54 · 5.48 litres per kWh');
  });
  it('says so when no low case was published, and marks the calculated water total', () => {
    expect(h).toContain('(no low case published)');
    expect(h).toMatch(/<span class="derived" title="calculated: 2025 electricity x litres per kWh">58.2 · 1,232 · 2,658 billion litres<\/span> \(calculated\)/);
  });
  it('without the stage 1b cases there are no EXPLAINED tiles, and no invented totals for place-by-place effects', () => {
    expect(h).not.toContain('badge e">EXPLAINED');
    expect(h).toContain('only known place by place');
  });

  it('with the cases: one EXPLAINED tile per named case, each with a place, linked sources and its quotes', () => {
    const impacts = JSON.parse(readFileSync('public/data/impacts.json', 'utf8'));
    const full = impactsHtml({ ...d(), impacts });
    expect(full.match(/badge e">EXPLAINED/g)).toHaveLength(impacts.tiles.length);
    for (const t of impacts.tiles) {
      expect(full).toContain(`id="case-${t.key}"`);
      for (const s of t.sources) expect(full).toContain(`href="${s.url.replace(/&/g, '&amp;')}"`);
    }
    expect(full.match(/<details class="quotes">/g)).toHaveLength(impacts.tiles.length);
  });
});
