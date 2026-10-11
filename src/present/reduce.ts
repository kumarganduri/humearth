// "What actually reduces it" (design doc, stage 1b): your own week, ranked by what each change would save.
// Personal part only: Wh a week from the calculator's answers and the sourced per-use figures, low / mid /
// high. Tiny bars stay in on purpose: one linear scale shows that a question is small and a video isn't.
// Pure HTML strings: prebuilt with the default week, re-rendered by main.ts when the sliders move.
//
//   usage (questions/day, pictures/week, videos/week) ──► each action's saving per week ──► ranked bars

import type { Constants, Level, Usage } from '../footprint/types';
import { esc, formatNumber } from './format';

export interface Action {
  key: 'videos' | 'pictures' | 'questions' | 'day-off';
  label: string;
  /** Wh saved per week at each level. */
  saved: Record<Level, number>;
  /** Shown instead of a bar when there's nothing to save. */
  none?: string;
}

const LEVELS: Level[] = ['low', 'mid', 'high'];
const per = (c: Constants, k: 'textPromptWh' | 'imageWh' | 'videoClipWh') => (l: Level) => c.values[k][l];
const each = (f: (l: Level) => number) => Object.fromEntries(LEVELS.map((l) => [l, f(l)])) as Record<Level, number>;

export const FEWER_QUESTIONS = 5;

/** The changes, each computed from your week; ranked by the middle figure, biggest first. */
export function actionsFor(u: Usage, c: Constants): Action[] {
  const q = per(c, 'textPromptWh');
  const img = per(c, 'imageWh');
  const vid = per(c, 'videoClipWh');
  const week = (l: Level) => u.questionsPerDay * 7 * q(l) + u.picturesPerWeek * img(l) + u.videosPerWeek * vid(l);
  const fewer = Math.min(FEWER_QUESTIONS, u.questionsPerDay);
  const halfPics = Math.round(u.picturesPerWeek / 2); // whole pictures: 3 a week -> 2 fewer
  const actions: Action[] = [
    {
      key: 'videos',
      label: u.videosPerWeek === 1 ? 'Skip your one short AI video' : `Skip your ${u.videosPerWeek} short AI videos`,
      saved: each((l) => u.videosPerWeek * vid(l)),
      none: u.videosPerWeek ? undefined : "You don't make any videos",
    },
    {
      key: 'pictures',
      label: halfPics === 1 ? 'Make 1 fewer AI picture a week' : `Make ${halfPics} fewer AI pictures a week`, // about half of yours
      saved: each((l) => halfPics * img(l)),
      none: u.picturesPerWeek ? undefined : "You don't make any pictures",
    },
    {
      key: 'questions',
      label: fewer === 1 ? 'Ask 1 fewer question a day' : `Ask ${fewer} fewer questions a day`,
      saved: each((l) => fewer * 7 * q(l)),
      none: u.questionsPerDay ? undefined : "You don't ask any questions",
    },
    {
      key: 'day-off',
      label: 'Take one day a week off AI',
      saved: each((l) => week(l) / 7),
      none: week('mid') ? undefined : 'Nothing to take off',
    },
  ];
  return actions.sort((a, b) => b.saved.mid - a.saved.mid);
}

/** "about 90 Wh (25.3 to 944)"; the unit follows the middle figure. */
export function savedWords(s: Record<Level, number>): string {
  const range = s.low === s.high ? '' : ` (${formatNumber(s.low)} to ${formatNumber(s.high)})`;
  return `about ${formatNumber(s.mid)} Wh${range}`;
}

export function reduceBarsHtml(u: Usage, c: Constants): string {
  const actions = actionsFor(u, c);
  const max = Math.max(...actions.map((a) => a.saved.mid), 1e-9);
  const rows = actions
    .map((a) => {
      if (a.none) return `<li class="cut none" data-key="${a.key}"><span class="cut-label">${esc(a.label)}</span><span class="cut-v muted">${esc(a.none)}</span></li>`;
      // Never 0px wide: a sliver keeps the tiny saving visible next to the big ones (the label says how tiny).
      const w = Math.max(0.4, (a.saved.mid / max) * 100);
      return `<li class="cut" data-key="${a.key}"><span class="cut-label">${esc(a.label)}</span><span class="cut-bar" aria-hidden="true"><span class="cut-fill" style="width:${w.toFixed(2)}%"></span></span><span class="cut-v"><b class="num">${formatNumber(a.saved.mid)}</b> Wh<span class="rng"> ${a.saved.low === a.saved.high ? '' : `${formatNumber(a.saved.low)} to ${formatNumber(a.saved.high)}`}</span></span><span class="sr-only">: saves ${esc(savedWords(a.saved))} a week</span></li>`;
    })
    .join('');
  return `<ol class="cuts" aria-label="What each change would save in a week, biggest first">${rows}</ol>`;
}

export function reduceHtml(u: Usage, c: Constants): string {
  return `<section class="col reduce" id="reduce" aria-labelledby="heading-reduce">
  <h2 id="heading-reduce">What actually reduces it</h2>
  <p>Your week from <a href="#your-part">Your part</a>, ranked: what each change would save, in watt-hours a week. Same scale for every bar, so the small ones look as small as they are.</p>
  <div id="cuts">${reduceBarsHtml(u, c)}</div>
  <p class="src">Middle figure, with the low to high range. Per-use figures from <a href="/how-we-know.html#numbers">How we know</a>, counted at the data centre.</p>
  <h3>Bigger than any of these</h3>
  <p>Next to the world's total, one person's week is tiny. The biggest levers aren't in your chat window:</p>
  <ul class="civic">
    <li><b>Where data centres are built.</b> The same electricity puts out several times more CO2 on a coal-heavy grid than on a clean one. <a href="/2030">Try it in 2030</a>.</li>
    <li><b>Whether companies publish what they use.</b> The per-question figures here come from a handful of company disclosures and outside estimates, which is why every one of them is a range.</li>
    <li><b>Local permits.</b> New data centres need grid connections, water and planning approval, decided in public meetings people can attend.</li>
  </ul>
</section>`;
}
