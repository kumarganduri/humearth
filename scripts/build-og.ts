// npm run build:og (part of `npm run build`, after vite build): renders the link-preview cards to
// dist/og/<page>.png from the same data the site ships. Fonts are the site's own (woff2 decompressed to TTF
// for the renderer); no system fonts, so the cards look the same on every machine.

import { mkdirSync, readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
// @ts-expect-error: wawoff2 ships no types
import { decompress } from 'wawoff2';
import { cardSvg, OG_PAGES, OG_W, personalCardSvg, type OgData } from '../src/present/og';
import { resultRange } from '../src/present/share-preview';
// @ts-expect-error: upng-js ships no types
import UPNG from 'upng-js';

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

// Personal /2030 cards: one per whole million tonnes the page can produce (functions/2030.ts picks one).
const { min, max } = resultRange(d.series, d.constants, d.grids);
mkdirSync('dist/og/2030', { recursive: true });
let bytes = 0;
for (let mt = min; mt <= max; mt++) {
  const img = new Resvg(personalCardSvg(mt, d), { fitTo: { mode: 'width', value: OG_W }, font: { fontFiles, loadSystemFonts: false, defaultFontFamily: 'Atkinson Hyperlegible Next' } }).render();
  // 256-colour palette: these cards use a handful of flat colours, so this is ~23 KB instead of ~54 KB, same look.
  const png = Buffer.from(UPNG.encode([new Uint8Array(img.pixels).buffer], img.width, img.height, 256));
  writeFileSync(`dist/og/2030/${mt}.png`, png);
  bytes += png.length;
}
console.log(`wrote dist/og/2030/${min}..${max}.png (${max - min + 1} cards, ${(bytes / 1048576).toFixed(1)} MB, ~${Math.round(bytes / (max - min + 1) / 1024)} KB each)`);
