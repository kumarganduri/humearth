// The 3D view: globe + diorama + stage behind the View interface. Loaded as its own chunk
// (eng review 9A) so three.js never blocks the first screen.

import { buildGlobe } from './globe';
import { buildWorld } from './world';
import { Stage } from './stage';
import type { Tier } from './tier';
import type { View, ViewCallbacks } from '../view/view';
import type { Hub } from '../footprint/types';

export interface View3DOptions extends ViewCallbacks {
  canvas: HTMLCanvasElement;
  hubs: Hub[];
  reducedMotion: () => boolean;
  isPhone: boolean;
  onTier(t: Tier): void;
  onContextLost(): void;
  onContextRestored(): void;
}

/** Give the browser a turn between heavy steps, so a tap during loading still responds. */
const yieldToBrowser = () => new Promise<void>((r) => setTimeout(r, 0));

export async function createView3D(o: View3DOptions): Promise<View & { setTier(t: Tier): void }> {
  const globe = buildGlobe(o.hubs);
  await yieldToBrowser();
  let seed = 1;
  let world = buildWorld(seed);
  await yieldToBrowser();
  const stage = new Stage({
    canvas: o.canvas,
    globe,
    world,
    reducedMotion: o.reducedMotion,
    isPhone: o.isPhone,
    onPhase: o.onPhase,
    onTier: o.onTier,
    onContextLost: o.onContextLost,
    onContextRestored: o.onContextRestored,
  });
  await yieldToBrowser();
  await stage.precompile(); // compile shaders off the critical path where the browser allows it
  stage.start();
  return {
    kind: '3d',
    dive: (lat, lon) => stage.dive(lat, lon),
    back: () => stage.back(),
    skip: () => stage.skip(),
    showWorld(s) {
      if (s === seed) return;
      seed = s;
      world = buildWorld(s);
      stage.setWorld(world);
    },
    setHealth: (h, a) => world.setHealth(h, a),
    setPlot: (spot) => globe.setPlot(spot),
    turnToward: (lat, lon, amount) => stage.turnToward(lat, lon, amount),
    setIdleSpin: (on) => stage.setIdleSpin(on),
    jumpTo: (place) => {
      world.settle();
      stage.jumpTo(place);
    },
    setTier: (t) => stage.setTier(t),
    dispose: () => stage.pause(),
  };
}
