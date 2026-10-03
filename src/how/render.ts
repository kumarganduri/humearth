// How We Know (decision 12A): the grown-up page. Pure functions from the same data files the site
// uses to escaped HTML, so the page can never disagree with the numbers kids see.
//
//   constants.json ─┬─> "How your world's health is drawn" (k, baseline, guardrails)  OV #1
//                   └─> "The numbers" (low / mid / high, unit, sources)
//   hubs.json ──────────> "AI buildings on the globe" (MW range, what it measures, sources)
//   changelog.json ─────> "We changed our numbers"

import { perPersonBaseline } from '../footprint/engine';
import { TEXT_HEAVY_MIN_HEALTH, VIDEO_HEAVY_MAX_HEALTH, STRICT_LEVELS } from '../footprint/guardrails';
import { VALUE_KEYS, type Constants, type Hub, type RangeValue, type Source } from '../footprint/types';

export interface ChangelogEntry {
  date: string;
  constantsVersion: number;
  changes: { key: string; from: [number, number, number] | null; to: [number, number, number] }[];
  mappingChanged: boolean;
}

const ESC: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ESC[c]!);

/** Readable numbers: 0.24, 1.22, 944, 8.16 billion. */
export function num(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(2).replace(/\.?0+$/, '')} billion`;
  if (n >= 1000) return Math.round(n).toLocaleString('en-US');
  if (n >= 10) return n.toFixed(0);
  return n.toFixed(2).replace(/\.?0+$/, '') || '0';
}

function sourceList(sources: Source[]): string {
  return `<ul class="sources">${sources
    .map((s) => {
      const recheck = s.checked === 'search-summary' ? ' <span class="badge" title="We have not yet read this page itself, only a search summary of it.">needs re-checking</span>' : '';
      const note = s.note ? ` <span class="muted">(${esc(s.note)})</span>` : '';
      return `<li><a href="${esc(s.url)}" rel="noopener noreferrer">${esc(s.label)}</a> <span class="muted">· ${esc(s.supports)} · ${esc(s.retrieved)}</span>${recheck}${note}</li>`;
    })
    .join('')}</ul>`;
}

export function renderMapping(c: Constants): string {
  const base = perPersonBaseline(c);
  return `
<h2 id="health">How your world's health is drawn</h2>
<p>Your world's health is <strong>a scale we designed</strong>, not something we measured. We compare your weekly AI use with <strong>${num(c.mapping.k)}</strong> times the average person's share of <em>all</em> data-centre electricity, which is about <strong>${num(base.energy)} Wh a week</strong> (${num(c.values.dataCentreTWhPerYear.mid)} TWh a year shared by ${num(c.values.worldPopulation.mid)} people). A world never drops below ${num(c.mapping.floor * 100)}% health: it rests, it doesn't die.</p>
<p>We picked that multiplier so two promises hold whether we use our middle estimates or our high ones (${STRICT_LEVELS.join(' and ')}). When we test "what if the high numbers are true?", we apply them to everyone, including the average person's share, so we compare like with like:</p>
<ul>
  <li>someone asking an AI 50+ times a day, with no pictures or videos, stays healthy (${num(TEXT_HEAVY_MIN_HEALTH * 100)}% or more);</li>
  <li>someone making a lot of AI videos looks clearly stressed (under ${num(VIDEO_HEAVY_MAX_HEALTH * 100)}%).</li>
</ul>
<p>With our lowest estimates both promises can't hold at once (the lowest published video figure comes from an older, tiny model), so there we only keep the order: a video-heavy week is never shown healthier than a text-heavy one. The script that checks this runs on every build, and the build fails if a promise breaks.</p>
<p class="muted">${esc(c.mapping.note)} Derived ${esc(c.mapping.derivedOn)}.</p>`;
}

function valueRow(v: RangeValue): string {
  return `<tr><th scope="row">${esc(v.label)}</th><td class="num">${num(v.low)}</td><td class="num">${num(v.mid)}</td><td class="num">${num(v.high)}</td><td>${unitCell(v.unit)}</td></tr>
<tr class="src"><td colspan="5">${sourceList(v.sources)}</td></tr>`;
}

export function renderValues(c: Constants): string {
  return `
