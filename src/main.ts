// Dive spike (E4): Earth -> dive -> your world -> back. The real quiz and places come in M1;
// here answers come from `?b=text,images,videos` (e.g. ?b=1,1,2) so the dive can be felt and tuned.

import './styles.css';
import { buildGlobe, isLand } from './scene/globe';
import { buildWorld } from './scene/world';
import { Stage, type StagePhase } from './scene/stage';
import { seedSpot } from './scene/geo';
import { footprint, kidComparisons } from './footprint/engine';
import { sentenceFor, worldDescription } from './ui/copy';
import type { Buckets, Constants, HubsFile } from './footprint/types';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

function bucketsFromQuery(): Buckets {
  const raw = new URLSearchParams(location.search).get('b');
  const [t, i, v] = (raw ?? '1,1,1').split(',').map((x) => Number(x));
  const ok = (n: number | undefined, max: number) => (Number.isInteger(n) && n! >= 0 && n! <= max ? n! : 1);
  return { text: ok(t, 3), images: ok(i, 2), videos: ok(v, 2) } as Buckets;
}

const GLYPHS = {
  co2: { word: 'Air', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="#6E9A4F" stroke-width="2.2" stroke-linecap="round"><path d="M5 19c0-8 5-13 14-14-1 9-6 14-14 14z"/><path d="M5 19l7-7"/></svg>' },
  water: { word: 'Water', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="#5FA8B8" stroke-width="2.2" stroke-linejoin="round"><path d="M12 3c4 5 6 8.5 6 11a6 6 0 0 1-12 0c0-2.5 2-6 6-11z"/></svg>' },
  energy: { word: 'Power', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="#E08A1E" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/></svg>' },
} as const;

async function main() {
  const [constants, hubs] = await Promise.all([
    fetch('/data/constants.json').then((r) => r.json() as Promise<Constants>),
    // Sites fail -> globe without lanterns, numbers still work (state table 3A).
    fetch('/data/hubs.json')
      .then((r): Promise<Pick<HubsFile, 'hubs'>> => (r.ok ? r.json() : Promise.resolve({ hubs: [] })))
      .catch((): Pick<HubsFile, 'hubs'> => ({ hubs: [] })),
  ]);

  const seed = 20261002;
  const spot = seedSpot(seed, undefined, isLand);
  const buckets = bucketsFromQuery();
  const fp = footprint(buckets, constants);
  const cmp = kidComparisons(fp.weekly.mid.totals, constants);

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const globe = buildGlobe(hubs.hubs, spot);
  const world = buildWorld(seed);
  world.setHealth(fp.health, fp.animals);

  const worldUi = $<HTMLElement>('world-ui');
  const skipHint = $<HTMLElement>('skip-hint');
  $('sentence').textContent = sentenceFor(fp);
  $('glyphs').innerHTML = (['co2', 'water', 'energy'] as const)
    .map((ch) => {
      const num = ch === 'water' ? `${cmp.glasses.toFixed(1)} glasses` : ch === 'energy' ? `${Math.round(cmp.fridgeMinutes)} fridge-min` : `${cmp.balloons.toFixed(1)} balloons`;
      return `<button class="glyph" aria-label="${GLYPHS[ch].word}: ${num} this week">${GLYPHS[ch].icon}${GLYPHS[ch].word} <span class="num">${num}</span></button>`;
    })
    .join('');

  let revealTimer = 0;
  const onPhase = (p: StagePhase) => {
    document.body.classList.toggle('diving', p === 'diving' || p === 'returning');
    document.body.classList.toggle('landed', p === 'world');
    $('earth-zone').hidden = p !== 'earth';
    skipHint.hidden = !(p === 'diving' || p === 'returning');
    clearTimeout(revealTimer);
    if (p === 'world') {
      worldUi.hidden = false;
      // The world speaks first: about 3 s with no UI, then the glyphs and sentence (6A).
      revealTimer = window.setTimeout(() => {
        worldUi.classList.add('show');
        $('world-desc').textContent = worldDescription(fp);
      }, reduced.matches ? 0 : 3000);
    } else {
      worldUi.classList.remove('show');
      worldUi.hidden = true;
    }
  };

  const stage = new Stage({
    canvas: $<HTMLCanvasElement>('stage'),
    globe,
    world,
    reducedMotion: () => reduced.matches,
    isPhone: matchMedia('(pointer: coarse)').matches && Math.min(screen.width, screen.height) < 600,
    onPhase,
  });
  stage.start();

  $('make').addEventListener('click', () => stage.dive(spot.lat, spot.lon));
  $('back').addEventListener('click', () => stage.back());
  $('stage').addEventListener('click', () => stage.skip());
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape') stage.skip();
  });
}

main();
