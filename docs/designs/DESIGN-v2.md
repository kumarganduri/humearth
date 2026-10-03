---
# gstack: design-md-format=spec
name: Hum
description: The planet at night seen from orbit, where only measured electricity is allowed to shine; calm, precise, serious and beautiful.
colors:
  night: "#0B0D12"
  surface: "#161A23"
  rule: "#2A3038"
  text: "#F2EBDD"
  text-muted: "#9BA1AD"
  data-centres: "#FFA630"
  ai: "#FFF1C9"
  country: "#7D93B5"
  forecast: "#B07A2E"
  band: "#3A2A14"
  primary: "#FFA630"
  on-primary: "#0B0D12"
  focus: "#FFF1C9"
  success: "#5FBF8F"
  warning: "#FF6B5B"
  error: "#FF6B5B"
typography:
  display:
    fontFamily: Instrument Serif
    fontWeight: 400
    fontSize: clamp(2.4rem, 5.2vw, 4.1rem)
    lineHeight: 1.04
    letterSpacing: -0.005em
  title:
    fontFamily: Instrument Serif
    fontWeight: 400
    fontSize: clamp(1.9rem, 3.6vw, 2.6rem)
    lineHeight: 1.1
  body:
    fontFamily: Atkinson Hyperlegible Next
    fontWeight: 400
    fontSize: 1.0625rem
    lineHeight: 1.6
  label:
    fontFamily: Atkinson Hyperlegible Next
    fontWeight: 700
    fontSize: 0.95rem
  mono:
    fontFamily: Atkinson Hyperlegible Mono
    fontWeight: 400
    fontFeature: tnum
rounded:
  sm: 3px
  md: 6px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  3xl: 72px
components:
  button-primary:
    textColor: "{colors.data-centres}"
    borderColor: "{colors.data-centres}"
    rounded: "{rounded.md}"
  badge-measured:
    backgroundColor: "{colors.data-centres}"
    textColor: "{colors.night}"
    rounded: "{rounded.sm}"
  badge-explained:
    borderColor: "{colors.text-muted}"
    textColor: "{colors.text-muted}"
    rounded: "{rounded.sm}"
  nav-link:
    textColor: "{colors.text}"
---

# Hum

## Overview

**Creative North Star:** "Lights at Night". The planet at night, seen from orbit: brightness is a unit of evidence. Only measured electricity gets to shine. Forecasts are dim, and calculated values are dashed.

**Product context:** Hum v2 is an open-source, carefully sourced editorial data site about the electricity, CO2 and water used by data centres and AI. It is for everyday adults who use AI, and stays readable by a teenager. It works in two layers: a headline you get in 10 seconds, and a data layer for skeptics, teachers and journalists. Plan: `docs/designs/hum-v2-world-story.md`.

**Mode per surface:**
- **The first screen** is a poster. The headline and a live chart own the viewport.
- **The story sections and How We Know** are for reading, in one 640px column.
- **The calculator and the year slider** are tools to operate.

**Reference sites:**
- https://ourworldindata.org (trust, sourcing), https://pudding.cool (personality) and https://ember-energy.org/data/ (energy data). All three are light pages with charts kept small. Hum departs from them with a dark page where the chart is the hero.
- Three independent design proposals (2026-10-03) all converged on a dark page, amber for energy, and ranges printed as prominently as the main figure.

**Key characteristics:**
- **The first five seconds:** a quiet "oh". A sentence-sized headline, then one amber bar standing among grey-blue countries.
- **Every number is a reading, not a claim:** `240 · 415 · 580 TWh`, or "single published estimate".
- **Nothing pulses, counts up or glows for decoration.** Things move only when the reader moves them.
- **Every chart ends with a source line** that links to How We Know.

## Colors

**Strategy:** Committed. Night owns the page, and one amber hue carries the subject (data-centre electricity). Everything else is quiet reference.

**Light or dark:** dark, decided by the subject and the use scene. The story is electricity seen as light at night, and the stage 2 hero is a night Earth. The page is single-theme on purpose. How We Know uses the same night palette with a capped measure (62 to 70 characters) so long reading stays comfortable.

**Colour roles:**
- **The brightness rule:**
  - `data-centres` amber is only for measured electricity: published figures and their bars, lines and badges.
  - `forecast` is the same hue, dimmed. It is used for projections and forecast bars.
  - `band` with dashed `forecast` edges marks uncertainty ranges.
  - Calculated (derived) values reuse their colour but are dashed (lines), hatched (areas) or dotted-underlined (in sentences).
- **The AI slice:** `ai` (white-hot) is only for AI's share inside the data-centre total. It always sits behind a 2px `night` gap and carries a direct label, because amber against white-hot alone is only 2.2:1.
- **Countries:** `country` (cool moonlight) is for the reference countries. They are context, never the story.
- **Interaction:** `primary` is amber (an outline button: amber text and border on night). `focus` is a 2px white-hot outline.
- **Warnings:** `warning` and `error` always come with a word and an icon, never colour alone.

**Contrast on night:**

| Token | Contrast |
|---|---|
| text | about 16:1 |
| text-muted | about 7:1 |
| data-centres | about 9:1 |
| country | about 6:1 |
| forecast | about 5:1 |

## Typography

