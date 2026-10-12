// Hum v2 entry point. The first screen is already in the HTML (src/hero.generated.html); this wakes the
// year slider and Play, re-rendering with the same pure functions the build used (eng review D4), and then
// lazily brings in the globe (d3-geo + world map), so the first paint never waits for it.
//
//   load series + countries + constants ──ok──► enable slider / Play ──input──► setYear(y)
//                │                          │                                   ├ reading (range + caption)
//                │                          └─► import globe, world, hubs ──►   ├ globe: countries passed light up
//                │                                                              ├ passed list + phone summary
//                └──fail──► keep the prebuilt page, slider stays disabled,      ├ race rows (keyed: bars grow,
//                           show "couldn't load" note                           │  rows slide to their new place)
//                                                                               └ aria-valuetext ("2030: about 950 …")
import './analytics'; // visitor counts, real site only
import './base.css';
import './home.css';
import './hero.generated.css'; // the prebuilt hero's styles (moved out of style="" for the CSP)
import { cleanUpV1, safeLocalStorage } from './legacy';
import { captionFor, rangeWords } from './present/format';
import { raceFor, readingFor, UNIT_WORDS, yearOf, type HeroData } from './present/hero';
import { calculatorOutputs, clampUsage, outputsHtml } from './present/calculator';
import { reduceBarsHtml } from './present/reduce';
import { applyStyleData, stylesToData } from './present/inline-styles';
import { readYear, yearSearch } from './present/links';
import { replaceSearch } from './present/url';
import { countryNote, passedCount, passedFor, passedListHtml, passedShort } from './present/earth';
import type { Constants, HubsFile } from './footprint/types';
import type { Globe } from './globe/earth';
import type { HumSynth } from './sound/synth';
import { humFor, type HumTone } from './sound/hum';

cleanUpV1(safeLocalStorage(), globalThis.location, globalThis.history);

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

/** Copy inline styles through the CSSOM (never setAttribute('style'): the CSP refuses it). */
function copyStyle(from: HTMLElement, to: HTMLElement) {
  for (const prop of [...to.style]) to.style.removeProperty(prop);
  for (const prop of [...from.style]) to.style.setProperty(prop, from.style.getPropertyValue(prop));
}

