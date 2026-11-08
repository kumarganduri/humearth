// npm run check:countries [-- path/to/file.csv]
// Downloads the dataset named in data/sources/countries.source.json (or reads a local copy), then checks
// every stored country value. Exits 1 when one of Hum's numbers no longer matches; a re-published file whose
// rows still match only prints a note. Runs in CI.

import { readFileSync } from 'node:fs';
import { checkCountries, fileNote } from './lib/countries-check';
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
  const bytes = await bytesOf();
  const problems = checkCountries(bytes, src);
  const note = fileNote(bytes, src);
  if (note) console.log(`note: ${note}`);
  if (problems.length) {
    console.error(`Country data check failed:\n  - ${problems.join('\n  - ')}`);
    process.exit(1);
  }
  console.log(`countries ok: ${src.countries.length} rows match ${src.dataset.name} (${src.year})`);
} catch (e) {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
}
