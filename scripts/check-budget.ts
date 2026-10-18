// npm run check:budget  (after `vite build`)
// Eng review 9A: the first screen must stay small and must not contain three.js, on every kind of page.
// "First screen" = the scripts index.html loads directly (entry + modulepreloads), not lazy chunks.

import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

const BUDGET_KB = 90;
// The front door, the Earth, Today, one answer page and one topic page (answer pages all share one script).
const PAGES = ['index.html', 'earth.html', 'today.html', 'q/flight.html', 'topics.html'];

let failed = false;
for (const page of PAGES) {
  const html = readFileSync(`dist/${page}`, 'utf8');
  const urls = [...html.matchAll(/<(?:script[^>]*src|link[^>]*rel="modulepreload"[^>]*href)="([^"]+\.js)"/g)].map((m) => m[1]!);
  if (urls.length === 0) throw new Error(`no scripts found in dist/${page}`);
  let total = 0;
  for (const u of urls) {
    const body = readFileSync(`dist${u}`);
    total += gzipSync(body).length;
    if (body.includes('WebGLRenderer')) { console.error(`three.js leaked into ${page} via ${u}`); failed = true; }
  }
  const kb = total / 1024;
  console.log(`${page}: first-screen JS ${kb.toFixed(1)} KB gz (budget ${BUDGET_KB} KB)`);
  if (kb > BUDGET_KB) failed = true;
}
if (failed) process.exit(1);
