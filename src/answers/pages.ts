// Whole pages for Hum v4, generated at build time by scripts/build-data.ts:
//   q/{slug}.html, topics/{slug}.html, topics.html  (full documents; vite.config.ts picks them up)
//   src/home.generated.html, src/today.generated.html      (bodies inlined into index.html and today.html)

import { CATEGORIES, type Answer, type AnswersFile, type AnswersSource } from './types';
import { answerPage, answerRow, cardHtml, esc, SITE, topicPage, topicSlug } from './render';

export const NAV_LINKS: [href: string, label: string][] = [
  ['/today', 'Today'],
  ['/topics', 'Topics'],
  ['/earth', 'The Earth'],
  ['/how-we-know.html', 'How we know'],
];

/** The shared header. `current` is the href of the page you're on. */
export function navHtml(current?: string): string {
  const links = NAV_LINKS.map(([h, l]) => `<a class="navlink" href="${h}"${h === current ? ' aria-current="page"' : ''}>${l}</a>`).join('');
  return `<header class="nav"><a class="wordmark" href="/" aria-label="Hum home">Hum</a><nav aria-label="Main" class="nav-links">${links}</nav></header>`;
}

export const FOOTER_HTML = `<footer class="foot"><nav aria-label="More"><a href="/topics">All topics</a><a href="/how-we-know.html">How we know</a><span class="foot-tools">Tools: <a href="/question">One question</a> · <a href="/live">Live</a> · <a href="/2030">2030</a> · <a href="/daily">Daily</a> · <a href="/earth">The Earth</a></span></nav><p>Hum is open source. Every number is sourced, with the date its quote was checked.</p></footer>`;

const FONTS = ['instrument-serif-latin-400-normal', 'atkinson-hyperlegible-next-latin-400-normal', 'atkinson-hyperlegible-next-latin-700-normal', 'atkinson-hyperlegible-mono-latin-600-normal']
  .map((f) => `<link rel="preload" href="/fonts/${f}.woff2" as="font" type="font/woff2" crossorigin />`).join('\n    ');

interface Shell { title: string; description: string; path: string; ogImage: string; ogAlt: string; body: string; nav?: string }

