// Poster view: still images instead of 3D. Used before three.js loads, when WebGL is missing,
// and while a lost GPU context is gone (state table 3A, decision 7A). Dives are instant.
// The world poster still "goes quiet": colour drains with the same health numbers.

import type { View, ViewCallbacks } from './view';
import { CHANNELS } from '../footprint/types';

export function posterHealthFilter(health: Record<'co2' | 'water' | 'energy', number>): string {
  const avg = CHANNELS.reduce((s, c) => s + health[c], 0) / CHANNELS.length;
  return `saturate(${(0.35 + 0.65 * avg).toFixed(2)}) brightness(${(0.9 + 0.1 * avg).toFixed(2)})`;
}

export function createPosterView(el: { earth: HTMLElement; world: HTMLElement }, cb: ViewCallbacks): View {
  const show = (place: 'earth' | 'world') => {
    el.earth.hidden = place !== 'earth';
    el.world.hidden = place !== 'world';
  };
  show('earth');
  // Callbacks run on the next tick, like the end of a real dive, so the controller sees a normal phase change.
  const later = (fn: () => void) => window.setTimeout(fn, 0);
  return {
    kind: 'poster',
    dive() {
      cb.onPhase('diving');
      later(() => {
        show('world');
        cb.onPhase('world');
      });
    },
    back() {
      cb.onPhase('returning');
      later(() => {
        show('earth');
        cb.onPhase('earth');
      });
    },
    skip() {},
    showWorld() {},
    setHealth(health) {
      el.world.style.filter = posterHealthFilter(health);
    },
    setPlot() {},
    turnToward() {},
    setIdleSpin() {},
    jumpTo(place) {
      show(place);
    },
    dispose() {
      el.earth.hidden = true;
      el.world.hidden = true;
    },
  };
}
