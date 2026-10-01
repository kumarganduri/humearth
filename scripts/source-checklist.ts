// npm run checklist
// Writes docs/source-checklist.md: every source page to verify by hand, grouped so each page is
// opened once, with every figure Hum takes from it. Generated from data/sources, so it never drifts.

import { readFileSync, writeFileSync } from 'node:fs';
import type { Hub, RangeValue, Source } from '../src/footprint/types';

const constants = JSON.parse(readFileSync('data/sources/constants.source.json', 'utf8')) as { values: Record<string, RangeValue> };
const hubs = (JSON.parse(readFileSync('data/sources/hubs.source.json', 'utf8')) as { hubs: Hub[] }).hubs;

/** What to watch out for on specific pages (derived numbers, weak or blocked sources). */
const NOTES: Record<string, string> = {
  'https://cloud.google.com/blog/products/infrastructure/measuring-the-environmental-impact-of-ai-inference':
    'Find the median Gemini Apps text prompt: 0.24 Wh, 0.03 gCO2e, 0.26 mL water. Our 1.08 L/kWh (water) and 125 g/kWh (CO2) are DERIVED by dividing those, so check the three originals. Note whether the figures include data-centre overhead (we say they do).',
  'https://blog.samaltman.com/the-gentle-singularity':
    'Look for "about 0.34 watt-hours" per average query. It is a claim without published method; keep it only as the mid estimate.',
  'https://www.technologyreview.com/2025/05/20/1116327/ai-energy-usage-climate-footprint-big-tech/':
    'Five figures come from this article: Llama 3.1 405B 6,706 J; SD3 Medium 1024px 2,282 J (and 4,402 J at more steps); older CogVideoX clip 109,000 J; newer 5-second clip 3.4 million J. Check whether these are GPU-only and whether the article doubles them for overhead; if our numbers should change, edit them. 1 Wh = 3,600 J.',
  'https://arxiv.org/abs/2311.16863':
    'In the paper, find image generation energy: mean about 2.907 kWh per 1,000 inferences (= 2.91 Wh per image). Check it is image generation, not image classification.',
  'https://thenetworkinstallers.com/blog/data-center-water-usage/':
    'WEAK SOURCE (a blog). Confirm AWS WUE 0.12 L/kWh, then ideally REPLACE the URL with the AWS sustainability report that publishes it.',
  'https://www.nature.com/articles/s41545-021-00101-w':
    'Mytton 2021. Confirm: US average WUE about 1.8 L/kWh; US average water for electricity 2.18 L/kWh; gas with cooling towers from 490 L/MWh (0.49 L/kWh); coal up to 3,940 L/MWh. Check these are water CONSUMED, not withdrawn.',
  'https://ember-energy.org/latest-insights/global-electricity-review-2025/global-electricity-trends/':
    'Confirm the world average was 473 gCO2/kWh in 2024.',
  'https://www.iea.org/reports/energy-and-ai/energy-demand-from-ai':
    'Confirm data centres used about 415 TWh in 2024. This number sets the health scale baseline; if it changes, run derive:k.',
  'https://population.un.org/wpp/':
    'Confirm about 8.16 billion people in mid-2024 (World Population Prospects 2024).',
  'https://www.visualcapitalist.com/cp/top-data-center-markets/':
    'This page refused automated access (HTTP 403), so it was never read. Confirm each MW figure below AND what it measures (power consumption? capacity? which year?). If it cites an underlying report, prefer linking that instead.',
  'https://www.cbre.com/insights/reports/global-data-center-trends-2025':
    'This one WAS read. Re-confirm the figures are Q1 2025 colocation INVENTORY (not total capacity).',
  'https://www.datacenterfrontier.com/site-selection/article/55131628/data-center-power-constraints-cloud-and-ai-demand-fuel-global-submarket-expansion-cushman-wakefield':
    'Find Northern Virginia at about 11.3 GW operational (Cushman & Wakefield, includes self-built). Ideally link the Cushman & Wakefield report itself.',
  'https://tebin.pro/news/frankfurt-data-center-capital-europe/':
    'Secondary source. Confirm Frankfurt live IT load about 745 MW (mid-2025) and, if possible, replace with the original report it quotes.',
  'https://www.jll.com/en-sa/insights/emea-data-centre-report':
    'Our figures for Stockholm, Johannesburg, Dubai and Riyadh came from a search summary that may have mixed several reports. Check each one carefully, and note whether it is operational capacity.',
};

interface Claim {
  what: string;
  levels: string;
  figure: string;
  claimedAs: string;
}

