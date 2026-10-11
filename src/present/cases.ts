// Stage 1b: named, real cases (the EXPLAINED tiles) and the greenwashing practices, from
// data/sources/impacts.source.json. Hum's summary first, then the sources as links, then the exact quotes
// behind a "Read the quotes" fold (closed: the summary is the story, the quotes are the proof).

import type { ImpactCase, ImpactsFile, Source } from '../footprint/types';
import { esc } from './format';

/** "Publisher, date: \"quote\"" -> { who, quote } */
export function splitSource(s: Source): { who: string; quote: string } {
  const i = s.label.indexOf(': "');
  return { who: s.label.slice(0, i), quote: s.label.slice(i + 3, -1) };
}

function sourcesHtml(c: ImpactCase): string {
  const parts = c.sources.map(splitSource);
  const links = c.sources.map((s, i) => `<a href="${esc(s.url)}" rel="noopener noreferrer">${esc(parts[i]!.who)}</a>`).join(' · ');
  const quotes = c.sources.map((s, i) => `<li><blockquote>${esc(parts[i]!.quote)}</blockquote><cite>${esc(parts[i]!.who)}</cite></li>`).join('');
  return `<p class="case-src">Source${c.sources.length > 1 ? 's' : ''}: ${links}</p>
<details class="quotes"><summary>Read the quote${c.sources.length > 1 ? 's' : ''}</summary><ul>${quotes}</ul></details>`;
}

/** One EXPLAINED tile, in the same ruled-row layout as the MEASURED ones. */
export function explainedTileHtml(c: ImpactCase): string {
  return `<div class="imp" id="case-${esc(c.key)}"><span class="badge e">EXPLAINED</span><div><h3>${esc(c.title)}</h3><p class="place">${esc(c.place ?? '')}</p><p>${esc(c.summary)}</p>${sourcesHtml(c)}</div></div>`;
}

export function explainedTilesHtml(d: ImpactsFile): string {
  return d.tiles.map(explainedTileHtml).join('\n');
}

/** "Claims to read twice": practices, never accusations of a company. */
export function practicesHtml(d: ImpactsFile): string {
  const items = d.practices.map((p) => `<li class="claim" id="claim-${esc(p.key)}"><h4>${esc(p.title)}</h4><p>${esc(p.summary)}</p>${sourcesHtml(p)}</li>`).join('');
  return `<h3 id="claims">Claims to read twice</h3>
  <p>When a company says its AI is green, these are the common ways the wording can say more than the electricity does. They're practices, not accusations: each one is explained by researchers, regulators or reporters.</p>
  <ul class="claims">${items}</ul>`;
}
