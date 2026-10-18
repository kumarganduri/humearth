# Hum v4: the sourced answer library (final rebuild spec)

## Promise
Ask anything about AI's electricity, water or CO2. You get Hum's verdict in one plain word, one range you can picture, and the receipts, at a stable link you can send, cite or play.

This is the product that the v3 reference strategy (embeds, open data, updates feed, press and teacher kit) hangs off. v3 stays in force. The only change to it is the card embed, which replaces the chart embeds and needs founder approval.

## Who it's for
1. **People with a claim.** Most visitors. They come from search, a chatbot, a forward or Reddit, often after already reading an assistant's answer. They want it settled in 10 seconds.
2. **People who pass answers on.** Journalists, teachers, students, podcasters, councillors and fact-checkers. They need dated pages they can cite.
3. **People near the load.** Neighbours and bill payers.

Every verdict must be readable by a 15-year-old or a non-native reader.

## First screen
**Phone fold budget (375×667).** Static HTML that works without JS. No globe, no essay.
1. **Bar (56 px):** wordmark · Today · Search, with 44 px targets.
2. **Headline** at title size (~30 px), at most 2 lines: "AI's electricity, water and CO2: straight answers, every number sourced."
3. **Search field:** "Heard something? e.g. is AI raising my bill?"
   - Filters titles and aliases on the device.
   - The index loads on first focus. Without JS, the field submits to a prerendered list.
   - The aria-live count is polite and debounced (~500 ms).
   - If nothing matches, an opt-in "I couldn't find my question" button appears.
4. **One fixed, hand-chosen playable card.** Default q104 (kettle).
   - The claim is quoted word for word and framed as hearsay: "Heard: … said in [source, date]".
   - A 2×2 grid of 48 px buttons: **True · Partly true · False · Nobody knows**, plus a "Just tell me" link that navigates to `/q`.
   - Below the card: "Play today's question".

**Below the fold:**
- Generated verdict rows. The first systemic row starts above the fold at 375×812. Example: "Big tech emissions rising? **YES** · the companies' own reports" (q023).
- Shelves, "Heard it this week", "Answer changed".
- A status line: "N answers · M changed · Z not published · last correction [date] · K questions not yet answered".

**Reveal (not a flip).**
- The result region appears below the buttons and focus moves to its heading (tabindex=-1).
- The chosen button keeps aria-pressed. Under reduced motion the change is instant.
- The reveal markup is prerendered, so no request is needed.
- It shows the stamp, one sentence, the claimed value as a tick against the sourced band, and a factual world line generated from a `{{fig}}`. It contains no imperative.

**Desktop.** The same column on the left. On the right, the card with a wide ladder, then a Numbers panel with 8 headline figures, each with a range, a boundary chip and a cite link.

**Place.**
- A `functions/_middleware` HTMLRewriter runs on `/` only. It maps `cf.country`/`regionCode` to four buckets: default, PJM, IE, and a non-US/EU default.
- One variant is cached per bucket, with a fallback to the static file on error. Logging is off.
- A visible line reads "Shown first for: Virginia (from your connection, not stored) · change", where "change" is a `?place=` link.

**Returning visitors.** One strip counts new answers, changed answers and the next figure due. It is hidden when all three are zero and sits in a reserved slot below the card. It uses localStorage inside try/catch.

## Answer page `/q/{slug}`
- Prerendered, works with no JS.
- Budget: ≤30 KB gz of HTML + render-blocking CSS + first-screen JS, with fonts counted separately.
- JSON-LD is **Article** (headline = question, datePublished/dateModified, publisher). QAPage and ClaimReview are not used.
- "Hum" appears in every title tag and beside every stamp ("Hum's verdict").

**Answer types:**
- **claim-check:** a stamp and a truth guess.
- **how-much:** a range and an everyday-bucket guess, no stamp.
- **explainer:** neither.

**Phone order:**
1. **H1:** the question as people ask it. At most 12 words, one question mark, positively worded. A model is named only when the answer is about that company's own disclosure.
2. **Stamp** (claim-check only): **YES · PARTLY · NO · NOBODY KNOWS**, each with an icon.
   - Chips: *out of date*, *depends on region*, *company figure*.
   - A changed verdict shows "Was NO until 3 Oct 2026: [reason]" as visible text, plus strike styling.
