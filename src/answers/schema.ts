// Validation for data/sources/answers.source.json. The build fails on any problem, so an answer can never
// show a number that isn't in one of its quotes or in one of Hum's checked sums.
//
//   sources ── quote, https, date, kind ─┐
//   calcs ──── expr evaluates to result ─┼─> number pool per answer ─> every number a reader sees must be in it
//   answers ── cites / calcs / links ────┘

import { CATEGORIES, PROVENANCE, STAMPS, type Answer, type AnswersSource, type Calc } from './types';

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Unit conversions a calc may use without a quote. Each is a definition, not a measurement:
 * 1000 (k), 3600 (seconds per hour), 1e6/1e9/1e12 (M/G/T), 52 and 365 (weeks and days in a year), 100 (per cent),
 * 3785 (millilitres in a US gallon, 3,785.41 by definition).
 */
export const CONVERSIONS = [1000, 3600, 1e6, 1e9, 1e12, 52, 365, 100, 3785];

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);
const str = (x: unknown): x is string => typeof x === 'string' && x.trim().length > 0;

/** Every number in a piece of text, with thousands separators read through ("5,250" and the IEA's "1 200" with a
 *  narrow or no-break space). An ordinary space never joins numbers, so "2024 415" stays two. */
export function numbersIn(text: string): number[] {
  return (text.replace(/(\d)[,\u00a0\u2009\u202f](?=\d{3}\b)/g, '$1').match(/\d+(?:\.\d+)?/g) ?? []).map(Number);
}

/** The numbers in a calc expression, reading 18e9 as one number. */
export function exprNumbers(expr: string): number[] {
  return (expr.match(/\d+(?:\.\d+)?(?:e\d+)?/g) ?? []).map(Number);
}

/** Arithmetic only: digits, + - * / ( ) . e and spaces. */
export function evaluate(expr: string): number {
  if (!/^[\d.+\-*/()e\s]+$/.test(expr)) throw new Error(`calc expr has characters other than arithmetic: ${expr}`);
  return Function(`"use strict"; return (${expr});`)() as number;
}

const close = (a: number, b: number, tol = 0.02) => (b === 0 ? Math.abs(a) < 1e-12 : Math.abs(a - b) / Math.abs(b) <= tol);

/** All the reader-visible text of an answer, labelled so an error says where. */
export function visibleText(a: Answer): [where: string, text: string][] {
  const out: [string, string][] = [
    ['q', a.q], ['result', a.result], ['reveal', a.reveal], ['answer', a.answer], ['world', a.world], ['share', a.share],
  ];
  if (a.heard) out.push(['heard', a.heard]);
  if (a.why) out.push(['why', a.why]);
  a.dontknow.forEach((d, i) => out.push([`dontknow[${i}]`, d]));
  // Wrong options are shown as wrong, so only the right one asserts a number.
  if (a.guess) { out.push(['guess.prompt', a.guess.prompt]); const r = a.guess.options[a.guess.right]; if (r) out.push([`guess.options[${a.guess.right}]`, r]); }
  if (a.points) { out.push(['points.title', a.points.title]); a.points.items.forEach((p, i) => out.push([`points.items[${i}]`, `${p.label} ${p.how}`])); }
  if (a.range) out.push(['range', `${a.range.what} ${a.range.claimWhat}`]);
  return out;
}

