/// <reference types="vitest/config" />
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';

/**
 * Static data is prerendered: `npm run build:data` writes the generated HTML from the data files, and
 * this inlines it. No layout shift while it loads, readable with scripts off.
 *   index.html          <!--hero-content-->  <- src/hero.generated.html  (eng review D4)
 *   how-we-know.html    <!--how-content-->   <- src/how/content.generated.html
 */
const GENERATED: [page: string, marker: string, file: string][] = [
  ['index.html', '<!--hero-content-->', 'src/hero.generated.html'],
  ['how-we-know.html', '<!--how-content-->', 'src/how/content.generated.html'],
];

function prerender(): Plugin {
  return {
    name: 'hum:prerender',
    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        for (const [page, marker, file] of GENERATED) {
          if (ctx.filename.endsWith(page)) return html.replace(marker, readFileSync(resolve(import.meta.dirname, file), 'utf8'));
        }
        return html;
      },
    },
  };
}

export default defineConfig({
  test: { exclude: ['e2e/**', 'node_modules/**', 'dist/**'] },
  plugins: [prerender()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        how: resolve(import.meta.dirname, 'how-we-know.html'),
      },
    },
  },
});
