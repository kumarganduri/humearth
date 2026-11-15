// The front door (/). Everything is prebuilt by src/answers/pages.ts (homeBody) and reads with scripts off;
// this brings it to life:
//
//   globe ───── the night Earth: countries the world's data centres have passed light up (lazy: map + d3-geo)
//   counter ─── electricity used since the page opened, from the size ladder's yearly total (a derived number)
//   zoom ────── scroll from one question out to all data centres: circles drawn to true area, on one canvas
//   claims ──── tap a claim, Hum's verdict stamps down
//   lookup ──── the list is there before anyone types; it narrows as they type, and never ends at nothing
//   old globe links (/?year=, /?s=) forward to /earth with everything after the path kept

import './analytics';
import './base.css';
import './answers.css';
import './front.css';
import { esc } from './answers/render';
import { matches } from './answers/pure';
import { findRow, FIND_START } from './answers/pages';
import type { AnswersFile, Findable } from './answers/types';
import type { HubsFile } from './footprint/types';
import type { CountriesFile } from './footprint/series-types';

const loc = globalThis.location;
if (loc.pathname === '/' && /[?&](year|s)=/.test(loc.search)) loc.replace(`/earth${loc.search}${loc.hash}`);

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T | null;
const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const token = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

async function getJson<T>(name: string): Promise<T> {
  const r = await fetch(`/data/${name}.json`);
  if (!r.ok) throw new Error(`${name}.json ${r.status}`);
  return r.json() as Promise<T>;
}

/* ---------- the live counter ---------- */

function startCounter() {
  const box = $('counter'), out = $('ctr');
  if (!box || !out) return;
  const kwhPerSecond = Number(box.dataset.whYear) / 1000 / (365 * 24 * 3600);
  const t0 = performance.now();
  const tick = () => { out.textContent = Math.round(((performance.now() - t0) / 1000) * kwhPerSecond).toLocaleString('en-US'); };
  tick();
  setInterval(tick, reduceMotion() ? 1000 : 100);
}

/* ---------- the globe ---------- */

const PAUSE_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M9 6v12M15 6v12"/></svg>';
const PLAY_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M8 5l11 7-11 7z"/></svg>';

/** The globe is an enhancement: if the map can't load, the headline and the zoom say the same thing. */
async function startGlobe() {
  const host = $('globe');
  if (!host || typeof ResizeObserver === 'undefined') return;
  try {
    const [{ createGlobe }, world, hubs, countries] = await Promise.all([
      import('./globe/earth'),
      getJson<Parameters<typeof import('./globe/earth').createGlobe>[0]['world']>('world'),
      getJson<HubsFile>('hubs'),
      getJson<CountriesFile>('countries'),
    ]);
    const allWh = Number(host.dataset.wh);
    let spinning = !reduceMotion();
    const spin = $<HTMLButtonElement>('globe-spin')!;
    const show = (on: boolean) => { spinning = on; spin.innerHTML = on ? PAUSE_ICON : PLAY_ICON; spin.setAttribute('aria-label', on ? 'Stop turning' : 'Start turning'); };
    const g = createGlobe({
      host, world, hubs: hubs.hubs,
      tracked: new Set(countries.countries.map((c) => c.name)),
      reduceMotion: reduceMotion(),
      centred: true,
      onPick: () => {},
      onSpinChange: show,
    });
    // Lit: every country whose yearly electricity use is below what the world's data centres used.
    g.setLit(new Set(countries.countries.filter((c) => c.demandTWh * 1e12 <= allWh).map((c) => c.name)));
    show(spinning);
    spin.addEventListener('click', () => { g.setSpinning(!spinning); show(!spinning); });
    spin.closest<HTMLElement>('.globe-ctrls')!.hidden = false;
  } catch {
    host.classList.add('off');
  }
}

/* ---------- the zoom: from one question to the planet ---------- */

interface Step { wh: number; val: string; short: string; li: HTMLElement }

