// Quality tiers (eng review 10A, OV #6). Pure, so the rules are testable without a GPU.
//
//   warmup: ~1 s of frames on Earth -> pickTier(median frame time)
//   outside a dive: if the last ~2 s average under 24 fps on 'high' -> drop to 'low'
//   during a dive: the tier is locked (Stage) and never changes

export type Tier = 'high' | 'low';

export const WARMUP_FRAMES = 60;
export const HIGH_TIER_MAX_FRAME_MS = 22; // ~45 fps median or better stays 'high'
export const SLOW_FPS = 24;
export const SLOW_WINDOW_MS = 2000;

export function median(xs: number[]): number {
  if (xs.length === 0) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
}

export function pickTier(frameMs: number[]): Tier {
  return median(frameMs) <= HIGH_TIER_MAX_FRAME_MS ? 'high' : 'low';
}

/** Rolling slow-device detector for outside the dive. */
export class SlowWatch {
  private frames: number[] = [];
  private total = 0;

  /** Feed one frame's duration; returns true once the last ~2 s averaged under 24 fps. */
  push(frameMs: number): boolean {
    this.frames.push(frameMs);
    this.total += frameMs;
    while (this.total - (this.frames[0] ?? 0) >= SLOW_WINDOW_MS) this.total -= this.frames.shift()!;
    if (this.total < SLOW_WINDOW_MS * 0.95) return false; // not enough history yet
    return (this.frames.length / this.total) * 1000 < SLOW_FPS;
  }

  reset() {
    this.frames = [];
    this.total = 0;
  }
}

/** Renderer settings per tier: phones on 'low' trade sharpness and shadows for a smooth dive. */
export function tierSettings(tier: Tier, devicePixelRatio: number, isPhone: boolean) {
  return tier === 'high'
    ? { pixelRatio: Math.min(devicePixelRatio, isPhone ? 1.5 : 2), shadows: true }
    : { pixelRatio: Math.min(devicePixelRatio, 1), shadows: false };
}