const byUrl = new Map<string, { label: string; checked: Set<string>; claims: Claim[]; group: 'numbers' | 'hubs' }>();
const add = (s: Source, group: 'numbers' | 'hubs', claim: Claim) => {
  const e = byUrl.get(s.url) ?? { label: s.label, checked: new Set<string>(), claims: [], group };
  if (group === 'numbers') e.group = 'numbers';
  e.checked.add(s.checked ?? 'unknown');
  e.claims.push(claim);
  byUrl.set(s.url, e);
};

const fmt = (n: number) => (n >= 1e9 ? `${n / 1e9} billion` : n.toLocaleString('en-US'));

for (const v of Object.values(constants.values)) {
  for (const s of v.sources) {
    const levels = s.supports.split(',').map((l) => l.trim()) as ('low' | 'mid' | 'high')[];
    const figure = levels.map((l) => `${l} ${fmt(v[l])}`).join(', ');
    add(s, 'numbers', { what: v.label, levels: s.supports, figure: `${figure} ${v.unit}`, claimedAs: s.label });
  }
}
for (const h of hubs) {
  for (const s of h.sources) {
    const levels = s.supports.split(',').map((l) => l.trim()) as ('low' | 'mid' | 'high')[];
    const derived = s.note ? ` (${s.note})` : '';
    const figure = levels.map((l) => `${l} ${fmt(h.mw[l])}`).join(', ');
    add(s, 'hubs', { what: `${h.name}, ${h.country}`, levels: s.supports, figure: `${figure} MW${derived}`, claimedAs: h.measure });
  }
}

const domain = (u: string) => new URL(u).hostname.replace(/^www\./, '');
const section = (group: 'numbers' | 'hubs') =>
  [...byUrl.entries()]
    .filter(([, e]) => e.group === group)
    .map(([url, e], i) => {
      const status = e.checked.has('search-summary') ? 'needs re-checking' : 'read once; quick re-confirm';
      const lines = [
        `### ${i + 1}. ${domain(url)} — ${status}`,
        '',
        `- [ ] **Opened:** <${url}>`,
        `- Cited as: ${e.label}`,
        ...(NOTES[url] ? [`- **Watch out:** ${NOTES[url]}`] : []),
        '',
        '| ✓ | What | Levels | Our figure | We say it counts |',
        '|---|---|---|---|---|',
        ...e.claims.map((c) => `| [ ] | ${c.what} | ${c.levels} | ${c.figure} | ${c.claimedAs} |`),
        '',
      ];
      return lines.join('\n');
    })
    .join('\n');

const total = byUrl.size;
const numbersPages = [...byUrl.values()].filter((e) => e.group === 'numbers').length;
const md = `# Source checklist

<!-- GENERATED by scripts/source-checklist.ts from data/sources. Do not edit; run \`npm run checklist\`. -->

${total} web pages to open, ${numbersPages} of them behind the numbers kids see. Each page is listed once with every figure Hum takes from it. Most were collected from search summaries, not read directly, so How We Know marks them "needs re-checking". This list is how that badge goes away.

## How to check one page (about 5 minutes)

1. Open the link. Find each figure in the table below it.
2. For each figure, tick it if the page says the same thing **and** it measures what we say (third column).
3. Then edit \`data/sources/constants.source.json\` (numbers) or \`data/sources/hubs.source.json\` (AI buildings):
   - **Matches:** change that source's \`"checked": "search-summary"\` to \`"checked": "page"\` and set \`"retrieved"\` to today's date.
   - **Different number:** fix the number (keep low ≤ mid ≤ high), then mark it \`"page"\`.
   - **Can't find it / page gone / weak source:** find a better source (ideally the original report), replace the \`url\` and \`label\`, then mark it \`"page"\`.
4. Rebuild and test:
   \`\`\`bash
   npm run derive:k && npm run build:data && npm test && npm run checklist
   \`\`\`
   If \`derive:k\` fails, a new number broke the "no guilt" promises. Don't force it; bring it back to a design decision.
5. Commit and push. CI deploys, How We Know updates its change log, and the badge disappears for that source.

**Do the "Numbers" pages first.** They drive every world on the site. The AI-buildings pages only set lantern sizes on the globe.

## Numbers behind every world

${section('numbers')}
## AI buildings on the globe

${section('hubs')}`;

writeFileSync('docs/source-checklist.md', md);
console.log(`wrote docs/source-checklist.md: ${total} pages (${numbersPages} numbers, ${total - numbersPages} hubs)`);
