// npm run derive:k
// Finds the health-scale multiplier k that satisfies the "no guilt" guardrails, prints the evidence,
// and writes data/sources/mapping.json. Exits 1 if no k works at the mid figures.

import { readFileSync, writeFileSync } from 'node:fs';
import { validateSource } from '../src/footprint/schema';
import { checkGuardrails, feasibleK, strictKRange, STRICT_LEVELS, TEXT_HEAVY_MIN_HEALTH, VIDEO_HEAVY_MAX_HEALTH } from '../src/footprint/guardrails';
import { perPersonBaseline } from '../src/footprint/engine';
import { LEVELS, type Constants, type Mapping } from '../src/footprint/types';

const SOURCE = 'data/sources/constants.source.json';
const MAPPING = 'data/sources/mapping.json';
const FLOOR = 0.15;

const src = JSON.parse(readFileSync(SOURCE, 'utf8'));
const problems = validateSource(src);
if (problems.length) {
  console.error(`fix ${SOURCE} first:\n  - ${problems.join('\n  - ')}`);
  process.exit(1);
}
// feasibleK does not depend on k, so a placeholder mapping is fine here.
const c = { ...src, constantsVersion: 0, contentHash: '', builtAt: '', mapping: { k: 1, floor: FLOOR, derivedOn: '', note: '' } } as Constants;

const base = perPersonBaseline(c).energy;
const ks = Object.fromEntries(LEVELS.map((l) => [l, feasibleK(c, l)])) as Record<(typeof LEVELS)[number], ReturnType<typeof feasibleK>>;
const fmt = (n: number) => (n >= 100 ? n.toFixed(0) : n.toFixed(2));

console.log(`baseline: all data-centre electricity per person = ${fmt(base)} Wh/week`);
console.log(`guardrails: text-heavy health >= ${TEXT_HEAVY_MIN_HEALTH}, video-heavy health < ${VIDEO_HEAVY_MAX_HEALTH}\n`);
console.log('level  text-heavy Wh/wk  video-heavy Wh/wk  feasible k');
for (const l of LEVELS) {
  const r = ks[l];
  const range = r.lo < r.hi ? `[${fmt(r.lo)}, ${fmt(r.hi)})` : 'NONE';
  console.log(`${l.padEnd(6)} ${fmt(r.textWh).padStart(16)} ${fmt(r.videoWh).padStart(18)}  ${range}`);
}
const strict = strictKRange(c);
console.log(`\nk range where guardrails hold at ${STRICT_LEVELS.join(' + ')}: ${strict.lo < strict.hi ? `[${fmt(strict.lo)}, ${fmt(strict.hi)})` : 'NONE'}`);
if (!(strict.lo < strict.hi)) {
  console.error('\nNo k satisfies the guardrails at the strict levels. The mapping needs a design decision.');
  process.exit(1);
}
// Geometric middle of the range: as far as possible from both guardrails on a ratio scale.
const k = Number(Math.sqrt(strict.lo * strict.hi).toFixed(2));
const mapping: Mapping = {
  k,
  floor: FLOOR,
  derivedOn: new Date().toISOString().slice(0, 10),
  note: `Health is a designed scale: your weekly AI use compared with k x (all data-centre electricity per person). k sits in the middle of the range where the guardrails hold at the ${STRICT_LEVELS.join(' and ')} figures [${fmt(strict.lo)}, ${fmt(strict.hi)}). At the low figures only the order is kept: a video-heavy week is never healthier than a text-heavy one.`,
};
const check = checkGuardrails({ ...c, mapping });
for (const l of check.levels) console.log(`check ${l.level}: text-heavy ${l.textHeavyHealth.toFixed(2)}, video-heavy ${l.videoHeavyHealth.toFixed(2)} -> ${l.ok ? 'ok' : 'FAIL'}`);
if (!check.ok) {
  console.error('\nGuardrail check failed with the chosen k.');
  process.exit(1);
}
writeFileSync(MAPPING, `${JSON.stringify(mapping, null, 2)}\n`);
console.log(`\nk = ${k} written to ${MAPPING}`);
