import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { buildConstants, buildHubs, canonical, DataValidationError } from './build';
import { readMapping, readSource } from '../../src/footprint/testing';

const clone = <T>(x: T): T => structuredClone(x);
const src = () => clone(readSource()) as any;
const map = () => clone(readMapping()) as any;

function problemsOf(fn: () => unknown): string[] {
  try {
    fn();
  } catch (e) {
    if (e instanceof DataValidationError) return e.problems;
    throw e;
  }
  return [];
}

describe('buildConstants: validation (the build must fail on any unsourced or broken number)', () => {
  it('accepts the real sourced data', () => {
    expect(problemsOf(() => buildConstants(src(), map(), null, '2026-10-02'))).toEqual([]);
  });

  it('rejects low > mid', () => {
    const s = src();
    s.values.imageWh.low = 5;
    expect(problemsOf(() => buildConstants(s, map(), null, '2026-10-02')).join()).toMatch(/imageWh: needs low <= mid <= high/);
  });

  it('rejects a value with no sources, or a level no source supports', () => {
    const s = src();
    s.values.textPromptWh.sources = [];
    s.values.imageWh.sources = s.values.imageWh.sources.filter((x: any) => !x.supports.includes('high'));
    const p = problemsOf(() => buildConstants(s, map(), null, '2026-10-02')).join('\n');
    expect(p).toMatch(/textPromptWh.sources: at least one source required/);
    expect(p).toMatch(/imageWh: no source supports "high"/);
  });

  it('rejects non-https URLs, bad dates, missing values and negative numbers', () => {
    const s = src();
    s.values.gridGCO2PerKWh.sources[0].url = 'http://example.com';
    s.values.gridGCO2PerKWh.sources[0].retrieved = 'yesterday';
    delete s.values.worldPopulation;
    s.values.videoClipWh.low = -1;
    const p = problemsOf(() => buildConstants(s, map(), null, '2026-10-02')).join('\n');
    expect(p).toMatch(/url: must be https/);
    expect(p).toMatch(/retrieved: YYYY-MM-DD/);
    expect(p).toMatch(/worldPopulation: missing/);
    expect(p).toMatch(/videoClipWh.low: must be a finite number >= 0/);
  });

  it('rejects a quiz table with the wrong length or a decreasing step', () => {
    const s = src();
    s.quiz.textPromptsPerDay = [1, 6, 30];
    s.quiz.imagesPerWeek = [0, 20, 3];
    const p = problemsOf(() => buildConstants(s, map(), null, '2026-10-02')).join('\n');
    expect(p).toMatch(/textPromptsPerDay: needs 4 entries/);
    expect(p).toMatch(/imagesPerWeek: must not decrease/);
  });

  it('rejects a missing or invalid mapping', () => {
    expect(problemsOf(() => buildConstants(src(), null, null, '2026-10-02')).join()).toMatch(/mapping: missing/);
    expect(problemsOf(() => buildConstants(src(), { ...map(), k: 0 }, null, '2026-10-02')).join()).toMatch(/mapping.k/);
  });
});

describe('buildConstants: versioning and the change log', () => {
  it('first build is v1 and logs every value as new', () => {
    const { constants, changelog } = buildConstants(src(), map(), null, '2026-10-02');
    expect(constants.constantsVersion).toBe(1);
    expect(changelog?.changes).toHaveLength(8);
    expect(changelog?.changes.every((x) => x.from === null)).toBe(true);
  });

  it('unchanged content keeps the version and writes no log entry', () => {
    const first = buildConstants(src(), map(), null, '2026-10-02').constants;
    const again = buildConstants(src(), map(), first, '2026-10-09');
    expect(again.changelog).toBeNull();
    expect(again.constants).toBe(first);
  });

  it('a changed number bumps the version and logs exactly that change', () => {
    const first = buildConstants(src(), map(), null, '2026-10-02').constants;
    const s = src();
    s.values.textPromptWh.mid = 0.3;
    const { constants, changelog } = buildConstants(s, map(), first, '2026-11-01');
    expect(constants.constantsVersion).toBe(2);
    expect(changelog?.changes).toEqual([{ key: 'textPromptWh', from: [0.24, 0.34, 1.86], to: [0.24, 0.3, 1.86] }]);
    expect(changelog?.mappingChanged).toBe(false);
  });

  it('ignores $comment and key order when hashing', () => {
    expect(canonical({ b: 1, a: [1, { d: 2, c: 3 }], $comment: 'x' })).toBe(canonical({ a: [1, { c: 3, d: 2 }], b: 1 }));
  });
});

describe('buildHubs', () => {
  const hubsSrc = () => JSON.parse(readFileSync('data/sources/hubs.source.json', 'utf8'));
  it('accepts the real sourced hubs (27, every one with a measure and page-checked sources)', () => {
    const out = buildHubs(hubsSrc(), null, '2026-10-02');
    expect(out?.hubs.length).toBe(27);
    expect(out?.hubs.every((h) => h.sources.every((s) => s.checked === 'page'))).toBe(true);
    expect(out?.hubs.every((h) => h.measure && h.sources.length > 0)).toBe(true);
  });
  it('returns null when nothing changed', () => {
    const first = buildHubs(hubsSrc(), null, '2026-10-02')!;
    expect(buildHubs(hubsSrc(), first, '2026-10-09')).toBeNull();
  });
  it('rejects bad coordinates, duplicates, a missing measure and out-of-order MW', () => {
    const s = hubsSrc();
    s.hubs[0].lat = 120;
    s.hubs[1].name = s.hubs[2].name;
    delete s.hubs[3].measure;
    s.hubs[4].mw = { low: 10, mid: 5, high: 20 };
    s.hubs[5].sources[0].checked = 'vibes';
    const p = problemsOf(() => buildHubs(s, null, '2026-10-02')).join('\n');
    expect(p).toMatch(/lat: must be in \[-90, 90\]/);
    expect(p).toMatch(/duplicate name/);
    expect(p).toMatch(/measure: required/);
    expect(p).toMatch(/mw: needs low <= mid <= high/);
    expect(p).toMatch(/checked: page \| search-summary/);
  });
  it('rejects an empty or missing hub list', () => {
    expect(problemsOf(() => buildHubs({ hubs: [] }, null, '2026-10-02')).join()).toMatch(/at least one hub/);
    expect(problemsOf(() => buildHubs(null, null, '2026-10-02')).join()).toMatch(/hubs: missing/);
  });
});