- **Display: Instrument Serif,** set upright. Use it for the headline sentence and section titles only. The italic is not used as decoration. Emphasis in headlines is colour (amber for "data centres", white-hot for "AI"), never weight tricks.
- **Body: Atkinson Hyperlegible Next.** It is built for legibility, so a teenager on a 320px phone reads it easily, and it carries over from Hum v1. Size 17px with line height 1.6.
- **Numbers: Atkinson Hyperlegible Mono** with tabular figures. Use it for every figure, axis tick, range, the slider year and the calculator outputs, so numbers line up and never jitter as the slider moves.
- **Loading:** self-host all three with `@fontsource` (OFL-1.1, verified 2026-10-03) at the weights used: display 400, body 400/700, mono 400/600. Use `font-display: swap` with real fallbacks (Georgia; system sans; ui-monospace).
- **Scale:** display about 41–66px, title about 30–42px, body 17px, small/label 13–15px, mono badge 11.5px with 0.08em tracking.

## Layout

- **First screen (poster):**
  - Desktop: a 5/7 asymmetric grid, with the headline and range reading on the left and the live race, year slider and Play button on the right.
  - Phones: one column, headline first, then the race, with the slider in thumb reach.
- **The story:**
  - One left-aligned 640px reading column. Charts break out to the full content width (max 1120px).
  - 20px side gutter, 48–72px between sections, separated by a 1px `rule` line rather than by cards.
- **Charts:**
  - Labels sit directly on the lines, with no legends.
  - No y-axis line, hairline `rule` gridlines, and units on the top tick only.
- **Lists of unequal things** (impacts, levers) are ruled rows with a badge column, not card grids.

## Elevation & Depth

The page is flat. Depth comes only from `surface` panels on `night` and from 1px `rule` lines. There are no shadows, no glow halos, no frosted glass and no gradients. The stage 2 three.js night Earth is the only real depth on the page.

## Shapes

Small, quiet radii: 3px for bars and badges, 6px for buttons and panels. Bars are flat rectangles. The range band behind a bar is a dashed outline 3px larger than the bar.

## Components

- **Range reading:** the middle value is large and amber in mono. Low and high are muted and one step smaller, separated by `·`. A caption underneath names the year and the source type (published, calculated, forecast range).
- **Year slider:**
  - It is a native range input with arrow-key steps and `aria-valuetext` such as "2030: about 945 terawatt-hours".
  - The page opens at the latest measured year. A "Play 2017 to 2035" outline button animates it (650ms a year) and becomes "Pause".
  - Under reduced motion, Play jumps straight to 2035.
- **Country race:**
  - It is a sorted horizontal bar chart. The data-centre row is amber with the AI slice in white-hot; country rows are `country`.
  - Rows reorder with a 350ms ease-in-out move.
  - Forecast years use `forecast` with the range band behind the bar. Calculated years are dashed.
- **Fan chart:** the measured history is a solid, bright line with dots. Calculated history is a dashed amber line. The forecast is a dim dashed line inside a `band` cone with dashed edges. Country reference lines are labelled at the right end.
- **Badges:** MEASURED is a solid amber fill with night text. EXPLAINED is a muted 1.5px outline. Fill versus outline carries the meaning, not colour alone.
- **Button:** an outline in amber, filling with a 12% amber tint on hover and showing the white-hot outline on focus. The minimum target is 44px.
- **States:**
  - **Loading:** the chart shows the latest published figure as static text first.
  - **No JavaScript:** a static table.
  - **Missing data:** the label "no projection published" (greyed).
  - **Long country names:** these truncate with a full name in the accessible label.

## Do's and Don'ts

**Do:**
- Print the range next to every number, or label it "single published estimate".
- Dash or hatch every calculated value, in charts and in prose (dotted underline).
- Put a source line under every chart.
- Use amber only for measured data-centre electricity.
- Keep every interactive target at 44px or larger, down to 320px wide.

**Don't:**
- No glow halos, neon edges, radial spotlights or gradient text. They are the dark-page AI cliché, and brightness here means data.
- Don't animate anything the reader didn't touch: no count-up numbers, pulsing dots or autoplaying loops.
- Don't use red or alarm colours for the future. Forecasts are dim, not scary.
- No card grids, icon tiles, kickers above headings, or centred everything.
- No kid comparisons (balloons, bathtubs) as the main unit. Use real units, plus one everyday comparison where it helps.

## Motion

- **Approach:** minimal and functional. Only reader-driven changes animate.
- **Easing:** entering eases out, exiting eases in, moving eases in and out.
- **Duration:**
  - bar width 350ms
  - row reorder 350ms
  - Play steps 650ms a year
  - everything else 150–250ms
  - `prefers-reduced-motion` turns all transitions off
- **The one authored moment:** pressing "Play 2017 to 2035" and watching the amber bar pass France, Germany, then Japan.

## Decisions Log

| Date | Decision | Rationale |
|---|---|---|
| 2026-10-01 | v1 design system: toy globe, clay and dawn light | Kid-first Phase 1 |
| 2026-10-03 | Replaced with v2 "Lights at Night" | The founder found v1 too kid-oriented and unclear. The approved Hum v2 doc moves to adult data journalism in two layers. Three independent proposals plus research (OWID, The Pudding, Ember) converged on a dark page with an amber subject. Approved preview: https://claude.ai/artifact/55tZYU2wTeKooFKiYLLcsQ |
| 2026-10-03 | Brightness means certainty (measured bright, forecast dim, derived dashed) | Turns honesty into the visual identity, so skeptics trust it |
| 2026-10-03 | The page opens at today, with a Play button (replaces autoplay on load) | Scale shock with no waiting; respects reduced motion |
