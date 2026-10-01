// Pure core of the data pipeline (eng review 4A), kept separate from file I/O so it can be tested.
//
//   data/sources/constants.source.json ─┐
//   data/sources/mapping.json ──────────┼─ validate ─> Constants (version, contentHash)
//   previous public/data/constants.json ┘                └─> changelog entry when numbers changed
//   data/sources/hubs.source.json ─ validate ─> public/data/hubs.json (contentHash)

import { createHash } from 'node:crypto';
import { validateHubs, validateMapping, validateSource } from '../../src/footprint/schema';
import { VALUE_KEYS, type Constants, type Hub, type HubsFile, type Mapping } from '../../src/footprint/types';

export interface ChangelogEntry {
  date: string;
  constantsVersion: number;
  changes: { key: string; from: [number, number, number] | null; to: [number, number, number] }[];
  mappingChanged: boolean;
}

/** Stable JSON: object keys sorted at every level, so the hash only changes when content does. */
export function canonical(x: unknown): string {
  if (Array.isArray(x)) return `[${x.map(canonical).join(',')}]`;
  if (x && typeof x === 'object') {
    const o = x as Record<string, unknown>;
    return `{${Object.keys(o)
      .filter((k) => k !== '$comment')
      .sort()
      .map((k) => `${JSON.stringify(k)}:${canonical(o[k])}`)
      .join(',')}}`;
  }
  return JSON.stringify(x);
}

const hashOf = (x: unknown) => createHash('sha256').update(canonical(x)).digest('hex').slice(0, 16);

export class DataValidationError extends Error {
  constructor(public readonly problems: string[]) {
    super(`Data validation failed:\n  - ${problems.join('\n  - ')}`);
  }
}

export function buildConstants(
  source: unknown,
  mapping: unknown,
  previous: Constants | null,
  today: string,
): { constants: Constants; changelog: ChangelogEntry | null } {
  const problems = [...validateSource(source), ...validateMapping(mapping)];
  if (problems.length) throw new DataValidationError(problems);

  const src = source as Pick<Constants, 'values' | 'quiz' | 'comparisons'>;
  const body = { values: src.values, quiz: src.quiz, comparisons: src.comparisons, mapping: mapping as Mapping };
  const contentHash = hashOf(body);

  if (previous && previous.contentHash === contentHash) {
    return { constants: previous, changelog: null };
  }
  const constantsVersion = (previous?.constantsVersion ?? 0) + 1;
  const constants: Constants = { constantsVersion, contentHash, builtAt: today, ...body };

  const triple = (v: { low: number; mid: number; high: number }): [number, number, number] => [v.low, v.mid, v.high];
  const changes: ChangelogEntry['changes'] = [];
  for (const key of VALUE_KEYS) {
    const to = triple(constants.values[key]);
    const before = previous?.values[key];
    const from = before ? triple(before) : null;
    if (!from || from.some((n, i) => n !== to[i])) changes.push({ key, from, to });
  }
  const mappingChanged = !previous || canonical(previous.mapping) !== canonical(constants.mapping);
  return { constants, changelog: { date: today, constantsVersion, changes, mappingChanged } };
}


/** data/sources/hubs.source.json -> public/data/hubs.json. Returns null when nothing changed. */
export function buildHubs(source: unknown, previous: HubsFile | null, today: string): HubsFile | null {
  const problems = validateHubs(source);
  if (problems.length) throw new DataValidationError(problems);
  const hubs = (source as { hubs: Hub[] }).hubs;
  const contentHash = hashOf(hubs);
  if (previous?.contentHash === contentHash) return null;
  return { contentHash, builtAt: today, hubs };
}
