// Whole pages for Hum v4, generated at build time by scripts/build-data.ts:
//   q/{slug}.html, topics/{slug}.html, topics.html  (full documents; vite.config.ts picks them up)
//   src/home.generated.html, src/today.generated.html      (bodies inlined into index.html and today.html)

import { CATEGORIES, type Answer, type AnswersFile, type AnswersSource, type Findable } from './types';
import { answerPage, answerRow, cardHtml, energy, esc, SITE, topicPage, topicSlug } from './render';
import { todaySlug } from './pure';

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

export const FOOTER_HTML = `<footer class="foot"><nav aria-label="More"><a href="/topics">All topics</a><a href="/how-we-know.html">How we know</a><a href="/about">Who makes Hum</a><span class="foot-tools">Tools: <a href="/question">One question</a> · <a href="/live">Live</a> · <a href="/2030">2030</a> · <a href="/daily">Daily</a> · <a href="/earth">The Earth</a></span></nav><p>Hum is open source. Every number is sourced, with the date its quote was checked.</p></footer>`;

const FONTS = ['instrument-serif-latin-400-normal', 'atkinson-hyperlegible-next-latin-400-normal', 'atkinson-hyperlegible-next-latin-700-normal', 'atkinson-hyperlegible-mono-latin-600-normal']
  .map((f) => `<link rel="preload" href="/fonts/${f}.woff2" as="font" type="font/woff2" crossorigin />`).join('\n    ');

interface Shell { title: string; description: string; path: string; ogImage: string; ogAlt: string; body: string; nav?: string; /** schema.org data for search engines */ ld?: object; noindex?: boolean }

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
    <meta name="twitter:card" content="summary_large_image" />${p.noindex ? '\n    <meta name="robots" content="noindex" />' : ''}${p.ld ? `\n    <script type="application/ld+json">${JSON.stringify(p.ld).replace(/</g, '\\u003c')}</script>` : ''}
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
      ld: answerLd(a, src),
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
  out['404.html'] = pageShell({
    title: 'Page not found · Hum', description: 'That page isn’t on Hum.', path: '/404', ogImage: '/og/home.png', ogAlt: 'Hum: straight answers about AI’s electricity, water and CO₂.', noindex: true,
    body: `<article class="answer about"><h1>That page isn’t here</h1><p class="lede">The link may be old or mistyped. Hum has ${src.answers.length} answers about the electricity, water and CO₂ of AI and data centres.</p><p><a class="btn" href="/">Ask Hum a question</a></p><p><a href="/topics">Browse every answer</a></p></article>`,
  });
  out['about.html'] = pageShell({
    title: 'Who makes Hum · Hum', description: 'Hum is an independent, open-source project made and paid for by Kumar Ganduri. No AI company, energy company or advertiser funds it.',
    path: '/about', ogImage: '/og/home.png', ogAlt: 'Hum: straight answers about AI’s electricity, water and CO₂.', body: aboutBody(src),
  });
  return out;
}

const RATING: Record<string, string> = { YES: 'True', PARTLY: 'Partly true', NO: 'False', 'NOBODY KNOWS': 'Unknown: nobody has published it' };
const HUM = { '@type': 'Organization', name: 'Hum', url: SITE };

/** The newest date one of an answer's quotes was checked on its page: when the answer was last verified. */
export const checkedOn = (a: Answer, src: AnswersSource) => a.cites.map((k) => src.sources[k]!.retrieved).sort().at(-1)!;

/** schema.org data for an answer page: a fact-check (ClaimReview) for a claim, an article for a question. */
export function answerLd(a: Answer, src: AnswersSource): object {
  const url = `${SITE}/q/${a.slug}`, date = checkedOn(a, src);
  return a.type === 'claim' && a.stamp
    ? { '@context': 'https://schema.org', '@type': 'ClaimReview', url, datePublished: date, author: HUM, claimReviewed: a.heard!.replace(/^[“"]|[”"]$/g, ''),
        reviewRating: { '@type': 'Rating', alternateName: RATING[a.stamp] }, reviewBody: `${a.result}. ${a.answer}` }
    : { '@context': 'https://schema.org', '@type': 'Article', url, mainEntityOfPage: url, headline: a.q, description: `${a.result}. ${a.reveal}`, dateModified: date, author: HUM, publisher: HUM };
}

