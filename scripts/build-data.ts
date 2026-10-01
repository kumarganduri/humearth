// npm run build:data
// Validates the sourced numbers and writes public/data/constants.json. Fails the build on any problem.

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { buildConstants, DataValidationError, type ChangelogEntry } from './lib/build';
import type { Constants } from '../src/footprint/types';

const SOURCE = 'data/sources/constants.source.json';
const MAPPING = 'data/sources/mapping.json';
const OUT = 'public/data/constants.json';
const CHANGELOG = 'data/changelog.json';

const readJson = <T>(p: string): T | null => (existsSync(p) ? (JSON.parse(readFileSync(p, 'utf8')) as T) : null);

try {
  const today = new Date().toISOString().slice(0, 10);
  const { constants, changelog } = buildConstants(readJson(SOURCE), readJson(MAPPING), readJson<Constants>(OUT), today);
  if (!changelog) {
    console.log(`constants unchanged (v${constants.constantsVersion}, ${constants.contentHash})`);
  } else {
    writeFileSync(OUT, `${JSON.stringify(constants, null, 2)}\n`);
    const log = readJson<ChangelogEntry[]>(CHANGELOG) ?? [];
    log.push(changelog);
    writeFileSync(CHANGELOG, `${JSON.stringify(log, null, 2)}\n`);
    console.log(`wrote ${OUT} v${constants.constantsVersion} (${constants.contentHash}); ${changelog.changes.length} value(s) changed`);
  }
} catch (e) {
  console.error(e instanceof DataValidationError ? e.message : e);
  process.exit(1);
}
