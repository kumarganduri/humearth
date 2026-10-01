# Hum (humearth)

A kid-first, open-source site showing how much water, air and power AI uses, as your own little living world.
Plan: `docs/design-plan.md` (approved; design + eng reviews cleared). Test plan: `docs/test-plan.md`.

## Design System
Always read DESIGN.md before making any visual or UI decisions.
All font choices, colors, spacing, and aesthetic direction are defined there.
Do not deviate without explicit user approval.
In QA mode, flag any code that doesn't match DESIGN.md.

## Numbers are the product's honesty
- Every figure lives in `data/sources/constants.source.json` with low/mid/high, a unit and https sources. Never hard-code a figure in UI code.
- `npm run derive:k` picks the health scale k and checks the guardrails; `npm run build:data` validates and writes `public/data/constants.json` + `data/changelog.json`. The build fails on any unsourced or out-of-order value.
- All screens and the 3D world read numbers only from `src/footprint/` (pure: no three.js, no DOM).
- Guardrail rule (decided 2026-10-02): strict at mid + high figures (50+/day text-only stays >= 0.8, video-heavy < 0.5); order-only at low.

## Testing
- `npm test` (Vitest). Tests live next to code as `*.test.ts`.
- `npm run typecheck`.
