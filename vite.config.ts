/// <reference types="vitest/config" />
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';

/**
 * Static data is prerendered: `npm run build:data` writes the generated HTML from the data files, and
 * this inlines it. No layout shift while it loads, readable with scripts off.
 *   index.html          <!--hero-content-->  <- src/hero.generated.html  (eng review D4)
 *   how-we-know.html    <!--how-content-->   <- src/how/content.generated.html
 *   question.html       <!--question-content--> <- src/question.generated.html
 *   live.html           <!--live-content-->     <- src/live.generated.html
 *   2030.html           <!--sim-content-->      <- src/sim.generated.html (+ .css)
 */
const GENERATED: [page: string, marker: string, file: string][] = [
  ['index.html', '<!--home-content-->', 'src/home.generated.html'],
  ['today.html', '<!--today-content-->', 'src/today.generated.html'],
  ['earth.html', '<!--hero-content-->', 'src/hero.generated.html'],
  ['how-we-know.html', '<!--how-content-->', 'src/how/content.generated.html'],
  ['question.html', '<!--question-content-->', 'src/question.generated.html'],
  ['live.html', '<!--live-content-->', 'src/live.generated.html'],
  ['2030.html', '<!--sim-content-->', 'src/sim.generated.html'],
];

function prerender(): Plugin {
  return {
    name: 'hum:prerender',
    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        html = html.replace('<!--footer-->', readFileSync(resolve(import.meta.dirname, 'src/footer.generated.html'), 'utf8'));
        for (const [page, marker, file] of GENERATED) {
          if (ctx.filename.endsWith(`/${page}`)) return html.replace(marker, readFileSync(resolve(import.meta.dirname, file), 'utf8'));
        }
        return html;
      },
    },
  };
}

/**
 * `vite preview` (what the E2E tests run against) sends the same security headers as production
 * (public/_headers on Cloudflare), so a CSP violation fails a test instead of reaching the live site.
 */
export function productionHeaders(file = resolve(import.meta.dirname, 'public/_headers')): Record<string, string> {
  const lines = readFileSync(file, 'utf8').split('\n');
  const start = lines.findIndex((l) => l.trim() === '/*');
  const out: Record<string, string> = {};
  for (const line of lines.slice(start + 1)) {
    if (!/^\s+\S/.test(line)) break; // the "/*" block ends at the first non-indented line
    const i = line.indexOf(':');
    out[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return out;
}

/** Answer and topic pages written by `npm run build:data` (q/*.html, topics/*.html, topics.html), one rollup input each. */
function generatedPages(): Record<string, string> {
  const out: Record<string, string> = {};
  const topics = resolve(import.meta.dirname, 'topics.html');
  if (existsSync(topics)) out.topics = topics;
  for (const dir of ['q', 'topics']) {
    const abs = resolve(import.meta.dirname, dir);
    if (!existsSync(abs)) continue;
    for (const f of readdirSync(abs)) if (f.endsWith('.html')) out[`${dir}/${f.slice(0, -5)}`] = resolve(abs, f);
  }
  return out;
}

export default defineConfig({
  preview: { headers: productionHeaders() },
  test: { exclude: ['e2e/**', 'node_modules/**', 'dist/**'] },
  plugins: [prerender()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        today: resolve(import.meta.dirname, 'today.html'),
        earth: resolve(import.meta.dirname, 'earth.html'),
        ...generatedPages(),
        how: resolve(import.meta.dirname, 'how-we-know.html'),
        question: resolve(import.meta.dirname, 'question.html'),
        live: resolve(import.meta.dirname, 'live.html'),
        y2030: resolve(import.meta.dirname, '2030.html'),
        daily: resolve(import.meta.dirname, 'daily.html'),
      },
    },
  },
});
