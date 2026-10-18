// Hum v4 front door and Today. The first card and every answer page are prebuilt (works with scripts off);
// this wakes the card deck, the search and Today, using the same pure render functions the build used.
//
//   /       card deck (guess -> reveal -> next ... -> score)  +  search over the reviewed answers
//   /today  one card a day, numbered from launch (UTC), never the front door's first card
//   old globe links (/?year=, /?s=) forward to /earth with everything after the path kept

import './analytics';
import './base.css';
import './answers.css';
import { cardHtml, esc, isRightChoice, revealHtml, SITE } from './answers/render';
import { bindShares } from './answers/share';
import { safeLocalStorage } from './legacy';
import type { AnswersFile } from './answers/types';
import { dayNumber, matches, todayIndex } from './answers/pure';

type Data = AnswersFile & { companies: string[] };
type Card = Data['answers'][number];

const loc = globalThis.location;
if (loc.pathname === '/' && /[?&](year|s)=/.test(loc.search)) loc.replace(`/earth${loc.search}${loc.hash}`);

const store = safeLocalStorage();
const read = <T>(k: string, d: T): T => { try { const v = store?.getItem(k); return v ? (JSON.parse(v) as T) : d; } catch { return d; } };
const write = (k: string, v: unknown) => { try { store?.setItem(k, JSON.stringify(v)); } catch { /* storage blocked: the game still works */ } };


function play(host: HTMLElement, a: Card, companies: Set<string>, opts: { at?: number; of?: number; next?: string; onAnswer?: (right: boolean) => void; onNext?: () => void }) {
  host.dataset.slug = a.slug;
  host.innerHTML = cardHtml(a, opts.at !== undefined ? { at: opts.at, of: opts.of! } : undefined);
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
    rv.innerHTML = revealHtml(a, right, companies, opts.next ? { label: opts.next } : undefined);
    rv.hidden = false;
    bindShares(rv);
    rv.querySelector<HTMLElement>('#rv-h')!.focus();
    if (opts.onNext) rv.querySelector('#next-card')?.addEventListener('click', opts.onNext);
  });
}

function frontDoor(data: Data, companies: Set<string>) {
  const host = document.getElementById('card');
  if (!host) return;
  const bySlug = new Map(data.answers.map((a) => [a.slug, a]));
  const todaySlug = data.deck[todayIndex(dayNumber(data.launch, new Date()), data.deck.length)];
  const deck = data.deck.filter((s) => s !== todaySlug).map((s) => bySlug.get(s)!);
  let at = 0, score = 0;
  const next = () => {
    if (at >= deck.length) {
      host.innerHTML = `<h2 id="card-h" tabindex="-1">You got ${score} of ${deck.length}.</h2><p class="muted">That’s every card so far. A new question comes each day.</p><div class="cardnav"><a class="btn" href="/today">Today’s question</a><button type="button" class="btn quiet" id="again">Play again</button></div>`;
      host.querySelector('#again')!.addEventListener('click', () => { at = 0; score = 0; next(); host.querySelector<HTMLElement>('#card-h')!.focus(); });
      host.querySelector<HTMLElement>('#card-h')!.focus();
      return;
    }
    play(host, deck[at]!, companies, {
      at, of: deck.length, next: at === deck.length - 1 ? 'See your score' : 'Next question',
      onAnswer: (right) => { if (right) score++; const t = read('hum.cards', { played: 0, right: 0 }); t.played++; if (right) t.right++; write('hum.cards', t); },
      onNext: () => { at++; next(); host.scrollIntoView({ block: 'start' }); host.querySelector<HTMLElement>('#card-h')?.focus({ preventScroll: true }); },
    });
  };
  next();
  search(data);
}


function search(data: Data) {
  const input = document.getElementById('q') as HTMLInputElement | null;
  const list = document.getElementById('results');
  const count = document.getElementById('q-count');
  if (!input || !list || !count) return;
  let t: ReturnType<typeof setTimeout> | undefined;
  input.addEventListener('input', () => {
    const v = input.value.trim();
    const hits = v ? matches(v, data.answers) : [];
    list.hidden = !v;
    list.innerHTML = hits.length
      ? hits.map((a) => `<li><a href="/q/${a.slug}">${esc(a.q)}</a></li>`).join('')
      : `<li class="none">No reviewed answer for that yet. <a href="/topics">Browse every answer</a>.</li>`;
    clearTimeout(t);
    t = setTimeout(() => { count.textContent = v ? (hits.length ? `${hits.length} ${hits.length === 1 ? 'answer matches' : 'answers match'}` : 'No match yet') : ''; }, 500);
  });
}

function today(data: Data, companies: Set<string>) {
  const host = document.getElementById('card');
  if (!host) return;
  const day = dayNumber(data.launch, new Date());
  const n = Math.max(1, day + 1);
  const a = data.answers.find((x) => x.slug === data.deck[todayIndex(day, data.deck.length)])!;
  document.getElementById('today-n')!.textContent = `Hum #${n} · one question a day, the same for everyone. No sign-up. There are ${data.deck.length} cards so far, so they repeat until more answers are reviewed.`;
  const key = `hum.today.${n}`;
  const done = read<{ right: boolean } | null>(key, null);
  play(host, a, companies, {
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
  const companies = new Set(data.companies);
  if (loc.pathname.replace(/\.html$/, '') === '/today') today(data, companies);
  else frontDoor(data, companies);
}
if (typeof document !== 'undefined') void main();
