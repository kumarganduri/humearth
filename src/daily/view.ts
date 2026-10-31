// Hum Daily's question card as HTML: used at build time (the day's question prebuilt into daily.html, so it is
// there before any script, which keeps the page's largest text from painting late) and in the browser.
import { esc } from '../present/format';
import { ask, statement, type Question } from './pool';

export function questionHtml(q: Question): string {
  return `<p class="dq-a">${esc(statement(q))}</p>
<p class="dq-ask">${esc(ask(q))}</p>
<div class="dq-choices" role="group" aria-label="Your answer">
  <button type="button" class="btn dq-btn" data-pick="more">More</button>
  <button type="button" class="btn dq-btn" data-pick="less">Less</button>
</div>`;
}

/** The card for a given day, as daily.html ships it. */
export const cardHtml = (q: Question, day: number) =>
  `<div class="dq-card js-only" id="dq" data-day="${day}" aria-live="polite">${questionHtml(q)}</div>`;
