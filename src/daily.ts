// Hum Daily: today's question (by your local date), More or Less, then the reveal with both figures, their
// ranges and the source; your streak lives on this device only. Everything is built from the data files.
//
//   load data -> buildPool -> questionFor(dayNumber(today)) -> already played today? show the result : ask
import './analytics'; // visitor counts, real site only
import './base.css';
import './daily.css';
import { cleanUpV1, safeLocalStorage } from './legacy';
import { buildPool, dayNumber, questionFor, revealB, statement, type PoolData, type Question } from './daily/pool';
import { questionHtml } from './daily/view';
import { answer, currentStreak, load, save, shareText, type DailyRecord } from './daily/streak';
import { esc } from './present/format';

cleanUpV1(safeLocalStorage(), globalThis.location, globalThis.history);

const $ = (id: string) => document.getElementById(id)!;
const store = safeLocalStorage();

async function getJson<T>(name: string): Promise<T> {
  const r = await fetch(`/data/${name}.json`);
  if (!r.ok) throw new Error(`${name}.json ${r.status}`);
  return r.json() as Promise<T>;
}

function resultHtml(q: Question, day: number, right: boolean, rec: DailyRecord): string {
  const streak = currentStreak(rec, day);
  return `<p class="dq-a">${esc(statement(q))}</p>
<p class="dq-verdict ${right ? 'right' : 'wrong'}"><span aria-hidden="true">${right ? '✓' : '✗'}</span> ${right ? 'Right' : 'Not quite'}. It's ${esc(q.answer)}.</p>
<p class="dq-reveal">${esc(revealB(q))}</p>
<p class="dq-src">Every figure with its range and source: <a href="${esc(q.source.href)}">${esc(q.source.label)}</a>.</p>
<div class="dq-stats"><span><b class="num">${streak}</b> in a row</span><span><b class="num">${rec.best}</b> best</span><span><b class="num">${Object.keys(rec.played).length}</b> played</span></div>
<div class="dq-actions"><button type="button" class="btn solid" id="dq-share">Share your result</button><span class="dq-shared" id="dq-shared" role="status"></span></div>
<p class="dq-next">A new question tomorrow. Your answers and streak stay on this device; they're never sent to us.</p>`;
}

function start(d: PoolData) {
  const day = dayNumber(new Date());
  const q = questionFor(day, buildPool(d));
  $('dq-n').textContent = ` #${day}`;
  const box = $('dq');
  let rec = load(store);

  const showResult = () => {
    const right = rec.played[day] === 'right';
    box.innerHTML = resultHtml(q, day, right, rec);
    $('dq-share').addEventListener('click', async () => {
      const text = shareText(day, right, currentStreak(rec, day));
      try {
        if (navigator.share && matchMedia('(pointer: coarse)').matches) return void (await navigator.share({ text }));
        await navigator.clipboard.writeText(text);
        $('dq-shared').textContent = 'Copied. Paste it anywhere.';
      } catch (e) {
        if ((e as Error).name !== 'AbortError') $('dq-shared').textContent = text;
      }
    });
  };

  if (rec.played[day]) return showResult();
  // The build prebuilt the question for its own (UTC) day: wake it in place, unless your local day differs.
  if (box.dataset.day !== String(day) || !box.querySelector('[data-pick]')) box.innerHTML = questionHtml(q);
  box.dataset.day = String(day);
  for (const b of box.querySelectorAll<HTMLButtonElement>('[data-pick]')) {
    b.addEventListener('click', () => {
      rec = load(store); // another tab may have answered today already: its answer stands
      if (rec.played[day]) return showResult();
      rec = answer(rec, day, b.dataset.pick === q.answer);
      save(store, rec);
      showResult();
      ($('dq-share') as HTMLButtonElement).focus({ preventScroll: true });
    });
  }
}

Promise.all([getJson<PoolData['series']>('series'), getJson<PoolData['countries']>('countries'), getJson<PoolData['constants']>('constants'), getJson<PoolData['grids']>('grids'), getJson<PoolData['hubs']>('hubs')])
  .then(([series, countries, constants, grids, hubs]) => start({ series, countries, constants, grids, hubs }))
  .catch(() => {
    $('dq').innerHTML = "<p>Today's question couldn't load. Try again in a moment.</p>";
  });
