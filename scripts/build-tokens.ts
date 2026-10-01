// npm run build:tokens        write src/tokens.ts + src/tokens.css from DESIGN.md
// npm run build:tokens -- --check   fail if the generated files are stale (CI)

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { parseDesignMd, renderTokensCss, renderTokensTs } from './lib/tokens';

const t = parseDesignMd(readFileSync('DESIGN.md', 'utf8'));
const outputs: [string, string][] = [
  ['src/tokens.ts', renderTokensTs(t)],
  ['src/tokens.css', renderTokensCss(t)],
];

if (process.argv.includes('--check')) {
  const stale = outputs.filter(([p, body]) => !existsSync(p) || readFileSync(p, 'utf8') !== body).map(([p]) => p);
  if (stale.length) {
    console.error(`stale generated tokens: ${stale.join(', ')}. Run \`npm run build:tokens\`.`);
    process.exit(1);
  }
  console.log('tokens up to date');
} else {
  for (const [p, body] of outputs) writeFileSync(p, body);
  console.log(`wrote ${outputs.map(([p]) => p).join(', ')} (${Object.keys(t.colors).length} colours)`);
}
