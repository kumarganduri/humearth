// The night Earth (DESIGN.md v2: "Lights at Night"). Loaded lazily by main.ts after the first paint, so the
// first screen stays small: d3-geo + world.json + hubs.json arrive only when the page is up.
//
//   canvas (2D, orthographic) ── countries ── lit amber when data centres' middle figure passes them (flash on crossing)
//                              ├─ hubs ─────── glows sized by power capacity (today's figure; no per-hub history)
//                              └─ input ────── drag to turn (horizontal; vertical swipes still scroll the page),
//                                              tap a country for its note; auto-turn pauses on touch,
//                                              when off-screen, when the tab is hidden, and with reduced motion
//
// Colours come from the CSS tokens, so DESIGN.md stays the one source.

import { geoContains, geoDistance, geoGraticule10, geoOrthographic, geoPath, type GeoPermissibleObjects } from 'd3-geo';
import type { Feature, FeatureCollection, Geometry } from 'geojson';
import type { Hub } from '../footprint/types';

export interface GlobeOptions {
  host: HTMLElement;
  world: FeatureCollection<Geometry, { name: string }>;
  hubs: Hub[];
  /** Countries Hum compares against (lit when passed); everything else stays dark. */
  tracked: Set<string>;
  reduceMotion: boolean;
  onPick: (name: string | null, at: { x: number; y: number }) => void;
}

export interface Globe {
  /** Light exactly these countries; newly lit ones flash. */
  setLit(names: Set<string>): void;
  destroy(): void;
}

/** Halo reach as a multiple of the globe radius; fitGlobe keeps it inside the canvas (no hard edge). */
export const HALO = 1.12;

/** Where the globe sits: centred on phones, right of centre beside the headline on wide screens. */
export function fitGlobe(w: number, h: number, wide: boolean): { scale: number; cx: number; cy: number } {
  if (!wide) return { scale: Math.min(w, h) * 0.44, cx: w / 2, cy: h / 2 };
  return { scale: Math.min(w * 0.31, h * 0.44), cx: w * 0.64, cy: h * 0.5 };
}

/** Hub glow radius in px: area grows with capacity (sqrt), so a hub twice as big doesn't look four times as big. */
export const hubRadius = (mw: number, maxMw: number) => 2 + 9 * Math.sqrt(Math.max(0, mw) / maxMw);

/** Flash strength 0..1, fading over 900 ms after a country is passed. */
export const flashAt = (since: number | undefined, now: number) => (since === undefined ? 0 : Math.max(0, 1 - (now - since) / 900));

const FLASH_MS = 900;
/** The globe opens over the Atlantic: the Americas and Europe, where most compared countries and hubs are. */
export const START_ROTATION: [number, number, number] = [40, -28, 0];
const SPIN_DEG_PER_MS = 0.004;
/** Auto-spin redraws at most ~30 times a second (drags and flashes still draw every frame): half the work,
 *  kinder to phone batteries, and it stopped CI's software renderer from starving the browser. */
const SPIN_FRAME_MS = 33;

