---
# gstack: design-md-format=spec
name: Hum
description: A hand-painted toy globe on a sunny windowsill that opens into your own clay diorama world; warm, tactile, hopeful, honest.
colors:
  primary: "#C2412A"
  on-primary: "#FFFFFF"
  primary-pressed: "#B53A25"
  primary-underside: "#8F2E1D"
  surface: "#FBF4EA"
  surface-deep: "#F3E7D6"
  text: "#3B2F2A"
  text-muted: "#6B5A50"
  accent: "#FFB547"
  accent-ember: "#FF8A3D"
  focus: "#2F6F8A"
  sky-dawn: "#CFE3F2"
  sky-horizon: "#F6DCC8"
  land: "#D9A273"
  land-shadow: "#A8704A"
  water: "#5FA8B8"
  shallows: "#9FD3D0"
  foliage: "#6E9A4F"
  foliage-highlight: "#A9C66B"
  brass: "#C9A45C"
  wood: "#8A5A3B"
  snow: "#F4EFE8"
  sky-stressed: "#D8D2CC"
  land-stressed: "#C7B59E"
  water-stressed: "#8FA3A0"
  foliage-stressed: "#9A9A6A"
  dusk-sky: "#3E4A6B"
  dusk-horizon: "#B7768A"
  dusk-surface: "#2C2530"
  dusk-text: "#F7EDE2"
  success: "#6E9A4F"
  warning: "#E08A1E"
  error: "#B63F28"
typography:
  display:
    fontFamily: Grandstander
    fontWeight: 800
    fontSize: clamp(1.7rem, 3.4vw, 2.6rem)
    lineHeight: 1.12
    letterSpacing: -0.01em
  title:
    fontFamily: Grandstander
    fontWeight: 800
    fontSize: 2rem
    lineHeight: 1.1
  body:
    fontFamily: Atkinson Hyperlegible Next
    fontWeight: 400
    fontSize: 1.0625rem
    lineHeight: 1.55
  label:
    fontFamily: Atkinson Hyperlegible Next
    fontWeight: 700
    fontSize: 0.95rem
    letterSpacing: 0em
  hand:
    fontFamily: Shantell Sans
    fontWeight: 400
    fontSize: 1.3rem
    lineHeight: 1.35
  mono:
    fontFamily: Shantell Sans
    fontWeight: 600
    fontFeature: tnum
rounded:
  sm: 6px
  md: 14px
  lg: 18px
  xl: 26px
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
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.lg}"
    minHeight: 56px
    typography: "{typography.display}"
    shadow: "0 6px 0 {colors.primary-underside}"
  button-primary-hover:
    backgroundColor: "{colors.primary-pressed}"
  button-primary-active:
    translateY: 4px
    shadow: "0 2px 0 {colors.primary-underside}"
  glyph-chip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.full}"
    minHeight: 44px
  choice-object:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    minHeight: 44px
  choice-object-on:
    backgroundColor: "{colors.foliage-highlight}"
  quiz-sheet:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.xl}"
  quiz-pick:
    backgroundColor: "{colors.surface-deep}"
    rounded: "{rounded.lg}"
    minHeight: 96px
  number-panel:
    backgroundColor: "{colors.surface-deep}"
    rounded: "{rounded.lg}"
  nav-link:
    textColor: "{colors.text}"
---

# Hum

## Overview

**Creative North Star:** A beloved toy on a sunny windowsill. The first reaction is "I want to pick that up", then "that's my world, it's alive", then "now I get it", then "I can make it better".
**Product context:** An open-source, kid-first (about age 10, plus parents and teachers) experience about AI's air, water and power use. It works like this:
- A 3D toy-globe Earth shows real AI data-center hubs as glowing lanterns.
- A no-cut camera dive takes you into your own clay diorama world.
- Honest ranges, with a hopeful-balance tone.