function startZoom() {
  const zone = $('zoom'), canvas = $<HTMLCanvasElement>('zc'), list = $('zoom-steps'), stepsBox = $('steps');
  if (!zone || !canvas || !list || !stepsBox) return;
  const steps: Step[] = [...list.querySelectorAll<HTMLElement>('li')].map((li) => ({ wh: Number(li.dataset.wh), val: li.dataset.val!, short: li.dataset.short!, li }));
  const ctx = canvas.getContext('2d');
  if (!ctx || steps.length < 2) return;
  const z: CanvasRenderingContext2D = ctx;
  zone.classList.add('live'); // the tall, sticky version; without this the steps read as a plain list
  const C = { ai: token('--color-ai'), dc: token('--color-data-centres'), muted: token('--color-text-muted') };
  let w = 0, h = 0, dpr = 1, shown = -1, queued = false;

  const fit = () => { dpr = Math.min(2, devicePixelRatio || 1); w = canvas.clientWidth; h = canvas.clientHeight; canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); };
  const progress = () => {
    const span = zone.offsetHeight - innerHeight;
    const p = span > 0 ? (scrollY - zone.offsetTop) / span : 0;
    return Math.min(1, Math.max(0, p)) * (steps.length - 1);
  };

  function draw() {
    queued = false;
    if (!w || !h) return;
    const p = progress();
    const i = Math.min(steps.length - 2, Math.floor(p)), t = p - i;
    // Hold on each step, then zoom: the size eases on a log scale between one step and the next.
    const e = t < 0.25 ? 0 : t > 0.85 ? 1 : (t - 0.25) / 0.6;
    const k = e * e * (3 - 2 * e);
    const now = Math.exp(Math.log(steps[i]!.wh) * (1 - k) + Math.log(steps[i + 1]!.wh) * k);
    const R = Math.min(w, h) * 0.4, cx = w / 2, cy = h / 2 + R * 0.06;
    z.setTransform(dpr, 0, 0, dpr, 0, 0);
    z.clearRect(0, 0, w, h);
    steps.forEach((s, j) => {
      const r = R * Math.sqrt(s.wh / now); // area-true: a circle's area is its electricity
      if (r > Math.hypot(w, h)) return;
      const last = j === steps.length - 1;
      z.beginPath();
      z.arc(cx, cy, Math.max(r, 0.6), 0, Math.PI * 2);
      if (last || j === 0) {
        const g = z.createRadialGradient(cx, cy, 0, cx, cy, Math.max(r, 1));
        const rgb = last ? '255,166,48' : '255,241,201';
        g.addColorStop(0, `rgba(${rgb},${last ? 0.55 : 0.95})`);
        g.addColorStop(1, `rgba(${rgb},${last ? 0.12 : 0.08})`);
        z.fillStyle = g;
      } else z.fillStyle = 'rgba(242,235,221,0.05)';
      z.fill();
      z.strokeStyle = last ? C.dc : j === 0 ? C.ai : 'rgba(242,235,221,0.55)';
      z.lineWidth = last ? 1.5 : 1.2;
      z.stroke();
      if (r >= 14 && r <= R * 1.25) {
        z.fillStyle = last ? C.ai : C.muted;
        z.font = "600 13px 'Atkinson Hyperlegible Mono', ui-monospace, monospace";
        z.textAlign = 'center';
        z.fillText(s.val, cx, cy - r - 8);
      }
    });
    // The biggest circle too small to label gets a pointer straight up, so you can see where it went.
    const tiny = steps.filter((s) => s.short && R * Math.sqrt(s.wh / now) < 14).at(-1);
    if (tiny) {
      const r = R * Math.sqrt(tiny.wh / now);
      z.strokeStyle = 'rgba(255,241,201,0.7)'; z.lineWidth = 1;
      z.beginPath(); z.moveTo(cx, cy - Math.max(r, 2) - 4); z.lineTo(cx, cy - 44); z.stroke();
      z.fillStyle = C.ai; z.textAlign = 'center';
      z.font = "600 12px 'Atkinson Hyperlegible Mono', ui-monospace, monospace";
      z.fillText(r < 1 ? `${tiny.short}: too small to see` : `${tiny.short}, ${tiny.val}`, cx, cy - 50);
    }
    const at = p < 0.15 ? 0 : k > 0.5 ? i + 1 : i;
    if (at !== shown) {
      shown = at;
      steps.forEach((s, j) => s.li.classList.toggle('now', j === at));
      [...stepsBox!.children].forEach((b, j) => (j === at ? b.setAttribute('aria-current', 'step') : b.removeAttribute('aria-current')));
    }
  }
  const later = () => { if (!queued) { queued = true; requestAnimationFrame(draw); } };

  [...stepsBox.children].forEach((b, j) => b.addEventListener('click', () => {
    const top = zone.offsetTop + (j / (steps.length - 1)) * (zone.offsetHeight - innerHeight) + 1;
    scrollTo({ top, behavior: reduceMotion() ? 'auto' : 'smooth' });
  }));
  addEventListener('scroll', later, { passive: true });
  new ResizeObserver(() => { fit(); later(); }).observe(canvas);
  fit();
  draw();
}

