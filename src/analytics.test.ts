import { describe, expect, it } from 'vitest';
import { shouldCount } from './analytics';

describe('visitor counting', () => {
  it('only the real site counts, and only once a token is set', () => {
    expect(shouldCount('humearth.org', 'abc')).toBe(true);
    expect(shouldCount('www.humearth.org', 'abc')).toBe(true);
    for (const h of ['localhost', '127.0.0.1', 'hum-v2.humearth.pages.dev', 'humearth.pages.dev', 'evilhumearth.org']) expect(shouldCount(h, 'abc')).toBe(false);
    expect(shouldCount('humearth.org', '')).toBe(false);
  });
});