/** sitemap.xml: every page a search engine should know, answers with the date they were last verified. */
export function sitemapXml(src: AnswersSource): string {
  const used = CATEGORIES.filter((c) => src.answers.some((a) => a.cat === c));
  const urls: [string, string?][] = [['/'], ...src.answers.map((a): [string, string] => [`/q/${a.slug}`, checkedOn(a, src)]), ['/topics'], ...used.map((c): [string] => [`/topics/${topicSlug(c)}`]),
    ['/today'], ['/earth'], ['/how-we-know'], ['/about'], ['/question'], ['/live'], ['/2030'], ['/daily']];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(([p, d]) => `  <url><loc>${SITE}${p}</loc>${d ? `<lastmod>${d}</lastmod>` : ''}</url>`).join('\n')}\n</urlset>\n`;
}

export const REPO = 'https://github.com/kumarganduri/humearth';

/** /about: who makes Hum, who pays, how an answer is made, how to report an error. */
export function aboutBody(src: AnswersSource): string {
  return `<article class="answer about">
<h1>Who makes Hum</h1>
<p class="lede">Hum is made by Kumar Ganduri, as an independent project. He pays for it himself. No AI company, energy company, advertiser or sponsor funds it, and nobody pays to appear in it or to be left out.</p>
<h2>What it’s for</h2>
<p>People hear a lot of claims about AI’s electricity, water and CO₂. Some are right, some are exaggerated, and some can’t be known yet. Hum gives a straight answer to each one and shows where every number comes from, so you can check it yourself.</p>
<h2>How an answer is made</h2>
<ul class="plain">
<li>Every number comes from a quote read on the source’s own page, with a link and the date it was checked.</li>
<li>When Hum does a sum, the sum is shown, and the site won’t build if it doesn’t add up.</li>
<li>A company’s own figure is labelled as the company’s, and is never ranked against independent measurements.</li>
<li>Every week, each quote is checked again on its page. If one has changed or gone, it is reviewed.</li>
<li>When nobody has published a number, Hum says so.</li>
</ul>
<p>There are ${src.answers.length} reviewed answers so far. <a href="/how-we-know.html">How we know</a> has the full method and every source.</p>
<h2>Found a mistake?</h2>
<p>Please say so. <a href="${REPO}/issues/new" rel="noopener noreferrer">Report an error on GitHub</a>, with the page and what looks wrong. Corrections are made in the open.</p>
<h2>Open source</h2>
<p>The code, the data and every quote are public: <a href="${REPO}" rel="noopener noreferrer">github.com/kumarganduri/humearth</a>.</p>
</article>`;
}

/** The site's own pages for search: places lead to The Earth, where countries and data-centre hubs are compared. */
export function searchPages(places: string[]): Findable[] {
  return [
    { href: '/earth', q: 'The Earth: data centres next to countries and cities', sub: 'How the world’s data centres compare with a country’s electricity use, and where the biggest hubs are', keys: `country countries map globe city cities hub hubs where ${places.join(' ')}` },
    { href: '/2030', q: '2030: what could data centres’ CO₂ be?', sub: 'Mix the power sources and see the total change', keys: 'future forecast forecasts prediction projection scenario 2035' },
    { href: '/about', q: 'Who makes Hum, and who pays for it?', sub: 'Made and paid for by Kumar Ganduri. No company funds it', keys: 'about site website behind made maker owner author funded funding funds money pays sponsor trust bias contact error hum' },
    { href: '/how-we-know.html', q: 'How we know: the method and every source', sub: 'Where each number comes from and how it is checked', keys: 'sources method methodology verdict verdicts citation citations cite evidence' },
  ];
}

/* ---------- the front door ---------- */

/** The size ladder's rungs the front door zooms through, smallest first. */
export const ZOOM_RUNGS = ['question', 'phone', 'home', 'homeyear', 'all'];
/** The claims people repeat most, to tap and stamp. */
export const FRONT_CLAIMS = ['bottle-of-water', 'google-search', 'netflix', 'reasoning', 'please-thank-you', 'delete-emails'];
/** What the lookup lists before anyone types (the first FIND_SHOWN), and when nothing matches. */
export const FIND_SHOWN = 3;
export const FIND_START = ['should-i-stop', 'bottle-of-water', 'one-question', 'bills', 'world-share', 'power-mix', 'drinking-water', 'reasoning'];
const SHORT: Record<string, string> = { question: 'one question', phone: 'a phone charge', home: 'a home’s day', homeyear: 'a home’s year' };
const SECONDS_A_YEAR = 365 * 24 * 3600;
/** How each rung holds the one before it, in words ("about 56 questions charge one phone"). */
const FITS: Record<string, (x: string) => string> = {
  phone: (x) => `About ${x} questions charge one phone.`,
  home: (x) => `About ${x} phone charges.`,
  all: (x) => `About ${x} US homes for a year.`,
};

/** "56", "1,500", "46 million": how many of the rung before fit in this one (two significant figures). */
export function timesFit(r: number): string {
  if (r >= 1e6) return `${Number((r / 1e6).toPrecision(2))} million`;
  return Number(r.toPrecision(2)).toLocaleString('en-US');
}

const stampClass = (s: string) => `s-${s === 'NOBODY KNOWS' ? 'nobody' : s.toLowerCase()}`;

/** One row of the lookup list (also built in the browser as people type). */
export function findRow(a: Pick<Answer, 'slug' | 'q' | 'stamp' | 'result'>): string {
  return `<li><a href="/q/${a.slug}"><span class="q">${esc(a.q)}</span>${a.stamp ? `<span class="st ${stampClass(a.stamp)}">${esc(a.stamp)}</span>` : '<span></span>'}<span class="r">${esc(a.result)}</span></a></li>`;
}

/** The front door's body (inlined into index.html). Everything is prebuilt and reads with scripts off; the
 *  script turns the globe, runs the counter, drives the zoom, stamps the claims and filters the lookup.
 *
 *    the planet (globe, headline, what Hum does, the lookup, live counter)  ->  claims people repeat (tap to
 *    stamp)  ->  one question out to the planet (size ladder, area-true)  ->  three things to remember  ->  topics */
export function homeBody(src: AnswersSource): string {
  const bySlug = new Map(src.answers.map((a) => [a.slug, a]));
  const rung = new Map(src.ladder.map((r) => [r.key, r]));
  const steps = ZOOM_RUNGS.map((k) => rung.get(k)!);
  const all = rung.get('all')!, homeYear = rung.get('homeyear')!;
  const perSecondHomes = Math.round((all.wh / SECONDS_A_YEAR / homeYear.wh) * 10) / 10;
  const claims = FRONT_CLAIMS.map((s) => bySlug.get(s)!);
  const stamped = src.answers.filter((a) => a.stamp);
  const n = (s: string) => stamped.filter((a) => a.stamp === s).length;
  const counts = CATEGORIES.map((c) => [c, src.answers.filter((a) => a.cat === c).length] as const).filter(([, k]) => k > 0);
  const one = bySlug.get('one-question')!, world = bySlug.get('world-share')!;

  const zoomSteps = steps.map((r, i) => {
    const before = steps[i - 1];
    const fit = before && FITS[r.key] ? ` ${FITS[r.key]!(timesFit(r.wh / before.wh))}` : '';
    return `<li data-wh="${r.wh}" data-val="${esc(energy(r.wh))}" data-short="${esc(SHORT[r.key] ?? '')}"${i === 0 ? ' class="now"' : ''}><span class="what">${esc(r.label)}</span><span class="val num">${esc(energy(r.wh))}</span><p class="line">${esc(r.note.replace(/^./, (c) => c.toUpperCase()))}.${esc(fit)}</p></li>`;
  }).join('');

  const claimCards = claims.map((a) => `<article class="fd-claim" data-slug="${a.slug}"><p class="heard">You’ve probably heard</p><p class="said">${esc(a.heard!.replace(/^“|”$/g, ''))}</p>
