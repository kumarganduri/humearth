# TODOs

## Gated extras (v3 plan, `docs/designs/hum-v3-reference-plan.md`)
Each keeps its approved design. Build it only when its unlock signal appears.

| Item | Unlock signal | Approved design notes |
|------|---------------|-----------------------|
| Email digest | Readers ask for it, or the RSS/Atom feed gets subscribers | Double opt-in, tracking off, at most monthly; privacy page updated before the form goes live; founder signs up for the service |
| More live hubs (Frankfurt, Amsterdam, Dublin via ENTSO-E) | A defined user question these hubs answer, plus an owner for outages | Founder registers an ENTSO-E token (stored as a Pages secret); same cards and staleness labels as London and Virginia |
| Annual "State of AI's footprint" page | Press interest from the outlet list, or the first year-end with new IEA/Ember editions | Generated from Hum's data with share cards |
| Translations | A fluent reviewer is lined up, plus real traffic from that language's countries | Per-language files; the build fails on missing keys; changed English shows "translation pending"; quotes stay in the original language |

## Small follow-ups
- Re-check the Northern Virginia diesel-generator quote on virginiamercury.com (it was verified only on a republication).
- Move CI from `ubuntu-24.04` to `ubuntu-26.04` once Playwright's `--with-deps` supports it.
- /2030 previews under 100 Mt: the title shows a decimal ("96.4") while the card shows "96".
