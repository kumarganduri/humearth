// Link-preview cards (1200 x 630): what WhatsApp, iMessage, X or LinkedIn show when someone shares a Hum link.
// Pure SVG strings drawn from the same data as the site (numbers are never typed in); scripts/build-og.ts
// turns them into PNGs at build time.
//
//   left: wordmark, headline, the page's key figure, a caption    right: the night globe, passed countries lit

import { geoDistance, geoGraticule10, geoOrthographic, geoPath } from 'd3-geo';
import type { FeatureCollection, Geometry } from 'geojson';
import type { GridsFile, HubsFile } from '../footprint/types';
import { aiRates, perRequest, requestsPerSecond, simGrids, simulate2030, todayTWh } from '../footprint/rates';
import { START_ROTATION } from '../globe/earth';
import { esc, formatNumber } from './format';
import { passedFor } from './earth';
import type { HeroData } from './hero';

export const OG_W = 1200;
export const OG_H = 630;
export type OgPage = 'home' | 'question' | 'live' | '2030' | 'how';
export const OG_PAGES: OgPage[] = ['home', 'question', 'live', '2030', 'how'];

export interface OgData extends HeroData {
  world: FeatureCollection<Geometry, { name: string }>;
  hubs: HubsFile;
  grids: GridsFile;
}

export interface CardText {
  headline: string[]; // pre-broken lines (the renderer does not wrap)
  figure: string;
  caption: string;
}

/** Each card's words, from the data. */
export function cardText(page: OgPage, d: OgData): CardText {
  const { year, twh } = todayTWh(d.series);
  const c = d.constants;
  const rates = aiRates(d.series, c);
  switch (page) {
    case 'home': {
      const rows = passedFor(d, year);
      const on = rows.filter((r) => r.on);
      return {
        headline: ["The world's data centres", 'already use as much', 'electricity as a country.'],
        figure: `${formatNumber(twh)} TWh a year`,
        caption: `Already past ${on.length} of the ${rows.length} countries compared, ${on[on.length - 1]?.name ?? 'none yet'} included`,
      };
    }
    case 'question': {
      const q = perRequest('question', c);
      return {
        headline: ['Follow one AI question', 'out of your phone.'],
        figure: `${formatNumber(q.wh[1])} Wh each`,
        caption: `AI uses about ${formatNumber(requestsPerSecond(q, rates))} questions' worth every second`,
      };
    }
    case 'live': {
      const poolMin = c.values.olympicPoolLitres.mid / rates.litresPerSecond[1] / 60;
      return {
        headline: ['Right now, AI around', 'the world uses'],
        figure: `${formatNumber(rates.whPerSecond[1] / 1e6)} MWh a second`,
        caption: `and an Olympic pool of water every ${formatNumber(poolMin)} minutes`,
      };
    }
    case '2030': {
      const base = simulate2030(d.series, c, simGrids(d.grids.grids, c), { mix: { world: 1 }, efficiency: 0 });
      return {
        headline: ["It's 2030. You decide", 'where data centres', 'get their power.'],
        figure: `${formatNumber(base.baseTWh)} TWh a year`,
        caption: 'The IEA forecast. Now choose the grids and see the CO2.',
      };
    }
    case 'how': {
      // Every quote How We Know lists: per-use figures, year-by-year series, grids, hubs, and the country dataset.
      const n =
        Object.values(c.values).reduce((a, v) => a + v.sources.length, 0) +
        Object.values(d.series.metrics).reduce((a, m) => a + m.sources.length, 0) +
        d.grids.grids.reduce((a, g) => a + g.sources.length, 0) +
        d.hubs.hubs.reduce((a, h) => a + h.sources.length, 0) +
        1;
      return {
        headline: ['Every number,', 'and where it', 'comes from.'],
        figure: `${n} quoted sources`,
        caption: 'Low, middle and high for every figure',
      };
    }
  }
}

