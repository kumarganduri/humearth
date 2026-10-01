import { describe, expect, it } from 'vitest';
import { bitsToPlan, decode, encode, planToBits, shareUrl, type SharedWorld } from './codec';
import { rng } from '../scene/geo';
import type { Buckets } from '../footprint/types';

const world = (over: Partial<SharedWorld> = {}): SharedWorld => ({
  seed: 20261002,
  biome: 'forest',
  buckets: { text: 2, images: 1, videos: 0 },
  plan: { fewerPictures: true, fewerVideos: false, lighterAi: true },
  ...over,
});

describe('share codec', () => {
  it('round-trips every answer combination and plan', () => {
    for (const text of [0, 1, 2, 3] as const)
      for (const images of [0, 1, 2] as const)
        for (const videos of [0, 1, 2] as const)
          for (let p = 0; p < 8; p++) {
            const w = world({ buckets: { text, images, videos } as Buckets, plan: bitsToPlan(p) });
            expect(decode(encode(w))).toEqual({ ok: true, world: w });
          }
  });

  it('round-trips the seed extremes', () => {
    for (const seed of [1, 0x7fffffff, 0xffffffff]) expect(decode(encode(world({ seed })))).toEqual({ ok: true, world: world({ seed }) });
  });

  it('is short and URL-safe', () => {
    const code = encode(world());
    expect(code).toMatch(/^w1\.[A-Za-z0-9_-]{12}$/);
  });

  it('accepts a leading #', () => {
    expect(decode(`#${encode(world())}`).ok).toBe(true);
  });

  it('rejects unknown versions, bad format and truncated links', () => {
    const code = encode(world());
    expect(decode(code.replace('w1.', 'w2.'))).toEqual({ ok: false, reason: 'version' });
    expect(decode('hello')).toEqual({ ok: false, reason: 'format' });
    expect(decode('w1.')).toEqual({ ok: false, reason: 'format' });
    expect(decode(code.slice(0, -3))).toEqual({ ok: false, reason: 'format' }); // chat app cut it off
    expect(decode('w1.<script>alert(1)</script>')).toEqual({ ok: false, reason: 'format' });
  });

  it('rejects every out-of-range field, including a zero seed', () => {
    const valid = bytesOf(encode(world()));
    const withByte = (i: number, v: number) => {
      const b = Uint8Array.from(valid);
      b[i] = v;
      return codeOf(b);
    };
    expect(decode(withByte(4, 1))).toEqual({ ok: false, reason: 'range' }); // biome
    expect(decode(withByte(5, 4))).toEqual({ ok: false, reason: 'range' }); // text
    expect(decode(withByte(6, 3))).toEqual({ ok: false, reason: 'range' }); // images
    expect(decode(withByte(7, 3))).toEqual({ ok: false, reason: 'range' }); // videos
    expect(decode(withByte(8, 8))).toEqual({ ok: false, reason: 'range' }); // unknown plan bit
    expect(decode(withByte(3, 0)).ok).toBe(true); // one seed byte can be zero...
    expect(decode(codeOf(new Uint8Array(9)))).toEqual({ ok: false, reason: 'range' }); // ...the whole seed can't
  });

  it('never throws and never accepts garbage (fuzz, 10k random strings)', () => {
    const r = rng(99);
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_.#=+/<>"\' ';
    for (let i = 0; i < 10_000; i++) {
      const len = Math.floor(r() * 24);
      let s = r() < 0.5 ? 'w1.' : '';
      for (let j = 0; j < len; j++) s += alphabet[Math.floor(r() * alphabet.length)];
      const res = decode(s);
      if (res.ok) expect(encode(res.world)).toBe(s.startsWith('#') ? s.slice(1) : s); // only canonical codes decode
    }
  });

  it('encode refuses an invalid world', () => {
    expect(() => encode(world({ seed: 0 }))).toThrow(RangeError);
    expect(() => encode(world({ seed: 2 ** 32 }))).toThrow(RangeError);
  });

  it('plan bits round-trip', () => {
    for (let p = 0; p < 8; p++) expect(planToBits(bitsToPlan(p))).toBe(p);
  });

  it('share URL carries ?s=1 for server-side share counting', () => {
    expect(shareUrl('https://humearth.org', world())).toMatch(/^https:\/\/humearth\.org\/\?s=1#w1\./);
  });
});

const codeOf = (b: Uint8Array) => `w1.${btoa(String.fromCharCode(...b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')}`;
const bytesOf = (code: string) => Uint8Array.from(atob(code.slice(3).replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
