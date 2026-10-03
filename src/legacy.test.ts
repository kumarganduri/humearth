import { describe, expect, it, vi } from 'vitest';
import { cleanUpV1 } from './legacy';

const hist = () => ({ replaceState: vi.fn() });
const store = () => ({ removeItem: vi.fn() });

describe('cleanUpV1: v1 leftovers are removed quietly', () => {
  it('removes the saved world and the sound setting', () => {
    const s = store();
    cleanUpV1(s, { hash: '', pathname: '/', search: '' }, hist());
    expect(s.removeItem.mock.calls.map((c) => c[0])).toEqual(['hum.world', 'hum.sound']);
  });

  it('strips an old share link (#w1.… and ?s=1), keeping the page and other query params', () => {
    const h = hist();
    cleanUpV1(store(), { hash: '#w1.BYPm9wAAAQIA', pathname: '/', search: '?s=1' }, h);
    expect(h.replaceState).toHaveBeenCalledWith(null, '', '/');
    const h2 = hist();
    cleanUpV1(store(), { hash: '#w1.garbage<script>', pathname: '/', search: '?s=1&utm=x' }, h2);
    expect(h2.replaceState).toHaveBeenCalledWith(null, '', '/?utm=x');
  });

  it('leaves other hashes alone (e.g. a section link)', () => {
    const h = hist();
    cleanUpV1(store(), { hash: '#growth', pathname: '/', search: '' }, h);
    expect(h.replaceState).not.toHaveBeenCalled();
  });

  it('works when storage is missing or throws (private mode)', () => {
    expect(() => cleanUpV1(null, { hash: '', pathname: '/', search: '' }, hist())).not.toThrow();
    const throwing = { removeItem: () => { throw new Error('blocked'); } };
    expect(() => cleanUpV1(throwing, { hash: '#w1.x', pathname: '/', search: '' }, hist())).not.toThrow();
  });
});
