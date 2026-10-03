// "Your part" (eng review D8): plain counts in, a week's electricity / CO2 / water out, always as a range.
// Pure: prebuilt into the page with a default week, then re-rendered by main.ts as the sliders move.
// Framing (approved design doc): "Your typing is small. Your video isn't. And your voice is the big one."

import { weeklyRange, type ChannelTotals } from '../footprint/engine';
import type { Constants, Level, Usage } from '../footprint/types';
import { esc, formatNumber, rangeText } from './format';

export const DEFAULT_USAGE: Usage = { questionsPerDay: 20, picturesPerWeek: 3, videosPerWeek: 1 };

export const LIMITS: Record<keyof Usage, { max: number; label: string; per: string }> = {
  questionsPerDay: { max: 100, label: 'AI questions', per: 'a day' },
  picturesPerWeek: { max: 40, label: 'AI pictures', per: 'a week' },
  videosPerWeek: { max: 10, label: 'Short AI videos', per: 'a week' },
};

/** Clamp anything (slider, URL, typo) to a whole number in 0..max. */
export function clampUsage(u: Partial<Record<keyof Usage, unknown>>): Usage {
  const one = (k: keyof Usage) => {
    const n = Math.round(Number(u[k]));
    return Number.isFinite(n) ? Math.min(LIMITS[k].max, Math.max(0, n)) : DEFAULT_USAGE[k];
  };
  return { questionsPerDay: one('questionsPerDay'), picturesPerWeek: one('picturesPerWeek'), videosPerWeek: one('videosPerWeek') };
}

type Channel = keyof ChannelTotals;
/** Readable unit per channel, chosen from the middle figure so low/mid/high share one unit. */
const UNITS: Record<Channel, { small: [string, number]; big: [string, number] }> = {
  energy: { small: ['Wh', 1], big: ['kWh', 1000] },
  co2: { small: ['g CO2', 1], big: ['kg CO2', 1000] },
  water: { small: ['litres', 1000], big: ['litres', 1000] }, // litres at every size reads better than mL
};

export interface ChannelOutput {
  text: string; // "0.12 · 0.18 · 1.1 kWh" (screen readers, tests)
  low: string;
  mid: string; // "0.18"
  high: string;
  unit: string;
}

export interface CalculatorOutputs {
  energy: ChannelOutput;
  co2: ChannelOutput;
  water: ChannelOutput;
  /** Middle Wh per activity, for the sentence. */
  perActivityWh: { text: number; images: number; videos: number };
  sentence: string;
}

function channel(r: Record<Level, { totals: ChannelTotals }>, ch: Channel): ChannelOutput {
  const mid = r.mid.totals[ch];
  const [unit, div] = mid >= UNITS[ch].big[1] ? UNITS[ch].big : UNITS[ch].small;
  const range = { low: r.low.totals[ch] / div, mid: mid / div, high: r.high.totals[ch] / div };
  return { text: rangeText(range, unit), low: formatNumber(range.low), mid: formatNumber(range.mid), high: formatNumber(range.high), unit };
}

/** "Your typing: 48 Wh. Your videos: 90 Wh, 61% of your week." */
export function sentenceFor(perActivityWh: CalculatorOutputs['perActivityWh']): string {
  const total = perActivityWh.text + perActivityWh.images + perActivityWh.videos;
  if (total === 0) return 'No AI this week, so nothing to add up.';
  const wh = (n: number) => `${formatNumber(n)} Wh`;
  const parts = [`Your questions: ${wh(perActivityWh.text)}.`];
  if (perActivityWh.images > 0) parts.push(`Your pictures: ${wh(perActivityWh.images)}.`);
  if (perActivityWh.videos > 0) parts.push(`Your videos: ${wh(perActivityWh.videos)}, ${Math.round((perActivityWh.videos / total) * 100)}% of your week.`);
  return parts.join(' ');
}

export function calculatorOutputs(u: Usage, c: Constants): CalculatorOutputs {
  const r = weeklyRange(clampUsage(u), c);
  const perActivityWh = r.mid.perActivityWh;
  return {
    energy: channel(r, 'energy'),
    co2: channel(r, 'co2'),
    water: channel(r, 'water'),
    perActivityWh,
    sentence: sentenceFor(perActivityWh),
  };
}

const OUT_LABELS: Record<Channel, string> = { energy: 'Electricity', co2: 'CO2', water: 'Water' };

/** The outputs block: one line per channel, a range reading each (DESIGN.md: never a lone number). */
export function outputsHtml(o: CalculatorOutputs): string {
  // Middle figure large; the range on its own line underneath (still always shown, never a lone number).
  const line = (ch: Channel) => {
    const x = o[ch];
    const range = x.low === x.high ? '' : `<span class="rng">from ${esc(x.low)} to ${esc(x.high)}</span>`;
    return `<div class="out-line" data-ch="${ch}"><span class="k">${OUT_LABELS[ch]}</span><span class="val"><span class="first"><span class="mid num">${esc(x.mid)}</span> ${esc(x.unit)} <span class="muted">a week</span></span>${range}</span><span class="sr-only">${esc(`${OUT_LABELS[ch]}: ${x.text} a week`)}</span></div>`;
  };
  return `${line('energy')}${line('co2')}${line('water')}`;
}

export function calculatorHtml(c: Constants): string {
  const o = calculatorOutputs(DEFAULT_USAGE, c);
  const ctrl = (k: keyof Usage) =>
    `<div class="ctrl"><label for="u-${k}">${esc(LIMITS[k].label)} ${esc(LIMITS[k].per)} <output class="num" id="v-${k}" for="u-${k}">${DEFAULT_USAGE[k]}</output></label><input type="range" id="u-${k}" data-k="${k}" min="0" max="${LIMITS[k].max}" step="1" value="${DEFAULT_USAGE[k]}" disabled></div>`;
  return `<section class="col calc" id="your-part" aria-labelledby="heading-you">
  <h2 id="heading-you">Your part</h2>
  <p class="say-big">Your typing is small. Your video isn't. And your voice is the big one.</p>
  <div class="calc-grid">
    <div class="ctrls">${ctrl('questionsPerDay')}${ctrl('picturesPerWeek')}${ctrl('videosPerWeek')}</div>
    <div class="outs" id="calc-out">${outputsHtml(o)}</div>
  </div>
  <p class="say" id="calc-say" aria-live="polite">${esc(o.sentence)}</p>
  <p>Next to the world's total, one person's use is tiny: the biggest lever isn't your chat window. It's where data centres get built, how clean their power is, and whether companies publish what they use. That's where your voice counts.</p>
  <p class="src">Low · middle · high, from the figures on <a href="/how-we-know.html#numbers">How we know</a>. One week, everything counted at the data centre (not your phone).</p>
</section>`;
}
