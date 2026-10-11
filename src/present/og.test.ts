import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { cardSvg, cardText, OG_PAGES, type OgData } from './og';

const read = <T>(p: string) => JSON.parse(readFileSync(p, 'utf8')) as T;
const d: OgData = {
  series: read('public/data/series.json'), countries: read('public/data/countries.json'), constants: read('public/data/constants.json'),
  world: read('public/data/world.json'), hubs: read('public/data/hubs.json'), grids: read('public/data/grids.json'),
  impacts: read('public/data/impacts.json'),
};

describe('link-preview cards', () => {
  it('every card\'s figure comes from the data', () => {
    expect(cardText('home', d).figure).toBe('485 TWh a year');
    expect(cardText('question', d).figure).toBe('0.34 Wh each');
    expect(cardText('live', d).figure).toBe('4.92 MWh a second');
    expect(cardText('2030', d).figure).toBe('950 TWh a year');
    expect(cardText('home', d).caption).toMatch(/^Already past \d+ of the 15 countries compared, \w[\w ]* included$/);
  });
  it('the sources card counts every quote How We Know lists', () => {
    const html = readFileSync('src/how/content.generated.html', 'utf8');
    const listed = (html.match(/<li><a href="https:/g) ?? []).length; // one per quoted source (+ the dataset)
    expect(cardText('how', d).figure).toBe(`${listed} quoted sources`);
  });
  it('cards are valid 1200x630 SVG with escaped text', () => {
    for (const p of OG_PAGES) {
      const svg = cardSvg(p, d);
      expect(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"')).toBe(true);
      expect(svg).not.toMatch(/&(?!amp;|lt;|gt;|quot;|#39;)/); // every & in text is escaped
    }
  });
});
