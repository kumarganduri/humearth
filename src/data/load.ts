// The site's data files, loaded the same way on every page.
import type { ChangelogEntry } from '../how/render';
import type { Constants, Hub } from '../footprint/types';

export const loadConstants = (): Promise<Constants> =>
  fetch('/data/constants.json').then((r) => {
    if (!r.ok) throw new Error(`constants.json ${r.status}`);
    return r.json() as Promise<Constants>;
  });

/** Hubs are decoration: if they fail, the globe shows without lanterns and the numbers still work (3A). */
export const loadHubs = (): Promise<Hub[]> =>
  fetch('/data/hubs.json')
    .then((r) => (r.ok ? (r.json() as Promise<{ hubs: Hub[] }>) : { hubs: [] }))
    .then((f) => f.hubs)
    .catch(() => []);

export const loadChangelog = (): Promise<ChangelogEntry[]> =>
  fetch('/data/changelog.json')
    .then((r) => (r.ok ? (r.json() as Promise<ChangelogEntry[]>) : []))
    .catch(() => []);
