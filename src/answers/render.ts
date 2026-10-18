// Hum v4 answers as HTML: pure string functions used at build time (answer pages, topics, the front door's
// first card, readable with scripts off) and in the browser (the card deck). No inline styles anywhere: the
// CSP is style-src 'self', so positions live in SVG attributes.
//
//   answerPage(a)        /q/{slug}: question, verdict, answer, the bigger picture, figure, folds, share, next
//   cardHtml(a)          the playable card (guess buttons, or a "See the answer" link with scripts off)
//   revealHtml(a, right) what shows after a guess
//   ladderHtml(rungs)    "How big is that?": every rung on one log axis, the jump in words
//   figureHtml(a)        published figures as points (not comparable) or one study's range against the claim

import { esc } from '../present/format';
import type { Answer, AnswerSource, AnswersSource, Calc, Category, Points, Range, Rung, Stamp } from './types';

export { esc };
export const SITE = 'https://humearth.org';
export const answerUrl = (slug: string) => `/q/${slug}`;
export const topicSlug = (c: Category | string) => c.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export const ICON: Record<Stamp, string> = { YES: '✓', NO: '✕', PARTLY: '◐', 'NOBODY KNOWS': '?' };
export const CLAIM_CHOICES: [Stamp, string][] = [['YES', 'True'], ['PARTLY', 'Partly true'], ['NO', 'False'], ['NOBODY KNOWS', 'Nobody knows']];
const PROV: Record<string, string> = { measured: 'Measured', estimate: 'Estimated', company_claim: 'Company says so', forecast: 'Forecast', dataset: 'Data row' };
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "18 Oct 2026" from "2026-10-18", the same everywhere (no locale or time zone involved). */
export function dateWords(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS[m! - 1]} ${y}`;
}

/** Energy in the unit that keeps it short, without thousands separators ("28 kWh", not "28,000 Wh"). */
export function energy(wh: number): string {
  const f = (v: number) => String(v >= 10 ? Math.round(v) : Math.round(v * 100) / 100);
  if (wh >= 1e12) return `${f(wh / 1e12)} TWh`;
  if (wh >= 1e9) return `${f(wh / 1e9)} GWh`;
  if (wh >= 1e6) return `${f(wh / 1e6)} MWh`;
  if (wh >= 1e3) return `${f(wh / 1e3)} kWh`;
  return `${f(wh)} Wh`;
}

/** How much bigger a rung is than the one above it, in words. */
export function timesWords(r: number): string {
  if (r < 1.5) return 'about the same as the line above';
  if (r < 10) return `about ${Math.round(r * 10) / 10}× the line above`;
  if (r < 1000) return `about ${Math.round(r)}× the line above`;
  for (const [n, w] of [[1e9, 'billion'], [1e6, 'million'], [1e3, 'thousand']] as const) {
    if (r >= n) return `about ${Math.round((r / n) * 10) / 10} ${w} times the line above`;
  }
  return '';
}

export function stampHtml(s: Stamp, tag: 'a' | 'span' = 'a'): string {
  const inner = `<span aria-hidden="true">${ICON[s]}</span> ${s} <span class="who">Hum’s verdict</span>`;
  return tag === 'a' ? `<a class="stamp" href="/how-we-know.html#verdicts">${inner}</a>` : `<span class="stamp">${inner}</span>`;
}

/* ---------- figures: linear axes from 0; marks in SVG, every label in HTML ---------- */

function pointsHtml(p: Points, companies: Set<string>): string {
  const max = Math.max(...p.items.map((i) => i.value)) * 1.1;
  const x = (v: number) => (6 + (v / max) * 348).toFixed(1);
  const unit = p.unit.split(' ')[0]!;
  const marks = p.items
    .map((i) => i.claim
      ? `<rect class="m-claim" x="${(Number(x(i.value)) - 6).toFixed(1)}" y="8" width="12" height="24" rx="2"/>`
      : `<circle class="${companies.has(i.source) ? 'm-co' : 'm-in'}" cx="${x(i.value)}" cy="20" r="7"/>`)
    .join('');
  const rows = p.items
    .map((i) => `<li><span class="sw ${i.claim ? 'cl' : companies.has(i.source) ? 'co' : 'in'}" aria-hidden="true"></span><span><b class="num">${i.value} ${esc(unit)}</b> ${esc(i.label)}: ${esc(i.how)}${companies.has(i.source) ? ' (company figure)' : ''}</span></li>`)
    .join('');
  return `<figure class="fig"><figcaption class="fig-t">${esc(p.title)}</figcaption>