3. **Answer:** 40–55 words, grade 8 or lower.
   - It names the kind of use ("a short text question; long documents or reasoning can use 10 to 100 times more"), the as-of date and Hum.
   - On every small-for-you answer, the **final sentence is the world clause**, built from a `{{fig}}`.
4. **Figure bar:** low/mid/high, with a text twin.
   - A provenance badge (Measured / Estimated / Calculated by Hum / Company says so, not checked / Not published) and a boundary chip.
   - The range is stated in text in the first paragraph, using the same words as the cite string.
5. **Three next links:** *deeper*, *bigger* (the system side), *closer to home*. At least one is systemic.
6. **Share:** one primary button. It uses navigator.share with the forward text, falling back to copy with a visible "Copied" state and a selectable textarea. Cite, Embed and Report sit under "More". It must fit in 2 rows at 320 px.
7. **Recurring exit:** "Next numbers due: [event, date]. We'll update this answer" + Add to calendar (`/events.ics`), or the daily card.
8. **`<details>` folds:**
   - **Ladder:** vertical on phone, with plain-word rungs, this answer's row highlighted and a text twin ("about N times bigger than the rung below"). The rungs are one question, phone charge, kettle, household-day, town-year, **AI's share of data centres** (from constants, ranged and badged) and all data centres (country race). Every rung has a boundary chip.
   - **Comparison:** one, picked from that rung set by order of magnitude, sitting beside its world rung. No flight or car comparison unless that is the question.
   - **Why it misleads:** one of 8 named distortions, described as a property of the circulating claim. It includes one neutral sentence on what the named source actually said.
   - **What we don't know:** includes who could publish the missing figure.
   - **Sources:** verbatim quotes, the date each was checked, "live link · archived copy [date]", and verdict history.

**Footer (required):** shelves, Tools, Numbers, Updates, How we know.

## The daily question
- **At launch:** the current one-card `/daily` moves to `/today`, drawing only from published `/q` answers.
  - The repeat window is set from the pool size.
  - Reruns are labelled "rerun".
  - `migrateDaily()` maps `hum.daily` → `hum.today.v1`, keeping EPOCH and `hum.daily` for one release. Unit tests cover empty, damaged and blocked storage.
- **At about 120 published answers:** **Today's 3** ships at `/today/{N}`.
  - Fixed mix: one "you" card, one world-or-growth card, and one bills/place/company card.
  - Guess first, never timed, always skippable.
  - Each round is stored in a committed, append-only `rounds.json`. If an answer changes, its card shows the old stamp struck through, with the date and reason, and is never swapped out.
  - The repeat window is set per slot. The runway check only warns.
- **Share string:** words first, with no guesses in the URL. Example: "Hum #142: 2 of 3 right · water guess 40x too high".

## Stay, return, share
- **Stay:** the next-link graph always pairs small-for-you with big-in-total. The ladder teaches scale. "Why it misleads" teaches readers to spot the next claim.
- **Return:**
  - Search and assistants, the main route.
  - The daily question.
  - `/updates` + RSS, with a visible weekly release.
  - `events.yml` published as `/events.ics`. Each event links to the answers it will update.
  - Answers are pre-written ahead of predictable spikes: company reports, IEA/Ember releases, PJM auctions.
- **Share artefacts:** the OG card, kind reply, forward text, spoken line and round share.
  - All are **generated** from the stored stamp, chips, a 2–4 word result, range, world clause and source. None is hand-typed.
  - Every one carries both sides in one line.
  - The **kind reply** stands alone with no link: verdict word first, two-sided metric numbers, "source: [name, year]", and an optional bare link last.
  - **Forward this:** plain text, no markdown or emoji.
  - OG images stay under 300 KB and lead with the fact.
  - **Cite:** canonical URL + accessed date, in APA and Wikipedia `{{cite web}}` formats. Tags never appear in it.

## Site map
**Launch:**
- `/`, `/q/{slug}`, `/today`, `/topics/{shelf}` (7 shelves)
- `/updates` (+RSS), `/corrections`, `/how-we-know`
- `/tools/grid-now`, `/tools/2030`, `/events.ics`
- `robots.txt`, a sitemap with lastmod, `llms.txt`

