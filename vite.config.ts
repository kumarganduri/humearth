/// <reference types="vitest/config" />
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';

/**
 * How We Know is static data, so it's prerendered: `npm run build:data` writes
 * src/how/content.generated.html from the data files, and this inlines it. No JavaScript,
 * no layout shift while it loads, readable with scripts off.
 */
function prerenderHowWeKnow(): Plugin {
  return {
    name: 'hum:prerender-how-we-know',
    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        if (!ctx.filename.endsWith('how-we-know.html')) return html;
        const body = readFileSync(resolve(import.meta.dirname, 'src/how/content.generated.html'), 'utf8');
        return html.replace('<!--how-content-->', body);
      },
    },
  };
}

export default defineConfig({
  test: { exclude: ['e2e/**', 'node_modules/**', 'dist/**'] },
  plugins: [prerenderHowWeKnow()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        how: resolve(import.meta.dirname, 'how-we-know.html'),
      },
    },
  },
});