<svg viewBox="0 0 360 40" aria-hidden="true" focusable="false"><line class="m-axis" x1="6" y1="20" x2="354" y2="20"/>${marks}</svg>
<div class="fig-axis num" aria-hidden="true"><span>0</span><span>${Math.round(max * 10) / 10} ${esc(unit)}</span></div>
<ul>${rows}</ul>
<p class="fig-note">Hollow dots are the companies’ own figures. Unit: ${esc(p.unit)}.</p></figure>`;
}

function rangeHtml(r: Range): string {
  const max = r.claim * 1.05;
  const x = (v: number) => 6 + (v / max) * 348;
  return `<figure class="fig"><figcaption class="fig-t">${esc(r.unit)} per answer</figcaption>
<svg viewBox="0 0 360 40" aria-hidden="true" focusable="false"><line class="m-axis" x1="6" y1="20" x2="354" y2="20"/>
<rect class="m-band" x="${x(r.low).toFixed(1)}" y="10" width="${Math.max(4, x(r.high) - x(r.low)).toFixed(1)}" height="20" rx="2"/>
<rect class="m-claim" x="${(x(r.claim) - 6).toFixed(1)}" y="8" width="12" height="24" rx="2"/></svg>
<div class="fig-axis num" aria-hidden="true"><span>0 ${esc(r.unit)}</span><span>${Math.round(max)} ${esc(r.unit)}</span></div>
<ul><li><span class="sw rg" aria-hidden="true"></span><span><b class="num">${r.low} to ${r.high} ${esc(r.unit)}</b> ${esc(r.what)}</span></li>
<li><span class="sw cl" aria-hidden="true"></span><span><b class="num">${r.claim} ${esc(r.unit)}</b> ${esc(r.claimWhat)}</span></li></ul></figure>`;
}

/** Sources whose figures are the companies' own (drawn hollow). */
export const companySources = (sources: Record<string, Pick<AnswerSource, 'kind'>>) =>
  new Set(Object.entries(sources).filter(([, s]) => s.kind === 'company_claim').map(([k]) => k));

export function figureHtml(a: Pick<Answer, 'points' | 'range'>, companies: Set<string>): string {
  if (a.points) return pointsHtml(a.points, companies);
  if (a.range) return rangeHtml(a.range);
  return '';
}

/* ---------- the ladder ---------- */

export function ladderHtml(rungs: Rung[], me: string | undefined): string {
  const lo = -1, hi = 15; // 0.1 Wh .. 1 PWh on a log axis
  const pos = (wh: number) => (((Math.log10(wh) - lo) / (hi - lo)) * 96 + 2).toFixed(1);
  const items = rungs
    .map((r, i) => `<li${r.key === me ? ' class="me"' : ''}><div class="l-row"><b>${esc(r.label)}</b><span class="num">${energy(r.wh)}</span></div>
<svg class="l-track" viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true" focusable="false"><line x1="0" y1="9" x2="100" y2="9"/><circle cx="${pos(r.wh)}" cy="5" r="3.5"/></svg>
<span class="l-x">${esc(r.note)}</span>${i ? `<span class="l-x">${timesWords(r.wh / rungs[i - 1]!.wh)}</span>` : ''}</li>`)
    .join('');
  return `<ol class="ladder">${items}</ol><div class="l-ticks num" aria-hidden="true"><span>0.1 Wh</span><span>1 MWh</span><span>1 TWh</span></div>
