# Hum v4 build plan: from the prototype to the real site

Branch `hum-v4` (from `hum-v2`). Source of truth for the product: `docs/designs/hum-rebuild-spec.md`, as cut down by the
20-reviewer pass (`docs/designs/hum-prototype-review.json`) and the prototype in `prototype/v4/`.

## What ships first (launch scope)
- **Front door `/`**: the promise, search over the reviewed answers, the playable card deck, "Questions people ask", topics.
- **Answer pages `/q/{slug}`**: one prerendered static page per reviewed answer (works with scripts off), its own title,
  description and link-preview card.
- **`/today`**: one card a day, numbered from #1 on launch day (UTC), never the same as the front door's first card.
- **`/topics/{slug}`**: the reviewed answers in each category.
- **How We Know** gains the verdict guide and the figure labels.
- **The globe home moves to `/earth`**, unchanged. Old `/?year=` and `/?s=` links forward there.
  `/question`, `/live`, `/2030`, `/daily` stay where they are and are linked as tools.

Not at launch: the 299 drafts (they never passed Hum's sourcing rules; they're the review queue), regional variants,
embeds, open data, the email digest.

## Data: every number checked by the build
`data/sources/answers.source.json`:
- `sources`: each quote with publisher, verbatim quote, https URL, retrieved date, provenance kind and `checked`
  (`page`, or `dataset` for a data row).
- `calcs`: each of Hum's sums, written as shown to readers (`text`), with an arithmetic `expr` and its `result`.
  The build evaluates `expr` and fails if it doesn't match `result`.
- `answers`: the reviewed answers. Prose is plain text, but every number in anything a reader sees (question, guess
  options, answer, reveal, world line, share line, chart labels) must appear in one of that answer's cited quotes or
  calcs. Otherwise the build fails. This extends the rule How We Know's named cases already follow.
- `ladder`: the "How big is that?" rungs, each a sourced value or a calc.

Verdicts follow the rules the reviewers enforced: no ranking across measurement boundaries (company figures drawn
hollow and labelled), a verdict can't be stronger than its evidence, and every "your use is small" answer carries the
total.

## Code
- `src/answers/`: types, `schema.ts` (validation, including the number rule and calc checks), `render.ts` (pure
  HTML for answer pages, cards, ladder and figure strips; used at build time and by the client), with tests next to them.
- `scripts/build-data.ts` writes `public/data/answers.json` (the deck and search index) and generates
  `q/*.html` and `topics/*.html` (gitignored), which `vite.config.ts` picks up as inputs.
- `src/answers-client.ts`: the card game, search, share and Today. CSP-safe (no inline styles), under the 90 KB budget.

## Tests and gates (each push)
Unit (schema, render, number rule), e2e (front door card, answer page with scripts off, Today, redirects to `/earth`,
CSP, a11y), budget on every page, Lighthouse on `/`, one `/q` page and `/today`.

## Order
1. Data file + schema + build step (fails on any unsourced number).
2. Render functions + generated pages + vite inputs.
3. Front door, Today, topics, client script.
4. Move the globe to `/earth`, nav, forwards, How We Know additions.
5. Link-preview cards for answers.
6. Tests, gates, then ask the founder before merging to main (main deploys).
