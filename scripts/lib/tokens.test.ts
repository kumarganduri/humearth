import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseDesignMd, renderTokensCss, renderTokensTs } from './tokens';

describe('design tokens', () => {
  it('parses every colour from the real DESIGN.md', () => {
    const t = parseDesignMd(readFileSync('DESIGN.md', 'utf8'));
    expect(t.name).toBe('Hum');
    // DESIGN.md v2 "Lights at Night": amber is only for measured data-centre electricity.
    expect(t.colors.night).toBe('#0B0D12');
    expect(t.colors['data-centres']).toBe('#FFA630');
    expect(t.colors.forecast).toBe('#B07A2E');
    expect(Object.keys(t.colors).length).toBeGreaterThanOrEqual(12);
  });

  it('generated files are up to date with DESIGN.md', () => {
    const t = parseDesignMd(readFileSync('DESIGN.md', 'utf8'));
    expect(readFileSync('src/tokens.ts', 'utf8')).toBe(renderTokensTs(t));
    expect(readFileSync('src/tokens.css', 'utf8')).toBe(renderTokensCss(t));
  });

  it('rejects a non-hex colour and missing front matter', () => {
    expect(() => parseDesignMd('---\nname: X\ncolors:\n  primary: red\n---\n')).toThrow(/colors.primary must be #rrggbb/);
    expect(() => parseDesignMd('# no front matter')).toThrow(/no front matter/);
  });

  it('renders CSS variables', () => {
    const css = renderTokensCss({ name: 'X', colors: { primary: '#112233' }, rounded: { md: '14px' }, spacing: { sm: '8px' } });
    expect(css).toContain('--color-primary: #112233;');
    expect(css).toContain('--rounded-md: 14px;');
    expect(css).toContain('--space-sm: 8px;');
  });
});