Plan: `kumarganduri-main-design-20261001.md`.
**Mode per surface:**
- **Earth and My World:** Experience. The scene owns the viewport.
- **Quiz:** Operate, with big tap targets and nothing to read.
- **How We Know:** Read, in one column of 65–75 characters.
**Reference sites:**
- Bruno Simon and Jordan Breton's floating-island portfolios (toy-world 3D), via https://www.utsubo.com/blog/best-threejs-websites-2026
- NASA Climate Kids and earth.nullschool as the category baseline we depart from: school-flat, or mission-control dark.
**Key characteristics:**
- Dawn light, not space. The globe has a brass meridian ring and a wooden stand, so it is an object on a desk.
- Clay and papercraft materials: flat-shaded low poly with a slightly uneven hand-painted tint per face.
- A stressed world goes **quiet, not red**: colours drain, sound thins, and animals tuck away.
- Numbers are physical objects (beads, marbles, paper-sun rays) with handwritten notes. There are no charts outside How We Know.
- One squishy clay button per screen.

## Colors

**Strategy:** Full palette in the scene, restrained in the UI. The 3D scene carries all the hue. The interface is paper (`surface`) and cocoa ink (`text`), with one clay `primary` for the single action per screen. `accent` (lantern amber) is only for AI buildings and the wordmark dot.
**Light or dark:** Light. The use scene is a kid in a classroom or at a kitchen table during the day. "Dusk" is an optional evening reading theme built from the same scene (a dusk sky, plum surface, cream text). It is not a neon dark mode and never uses black space.
**Stress mapping:** Each scene colour lerps toward its `-stressed` twin according to that channel's health (sky and foliage follow air, water follows water, sun warmth follows power). Never tint red or show alarm colours. `error` is only for genuine UI errors such as a failed load.
**Contrast** (verified):
- text on surface 11.8:1
- text-muted on surface 6.0:1
- white on primary 5.1:1
- text on sky-dawn 9.8:1

Text over the 3D scene always sits on a `surface` chip at 90%+ opacity.

## Typography

**Faces:** all three are SIL OFL fonts on Google Fonts, verified 2026-10-01.
- **Grandstander:** a chunky, bouncy children's face. Use it for the promise line, scene titles, the one sentence per screen, and button labels. It is never used for paragraphs.
- **Atkinson Hyperlegible Next:** built for low-vision readers. It is every reading voice, at 17px (1.0625rem) minimum, and it is the grown-up voice on How We Know.
- **Shantell Sans:** a handwriting-style face (Informal axis optional). Use it for numbers, ranges, the ticker, quiz numerals and margin notes, like a teacher's pencil. Use tabular numerals in tables.