<p class="fig-note">The dots sit on a log scale: each step to the right is ten times bigger. It’s the only way a phone charge and all the world’s data centres fit on one line.</p>`;
}

/* ---------- sources, sums, citation ---------- */

export function sourcesHtml(keys: string[], sources: Record<string, AnswerSource>): string {
  return `<ul class="sources">${keys
    .map((k) => {
      const s = sources[k]!;
      const body = s.kind === 'dataset'
        ? `<p class="data">${esc(s.quote)}</p><span class="checked">Row checked against the published file, ${dateWords(s.retrieved)}</span>`
        : `<blockquote>“${esc(s.quote)}”</blockquote><span class="checked">Quote checked on the page, ${dateWords(s.retrieved)}</span>`;
      return `<li><a href="${esc(s.url)}" rel="noopener noreferrer">${esc(s.publisher)}</a> <span class="prov">${PROV[s.kind]}</span>${body}</li>`;
    })
    .join('')}</ul>`;
}

export function calcsHtml(keys: string[], calcs: Record<string, Calc>): string {
  if (!keys.length) return '';
  return `<h3>Hum’s sums</h3><ul class="sums">${keys.map((k) => `<li class="num">${esc(calcs[k]!.text)}</li>`).join('')}</ul>`;
}

export function citeText(a: Answer, sources: Record<string, AnswerSource>): string {
  const first = sources[a.cites[0]!]!;
  return `${first.publisher}, as quoted in Hum, “${a.q}”, ${SITE}${answerUrl(a.slug)} (quote checked ${dateWords(first.retrieved)}).`;
}

/* ---------- share ---------- */

export const shareHtml = (text: string, url: string) =>
  `<div class="share js-only" data-share-text="${esc(text)}" data-share-url="${esc(url)}"><button type="button" class="btn">Share</button><span class="share-done" aria-live="polite"></span></div>
<noscript><p class="share-plain">${esc(text)} ${esc(url)}</p></noscript>`;

/* ---------- the playable card ---------- */

export const UNITS_HTML = `<details class="units"><summary>What do Wh, kWh and TWh mean?</summary><div><p><abbr title="watt-hour">Wh</abbr> is a watt-hour: a 1-watt light left on for an hour. 1 kWh = 1,000 Wh, and 1 TWh = 1 billion kWh. Hum compares each number with something everyday so you don’t need the units.</p></div></details>`;

type CardAnswer = Pick<Answer, 'slug' | 'type' | 'heard' | 'heardFrom' | 'guess' | 'stamp'>;

/** The card before a guess. With scripts off the buttons are hidden (.js-only) and "See the answer" is the way in. */
export function cardHtml(a: CardAnswer, progress?: { at: number; of: number }): string {
  const head = a.type === 'claim'
    ? `<p class="kicker">You’ve probably heard (${esc(a.heardFrom!)}):</p><h2 class="claim" id="card-h" tabindex="-1">${esc(a.heard!)}</h2><p class="hint">True, false, or somewhere in between?</p>
<div class="choices js-only" role="group" aria-label="Your guess">${CLAIM_CHOICES.map(([k, l]) => `<button type="button" data-k="${k}">${l}</button>`).join('')}</div>`
    : `<p class="kicker">Guess first</p><h2 class="claim" id="card-h" tabindex="-1">${esc(a.guess!.prompt)}</h2>
<div class="choices js-only" role="group" aria-label="Your guess">${a.guess!.options.map((o, i) => `<button type="button" data-i="${i}">${esc(o)}</button>`).join('')}</div>`;
  const prog = progress ? `<div class="progress" role="img" aria-label="Card ${progress.at + 1} of ${progress.of}">${Array.from({ length: progress.of }, (_, i) => `<span class="${i < progress.at ? 'on' : i === progress.at ? 'now' : ''}"></span>`).join('')}</div>` : '';
  return `${head}<a class="tellme" href="${answerUrl(a.slug)}"><span class="js-only">Just tell me</span><noscript>See the answer</noscript></a><div class="reveal" id="reveal" hidden></div>${prog}`;
}

export const isRightChoice = (a: CardAnswer, choice: { k?: string; i?: number }) =>
  a.type === 'claim' ? choice.k === a.stamp : choice.i === a.guess!.right;

type RevealAnswer = Pick<Answer, 'slug' | 'type' | 'stamp' | 'result' | 'reveal' | 'world' | 'you' | 'share' | 'points' | 'range'>;

export function revealHtml(a: RevealAnswer, right: boolean, companies: Set<string>, next?: { label: string }): string {
  return `${a.type === 'claim' && a.stamp ? stampHtml(a.stamp) : ''}<h3 id="rv-h" tabindex="-1">${right ? 'You got it.' : 'Not quite.'} ${esc(a.result)}.</h3>
