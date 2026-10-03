// Scales and axis ticks for Hum's two charts (eng review D9: hand-written, no chart library).

/** Maps [d0, d1] onto [r0, r1] in a straight line. */
export function linear(d0: number, d1: number, r0: number, r1: number): (x: number) => number {
  const span = d1 - d0 || 1;
  return (x) => r0 + ((x - d0) / span) * (r1 - r0);
}

/** A tick step from the 1-2-5 family that gives about `count` ticks up to max. */
export function niceStep(max: number, count = 4): number {
  if (!(max > 0)) return 1;
  const raw = max / count;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const f = raw / pow;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * pow;
}

/** The smallest multiple of the nice step that is >= max: a clean top for an axis. */
export function niceMax(max: number, count = 4): number {
  if (!(max > 0)) return 0;
  const step = niceStep(max, count);
  return Math.ceil(max / step - 1e-9) * step;
}

/** Ticks 0, step, 2·step … niceMax(max). */
export function ticks(max: number, count = 4): number[] {
  const step = niceStep(max, count);
  const top = niceMax(max, count);
  const out: number[] = [];
  for (let t = 0; t <= top + step / 2; t += step) out.push(Math.round(t * 1e6) / 1e6);
  return out;
}
