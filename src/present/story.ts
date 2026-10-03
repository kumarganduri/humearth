// The story sections after the fan (eng review T8, outside voice #2). Pure HTML from the shipped data; every
// number comes from data/sources, and anything calculated is marked as calculated (dotted).
//
//   whereItGoesHtml   today's total split into AI (a range) and everything else; AI vs all growth
//   impactsHtml       MEASURED impacts: electricity, CO2 (series), water (per kWh + a calculated world total)

import type { Constants } from '../footprint/types';
import type { SeriesFile } from '../footprint/series-types';
import { esc, formatNumber, rangeText } from './format';

export interface StoryData {
  series: SeriesFile;
  constants: Constants;
}

const pct = (x: number) => `${formatNumber(x * 100)}%`;

/** "about a quarter to two-fifths": a plain-words reading of a share range. */
export function shareWords(low: number, high: number): string {
  const words: [number, string][] = [
    [1 / 10, 'a tenth'], [1 / 5, 'a fifth'], [1 / 4, 'a quarter'], [1 / 3, 'a third'], [2 / 5, 'two-fifths'], [1 / 2, 'a half'], [3 / 5, 'three-fifths'], [2 / 3, 'two-thirds'], [3 / 4, 'three-quarters'],
  ];
  const near = (x: number) => words.reduce((a, b) => (Math.abs(b[0] - x) < Math.abs(a[0] - x) ? b : a))[1];
  const lo = near(low), hi = near(high);
  return lo === hi ? `about ${lo}` : `roughly ${lo} to ${hi}`;
}