**`/how-we-know` gains:**
- the verdict rules
- the distortions
- the source register
- a corrections log
- a selection-balance methods note
- a method and independence statement (funding, conflicts, verdict rules, correction response time, takedown contact)
- a sentence on the place header in `renderPrivacy()`

**Versions.** Versions live at `/q/{slug}/v/{date}`, with the `@date` form redirecting there.
- Each version is written once into `archive/q/{slug}/{date}.html` by `promote`/`affected`.
- It is copied into dist without re-rendering and verified against `archive/manifest.json`.
- The first version is created at the first real verdict change.

**Gated extras** (each ships only when its signal is seen):

| Extra | Signal |
|---|---|
| `/c/{slug}` challenge, round share | tagged share arrivals > 5% |
| `/kit/class`, `/tricks` lesson + poster | a named teacher asks |
| + Brief (QR, versioned URL), `/near/{place}` (≥6 answers; India first in queue) | a named reporter or councillor asks |
| `/not-published`, `/source/{id}` | press uses `/numbers` |
| `/numbers` + CSV, `/data` (answers.json), JSON API | after the licence audit; API when answers.json is fetched |
| `/embed/q/{slug}` | founder approves the v3 change |
| `/big-picture` (globe lazy, race, 2030 fan) | Phase 4 |
| Today's 3 | ~120 answers |
| `/tools/your-ai-year` | deferred |

**When `/c/` ships:**
- The OG image never states the claim. It poses a guess ("How many AI answers fill one 500 ml bottle? Guess") and carries "Answer inside · checked by Hum".
- There is no `/c/` link for `company_claim` answers or for H1s that name an organisation.
- A lint fails any OG text that matches a myth's claim sentence.

**When embeds ship:** `/embed/*` detaches the inherited CSP (`! Content-Security-Policy`) and sets `frame-ancestors *`. Embeds load no beacon, no storage and no outside fonts. E2e tests cover a cross-origin render and zero requests to cloudflareinsights.