const C = { night: '#0B0D12', sphere: '#0E131C', text: '#F2EBDD', muted: '#9BA1AD', dc: '#FFA630', ai: '#FFF1C9', rule: '#2A3038', land: '#1E2532', other: '#161A23' };

export function globeSvg(d: OgData, cx: number, cy: number, r: number): string {
  const proj = geoOrthographic().clipAngle(90).precision(0.5).scale(r).translate([cx, cy]).rotate(START_ROTATION);
  const path = geoPath(proj);
  const { year } = todayTWh(d.series);
  const lit = new Set(passedFor(d, year).filter((x) => x.on).map((x) => x.name));
  const tracked = new Set(d.countries.countries.map((x) => x.name));
  const lands = d.world.features
    .map((f) => {
      const p = path(f);
      if (!p) return '';
      const fill = lit.has(f.properties.name) ? C.dc : tracked.has(f.properties.name) ? C.land : C.other;
      return `<path d="${p}" fill="${fill}" fill-opacity="${lit.has(f.properties.name) ? 0.85 : 1}" stroke="#3A4352" stroke-width="0.6"/>`;
    })
    .join('');
  const maxMw = Math.max(...d.hubs.hubs.map((h) => h.mw.mid));
  const centre: [number, number] = [-START_ROTATION[0], -START_ROTATION[1]];
  const glows = d.hubs.hubs
    .map((h) => {
      const p = proj([h.lon, h.lat]);
      const visible = geoDistance([h.lon, h.lat], centre) < Math.PI / 2; // near side only
      if (!p || !visible) return '';
      const rr = (2 + 9 * Math.sqrt(h.mw.mid / maxMw)) * 3.2;
      return `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="${rr.toFixed(1)}" fill="url(#hub)"/>`;
    })
    .join('');
  return `<defs>
  <radialGradient id="halo"><stop offset="0.82" stop-color="${C.dc}" stop-opacity="0.08"/><stop offset="1" stop-color="${C.dc}" stop-opacity="0"/></radialGradient>
  <radialGradient id="hub"><stop offset="0" stop-color="${C.ai}" stop-opacity="0.95"/><stop offset="0.25" stop-color="${C.dc}" stop-opacity="0.6"/><stop offset="1" stop-color="${C.dc}" stop-opacity="0"/></radialGradient>
</defs>
<circle cx="${cx}" cy="${cy}" r="${r * 1.12}" fill="url(#halo)"/>
<path d="${path({ type: 'Sphere' })}" fill="${C.sphere}"/>
<path d="${path(geoGraticule10())}" fill="none" stroke="${C.rule}" stroke-opacity="0.55" stroke-width="0.7"/>
${lands}
${glows}`;
}

export function cardSvg(page: OgPage, d: OgData): string {
  const t = cardText(page, d);
  const lineH = 70;
  const top = 214;
  const head = t.headline.map((l, i) => `<text x="72" y="${top + i * lineH}" font-family="Instrument Serif" font-size="66" fill="${C.text}">${esc(l)}</text>`).join('');
  const figY = top + (t.headline.length - 1) * lineH + 96;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${OG_W}" height="${OG_H}" viewBox="0 0 ${OG_W} ${OG_H}">
<rect width="${OG_W}" height="${OG_H}" fill="${C.night}"/>
${globeSvg(d, 922, 330, 262)}
<text x="72" y="104" font-family="Instrument Serif" font-size="52" fill="${C.text}">Hum</text>
${head}
<text x="72" y="${figY}" font-family="Atkinson Hyperlegible Mono" font-weight="600" font-size="46" fill="${C.dc}">${esc(t.figure)}</text>
<text x="72" y="${figY + 46}" font-family="Atkinson Hyperlegible Next" font-size="24" fill="${C.muted}">${esc(t.caption)}</text>
<text x="72" y="584" font-family="Atkinson Hyperlegible Next" font-weight="700" font-size="22" fill="${C.muted}">humearth.org</text>
</svg>`;
}
