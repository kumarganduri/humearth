import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { LABEL_GAP, fanSvg, spreadLabels } from './fan';
import type { MetricSeries, SeriesFile } from '../footprint/series-types';

const series = JSON.parse(readFileSync('public/data/series.json', 'utf8')) as SeriesFile;
const e = series.metrics.electricity;
const co2 = series.metrics.co2;
const refs = [
  { name: 'Japan', demandTWh: 1029.97 },
  { name: 'Germany', demandTWh: 516.525 },
];

/** Every number inside path/line/circle coordinates. */
const coords = (svg: string) =>
  [...svg.matchAll(/(?:d|x1|x2|y1|y2|cx|cy|x|y)="([^"]+)"/g)].flatMap((m) => m[1]!.match(/-?\d+(\.\d+)?/g)!.map(Number));

describe('fanSvg: brightness means certainty', () => {
  const svg = fanSvg(e, { unit: 'TWh', title: 'Data-centre electricity', references: refs });

  it('draws calculated history, measured years and the forecast as different line classes', () => {
    expect(svg).toContain('class="line calculated"');
    expect(svg).toContain('class="line measured"');
    expect(svg).toContain('class="line forecast"');
  });

  it('the solid "measured" line joins only published measurements (2024 to 2025), never a calculated year', () => {
    const measured = [...svg.matchAll(/class="line measured" d="([^"]+)"/g)].map((m) => m[1]!);
    expect(measured).toHaveLength(1);
    expect(measured[0]!.match(/[ML]/g)).toHaveLength(2); // exactly one segment
  });

  it('marks published figures: filled dots for measured years, rings for forecasts', () => {
    expect((svg.match(/class="dot measured"/g) ?? []).length).toBe(2); // 2024, 2025
    expect((svg.match(/class="dot forecast"/g) ?? []).length).toBe(2); // 2030, 2035
  });

  it('fills the forecast band where both edges exist, and labels today', () => {
    expect(svg).toContain('class="band"');
    expect(svg).toContain('class="band-edge high"');
    expect(svg).toContain('class="band-edge low"');
    expect(svg).toContain('>today 485<');
  });

  it('a metric with no published low gets only the high edge, never an invented band', () => {
    const c = fanSvg(co2, { unit: 'Mt', title: 'CO2' });
    expect(c).not.toContain('class="band"');
    expect(c).toContain('class="band-edge high"');
    expect(c).not.toContain('class="band-edge low"');
  });

  it('draws and labels reference lines; the axis tops out at a clean number with the unit once', () => {
    expect(svg).toContain('>Japan<');
    expect(svg).toContain('>2,000<'); // 1,700 high -> clean top 2,000
    expect(svg).toContain('class="tick unit"');
    expect((svg.match(/>TWh</g) ?? []).length).toBe(1);
  });

  it('everything stays inside the drawing', () => {
    for (const n of coords(svg)) {
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThanOrEqual(1080);
    }
  });

  it('has an accessible summary with today and the end-year range', () => {
    expect(svg).toMatch(/role="img" aria-label="Data-centre electricity\. 2017 to 2035\. Today \(2025\): 485 TWh\. 2035: 700 · 1,200 · 1,700 TWh\./);
  });

  it('escapes titles and reference names; an empty series renders an honest empty chart', () => {
    const evil = fanSvg(e, { unit: 'TWh', title: '"><script>', references: [{ name: '<img src=x>', demandTWh: 100 }] });
    expect(evil).not.toMatch(/<script>|<img/);
    const empty: MetricSeries = { ...e, years: e.years.map((y) => ({ ...y, mid: { value: null, kind: 'none' } })) };
    expect(fanSvg(empty, { unit: 'TWh', title: 'x' })).toContain('not enough data');
  });
});

describe('spreadLabels: reference labels never overlap', () => {
  it('pushes close labels apart in order, leaves far ones alone', () => {
    expect(spreadLabels([100, 105, 300], 14)).toEqual([100, 114, 300]);
    expect(spreadLabels([105, 100], 14)).toEqual([114, 100]); // original order of the input is kept
  });
  it('Germany (517) and France (481) get separate label rows in the real chart', () => {
    const s2 = fanSvg(e, { unit: 'TWh', title: 'x', references: [{ name: 'Germany', demandTWh: 516.525 }, { name: 'France', demandTWh: 480.57 }] });
    const ys = [...s2.matchAll(/class="ref-label" x="[\d.]+" y="([\d.]+)"/g)].map((m) => Number(m[1]));
    expect(Math.abs(ys[0]! - ys[1]!)).toBeGreaterThanOrEqual(LABEL_GAP - 0.1);
  });
  it('year ticks skip any within 3 years of an end (CO2 starts in 2024: no 2025 tick)', () => {
    const c = fanSvg(co2, { unit: 'Mt', title: 'CO2' });
    expect(c).toContain('>2024<');
    expect(c).not.toContain('>2025<');
  });
});
