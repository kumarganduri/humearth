# Hum (humearth)

An open-source data story for everyone: the world's data centres already use as much electricity as a country, and AI is the fastest-growing part. Two layers: a headline anyone gets in 10 seconds, and every number's source underneath.
v2 design: `docs/designs/hum-v2-world-story.md` (approved). Stage 1a engineering plan: `docs/designs/hum-v2-stage-1a-plan.md` (eng review cleared). Sourcing record: `docs/sources/stage-1a-sourcing.md`. v1 (kid-first clay world) design: `docs/design-plan.md` (superseded).

## Design System
Always read DESIGN.md before making any visual or UI decisions.
All font choices, colors, spacing, and aesthetic direction are defined there.
Do not deviate without explicit user approval.
In QA mode, flag any code that doesn't match DESIGN.md.

## Numbers are the product's honesty
- Every figure lives in `data/sources/` with low/mid/high, a unit and https sources, each quote checked on the page itself (`checked: "page"`), never from a search summary. Never hard-code a figure in UI code.
  - `constants.source.json`: per-use figures (text, picture, video), water, grid carbon, AI share.
  - `series.source.json`: only what sources published, per year (electricity and CO2). Unpublished edges stay `null` and are never filled in.
  - `countries.source.json`: rows copied from a named dataset file (`checked: "dataset"`, sha256). `npm run check:countries` re-downloads the file and compares every row.
- `npm run build:data` validates everything and writes `public/data/*.json` plus the prerendered How We Know body. The build fails on any unsourced or out-of-order value.
- Years between published figures are derived by `src/footprint/series.ts` and tagged `published` / `derived` / `none`. The UI must draw derived values differently (dashed, hatched or dotted, per DESIGN.md).
- Say consumption vs generation explicitly. The IEA quotes both, and Hum uses consumption.

## Testing
- `npm test` (Vitest, unit). Tests live next to code as `*.test.ts`.
- `npm run test:e2e` (Playwright, against the production build, desktop + phone, port 4191, audio muted). Specs in `e2e/`.
- `npm run typecheck`, `npm run check:budget` (after build: first-screen JS <= 90 KB gz, no three.js).
- CI (`.github/workflows/ci.yml`) runs all of it plus Lighthouse. Main deploys to Cloudflare Pages when the secrets exist. The `source-data` job runs `check:countries` separately, so a re-published dataset turns it red without blocking deploys.

## Architecture notes
- `src/footprint/` is pure (no DOM): engine (usage counts -> Wh / CO2 / water), series derivation and crossings, schema validation.
- `src/how/render.ts` is pure string rendering, used at build time to prerender How We Know.
- Stage 1a is in progress on branch `hum-v2`. The home page is a placeholder until T4 builds the prebuilt hero (`src/hero.generated.html`). `src/legacy.ts` quietly removes v1 share links and saved worlds.
