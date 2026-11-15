// Hum's Today page: one card a day, numbered from launch (UTC). The card is prebuilt (works with scripts off);
// this wakes it with the same pure render functions the build used. The front door has its own script
// (src/front.ts).

import './analytics';
import './base.css';
import './answers.css';
import { cardHtml, esc, isRightChoice, revealHtml, SITE } from './answers/render';
import { bindShares } from './answers/share';
import { safeLocalStorage } from './legacy';
import type { AnswersFile } from './answers/types';
import { dayNumber, todaySlug } from './answers/pure';

type Data = AnswersFile & { companies: string[] };
type Card = Data['answers'][number];

const loc = globalThis.location;

const store = safeLocalStorage();
const read = <T>(k: string, d: T): T => { try { const v = store?.getItem(k); return v ? (JSON.parse(v) as T) : d; } catch { return d; } };
const write = (k: string, v: unknown) => { try { store?.setItem(k, JSON.stringify(v)); } catch { /* storage blocked: the game still works */ } };


function play(host: HTMLElement, a: Card, opts: { at?: number; of?: number; next?: string; onAnswer?: (right: boolean) => void; onNext?: () => void }) {
  // A card prebuilt into the page is woken in place, not redrawn (a redraw would repaint the largest text late).
  if (host.dataset.slug !== a.slug || !host.querySelector('.choices')) host.innerHTML = cardHtml(a, opts.at !== undefined ? { at: opts.at, of: opts.of! } : undefined);
  host.dataset.slug = a.slug;
  const buttons = [...host.querySelectorAll<HTMLButtonElement>('.choices button')];
  const choiceOf = (b: HTMLButtonElement) => (b.dataset.k ? { k: b.dataset.k } : { i: Number(b.dataset.i) });
  for (const b of buttons) b.addEventListener('click', () => {
    if (b.getAttribute('aria-disabled') === 'true') return;
    const right = isRightChoice(a, choiceOf(b));
    for (const x of buttons) {
      x.setAttribute('aria-disabled', 'true');
      if (isRightChoice(a, choiceOf(x))) { x.classList.add('is-right'); x.insertAdjacentHTML('beforeend', '<span class="tag">✓ Right answer</span>'); }
      if (x === b) { x.classList.add('is-mine'); if (!right) x.insertAdjacentHTML('beforeend', '<span class="tag">✕ Your guess</span>'); }
    }
    opts.onAnswer?.(right);
    const rv = host.querySelector<HTMLElement>('#reveal')!;
    rv.innerHTML = revealHtml(a, right, opts.next ? { label: opts.next } : undefined);
    rv.hidden = false;
    host.querySelector('.tellme')?.setAttribute('hidden', ''); // the reveal has its own link to the full answer
    bindShares(rv);
    rv.querySelector<HTMLElement>('#rv-h')!.focus();
    if (opts.onNext) rv.querySelector('#next-card')?.addEventListener('click', opts.onNext);
  });
}

function today(data: Data) {
  const host = document.getElementById('card');
  if (!host) return;
  const day = dayNumber(data.launch, new Date());
  const n = Math.max(1, day + 1);
  const a = data.answers.find((x) => x.slug === todaySlug(data, day))!;
  const num = document.getElementById('today-num')!;
  if (num.textContent !== `Hum #${n}`) num.textContent = `Hum #${n}`;
  const key = `hum.today.${n}`;
  const done = read<{ right: boolean } | null>(key, null);
  play(host, a, {
    onAnswer: (right) => {
      write(key, { right });
      const prompt = a.type === 'claim' ? a.heard! : a.guess!.prompt;
      const text = `Hum #${n}: I ${right ? 'got it' : 'missed it'}. Can you guess? ${prompt}`;
      const box = document.getElementById('today-share')!;
      box.innerHTML = `<h2>Challenge a friend</h2><p class="muted">Your result, without the answer.</p><div class="share" data-share-text="${esc(text)}" data-share-url="${SITE}/today"><button type="button" class="btn">Share</button><span class="share-done" aria-live="polite"></span></div>`;
      bindShares(box);
    },
  });
  if (done) host.insertAdjacentHTML('afterbegin', `<p class="muted">You played this one already on this device (${done.right ? 'right' : 'missed'}).</p>`);
}

async function main() {
  const embedded = document.getElementById('answers-data')?.textContent;
  let data: Data;
  if (embedded) data = JSON.parse(embedded) as Data;
  else {
    const r = await fetch('/data/answers.json');
    if (!r.ok) return; // the prebuilt first card and its "Just tell me" link still work
    data = (await r.json()) as Data;
  }
  if (loc.pathname.replace(/\.html$/, '') === '/today') today(data);
}
if (typeof document !== 'undefined') void main();
