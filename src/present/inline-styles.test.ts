import { describe, expect, it } from 'vitest';
import { declarations, extractInlineStyles, stylesToData } from './inline-styles';

describe('extractInlineStyles: prebuilt HTML that works under style-src \'self\'', () => {
  it('replaces every style attribute with data-s and emits matching rules; identical styles share one rule', () => {
    const { html, css } = extractInlineStyles('<i style="width:10%"></i><b style="left: 5% ; width:2%"></b><i style="width:10%"></i>');
    expect(html).toBe('<i data-s="0"></i><b data-s="1"></b><i data-s="0"></i>');
    expect(css).toBe('[data-s="0"]{width:10%}\n[data-s="1"]{left:5%;width:2%}\n');
    expect(html).not.toContain('style=');
  });

  it('keeps calc() values intact and leaves HTML without styles untouched', () => {
    expect(extractInlineStyles('<i style="left:calc(24.25% - 7.76%);width:7.76%"></i>').css).toContain('left:calc(24.25% - 7.76%)');
    expect(extractInlineStyles('<p>no styles</p>')).toEqual({ html: '<p>no styles</p>', css: '' });
  });
});

describe('declarations', () => {
  it('splits on ; and the first : only', () => {
    expect(declarations('a:1; b : calc(1 - 2) ;;')).toEqual([['a', '1'], ['b', 'calc(1 - 2)']]);
  });
});

describe('stylesToData', () => {
  it('renames every style attribute so the browser never parses one', () => {
    expect(stylesToData('<i style="width:1%"></i><b class="x" style="left:2%"></b>')).toBe('<i data-style="width:1%"></i><b class="x" data-style="left:2%"></b>');
  });
});