<button type="button" class="tap js-only" aria-expanded="false" aria-controls="v-${a.slug}">Tap for Hum’s verdict</button>
<div class="after" id="v-${a.slug}"><span class="stamp-big ${stampClass(a.stamp!)}">${esc(a.stamp!)}</span><p class="result">${esc(a.result)}.</p><a class="more" href="/q/${a.slug}">See the sources →</a></div></article>`).join('');

  return `<section class="fd-hero" aria-labelledby="front-h">
  <div class="fd-text">
    <h1 id="front-h">The world’s data centres use about as much electricity as <span class="dc">France</span>.</h1>
    <p class="fd-job">People say a lot about AI’s electricity, water and CO₂. Hum checks it, and shows every source.</p>
    <div class="find">
      <div class="js-only" role="search"><label for="q">Heard a claim? Look it up</label><input id="q" type="search" autocomplete="off" placeholder="e.g. water, Ireland, my electricity bill" aria-controls="picks" aria-describedby="q-note" /></div>
      <p class="note muted" id="q-note">${src.answers.length} checked answers. Some people start with these:</p>
      <ul class="picks" id="picks">${FIND_START.slice(0, FIND_SHOWN).map((s) => findRow(bySlug.get(s)!)).join('')}</ul>
    </div>
    <p class="fd-sub">AI is the fastest-growing part. <a href="/about">Hum is independent: no company funds it.</a></p>
    <div class="counter js-only" id="counter" data-wh-year="${all.wh}">
      <p class="k">Since you opened this page, the world’s data centres have used</p>
      <p class="v num"><span id="ctr" class="derived">0</span> <small>kWh</small></p>
      <p class="how">Every second, about ${perSecondHomes} years of a US home’s electricity. Hum’s sum: ${esc(energy(all.wh))} a year (${esc(all.note.replace(/^about [^ ]+ TWh /, '').replace(/^in /, ''))}) spread over the seconds in a year.</p>
    </div>
  </div>
  <div class="fd-globe" id="globe" data-wh="${all.wh}"><div class="globe-ctrls" hidden><button type="button" class="icon-btn" id="globe-spin" aria-label="Stop turning"></button></div></div>
  <p class="fd-legend" aria-hidden="true"><span><i class="sw-dc"></i>Countries data centres have passed</span><span><i class="sw-hub"></i>The biggest data-centre hubs</span></p>
