// Share-link codec (eng review 3A). A world travels as `#w1.<code>`: 9 bytes, base64url.
//
//   byte 0-3  seed      uint32, big-endian (never 0)
//   byte 4    biome     0 = forest (only biome in Phase 1)
//   byte 5    text      0-3   how often you ask AI
//   byte 6    images    0-2   AI pictures
//   byte 7    videos    0-2   AI videos
//   byte 8    plan      bitmask: 1 fewer pictures, 2 fewer videos, 4 a lighter AI
//
// The decoder accepts only these numbers and enums. Anything else is "moved away": no raw text
// from a link ever reaches the page.

import type { Buckets, Plan } from '../footprint/types';

export const VERSION = 'w1';
export const BIOMES = ['forest'] as const;
export type Biome = (typeof BIOMES)[number];

export interface SharedWorld {
  seed: number;
  biome: Biome;
  buckets: Buckets;
  plan: Plan;
}

const PLAN_BITS = { fewerPictures: 1, fewerVideos: 2, lighterAi: 4 } as const;
const PLAN_MASK = 7;
const BYTES = 9;

export function planToBits(p: Plan): number {
  return (p.fewerPictures ? 1 : 0) | (p.fewerVideos ? 2 : 0) | (p.lighterAi ? 4 : 0);
}

export function bitsToPlan(b: number): Plan {
  return {
    fewerPictures: (b & PLAN_BITS.fewerPictures) !== 0,
    fewerVideos: (b & PLAN_BITS.fewerVideos) !== 0,
    lighterAi: (b & PLAN_BITS.lighterAi) !== 0,
  };
}

function toBase64Url(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(s: string): Uint8Array | null {
  if (!/^[A-Za-z0-9_-]+$/.test(s)) return null;
  try {
    const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4));
    return Uint8Array.from(bin, (c) => c.charCodeAt(0));
  } catch {
    return null;
  }
}

export function isValidSeed(seed: number): boolean {
  return Number.isInteger(seed) && seed > 0 && seed <= 0xffffffff;
}

/** `w1.<code>` (no leading #). Throws on an invalid world: that's a programming error, not user input. */
export function encode(w: SharedWorld): string {
  if (!isValidSeed(w.seed)) throw new RangeError(`bad seed ${w.seed}`);
  const biome = BIOMES.indexOf(w.biome);
  if (biome < 0) throw new RangeError(`bad biome ${w.biome}`);
  const b = new Uint8Array(BYTES);
  new DataView(b.buffer).setUint32(0, w.seed >>> 0);
  b[4] = biome;
  b[5] = w.buckets.text;
  b[6] = w.buckets.images;
  b[7] = w.buckets.videos;
  b[8] = planToBits(w.plan);
  return `${VERSION}.${toBase64Url(b)}`;
}

export type DecodeResult = { ok: true; world: SharedWorld } | { ok: false; reason: 'version' | 'format' | 'range' };

/** Accepts `#w1.<code>`, `w1.<code>`, or a full hash string. */
export function decode(raw: string): DecodeResult {
  const s = raw.startsWith('#') ? raw.slice(1) : raw;
  const dot = s.indexOf('.');
  if (dot < 0) return { ok: false, reason: 'format' };
  if (s.slice(0, dot) !== VERSION) return { ok: false, reason: 'version' };
  const bytes = fromBase64Url(s.slice(dot + 1));
  if (!bytes || bytes.length !== BYTES) return { ok: false, reason: 'format' };
  const seed = new DataView(bytes.buffer).getUint32(0);
  const [biome, text, images, videos, plan] = [bytes[4]!, bytes[5]!, bytes[6]!, bytes[7]!, bytes[8]!];
  if (!isValidSeed(seed) || biome >= BIOMES.length || text > 3 || images > 2 || videos > 2 || (plan & ~PLAN_MASK) !== 0) {
    return { ok: false, reason: 'range' };
  }
  return {
    ok: true,
    world: {
      seed,
      biome: BIOMES[biome]!,
      buckets: { text, images, videos } as Buckets,
      plan: bitsToPlan(plan),
    },
  };
}

/** A share link: `?s=1` lets Cloudflare count share opens server-side with no script (OV #8). */
export function shareUrl(origin: string, w: SharedWorld): string {
  return `${origin}/?s=1#${encode(w)}`;
}