## Launch set (24–30 reviewed answers)
**Candidate set:**
- **Myths:** q001, q003 (capped PARTLY: "on-site vs including power stations", model and year named), q009, q104, q107, q062
- **You:** q002, q011, q004, q006
- **World:** q026, q109, q423, q024
- **Bills:** q043, q140 (PARTLY · depends on region; monitor figure Estimated, counterfactual method named, PJM dispute in What we don't know), q031, q320
- **Companies:** q029, q042, q023 (systemic YES), q088
- **Water/hard to know:** q134, q051, q364
- **Global South:** q291, q289, q277, q126

**Held back** until re-sourced to primary sources: q323, q175, q183, q327, plus failed quotes q068, q085, q102. q348 ships without Statista. q129 must cite the `arxiv.org/pdf/2304.03271v4` PDF first.

**Finalised in Phase 0** after:
- the rule 3 re-run
- cluster decisions (`promote --cluster`) for the bottle and kettle sibling drafts
- a source-dependence report (prefer answers that don't hang on the same one or two sources)
- a one-off review by 2–3 named, credited outside readers (energy, water, grid/markets)

## Data pipeline
1. **Figure registry.** `normalise` groups the bank's 1,688 figures by (url, normalised quote) into `data/sources/figures.source.json` with canonical IDs, recording a reason for each of the 147 conflicts.
   - A quantity registry (`per-text-prompt-wh`, `water-per-prompt-ml`, `dc-2025-twh`…) holds one canonical figure per quantity.
   - Publisher-specific values use the `as_claimed_by` kind.
   - Lints fail on a duplicate (url, quote), or on two canonical figures sharing a quantity and unit.
2. **Claims.** `{{claim:id}}` tokens resolve to checked quotes with `review_by`, or to `events.yml` entries for status claims. Status or superlative words with no token start as a warning and become a failure once the launch set passes.
3. **Source fields:**
   - Required: `retrieved`, `content_sha256`, `archived_url` (Wayback, filled by `promote`), `licence`, `redistribute`, `subject`.
   - `build:data` fails on a published source with no archive.
   - Exports carry quote text only when `redistribute` allows. Otherwise they carry the reference and cite string.
4. **Freshness:**
   - `npm run check:quotes` is a weekly non-blocking job. It fetches every source (PDFs through text extraction), uses normalised matching, records status and hash, tracks found → moved → gone, opens one rolled-up issue, and spreads fetches across the week.
   - After 14 days "gone", the answer goes under review automatically.
   - `review_by` defaults to the target year for forecasts and to retrieved + 18 months otherwise. A passed date sets "out of date".
5. **`npm run affected -- <figId>`:**
   - Marks dependents "under review" with a date, which may stand openly.
   - Opens one issue.
   - Bumps dateModified and lastmod and pings IndexNow.
   - Each event in `events.yml` carries its own response target (e.g. IEA: 3 weeks).
6. **`promote q###`:**
   - Writes a tokenised 40–55 word draft and fails on any leftover digit.
   - Maps every figure to a registry ID or stops and asks for a decision.
   - Splits compound questions.
   - Refuses to run while more than 5 freshness issues are open.
   - **Required fields:** H1, type, stamp/chips, `decisive_figs`, `claim_source` (critic/industry/company/neutral), answer, figures, world clause, What we don't know, next links.
   - **Optional:** comparison, Why it misleads, aliases.
7. **`npm run withdraw <slug>@<date> --reason legal`.** Uses a signed `withdrawals.yml`. It turns the page, embed and OG into a tombstone, purges the cache and logs to `/corrections` without repeating the text.
8. **`routes.json`.** Written by `build:data`. It drives the rollup inputs, prerendering, `check:budget` (every route, including the largest `/q`), Lighthouse (`/`, the largest `/q`, `/today`, `/tools/2030`; LCP ≤ 2.5 s, CLS ≤ 0.1 under mobile throttling) and the diff glob.
   - The search index is a hashed JSON, ≤25 KB gz at 310 answers, and the entry chunk must not import it.
   - Preload only subset Instrument Serif and Atkinson 400, with size-adjusted fallbacks.

## Honesty rules
**The build fails on each of these:**
1. **No unsourced figures and no literal digits in prose.** Every number is a `{{fig}}` with `checked: "page"`.
2. **No stamp stronger than its range.** A range that overlaps the claim forces PARTLY.
3. **Provenance caps the stamp.** If every decisive figure is "Company says so, not checked", the stamp is at most PARTLY and shows the *company figure* chip on every artefact.
   - Exception: a company admitting something against its own interest (q023) may earn YES.
   - A myth NO must hold at the high end of an independent estimate (Li et al. PDF, Epoch, AI Energy Score, IEA).
   - A myth whose comparison figures carry mismatched boundary chips fails unless a "mixed boundaries" block explains it.
4. **Small-for-you needs the world side.** The world clause is the final sentence of the answer, plus a systemic next link. Orphan pages fail.
5. **Generated artefacts match their page.** Any artefact whose stamp differs from its `/q` page fails. Two answers sharing a quantity must agree on the stamp, or record a reason.
6. **Derived values look different and say so.** Each gets a visible "≈ Hum's sum" tag. Derived SVG marks are dashed, with an end label "calculated" and a stroke of at least 2 px. Solid underlines are for links only. An axe check confirms every derived mark has a visible label.
7. **No per-query × users totals,** unless a `{{fig}}` marked Calculated by Hum and drawn dotted.
8. **No ranking across boundaries,** and consumption vs generation is always stated.
9. **Metric first,** with imperial in brackets. Every "homes" or "per person" figure names its country. Numbers and dates render through Intl.
10. **Named parties need a primary source or an attribution token.** A republisher can't be the only source, and fault verbs appear only inside attributed quotes. No logos.
11. **Changed verdicts and versions are never rewritten.**
12. **No banned phrasing** in verdicts or closers: second-person imperatives and guilt words (should, waste, guilty, harmless).

**PR warnings only:**
- grade level (with a proper-noun allowlist)
- fewer than 5 NOBODY KNOWS answers
- the selection-balance report by `claim_source` over a rolling quarter (the selection rule is published: search demand, then priority, contested pairs added together)
- the runway check

**House-style file** (written before Phase 1, enforced on all rendered text):
- **Plain display forms:** `{{fig:dc-2025|plain}}` renders as "about as much electricity as France uses in a year".
- **Chips:** plain phrase first ("Made vs used (generation vs consumption)"), expanding on tap or focus.
- **Glossary:** first-use glosses ("PJM, the grid serving 13 eastern US states").
- **Hedge ladder tied to provenance:** Measured: no hedge · Estimated: "about" · Calculated: "by our sums" · Company: "X says" · Not published: "nobody has published".
- **Strings:** all stamp and share strings live here, with non-English aliases for the top 20 questions.

**Visual tests** at 320 and 375 px: labels at least 16 px apart, text at least 12 px.

## Privacy and measurement
- **Feedback endpoint** (search miss + report a problem):
  - The visitor sees the exact text before it is sent.
  - The server cuts it to 120/500 characters and strips emails, URLs, digit runs and handles.
  - It stores `{text, slug/fig, day}` with a 90-day TTL, and no IP, country, UA or referrer.
  - Rate limiting is a WAF rule. Logs are off.
  - The optional report contact is stored separately with a 30-day TTL. A mailto: alternative is offered.
  - An e2e test checks the request body.
- **Share routes** accept only allowed tags and no free-form values. Anything personal stays on the device or in a `#fragment`.
- **Phase 0 tag test.** If Web Analytics drops query strings, tags become paths that canonicalise to the answer (`/q/{slug}/via/reply`, `/q/{slug}/n/bigger`). They are stripped with replaceState. Key actions are real navigations.
- **Metrics.** A weekly CI job writes aggregate analytics to `data/metrics/weekly.csv`, starting 4 weeks before launch as a baseline.
  - Results are judged on 4-week rolling sums with at least 200 arrivals.
  - Beacon views are compared with zone requests as a coverage factor.

| Signal (90 days) | Target |
|---|---|
| 10-second test (Phase 0, repeated at launch, day 45, day 90 with the same people) | 7 of 10 say what Hum is for, and most name what it adds over an assistant |
| `n/*` next views ÷ untagged `/q` entries | ≥ 1.5 |
| World-side views per small-for-you view | ≥ 20%, else move it higher |
| Tagged share arrivals | ≥ 5% (unlocks `/c/`), aim 15% |
| Hum named or linked in the quarterly check of 30 questions (internal) | rising |
| Search Console impressions alongside clicks; share of entries on `/q` | tracked, not targeted |
| Outside citations, embeds, fact-checker pickups | ≥ 10 |
| Search misses | weekly list; top misses written first |

"Stay more than a minute" is dropped as a goal.

## Migration
- **`redirects.yml`** generates `_redirects` and maps every old pattern, including query and hash:
  - `/question` → q002
  - `?kind=picture|video` → the matching answer
  - `/?year=` → `/big-picture`
  - `/live` → `/tools/grid-now`
  - `/daily` → `/today`
  - all `.html` forms
- **`/2030`:** `functions/2030.ts` moves to `functions/tools/2030.ts`, with a stub that 301s `/2030` and `/2030.html` and keeps the query. An e2e test checks that the personalised og:title survives.
- **Cut:** the since-midnight counters ("nothing counts up").
- **Grid cards** move to `/tools/grid-now`, worded "if one AI answer ran on this grid's average".
- **Kept:** How We Know anchor ids.
- **Share tag** is renamed so `legacy.ts` can't strip it.
- **Tests:** e2e specs are ported, using a spec-migration table, before any page moves.

**Robots.** `public/robots.txt` allows OAI-SearchBot, ChatGPT-User, PerplexityBot, Claude-SearchBot and Googlebot, with a Content-Signal line (search=yes, ai-input=yes, ai-train = founder's choice). A post-deploy check fetches `/robots.txt` and one `/q` with each user agent and expects 200. The Cloudflare AI Crawl Control setting is recorded in the ops notes.

## The founder's week (cap: 4 hours)

| Task | Minutes |
|---|---|
| Promote 2–3 answers (re-set from the timed first 5) | 150 |
| Weekly digest issue: freshness, reports, misses; "reviewed within 30 days" with a template reply | 30 |
| Heard it this week / pre-write for the next event | 20 |
| Kind replies (links only on Bluesky and own threads) | 20 |
| `events.yml`, metrics CSV | 20 |

- **Quarterly:** the assistant check, plus changed questions.
- **One-off:** pitch the launch myths and answers.json to Full Fact, AFP, BOOM, Africa Check, Chequeado and science communicators.
- **Event-driven:** local reporters, but only for events already in `events.yml`.

## Where the tournament disagreed
- **Claim-checker (2nd, 39.3).** It argued that a paste-anything referee desk matches how claims actually arrive, and that its fair-reply text is the best sharing tool. It lost on solo feasibility (4.5). Its ideas survive as the kind reply, "Why it misleads" and public corrections.
- **Daily round (3rd, 38.9; 9 favourites, best at 10 seconds).** Its backers argued that a habit beats search as a way to bring people back, and that gating Today's 3 at 120 answers delays the only real retention loop. The answer: a daily that repeats every two weeks trains people to leave.
- **Show the verdict before any tap.** Rejected, because the playable card is the fix for "don't understand it". The risk is mitigated by hearsay framing and "Just tell me".
- **Exposure-weighted balance, and "no more than 2 smaller-than-claimed in a row".** Rejected as verdict quotas. Critics on the industry side still see a lean in the myth-heavy launch, which is answered by the systemic row and the world clause.
- **Volunteer sign-off on every verdict.** Reduced to a one-off launch review.
- **Same-day stubs and 48-hour promises.** Rejected in favour of pre-writing ahead of known spikes.
- **`?r=` streak tag and read-card swaps.** Rejected or deferred.
- **Where it lands** (strong on trust, 3.0 on feasibility). Kept as gated `/near` and + Brief.
- **Ruler.** Kept as the ladder fold.
- **Receipt and swipe feed.** Cut. Some argued that a personal receipt is the only real personal stake. It is deferred, not refused.

## Decisions for the founder
1. **ai-train in Content-Signal.** *Recommend yes.* CC BY reach matters more than control, and the cite string travels with the content.
2. **Card embed replacing v3 chart embeds.** *Recommend approve.* One template, ≤30 KB, no tracking.
3. **Front-door card.** q104 (kettle) or q002. *Recommend q104.* It is a hearsay claim with a like-for-like verdict, and its NO holds on independent highs.
4. **Publish the assistant check?** *Recommend internal* until the method has run for two quarters.
5. **Global South swaps** (4 launch slots). *Recommend yes*, with a non-US/EU default row.
6. **Any new counter or the Belief Index.** *Recommend no for v4.* Repeat task tests answer the same questions without tracking.
7. **Outside readers.** Name 2–3 and agree on credit before Phase 2.

## Build phases
- **0. Validate (1–2 weeks).**
  - A clickable HTML prototype with real fonts and the real reveal, tested on 375 and 390 px phones, half on the PJM order.
  - Testers: teens, 2 non-native readers, 1 from outside the US/EU, 2 journalists. Each first sees the real assistant answer for 3 questions, and the test includes a ladder comprehension question.
  - Also in Phase 0: the tag test; fix the 5 failed quotes; backfill archives; re-run rule 3 on the myths; cluster decisions; source-dependence report; outside review.
  - Build only if the test passes.
- **1. v3 core + pipeline (3 weeks).**
  - Source register and `check:quotes`, then the licence audit, then the house-style file and the figure/quantity registry.
  - Schema, `promote` (5 timed runs), `affected`, `withdraw`, all lints, `routes.json` budget/Lighthouse, `events.yml`/ics, robots/sitemap, metrics baseline.
- **2. Minimal launch (~week 5–6).**
  - Front door with the middleware, the `/q` template, 24–30 answers, search, shelves.
  - `/today` (one card), `/updates` + RSS, `/corrections`.
  - Generated share, Cite, OG, redirects, `/tools` moves, the counter cut, the feedback endpoint.
- **3. Grow and measure.** 2–3 answers a week, ordered by Search Console impressions, then misses, then priority. Review at day 45.
- **4. Gated extras,** each when its signal is seen: `/numbers` + data, `/big-picture`, `/c/`, `/kit/class`, + Brief, `/near`, embeds, Today's 3.

**Every phase** stays within the 90 KB gz first-screen budget, has no three.js on the first screen, and passes e2e on desktop and phone.

## Completeness critic

- **The front-door card fails the spec's own rule 3.** The bank's q104 record has four figures: OpenAI's 0.34 Wh and Google's 0.24 Wh (both `company_claim`) and two of Hum's own sums (`calculated`). No independent estimate is in it. As written, rule 3 caps q104 at PARTLY with the *company figure* chip. Decision 3 ("its NO holds on independent highs") is unsupported until an independent per-prompt high is added and checked on the page. The hearsay line has a second problem. The only quotable kettle claim in `evidence_people_ask` is a Medium post saying a query is "3% of boiling a kettle". That roughly agrees with the verdict, so it cannot stand as the false claim being checked. Pick and source the front-door claim, or switch to q002, before building the Phase 0 prototype.

- **Several launch answers rely on republishers only, which rule 10 forbids, and they are not on the held-back list.** All 5 figures in q023 come from ESG Dive. All 5 in q140 and all 3 in q043 come from Utility Dive reporting the PJM market monitor. 3 of q364's 6 do too. q023 is the headline "systemic YES" row, and q140/q043 are the bills shelf and the PJM place bucket. The spec needs a re-source task (Google and Microsoft reports, Monitoring Analytics PDFs) in Phase 0, with a fallback if those PDFs can't be text-matched.

- **The figure bar and rules 2 and 3 assume ranges that mostly don't exist.** Of about 128 figures in the 29 candidates, roughly 20 have a low/high. q001, q009, q107, q002, q109, q023, q029 and others have none. The spec doesn't say what rule 2 ("range overlaps claim → PARTLY") does with a single point. It also doesn't say how the figure bar or tick draws one, or whether `promote` refuses, widens or badges a mid-only figure. Without that rule, most stamps can't be computed.

- **"Not checked" figures are wider than the 5 named failed quotes.** Launch candidates with at least one figure not marked `found` are q002, q004, q006 (2), q026, q423, q289 and q277. Phase 0 has to clear or drop these, and `build:data` has to say what it does with them, or the launch set shrinks without warning.

- **The bank's kinds don't map to the five provenance badges.** The bank uses `estimate`, `forecast`, `policy_or_event`, `measured`, `calculated` and `company_claim`. The badges are Measured / Estimated / Calculated / Company says so / Not published, so `forecast` and `policy_or_event` have no badge or hedge word. q024 is all forecast and policy figures, for example. The `as_claimed_by` registry kind also needs a place in this mapping. Every badge, hedge word, provenance cap and `review_by` default hangs off it.

- **Answer IDs, slugs and the schema are not defined.** The bank has no type, stamp, H1, slug, aliases, `claim_source`, `decisive_figs`, world clause or next links. These are all `promote`'s job, but the spec never says:
  - how slugs are made, or whether they are frozen;
  - what happens to versions, cites, redirects and `rounds.json` if a slug or H1 changes;
  - how a cluster split (`promote --cluster`, compound questions) gives out q### and slug IDs.

  Without this, the stable-link promise has no mechanism behind it.

- **The place buckets have no content behind them.** The IE bucket has no Ireland answer in the launch set. The non-US/EU default depends on 4 Global South slots that Decision 5 hasn't approved yet. The spec also doesn't say which rows or card each bucket changes, or what a visitor sees for a bucket with fewer than N answers. There's a layout conflict too: "the first systemic row starts above the fold at 375×812" contradicts the 375×667 fold budget, so name one target viewport for the visual tests.

- **Phase 0 can't be judged and Phase 1 doesn't fit the founder's time.** "Build only if the test passes" has no pass threshold, tester count or fallback for a fail. The only target given is 7 of 10 at day 90. Phase 1 also packs everything below into 3 weeks with no estimate against the 4-hour weekly cap or the 150 minutes for answers:
  - a source register and weekly PDF re-checks;
  - the licence audit;
  - the figure registry, which must resolve 147 conflicts;
  - `promote`, `affected` and `withdraw`;
  - 12 build-failing lints;
  - the Wayback archive backfill;
  - the metrics CSV, which must start 4 weeks before launch.

  The spec should give the hour budget for Phases 0–2 and say what gets cut if they overrun, for example deferring `withdraw`, the IndexNow ping or the place middleware.
