# Stage 1a sourcing record (T0)

Collected 2026-10-03. Every quote below was confirmed on the live page by script (fetched HTML, tags stripped, exact substring found), not taken from search summaries.

**Decisions (2026-10-03):**
- Use the newest IEA figure where one exists, and label each value with its report year.
- Video energy is 25 · 90 · 944 Wh.
- The grid-carbon high is 560 g/kWh (China 2024).

**When these reach the data files:** the series and countries files are created in T1. The new video and grid values go into `constants.source.json` in T2, together with the removal of the v1 guardrails. Changing the video figure earlier would break v1's guardrail tests mid-branch.

## Data-centre electricity (consumption, TWh/yr)

**Consumption vs generation:** the IEA also quotes *generation* for data centres (460 TWh in 2024, over 1,000 in 2030, 1,300 in 2035, on [energy-supply-for-ai](https://www.iea.org/reports/energy-and-ai/energy-supply-for-ai)). Hum uses **consumption** only.

| Year | Low | Mid | High | Kind | Quote | Source |
|---|---|---|---|---|---|---|
| 2024 | 415 | 415 | 415 | published (single estimate) | "Data centres accounted for around 1.5% of the world's electricity consumption in 2024, or 415 terawatt-hours (TWh)." | [IEA Energy and AI, exec summary (2025)](https://www.iea.org/reports/energy-and-ai/executive-summary) |
| 2025 | 485 | 485 | 485 | published (single estimate) | "electricity consumption from data centres roughly doubling from 485 TWh in 2025 to 950 TWh in 2030" | [IEA Key Questions on Energy and AI, exec summary (2026)](https://www.iea.org/reports/key-questions-on-energy-and-ai/executive-summary) |
| 2030 | — | 950 | — | published base; no range published in text | same quote as 2025 | same |
| 2035 | 700 | 1,200 | 1,700 | published | "Our Base Case sees global data centre electricity consumption rising to around 1 200 TWh by 2035." and "By 2035, the range of data centre electricity demand across our cases spans from 700 to 1 700 TWh." | [IEA Energy and AI, exec summary (2025)](https://www.iea.org/reports/energy-and-ai/executive-summary) |
| 2017–2023 | derived | derived | derived | back-calculated from 2024 | "data centre electricity consumption has grown by around 12% per year since 2017" | IEA exec summary (2025) |

**Two vintages:** 2024 and the 2035 range come from the 2025 report; 2025 and 2030 come from the 2026 update, which raised 2030 from 945 to 950. Each point keeps its own report and year in the data.

**Supporting quotes** (for How We Know text, not plotted):
- "Electricity consumption from AI-focused data centres grew even faster, surging 50% in 2025." (Key Questions 2026)
- "Electricity consumption in accelerated servers, which is mainly driven by AI adoption, is projected to grow by 30% annually in the Base Case" ([energy-demand-from-ai](https://www.iea.org/reports/energy-and-ai/energy-demand-from-ai))
- High Efficiency case: "global electricity demand from data centres reaching around 970 TWh by 2035" (energy-demand-from-ai)

**Not published in text** (drawn as derived or left out):
- the 2030 low/high (shown in IEA charts only)
- yearly 2017–2023 values
- an AI share of the total as a percentage

## CO2 from data-centre electricity (Mt CO2/yr)

| Year | Low | Mid | High | Quote | Source |
|---|---|---|---|---|---|
| today (2024) | 180 | 180 | 180 | "Emissions from electricity use by data centres grows from 180 million tonnes (Mt) today to 300 Mt in the Base Case by 2035, and up to 500 Mt in the Lift-Off Case." | [IEA exec summary (2025)](https://www.iea.org/reports/energy-and-ai/executive-summary) |
| 2035 | no published low | 350 | 500 | "The emissions associated with data centres double in IEA projections, reaching around 350 million tonnes in 2035" (mid); 500 is the Lift-Off figure in the quote above (high) | [IEA Key Questions (2026)](https://www.iea.org/reports/key-questions-on-energy-and-ai/executive-summary) and 2025 report |

The 2025 report's 2035 base was 300 Mt; the 2026 update says ~350 Mt. Following "newest where available", the mid is 350. The low cases' CO2 appears only in charts, so the band shows "no published low" and is never filled in.

## AI video energy per short clip (Wh)

| Level | Value | Quote | Source |
|---|---|---|---|
| low | 25.3 | Table 4 row "CogVideoX-5B 124 ± 0.4, 21.6 ± 0.05, 2.4 ± 0.03, 1.3 ± 0.004". Columns are latency (s), then GPU, CPU and RAM energy (Wh). 21.6 + 2.4 + 1.3 = 25.3 Wh for 49 frames at 480×720. | [Delavande, Pierrard & Luccioni, "Video Killed the Energy Budget" (arXiv:2509.19222, 2025)](https://arxiv.org/html/2509.19222) |
| mid | 90 | "generating a single short video with WAN2.1–T2V–1.3B consumes nearly ∼90 Wh" | same |
| high | 944 | MIT Technology Review: a newer five-second clip uses "about 3.4 million joules" (already in `constants.source.json`). Cross-check: Wan2.1-14B "consumes over 415 Wh" (arXiv above). | [MIT Technology Review (May 2025)](https://www.technologyreview.com/2025/05/20/1116327/ai-energy-usage-climate-footprint-big-tech/) |

**Measurement scope:** "All experiments were conducted on a dedicated NVIDIA H100 SXM GPU (80GB HBM3)". These are per-GPU figures without data-centre overhead, so the middle estimate is conservative.

**Effect on the site:** one video at the middle estimate goes from about 2,776 text answers (944 / 0.34) to about 265 (90 / 0.34).

## Grid carbon intensity (g CO2 per kWh, location-based, 2024)

| Level | Value | Quote | Source |
|---|---|---|---|
| low | 125 | unchanged (Google, already in constants) | — |
| mid | 473 | "Emissions intensity dropped by 2.3% to 473 grams of CO2 per kilowatt hour (gCO2/kWh)" | [Ember Global Electricity Review 2025, trends](https://ember-energy.org/latest-insights/global-electricity-review-2025/global-electricity-trends/) |
| high | 560 | "China's carbon intensity of electricity generation was 560 gCO2/kWh, down 4.1% from 2023" | [Ember GER 2025, major countries](https://ember-energy.org/latest-insights/global-electricity-review-2025/major-countries-and-regions/) |

**Context, not used as values:**
- "The carbon intensity of India's power sector was 708 gCO2/kWh in 2024"
- "The carbon intensity of US electricity generation was 384 gCO2/kWh"

## Country electricity demand (TWh, 2025), for the race

**Source:** Ember yearly electricity data. Page: https://ember-energy.org/data/yearly-electricity-data/ ("Last Updated: 15/09/2026"). The licence is quoted on the same page: "All content is released under a Creative Commons Attribution Licence (CC-BY-4.0)."

**The file:**
- **URL:** https://files.ember-energy.org/public-downloads/generation/outputs/release_generation_yearly_global.csv
- **Downloaded:** 2026-10-03, 16,084,305 bytes
- **sha256:** `ea214963f4a98b26f52aaf541736d4310349a905e64f83e63425bfc3ab6255d7`

**Filter:** `Electricity source` = `Demand`, `Year` = 2025, `Area type` = "Country or economy". The value is in the column `Generation (TWh)`, which holds demand on Demand rows. Hum uses **demand**, not generation; for France, demand is 480.6 and generation is 574.4.

| Country | 2025 demand (TWh) |
|---|---|
| India | 2081.468 |
| Russia | 1177.295 |
| Japan | 1029.97 |
| Brazil | 763.776 |
| Canada | 645.63 |
| South Korea | 624.671 |
| Germany | 516.525 |
| France | 480.57 |
| Mexico | 356.66 |
| Italy | 312.805 |
| United Kingdom | 311.308 |
| Australia | 286.76 |
| Spain | 275.25 |
| Sweden | 136.763 |
| Netherlands | 120.987 |

Spot-checked by script against the CSV: France, Germany, Japan, UK, Netherlands and India all match. 2025 figures may be preliminary for some countries; Ember revises twice a month, and CI's hash check will force an explicit update when the file changes.

**What it means:** data centres at 485 TWh (2025) sit just above France (480.6) and below Germany (516.5). At the 2030 base of 950 TWh, they sit just below Japan (1,030).