function token(name: string, fallback: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}
function rgba(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

export function createGlobe(o: GlobeOptions): Globe {
  const canvas = document.createElement('canvas');
  canvas.className = 'globe-canvas';
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', 'A turning Earth at night. Countries light up when the world\'s data centres use more electricity than they do; the list beside it says which.');
  o.host.append(canvas);
  const ctx = canvas.getContext('2d')!;

  const C = {
    dc: token('--color-data-centres', '#FFA630'),
    ai: token('--color-ai', '#FFF1C9'),
    surface: token('--color-surface', '#161A23'),
    rule: token('--color-rule', '#2A3038'),
  };
  const proj = geoOrthographic().clipAngle(90).precision(0.6);
  const path = geoPath(proj, ctx);
  const graticule = geoGraticule10();
  const maxMw = Math.max(...o.hubs.map((h) => h.mw.mid));
  // Start over the Atlantic: the Americas and Europe, where most of the compared countries and hubs are.
  const rot: [number, number, number] = [...START_ROTATION];
  let w = 0;
  let h = 0;
  let lit = new Set<string>();
  const flash = new Map<string, number>();
  let spinning = !o.reduceMotion;
  let visible = true;
  let raf = 0;
  let last = 0;
  let dirty = true;
  let spun = false;
  let lastDraw = 0;

  const size = () => {
    const r = o.host.getBoundingClientRect();
    const dpr = Math.min(2, devicePixelRatio || 1);
    w = r.width;
    h = r.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const f = fitGlobe(w, h, matchMedia('(min-width: 860px)').matches);
    proj.scale(f.scale).translate([f.cx, f.cy]);
    dirty = true;
  };

  const draw = (now: number) => {
    ctx.clearRect(0, 0, w, h);
    proj.rotate(rot);
    const [cx, cy] = proj.translate();
    const s = proj.scale();
    const halo = ctx.createRadialGradient(cx, cy, s * 0.92, cx, cy, s * HALO);
    halo.addColorStop(0, rgba(C.dc, 0.07));
    halo.addColorStop(1, rgba(C.dc, 0));
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(cx, cy, s * HALO, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    path({ type: 'Sphere' });
    ctx.fillStyle = '#0E131C';
    ctx.fill();
    ctx.beginPath();
    path(graticule);
    ctx.strokeStyle = rgba(C.rule, 0.55);
    ctx.lineWidth = 0.6;
    ctx.stroke();
    let flashing = false;
    for (const f of o.world.features) {
      const name = f.properties.name;
      const tracked = o.tracked.has(name);
      ctx.beginPath();
      path(f as GeoPermissibleObjects);
      if (tracked && lit.has(name)) {
        const k = o.reduceMotion ? 0 : flashAt(flash.get(name), now);
        if (k > 0) flashing = true;
        ctx.fillStyle = rgba(C.dc, 0.55 + 0.4 * k);
      } else ctx.fillStyle = tracked ? '#1E2532' : C.surface;
      ctx.fill();
      ctx.strokeStyle = tracked ? '#3A4352' : '#232934';
      ctx.lineWidth = 0.6;
      ctx.stroke();
    }
    const centre: [number, number] = [-rot[0], -rot[1]];
    for (const hub of o.hubs) {
      if (geoDistance([hub.lon, hub.lat], centre) >= Math.PI / 2) continue; // far side
      const p = proj([hub.lon, hub.lat]);
      if (!p) continue;
      const r = hubRadius(hub.mw.mid, maxMw) * 3;
      const g = ctx.createRadialGradient(p[0], p[1], 0, p[0], p[1], r);
      g.addColorStop(0, rgba(C.ai, 0.95));
      g.addColorStop(0.25, rgba(C.dc, 0.6));
      g.addColorStop(1, rgba(C.dc, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(p[0], p[1], r, 0, Math.PI * 2);
      ctx.fill();
    }
    dirty = flashing;
  };

  const loop = (now: number) => {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(64, now - last);
    last = now;
    if (!visible) return;
    if (spinning) {
      rot[0] = (rot[0] + dt * SPIN_DEG_PER_MS) % 360;
      spun = true;
    }
    if (dirty || (spun && now - lastDraw >= SPIN_FRAME_MS)) {
      draw(now);
      lastDraw = now;
      spun = false;
    }
  };

  // Drag to turn. Pointer events cover mouse, pen and touch; touch-action: pan-y in CSS keeps vertical
  // swipes for scrolling the page.
  let drag: { x: number; y: number; moved: boolean } | null = null;
  const onDown = (e: PointerEvent) => {
    drag = { x: e.clientX, y: e.clientY, moved: false };
    canvas.setPointerCapture(e.pointerId);
  };
  const onMove = (e: PointerEvent) => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;
    if (!drag.moved && Math.hypot(dx, dy) < 4) return;
    if (!drag.moved) {
      drag.moved = true;
      spinning = false;
      o.onPick(null, { x: 0, y: 0 });
    }
    rot[0] += dx * 0.35;
    rot[1] = Math.max(-80, Math.min(80, rot[1] - dy * 0.35));
    drag.x = e.clientX;
    drag.y = e.clientY;
    dirty = true;
  };
  const onUp = (e: PointerEvent) => {
    const wasTap = drag && !drag.moved;
    drag = null;
    if (!wasTap) return;
    const r = canvas.getBoundingClientRect();
    const at = { x: e.clientX - r.left, y: e.clientY - r.top };
    const ll = proj.invert?.([at.x, at.y]);
    const onSphere = ll && geoDistance(ll, [-rot[0], -rot[1]]) < Math.PI / 2;
    const f = onSphere ? o.world.features.find((x) => geoContains(x as Feature, ll)) : undefined;
    o.onPick(f ? f.properties.name : null, at);
  };
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', () => (drag = null));

  const ro = new ResizeObserver(size);
  ro.observe(o.host);
  const io = new IntersectionObserver(([en]) => (visible = Boolean(en?.isIntersecting)));
  io.observe(o.host);
  const onVis = () => (visible = !document.hidden);
  document.addEventListener('visibilitychange', onVis);

  size();
  raf = requestAnimationFrame((t) => {
    last = t;
    loop(t);
  });

  return {
    setLit(names) {
      const now = performance.now();
      for (const n of names) if (!lit.has(n)) flash.set(n, now);
      for (const [n, t] of flash) if (now - t > FLASH_MS) flash.delete(n);
      lit = new Set(names);
      dirty = true;
    },
    destroy() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      canvas.remove();
    },
  };
}
