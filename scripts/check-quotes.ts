// npm run check:quotes [-- --issue]
// The freshness watch: downloads every page Hum quotes (HTML or PDF), checks each quote is still there, and
// reports. With --issue (the weekly GitHub Action) it updates one "Freshness watch" issue and the run summary.
// It never fails the build over a source: a changed page is news for a person, not a broken site.

import { appendFileSync, readFileSync, readdirSync } from 'node:fs';
import { archiveAgeDays, ARCHIVE_MAX_DAYS, collectQuotes, decide, dropRunningHeaders, htmlText, issueBody, lacksArticle, looksBlocked, matchQuote, readState, summaryMarkdown, type Result, type State } from './lib/freshness';

const UA = 'Mozilla/5.0 (compatible; HumFreshnessWatch/1.0; +https://humearth.org/how-we-know)';
const TIMEOUT_MS = 45_000;
const CONCURRENCY = 4;
const today = new Date().toISOString().slice(0, 10);

const files = Object.fromEntries(readdirSync('data/sources').filter((f) => f.endsWith('.source.json')).map((f) => [f.replace('.source.json', ''), JSON.parse(readFileSync(`data/sources/${f}`, 'utf8'))]));
const quotes = collectQuotes(files);
const urls = [...new Set(quotes.map((q) => q.url))];

async function pdfText(bytes: Uint8Array): Promise<string> {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const doc = await pdfjs.getDocument({ data: bytes, useSystemFonts: false }).promise;
  const pages: string[][] = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const c = await (await doc.getPage(p)).getTextContent();
    pages.push(c.items.map((i) => ('str' in i ? i.str + (i.hasEOL ? '\n' : ' ') : '')).join('').split('\n'));
  }
  return dropRunningHeaders(pages);
}

/** The page's text, or why it couldn't be read. */
async function fetchText(url: string): Promise<{ text: string } | { down: string }> {
  try {
    const res = await fetch(url, { headers: { 'user-agent': UA, accept: 'text/html,application/pdf,*/*' }, redirect: 'follow', signal: AbortSignal.timeout(TIMEOUT_MS) });
    const bytes = new Uint8Array(await res.arrayBuffer());
    const isPdf = /pdf/i.test(res.headers.get('content-type') ?? '') || new TextDecoder().decode(bytes.slice(0, 5)) === '%PDF-';
    if (isPdf && res.ok) return { text: await pdfText(bytes) };
    const body = new TextDecoder().decode(bytes);
    if (looksBlocked(res.status, body)) return { down: `HTTP ${res.status}${res.status < 400 ? ', bot check' : ''}` };
    return { text: htmlText(body) };
  } catch (e) {
    return { down: (e as Error).name === 'TimeoutError' ? 'timed out' : (e as Error).message.slice(0, 80) };
  }
}

/** The Internet Archive's latest copy of a page that blocked us, if it's recent enough to stand in for it. */
async function archiveCopy(url: string): Promise<{ text: string; note: string } | null> {
  try {
    const r = await fetch(`https://archive.org/wayback/available?url=${encodeURIComponent(url)}`, { headers: { 'user-agent': UA }, signal: AbortSignal.timeout(TIMEOUT_MS) });
    const snap = ((await r.json()) as { archived_snapshots?: { closest?: { timestamp: string; available: boolean } } }).archived_snapshots?.closest;
    if (!snap?.available || archiveAgeDays(snap.timestamp, today) > ARCHIVE_MAX_DAYS) return null;
    const page = await fetchText(`https://web.archive.org/web/${snap.timestamp}id_/${url}`); // id_: the page as captured, no archive toolbar
    return 'text' in page ? { text: page.text, note: `checked on the Internet Archive's copy from ${snap.timestamp.slice(0, 4)}-${snap.timestamp.slice(4, 6)}-${snap.timestamp.slice(6, 8)}` } : null;
  } catch {
    return null;
  }
}

type Page = { text: string; note?: string } | { down: string };
const pages = new Map<string, Page>();
let next = 0;
await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
  while (next < urls.length) {
    const url = urls[next++]!;
    let page: Page = await fetchText(url);
    // A page that blocked us, or sent a placeholder instead of the article, is read from a recent archive copy.
    const text = 'text' in page ? page.text : null;
    const placeholder = text !== null && quotes.filter((q) => q.url === url).every((q) => lacksArticle(text, q.quote));
    if ('down' in page || placeholder) {
      const why = 'down' in page ? page.down : 'the page that loaded wasn’t the article (a consent or bot page)';
      page = (await archiveCopy(url)) ?? { down: why };
    }
    pages.set(url, page);
  }
}));

const results: Result[] = quotes.map((q) => {
  const page = pages.get(q.url)!;
  if ('down' in page) return { ...q, status: 'down', note: page.down };
  const status = matchQuote(page.text, q.quote);
  return { ...q, status, ...(page.note ? { note: page.note } : {}) };
});

// Last week's state lives in the issue itself (a hidden comment), so the watch needs no storage of its own.
const repo = process.env.GITHUB_REPOSITORY, token = process.env.GITHUB_TOKEN;
const withIssue = process.argv.includes('--issue') && repo && token;
const api = (path: string, init: RequestInit = {}) =>
  fetch(`https://api.github.com/repos/${repo}${path}`, { ...init, headers: { authorization: `Bearer ${token}`, accept: 'application/vnd.github+json', 'content-type': 'application/json', ...(init.headers ?? {}) } });
const TITLE = 'Freshness watch: quotes to re-check';

let issue: { number: number; body: string; state: string } | undefined;
if (withIssue) {
  const r = await api(`/issues?labels=freshness&state=all&per_page=10`);
  issue = ((await r.json()) as { number: number; body: string; state: string; title: string }[]).find((i) => i.title === TITLE);
}
const previous: State = readState(issue?.body);
const d = decide(results, previous, today);

console.log(`quotes: ${quotes.length} on ${urls.length} pages · found ${d.counts.found} · changed ${d.counts.changed} · missing ${d.counts.missing} · down ${d.counts.down}`);
for (const r of [...d.problems, ...d.downNotYet]) console.log(`  ${r.status.padEnd(7)} ${r.where}\n          ${r.url}${r.note ? ` (${r.note})` : ''}`);

if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, summaryMarkdown(d, today));
if (withIssue) {
  const body = issueBody(d, today);
  const state = d.problems.length ? 'open' : 'closed';
  if (issue) await api(`/issues/${issue.number}`, { method: 'PATCH', body: JSON.stringify({ body, state }) });
  else {
    // First run: the issue is created even when all is well, because it also holds the state the next run reads.
    const created = (await (await api('/issues', { method: 'POST', body: JSON.stringify({ title: TITLE, body, labels: ['freshness'] }) })).json()) as { number: number };
    if (state === 'closed') await api(`/issues/${created.number}`, { method: 'PATCH', body: JSON.stringify({ state }) });
  }
  console.log(`issue ${issue ? `#${issue.number} updated` : 'created'} (${state})`);
}