<p>${esc(a.reveal)}</p>${figureHtml(a, companies)}
<p class="world"><span class="k">The bigger picture</span>${esc(a.world)}</p>
${a.you ? `<p class="foryou">What this means for you: your own use barely registers. What adds up is billions of questions, heavier uses like <a href="${answerUrl('reasoning')}">thinking modes</a> and video, and the data centres being built for them.</p>` : ''}
<div class="cardnav"><a class="btn" href="${answerUrl(a.slug)}">Read the full answer</a>${next ? `<button type="button" class="btn quiet" id="next-card">${esc(next.label)}</button>` : ''}</div>
${shareHtml(a.share, SITE + answerUrl(a.slug))}`;
}

/* ---------- the answer page ---------- */

export function answerPage(a: Answer, src: AnswersSource): string {
  const bySlug = new Map(src.answers.map((x) => [x.slug, x]));
  const companies = companySources(src.sources);
  const nexts = ([['Go deeper', a.next.deeper], ['Zoom out', a.next.bigger], ['Closer to home', a.next.closer]] as const)
    .map(([k, s]) => `<li><a href="${answerUrl(s)}"><span class="k">${k}</span><span>${esc(bySlug.get(s)!.q)}</span></a></li>`)
    .join('');
  const chips = a.chips.length ? `<span class="chips">${a.chips.map((c) => `<span class="chip">${esc(c)}</span>`).join('')}</span>` : '';
  const verdict = a.stamp || chips ? `<div class="verdict-row">${a.stamp ? stampHtml(a.stamp) : ''}${chips}</div>` : '';
  return `<article class="answer">
<p class="crumb"><a href="/topics/${topicSlug(a.cat)}">${esc(a.cat)}</a></p>
<h1 id="answer-h">${esc(a.q)}</h1>
${a.type === 'claim' ? `<p class="claimline">The claim: ${esc(a.heard!)}</p>` : ''}
${verdict}
<p class="lede">${esc(a.answer)}</p>
<p class="world"><span class="k">The bigger picture</span>${esc(a.world)}</p>
${figureHtml(a, companies)}
<div class="folds">
${a.rung ? `<details><summary>How big is that?</summary><div>${ladderHtml(src.ladder, a.rung)}</div></details>` : ''}
${a.why ? `<details><summary>Why the claim misleads</summary><div><p>${esc(a.why)}</p></div></details>` : ''}
<details><summary>What nobody knows yet</summary><div><ul class="plain">${a.dontknow.map((d) => `<li>${esc(d)}</li>`).join('')}</ul></div></details>
<details><summary>Sources (${a.cites.length})</summary><div>${sourcesHtml(a.cites, src.sources)}${calcsHtml(a.calcs, src.calcs)}</div></details>
<details><summary>Cite this</summary><div><p>${esc(citeText(a, src.sources))}</p><p class="muted">Cite the original source first; Hum is where you found it.</p></div></details>
${UNITS_HTML}
</div>
<section aria-labelledby="send-h"><h2 id="send-h">Send this answer</h2><p class="muted">${esc(a.share)}</p>${shareHtml(a.share, SITE + answerUrl(a.slug))}</section>
<section aria-labelledby="next-h"><h2 id="next-h">Next questions</h2><ul class="next">${nexts}</ul></section>
</article>`;
}

/* ---------- lists ---------- */

export function answerRow(a: Answer): string {
  const right = a.stamp ? `<span class="s"><span aria-hidden="true">${ICON[a.stamp]}</span> ${a.stamp}</span>` : '<span></span>';
  return `<li><a href="${answerUrl(a.slug)}"><span>${esc(a.q)}</span>${right}<span class="sub">${esc(a.result)}</span></a></li>`;
}

export function topicPage(cat: Category, answers: Answer[]): string {
  const list = answers.filter((a) => a.cat === cat);
  const usNote = cat === 'Your bills and the grid' || cat === 'Near you' ? ' The evidence so far is mostly from the US.' : '';
  return `<section class="topic"><p class="crumb"><a href="/topics">All topics</a></p><h1>${esc(cat)}</h1>
<p class="muted">${list.length} reviewed ${list.length === 1 ? 'answer' : 'answers'}.${usNote} More are being checked.</p>
<ul class="rows">${list.map(answerRow).join('')}</ul></section>`;
}
