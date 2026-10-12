import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { answerMg, eiaIntensity, factorsFromLb, last24h, LB_TO_G, parseNeso } from './grid';

const fixture = (f: string) => JSON.parse(readFileSync(`src/livegrid/fixtures/${f}`, 'utf8'));
const f = factorsFromLb(2.31, 0.96, 2.46); // EIA 2023, lb CO2/kWh (constants.json)

describe('London: NESO regional estimate', () => {
  it('a real 24 h response parses to 48 half-hours, oldest first, with plausible g/kWh', () => {
    const pts = parseNeso(fixture('neso-london.json'));
    expect(pts).toHaveLength(48);
    expect(pts[0]!.t < pts[47]!.t).toBe(true);
    for (const p of pts) {
      expect(p.t).toMatch(/^\d{4}-\d\d-\d\dT\d\d:\d\d:00Z$/);
      expect(p.g).toBeGreaterThanOrEqual(0);
      expect(p.g).toBeLessThan(600);
    }
  });
  it('junk and broken rows are dropped, not shown as zero', () => {
    expect(parseNeso(null)).toEqual([]);
    expect(parseNeso({ data: { data: [{ from: 'x', intensity: { forecast: 50 } }, { from: '2026-10-12T10:00Z', intensity: {} }, { from: '2026-10-12T10:30Z', intensity: { forecast: 90 } }] } })).toEqual([{ t: '2026-10-12T10:30:00Z', g: 90 }]);
  });
});

describe('Northern Virginia: calculated from EIA fuel mix for PJM', () => {
  it('weights each fuel by its EIA CO2 per kWh; nuclear, wind, solar and hydro count as zero; charging is not generation', () => {
    const pts = eiaIntensity(fixture('eia-pjm.json'), f);
    expect(pts.map((p) => p.t)).toEqual(['2026-10-12T14:00:00Z', '2026-10-12T15:00:00Z']);
    const total14 = 12000 + 30000 + 33000 + 3000 + 2000 + 1000 + 100 + 900;
    const expected14 = (12000 * 2.31 + 30000 * 0.96 + 100 * 2.46) * LB_TO_G / total14;
    expect(pts[0]!.g).toBeCloseTo(expected14, 6);
    expect(pts[1]!.g).toBeLessThan(pts[0]!.g); // less coal in the second hour
    expect(pts[0]!.g).toBeGreaterThan(200);
    expect(pts[0]!.g).toBeLessThan(500);
  });
  it('an empty or broken response gives no points', () => {
    expect(eiaIntensity({}, f)).toEqual([]);
    expect(eiaIntensity({ response: { data: [{ period: 'bad', fueltype: 'COL', value: '1' }] } }, f)).toEqual([]);
  });
});

describe('shared', () => {
  it('an AI answer (0.34 Wh) at 200 g/kWh is 68 mg of CO2', () => expect(answerMg(200, 0.34)).toBeCloseTo(68, 9));
  it('last24h keeps the day before the newest point', () => {
    const pts = [{ t: '2026-10-10T10:00:00Z', g: 1 }, { t: '2026-10-11T10:30:00Z', g: 2 }, { t: '2026-10-12T10:00:00Z', g: 3 }];
    expect(last24h(pts).map((p) => p.g)).toEqual([2, 3]);
  });
});
