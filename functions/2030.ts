// Cloudflare Pages Function for /2030. Shared links carry the visitor's choices (?mix=...&eff=...), but link
// preview crawlers don't run JavaScript, so without this every shared /2030 would preview the same. Here the
// edge computes that link's result with the page's own model and rewrites only the preview tags. Links
// without choices, and every other request, get the static page untouched.

import { sharedPreview } from '../src/present/share-preview';
import constants from '../public/data/constants.json';
import series from '../public/data/series.json';
import grids from '../public/data/grids.json';
import type { PreviewData } from '../src/present/share-preview';

interface Ctx {
  request: Request;
  next: () => Promise<Response>;
}
interface Rewriter {
  on(selector: string, handler: { element(e: { setAttribute(name: string, value: string): void }): void }): Rewriter;
  transform(r: Response): Response;
}
declare const HTMLRewriter: { new (): Rewriter };

const DATA = { constants, series, grids } as unknown as PreviewData;

export async function onRequestGet({ request, next }: Ctx): Promise<Response> {
  const res = await next();
  const preview = sharedPreview(new URL(request.url).search, DATA);
  if (!preview || !(res.headers.get('content-type') ?? '').includes('text/html')) return res;
  const set = (value: string) => ({ element: (e: { setAttribute(n: string, v: string): void }) => e.setAttribute('content', value) });
  return new HTMLRewriter() // setAttribute escapes the value; sharedPreview only uses known names and numbers anyway
    .on('meta[property="og:title"]', set(preview.title))
    .on('meta[name="twitter:title"]', set(preview.title))
    .on('meta[property="og:description"]', set(preview.description))
    .on('meta[name="twitter:description"]', set(preview.description))
    .on('meta[property="og:url"]', set(request.url))
    .transform(res);
}
