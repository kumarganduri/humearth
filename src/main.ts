// Hum v2 entry point. The first screen is already in the HTML (src/hero.generated.html); this only wakes the
// year slider and Play, re-rendering with the same pure functions the build used (eng review D4).
//
//   load series + countries + constants ──ok──► enable slider / Play ──input──► setYear(y)
//                │                                                              ├ reading (range + caption)
//                └──fail──► keep the prebuilt hero, slider stays disabled,       ├ race rows (keyed: bars grow,
//                           show "couldn't load" note                            │  rows slide to their new place)
//                                                                                └ aria-valuetext ("2030: about 950 …")
import './base.css';
import './home.css';
import { cleanUpV1 } from './legacy';
import { captionFor, rangeWords } from './present/format';
import { raceFor, readingFor, UNIT_WORDS, yearOf, type HeroData } from './present/hero';
import { calculatorOutputs, clampUsage, outputsHtml } from './present/calculator';
import type { Constants } from './footprint/types';

cleanUpV1(globalThis.localStorage, globalThis.location, globalThis.history);

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const PLAY_STEP_MS = 650; // DESIGN.md Motion

async function getJson<T>(name: string): Promise<T> {
  const r = await fetch(`/data/${name}.json`);
  if (!r.ok) throw new Error(`${name}.json ${r.status}`);
  return r.json() as Promise<T>;
}

async function load(): Promise<HeroData> {
  const [series, countries, constants] = await Promise.all([
    getJson<HeroData['series']>('series'),
    getJson<HeroData['countries']>('countries'),
    getJson<HeroData['constants']>('constants'),
  ]);
  return { series, countries, constants };
}

/** Update the race in place: same <li> per key, so widths animate; then FLIP the rows into the new order. */
function updateRace(html: string) {
  const list = $('race').querySelector('ol');
  if (!list) return;
  const next = document.createElement('template');
  next.innerHTML = html;
  const before = new Map([...list.children].map((li) => [(li as HTMLElement).dataset.key!, li.getBoundingClientRect().top]));
  const ordered: HTMLElement[] = [];
  for (const fresh of next.content.querySelectorAll<HTMLElement>('li')) {
    const key = fresh.dataset.key!;
    const li = list.querySelector<HTMLElement>(`li[data-key="${CSS.escape(key)}"]`);
    if (!li) {
      ordered.push(fresh);
      continue;
    }
    li.className = fresh.className;
    const bar = li.querySelector<HTMLElement>('.bar')!;
    const freshBar = fresh.querySelector<HTMLElement>('.bar')!;
    bar.querySelector<HTMLElement>('.fill')!.style.width = freshBar.querySelector<HTMLElement>('.fill')!.style.width;
    for (const cls of ['band', 'ai']) {
      const have = bar.querySelector<HTMLElement>(`.${cls}`);
      const want = freshBar.querySelector<HTMLElement>(`.${cls}`);
      if (want && have) have.setAttribute('style', want.getAttribute('style') ?? '');
      else if (want && cls === 'band') bar.prepend(want); // paint order: band behind the bar
      else if (want) bar.append(want); // AI slice on top
      else have?.remove();
    }
    for (const cls of ['v', 'sr-only']) li.querySelector(`.${cls}`)!.textContent = fresh.querySelector(`.${cls}`)!.textContent;
    ordered.push(li);
  }
  for (const li of ordered) list.append(li);
  if (reduceMotion()) return;
  for (const li of ordered) {
    const was = before.get(li.dataset.key!);
    if (was === undefined) continue;
    const dy = was - li.getBoundingClientRect().top;
    if (!dy) continue;
    li.style.transition = 'none';
    li.style.transform = `translateY(${dy}px)`;
    requestAnimationFrame(() => {
      li.style.transition = 'transform 350ms ease-in-out';
      li.style.transform = '';
    });
  }
}

function start(d: HeroData) {
  const m = d.series.metrics.electricity;
  const first = m.years[0]!.year;
  const last = m.years[m.years.length - 1]!.year;
  const slider = $<HTMLInputElement>('slider');
  const play = $<HTMLButtonElement>('play');
  const playLabel = play.textContent ?? 'Play';
  let timer: number | undefined;

  const setYear = (year: number) => {
    const y = yearOf(m, year);
    slider.value = String(year);
    $('year').textContent = String(year);
    const words = rangeWords({ low: y.low.value, mid: y.mid.value ?? 0, high: y.high.value }, UNIT_WORDS);
    const how = captionFor(y).split(' · ')[1] ?? '';
    slider.setAttribute('aria-valuetext', `${year}: ${words}${how ? `; ${how}` : ''}`);
    $('reading').innerHTML = readingFor(d, year);
    updateRace(raceFor(d, year));
  };
  const stop = () => {
    if (timer !== undefined) clearInterval(timer);
    timer = undefined;
    play.textContent = playLabel;
    play.setAttribute('aria-pressed', 'false');
  };

  slider.addEventListener('input', () => {
    stop();
    setYear(Number(slider.value));
  });
  play.addEventListener('click', () => {
    if (timer !== undefined) return stop();
    if (reduceMotion()) return setYear(last); // no animation: jump to the end
    let year = Number(slider.value) >= last ? first : Number(slider.value);
    setYear(year);
    play.textContent = 'Pause';
    play.setAttribute('aria-pressed', 'true');
    timer = window.setInterval(() => {
      year += 1;
      if (year > last) return stop();
      setYear(year);
    }, PLAY_STEP_MS);
  });

  slider.disabled = false;
  play.disabled = false;
  setYear(m.latestMeasuredYear);
}

/** "Your part": every slider recomputes the week with the same engine the page was built with. */
function startCalculator(c: Constants) {
  const inputs = [...document.querySelectorAll<HTMLInputElement>('#your-part input[type=range]')];
  const update = () => {
    const usage = clampUsage(Object.fromEntries(inputs.map((i) => [i.dataset.k!, i.value])));
    for (const i of inputs) $(`v-${i.dataset.k}`).textContent = i.value;
    const o = calculatorOutputs(usage, c);
    $('calc-out').innerHTML = outputsHtml(o);
    $('calc-say').textContent = o.sentence;
  };
  for (const i of inputs) {
    i.addEventListener('input', update);
    i.disabled = false;
  }
}

load()
  .then((d) => {
    start(d);
    startCalculator(d.constants);
  })
  .catch(() => {
    // The prebuilt hero already shows the latest published year; only the slider is unavailable.
    $('slider-note').hidden = false;
  });