function validateSources(src: AnswersSource): string[] {
  const errs: string[] = [];
  if (!isObj(src.sources)) return ['sources: missing'];
  for (const [k, s] of Object.entries(src.sources)) {
    const key = `sources.${k}`;
    if (!isObj(s)) { errs.push(`${key}: must be an object`); continue; }
    if (!str(s.publisher)) errs.push(`${key}.publisher: required`);
    if (!str(s.quote)) errs.push(`${key}.quote: required`);
    if (!str(s.url) || !/^https:\/\//.test(s.url)) errs.push(`${key}.url: must be https`);
    if (!str(s.retrieved) || !DATE.test(s.retrieved)) errs.push(`${key}.retrieved: YYYY-MM-DD`);
    if (!PROVENANCE.includes(s.kind as never)) errs.push(`${key}.kind: one of ${PROVENANCE.join(', ')}`);
    if (s.kind === 'dataset' ? s.checked !== 'dataset' : s.checked !== 'page') errs.push(`${key}.checked: "page" (or "dataset" for a data row): quotes are read on the page itself, never a search summary`);
  }
  return errs;
}

/** Numbers a calc's expr may use: anything in any quote, any other calc's result, and the unit conversions. */
function validateCalcs(src: AnswersSource): string[] {
  const errs: string[] = [];
  if (!isObj(src.calcs)) return ['calcs: missing'];
  const quoted = Object.values(src.sources ?? {}).flatMap((s) => [...numbersIn(s.quote), ...numbersIn(s.publisher)]);
  const results = Object.values(src.calcs).map((c) => (c as Calc).result);
  const allowed = [...quoted, ...results, ...CONVERSIONS];
  for (const [k, c] of Object.entries(src.calcs)) {
    const key = `calcs.${k}`;
    if (!isObj(c) || !str(c.text) || !str(c.expr) || typeof c.result !== 'number') { errs.push(`${key}: text, expr and numeric result required`); continue; }
    const assumed = Object.keys(c.assume ?? {}).map(Number);
    for (const [n, why] of Object.entries(c.assume ?? {})) {
      if (!str(why)) errs.push(`${key}.assume.${n}: say what the assumption is`);
      if (!numbersIn(c.text).some((x) => close(x, Number(n), 1e-9))) errs.push(`${key}.assume.${n}: an assumption must be shown in the text readers see`);
    }
    let v: number;
    try { v = evaluate(c.expr); } catch (e) { errs.push(`${key}: ${(e as Error).message}`); continue; }
    if (!close(v, c.result)) errs.push(`${key}: ${c.expr} = ${v}, not ${c.result}`);
    for (const n of exprNumbers(c.expr)) if (![...allowed, ...assumed].some((a) => close(a, n, 1e-9))) errs.push(`${key}: ${n} in "${c.expr}" isn't in any quote, calc result or unit conversion`);
  }
  return errs;
}

/** The numbers an answer may show: its cited quotes (and publisher lines), its calcs, and 1. */
export function numberPool(a: Answer, src: AnswersSource): number[] {
  const pool = [1];
  for (const k of a.cites) { const s = src.sources[k]; if (s) pool.push(...numbersIn(s.quote), ...numbersIn(s.publisher)); }
  for (const k of a.calcs) { const c = src.calcs[k]; if (c) pool.push(...numbersIn(c.text), c.result); }
  return pool;
}

const inPool = (n: number, pool: number[]) => pool.some((p) => close(p, n, 1e-9));

function validateAnswer(a: Answer, src: AnswersSource, slugs: Set<string>, rungs: Set<string>): string[] {
  const key = `answers[${isObj(a) && str(a.slug) ? a.slug : '?'}]`;
  if (!isObj(a)) return [`${key}: must be an object`];
  const errs: string[] = [];
  const need = (f: keyof Answer) => { if (!str(a[f])) errs.push(`${key}.${f}: required`); };
  (['slug', 'q', 'result', 'reveal', 'answer', 'world', 'share'] as const).forEach(need);
  if (str(a.slug) && !SLUG.test(a.slug)) errs.push(`${key}.slug: lowercase words joined by hyphens`);
  if (!CATEGORIES.includes(a.cat)) errs.push(`${key}.cat: unknown category`);
  if (a.type === 'claim') {
    if (!STAMPS.includes(a.stamp!)) errs.push(`${key}.stamp: one of ${STAMPS.join(', ')}`);
    if (!str(a.heard) || !str(a.heardFrom)) errs.push(`${key}: a claim needs heard and heardFrom`);
  } else if (a.type === 'how-much') {
    if (a.stamp) errs.push(`${key}.stamp: only claims get a verdict stamp`);
    const g = a.guess;
    if (!g || !str(g.prompt) || !Array.isArray(g.options) || g.options.length !== 4 || !Number.isInteger(g.right) || g.right < 0 || g.right > 3) errs.push(`${key}.guess: prompt, 4 options and a right index required`);
  } else errs.push(`${key}.type: claim | how-much`);
  if (!Array.isArray(a.chips)) errs.push(`${key}.chips: array required`);
  if (!Array.isArray(a.dontknow) || a.dontknow.length === 0) errs.push(`${key}.dontknow: say what nobody knows yet`);
  if (typeof a.you !== 'boolean') errs.push(`${key}.you: boolean required`);
  if (!isObj(a.next)) errs.push(`${key}.next: deeper, bigger, closer required`);
  else for (const k of ['deeper', 'bigger', 'closer'] as const) {
    if (!slugs.has(a.next[k])) errs.push(`${key}.next.${k}: no answer "${a.next[k]}"`);
    else if (a.next[k] === a.slug) errs.push(`${key}.next.${k}: links to itself`);
  }
  if (a.rung !== undefined && !rungs.has(a.rung)) errs.push(`${key}.rung: no ladder rung "${a.rung}"`);
  if (!Array.isArray(a.cites) || a.cites.length === 0) return [...errs, `${key}.cites: at least one source`];
  for (const k of a.cites) if (!src.sources[k]) errs.push(`${key}.cites: unknown source "${k}"`);
  if (!Array.isArray(a.calcs)) return [...errs, `${key}.calcs: array required`];
  for (const k of a.calcs) if (!src.calcs[k]) errs.push(`${key}.calcs: unknown calc "${k}"`);
  if (errs.length) return errs;

  const pool = numberPool(a, src);
  for (const [where, text] of visibleText(a)) {
    for (const n of numbersIn(text)) if (!inPool(n, pool)) errs.push(`${key}.${where}: ${n} is not in any of its quotes or sums`);
  }
  const valueFrom = (where: string, v: number, source: string) => {
    if (!a.cites.includes(source)) return errs.push(`${key}.${where}: source "${source}" isn't in cites`);
    if (!inPool(v, pool)) errs.push(`${key}.${where}: ${v} is not in any of its quotes or sums`);
  };
  a.points?.items.forEach((p, i) => valueFrom(`points.items[${i}]`, p.value, p.source));
  if (a.range) { valueFrom('range.low', a.range.low, a.range.source); valueFrom('range.high', a.range.high, a.range.source); valueFrom('range.claim', a.range.claim, a.range.source); }
  return errs;
}

export function validateAnswersSource(input: unknown): string[] {
  if (!isObj(input)) return ['answers source: must be an object'];
  const src = input as unknown as AnswersSource;
  const errs = [...validateSources(src), ...validateCalcs(src)];
  if (!Array.isArray(src.ladder) || src.ladder.length < 2) errs.push('ladder: at least two rungs');
  if (!Array.isArray(src.answers) || src.answers.length === 0) return [...errs, 'answers: at least one'];
  if (!str(src.launch) || !DATE.test(src.launch)) errs.push('launch: YYYY-MM-DD');
  const slugs = new Set<string>();
  for (const a of src.answers) {
    if (isObj(a) && str(a.slug)) { if (slugs.has(a.slug)) errs.push(`answers[${a.slug}]: duplicate slug`); slugs.add(a.slug); }
  }
  const rungs = new Set((src.ladder ?? []).map((r) => r.key));
  (src.ladder ?? []).forEach((r, i) => {
    const key = `ladder[${r.key ?? i}]`;
    if (!str(r.key) || !str(r.label) || !str(r.note) || typeof r.wh !== 'number' || r.wh <= 0) return errs.push(`${key}: key, label, note and wh > 0 required`);
    const s = src.sources[r.source];
    if (!s) return errs.push(`${key}.source: unknown "${r.source}"`);
    const pool = [...numbersIn(s.quote), ...(r.calc && src.calcs[r.calc] ? [src.calcs[r.calc]!.result] : [])];
    if (r.calc && !src.calcs[r.calc]) errs.push(`${key}.calc: unknown "${r.calc}"`);
    if (!r.calc && !inPool(r.wh, pool)) errs.push(`${key}.wh: ${r.wh} isn't in its quote; give a calc that converts it`);
    if (r.calc && src.calcs[r.calc] && !close(src.calcs[r.calc]!.result, r.wh, 1e-9)) errs.push(`${key}.wh: must equal calc ${r.calc} (${src.calcs[r.calc]!.result})`);
    for (const n of numbersIn(r.note)) if (!inPool(n, [...pool, ...numbersIn(s.publisher), ...(r.calc ? numbersIn(src.calcs[r.calc]?.text ?? '') : [])])) errs.push(`${key}.note: ${n} is not in its quote or sum`);
  });
  if (!Array.isArray(src.deck) || src.deck.length === 0) errs.push('deck: at least one card');
  else for (const s of src.deck) if (!slugs.has(s)) errs.push(`deck: no answer "${s}"`);
  for (const a of src.answers) errs.push(...validateAnswer(a, src, slugs, rungs));
  return errs;
}