/** A full document for a generated page. The script entry brings in the shared CSS and the share button. */
export function pageShell(p: Shell): string {
  const url = SITE + p.path;
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${esc(p.title)}</title>
    <noscript><link rel="stylesheet" href="/noscript.css" /></noscript>
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <meta name="description" content="${esc(p.description)}" />
    <meta name="theme-color" content="#0B0D12" />
    ${FONTS}
    <link rel="canonical" href="${url}" />
    <meta property="og:type" content="article" />
    <meta property="og:site_name" content="Hum" />
    <meta property="og:url" content="${url}" />
    <meta property="og:title" content="${esc(p.title)}" />
    <meta property="og:description" content="${esc(p.description)}" />
    <meta property="og:image" content="${SITE}${p.ogImage}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${esc(p.ogAlt)}" />
    <meta name="twitter:card" content="summary_large_image" />
  </head>
  <body>
    <a class="skip-link" href="#main">Skip to content</a>
    ${navHtml(p.nav)}
    <main id="main" tabindex="-1" class="v4">
${p.body}
    </main>
    ${FOOTER_HTML}
    <script type="module" src="/src/answer-page.ts"></script>
  </body>
</html>
`;
}

/** Everything build-data writes for the answers: file path -> contents. */
export function answerPages(src: AnswersSource): Record<string, string> {
  const out: Record<string, string> = {};
  for (const a of src.answers) {
    const verdict = a.stamp ? `Hum’s verdict: ${a.stamp}. ` : '';
    out[`q/${a.slug}.html`] = pageShell({
      title: `${a.q} · Hum`,
      description: `${verdict}${a.result}. ${a.reveal}`,
      path: `/q/${a.slug}`,
      ogImage: `/og/q/${a.slug}.png`,
      ogAlt: `${a.q} ${verdict}${a.result}.`,
      body: answerPage(a, src),
    });
  }
  const used = CATEGORIES.filter((c) => src.answers.some((a) => a.cat === c));
  for (const c of used) {
    out[`topics/${topicSlug(c)}.html`] = pageShell({
      title: `${c} · Hum`, description: `Straight answers about AI’s electricity, water and CO₂: ${c.toLowerCase()}. Every number sourced.`,
      path: `/topics/${topicSlug(c)}`, ogImage: '/og/home.png', ogAlt: 'Hum: straight answers about AI’s electricity, water and CO₂.', body: topicPage(c, src.answers), nav: '/topics',
    });
  }
  out['topics.html'] = pageShell({
    title: 'All topics · Hum', description: 'Every reviewed answer about AI’s electricity, water and CO₂, by topic.',
    path: '/topics', ogImage: '/og/home.png', ogAlt: 'Hum: straight answers about AI’s electricity, water and CO₂.', nav: '/topics',
    body: `<section class="topic"><h1>All topics</h1><p class="muted">${src.answers.length} reviewed answers. More are being checked.</p>${used.map((c) => `<h2><a href="/topics/${topicSlug(c)}">${esc(c)}</a></h2><ul class="rows">${src.answers.filter((a) => a.cat === c).map(answerRow).join('')}</ul>`).join('')}</section>`,
  });
  return out;
}

/** The front door's body (inlined into index.html). The first card is prerendered, so it's there before any script. */
export function homeBody(src: AnswersSource): string {
  const bySlug = new Map(src.answers.map((a) => [a.slug, a]));
  const first = bySlug.get(src.deck[0]!)!;
  const listed = ['big-tech-emissions', 'bills', 'reasoning', 'power-mix'].map((s) => bySlug.get(s)).filter((a): a is Answer => !!a);
  const counts = CATEGORIES.map((c) => [c, src.answers.filter((a) => a.cat === c).length] as const).filter(([, n]) => n > 0);
  return `<section class="front" aria-labelledby="front-h">
  <div class="hero"><h1 id="front-h">One AI question uses very little electricity. The world’s data centres use about as much as France.</h1>
  <p class="hero-sub">Straight answers about AI’s electricity, water and CO₂. Every number sourced.</p></div>
  <div class="search js-only" role="search"><label for="q">Heard something? Ask Hum.</label><input id="q" type="search" autocomplete="off" placeholder="e.g. is AI bad for the planet?" aria-controls="results" aria-describedby="q-count" /><p id="q-count" class="muted" aria-live="polite"></p><ul class="results" id="results" hidden></ul></div>
  <div class="card" id="card" data-slug="${first.slug}">${cardHtml(first, { at: 0, of: src.deck.length })}</div>
</section>
<section aria-labelledby="ask-h"><h2 id="ask-h">Questions people ask</h2><ul class="rows">${listed.map(answerRow).join('')}</ul></section>
<section aria-labelledby="topics-h"><h2 id="topics-h">Browse by topic</h2><div class="shelves">${counts.map(([c, n]) => `<a href="/topics/${topicSlug(c)}"><span>${esc(c)}</span><span class="num muted">${n}</span></a>`).join('')}</div></section>
<p class="status">${src.answers.length} reviewed answers. Each source shows the date its quote was checked on its page.</p>`;
}

/** Today's shell. The card data is embedded (a JSON data block, not a script, so the CSP allows it), so the card
 *  appears without waiting for a fetch; its box is reserved in CSS so nothing below it moves. */
export function todayBody(data: string): string {
  return `<section class="today" aria-labelledby="today-h"><h1 id="today-h">Today’s question</h1>
  <p class="muted" id="today-n">Hum #… · one question a day, the same for everyone. No sign-up. There are … cards so far, so they repeat until more answers are reviewed.</p>
  <script type="application/json" id="answers-data">${data.replace(/</g, '\\u003c')}</script>
  <div class="card js-only" id="card"><p class="muted">Loading today’s question…</p></div>
  <noscript><p>Today’s question depends on today’s date, so it needs JavaScript. <a href="/topics">Browse every answer</a> instead.</p></noscript>
  <div id="today-share"></div></section>`;
}

/** public/data/answers.json: what the browser needs for cards, search and Today. */
export function answersFile(src: AnswersSource, contentHash: string, builtAt: string): AnswersFile & { companies: string[] } {
  return {
    contentHash, builtAt, launch: src.launch, deck: src.deck,
    companies: Object.entries(src.sources).filter(([, s]) => s.kind === 'company_claim').map(([k]) => k),
    answers: src.answers.map(({ slug, q, cat, type, heard, heardFrom, stamp, guess, result, reveal, world, you, share, points, range }) =>
      ({ slug, q, cat, type, heard, heardFrom, stamp, guess, result, reveal, world, you, share, points, range })),
  };
}
