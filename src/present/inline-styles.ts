// Hum's Content-Security-Policy is `style-src 'self'`: the browser refuses style="..." attributes, but allows
// stylesheets from our own origin and style changes made through the CSSOM (el.style.setProperty).
// The chart renderers keep writing simple style="width:…" (easy to read and test); these two helpers make
// that safe under the policy.
//
//   build time:  prebuilt HTML  ──extractInlineStyles──►  HTML with data-s="N"  +  CSS  [data-s="N"]{…}
//   run time:    fresh HTML ──stylesToData──► data-style="…" (the browser never parses a style attribute,
//                so nothing is reported) ──applyStyleData──► styled through the CSSOM

/** Splits "left:10%;width:5%" into declarations; ignores empty parts. */
export function declarations(css: string): [string, string][] {
  return css
    .split(';')
    .map((d) => d.trim())
    .filter(Boolean)
    .map((d) => {
      const i = d.indexOf(':');
      return [d.slice(0, i).trim(), d.slice(i + 1).trim()] as [string, string];
    })
    .filter(([k, v]) => k && v);
}

/** Moves every style="…" into a generated stylesheet keyed by data-s. Identical styles share one rule. */
export function extractInlineStyles(html: string): { html: string; css: string } {
  const ids = new Map<string, number>();
  const out = html.replace(/\sstyle="([^"]*)"/g, (_, css: string) => {
    const norm = declarations(css)
      .map(([k, v]) => `${k}:${v}`)
      .join(';');
    if (!ids.has(norm)) ids.set(norm, ids.size);
    return ` data-s="${ids.get(norm)}"`;
  });
  const css = [...ids].map(([decl, id]) => `[data-s="${id}"]{${decl}}`).join('\n');
  return { html: out, css: css ? `${css}\n` : '' };
}

/** Rename style="…" to data-style="…" before the string ever reaches innerHTML. */
export const stylesToData = (html: string) => html.replace(/\sstyle="/g, ' data-style="');

/** In the browser: apply data-style="…" through the CSSOM, which the CSP allows. */
export function applyStyleData(root: ParentNode): void {
  for (const el of root.querySelectorAll<HTMLElement>('[data-style]')) {
    for (const [k, v] of declarations(el.dataset.style ?? '')) el.style.setProperty(k, v);
    el.removeAttribute('data-style');
  }
}
