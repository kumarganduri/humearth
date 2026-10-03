import { describe, expect, it } from 'vitest';
import { checkCountries, parseCsvLine, sha256 } from './countries-check';
import type { CountriesSource } from '../../src/footprint/series-types';

// A tiny CSV shaped like Ember's: wide format, Demand is one "Electricity source" row per area and year.
const CSV = [
  'Area,ISO 3 code,Year,Area type,Electricity source,Generation (TWh),Continent',
  'France,FRA,2025,Country or economy,Demand,480.57,Europe',
  'France,FRA,2025,Country or economy,Total Generation,574.37,Europe',
  'France,FRA,2024,Country or economy,Demand,474.513,Europe',
  '"Bonaire, Sint Eustatius and Saba",BES,2025,Country or economy,Demand,0.2,Americas',
  'Japan,JPN,2025,Country or economy,Demand,1029.97,Asia',
].join('\n');
const bytes = (s: string) => new TextEncoder().encode(s);

const source = (over: Partial<CountriesSource> = {}): CountriesSource => ({
  dataset: {
    name: 'fixture',
    page: 'https://example.org',
    url: 'https://example.org/f.csv',
    retrieved: '2026-10-03',
    sha256: sha256(bytes(CSV)),
    licence: 'CC-BY-4.0',
    checked: 'dataset',
    filter: { areaColumn: 'Area', yearColumn: 'Year', sourceColumn: 'Electricity source', sourceValue: 'Demand', valueColumn: 'Generation (TWh)' },
  },
  year: 2025,
  unit: 'TWh/yr',
  countries: [
    { name: 'France', demandTWh: 480.57 },
    { name: 'Japan', demandTWh: 1029.97 },
  ],
  ...over,
});

describe('checkCountries: every stored country number matches the dataset file', () => {
  it('passes when the file and every row match (demand row, right year, not generation)', () => {
    expect(checkCountries(bytes(CSV), source())).toEqual([]);
  });

  it('fails on a typo in a stored value', () => {
    const s = source({ countries: [{ name: 'France', demandTWh: 408.57 }] });
    expect(checkCountries(bytes(CSV), s)).toEqual(['France: stored 408.57, dataset has 480.57']);
  });

  it('fails when the file was re-published (different bytes), even if the numbers still match', () => {
    const changed = `${CSV}\nSpain,ESP,2025,Country or economy,Demand,275.25,Europe`;
    expect(checkCountries(bytes(changed), source()).join()).toMatch(/dataset file changed: sha256/);
  });

  it('fails on a country with no row for that year, and on a renamed column', () => {
    expect(checkCountries(bytes(CSV), source({ countries: [{ name: 'Atlantis', demandTWh: 1 }] }))).toEqual([
      'Atlantis: no Demand row for 2025 in the dataset',
    ]);
    const renamed = CSV.replace('Generation (TWh)', 'Value');
    expect(checkCountries(bytes(renamed), source()).join()).toMatch(/column "Generation \(TWh\)" not found/);
  });
});

describe('parseCsvLine', () => {
  it('handles quoted commas and escaped quotes', () => {
    expect(parseCsvLine('"Bonaire, Sint Eustatius and Saba",BES,2025')).toEqual(['Bonaire, Sint Eustatius and Saba', 'BES', '2025']);
    expect(parseCsvLine('"say ""hi""",x,')).toEqual(['say "hi"', 'x', '']);
  });
});
