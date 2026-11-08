// npx tsx scripts/validate-draft.ts path/to/draft.json [...more]
// Merges draft answers ({ sources, calcs, answers }) into a copy of answers.source.json and runs the same
// validation the build does, so a draft can be checked before it goes into data/sources.
import { readFileSync } from 'node:fs';
import { validateAnswersSource } from '../src/answers/schema';
import type { AnswersSource } from '../src/answers/types';

const src = JSON.parse(readFileSync('data/sources/answers.source.json', 'utf8')) as AnswersSource;
const slugs: string[] = [];
for (const path of process.argv.slice(2)) {
  const d = JSON.parse(readFileSync(path, 'utf8')) as Partial<AnswersSource>;
  for (const k of Object.keys(d.sources ?? {})) if (src.sources[k]) console.error(`${path}: source key "${k}" already exists`);
  for (const k of Object.keys(d.calcs ?? {})) if (src.calcs[k]) console.error(`${path}: calc key "${k}" already exists`);
  Object.assign(src.sources, d.sources ?? {});
  Object.assign(src.calcs, d.calcs ?? {});
  for (const a of d.answers ?? []) { src.answers.push(a); slugs.push(a.slug); }
}
const errs = validateAnswersSource(src);
console.log(errs.length ? `${errs.length} problem(s):\n  - ${errs.join('\n  - ')}` : `ok: ${slugs.join(', ')} pass the build's checks`);
process.exit(errs.length ? 1 : 0);
