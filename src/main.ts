// Controller: the one place where state changes turn into effects (storage, URL, 3D, DOM).
// All decisions live in app/state.ts (pure, tested); this file only reacts to them.
//
//   user input ─> dispatch(event) ─> reduce(state, event) ─> effects(prev, next) ─> render(next)
//   view phase changes (landed / back on Earth) ─> dispatch(LANDED | ON_EARTH)
//
// The picture is a View: posters first (fast first screen, no three.js), then the 3D view loads as
// its own chunk and takes over. No WebGL, or a lost GPU context, falls back to the posters (7A, 9A).

import './styles.css';
import { isLand } from './scene/land';
import { seedSpot } from './scene/geo';
import { createPosterView } from './view/poster';
import { webglAvailable } from './view/webgl';
import { bloomNotes, mixFor, readSoundPref, writeSoundPref } from './sound/mix';
import type { Synth } from './sound/synth';
import type { View, ViewPhase } from './view/view';
import { aiPerSecond, footprint, kidComparisons } from './footprint/engine';
import { comparisonWords, panelCopy, planWords, quizQuestions, sentenceFor, tickerNote, tickerWords, worldDescription } from './ui/copy';
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
  // Sound (13A): off by default, remembered on this device. The synth loads only when turned on,
  // and browsers only allow audio after a tap, so a remembered "on" starts at the first tap.
  // Wired before the numbers load, so the button works right away on a slow phone.
  let soundOn = readSoundPref(globalThis.localStorage);
  let synth: Synth | null = null;
  // Until the numbers arrive the page is on Earth; afterwards the mix follows the app state.
  let currentMix = () => mixFor('earth', null, null);
  /** Make the speakers match the button. Re-reads soundOn after loading, so a tap during the load wins. */
  async function syncSound(): Promise<boolean> {
    if (soundOn && !synth) {
      const { createSynth } = await import('./sound/synth');
      synth ??= createSynth();
    }
    if (!synth) return false;
    if (soundOn) synth.setMix(currentMix());
    synth.setEnabled(soundOn);
    return soundOn;
  }
  const renderSoundButton = () => {
    $('sound').setAttribute('aria-pressed', String(soundOn));
    $('sound-label').textContent = soundOn ? 'Sound on' : 'Sound off';
  };
  renderSoundButton();
  // A remembered "on" starts at the first tap anywhere, except a tap on the button itself: that tap is "Sound off".
  const firstTap = (e: Event) => {
    if ($('sound').contains(e.target as Node)) return;
    removeEventListener('pointerdown', firstTap);
    void syncSound();
  };
  if (soundOn) addEventListener('pointerdown', firstTap);
  $('sound').addEventListener('click', () => {
    soundOn = !soundOn;
    writeSoundPref(globalThis.localStorage, soundOn);
    renderSoundButton();
    removeEventListener('pointerdown', firstTap);
    void syncSound().then((on) => on && synth?.chime(bloomNotes(0.1))); // a little hello, so you know it's on
  });

  const [constants, hubs] = await Promise.all([loadConstants(), loadHubs()]);
  const questions = quizQuestions(constants);
  const store = safeStore(globalThis.localStorage);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  let state: AppState = boot(location.hash, loadMine(store));
  const soundMix = (s: AppState) => {
    const fp = shownFootprint(s);
    return mixFor(s.place, fp?.health ?? null, fp?.animals ?? null);
  };
  currentMix = () => soundMix(state);

  const onPhase = (p: ViewPhase) => {
    if (p === 'world') dispatch({ type: 'LANDED' });
    if (p === 'earth') dispatch({ type: 'ON_EARTH', newSeed: randomSeed() });
    $('skip-hint').hidden = !((p === 'diving' || p === 'returning') && view.kind === '3d');
  };
  const posters = { earth: $('poster-earth'), world: $('poster-world') };
  let view: View = createPosterView(posters, { onPhase });

  /** A returning visitor's world glows on Earth so they can find it (1A). */
  const plotGlows = (s: AppState) => s.place === 'earth' && s.viewing?.owner === 'me';

  /** Bring a view up to date with the current state (used when a view takes over). */
  function syncView(v: View, s: AppState) {
    const seed = activeSeed(s);
    v.setPlot(seed ? spotOf(seed) : null, plotGlows(s));
    if (seed) v.showWorld(seed);
    v.setChoices(s.viewing?.owner === 'me' ? s.viewing.world.plan : null);
    const fp = shownFootprint(s);
    if (fp) v.setHealth(fp.health, fp.animals);
    v.setIdleSpin(s.place !== 'quiz');
    v.jumpTo(s.place === 'world' ? 'world' : 'earth');
    if (s.place === 'quiz' && s.quiz && seed) {
      const { lat, lon } = spotOf(seed);
      v.turnToward(lat, lon, (s.quiz.step + 1) / (questions.length + 1));
    }
  }

  /** Swap the picture. Never mid-dive: a dive in progress finishes on the view that started it. */
  function useView(v: View) {
    if (state.place === 'diving' || state.place === 'returning') return false;
    const old = view;
    view = v;
    if (old !== v && old.kind === 'poster') old.dispose();
    syncView(v, state);
    document.body.classList.toggle('has-3d', v.kind === '3d');
    return true;
  }

  // The 3D view loads after the first paint, as its own chunk (three.js never blocks the first screen).
  async function load3D() {
    if (!webglAvailable()) {
      document.body.dataset.view = 'poster-no-webgl';
      return;
    }
    const { createView3D } = await import('./scene/view3d');
    const v3d = await createView3D({
      canvas: $<HTMLCanvasElement>('stage'),
      hubs,
      reducedMotion: () => reduced.matches,
      isPhone: matchMedia('(pointer: coarse)').matches && Math.min(screen.width, screen.height) < 600,
      onPhase: (p) => view === v3d && onPhase(p),
      onTier: (t) => (document.body.dataset.tier = t),
      onContextLost: () => {
        // The GPU took the 3D away: show the posters straight away, and finish any dive (7A).
        const fallback = createPosterView(posters, { onPhase });
        view = fallback;
        document.body.classList.remove('has-3d');
        syncView(fallback, state);
        if (state.place === 'diving') dispatch({ type: 'LANDED' });
        if (state.place === 'returning') dispatch({ type: 'ON_EARTH', newSeed: randomSeed() });
        document.body.dataset.view = 'poster-context-lost';
      },
      onContextRestored: () => {
        if (useView(v3d)) document.body.dataset.view = '3d';
      },
    });
    const tryTakeOver = () => {
      if (useView(v3d)) document.body.dataset.view = '3d';
      else window.setTimeout(tryTakeOver, 250); // a poster dive is finishing; try again in a moment
    };
    tryTakeOver();
  }

  /** The footprint of the world on screen (with my plan, or a friend's preview), or null. */
  const shownFootprint = (s: AppState) => (s.viewing ? footprint(s.viewing.world.buckets, constants, displayedPlan(s)) : null);

  function dispatch(e: AppEvent) {
    const prev = state;
    state = reduce(state, e);
    if (state !== prev) {
      effects(prev, state);
      render(state);
    }
    syncHistory();
  }

  // Phone/browser Back (ISSUE-006): while away from Earth we keep one extra history entry, so Back
  // steps back inside Hum (HISTORY_BACK) instead of leaving the site. Back on Earth, the entry is
  // removed again, so the next Back leaves the site as expected.
  let awayEntry = false;
  let ignoreNextPop = false;
  function syncHistory() {
    const away = state.place !== 'earth';
    if (away && !awayEntry) {
      history.pushState({ hum: 'away' }, '');
      awayEntry = true;
    } else if (!away && awayEntry) {
      awayEntry = false;
      ignoreNextPop = true;
      history.back();
    }
  }
  addEventListener('popstate', () => {
    if (ignoreNextPop) {
      ignoreNextPop = false;
      // Stepping back restored the earlier address; a friend's link must not come back once my world is shown.
      if (state.viewing?.owner === 'me' && location.hash) history.replaceState(null, '', location.pathname);
      return;
    }
    if (!awayEntry) return;
    awayEntry = false;
    dispatch({ type: 'HISTORY_BACK' }); // still away (quiz question 2, mid-dive)? syncHistory adds the entry back
  });

  /** Side effects of a state change. Kept small and explicit. */
  function effects(prev: AppState, next: AppState) {
    // Save MY world only, never a friend's (2A).
    if (next.mine && next.mine !== prev.mine) saveMine(store, next.mine);

    // The URL shows a friend's world while you look at it; once you make your own, it's clean.
    if (next.viewing?.owner === 'me' && location.hash) history.replaceState(null, '', location.pathname);

    // Which world the globe and the diorama show (a new world only between dives).
    const seed = activeSeed(next);
    view.setPlot(seed ? spotOf(seed) : null, plotGlows(next));
    if (seed && (next.place === 'earth' || next.place === 'quiz')) view.showWorld(seed);
    view.setChoices(next.viewing?.owner === 'me' ? next.viewing.world.plan : null);
    // Health before the dive, so you land in your real world (and toggles bloom it live).
    const fp = shownFootprint(next);
    if (fp) view.setHealth(fp.health, fp.animals);

    // Quiz: no idle spin; turn a little more toward your spot with each answer (5A).
    view.setIdleSpin(next.place !== 'quiz');
    if (next.place === 'quiz' && next.quiz && seed) {
      const { lat, lon } = spotOf(seed);
      view.turnToward(lat, lon, (next.quiz.step + 1) / (questions.length + 1));
    }

    if (next.place === 'diving' && prev.place !== 'diving' && seed) {
      const { lat, lon } = spotOf(seed);
      view.dive(lat, lon);
    }
    if (next.place === 'returning' && prev.place === 'world') view.back();

    // Sound follows the picture; greener choices that help ring a bloom chime.
    if (synth && soundOn) {
      synth.setMix(soundMix(next));
      const before = shownFootprint(prev);
      if (fp && before && next.place === 'world' && prev.place === 'world' && next.viewing?.world.seed === prev.viewing?.world.seed) {
        const avgHealth = (h: typeof fp.health) => (h.co2 + h.water + h.energy) / 3;
        synth.chime(bloomNotes(avgHealth(fp.health) - avgHealth(before.health)));
      }
    }
  }

  let revealTimer = 0;
  let lastPlace: AppState['place'] | null = null;
  type Channel = 'co2' | 'water' | 'energy';
  let openPanel: Channel | null = null; // UI-only: which glyph's panel is open

  function render(s: AppState) {
    const placeChanged = s.place !== lastPlace;
    const cameBack = placeChanged && lastPlace !== null; // not the first render on page load
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
    // Back on Earth after a world or the quiz: keyboard focus was on a button that is now hidden,
    // so it would fall to the top of the page. Put it on the main button instead.
    if (cameBack && s.place === 'earth' && (document.activeElement === document.body || document.activeElement?.closest('[hidden], #world-ui, #quiz'))) primary.focus();

    // Quiz
    $('quiz').hidden = s.place !== 'quiz';
    if (s.place === 'quiz' && s.quiz) {
      const q = questions[s.quiz.step]!;
      const chosen = s.quiz.answers[q.key];
      // Check BEFORE re-rendering: replacing the buttons removes the focused one.
      const focusWasInQuiz = document.activeElement?.closest('#quiz') != null;
      $('quiz-step').textContent = `question ${s.quiz.step + 1} of ${questions.length}`;
      $('quiz-ask').textContent = q.ask;
      $('quiz-picks').innerHTML = q.options
        .map(
          (o) =>
            `<button class="pick" data-value="${o.value}" aria-pressed="${chosen === o.value}"><span><strong>${o.big}</strong>${o.small}</span></button>`,
        )
        .join('');
      // Move focus to the new question so screen readers read it; Tab reaches the answers.
      if (placeChanged || focusWasInQuiz) $('quiz-ask').focus();
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

  // Earth ticker (2A): AI's worldwide water since this page opened, from the middle figures.
  const openedAt = performance.now();
  const aiMid = aiPerSecond(constants, 'mid');
  const tickTicker = () => {
    if (state.place !== 'earth') return;
    $('ticker-amount').textContent = tickerWords(aiMid.water, (performance.now() - openedAt) / 1000, constants);
  };
  tickTicker();
  window.setInterval(tickTicker, 1000);
  $('ticker').addEventListener('click', () => {
    const note = $('ticker-note');
    const open = note.hidden;
    note.hidden = !open;
    $('ticker').setAttribute('aria-expanded', String(open));
    if (open) {
      note.textContent = tickerNote(aiPerSecond(constants, 'low').water, aiPerSecond(constants, 'high').water, constants) + ' ';
      const link = document.createElement('a');
      link.href = '/how-we-know.html#numbers';
      link.textContent = 'How we know';
      note.append(link);
    }
  });

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
  // On the canvas: in my world, tapping a greener-choice object toggles it; during a dive, a tap skips.
  $('stage').addEventListener('click', (e) => {
    const key = state.place === 'world' && state.viewing?.owner === 'me' ? view.pickChoice(e.clientX, e.clientY) : null;
    if (key) dispatch({ type: 'TOGGLE_PLAN', key });
    else view.skip();
  });
  $('stage').addEventListener('pointermove', (e) => {
    const over = state.place === 'world' && state.viewing?.owner === 'me' && view.pickChoice(e.clientX, e.clientY) !== null;
    $('stage').style.cursor = over ? 'pointer' : '';
  });
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (closePanel()) return;
      if (state.place === 'quiz') dispatch({ type: 'QUIZ_BACK' });
      else view.skip();
    }
  });

  effects(state, state);
  render(state);
  document.body.dataset.view = 'poster';
  // Bring in the 3D only after the poster has loaded and the browser is idle, so three.js never
  // delays the first screen's paint (the poster is the largest paint; Lighthouse LCP).
  const whenIdle = (fn: () => void) =>
    typeof requestIdleCallback === 'function' ? requestIdleCallback(fn, { timeout: 1500 }) : setTimeout(fn, 200); // Safari has no rIC
  const start3D = () => whenIdle(() => void load3D());
  if (document.readyState === 'complete') start3D();
  else addEventListener('load', start3D, { once: true });
}

main();