**Scale:** display 1.7–2.6rem, title 2rem, body 1.0625rem, label 0.95rem. Levels differ by size *and* face, never by weight alone. Display never goes above 3rem.
**Loading:** self-hosted from day 1, as Latin-subset woff2 files in the repo with `font-display: swap`. Preload only the Grandstander 800 weight. No Google Fonts requests, so there are zero third-party requests (eng review OV #9).

## Layout

- **Earth:** the canvas fills the viewport. A solid `surface` text zone sits below it (phone: the bottom ~35%; wide screens: a 2-column zone, max-width 880px, with the promise and button on the left and the ticker on the right). The nav is in the top bar: wordmark on the left, links on the right.
- **My World:** the full-bleed scene. Glyph chips sit top-left, the sentence chip lower-left, and choice objects along the bottom edge. The number panel opens beside the scene on wide screens, or as a bottom sheet on a phone.
- **Quiz:** a bottom sheet, max-width 440px, with a 2×2 grid of picks.
- **How We Know:** one column, max 68ch.
- **Spacing rhythm:** 8px base. 72px between Read sections and 24–32px inside them. More space above a heading than below it.

## Elevation & Depth

- Depth always has an offset. Clay objects use a solid offset "underside" shadow (`0 4–6px 0`) like a pressed toy, and soft offset blur for floating sheets.
- The 3D scene uses one warm key light (#FFE2BF), a hemisphere fill, and a soft ground ShadowMaterial at about 0.16 opacity.
- No zero-offset glow halos, no bloom, no glassmorphism. Lanterns use a low `emissiveIntensity` (0.5±0.12) on `accent`/`accent-ember`.

## Shapes

- **Radius hierarchy:** sheets 26px, buttons, panels and picks 18px, chips and choice objects 14px or full, and small details 6px.
- Nested inner radius = outer radius minus the gap.
- In 3D everything is low-poly and flat-shaded. Use about 7–14 radial segments so the facets read as handmade.

## Components

- **Primary button:** the clay fill with a 6px underside shadow. On hover it goes to `primary-pressed`. On press it sinks 4px and the underside shrinks to 2px. Focus shows a 3px `focus` ring with a 3px offset. Disabled: 45% opacity and no underside. Only one per screen.
- **Glyph chips (leaf, drop, sun):** each has a distinct shape *and* a word label, so meaning never relies on colour alone. Tapping one opens the number panel.
- **Choice objects (paintbrush, film reel, feather, seed):** `aria-pressed` toggles. The on state uses `foliage-highlight` and sits 2px lower. The world reacts within one bloom.
- **Number panel:** title, a Shantell range in kid words, a "why we're not sure" line, and a "See the full story" link.
- **Quiz pick:** a Shantell numeral above a short Atkinson label. 96px minimum height.
- **Bead ticker:** clay beads on a brass wire. The count maps to the live figure, and the range is one tap away.
- **Browser surfaces:** selection uses an `accent` background. The caret and focus ring use `focus`. Scrollbars use land-shadow on surface-deep. Links use `primary` and turn `primary-underside` once visited, with a 3px underline offset.

## Do's and Don'ts

- **Do** keep text on a `surface` chip whenever it sits over the 3D scene.
- **Do** show every number as a range, with a source one tap away.
- **Do** show stress as quiet: desaturate, thin the sound, hide the animals. The world always keeps at least 15% health.
- **Do** keep one primary action per screen and 44px+ targets (56px for the main button).
- **Do** use the copy glossary: "AI buildings", "a lighter AI", "Make my world" / "Visit my world".
- **Don't** use black space, neon glow, purple gradients, or red alarm states.
- **Don't** use charts, gauges or health bars outside How We Know.
- **Don't** use emoji or CSS-shape doodles as illustration. Build the 3D asset or show nothing.
- **Don't** use cards inside cards or boxed toggle panels on the world screen.
- **Don't** use Inter, Poppins, Fredoka or system-ui as a display or body voice.

## Motion

- **Approach:** expressive in the scene, minimal in the UI.
- **Easing:**
  - enter `cubic-bezier(0.16, 1, 0.3, 1)` (ease-out)
  - exit `cubic-bezier(0.7, 0, 0.84, 0)` (ease-in)
  - move `cubic-bezier(0.65, 0, 0.35, 1)` (ease-in-out)
  - no bounce or overshoot
- **Duration:**
  - micro 80ms (button press 120ms)
  - short 200ms
  - medium 350ms
  - long 600ms
  - bloom and wilt colour lerp ~1200ms
- **The one authored moment:** the dive. A ~3.2 s camera path from orbit to the clearing, eased in and out, with the globe fading out and the world fading in over the final ~10%. Tap or Esc skips to the end.
- **Idle life:** the globe turns slowly (0.12 rad/s). Lanterns flicker softly. Creatures step at **12 fps** (stop-motion) while the camera stays smooth.
- **Reduced motion:** no globe rotation. The dive and the bloom become 350ms crossfades. Creatures hold still.
- **Sound (opt-in, decision 13A):** wind during the dive, chimes and birdsong on bloom, a river loop in the world. Sound thins as the world gets stressed.

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-10-01 | Initial design system created | Created by /design-consultation from the office-hours plan and design review (7A tabletop diorama), quick web research on kid climate sites and toy-like three.js worlds, and an independent Claude subagent proposal ("Kitchen-Table Planet": brass stand, quiet-not-red stress, numbers as objects, Grandstander/Atkinson/Shantell). |
| 2026-10-01 | Name: Hum | User choice. It is the sound of a healthy world and the sound of a data center, honest about both sides. |
| 2026-10-02 | Fonts self-hosted, not Google Fonts | Privacy for a kids' and classroom product (eng review). |
| 2026-10-01 | Primary darkened #E2573B → #C2412A | The proposed persimmon gave 3.7:1 with white text. #C2412A gives 5.1:1. |
