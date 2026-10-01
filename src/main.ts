// Controller: the one place where state changes turn into effects (storage, URL, 3D, DOM).
// All decisions live in app/state.ts (pure, tested); this file only reacts to them.
//
//   user input ─> dispatch(event) ─> reduce(state, event) ─> effects(prev, next) ─> render(next)
//   stage phase changes (landed / back on Earth) ─> dispatch(LANDED | ON_EARTH)

import './styles.css';
import { buildGlobe, isLand } from './scene/globe';
import { buildWorld, type WorldScene } from './scene/world';
import { Stage, type StagePhase } from './scene/stage';
import { seedSpot } from './scene/geo';
import { footprint, kidComparisons } from './footprint/engine';
import { comparisonWords, panelCopy, planWords, quizQuestions, sentenceFor, worldDescription } from './ui/copy';
import { activeSeed, boot, displayedPlan, hasPlan, loadMine, newSeed, reduce, safeStore, saveMine, type AppEvent, type AppState } from './app/state';
import { shareUrl } from './share/codec';
import { loadConstants, loadHubs } from './data/load';
import type { Plan } from './footprint/types';

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const randomSeed = () => newSeed(() => crypto.getRandomValues(new Uint32Array(1))[0]! / 2 ** 32);
const spotOf = (seed: number) => seedSpot(seed, undefined, isLand);