<h2 id="numbers">The numbers</h2>
<p>Nobody outside the AI companies can measure a single question exactly. So we start from what companies have published, add independent research, and always keep a low, middle and high estimate. Your world is drawn from the middle; the panels in your world show the whole range.</p>
<div class="table-wrap"><table>
<thead><tr><th scope="col">What</th><th scope="col">Low</th><th scope="col">Middle</th><th scope="col">High</th><th scope="col">Unit</th></tr></thead>
<tbody>${VALUE_KEYS.map((k) => valueRow(c.values[k])).join('')}</tbody>
</table></div>
<p><strong>The ticker on Earth</strong> ("since you opened this page…") multiplies all the world's data-centre electricity by AI's share of it. Nobody publishes a world figure for that share in words (the IEA shows one only in a chart), so we use the United States' 2024 share, ${num(c.values.aiShareOfDataCentres.low * 100)}–${num(c.values.aiShareOfDataCentres.high * 100)}%, as our estimate for the world. The real world share is probably lower, so treat the ticker as an upper-end picture.</p>
<p>The quiz turns answers into amounts: ${c.quiz.textPromptsPerDay.map(num).join(' / ')} questions a day, ${c.quiz.imagesPerWeek.map(num).join(' / ')} pictures a week and ${c.quiz.videosPerWeek.map(num).join(' / ')} short videos a week. "A lighter AI" uses the lowest published figure for questions and pictures.</p>
<p class="muted">Constants version ${c.constantsVersion} · ${esc(c.contentHash)} · built ${esc(c.builtAt)}</p>`;
}

export function renderHubs(hubs: Hub[]): string {
  const rows = [...hubs]
    .sort((a, b) => b.mw.mid - a.mw.mid)
    .map((h) => {
      const mw = h.mw.low === h.mw.high ? num(h.mw.mid) : `${num(h.mw.low)}–${num(h.mw.high)}`;
      return `<tr><th scope="row">${esc(h.name)}<span class="muted">, ${esc(h.country)}</span></th><td class="num">${mw}</td><td>${esc(h.measure)}</td></tr>
<tr class="src"><td colspan="3">${sourceList(h.sources)}</td></tr>`;
    })
    .join('');
  return `
<h2 id="buildings">AI buildings on the globe</h2>
<p>Each glowing block on the globe is a region with many data centres ("AI buildings"). Its size follows the region's power capacity on a gentle scale, so the biggest region doesn't swallow the map. Published figures measure different things, and we say which for each one.</p>
<div class="table-wrap"><table>
<thead><tr><th scope="col">Region</th><th scope="col">Megawatts</th><th scope="col">What the figure counts</th></tr></thead>
<tbody>${rows}</tbody>
</table></div>`;
}

export function renderChangelog(entries: ChangelogEntry[], c: Constants): string {
  const LABELS: Record<string, string> = Object.fromEntries(VALUE_KEYS.map((k) => [k, c.values[k].label]));
  const triple = (t: [number, number, number]) => t.map(num).join(' / ');
  const items = [...entries]
    .reverse()
    .map((e) => {
      const what =
        e.changes.length === 0
          ? '<li>Sources updated; no numbers changed.</li>'
          : e.changes
              .map((ch) =>
                ch.from
                  ? `<li>${esc(LABELS[ch.key] ?? ch.key)}: ${triple(ch.from)} → <strong>${triple(ch.to)}</strong></li>`
                  : `<li>${esc(LABELS[ch.key] ?? ch.key)}: <strong>${triple(ch.to)}</strong> (first version)</li>`,
              )
              .join('');
      const map = e.mappingChanged ? '<li>The health scale was re-derived.</li>' : '';
      return `<li><h3>${esc(e.date)} · version ${e.constantsVersion}</h3><ul>${what}${map}</ul></li>`;
    })
    .join('');
  return `
<h2 id="changes">We changed our numbers</h2>
<p>When better information comes out, we update. Every change is listed here, newest first. Numbers are low / middle / high.</p>
<ol class="changelog">${items}</ol>`;
}

export function renderPrivacy(): string {
  return `
<h2 id="privacy">Your privacy</h2>
<ul>
  <li>No accounts, no cookies, no tracking scripts, and nothing loaded from other companies' servers.</li>
  <li>Your world is saved only on your device. We never see your answers.</li>
  <li>A share link holds only your world's pattern number, your three quiz answers and your greener choices. No names.</li>
  <li>Share links include <code>?s=1</code> so our host can count how many shared worlds get opened, from ordinary page requests, without any script.</li>
</ul>`;
}

export function renderPage(c: Constants, hubs: Hub[], changelog: ChangelogEntry[]): string {
  return [renderMapping(c), renderValues(c), renderHubs(hubs), renderChangelog(changelog, c), renderPrivacy()].join('\n');
}

/** Long units like gCO2/kWh may wrap after the slash on small phones, never inside a word. */
const unitCell = (unit: string) => esc(unit).replaceAll('/', '/<wbr>');
