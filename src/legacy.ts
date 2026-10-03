// Hum v1 left two things behind (eng review D5, outside voice #5): share links with a "#w1." hash and a
// saved world (plus a sound setting) in localStorage. v2 has neither, so on load we drop both quietly.

const V1_KEYS = ['hum.world', 'hum.sound'] as const;

type Store = Pick<Storage, 'removeItem'>;
type Loc = Pick<Location, 'hash' | 'pathname' | 'search'>;
type Hist = Pick<History, 'replaceState'>;

export function cleanUpV1(store: Store | null | undefined, loc: Loc, hist: Hist): void {
  try {
    for (const k of V1_KEYS) store?.removeItem(k);
  } catch {
    /* storage blocked (private mode): nothing was saved there anyway */
  }
  if (loc.hash.startsWith('#w1.')) {
    // Drop the old hash and v1's "?s=1" share counter; keep any other query intact.
    const q = new URLSearchParams(loc.search);
    q.delete('s');
    const search = q.toString();
    hist.replaceState(null, '', `${loc.pathname}${search ? `?${search}` : ''}`);
  }
}