const GLYPHS = {
  co2: { word: 'Air', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="#6E9A4F" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M5 19c0-8 5-13 14-14-1 9-6 14-14 14z"/><path d="M5 19l7-7"/></svg>' },
  water: { word: 'Water', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="#5FA8B8" stroke-width="2.2" stroke-linejoin="round" aria-hidden="true"><path d="M12 3c4 5 6 8.5 6 11a6 6 0 0 1-12 0c0-2.5 2-6 6-11z"/></svg>' },
  energy: { word: 'Power', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="#E08A1E" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/></svg>' },
} as const;

const CHOICES: { key: keyof Plan; label: string }[] = [
  { key: 'fewerPictures', label: 'Fewer AI pictures' },
  { key: 'fewerVideos', label: 'Fewer AI videos' },
  { key: 'lighterAi', label: 'A lighter AI' },
];

async function main() {
  const [constants, hubs] = await Promise.all([loadConstants(), loadHubs()]);
  const questions = quizQuestions(constants);
  const store = safeStore(globalThis.localStorage);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  let state: AppState = boot(location.hash, loadMine(store));

  const globe = buildGlobe(hubs);
  let worldSeed = activeSeed(state) ?? 1;
  let world: WorldScene = buildWorld(worldSeed);
  const stage = new Stage({
    canvas: $<HTMLCanvasElement>('stage'),
    globe,
    world,
    reducedMotion: () => reduced.matches,
    isPhone: matchMedia('(pointer: coarse)').matches && Math.min(screen.width, screen.height) < 600,
    onPhase: (p: StagePhase) => {
      if (p === 'world') dispatch({ type: 'LANDED' });
      if (p === 'earth') dispatch({ type: 'ON_EARTH', newSeed: randomSeed() });
      $('skip-hint').hidden = !(p === 'diving' || p === 'returning');
    },
  });

  /** The footprint of the world on screen (with my plan, or a friend's preview), or null. */
  const shownFootprint = (s: AppState) => (s.viewing ? footprint(s.viewing.world.buckets, constants, displayedPlan(s)) : null);

  function dispatch(e: AppEvent) {
    const prev = state;
    state = reduce(state, e);
    if (state !== prev) {
      effects(prev, state);
      render(state);
    }
  }

  /** Side effects of a state change. Kept small and explicit. */
  function effects(prev: AppState, next: AppState) {
    // Save MY world only, never a friend's (2A).
    if (next.mine && next.mine !== prev.mine) saveMine(store, next.mine);

    // The URL shows a friend's world while you look at it; once you make your own, it's clean.
    if (next.viewing?.owner === 'me' && location.hash) history.replaceState(null, '', location.pathname);

    // Which world the globe and the diorama show.
    const seed = activeSeed(next);
    globe.setPlot(seed ? spotOf(seed) : null);
    if (seed && seed !== worldSeed && (next.place === 'earth' || next.place === 'quiz')) {
      worldSeed = seed;
      world = buildWorld(seed);
      stage.setWorld(world);
    }
    // Health before the dive, so you land in your real world (and toggles bloom it live).
    const fp = shownFootprint(next);
    if (fp) world.setHealth(fp.health, fp.animals);

    // Quiz: no idle spin; turn a little more toward your spot with each answer (5A).
    stage.setIdleSpin(next.place !== 'quiz');
    if (next.place === 'quiz' && next.quiz && seed) {
      const { lat, lon } = spotOf(seed);
      stage.turnToward(lat, lon, (next.quiz.step + 1) / (questions.length + 1));
    }

    if (next.place === 'diving' && prev.place !== 'diving' && seed) {
      const { lat, lon } = spotOf(seed);
      stage.dive(lat, lon);
    }
    if (next.place === 'returning' && prev.place === 'world') stage.back();
  }

  let revealTimer = 0;
  let lastPlace: AppState['place'] | null = null;
  type Channel = 'co2' | 'water' | 'energy';
  let openPanel: Channel | null = null; // UI-only: which glyph's panel is open

  function render(s: AppState) {
    const placeChanged = s.place !== lastPlace;
    lastPlace = s.place;
    document.body.classList.toggle('diving', s.place === 'diving' || s.place === 'returning');
    document.body.classList.toggle('landed', s.place === 'world');
    document.body.classList.toggle('quizzing', s.place === 'quiz');

    // Earth
    $('earth-zone').hidden = s.place !== 'earth';
    $('notice').hidden = s.notice !== 'moved-away';
    $('notice').textContent = s.mine ? 'That world moved away.' : 'That world moved away. Make your own?';
    const primary = $<HTMLButtonElement>('primary');
    primary.textContent = !s.viewing ? 'Make my world' : s.viewing.owner === 'me' ? 'Visit my world' : "Visit your friend's world";
    $('show-mine').hidden = !(s.viewing?.owner === 'friend' && s.mine);

    // Quiz
    $('quiz').hidden = s.place !== 'quiz';
    if (s.place === 'quiz' && s.quiz) {
      const q = questions[s.quiz.step]!;
      const chosen = s.quiz.answers[q.key];
      $('quiz-step').textContent = `question ${s.quiz.step + 1} of ${questions.length}`;
      $('quiz-ask').textContent = q.ask;
      $('quiz-picks').innerHTML = q.options
        .map(
          (o) =>
            `<button class="pick" data-value="${o.value}" aria-pressed="${chosen === o.value}"><span><strong>${o.big}</strong>${o.small}</span></button>`,
        )
        .join('');
      if (placeChanged || document.activeElement?.closest('#quiz')) ($('quiz-picks').firstElementChild as HTMLElement | null)?.focus();
    }

    // World
    const ui = $('world-ui');
    if (s.place !== 'world' || !s.viewing) {
      openPanel = null;
      clearTimeout(revealTimer);
      ui.classList.remove('show');
      ui.hidden = true;
      return;
    }
    const plan = displayedPlan(s);
    const fp = shownFootprint(s)!;
    const words = comparisonWords(kidComparisons(fp.weekly.mid.totals, constants));
    const num = { co2: words.air, water: words.water, energy: words.power };
    $('glyphs').innerHTML = (['co2', 'water', 'energy'] as const)
      .map(
        (ch) =>
          `<button class="glyph" data-channel="${ch}" aria-expanded="${openPanel === ch}" aria-controls="panel">${GLYPHS[ch].icon}${GLYPHS[ch].word} <span class="num">${num[ch]}</span></button>`,
      )
      .join('');
    const whose = s.viewing.owner === 'me' ? 'mine' : 'friend';
    $('sentence').textContent = sentenceFor(fp, whose);

    const mineView = s.viewing.owner === 'me';
    const friendPlan = planWords(s.viewing.world.plan);
    const trying = $('trying');
    if (mineView) {
      trying.hidden = !hasPlan(plan);
      trying.textContent = 'Trying a greener week';
    } else {
      trying.hidden = !s.previewPlan;
      trying.textContent = 'Preview: what this world could be';
    }
    const banner = $('friend-banner');
    banner.hidden = mineView;
    banner.textContent = friendPlan ? `A friend's world. Their plan: ${friendPlan}.` : "A friend's world";

    // Greener choices: on my world they're toggles; on a friend's world, one preview toggle (4A).
    $('choices').innerHTML = mineView
      ? CHOICES.map((c) => `<button class="choice" data-plan="${c.key}" aria-pressed="${plan[c.key]}">${c.label}</button>`).join('')
      : friendPlan
        ? `<button class="choice" data-preview aria-pressed="${s.previewPlan}">${s.previewPlan ? 'Back to their real world' : 'See what their world could be'}</button>`
        : '';
    $('change').hidden = !mineView;
    $('share').hidden = !mineView;
    $('make-mine').hidden = mineView;
    $('make-mine').textContent = s.mine ? 'Make a new one' : 'Make mine';
    $('world-desc').textContent = worldDescription(fp, whose);

    // Tap panel (12A): range in kid words + why we're not totally sure + link to How We Know.
    const panel = $('panel');
    panel.hidden = openPanel === null;
    if (openPanel) {
      const p = panelCopy(
        openPanel,
        kidComparisons(fp.weekly.low.totals, constants),
        kidComparisons(fp.weekly.high.totals, constants),
        whose,
      );
      $('panel-title').textContent = p.title;
      $('panel-range').textContent = p.range;
      $('panel-why').textContent = p.whyUnsure;
    }

    if (placeChanged) {
      // The world speaks first: ~3 s with no UI, then glyphs and sentence (6A).
      ui.hidden = false;
      ui.classList.remove('show');
      clearTimeout(revealTimer);
      revealTimer = window.setTimeout(() => ui.classList.add('show'), reduced.matches ? 0 : 3000);
    }
  }

  function toast(text: string) {
    const t = $('toast');
    t.textContent = text;
    t.hidden = false;
    window.setTimeout(() => (t.hidden = true), 2500);
  }

  async function share() {
    if (!state.mine) return;
    const url = shareUrl(location.origin, state.mine);
    try {
      if (navigator.share) {
        await navigator.share({ title: 'My Hum world', text: 'Come see my little world!', url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast('Link copied');
    } catch (err) {
      if ((err as DOMException)?.name === 'AbortError') return; // closed the share sheet
      window.prompt('Copy this link to share your world:', url);
    }
  }

  // Wiring
  $('primary').addEventListener('click', () => dispatch(state.viewing ? { type: 'VISIT' } : { type: 'MAKE', newSeed: randomSeed() }));
  $('show-mine').addEventListener('click', () => dispatch({ type: 'SHOW_MINE' }));
  $('quiz-back').addEventListener('click', () => dispatch({ type: 'QUIZ_BACK' }));
  $('quiz-picks').addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('.pick');
    if (b) dispatch({ type: 'ANSWER', value: Number(b.dataset.value) });
  });
  $('choices').addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('.choice');
    if (!b) return;
    if (b.dataset.preview !== undefined) dispatch({ type: 'TOGGLE_PREVIEW' });
    else dispatch({ type: 'TOGGLE_PLAN', key: b.dataset.plan as keyof Plan });
  });
  $('glyphs').addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('.glyph');
    if (!b) return;
    const ch = b.dataset.channel as Channel;
    openPanel = openPanel === ch ? null : ch;
    render(state);
    if (openPanel) $('panel-title').focus();
  });
  const closePanel = () => {
    if (!openPanel) return false;
    const ch = openPanel;
    openPanel = null;
    render(state);
    document.querySelector<HTMLButtonElement>(`.glyph[data-channel="${ch}"]`)?.focus();
    return true;
  };
  $('panel-close').addEventListener('click', closePanel);
  $('change').addEventListener('click', () => dispatch({ type: 'CHANGE_ANSWERS' }));
  $('make-mine').addEventListener('click', () => dispatch({ type: 'MAKE_MINE' }));
  $('share').addEventListener('click', share);
  $('back').addEventListener('click', () => dispatch({ type: 'BACK' }));
  $('stage').addEventListener('click', () => stage.skip());
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (closePanel()) return;
      if (state.place === 'quiz') dispatch({ type: 'QUIZ_BACK' });
      else stage.skip();
    }
  });

  effects(state, state);
  render(state);
  stage.start();
}

main();
