// Proves every country number in data/sources/countries.source.json matches the dataset file it came from
// (eng review D3, outside voice #9). Pure: takes the file's bytes, returns problems.
//
//   CSV bytes ──sha256──> must equal dataset.sha256 (a re-published file fails on purpose: update knowingly)
//       └─ parse ─> rows where sourceColumn = sourceValue and year = source.year ─> compare each country

import { createHash } from 'node:crypto';
import type { CountriesSource } from '../../src/footprint/series-types';

/** RFC 4180-ish: commas, double-quoted fields, "" escapes. Enough for Ember's CSV. */
export function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cur += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') { out.push(cur); cur = ''; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}

export const sha256 = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');

/** Values are compared to 3 decimals, the precision we store. */
const same = (a: number, b: number) => Math.abs(a - b) < 0.0005;

export function checkCountries(bytes: Uint8Array, src: CountriesSource): string[] {
  const problems: string[] = [];
  const got = sha256(bytes);
  if (got !== src.dataset.sha256) {
    problems.push(`dataset file changed: sha256 ${got.slice(0, 12)}… (stored ${src.dataset.sha256.slice(0, 12)}…). Re-check the rows, then update countries.source.json.`);
  }
  const lines = new TextDecoder().decode(bytes).split(/\r?\n/).filter((l) => l.length > 0);
  if (lines.length < 2) return [...problems, 'dataset file is empty'];
  const header = parseCsvLine(lines[0]!);
  const f = src.dataset.filter;
  const col = (name: string) => header.indexOf(name);
  const [area, year, source, value] = [col(f.areaColumn), col(f.yearColumn), col(f.sourceColumn), col(f.valueColumn)];
  for (const [name, i] of [[f.areaColumn, area], [f.yearColumn, year], [f.sourceColumn, source], [f.valueColumn, value]] as const) {
    if (i < 0) problems.push(`column "${name}" not found in the dataset`);
  }
  if (problems.some((p) => p.startsWith('column'))) return problems;

  const found = new Map<string, number>();
  const wanted = new Set(src.countries.map((c) => c.name));
  for (const line of lines.slice(1)) {
    const cells = parseCsvLine(line);
    if (cells[source] !== f.sourceValue || cells[year] !== String(src.year) || !wanted.has(cells[area]!)) continue;
    found.set(cells[area]!, Number(cells[value]));
  }
  for (const c of src.countries) {
    const v = found.get(c.name);
    if (v === undefined) problems.push(`${c.name}: no ${f.sourceValue} row for ${src.year} in the dataset`);
    else if (!Number.isFinite(v) || !same(v, c.demandTWh)) problems.push(`${c.name}: stored ${c.demandTWh}, dataset has ${v}`);
  }
  return problems;
}
