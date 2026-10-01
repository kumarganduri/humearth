// What the controller needs from "the picture": the 3D stage, or the poster fallback.
// main.ts talks only to this interface, so a phone without WebGL, a lost GPU context,
// and the moment before three.js has loaded all use the same code path.

import type { AnimalState } from '../footprint/engine';
import type { Channel } from '../footprint/types';

export type ViewPhase = 'earth' | 'diving' | 'world' | 'returning';

export interface ViewCallbacks {
  onPhase(p: ViewPhase): void;
}

export interface View {
  readonly kind: '3d' | 'poster';
  dive(lat: number, lon: number): void;
  back(): void;
  skip(): void;
  /** Show the world for this seed (rebuilds the diorama when the seed changes). */
  showWorld(seed: number): void;
  setHealth(health: Record<Channel, number>, animals: AnimalState): void;
  setPlot(spot: { lat: number; lon: number } | null): void;
  turnToward(lat: number, lon: number, amount: number): void;
  setIdleSpin(on: boolean): void;
  /** Jump to a place with no animation (when this view takes over from another). */
  jumpTo(place: 'earth' | 'world'): void;
  dispose(): void;
}
