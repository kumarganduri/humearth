// npm run build:og (part of `npm run build`, after vite build): renders the link-preview cards to
// dist/og/<page>.png from the same data the site ships. Fonts are the site's own (woff2 decompressed to TTF
// for the renderer); no system fonts, so the cards look the same on every machine.

import { mkdirSync, readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
// @ts-expect-error: wawoff2 ships no types
import { decompress } from 'wawoff2';
import { cardSvg, OG_PAGES, OG_W, type OgData } from '../src/present/og';

const read = <T>(p: string) => JSON.parse(readFileSync(p, 'utf8')) as T;
const FONTS = ['instrument-serif-latin-400-normal', 'atkinson-hyperlegible-next-latin-400-normal', 'atkinson-hyperlegible-next-latin-700-normal', 'atkinson-hyperlegible-mono-latin-600-normal'];

const dir = mkdtempSync(join(tmpdir(), 'hum-og-'));
const fontFiles: string[] = [];
for (const f of FONTS) {
  const ttf = Buffer.from(await decompress(readFileSync(`public/fonts/${f}.woff2`)));
  const out = join(dir, `${f}.ttf`);
  writeFileSync(out, ttf);
  fontFiles.push(out);
}

const d: OgData = {
  series: read('public/data/series.json'),
  countries: read('public/data/countries.json'),
  constants: read('public/data/constants.json'),
  world: read('public/data/world.json'),
  hubs: read('public/data/hubs.json'),
  grids: read('public/data/grids.json'),
  impacts: read('public/data/impacts.json'),
};

mkdirSync('dist/og', { recursive: true });
for (const page of OG_PAGES) {
  const png = new Resvg(cardSvg(page, d), { fitTo: { mode: 'width', value: OG_W }, font: { fontFiles, loadSystemFonts: false, defaultFontFamily: 'Atkinson Hyperlegible Next' } }).render().asPng();
  writeFileSync(`dist/og/${page}.png`, png);
  console.log(`wrote dist/og/${page}.png (${Math.round(png.length / 1024)} KB)`);
}