</section>

<section class="fd-band fd-claims" aria-labelledby="claims-h">
  <p class="eyebrow">What people say</p>
  <h2 id="claims-h">True, false, or nobody knows?</h2>
  <p class="muted">Tap a claim you’ve heard. Hum’s verdict comes from the sources, and each one links to them.</p>
  <div class="claims" id="claims">${claimCards}</div>
  <p class="score muted js-only" id="score" aria-live="polite">${claims.length} claims to check.</p>
</section>

<section class="zoom" id="zoom" aria-labelledby="zoom-h"><div class="stage">
  <div class="stage-head"><div><p class="eyebrow js-only">Scroll to zoom out</p><h2 id="zoom-h">How big is it? From one question to the planet</h2></div>
  <div class="steps js-only" id="steps" role="group" aria-label="Jump to a step">${steps.map((r, i) => `<button type="button" aria-label="${esc(r.label)}"${i === 0 ? ' aria-current="step"' : ''}><span>${i + 1}</span></button>`).join('')}</div></div>
  <canvas id="zc" class="js-only" aria-hidden="true"></canvas>
  <ol class="zoom-steps" id="zoom-steps" aria-live="polite">${zoomSteps}</ol>
</div></section>

<section class="fd-band" aria-labelledby="take-h">
  <p class="eyebrow">The takeaway</p>
  <h2 id="take-h">Three things to remember</h2>
  <div class="take" id="take">
    <div><p class="who">You</p><div><p class="big">One question is tiny.</p><p class="src">${esc(one.share)}</p></div></div>
    <div><p class="who">Everyone</p><div><p class="big">All of it together is a country.</p><p class="src">${esc(world.share)}</p></div></div>
    <div><p class="who">The claims</p><div><p class="big">Most claims Hum has checked are false or only partly true.</p><p class="src">Of ${stamped.length} checked claims: ${n('NO')} false, ${n('PARTLY')} partly true, ${n('YES')} true, and for ${n('NOBODY KNOWS')} nobody knows yet.</p></div></div>
  </div>
  <div class="share-row js-only"><button type="button" class="btn solid" id="copy-take">Copy these three</button><span class="muted" id="copied" aria-live="polite"></span></div>
</section>

<section class="fd-band" aria-labelledby="topics-h"><h2 id="topics-h">Browse by topic</h2><div class="shelves">${counts.map(([c, k]) => `<a href="/topics/${topicSlug(c)}"><span>${esc(c)}</span><span class="num muted">${k}</span></a>`).join('')}</div>
<p class="status">${src.answers.length} reviewed answers. Each source shows the date its quote was checked on its page.</p></section>`;
}

/** Today's page, prebuilt for the day it's built (CI rebuilds just after midnight UTC), so the card is there before
 *  any script and with scripts off. The card data is embedded (a JSON data block, not a script, so the CSP allows
 *  it); the script only swaps the card if the day has turned over since the build. */
export function todayBody(data: string, src: AnswersSource, day: number): string {
  const slug = todaySlug(src, day);
  const a = src.answers.find((x) => x.slug === slug)!;
  return `<section class="today" aria-labelledby="today-h"><h1 id="today-h">Today’s question</h1>
  <p class="muted"><span id="today-num">Hum #${Math.max(1, day + 1)}</span> · one question a day, the same for everyone. No sign-up.</p>
  <script type="application/json" id="answers-data">${data.replace(/</g, '\\u003c')}</script>
  <div class="card" id="card" data-slug="${slug}">${cardHtml(a)}</div>
  <div id="today-share"></div></section>`;
}

/** public/data/answers.json: what the browser needs for cards, search and Today. */
export function answersFile(src: AnswersSource, contentHash: string, builtAt: string, places: string[] = []): AnswersFile & { companies: string[] } {
  return {
    contentHash, builtAt, launch: src.launch, deck: src.deck, ...(src.today ? { today: src.today } : {}),
    pages: searchPages(places),
    companies: Object.entries(src.sources).filter(([, s]) => s.kind === 'company_claim').map(([k]) => k),
    answers: src.answers.map(({ slug, q, cat, keys, type, heard, heardFrom, stamp, guess, result, reveal, world, you, share, points, range }) =>
      ({ slug, q, cat, keys, type, heard, heardFrom, stamp, guess, result, reveal, world, you, share, points, range })),
  };
}
