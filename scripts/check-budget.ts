// npm run check:budget  (after `vite build`)
// Eng review 9A: the first screen must stay small and must not contain three.js.
// "First screen" = the scripts index.html loads directly (entry + modulepreloads), not lazy chunks.

import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

const BUDGET_KB = 90;
const html = readFileSync('dist/index.html', 'utf8');
const urls = [...html.matchAll(/<(?:script[^>]*src|link[^>]*rel="modulepreload"[^>]*href)="([^"]+\.js)"/g)].map((m) => m[1]!);
if (urls.length === 0) throw new Error('no scripts found in dist/index.html');

let total = 0;
for (const u of urls) {
  const body = readFileSync(`dist${u}`);
  const gz = gzipSync(body).length;
  total += gz;
  if (body.includes('WebGLRenderer')) {
    console.error(`three.js leaked into the first screen via ${u}`);
    process.exit(1);
  }
  console.log(`${u}  ${(gz / 1024).toFixed(1)} KB gz`);
}
const kb = total / 1024;
console.log(`first-screen JS: ${kb.toFixed(1)} KB gz (budget ${BUDGET_KB} KB)`);
if (kb > BUDGET_KB) process.exit(1);