/** Update the race in place: same <li> per key, so widths animate; then FLIP the rows into the new order. */
function updateRace(html: string) {
  const list = $('race').querySelector('ol');
  if (!list) return;
  const next = document.createElement('template');
  next.innerHTML = stylesToData(html); // the CSP refuses style=""; never hand one to the parser
  applyStyleData(next.content);
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
      if (want && have) copyStyle(want, have);
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

let globe: Globe | undefined;
let hum: HumSynth | undefined;

/** "The hum": opt-in, never remembered. The audio context is made inside the tap (Safari), the synth's
 *  code arrives after; the button always ends where it says, however fast it's pressed. */
function startHum(tone: () => HumTone) {
  const btn = $<HTMLButtonElement>('hum');
  if (!btn || typeof AudioContext === 'undefined') return;
  let on = false;
  let ctx: AudioContext | undefined;
  let loading: Promise<void> | undefined;
  btn.addEventListener('click', () => {
    on = !on;
    btn.setAttribute('aria-pressed', String(on));
    btn.setAttribute('aria-label', on ? 'Turn off the hum' : 'Turn on the hum');
    if (!ctx) {
      ctx = new AudioContext(); // inside the tap
      void ctx.resume();
    }
    loading ??= import('./sound/synth').then(({ createHumSynth }) => {
      hum = createHumSynth(ctx!);
      hum.setTone(tone());
    });
    void loading.then(() => hum!.setEnabled(on));
  });
}
const litIn = (d: HeroData, year: number) => new Set(passedFor(d, year).filter((r) => r.on).map((r) => r.name));

/** The globe is an enhancement: if anything here fails, the list beside it already says the same thing. */
async function startGlobe(d: HeroData, year: () => number) {
  const host = $('globe');
  if (!host || typeof ResizeObserver === 'undefined') return;
  const [{ createGlobe }, world, hubs] = await Promise.all([
    import('./globe/earth'),
    getJson<Parameters<typeof import('./globe/earth').createGlobe>[0]['world']>('world'),
    getJson<HubsFile>('hubs'),
  ]);
  const tip = $('tip');
  globe = createGlobe({
    host,
    world,
    hubs: hubs.hubs,
    tracked: new Set(d.countries.countries.map((c) => c.name)),
    reduceMotion: reduceMotion(),
    onSpinChange: (on) => onSpinChange?.(on),
    onPick(name, at) {
      if (!name) return void (tip.hidden = true);
      tip.innerHTML = countryNote(d, name);
      tip.hidden = false;
      const max = host.clientWidth - tip.offsetWidth - 8;
      tip.style.left = `${Math.max(8, Math.min(at.x + 12, max))}px`;
      tip.style.top = `${Math.min(at.y + 12, host.clientHeight - tip.offsetHeight - 8)}px`;
    },
  });
  globe.setLit(litIn(d, year()));
  startGlobeControls(globe);
}

const PAUSE_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M9 6v12M15 6v12"/></svg>';
const PLAY_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M8 5l11 7-11 7z"/></svg>';
const TURN_DEG = 30;

/** Pause / start the slow turn, and turn by buttons: the globe can be stopped and turned without dragging. */
function startGlobeControls(g: Globe) {
  const spin = $<HTMLButtonElement>('globe-spin');
  let spinning = !reduceMotion();
  const show = (on: boolean) => {
    spinning = on;
    spin.innerHTML = on ? PAUSE_ICON : PLAY_ICON;
    spin.setAttribute('aria-label', on ? 'Stop turning' : 'Start turning');
  };
  show(spinning);
  spin.addEventListener('click', () => g.setSpinning(!spinning));
  $('globe-west').addEventListener('click', () => g.turn(TURN_DEG));
  $('globe-east').addEventListener('click', () => g.turn(-TURN_DEG));
  onSpinChange = show;
  $('globe-ctrls').hidden = false;
}
let onSpinChange: ((on: boolean) => void) | undefined;

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
    slider.setAttribute('aria-valuetext', `${year}: ${words}${how ? `; ${how}` : ''}; ${passedCount(d, year)}`);
    $('reading').innerHTML = readingFor(d, year);
    updatePassed(d, year);
    $('side-year').textContent = String(year);
    updateRace(raceFor(d, year));
    globe?.setLit(litIn(d, year));
    hum?.setTone(humFor(m, year));
  };
  startHum(() => humFor(m, Number(slider.value)));
  // The year lives in the link (?year=2030), written when a choice settles: slider released, Play ended.
  const syncUrl = () => replaceSearch(yearSearch(Number(slider.value), m.latestMeasuredYear));
  const stop = () => {
    if (timer !== undefined) clearInterval(timer);
    timer = undefined;
    play.textContent = playLabel;
    play.setAttribute('aria-pressed', 'false');
    syncUrl();
  };

  slider.addEventListener('input', () => {
    if (timer !== undefined) stop();
    setYear(Number(slider.value));
  });
  slider.addEventListener('change', syncUrl);
  play.addEventListener('click', () => {
    if (timer !== undefined) return stop();
    if (reduceMotion()) return (setYear(last), syncUrl()); // no animation: jump to the end
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
  setYear(readYear(location.search, first, last) ?? m.latestMeasuredYear);
  startGlobe(d, () => Number(slider.value)).catch(() => {
    $('globe').classList.add('off'); // no empty placeholder: the passed list and race still tell the story
  });
}

/** Re-render the passed list in place (keyed by country), so only the classes and the count change. */
function updatePassed(d: HeroData, year: number) {
  const box = $('passed');
  const next = document.createElement('template');
  next.innerHTML = passedListHtml(d, year);
  const list = box.querySelector('ol');
  if (!list) return void box.replaceChildren(next.content);
  $('passed-n').textContent = next.content.querySelector('#passed-n')!.textContent;
  for (const fresh of next.content.querySelectorAll<HTMLElement>('li')) {
    const li = list.querySelector<HTMLElement>(`li[data-key="${CSS.escape(fresh.dataset.key!)}"]`);
    if (li && li.innerHTML !== fresh.innerHTML) li.innerHTML = fresh.innerHTML;
    if (li) li.className = fresh.className;
  }
  $('passed-short').textContent = passedShort(d, year);
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
    // "What actually reduces it" follows your answers (bar widths go through the CSSOM: CSP).
    const cuts = $('cuts');
    cuts.innerHTML = stylesToData(reduceBarsHtml(usage, c));
    applyStyleData(cuts);
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
