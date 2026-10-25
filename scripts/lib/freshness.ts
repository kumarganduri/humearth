// The freshness watch, pure parts (tested in freshness.test.ts): which quotes Hum relies on, how a quote is
// matched against a page's text, and what this week's results mean given past weeks.
//
//   data/sources/*.source.json ──collectQuotes──> [{key, url, quote}]
//   page text + quote ──matchQuote──> found | changed | missing          (the page loaded)
//   fetch failed / blocked ───────────> down
//   results + last state ──decide──> {problems for the issue, summary, next state}
//     missing / changed  -> in the issue straight away
//     down               -> in the weekly summary; in the issue after DOWN_WEEKS weeks in a row

export type Status = 'found' | 'changed' | 'missing' | 'down';
export interface Quote { key: string; url: string; quote: string; where: string }
export interface Result extends Quote { status: Status; note?: string }
export interface State { downWeeks: Record<string, number>; lastRun?: string }

export const DOWN_WEEKS = 3;

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);

/** Text inside curly or straight double quotes in a source label: `IEA (2025): "Data centres accounted…"`. */
export function quotesInLabel(label: string): string[] {
  const out: string[] = [];
  for (const m of label.matchAll(/[“"]([^“”"]{12,})[”"]/g)) out.push(m[1]!.trim());
  return out;
}

/** Every quote Hum relies on, from every source file, one entry per (url, quote). Data-row sources are skipped:
 *  check:countries already re-downloads the dataset and compares every row. */
export function collectQuotes(files: Record<string, unknown>): Quote[] {
  const out = new Map<string, Quote>();
  const add = (where: string, url: unknown, quote: string) => {
    if (typeof url !== 'string' || !/^https:\/\//.test(url) || quote.length < 12) return;
    const k = `${url}\n${quote}`;
    if (!out.has(k)) out.set(k, { key: where, url, quote, where });
  };
  const walk = (file: string, x: unknown, path: string) => {
    if (Array.isArray(x)) return x.forEach((v, i) => walk(file, v, `${path}[${i}]`));
    if (!isObj(x)) return;
    if (typeof x.url === 'string' && x.checked === 'page') {
      if (typeof x.quote === 'string') add(`${file}:${path}`, x.url, x.quote);
      else if (typeof x.label === 'string') quotesInLabel(x.label).forEach((q, i) => add(`${file}:${path}#${i}`, x.url, q));
    }
    for (const [k, v] of Object.entries(x)) walk(file, v, path ? `${path}.${k}` : k);
  };
  for (const [file, data] of Object.entries(files)) walk(file, data, '');
  return [...out.values()];
}

/** Text as a reader sees it: quotes, dashes, spaces, ligatures and case evened out. */
export function normalise(s: string): string {
  return s
    .normalize('NFKC')
    .replace(/[‘’‛′`´]/g, "'")
    .replace(/[“”„″]/g, '"')
    .replace(/[‐-―−]/g, '-')
    .replace(/­/g, '')
    .replace(/(\w)-\s+(\w)/g, '$1$2') // words broken across PDF lines
    .replace(/[\s   ]+/g, ' ')
    .toLowerCase()
    .trim();
}

/** Visible text of an HTML page (scripts, styles and tags removed, entities decoded). */
export function htmlText(html: string): string {
  const ENT: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', ndash: '–', mdash: '—', hellip: '…' };
  return html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ') // <noscript> is kept: some pages (Blogger) put the article in it
    .replace(/<annotation[\s\S]*?<\/annotation>/gi, ' ') // MathML's LaTeX copy ("∼ \\sim 90 Wh")
    .replace(/<sub>\s*([^<]*?)\s*<\/sub>/gi, '$1') // CO<sub>2</sub> reads CO2
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z]+);/gi, (m, n) => ENT[n.toLowerCase()] ?? m);
}

/** A PDF's text with its running headers and footers removed: any line that recurs on 3 or more pages (page numbers
 *  ignored) is page furniture, and it can land in the middle of a sentence that crosses a page break. */
export function dropRunningHeaders(pages: string[][]): string {
  const key = (l: string) => l.replace(/\d+/g, '#').replace(/\s+/g, ' ').trim();
  const seen = new Map<string, number>();
  for (const lines of pages) for (const k of new Set(lines.map(key).filter((k) => k.length > 3))) seen.set(k, (seen.get(k) ?? 0) + 1);
  const furniture = new Set([...seen].filter(([, n]) => n >= 3 && pages.length >= 3).map(([k]) => k));
  return pages
    .map((lines) => lines.filter((l) => !furniture.has(key(l))).join('\n'))
    .join('\n')
    .replace(/DocuSign Envelope ID: [0-9A-F-]{20,}/gi, ' '); // e-signature stamp on every page of signed documents
}

/** Words of four letters or more, used for the "changed" test. */
const words = (s: string) => s.split(/[^a-z0-9.%$]+/).filter((w) => w.length >= 4);

/** Every number in a text, with thousands separators read through. */
const numbers = (s: string) => (s.replace(/(\d),(?=\d{3}\b)/g, '$1').match(/\d+(?:\.\d+)?/g) ?? []);
/** Spaces carry no meaning for a match: HTML and PDFs scatter them ("CO 2", "( table 4 )", "m 3 ;"). */
const tight = (s: string) => s.replace(/ /g, '');

/**
 * found: the quote is on the page, comparing characters with spaces ignored; a quote that skips words with "…"
 *        or "..." is found when every part is, in order.
 * changed: not word for word, but a person should look before calling it gone: at least 85% of its longer
 *          words appear close together (a rewording, a footnote marker, a page break), or every number in it is
 *          still on the page (a PDF table whose text comes out in another order).
 * missing: neither.
 */
export function matchQuote(pageText: string, quote: string): Exclude<Status, 'down'> {
  const page = normalise(pageText);
  const q = normalise(quote);
  const tp = tight(page);
  // A quote cut mid-sentence may end in a full stop the page doesn't have ("…without:" on the page).
  const parts = q.split(/\s*(?:\.\.\.|…)\s*/).map((p) => tight(p).replace(/[.,;:]+$/, '')).filter(Boolean);
  let at = 0;
  if (parts.every((p) => { const i = tp.indexOf(p, at); if (i < 0) return false; at = i + p.length; return true; })) return 'found';
  const nums = numbers(q);
  if (nums.length >= 2 && nums.every((n) => tp.includes(n))) return 'changed';
  const qw = words(q);
  if (qw.length === 0) return 'missing';
  const pw = page.split(/[^a-z0-9.%$]+/);
  const span = Math.max(qw.length * 3, 12);
  const want = new Set(qw);
  let best = 0;
  for (let i = 0; i < pw.length; i++) {
    if (!want.has(pw[i]!)) continue;
    const seen = new Set(pw.slice(i, i + span).filter((w) => want.has(w)));
    if (seen.size > best) best = seen.size;
    if (best === want.size) break;
  }
  return best / want.size >= 0.85 ? 'changed' : 'missing';
}

/** True when a page plainly isn't the article: under a third of the quote's longer words appear anywhere on it.
 *  Sites send cloud servers a consent or bot page with status 200 (Nature, the European Parliament), and that
 *  must read as "couldn't read the page", not as "the quote vanished". */
export function lacksArticle(pageText: string, quote: string): boolean {
  const qw = [...new Set(words(normalise(quote)))];
  if (qw.length < 3) return false;
  const pw = new Set(normalise(pageText).split(/[^a-z0-9.%$]+/));
  return qw.filter((w) => pw.has(w)).length / qw.length < 1 / 3;
}

/** The Internet Archive's most recent copy is used when a page blocks us, if it is no older than this. */
export const ARCHIVE_MAX_DAYS = 183;

/** "20260918123456" (a Wayback timestamp) -> days before `today` ("2026-10-25"). */
export function archiveAgeDays(timestamp: string, today: string): number {
  const d = Date.UTC(+timestamp.slice(0, 4), +timestamp.slice(4, 6) - 1, +timestamp.slice(6, 8));
  return Math.floor((Date.parse(`${today}T00:00:00Z`) - d) / 864e5);
}

/** A response we can't read the page from: blocked, rate-limited or a bot challenge. */
export function looksBlocked(status: number, body: string): boolean {
  if (status >= 400) return true;
  return /just a moment\.\.\.|cf-chl|enable javascript and cookies to continue|access denied|captcha/i.test(body.slice(0, 5000)) && body.length < 60_000;
}

export interface Decision { problems: Result[]; downNotYet: Result[]; state: State; counts: Record<Status, number> }

export function decide(results: Result[], previous: State, today: string): Decision {
  const downWeeks: Record<string, number> = {};
  const counts: Record<Status, number> = { found: 0, changed: 0, missing: 0, down: 0 };
  const problems: Result[] = [];
  const downNotYet: Result[] = [];
  for (const r of results) {
    counts[r.status]++;
    if (r.status === 'down') {
      const weeks = (previous.downWeeks[r.url] ?? 0) + 1;
      downWeeks[r.url] = weeks;
      (weeks >= DOWN_WEEKS ? problems : downNotYet).push({ ...r, note: `down ${weeks} weeks in a row${r.note ? `: ${r.note}` : ''}` });
    } else if (r.status !== 'found') problems.push(r);
  }
  return { problems, downNotYet, state: { downWeeks, lastRun: today }, counts };
}

const STATE_RE = /<!-- freshness-state (\{[\s\S]*?\}) -->/;
export const readState = (issueBody: string | null | undefined): State => {
  const m = issueBody?.match(STATE_RE);
  try { return m ? (JSON.parse(m[1]!) as State) : { downWeeks: {} }; } catch { return { downWeeks: {} }; }
};

const LABEL: Record<Status, string> = { found: 'Found', changed: 'Wording changed', missing: 'Quote not on the page', down: 'Page down or blocked' };

/** The one issue's body: what needs a person, then the hidden state the next run reads. */
export function issueBody(d: Decision, today: string): string {
  const rows = d.problems
    .map((r) => `| ${LABEL[r.status]} | \`${r.where}\` | [${new URL(r.url).hostname}](${r.url}) | ${r.quote.slice(0, 90).replace(/\|/g, '\\|')}${r.quote.length > 90 ? '…' : ''} | ${r.note ?? ''} |`)
    .join('\n');
  const head = d.problems.length
    ? `The weekly check (${today}) found ${d.problems.length} quote${d.problems.length === 1 ? '' : 's'} that need a person to look. For each one, re-read the page: if the source changed its figure, update \`data/sources\` (the build will flag every answer that uses it); if it only moved, update the URL or quote.\n\n| What | Where in data/sources | Page | Quote | Note |\n|---|---|---|---|---|\n${rows}`
    : `The weekly check (${today}) found every quote on its page. Nothing to do.`;
  return `${head}\n\nThis week: ${d.counts.found} found, ${d.counts.changed} changed, ${d.counts.missing} missing, ${d.counts.down} down (pages down fewer than ${DOWN_WEEKS} weeks in a row are listed only in the run summary).\n\n<!-- freshness-state ${JSON.stringify(d.state)} -->\n`;
}

/** The run's own summary (GitHub's job summary page): everything, including pages that are down for now. */
export function summaryMarkdown(d: Decision, today: string): string {
  const line = (r: Result) => `- ${LABEL[r.status]}: \`${r.where}\` ${r.url}${r.note ? ` (${r.note})` : ''}`;
  return `## Freshness watch, ${today}\n\n${d.counts.found} found · ${d.counts.changed} changed · ${d.counts.missing} missing · ${d.counts.down} down\n\n${d.problems.length ? `### In the issue\n${d.problems.map(line).join('\n')}\n\n` : ''}${d.downNotYet.length ? `### Down this week (not yet ${DOWN_WEEKS} weeks)\n${d.downNotYet.map(line).join('\n')}\n` : ''}`;
}