/* ---------- claims: tap to stamp ---------- */

function startClaims() {
  const cards = [...document.querySelectorAll<HTMLElement>('#claims .fd-claim')];
  const score = $('score');
  let opened = 0;
  for (const card of cards) {
    const tap = card.querySelector<HTMLButtonElement>('.tap')!;
    const open = () => {
      if (card.classList.contains('open')) return;
      card.classList.add('open');
      tap.setAttribute('aria-expanded', 'true');
      opened++;
      if (score) score.textContent = opened < cards.length ? `${opened} of ${cards.length} checked.` : `All ${cards.length} checked. Every verdict links to its sources.`;
      card.querySelector<HTMLElement>('.more')?.focus({ preventScroll: true });
    };
    tap.addEventListener('click', open);
    card.addEventListener('click', (e) => { if (!(e.target as HTMLElement).closest('a')) open(); });
  }
}

/* ---------- the takeaway ---------- */

function startTakeaway() {
  const btn = $('copy-take'), out = $('copied');
  if (!btn || !out) return;
  btn.addEventListener('click', async () => {
    const lines = [...document.querySelectorAll('#take > div')].map((d) => `• ${d.querySelector('.big')!.textContent} ${d.querySelector('.src')!.textContent}`);
    const text = `Three things to remember, from Hum:\n${lines.join('\n')}\nhttps://humearth.org`;
    try { await navigator.clipboard.writeText(text); out.textContent = 'Copied. Paste it anywhere.'; }
    catch { out.textContent = 'Couldn’t copy here. Select the three lines above instead.'; }
  });
}

/* ---------- the lookup ---------- */

type Data = AnswersFile;

function startLookup() {
  const input = $<HTMLInputElement>('q'), list = $('picks'), note = $('q-note');
  if (!input || !list || !note) return;
  let data: Data | null = null;
  const load = () => (data ? Promise.resolve(data) : getJson<Data>('answers').then((d) => (data = d)));
  input.addEventListener('focus', () => void load().catch(() => {}), { once: true });
  input.addEventListener('input', async () => {
    const v = input.value.trim();
    const d = await load().catch(() => null);
    if (!d || input.value.trim() !== v) return;
    const bySlug = new Map(d.answers.map((a) => [a.slug, a]));
    const start = FIND_START.map((s) => bySlug.get(s)).filter((a): a is Data['answers'][number] => !!a);
    if (!v) { list.innerHTML = start.map(findRow).join(''); note.textContent = `${d.answers.length} checked answers. Pick one, or type to narrow the list.`; return; }
    const hits = matches<Findable & { stamp?: Data['answers'][number]['stamp']; result?: string }>(v, [...d.answers, ...(d.pages ?? [])]);
    if (hits.length) {
      list.innerHTML = hits.map((h) => (h.href ? `<li><a href="${h.href}"><span class="q">${esc(h.q)}</span><span></span><span class="r">${esc(h.sub ?? '')}</span></a></li>` : findRow(bySlug.get(h.slug!)!))).join('');
      note.textContent = `${hits.length} ${hits.length === 1 ? 'answer' : 'answers'} for “${v}”.`;
    } else {
      list.innerHTML = start.slice(0, 4).map(findRow).join('');
      note.textContent = `Hum checks claims about the electricity, water and CO₂ of AI and data centres, so there’s nothing on “${v}” yet. People often start with these:`;
    }
  });
}

if (typeof document !== 'undefined') {
  startCounter();
  startZoom();
  startClaims();
  startTakeaway();
  startLookup();
  void startGlobe();
}
