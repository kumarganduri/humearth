// npm run check:countries [-- path/to/file.csv]
// Downloads the dataset named in data/sources/countries.source.json (or reads a local copy), then checks
// its sha256 and every stored country value. Exits 1 on any mismatch. Runs in CI.

import { readFileSync } from 'node:fs';
import { checkCountries } from './lib/countries-check';
import type { CountriesSource } from '../src/footprint/series-types';

const src = JSON.parse(readFileSync('data/sources/countries.source.json', 'utf8')) as CountriesSource;
const local = process.argv[2];

async function bytesOf(): Promise<Uint8Array> {
  if (local) return new Uint8Array(readFileSync(local));
  const res = await fetch(src.dataset.url);
  if (!res.ok) throw new Error(`download failed: HTTP ${res.status} for ${src.dataset.url}`);
  return new Uint8Array(await res.arrayBuffer());
}

try {
  const problems = checkCountries(await bytesOf(), src);
  if (problems.length) {
    console.error(`Country data check failed:\n  - ${problems.join('\n  - ')}`);
    process.exit(1);
  }
  console.log(`countries ok: ${src.countries.length} rows match ${src.dataset.name} (${src.year}), sha256 ${src.dataset.sha256.slice(0, 12)}…`);
} catch (e) {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
}
