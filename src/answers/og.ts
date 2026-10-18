// Link-preview cards for answer pages (1200 x 630), drawn from the same answer data as the page.
//   left: wordmark, the question, Hum's verdict (or the result), the result line; bottom: the address

import { esc } from '../present/format';
import type { Answer } from './types';

const C = { night: '#0B0D12', text: '#F2EBDD', muted: '#9BA1AD', ai: '#FFF1C9', dc: '#FFA630', rule: '#2A3038' };

/** Greedy word wrap by character count (the renderer doesn't wrap). */
export function wrap(text: string, max: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const w of text.split(/\s+/)) {
    if (line && (line + ' ' + w).length > max) { lines.push(line); line = w; } else line = line ? `${line} ${w}` : w;
  }
  if (line) lines.push(line);
  return lines;
}

export function answerCardSvg(a: Pick<Answer, 'q' | 'stamp' | 'result' | 'slug'>): string {
  const q = wrap(a.q, 34).slice(0, 4);
  const top = 200, lh = 64;
  const head = q.map((l, i) => `<text x="72" y="${top + i * lh}" font-family="Instrument Serif" font-size="60" fill="${C.text}">${esc(l)}</text>`).join('');
  const y = top + (q.length - 1) * lh + 90;
  const verdict = a.stamp
    ? `<rect x="72" y="${y - 44}" width="${48 + a.stamp.length * 26}" height="64" rx="4" fill="none" stroke="${C.ai}" stroke-width="3"/><text x="96" y="${y}" font-family="Atkinson Hyperlegible Mono" font-weight="600" font-size="34" fill="${C.ai}">${esc(a.stamp)}</text>`
    : '';
  const resultY = a.stamp ? y + 70 : y;
  const result = wrap(a.result, 52).slice(0, 2).map((l, i) => `<text x="72" y="${resultY + i * 40}" font-family="Atkinson Hyperlegible Next" font-weight="700" font-size="32" fill="${a.stamp ? C.text : C.dc}">${esc(l)}</text>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<rect width="1200" height="630" fill="${C.night}"/>
<text x="72" y="104" font-family="Instrument Serif" font-size="52" fill="${C.text}">Hum</text>
${head}
${verdict}
${result}
<line x1="72" y1="548" x2="1128" y2="548" stroke="${C.rule}" stroke-width="2"/>
<text x="72" y="592" font-family="Atkinson Hyperlegible Next" font-weight="700" font-size="22" fill="${C.muted}">humearth.org/q/${esc(a.slug)} · every number sourced</text>
</svg>`;
}