export function whereItGoesHtml(d: StoryData): string {
  const m = d.series.metrics.electricity;
  const today = m.years.find((y) => y.year === m.latestMeasuredYear)!;
  const prev = m.years.find((y) => y.year === m.latestMeasuredYear - 1)!;
  const total = today.mid.value!;
  const share = d.constants.values.aiShareOfDataCentres;
  const aiGrowth = d.constants.values.aiFocusedGrowth2025;
  const allGrowth = total / prev.mid.value! - 1; // calculated from two published figures
  const lowW = share.low * 100, highW = share.high * 100;
  const maxGrowth = Math.max(aiGrowth.mid, allGrowth);
  return `<section class="col" aria-labelledby="heading-where">
  <h2 id="heading-where">Where the electricity goes</h2>
  <p>Of the ${formatNumber(total)} TWh the world's data centres used in ${today.year}, AI was about <strong>${formatNumber(total * share.low)} to ${formatNumber(total * share.high)} TWh</strong>: ${esc(shareWords(share.low, share.high))}. The rest runs everything else online: streaming, cloud storage, websites, email and business software.</p>
  <div class="split" role="img" aria-label="${esc(`Data centres in ${today.year}: ${formatNumber(total)} TWh. AI's part: ${pct(share.low)} to ${pct(share.high)}.`)}">
    <span class="split-ai" style="width:${lowW.toFixed(2)}%"></span><span class="split-band" style="left:${lowW.toFixed(2)}%;width:${(highW - lowW).toFixed(2)}%"></span>
  </div>
  <div class="split-legend"><span><i class="k-ai" aria-hidden="true"></i>AI: ${pct(share.low)}–${pct(share.high)}</span><span><i class="k-rest" aria-hidden="true"></i>Everything else</span></div>
  <p class="src">AI's share is a figure for the United States, used as a world estimate, because nobody publishes a world figure in words. <a href="/how-we-know.html#numbers">How we know</a></p>
  <h3>AI is the fastest-growing part</h3>
  <div class="growth" role="img" aria-label="${esc(`Growth in ${today.year}: AI-focused data centres about ${pct(aiGrowth.mid)}, all data centres about ${pct(allGrowth)}.`)}">
    <div class="g-row"><span class="g-name">AI-focused data centres</span><span class="g-bar"><span class="g-fill ai" style="width:${((aiGrowth.mid / maxGrowth) * 100).toFixed(2)}%"></span></span><span class="g-v num">+${pct(aiGrowth.mid)}</span></div>
    <div class="g-row"><span class="g-name">All data centres</span><span class="g-bar"><span class="g-fill" style="width:${((allGrowth / maxGrowth) * 100).toFixed(2)}%"></span></span><span class="g-v num derived" title="calculated: ${formatNumber(prev.mid.value!)} TWh (${prev.year}) to ${formatNumber(total)} TWh (${today.year})">+${pct(allGrowth)}</span></div>
  </div>
  <p class="src">Electricity growth in ${today.year}. AI-focused: ${esc(d.constants.values.aiFocusedGrowth2025.sources[0]!.label.split(':')[0]!)}. All data centres: calculated from ${formatNumber(prev.mid.value!)} TWh in ${prev.year} to ${formatNumber(total)} TWh in ${today.year}.</p>
</section>`;
}

function impact(title: string, body: string, figure: string): string {
  return `<div class="imp"><span class="badge m">MEASURED</span><div><h3>${esc(title)}</h3><p class="figure num">${figure}</p><p>${body}</p></div></div>`;
}

export function impactsHtml(d: StoryData): string {
  const e = d.series.metrics.electricity, co2 = d.series.metrics.co2, v = d.constants.values;
  const eToday = e.years.find((y) => y.year === e.latestMeasuredYear)!;
  const eEnd = e.years[e.years.length - 1]!;
  const cToday = co2.years.find((y) => y.year === co2.latestMeasuredYear)!;
  const cEnd = co2.years[co2.years.length - 1]!;
  const kWh = eToday.mid.value! * 1e9; // TWh -> kWh
  const on = v.onsiteWaterLPerKWh, off = v.offsiteWaterLPerKWh;
  const litres = { low: (kWh * (on.low + off.low)) / 1e9, mid: (kWh * (on.mid + off.mid)) / 1e9, high: (kWh * (on.high + off.high)) / 1e9 };
  const r = (x: { low: number | null; mid: number | null; high: number | null }) => ({ low: x.low, mid: x.mid ?? 0, high: x.high });
  const val = (y: (typeof e.years)[number]) => r({ low: y.low.value, mid: y.mid.value, high: y.high.value });
  return `<section class="col" aria-labelledby="heading-impacts">
  <h2 id="heading-impacts">What it does to the world</h2>
  <p>Three effects have published worldwide numbers. Others, like strain on local power grids and air pollution from on-site gas turbines, are real but only known place by place; we'll explain those with named cases rather than invent a total.</p>
  <div class="impacts">
    ${impact('Electricity', `Published for ${eToday.year} (IEA). Forecast for ${eEnd.year}: ${esc(rangeText(val(eEnd), 'TWh'))}.`, esc(rangeText(val(eToday), 'TWh a year')))}
    ${impact('CO2 from that electricity', `Published for ${cToday.year} (IEA). Forecast for ${cEnd.year}: ${esc(rangeText(val(cEnd), 'Mt'))}${cEnd.low.value === null ? ' (no low case published)' : ''}.`, esc(rangeText(val(cToday), 'Mt CO2 a year')))}
    ${impact(
      'Water',
      `Cooling at the building uses ${esc(rangeText(on, 'litres per kWh'))}; the power plants feeding it often use more: ${esc(rangeText(off, 'litres per kWh'))}. For ${eToday.year}'s electricity that comes to <span class="derived" title="calculated: ${eToday.year} electricity x litres per kWh">${esc(rangeText(litres, 'billion litres'))}</span> (calculated).`,
      esc(rangeText({ low: on.low + off.low, mid: on.mid + off.mid, high: on.high + off.high }, 'litres per kWh')),
    )}
  </div>
  <p class="src">Every source, and how each range was built, is on <a href="/how-we-know.html#numbers">How we know</a>.</p>
</section>`;
}
