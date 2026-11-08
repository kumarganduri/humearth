# Ten new answers: draft for review

Drafted 2026-11-08 from the most-asked unanswered questions in the question bank. Every quote was read on its page, and all ten pass the build’s checks (`npx tsx scripts/validate-draft.ts`). **Approved as drafted and shipped on 2026-11-08.**

**What I need from you:** for each answer, *approve*, *change* (say what), or *drop*. The “Check” lines are the judgement calls.

| # | Question | Stamp | Short answer |
|---|---|---|---|
| 1 | [How much electricity does one big AI data centre use, compared with homes?](#1) | (none) | Up to millions of homes: about 4 million for Meta’s planned 5 GW campus |
| 2 | [How many data centres are there in the world?](#2) | (none) | More than 8,000, but nobody keeps an official count |
| 3 | [What share of US electricity do data centres use, and how fast is it rising?](#3) | (none) | About 4.7%, and rising fast |
| 4 | [Is AI the main reason data-centre electricity use is growing?](#4) | YES | Yes, the biggest single reason, but not the only one |
| 5 | [Are data centres causing new gas power plants to be built?](#5) | YES | Yes, in named cases, like Meta’s data centre in Louisiana |
| 6 | [Are coal plants being kept open because of data centres?](#6) | PARTLY | Some are, and data centres are one of several reasons given |
| 7 | [Will deleting old emails and photos really save water?](#7) | NO | No. The saving is far too small to notice |
| 8 | [Is it greener to use a smaller “mini” or “flash” AI model?](#8) | PARTLY | Usually, unless it thinks for longer |
| 9 | [How many permanent jobs does a data centre create?](#9) | (none) | About 50 for a big building, half of them contractors |
| 10 | [Can the heat from data centres be used to warm homes?](#10) | PARTLY | Yes, in a few places. Across the EU, about 1.8% of it is reused |

<a id="1"></a>
## 1. How much electricity does one big AI data centre use, compared with homes?

`big-data-centre` · Comparisons and myths · how-much

**Guess:** Meta says its Louisiana AI campus will have 5 gigawatts of compute capacity. Running flat out, that’s the electricity of about how many average US homes? Options: 40,000 / 400,000 / 4 million / 40 million

**Short answer:** Up to millions of homes: about 4 million for Meta’s planned 5 GW campus

**Reveal:** A typical AI data centre uses as much electricity as 100,000 households, the IEA says. The largest ones being built will use 20 times that.

**Answer:** It depends a lot on size. The IEA says a typical AI-focused data centre uses as much electricity as 100,000 households, and the largest ones being built will use 20 times as much: about 2,000,000 households. Companies give the size of a campus as power (how fast it can draw electricity), not as energy used in a year. An average US home bought 10,791 kWh in 2022, which is about 1.23 kW, all the time (Hum’s sum). Crusoe’s AI campus in Abilene, Texas is planned at 1.2 GW: at full power, that’s about 974,000 US homes. Meta says its Richland Parish campus in Louisiana will deliver 5 GW of compute capacity: about 4 million US homes, or about 3 million Louisiana homes, which use more. These are what the campuses would consume, not generate. They are the companies’ own plans, and real use is lower because sites don’t run flat out all the time.

**Bigger picture:** All the world’s data centres consumed about 485 TWh of electricity in 2025 (IEA). Meta’s 5 GW campus, run flat out for a year, would use about 44 TWh: about 9% of that, from one site.

**What we don’t know:**
- Companies publish capacity, the most power a campus can draw. None of them publishes how much electricity these campuses actually use in a year.
- Meta says “compute capacity”. Its page doesn’t say whether the 5 GW includes cooling and the rest of the site.
- The IEA’s summary doesn’t say which country’s households it means, so its 100,000 isn’t quite the same as Hum’s US homes.
- Crusoe expected Abilene’s second phase to be finished in mid-2026. Hum hasn’t checked that it is.

**Sources:**
- Estimate: IEA, Energy and AI (2025), executive summary: “A typical AI-focused data centre consumes as much electricity as 100 000 households, but the largest ones under construction today will consume 20 times as much…” ([link](https://www.iea.org/reports/energy-and-ai/executive-summary))
- Company figure: Crusoe, press release on its Abilene, Texas AI campus (18 March 2025): “The second phase of construction, expected to be completed in mid-2026, includes six additional buildings, bringing the total facility to eight buildings, appro…” ([link](https://www.crusoe.ai/resources/newsroom/crusoe-expands-ai-data-center-campus-in-abilene-to-1-2-gigawatts))
- Company figure: Crusoe, press release on its Abilene, Texas AI campus (18 March 2025): “The initial phase, comprising two buildings at 980,000 square feet and 200+ megawatts, is expected to be energized in the first half of 2025.” ([link](https://www.crusoe.ai/resources/newsroom/crusoe-expands-ai-data-center-campus-in-abilene-to-1-2-gigawatts))
- Company figure: Meta, Richland Parish (Louisiana) data center page: “This data center will play a vital role in accelerating our AI progress, delivering 5 gigawatts of compute capacity to house Hyperion, our largest multi-gigawat…” ([link](https://datacenters.atmeta.com/richland-parish-data-center/))
- Measured: US Energy Information Administration (EIA), FAQ: How much electricity does an American home use?: “In 2022, the average annual amount of electricity sold to (purchased by) a U.S. residential electric-utility customer was 10,791 kilowatthours (kWh), an average…” ([link](https://www.eia.gov/tools/faqs/faq.php?id=97&t=3))
- Measured: US Energy Information Administration (EIA), FAQ: How much electricity does an American home use?: “Louisiana had the highest annual electricity purchases per residential customer at 14,774 kWh” ([link](https://www.eia.gov/tools/faqs/faq.php?id=97&t=3))
- Estimate: IEA, Key Questions on Energy and AI (2026): “electricity consumption from data centres roughly doubling from 485 TWh in 2025 to 950 TWh in 2030” ([link](https://www.iea.org/reports/key-questions-on-energy-and-ai/executive-summary))

**Hum’s sums:**
- An average US home buys 10,791 kWh a year. Spread over 365 days × 24 hours, that’s about 1.23 kW, all the time
- IEA: a typical AI data centre uses as much as 100,000 households. The largest being built, 20 times that: 100,000 × 20 = 2,000,000 households
- Crusoe’s first phase, 200 MW = 200,000 kW, drawn 24 hours a day for 365 days ÷ 10,791 kWh a home ≈ 162,000 US homes, at full power
- Abilene, 1.2 GW = 1,200,000 kW, drawn 24 hours a day for 365 days ÷ 10,791 kWh a home ≈ 974,000 US homes, at full power
- Meta’s 5 GW = 5,000,000 kW, drawn 24 hours a day for 365 days ÷ 10,791 kWh a home ≈ 4 million US homes (4,060,000), at full power
- Meta’s 5 GW = 5,000,000 kW, drawn 24 hours a day for 365 days ÷ 14,774 kWh a Louisiana home ≈ 3 million Louisiana homes (2,960,000), at full power
- 5 GW × 24 hours × 365 days = 43,800 GWh ≈ 44 TWh in a year, at full power
- 44 TWh ÷ 485 TWh (all data centres, 2025) ≈ 9%

**Check:**
- Meta’s page says 5 GW of “compute capacity”; it may not include cooling, so real use could differ.
- IEA numbers like “100 000” are stored with a narrow space, the convention Hum already uses for IEA figures.

<a id="2"></a>
## 2. How many data centres are there in the world?

`how-many-data-centres` · The world's total · how-much

**Guess:** About how many giant ‘hyperscale’ data centres did the big cloud and internet companies run at the end of 2025? Options: 136 / 1,360 / 13,600 / 136,000

**Short answer:** More than 8,000, but nobody keeps an official count

**Reveal:** The IEA counted more than 8,000 in its 2024 report. About 1,360 are giant ‘hyperscale’ ones, and those hold 48% of all data-centre capacity.

**Answer:** It depends what you count, and there’s no official world count. The IEA’s Electricity 2024 report said there were more than 8,000 data centres, about 33% in the US, 16% in Europe and close to 10% in China. The IEA sorts them into three kinds: a company’s own (enterprise), rented space (colocation) and the giants (hyperscale). The giants are counted on their own. Synergy Research Group, a market-research firm, follows 19 big cloud and internet companies. They ran 1,360 large ‘hyperscale’ data centres at the end of 2025, up 224 in a year. That’s only about 17% of the IEA’s count (rough, since the years differ), but they hold 48% of the world’s data-centre capacity. So counting buildings says less than counting power.

**Bigger picture:** The giants are still growing: Synergy says almost 800 more hyperscale data centres are in the pipeline, enough to double their capacity in about three years.

**What we don’t know:**
- No government or international agency keeps an official count of the world’s data centres.
- The IEA’s 8,000 is from its 2024 report, and Hum hasn’t found how it defines a data centre, so it can’t be lined up exactly with Synergy’s 1,360.
- Online directories list more sites than the IEA, but Hum couldn’t open them to check their totals.
- Small server rooms inside offices, schools and hospitals aren’t in any count Hum found.

**Sources:**
- Estimate: IEA, Electricity 2024: Analysis and forecast to 2026 (report PDF, page 32): “There are currently more than 8 000 data centres globally, with about 33% of these located in the United States, 16% in Europe and close to 10% in China.” ([link](https://www.iea.org/files/18f3ed24-4b26-4c83-a3d2-8a1be51c8cc8/Electricity2024-Analysisandforecastto2026.pdf))
- Estimate: IEA, Electricity 2024: Analysis and forecast to 2026 (report PDF, page 32): “Around 1 240 data centres were operating within Europe in 2022, with the majority concentrated in the financial centres of Frankfurt, London, Amsterdam, Paris, …” ([link](https://www.iea.org/files/18f3ed24-4b26-4c83-a3d2-8a1be51c8cc8/Electricity2024-Analysisandforecastto2026.pdf))
- Estimate: IEA, Energy and AI (2025), Energy demand from AI: “All three types of data centres – enterprise, colocation and server provider, and hyperscale – contribute to the growth in electricity consumption.” ([link](https://www.iea.org/reports/energy-and-ai/energy-demand-from-ai))
- Estimate: Synergy Research Group, press release (7 April 2026): “The number of large data centers operated by hyperscale companies reached 1,360 at the end of the fourth quarter of 2025, and new data from Synergy Research Gro…” ([link](https://www.srgresearch.com/articles/hyperscale-operators-to-account-for-67-of-all-data-center-capacity-by-2031))
- Estimate: Synergy Research Group, press release (19 March 2025): “the number of large data centers operated by hyperscale providers increased to 1,136 at the end of 2024” ([link](https://srgresearch.com/articles/hyperscale-data-center-count-hits-1136-average-size-increases-us-accounts-for-54-of-total-capacity))
- Estimate: Synergy Research Group, press release (19 March 2025): “The research is based on an analysis of the data center footprint of 19 of the world’s major cloud and internet service firms” ([link](https://srgresearch.com/articles/hyperscale-data-center-count-hits-1136-average-size-increases-us-accounts-for-54-of-total-capacity))
- Estimate: Synergy Research Group, press release (7 April 2026): “There are almost 800 hyperscale data centers in our known future pipeline, enabling hyperscale capacity to double in just three years.” ([link](https://www.srgresearch.com/articles/hyperscale-operators-to-account-for-67-of-all-data-center-capacity-by-2031))

**Hum’s sums:**
- About 33% of 8,000 ≈ 2,640 data centres in the US (IEA, 2024 report; it says “more than”, so this is a floor)
- 1,360 hyperscale ÷ 8,000 in all ≈ 17%. Rough: the two counts are from different years and different sources
- 1,360 at the end of 2025 − 1,136 at the end of 2024 = 224 more hyperscale data centres in a year

**Check:**
- The IEA count (8,000+) comes from its Electricity 2024 PDF, which blocks automated checks; the freshness watch may show it as down.
- Online directories list about 11,000–12,000 sites but weren’t readable; only mentioned in “don’t know”.

<a id="3"></a>
## 3. What share of US electricity do data centres use, and how fast is it rising?

`us-share` · The world's total · how-much

**Guess:** What share of US electricity did data centres use in 2024? Options: 0.5% / 4.7% / 15% / 30%

**Short answer:** About 4.7%, and rising fast

**Reveal:** About 192 TWh in 2024, by Berkeley Lab’s count. Its central forecast for 2030 is 649 TWh, about 11.8% of US electricity.

**Answer:** About 4.7% of US electricity consumption in 2024, or 192 TWh, by Berkeley Lab, a US Department of Energy lab. That doesn’t count crypto mining. Around 2017 it was roughly 60 to 80 TWh, by earlier estimates. Use grew 14% from 2023 to 2024. Berkeley Lab expects growth to speed up: 22% in 2025 and 29% in 2026. Its central forecast is 649 TWh by 2030, about 3.4 times 2024 and 11.8% of US electricity. Its range for 2030 runs from 9.5% to 15.3%. The rise is driven mainly by AI servers, which it expects to use 55% of US data-centre electricity by 2030.

**Bigger picture:** The US used 45% of the world’s data-centre electricity in 2024, more than any other country (IEA).

**Why this stamp:** Companies are filling data centres with AI servers, and each new chip draws more power than the last. Berkeley Lab says data centres would make up 33% of all the growth in US electricity use from 2024 to 2030.

**What we don’t know:**
- Nobody meters every US data centre. Berkeley Lab builds its figure from how many servers are sold and how much power each draws, and it revised earlier years down slightly in its 2025 update.
- The 2030 figures are forecasts, and they disagree. The IEA’s 2025 forecast for US data centres was about 430 TWh, well below Berkeley Lab’s 649 TWh. The IEA also says data centres make nearly half of US electricity-demand growth to 2030, where Berkeley Lab says 33%.

**Sources:**
- Estimate: Lawrence Berkeley National Laboratory, United States Data Center Energy Usage Report: 2025 Update (June 2026; US figures, consumption, crypto mining excluded): “The updated estimate of data center electricity use in 2024 is 192 terawatt-hours (TWh), accounting for 4.7% of total U.S. electricity consumption.” ([link](https://www.energy.gov/documents/united-states-data-center-energy-usage-report-2025-update))
- Estimate: Lawrence Berkeley National Laboratory, United States Data Center Energy Usage Report: 2025 Update (June 2026), summing up earlier estimates by others: “Historical estimates from sources including EPRI, Goldman Sachs, and Boston Consulting Group show broad agreement that U.S. data center electricity use grew fro…” ([link](https://www.energy.gov/documents/united-states-data-center-energy-usage-report-2025-update))
- Estimate: Lawrence Berkeley National Laboratory, United States Data Center Energy Usage Report: 2025 Update (June 2026; US figures): “with ever-increasing computing capabilities and power consumption, led to a 14% increase in U.S. data center electricity use between 2023 and 2024.” ([link](https://www.energy.gov/documents/united-states-data-center-energy-usage-report-2025-update))
- Forecast: Lawrence Berkeley National Laboratory, United States Data Center Energy Usage Report: 2025 Update (June 2026; US figures): “In the near term, growth accelerates, with Reference Case energy consumption increasing 22% from 2024 to 2025 and 29% from 2025 to 2026.” ([link](https://www.energy.gov/documents/united-states-data-center-energy-usage-report-2025-update))
- Forecast: Lawrence Berkeley National Laboratory, United States Data Center Energy Usage Report: 2025 Update (June 2026; US figures): “The Reference Case estimate for 2030 data center electricity use is 649 TWh, representing 11.8% of forecasted 2030 U.S. electricity use” ([link](https://www.energy.gov/documents/united-states-data-center-energy-usage-report-2025-update))
- Forecast: Lawrence Berkeley National Laboratory, United States Data Center Energy Usage Report: 2025 Update (June 2026; US figures): “This yields a Compounded Uncertainty Range of 521–843 TWh, equal to 9.5–15.3% of total U.S. electricity use in 2030.” ([link](https://www.energy.gov/documents/united-states-data-center-energy-usage-report-2025-update))
- Forecast: Lawrence Berkeley National Laboratory, United States Data Center Energy Usage Report: 2025 Update (June 2026; US figures, 2024 to 2030): “This would result in data centers being responsible for 33% of total load growth over the six-year period.” ([link](https://www.energy.gov/documents/united-states-data-center-energy-usage-report-2025-update))
- Forecast: Lawrence Berkeley National Laboratory, United States Data Center Energy Usage Report: 2025 Update (June 2026), comparing US forecasts: “Among industry estimates for 2030, the Reference Case falls in the upper-middle portion of the distribution ... and above IEA (2025) at approximately 430 TWh.” ([link](https://www.energy.gov/documents/united-states-data-center-energy-usage-report-2025-update))
- Forecast: IEA, Energy and AI (2025): “In the United States, data centres account for nearly half of electricity demand growth between now and 2030.” ([link](https://www.iea.org/reports/energy-and-ai/executive-summary))
- Forecast: Lawrence Berkeley National Laboratory, United States Data Center Energy Usage Report: 2025 Update (June 2026; US figures): “In the Reference Case, AI servers account for 84% of total server energy use and 55% of total data center energy use.” ([link](https://www.energy.gov/documents/united-states-data-center-energy-usage-report-2025-update))
- Estimate: IEA, Energy and AI (2025): “The United States accounted for the largest share of global data centre electricity consumption in 2024 (45%)” ([link](https://www.iea.org/reports/energy-and-ai/executive-summary))
- Estimate: Lawrence Berkeley National Laboratory, United States Data Center Energy Usage Report: 2025 Update (June 2026; US figures): “Increases in energy use are primarily driven by growth in both the quantity and rated power of accelerated servers shipped each year.” ([link](https://www.energy.gov/documents/united-states-data-center-energy-usage-report-2025-update))

**Hum’s sums:**
- 649 TWh in 2030 ÷ 192 TWh in 2024 ≈ 3.4 times as much

**Check:**
- Uses Berkeley Lab’s 2025 update (June 2026), which revises the older 4.4% figure.
- “Doesn’t count crypto mining” rests on the report’s scope line, not a quote.

<a id="4"></a>
## 4. Is AI the main reason data-centre electricity use is growing?

`is-ai-the-reason` · Growth and the future · claim · **YES**

**Short answer:** Yes, the biggest single reason, but not the only one

**Reveal:** AI-type servers make up almost half of the expected growth to 2030. Ordinary servers, other equipment and cooling make up the rest.

**Answer:** Yes, but not on its own. The IEA calls AI “the most important driver” of growth. In its forecast to 2030, servers built for AI (called accelerated servers) make almost half of the rise in the world’s data-centre electricity consumption. Ordinary servers make about 20%, other computer equipment about 10%, and cooling and other infrastructure about 20%. Some of that cooling is for AI servers too. AI is also growing fastest: AI-focused data centres used 50% more electricity in 2025, while all data centres used 17% more.

**Bigger picture:** The world’s data centres used about 485 TWh in 2025. The IEA expects 950 TWh by 2030, and expects electricity use by AI-focused data centres to triple in that time.

**Why this stamp:** AI servers use more electricity each year: the IEA expects it to grow 30% a year, against 9% a year for ordinary servers. In the US, Berkeley Lab says the rise is driven mainly by more AI-type servers, each drawing more power, though ordinary servers kept growing too up to 2024.

**What we don’t know:**
- Nobody counts AI electricity directly. Forecasters count servers built for AI, and those also run some work that isn’t AI.
- There’s no published split of how much of the cooling and other infrastructure is for AI servers, so AI’s full share of the growth isn’t known.
- The split to 2030 is a forecast. In the US, Berkeley Lab expects AI servers to use 55% of all data-centre electricity by 2030.

**Sources:**
- Forecast: IEA, Energy and AI (2025): “AI is the most important driver of this growth, alongside growing demand for other digital services.” ([link](https://www.iea.org/reports/energy-and-ai/executive-summary))
- Forecast: IEA, Energy and AI (2025), world data-centre electricity consumption, Base Case, 2024 to 2030: “Accelerated servers account for almost half of the net increase in global data centre electricity consumption, while conventional servers account for only aroun…” ([link](https://www.iea.org/reports/energy-and-ai/energy-demand-from-ai))
- Forecast: IEA, Energy and AI (2025), world data-centre electricity consumption, Base Case, 2024 to 2030: “Other IT equipment, and infrastructure (cooling and other infrastructure) demand account for around 10% and 20% of the net increase respectively.” ([link](https://www.iea.org/reports/energy-and-ai/energy-demand-from-ai))
- Forecast: IEA, Energy and AI (2025), world figures: “Electricity consumption in accelerated servers, which is mainly driven by AI adoption, is projected to grow by 30% annually in the Base Case, while conventional…” ([link](https://www.iea.org/reports/energy-and-ai/energy-demand-from-ai))
- Forecast: IEA, Key Questions on Energy and AI (2026), world figures, 2025 to 2030: “Electricity consumption from AI-focused data centres grows much faster than overall data centre electricity consumption, tripling in this period.” ([link](https://www.iea.org/reports/key-questions-on-energy-and-ai/executive-summary))
- Estimate: Lawrence Berkeley National Laboratory, United States Data Center Energy Usage Report: 2025 Update (June 2026; US figures): “Increases in energy use are primarily driven by growth in both the quantity and rated power of accelerated servers shipped each year.” ([link](https://www.energy.gov/documents/united-states-data-center-energy-usage-report-2025-update))
- Estimate: Lawrence Berkeley National Laboratory, United States Data Center Energy Usage Report: 2025 Update (June 2026; US figures): “Between 2018 and 2024, growth in total data center energy use is driven by both rapid proliferation of AI servers and continued growth in conventional server en…” ([link](https://www.energy.gov/documents/united-states-data-center-energy-usage-report-2025-update))
- Forecast: Lawrence Berkeley National Laboratory, United States Data Center Energy Usage Report: 2025 Update (June 2026; US figures): “In the Reference Case, AI servers account for 84% of total server energy use and 55% of total data center energy use.” ([link](https://www.energy.gov/documents/united-states-data-center-energy-usage-report-2025-update))
- Estimate: IEA, Key Questions on Energy and AI (2026): “The global electricity demand of data centres – the critical infrastructure for training and running AI models – grew by 17% in 2025, in line with IEA projectio…” ([link](https://www.iea.org/reports/key-questions-on-energy-and-ai/executive-summary))
- Estimate: IEA, Key Questions on Energy and AI (2026): “Electricity consumption from AI-focused data centres grew even faster, surging 50% in 2025.” ([link](https://www.iea.org/reports/key-questions-on-energy-and-ai/executive-summary))
- Estimate: IEA, Key Questions on Energy and AI (2026): “electricity consumption from data centres roughly doubling from 485 TWh in 2025 to 950 TWh in 2030” ([link](https://www.iea.org/reports/key-questions-on-energy-and-ai/executive-summary))

**Hum’s sums:**
- 100% − 20% (ordinary servers) − 10% (other IT) − 20% (cooling and other infrastructure) = about 50%, the IEA’s “almost half” for AI-type servers

**Check:**
- Stamp is YES; PARTLY is defensible because AI servers alone are just under half of forecast growth. Your call.
- The chart’s 50% for AI is Hum’s sum (100 − 20 − 10 − 20), labelled as such.

<a id="5"></a>
## 5. Are data centres causing new gas power plants to be built?

`new-gas-plants` · Power sources · claim · **YES**

**Short answer:** Yes, in named cases, like Meta’s data centre in Louisiana

**Reveal:** Entergy is building three gas plants of 754 MW each, 2,262 MW in all, for the site that turned out to be Meta’s. Regulators approved them in August 2025.

**Answer:** Yes, in some places, and the utilities’ own filings say so. In Louisiana, Entergy asked regulators to build three new gas plants of 754 MW each to serve a large new customer in Richland Parish. The customer’s name was hidden in the filing; it is now known to be Meta, for a data centre. Regulators approved the plants in August 2025, and Entergy expects two of them online in late 2028. Entergy says Meta pays its share of the costs, and that the plants will also strengthen the grid for everyone. In Georgia, Georgia Power asked to build more than 3,600 MW of new gas plants as part of a plan of about 9,900 MW, approved in December 2025, to serve fast-growing “large-load” customers such as data centres.

**Bigger picture:** The IEA calls new demand from data centres a significant near-term driver of growth for gas-fired and coal-fired power, from both existing and new plants. In the US, it expects gas to be the largest source of extra electricity for data centres, adding over 130 TWh a year by 2030.

**Why this stamp:** Utilities and regulators have tied specific new gas plants to data centres in public filings. How much gas would have been built anyway is less clear.

**What we don’t know:**
- How many of the new gas plants planned across the US exist because of data centres. Hum hasn’t found a full count it could check.
- Whether all the data centres utilities are planning for will be built. If some aren’t, some plants may not be needed.
- Hum couldn’t open Entergy’s filing to the Louisiana regulator itself, so its words here are as quoted by POWER magazine.
- Georgia Power’s approved plan may differ from the more than 3,600 MW of gas it asked for. Hum hasn’t checked the final mix.

**Sources:**
- News report: POWER magazine (19 November 2024), quoting Entergy Louisiana’s application to the Louisiana Public Service Commission: “With respect to generation resources, ELL [Entergy Louisiana LLC] is proposing to construct three new 1×1 CCCT generators, each of which will have a nameplate c…” ([link](https://www.powermag.com/entergy-louisiana-eyes-2-2-gw-of-new-gas-fired-generation-to-support-data-center-demand/))
- News report: POWER magazine (19 November 2024): “A filing with the Louisiana Public Service Commission shows that Entergy plans to build more than 2 GW of natural gas-fired power generation in the state, inclu…” ([link](https://www.powermag.com/entergy-louisiana-eyes-2-2-gw-of-new-gas-fired-generation-to-support-data-center-demand/))
- News report: POWER magazine (19 November 2024): “The name of the “Customer,” now known to be Meta, was redacted in the filing available on the PSC website.” ([link](https://www.powermag.com/entergy-louisiana-eyes-2-2-gw-of-new-gas-fired-generation-to-support-data-center-demand/))
- Company figure: Entergy Louisiana, press release on the Louisiana Public Service Commission’s approval (20 August 2025): “Two of the facilities will be located in Richland Parish and are expected to come online in late 2028.” ([link](https://www.entergy.com/news/entergy-louisiana-receives-lpsc-approval-for-major-infrastructure-investments-to-support-metas-data-center-and-improve-reliability))
- Company figure: Entergy Louisiana, press release on the Louisiana Public Service Commission’s approval (20 August 2025): “Importantly, Meta is paying its share of the costs for the infrastructure needed to support its operations, ensuring that other customers are protected from tho…” ([link](https://www.entergy.com/news/entergy-louisiana-receives-lpsc-approval-for-major-infrastructure-investments-to-support-metas-data-center-and-improve-reliability))
- Company figure: Entergy Louisiana, press release on the Louisiana Public Service Commission’s approval (20 August 2025): “These investments will help power one of the most advanced data centers in the world and will also reinforce our grid, create economic opportunity and support a…” ([link](https://www.entergy.com/news/entergy-louisiana-receives-lpsc-approval-for-major-infrastructure-investments-to-support-metas-data-center-and-improve-reliability))
- Company figure: Georgia Power, press release (19 December 2025): “Georgia Power announced today that the Georgia Public Service Commission (PSC) has approved a plan which will allow the company to proceed with procuring approx…” ([link](https://www.georgiapower.com/news-hub/press-releases/psc-approves-savings-for-customers-and-energy-demands.html))
- Company figure: Georgia Power, press release (19 December 2025): “requested the certification of more than 3,600 MW of new combined cycle natural gas generation; more than 3,000 MW of new battery energy storage systems (BESS);…” ([link](https://www.georgiapower.com/news-hub/press-releases/psc-approves-savings-for-customers-and-energy-demands.html))
- Company figure: Georgia Power, press release (19 December 2025): “The company’s latest report in November highlights that large-load growth continues to materialize with thousands of megawatts of new electrical load projected …” ([link](https://www.georgiapower.com/news-hub/press-releases/psc-approves-savings-for-customers-and-energy-demands.html))
- Company figure: Georgia Power, Data Centers & Your Georgia Power Bill: “How does Georgia Power plan to accommodate the growth from data centers? The Integrated Resource Plan (IRP) guides investments in generation and transmission to…” ([link](https://www.georgiapower.com/about/customer-pledge/data-centers.html))
- Estimate: IEA, Energy and AI (2025): “Even so, new demand from data centres is a significant near-term driver of growth for natural gas-fired and coal-fired generation, through both higher utilisati…” ([link](https://www.iea.org/reports/energy-and-ai/energy-supply-for-ai))
- Forecast: IEA, Energy and AI (2025), on data centres in the United States: “As demand growth is particularly rapid over the next five years, natural gas is the largest source of additional supply, adding over 130 TWh of annual generatio…” ([link](https://www.iea.org/reports/energy-and-ai/energy-supply-for-ai))

**Check:**
- Entergy’s 754 MW / 2,262 MW figures are as POWER magazine quotes the filing; the regulator’s copy wasn’t reachable.
- Georgia Power’s 3,600 MW is what it asked for, for “large-load” customers, not data centres alone.

<a id="6"></a>
## 6. Are coal plants being kept open because of data centres?

`coal-kept-open` · Power sources · claim · **PARTLY**

**Short answer:** Some are, and data centres are one of several reasons given

**Reveal:** Georgia kept two big coal plants running as data centres grow. A US emergency order for a Michigan coal plant names data centres; the orders for other plants don’t.

**Answer:** Partly. Some US coal plants that were due to close are still open, and data centres are one of the reasons given, usually alongside others. In Georgia, regulators approved Georgia Power’s plan to keep its Bowen and Scherer coal plants running. Together they make 4,000 MW, and they had been due to shut in 2028 and 2035. Georgia Power points to about 8,500 MW of growth in electricity use over six years, and the regulators’ chairman linked the plan to data centre construction in Georgia. Separately, the US Department of Energy has used emergency orders to keep coal units open in Michigan, Washington, Colorado and Florida. Its order for Michigan’s 1,420 MW J.H. Campbell plant names rising demand from new data centres, together with old power plants retiring. Its announcements for the other plants talk about grid reliability and don’t mention data centres. In September 2026 a federal appeals court ruled the first Campbell order unlawful. A newer order runs to November 14, 2026.

**Bigger picture:** The Department of Energy says more than 17 gigawatts of US coal power were saved from going offline in 2025, for all its reasons, not only data centres. Worldwide, the IEA says coal supplies about 30% of the electricity data centres use, and nearly 70% in China.

**Why this stamp:** Data centres are named as a reason for keeping some coal plants open, but rarely the only one, and most of the emergency orders’ announcements don’t mention them.

**What we don’t know:**
- How much of Georgia’s expected growth is data centres. Georgia Power’s figure counts all its new demand.
- Whether these plants would have closed if no data centres were coming. The Campbell order also points to other power plants retiring.
- What the court ruling means for the newer Campbell orders. The court ruled on the first order, which had already expired.
- Hum read the full text of the Campbell order only. For the other plants it read the Department of Energy’s announcements, and it hasn’t yet checked the orders for coal plants in Indiana.

**Sources:**
- Company figure: Georgia Power, press release (15 July 2025): “The company has received approval for the continued operation of coal-fired units at Plants Bowen and Scherer, which have served customers reliably for decades …” ([link](https://www.georgiapower.com/news-hub/press-releases/georgia-public-service-commission-approves-plan-to-meet-the-energy-needs-of-a-growing-georgia.html))
- Company figure: Georgia Power, press release (15 July 2025): “Over the next six years, Georgia Power projects approximately 8,500 megawatts (MW) of electrical load growth – an increase of approximately 2,600 MW in peak dem…” ([link](https://www.georgiapower.com/news-hub/press-releases/georgia-public-service-commission-approves-plan-to-meet-the-energy-needs-of-a-growing-georgia.html))
- News report: Utility Dive (16 July 2025): “Continued operation of the Scherer and Bowen coal plants, which combine for 4,000 MW but had been planned to shut down in 2028 and 2035, respectively.” ([link](https://www.utilitydive.com/news/georgia-power-irp-coal-gas-plants-data-centers/753170/))
- News report: Utility Dive (16 July 2025), quoting the Georgia Public Service Commission’s chairman: ““As data center construction continues in Georgia, this IRP puts us in a safe and secure spot to meet that energy need,” PSC Chairman Jason Shaw said in a state…” ([link](https://www.utilitydive.com/news/georgia-power-irp-coal-gas-plants-data-centers/753170/))
- Rule or law: US Department of Energy, emergency Order No. 202-26-39 on the J.H. Campbell plant (14 August 2026): “This determination is based on the combination of accelerating demand growth from new data centers and the retirement of existing thermal generators.” ([link](https://www.energy.gov/documents/doe-order-no-202-26-39))
- Rule or law: US Department of Energy, emergency Order No. 202-26-39 on the J.H. Campbell plant (14 August 2026): “The J.H. Campbell Generating Plant (Campbell Plant) is a 1,420 MW coal-fired plant primarily owned by Consumers Energy Company (Consumers) and located in West O…” ([link](https://www.energy.gov/documents/doe-order-no-202-26-39))
- Rule or law: US Department of Energy, page for Order No. 202-26-39: “The order directs MISO to ensure that the coal-fired J.H. Campbell Generating Plant (Campbell Plant) in West Olive, Michigan remains available to operate and to…” ([link](https://www.energy.gov/ceser/federal-power-act-section-202c-midcontinent-independent-system-operator-miso-order-no-202-1))
- Rule or law: US Court of Appeals for the D.C. Circuit, Michigan v. Department of Energy, No. 25-1159 (decided 11 September 2026): “Because the circumstances DOE identified in the challenged order do not warrant resort to section 202(c) as correctly interpreted, we grant the petitions for re…” ([link](https://media.cadc.uscourts.gov/opinions/docs/2026/09/25-1159-2192454.pdf))
- Rule or law: US Court of Appeals for the D.C. Circuit, Michigan v. Department of Energy, No. 25-1159 (decided 11 September 2026): “And vacatur will not be disruptive because the Order under review has already expired.” ([link](https://media.cadc.uscourts.gov/opinions/docs/2026/09/25-1159-2192454.pdf))
- Rule or law: US Department of Energy, press release on the Centralia order (September 2026): “The emergency order directs TransAlta Centralia Generation, LLC (TransAlta) to ensure that Unit 2 of the Centralia Generating Station in Centralia, Washington, …” ([link](https://www.energy.gov/articles/energy-secretary-keeps-northwest-coal-generating-plant-online))
- Rule or law: US Department of Energy, press release on the Craig order (December 2025): “Unit 1 of the coal plant was scheduled to shut down at the end of 2025. The reliable supply of power from the coal plant is essential for keeping the region’s e…” ([link](https://www.energy.gov/articles/energy-secretary-ensures-colorado-coal-plant-remains-open-prevent-blackouts))
- Rule or law: US Department of Energy, press release on the Stanton order (September 2026): “The emergency order directs the Orlando Utilities Commission (OUC) to ensure that Unit 1 at the Stanton Energy Center (Stanton) in Orlando, Florida, a coal-fire…” ([link](https://www.energy.gov/articles/energy-secretary-saves-coal-fired-generation-going-offline-florida))
- Estimate: US Department of Energy, press release on the Centralia order (September 2026): “For example, in 2025, more than 17 gigawatts of coal-power electricity generation were saved from going offline.” ([link](https://www.energy.gov/articles/energy-secretary-keeps-northwest-coal-generating-plant-online))
- Estimate: IEA, Energy and AI (2025): “Coal, with a share of about 30%, is the largest source of electricity” ([link](https://www.iea.org/reports/energy-and-ai/energy-supply-for-ai))
- Estimate: IEA, Energy and AI (2025): “As they are located mostly in the east of the country, the data centre electricity supply in China today is dominated by coal with a near 70% share, followed by…” ([link](https://www.iea.org/reports/energy-and-ai/energy-supply-for-ai))

**Check:**
- A federal court ruled the first Michigan (Campbell) order unlawful on 11 Sept 2026; a newer order runs to 14 Nov 2026, so this answer will date quickly.
- DOE orders for three other plants don’t mention data centres; Indiana orders weren’t checked.

<a id="7"></a>
## 7. Will deleting old emails and photos really save water?

`delete-emails` · Water · claim · **NO**

**Short answer:** No. The saving is far too small to notice

**Reveal:** Keeping 1,000 photos for a year uses about 160 to 470 ml of water, by Hum’s sums. A leaky loo can waste 200 to 400 litres a day.

**Answer:** No. Data centres do use water to keep cool, but stored files are a small part of their work: storage systems use about 5% of data-centre electricity (IEA). Hum’s sums: one 18 TB data-centre drive idles at 5.3 W. So 1,000 photos of 5 MB, kept as 3 copies, use about 39 Wh a year, about 2 phone charges. At 1 to 9 litres of water per kWh at the data centre (Li et al.), plus 3.14 at US power stations, that’s about 160 to 470 ml a year. The same government advice says a leaky loo can waste 200 to 400 litres a day: about 426 times more, every single day. Andy Masley, an independent writer, worked out you’d need to delete 1.5 billion photos, or 200 billion emails, to match fixing one leaky toilet.

**Bigger picture:** What did help: Yorkshire Water reported a 10% fall in home water use after its hosepipe ban, up to 80 million litres a day. Data-centre water is real but local: US data centres consumed about 17 billion gallons on site in a recent year (a Berkeley Lab estimate).

**Why this stamp:** It points at something real, data-centre cooling water, but at a part of it, stored files, that is far too small to matter. The advice gave no figure.

**What we don’t know:**
- Nobody has measured whether deleting files makes a data centre use any less water. Drives may keep running either way, and copies can stay in backups.
- Hum’s sums count the drive only, not the servers, network and cooling around it, so the true figure is somewhat higher, though still tiny next to a leak.
- A per-email water figure said to come from the Environment Agency appears in news stories, but Hum couldn’t find it on any government page.
- Hum found no published total for the water UK data centres use.

**Sources:**
- News report: UK Environment Agency and Defra, National Drought Group press release (August 2025): “Delete old emails and pictures as data centres require vast amounts of water to cool their systems.” ([link](https://www.gov.uk/government/news/national-drought-group-meets-to-address-nationally-significant-water-shortfall))
- Estimate: UK Environment Agency and Defra, National Drought Group press release (August 2025): “Fix a leaking toilet – leaky loos can waste 200-400 litres a day.” ([link](https://www.gov.uk/government/news/national-drought-group-meets-to-address-nationally-significant-water-shortfall))
- Estimate: UK Environment Agency and Defra, National Drought Group press release (August 2025), reporting Yorkshire Water’s figure: “Yorkshire Water reporting a 10% reduction in domestic demand following their hosepipe ban. This equates to saving up to 80 million litres per day” ([link](https://www.gov.uk/government/news/national-drought-group-meets-to-address-nationally-significant-water-shortfall))
- Estimate: IEA, Energy and AI (2025): share of data-centre electricity by equipment: “Storage systems are devices used for centralised data storage and backup, and account for around 5% of electricity consumption.” ([link](https://www.iea.org/reports/energy-and-ai/energy-demand-from-ai))
- Company figure: Seagate, Exos X18 data sheet (data-centre hard drive): “Market-leading 18TB HDD” ([link](https://www.seagate.com/content/dam/seagate/migrated-assets/www-content/datasheets/pdfs/exos-x18-channel-DS2045-4-2106US-en_US.pdf))
- Company figure: Seagate, Exos X18 data sheet, power table (first column: the 18TB SATA model): “Idle A (W) Average 5.3W” ([link](https://www.seagate.com/content/dam/seagate/migrated-assets/www-content/datasheets/pdfs/exos-x18-channel-DS2045-4-2106US-en_US.pdf))
- Company figure: Seagate, Exos X18 data sheet: “Power-On Hours per Year (24×7) 8760” ([link](https://www.seagate.com/content/dam/seagate/migrated-assets/www-content/datasheets/pdfs/exos-x18-channel-DS2045-4-2106US-en_US.pdf))
- Estimate: Li, Yang, Islam, Ren (UC Riverside), Making AI Less Thirsty: water evaporated at the data centre per kWh: “data centers can evaporate approximately 1 – 9 liters per kWh of server energy” ([link](https://arxiv.org/html/2304.03271v5))
- Estimate: Li, Yang, Islam, Ren (UC Riverside), Making AI Less Thirsty: water consumed at US power stations per kWh of electricity: “our value of 3.14 L/kWh for the U.S. average water consumption factor” ([link](https://arxiv.org/html/2304.03271v5))
- Estimate: Andy Masley, independent blog (13 August 2025), his own sums from a drive data sheet and average water use: “To save as much water in data centers as fixing your toilet would save, you would need to delete 1.5 billion photos, or 200 billion emails.” ([link](https://blog.andymasley.com/p/contra-the-uk-government-please-dont))
- Estimate: US EPA: “[28.446 Wh – (22 hours x 0.411 Watts)] x 1 kWh/1,000 Wh = 0.019 kWh/smartphone charged” ([link](https://www.epa.gov/energy/greenhouse-gas-equivalencies-calculator-calculations-and-references))
- Estimate: The Conversation (citing Lawrence Berkeley National Laboratory, 2024): “U.S. data centers consumed 17 billion gallons” ([link](https://aihub.org/2025/09/24/data-centers-consume-massive-amounts-of-water-companies-rarely-tell-the-public-exactly-how-much))

**Hum’s sums:**
- One 18 TB data-centre drive idles at 5.3 W for 8,760 hours a year. Assume 1,000 photos of 5 MB each, kept as 3 copies: 15 GB. 5.3 × 8,760 ÷ 18 TB × 0.015 TB = about 39 Wh a year (the drive only).
- 0.019 kWh = 19 Wh
- 39 Wh ÷ 19 Wh per phone charge = about 2 phone charges a year
- 39 Wh × (1 litre per kWh at the data centre + 3.14 at the power station) = about 160 ml of water a year
- 39 Wh × (9 litres per kWh at the data centre + 3.14 at the power station) = about 470 ml of water a year
- A leaky loo’s 200 litres a day ÷ 470 ml = about 426 times as much water, every day

**Check:**
- The sum assumes 5 MB photos kept as 3 copies, counting drive power only (no servers or cooling); both assumptions are shown.
- The “77.5 litres per 1,000 emails” figure circulating in news couldn’t be traced to a readable source, so it isn’t used.
- One source is a blog post (Andy Masley), marked as an estimate.

<a id="8"></a>
## 8. Is it greener to use a smaller “mini” or “flash” AI model?

`smaller-models` · About you · claim · **PARTLY**

**Short answer:** Usually, unless it thinks for longer

**Reveal:** In Hugging Face’s tests a 70B model used about 2.7 times the energy of a 3B one. With thinking switched on, the 3B model used about 1.7 times more than the 70B.

**Answer:** Partly. For the same kind of answer, smaller models use less. Independent tests of open models agree: within each model family, size and energy went together (Luccioni et al.), and in Hugging Face’s AI Energy Score a 70B model used about 2.7 times as much as a 3B one, with thinking off. Bigger isn’t evenly worse: in the same study a model about 12.5 times bigger used about 1.9 times the energy. And length matters more than size. With thinking on, the same 3B model used about 258 times more than the 70B one with thinking off, and more than the 70B one with thinking on, because it wrote far more text. Google says it builds Gemini Flash smaller to be more efficient, but publishes no figure for each model, so it can’t be ranked against these tests. Epoch AI expects mini models to use less per word, which long thinking can easily outweigh.

**Bigger picture:** One person’s choice is small, but the total keeps growing: electricity use by AI-focused data centres grew 50% in 2025, by the IEA’s estimate.

**Why this stamp:** Size matters, but how much the model writes matters more. A small model that “thinks” at length can use more than a big one.

**What we don’t know:**
- OpenAI, Google and Anthropic don’t publish energy per question for each model, so their mini and flash models can’t be checked.
- These tests used open models on Hugging Face’s own hardware. Commercial models run on different chips and software.

**Sources:**
- Measured: Hugging Face, AI Energy Score v2 (open models, measured; GPU energy in Wh per 1k queries): “SmolLM3-3B 3B Off 18.35” ([link](https://huggingface.co/blog/sasha/ai-energy-score-v2))
- Measured: Hugging Face, AI Energy Score v2 (open models, measured; GPU energy in Wh per 1k queries): “SmolLM3-3B 3B On 12,791.22” ([link](https://huggingface.co/blog/sasha/ai-energy-score-v2))
- Measured: Hugging Face, AI Energy Score v2 (open models, measured; GPU energy in Wh per 1k queries): “DeepSeek-R1-Distill-Llama-70B 70B Off 49.53” ([link](https://huggingface.co/blog/sasha/ai-energy-score-v2))
- Measured: Hugging Face, AI Energy Score v2 (open models, measured; GPU energy in Wh per 1k queries): “DeepSeek-R1-Distill-Llama-70B 70B On 7,626.53” ([link](https://huggingface.co/blog/sasha/ai-energy-score-v2))
- Measured: Hugging Face, AI Energy Score v2: “This matters because many people still assume that smaller models are always better, but the intensity of the reasoning process now has to be considered as well…” ([link](https://huggingface.co/blog/sasha/ai-energy-score-v2))
- Measured: Hugging Face, AI Energy Score v2: “This can be explained in large part by the number of output tokens generated by the models themselves.” ([link](https://huggingface.co/blog/sasha/ai-energy-score-v2))
- Measured: Luccioni, Jernite & Strubell, Power Hungry Processing (FAccT 2024; open models, measured): “size and emissions are correlated, with smaller models emitting less carbon and using less energy.” ([link](https://arxiv.org/html/2311.16863))
- Measured: Luccioni, Jernite & Strubell, Power Hungry Processing, Table 3 (model, parameters, g CO2e, energy in kWh per 1,000 inferences): “BLOOMz-560M 559M 7.5 0.054” ([link](https://arxiv.org/html/2311.16863))
- Measured: Luccioni, Jernite & Strubell, Power Hungry Processing, Table 3 (model, parameters, g CO2e, energy in kWh per 1,000 inferences): “BLOOMz-7B 7B 14.46 0.104” ([link](https://arxiv.org/html/2311.16863))
- Measured: Luccioni, Jernite & Strubell, Power Hungry Processing: “the task structure accounts for more of the variation than the model size does.” ([link](https://arxiv.org/html/2311.16863))
- Company figure: Google Cloud (Google’s own description of its Gemini models): “Techniques like distillation create smaller, more efficient models (Gemini Flash and Flash-Lite) for serving that use our larger, more capable models as teacher…” ([link](https://cloud.google.com/blog/products/infrastructure/measuring-the-environmental-impact-of-ai-inference))
- Estimate: Epoch AI: “So there is a good chance that o3-mini has a lower per-token energy cost than GPT-4o, but this could easily be outweighed by long reasoning chains.” ([link](https://epoch.ai/gradient-updates/how-much-energy-does-chatgpt-use))
- Estimate: IEA, Key Questions on Energy and AI (2026): “Electricity consumption from AI-focused data centres grew even faster, surging 50% in 2025.” ([link](https://www.iea.org/reports/key-questions-on-energy-and-ai/executive-summary))

**Hum’s sums:**
- Thinking off: 49.53 Wh ÷ 18.35 Wh per 1,000 questions = the 70B model used about 2.7 times as much as the 3B model
- Thinking on: 12,791.22 Wh ÷ 7,626.53 Wh = the 3B model used about 1.7 times as much as the 70B model
- 12,791.22 Wh (3B, thinking on) ÷ 49.53 Wh (70B, thinking off) = about 258 times as much
- 0.104 kWh ÷ 0.054 kWh per 1,000 inferences = BLOOMz-7B used about 1.9 times as much as BLOOMz-560M
- 7 billion ÷ 559 million parameters = BLOOMz-7B is about 12.5 times bigger

**Check:**
- Chart values run from 18 to 12,791 Wh per 1,000 questions; on a linear scale the small bars nearly vanish. Needs a look once rendered.

<a id="9"></a>
## 9. How many permanent jobs does a data centre create?

`jobs` · Near you · how-much

**Guess:** In Virginia, a typical data centre building of 250,000 square feet has about how many full-time workers once it’s running? Options: 5 / 50 / 500 / 5,000

**Short answer:** About 50 for a big building, half of them contractors

**Reveal:** Building it takes far more: about 1,500 workers on site at the peak, for 12 to 18 months. That’s 30 times as many as will run it.

**Answer:** Not many for its size. Virginia’s legislative watchdog, JLARC, heard from the industry that a typical 250,000-square-foot data centre has about 50 full-time workers. That’s one worker per 5,000 square feet, against one per 650 at some warehouses. About half are contractors, such as electricians and security staff. Building it takes many more: about 1,500 workers on site at the peak, for 12 to 18 months. Virginia’s sales-tax break asks for 50 jobs paying at least 150% of the local average wage, but a company can count all its data centres in one county together. The biggest AI campuses promise more. In Louisiana, Meta is putting more than $50 billion into one campus, and the state expects about 7,500 construction jobs at peak and about 1,000 operational jobs. That’s more than $50 million of investment per permanent job (Hum’s arithmetic).

**Bigger picture:** Northern Virginia is the world’s largest data centre market. There, data centre staff and contractors held over 8,000 full-time jobs in a recent year (FY23). Counting builders, suppliers and the shops their wages reach, JLARC estimated the industry supports about 74,000 jobs a year, just over 1% of the state’s jobs. 80% of them come from construction.

**What we don’t know:**
- The 50-worker figure came from data centre companies, not from a count of every site.
- Virginia’s companies report jobs for all their data centres in a county together, so nobody publishes jobs per building there.
- Meta’s 1,000 operational jobs is an expectation. Hum hasn’t found a published count of how many people work at the Louisiana campus today.
- Whether AI data centres need more or fewer staff than older ones hasn’t been measured.

**Sources:**
- Estimate: Virginia Joint Legislative Audit and Review Commission (JLARC), Data Centers in Virginia, Report 598, December 2024 (archived copy): “For example, several data center representatives indicated that a typical 250,000-square-foot data center may have approximately 50 full-time workers (one emplo…” ([link](https://web.archive.org/web/20251231092219/https://jlarc.virginia.gov/pdfs/reports/Rpt598.pdf))
- Estimate: Virginia Joint Legislative Audit and Review Commission (JLARC), Data Centers in Virginia, Report 598, December 2024 (archived copy): “The other half are contract workers, including electricians, pipefitters, and security personnel who work full-time at the facility” ([link](https://web.archive.org/web/20251231092219/https://jlarc.virginia.gov/pdfs/reports/Rpt598.pdf))
- Estimate: Virginia Joint Legislative Audit and Review Commission (JLARC), Data Centers in Virginia, Report 598, December 2024 (archived copy): “Construction of an individual data center building usually takes about 12 to 18 months, and data center representatives indicated that, at the height of constru…” ([link](https://web.archive.org/web/20251231092219/https://jlarc.virginia.gov/pdfs/reports/Rpt598.pdf))
- Estimate: Virginia Joint Legislative Audit and Review Commission (JLARC), Data Centers in Virginia, Report 598, December 2024 (archived copy): “Data center direct employees and contract workers accounted for, by JLARC staff estimates, over 8,000 full-time jobs in FY23.” ([link](https://web.archive.org/web/20251231092219/https://jlarc.virginia.gov/pdfs/reports/Rpt598.pdf))
- Estimate: Virginia Joint Legislative Audit and Review Commission (JLARC), Data Centers in Virginia, Report 598, December 2024 (archived copy): “The analysis estimated that the data center industry provides approximately 74,000 jobs, $5.5 billion in labor income, and $9.1 billion in Virginia GDP overall …” ([link](https://web.archive.org/web/20251231092219/https://jlarc.virginia.gov/pdfs/reports/Rpt598.pdf))
- Estimate: Virginia Joint Legislative Audit and Review Commission (JLARC), Data Centers in Virginia, Report 598, December 2024 (archived copy): “These estimates are just over 1 percent of total statewide employment, income, and Virginia GDP during the last three years.” ([link](https://web.archive.org/web/20251231092219/https://jlarc.virginia.gov/pdfs/reports/Rpt598.pdf))
- Estimate: Virginia Joint Legislative Audit and Review Commission (JLARC), Data Centers in Virginia, Report 598, December 2024 (archived copy): “Data centers were estimated to contribute 59,000 jobs annually during the construction phase, accounting for 80 percent of total annual jobs resulting from data…” ([link](https://web.archive.org/web/20251231092219/https://jlarc.virginia.gov/pdfs/reports/Rpt598.pdf))
- Estimate: Virginia Joint Legislative Audit and Review Commission (JLARC), Data Centers in Virginia, Report 598, December 2024 (archived copy): “Northern Virginia is the largest data center market in the world” ([link](https://web.archive.org/web/20251231092219/https://jlarc.virginia.gov/pdfs/reports/Rpt598.pdf))
- Rule or law: Virginia Joint Legislative Audit and Review Commission (JLARC), Data Centers in Virginia, Report 598, December 2024 (archived copy): “To qualify, data centers must create a minimum of 50 jobs paying at least 150 percent of the prevailing annual average wage in the locality where the data cente…” ([link](https://web.archive.org/web/20251231092219/https://jlarc.virginia.gov/pdfs/reports/Rpt598.pdf))
- Rule or law: Virginia Joint Legislative Audit and Review Commission (JLARC), Data Centers in Virginia, Report 598, December 2024 (archived copy): “Current law allows all of a company’s data centers in a specific locality to collectively qualify for … the exemption. Therefore, the company reports data to VE…” ([link](https://web.archive.org/web/20251231092219/https://jlarc.virginia.gov/pdfs/reports/Rpt598.pdf))
- Company figure: Louisiana Economic Development, news release on Meta’s Richland Parish data centre (13 July 2026): “The project is expected to support 7,500 construction jobs at peak construction and approximately 1,000 operational jobs.” ([link](https://www.opportunitylouisiana.gov/news/meta-commits-more-than-50-billion-for-north-louisiana-project-becoming-one-of-the-largest-data-centers-in-history))
- Company figure: Louisiana Economic Development, news release on Meta’s Richland Parish data centre (13 July 2026): “Meta announced it is committing more than $50 billion to its Richland Parish Data Center project, expanding the campus to nearly 10 million square feet and 5 gi…” ([link](https://www.opportunitylouisiana.gov/news/meta-commits-more-than-50-billion-for-north-louisiana-project-becoming-one-of-the-largest-data-centers-in-history))

**Hum’s sums:**
- About 1,500 workers on site at the peak of building ÷ about 50 full-time workers once it runs = 30 times as many
- More than $50 billion ÷ about 1,000 operational jobs = more than $50 million of investment per permanent job

**Check:**
- The Virginia JLARC report was read from an Internet Archive copy (the state site refused connections).
- Meta’s 7,500 / 1,000 jobs are Louisiana’s announcement of company commitments, not counts of actual staff.

<a id="10"></a>
## 10. Can the heat from data centres be used to warm homes?

`heat-reuse` · Near you · claim · **PARTLY**

**Short answer:** Yes, in a few places. Across the EU, about 1.8% of it is reused

**Reveal:** Of 770 data centres that reported to the EU, only 67 said they reuse any heat.

**Answer:** Yes, it can, but few do. Practically all the electricity a data centre uses turns into heat. In Odense, Denmark, heat pumps take heat from Meta’s data centre, warm it to 70-75°C and send it into the city’s district heating pipes. The engineers say it heats more than 12,000 homes. A Danish price cap on this kind of heat limited how much the local heat company used, until politicians decided to scrap it. Near Helsinki, Fortum says heat from two Microsoft data centres will start flowing step by step from next year, and once complete should cover about 40% of the 2 TWh a year of district heat used by 250,000 heat users. That’s about 0.8 TWh of heat a year (Hum’s arithmetic). But in the EU’s first reporting round, only 67 of 770 data centres reported reusing any heat, and about 1.8% of all the heat was reused. It needs heat pipes nearby and someone who wants heat, and demand is low in summer and in warm places. EU law now says data centres above 1 MW must use their waste heat unless they show it isn’t technically or economically feasible.

**Bigger picture:** All the world’s data centres used about 485 TWh of electricity in 2025, the IEA estimates, and practically all of it ends up as heat. Nobody publishes how much of that is reused worldwide. In the EU, where it is measured, it’s about 1.8%.

**Why this stamp:** It works, and real homes are heated this way in Odense. But it needs district heating pipes and a cold climate, so most data centres don’t do it: about 1.8% of EU data centres’ heat is reused, and the biggest Nordic scheme hasn’t started taking heat yet.

**What we don’t know:**
- Outside the EU, nobody publishes how much data-centre heat is reused.
- The EU’s 1.8% may not be representative: some reported values looked unrealistically high, and some countries with known schemes reported none.
- Only about 36% of the EU data centres that had to report did so in the first round.
- How much Microsoft heat will reach homes near Helsinki, and when, depends on Microsoft’s building schedule.

**Sources:**
- Rule or law: EU Energy Efficiency Directive (EU) 2023/1791, Article 26(6): “Member States shall ensure that data centres with a total rated energy input exceeding 1 MW utilise the waste heat or other waste heat recovery applications unl…” ([link](https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32023L1791))
- Estimate: European Commission, Report on the energy efficiency of data centres in the EU, COM(2026) 500, September 2026: “770 data centres reported their data in the first reporting period, representing around 36% of the estimated total of data centres in the EU falling under the r…” ([link](https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:52026DC0500))
- Estimate: European Commission, Report on the energy efficiency of data centres in the EU, COM(2026) 500, September 2026: “Only 67 data centres reported some waste heat reuse in the first reporting period.” ([link](https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:52026DC0500))
- Estimate: European Commission, Report on the energy efficiency of data centres in the EU, COM(2026) 500, September 2026: “approximately 1.8% … of the total heat generated by data centres is being reused in the EU.” ([link](https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:52026DC0500))
- Estimate: European Commission, Report on the energy efficiency of data centres in the EU, COM(2026) 500, September 2026: “In the case of data centres, energy reuse focuses on waste heat since practically all electricity consumed by a data centre eventually turns to heat.” ([link](https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:52026DC0500))
- Estimate: European Commission, Report on the energy efficiency of data centres in the EU, COM(2026) 500, September 2026: “This figure may not be fully representative of the data centre heat reuse landscape in the EU as some computed values seemed unrealistically high, although they…” ([link](https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:52026DC0500))
- Estimate: European Commission, Report on the energy efficiency of data centres in the EU, COM(2026) 500, September 2026: “Special attention also needs to be given to climatic and seasonal variations, as demand for heat reuse is lower in warmer climate zones than in colder regions. …” ([link](https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:52026DC0500))
- Estimate: European Commission, Report on the energy efficiency of data centres in the EU, COM(2026) 500, September 2026: “waste heat reuse is only possible if there is demand for waste heat from local heat off-takers and local infrastructure for waste heat reuse exists around the f…” ([link](https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:52026DC0500))
- Company figure: Ramboll (engineers for Fjernvarme Fyn), project page on heat recovery from Meta’s data centre in Odense, Denmark: “The project, called Tietgenbyen Energy Center, will provide heat to more than 12,000 homes (in 2023), reducing the city's reliance on coal” ([link](https://www.ramboll.com/en-us/projects/energy/meta-surplus-heat-to-district-heating))
- Company figure: Ramboll (engineers for Fjernvarme Fyn), project page on heat recovery from Meta’s data centre in Odense, Denmark: “Here, large electrically driven ammonia heat pumps raise the heat temperature to 70-75°C, suitable for the city's district heating network.” ([link](https://www.ramboll.com/en-us/projects/energy/meta-surplus-heat-to-district-heating))
- Company figure: Fjernvarme Fyn (Odense’s district heating company), press release in Danish (17 January 2025): “Ind til nu har overskudsvarmen været pålagt et prisloft, der har begrænset Fjernvarme Fyn i deres brug af overskudsvarmen.” ([link](https://via.ritzau.dk/pressemeddelelse/14212302/stor-sejr-for-fjernvarmekunder?publisherId=13562371))
- Company figure: Fjernvarme Fyn (Odense’s district heating company), press release in Danish (17 January 2025): “Regeringen og Folketingets partier har besluttet at afskaffe prisloftet på overskudsvarme.” ([link](https://via.ritzau.dk/pressemeddelelse/14212302/stor-sejr-for-fjernvarmekunder?publisherId=13562371))
- Company figure: Fortum, press release on its heat pump plants at Microsoft’s data centre sites near Helsinki (May 2026): “Once fully implemented, data centre waste heat is expected to cover approximately 40 per cent of the total yearly 2 terawatt hour district heat demand of the 25…” ([link](https://www.fortum.com/media/2026/05/fortum-has-started-heat-production-two-large-data-centre-sites-finland))
- Company figure: Fortum, press release on its heat pump plants at Microsoft’s data centre sites near Helsinki (May 2026): “The recovery of waste heat from these Microsoft data centre sites will begin step by step next year, in line with Microsoft’s construction and commissioning sch…” ([link](https://www.fortum.com/media/2026/05/fortum-has-started-heat-production-two-large-data-centre-sites-finland))
- Estimate: IEA, Key Questions on Energy and AI (2026): “electricity consumption from data centres roughly doubling from 485 TWh in 2025 to 950 TWh in 2030” ([link](https://www.iea.org/reports/key-questions-on-energy-and-ai/executive-summary))

**Hum’s sums:**
- 40% of 2 TWh a year = 0.8 TWh of heat a year

**Check:**
- Two quotes are in Danish (Fjernvarme Fyn). Swap if Hum should keep quotes in English.
- Odense’s 12,000 homes is Ramboll’s 2023 figure; the operator’s newer Danish figure is about 11,000.
