# Stage 1b sourcing: "Explained" impact tiles and greenwashing practices

**Status (2026-10-11):** approved by the founder. All 29 quotes below were found on their pages twice: by the research pass, then independently (curl + exact-substring match; the two PDFs read with pdf.js). What went on the site is in `data/sources/impacts.source.json`:
- **Tiles:** grid (1a + 1c), air (2b + 2a), chips (3a), land (4b + 4a + the court quote), noise (5b + 5a).
- **Practices:** B1a + B1b, B2a + B2b, B3a + B3b, B4a + B4b, B5a, B6a + B6c.
- **Left out:** 2c (verified only on a republication; re-check on virginiamercury.com before using), the WTOP count of 37 data centres (Bisnow's newer 34 used), 1b, 1d, 3b to 3d, 4c, B3c and B6b (kept here as alternatives).

---


Collected 2026-10-11. This is a **draft for review**. Nothing in it is in `data/sources/` yet.

**How the quotes were checked.** Each page was downloaded by script (curl, with a browser user agent). The HTML was stripped of tags, curly quotes were normalised and whitespace collapsed, and each quote below was then found as an exact substring of that text. PDFs were extracted with `pypdf` or read directly. Search-engine summaries were used only to find URLs, never as the source of a quote.

- **VERIFIED** means the exact quote was found on the page at the URL given.
- **UNVERIFIED** means the page could not be fetched or the quote could not be confirmed. The reason is given each time.
- When a quote leaves out words from a sentence it shows `...`. Otherwise the quote is continuous text from the page.

**Tone rule (Part B).** Each practice is named as a practice. Some quotes name companies because that is how the source wrote them. Hum's own copy should keep to the practice and should not accuse a company.

---

# Part A: "Explained" impact tiles

## Tile 1: Grid strain and electricity prices

### 1a. Ireland: data centres used 22% of the country's metered electricity in 2024 (strongest)
- **Claim:** In 2024, data centres used 22% of all metered electricity in Ireland, up from 5% in 2015.
- **Quote:** "The percentage share of metered electricity consumption used by data centres rose to 22% in 2024 from 5% in 2015"
- **URL:** https://www.cso.ie/en/releasesandpublications/ep/p-dcmec/datacentresmeteredelectricityconsumption2024/keyfindings/
- **Publisher / date:** Central Statistics Office (CSO) Ireland, statistical release, 10 June 2025
- **Status:** VERIFIED
- **Numbers:** 22% (share of metered electricity consumption, 2024); 5% (2015)
- **Same series, one year earlier (VERIFIED):** "The percentage of total metered electricity consumption used by data centres rose from 5% in 2015 to 21% in 2023". Source: https://www.cso.ie/en/releasesandpublications/ep/p-dcmec/datacentresmeteredelectricityconsumption2023/keyfindings/ (CSO, 23 July 2024). Unit: % of metered consumption.
- **Note:** A search summary reported a CSO 2025 figure of 23%. It was **not** checked on a CSO page, so it is not used here. Check whether a 2025 release exists before publishing.

### 1b. Ireland: the regulator limits new data-centre connections in Dublin (Dec 2025)
- **Claim:** Ireland's energy regulator (CRU) ruled that new data-centre grid connections depend on whether the area's supply is constrained, and named greater Dublin as under "significant pressures".
- **Quote:** "The decision identifies the "greater Dublin region" as being an area where "significant pressures" have been placed on the local system and generation capacity."
- **URL:** https://www.irishtimes.com/business/2025/12/12/new-data-centres-must-generate-and-supply-electricity-to-wider-market-regulator-rules/
- **Publisher / date:** The Irish Times, 12 December 2025 (date taken from the URL)
- **Status:** VERIFIED
- **Numbers:** none
- **Supporting quote, on bills (VERIFIED):** "data centres and technology companies are responsible for 89% of Eirgrid projected demand growth over the next decade". Source: https://www.rte.ie/news/primetime/2025/0821/1529518-govt-warned-of-rising-household-bills-as-data-centres-strain-grid/ (RTÉ Prime Time, 21 Aug 2025). Unit: % of projected demand growth.
- **Gaps:** The CRU decision paper itself (CRU/2025236) and EirGrid's 2022 statement on Dublin until 2028 were **not** fetched (the DCD copy was blocked). The search summary also reports a March 2026 judicial review by environmental NGOs, which was not checked on a page. Fetch the CRU paper before relying on the policy details.

### 1c. PJM (13 US states + DC): capacity prices hit the cap, with almost all new demand from data centres (Dec 2025)
- **Claim:** In PJM's December 2025 capacity auction, prices hit the cap. The jump in forecast demand behind it came almost entirely from data centres.
- **Quote:** "In part, the latest auction results were driven by a 5,250-MW increase in PJM's demand forecast — almost entirely driven by data centers"
- **URL:** https://www.utilitydive.com/news/pjm-interconnection-capacity-auction-data-center/808264/
- **Publisher / date:** Utility Dive (Ethan Howland), 18 December 2025
- **Status:** VERIFIED
- **Numbers:** 5,250 MW (increase in the demand forecast). The same page also says: "Capacity prices in the grid operator's latest capacity auction hit a $333.44/MW-day price cap across its region" ($/MW-day). Its headline gives a 6.6 GW shortfall against the reliability target.
- **Note:** PJM's own press release (pjm.com) could not be fetched because the domain did not resolve from this machine. A search summary says the release gives "nearly 5,100 MW" of the increase as data centres. That figure is **UNVERIFIED** until it is checked on pjm.com.

### 1d. PJM: data-centre load made up 9% of wholesale power costs in 2026 (market monitor)
- **Claim:** PJM's independent market monitor says data-centre load made up 9% of wholesale power costs in 2026 so far, through the capacity market.
- **Quote:** "Existing and forecast data center load made up 9%, or $10.48/MWh, of the wholesale price of power in the PJM Interconnection this year through July, according to the grid operator's independent market monitor."
- **URL:** https://www.utilitydive.com/news/data-center-pjm-wholesale-market/828917/
- **Publisher / date:** Utility Dive (Ethan Howland), 27 August 2026
- **Status:** VERIFIED
- **Numbers:** 9% (share of wholesale price); $10.48/MWh. The same page also says: "In PJM's last four capacity auctions, existing and forecast data center load growth resulted in a combined total increase in capacity market revenues of $29.4 billion" (USD).
- **Note:** The primary source is Monitoring Analytics' 2026 Q2 State of the Market report, which was not fetched. Fetch it before publishing.

---

## Tile 2: Local air

### 2a. Memphis, Tennessee: xAI's Colossus gas turbines (strongest)
- **Claim:** Gas turbines powering xAI's Colossus supercomputer in Memphis emit nitrogen oxides and formaldehyde. The NAACP, represented by the Southern Environmental Law Center (SELC), gave notice that it intended to sue under the Clean Air Act.
- **Quote:** "The turbines emit nitrogen oxides, a key contributor to smog, and formaldehyde, among other pollutants, according to their manufacturer."
- **URL:** https://www.nbcnews.com/news/us-news/naacp-musk-xai-supercomputer-colossus-memphis-tennessee-rcna213490
- **Publisher / date:** NBC News (Bracey Harris), 17 June 2025
- **Status:** VERIFIED
- **Numbers:** none in the quote
- **Wording:** This is the manufacturer's information as reported by NBC. Present it as "according to the manufacturer", not as a measured result.

### 2b. Memphis: the county permit for 15 turbines (July 2025)
- **Claim:** The Shelby County Health Department permitted xAI to run 15 gas turbines (up to 247 MW). Before that, SELC said as many as 35 had run without permits.
- **Quote:** "The permit issued by the Shelby County Health Department says that xAI can operate 15 Solar SMT-130 generators with certain emissions controls, which can generate up to 247 megawatts."
- **URL:** https://techcrunch.com/2025/07/03/xai-gets-permits-for-15-natural-gas-generators-at-memphis-data-center/
- **Publisher / date:** TechCrunch (Tim De Chant), 3 July 2025
- **Status:** VERIFIED
- **Numbers:** 15 turbines; 247 MW. The same page says the permit allows, per rolling 12 months, "87 tons of smog-forming NO x , 94 tons of carbon monoxide, 85 tons of volatile..." (tons/yr; the page renders NOx with a space). It also reports SELC's claim of "as many as 35 generators without permits ... capable of producing up to 421 megawatts".
- **Gaps:** The Shelby County permit document and SELC's own page were not fetched. The 35-turbine figure is SELC's allegation as reported, so attribute it to SELC. A search summary also mentions a 2026 SELC/Earthjustice case over turbines at Southaven, Mississippi (Colossus 2). That case was **not** checked.

### 2c. Northern Virginia: more than 9,000 backup generators at data centres
- **Claim:** More than 9,000 backup generators, some burning diesel, can supply data centres in Northern Virginia. Virginia lawmakers debated stricter emissions rules in 2026.
- **Quote:** "There are over 9,000 backup generators that can supply emergency power to Northern Virginia data centers, some of which run on diesel and emit toxins."
- **URL (where verified):** https://royalexaminer.com/lawmakers-debate-how-to-regulate-data-centers-diesel-backup-generators (a republication, credited "By Virginia Mercury", 17 Feb 2026)
- **Original:** https://virginiamercury.com/2026/02/17/lawmakers-debate-how-to-regulate-data-centers-diesel-backup-generators/ returned **403** to both curl and WebFetch.
- **Publisher / date:** Virginia Mercury (States Newsroom), 17 February 2026
- **Status:** VERIFIED on the republished copy only. Re-check on virginiamercury.com before publishing.
- **Numbers:** 9,000+ generators
- **Lead:** The article cites a VCU study, "Modeling Localized Air Pollution Impacts from Data Centers in Northern Virginia" (VCU Institute for Sustainable Energy and Environment). The study itself was not fetched.

---

## Tile 3: Chips and e-waste

### 3a. Generative AI could add 1.2 to 5.0 million tons of e-waste by 2030 (strongest; peer-reviewed)
- **Claim:** A peer-reviewed study estimates that generative AI could produce 1.2 to 5.0 million tons of e-waste in total over 2020–2030.
- **Quote:** "this e-waste stream could increase, potentially reaching a total accumulation of 1.2–5.0 million tons during 2020–2030"
- **URL:** https://www.nature.com/articles/s43588-024-00712-6
- **Publisher / date:** Nature Computational Science 4, 818–823; Wang, Zhang, Tzachor & Chen; published 28 October 2024
- **Status:** VERIFIED (in the abstract on the page)
- **Numbers:** 1.2 (low) and 5.0 (high) million tons, cumulative over 2020–2030. Same abstract: circular-economy strategies "could reduce e-waste generation by 16–86%".
- **Fit for the data files:** this already has a published low/high pair, but no mid.

### 3b. Most of computing's carbon comes from making the hardware (peer-reviewed, HPCA 2021)
- **Claim:** For modern data-centre equipment, most carbon emissions come from manufacturing and infrastructure, not from running it.
- **Quote:** "most emissions related to modern mobile and data-center equipment come from hardware manufacturing and infrastructure"
- **URL:** https://arxiv.org/abs/2011.02839
- **Publisher / date:** Gupta et al., "Chasing Carbon: The Elusive Environmental Footprint of Computing", IEEE HPCA 2021 (arXiv, 28 Oct 2020)
- **Status:** VERIFIED
- **Numbers:** none
- **Caveat:** This covers computing in general, not AI specifically.

### 3c. BLOOM: counting manufacturing roughly doubled one AI model's training footprint
- **Claim:** For the BLOOM language model, training emitted about 24.7 t CO2eq counting only dynamic power, and 50.5 t when equipment manufacturing and other processes were counted.
- **Quote:** "and 50.5 tonnes if we account for all processes ranging from equipment manufacturing to energy-based operational consumption"
- **URL:** https://arxiv.org/abs/2211.02001
- **Publisher / date:** Luccioni, Viguier & Ligozat, "Estimating the Carbon Footprint of BLOOM" (arXiv 3 Nov 2022; later JMLR 2023)
- **Status:** VERIFIED
- **Numbers:** 24.7 t CO2eq (dynamic power only); 50.5 t CO2eq (full life cycle)

### 3d. Context: the world produced 62 million tonnes of e-waste in 2022
- **Claim:** The world produced 62 million tonnes of e-waste in 2022, and only 22.3% was documented as properly collected and recycled.
- **Quote:** "The 62 million tonnes of e-waste generated in 2022"; also "less than one quarter (22.3%) of the year's e-waste mass was documented as having been properly collected and recycled in 2022"
- **URL:** https://ewastemonitor.info/the-global-e-waste-monitor-2024/
- **Publisher / date:** ITU and UNITAR, Global E-waste Monitor 2024 (exact release day not checked on the page)
- **Status:** VERIFIED
- **Numbers:** 62 million tonnes (2022); 22.3% recycled; 82 million tonnes projected for 2030
- **Caveat:** This covers all e-waste, not data centres. Use it only for scale beside 3a.

---

## Tile 4: Land

### 4a. Prince William County, Virginia: the Digital Gateway (strongest)
- **Claim:** The PW Digital Gateway would be the world's largest data-centre corridor, 37 data centres across more than 2,100 acres beside Manassas National Battlefield. A judge voided its rezoning in August 2025.
- **Quote:** "would be the largest data center corridor in the world, with 37 data centers spread out across over 2,100 acres in western Prince William, near Manassas National Battlefield"
- **URL:** https://wtop.com/prince-william-county/2025/08/judge-voids-digital-gateway-rezoning-in-prince-william-county/
- **Publisher / date:** WTOP, reporting from InsideNoVa.com, 9 August 2025
- **Status:** VERIFIED
- **Numbers:** 37 data centres; 2,100+ acres; 22 million sq ft (stated elsewhere on the page)
- **Ruling quote (VERIFIED, same page):** "This Court finds that the advertised notice provided by the County did not comply with either the State or County code."

### 4b. Digital Gateway after the appeal (April 2026)
- **Claim:** After a Virginia appeals court ruling, the 2,139-acre project was "on life support". Its planned size was 34 buildings and 1.7 GW.
- **Quote:** "Within the 2,139-acre Digital Gateway, Blackstone subsidiary QTS and Compass Datacenters have planned to develop large data center campuses that at full build-out would span 34 buildings, 22M SF and 1.7 gigawatts of capacity."
- **URL:** https://www.bisnow.com/news/national/data-center-community-relations/digital-gateway-plans-may-close-for-good-134038
- **Publisher / date:** Bisnow (Dan Rabb), 8 April 2026
- **Status:** VERIFIED
- **Numbers:** 2,139 acres; 34 buildings; 22M sq ft; 1.7 GW
- **Conflict:** The building count differs between sources (37 in 4a, 34 here). If Hum uses one, pick it and cite that source.
- **Gap:** A search summary mentions a possible Virginia Supreme Court appeal. That was **not** checked.

### 4c. Kosciusko County, Indiana: farmland rezoning for a data centre rejected (April 2025)
- **Claim:** County commissioners unanimously rejected rezoning about 550 acres of farmland for a data centre. Residents raised water, power and the loss of prime farmland.
- **Quote:** "Local residents who spoke at Tuesday's meeting echoed concerns about water and power usage and the loss of prime farmland."
- **URL:** https://www.insideindianabusiness.com/articles/not-a-reasonable-and-prudent-location-kosciusko-county-commissioners-shut-down-data-center-plans
- **Publisher / date:** Inside Indiana Business, 22 April 2025
- **Status:** VERIFIED
- **Numbers:** about 550 acres (the page says "around 550 acres of farmland"; a search summary said 554, which is not used)
- **Caveat:** Inside Indiana Business is a regional business outlet. It is reliable for local facts, but it is not on the preferred-source list.

---

## Tile 5: Noise

### 5a. Chandler, Arizona: a city ordinance written because of data-centre noise (strongest; primary)
- **Claim:** In December 2022, Chandler adopted a zoning ordinance. A new data centre must measure baseline noise and must keep its sound from exceeding those ambient levels. Operators must also provide an on-site liaison for noise complaints.
- **Quote:** "The Data Center must be designed and built to incorporate sound mitigation methods sufficient to prevent the sound levels emanating from the Data Center ... from exceeding the ambient noise levels that were observed in the baseline study."
- **URL:** https://www.chandleraz.gov/sites/default/files/departments/development-services/PLH22-0053-Ordinance-No-5033-Data-Center.pdf
- **Publisher / date:** City of Chandler, Ordinance No. 5033, passed and adopted 8 December 2022
- **Status:** VERIFIED (PDF read directly; the `...` replaces the parenthetical "(as determined by a third-party acoustic engineer)", which runs across a page break)
- **Numbers:** a half-mile notification radius; liaison hours 8:00 am to 10:00 pm
- **Why the ordinance exists (VERIFIED):** "After residents banded together over a high-pitched humming noise, a Chandler data center is promising to fix it." Source: https://www.abc15.com/news/region-southeast-valley/chandler/chandler-residents-frustrated-over-humming-noise (ABC15 Arizona, 20 April 2018)

### 5b. Great Oak, Prince William County, Virginia: residents' complaints of a constant drone
- **Claim:** Residents of the Great Oak subdivision near a cluster of Amazon data centres say the constant drone, especially at night, causes anxiety and costs them sleep.
- **Quote:** "But residents say the constant drone, especially at night, causes anxiety and deprives them of sleep."
- **URL:** https://www.princewilliamtimes.com/news/some-cities-suffering-from-data-center-noise-turn-to-tough-limits/article_2aa7fb8c-b6aa-11ed-8626-5738aae2f76c.html
- **Publisher / date:** Prince William Times (Peter Cary, Piedmont Journalism Foundation), 27 February 2023
- **Status:** VERIFIED
- **Numbers:** the county daytime limit of 60 decibels (on the page: "about half the time the noise was below the county daytime limit of 60 decibels")
- **Good framing line (VERIFIED, same page):** "Data center noise is unique in that it is not so much its loudness that is an irritant as its constancy."

---

# Part B: Greenwashing practices

## B1. Market-based vs location-based emissions, and unbundled RECs

### B1a. Unbundled RECs inflate reported progress (strongest; peer-reviewed)
- **Claim:** When companies count renewable energy certificates (RECs) as emission cuts, their reported progress looks better than the real-world effect.
- **Quote:** "If this trend continues, 42% of committed scope 2 emission reductions will not result in real-world mitigation."
- **URL:** https://www.nature.com/articles/s41558-022-01379-5
- **Publisher / date:** Nature Climate Change; Bjørn et al., "Renewable energy certificates threaten the integrity of corporate science-based targets"; published 9 June 2022
- **Status:** VERIFIED (abstract)
- **Numbers:** 42% of committed scope 2 reductions

### B1b. Data-centre emissions may be 7.62 times the official tally (journalism)
- **Claim:** Guardian analysis found that, for 2020–2022, the location-based emissions of the in-house data centres of four big tech firms were probably about 662% (7.62 times) higher than the market-based figures they report, because of RECs.
- **Quote:** "Recs are used to calculate "market-based" emissions, or the official emissions figures used by the firms."
- **URL:** https://www.theguardian.com/technology/2024/sep/15/data-center-gas-emissions-tech
- **Publisher / date:** The Guardian (Isabel O'Brien), 15 September 2024
- **Status:** VERIFIED
- **Numbers:** 662% higher, or 7.62 times (2020–2022)
- **Second line (VERIFIED, same page):** "When Recs and offsets are left out of the equation, we get "location-based emissions" – the actual emissions generated from the area where the data is being processed."
- **Tone:** The article names companies. Hum should state the practice and the gap, not the accusation.

## B2. Annual matching vs 24/7 hourly matching

### B2a. Annual matching barely changes long-run emissions (strongest; peer-reviewed)
- **Claim:** In a power-system model, buying clean electricity to match a year's use has little effect on long-run emissions. Matching every hour cuts them significantly.
- **Quote:** "procurement strategies that match participants' demand with carbon-free generation on an annual basis have minimal impact on long-run system-level CO 2 emissions"
- **URL:** https://collaborate.princeton.edu/en/publications/system-level-impacts-of-voluntary-carbon-free-electricity-procure/
- **Publisher / date:** Joule 8(2), 374–400; Xu, Ricks, Manocha, Patankar & Jenkins (Princeton ZERO Lab); published 21 February 2024
- **Status:** VERIFIED (abstract on Princeton's research portal). The page renders the subscript as "CO 2". Write it as "CO2" in Hum.
- **Numbers:** none in the quote

### B2b. Hourly matching keeps cutting emissions even as grids get cleaner (peer-reviewed)
- **Claim:** 24/7 hourly matching keeps reducing system emissions even as grids get cleaner, unlike "volumetric" (annual) matching.
- **Quote:** "Even as grids become cleaner over time, the hourly matching strategy contributes significantly to system-level emissions reduction."
- **URL:** https://arxiv.org/abs/2403.07876
- **Publisher / date:** Riepin & Brown (TU Berlin), arXiv 6 Dec 2023; published in Energy Strategy Reviews vol. 54, July 2024 (journal details from search, not checked on the journal page)
- **Status:** VERIFIED (arXiv abstract)
- **Numbers:** none in the quote

## B3. "Carbon neutral" claims that rely on offsets

### B3a. Less than 16% of carbon credits are real reductions (strongest; peer-reviewed)
- **Claim:** A review of 2,346 offset projects estimates that less than 16% of the credits issued were real emission reductions.
- **Quote:** "We estimate that less than 16% of the carbon credits issued to the investigated projects constitute real emission reductions"
- **URL:** https://www.nature.com/articles/s41467-024-53645-z
- **Publisher / date:** Nature Communications; Probst et al.; published 14 November 2024
- **Status:** VERIFIED (abstract)
- **Numbers:** <16% (real reductions); 2,346 projects; almost 1 billion t CO2e covered

### B3b. The EU bans "neutral" product claims based on offsets (regulator)
- **Claim:** The EU adopted a law that bans claims that a product is climate-neutral, reduced-impact or positive because of offsetting.
- **Quote:** "the directive will ban claims that a product has a neutral, reduced or positive impact on the environment because of emissions offsetting schemes"
- **URL:** https://www.europarl.europa.eu/news/en/press-room/20240112IPR16772/meps-adopt-new-law-banning-greenwashing-and-misleading-product-information
- **Publisher / date:** European Parliament press release, 17 January 2024
- **Status:** VERIFIED
- **Numbers:** none
- **Caveat:** This covers consumer product claims (the directive on empowering consumers for the green transition). It is not specific to data centres.

### B3c. More than 90% of one major certifier's rainforest offsets likely "phantom" (journalism)
- **Claim:** An investigation found that more than 90% of the rainforest offset credits from the biggest certifier were likely not real reductions.
- **Quote:** "more than 90% of their rainforest offset credits – among the most commonly used by companies – are likely to be "phantom credits" and do not represent genuine carbon reductions"
- **URL:** https://www.theguardian.com/environment/2023/jan/18/revealed-forest-carbon-offsets-biggest-provider-worthless-verra-aoe
- **Publisher / date:** The Guardian (with Die Zeit and SourceMaterial), 18 January 2023
- **Status:** VERIFIED
- **Numbers:** >90% of rainforest credits
- **Caveat:** The certifier (Verra) disputed the findings. Prefer B3a as the lead source.

## B4. "Water positive" pledges vs local water use

### B4a. Water-positive goals leave out the power plants (strongest)
- **Claim:** A data-centre "water positive" goal can leave out the water consumed by the power plants that supply the data centres. A global balance can also hide shortages in a particular watershed.
- **Quote:** "the company's water stewardship goal doesn't include the water consumed by the power plants that supply its data centers"
- **URL:** https://grist.org/technology/amazon-data-centers-water-positive-energy/
- **Publisher / date:** Grist (Jake Bittle), 29 August 2024
- **Status:** VERIFIED
- **Numbers:** none in the quote. The page also says a pledge can be met "on a global scale" while data centres still "compromise water access in specific watersheds".
- **Tone:** This is about one company's pledge. Hum should describe the practice (counting replenishment elsewhere against local use, and leaving out power-plant water).

### B4b. "Water is more localised" (SourceMaterial / Guardian investigation)
- **Claim:** Unlike carbon, water replenished in one place does not help a community that loses water somewhere else, so global water offsetting can mislead.
- **Quote:** ""Carbon is a global problem—water is more localised" (Nathan Wangusi, a former water sustainability manager at Amazon, as quoted)
- **URL:** https://www.source-material.org/amazon-microsoft-google-trump-data-centres-water-use/
- **Publisher / date:** SourceMaterial (published with The Guardian), 9 April 2025
- **Status:** VERIFIED (on SourceMaterial's copy; the Guardian copy was not fetched)
- **Numbers:** none in the quote. The same page says the three big cloud firms pledged "water positive" by 2030.
- **Caveat:** This is one person's quote. Pair it with B4a. No peer-reviewed source on the water-positive practice was found.

## B5. Leaving out embodied / scope 3 emissions (chips, construction)

### B5a. Embodied emissions can exceed 40% of a data centre's total (strongest)
- **Claim:** For a data centre on very low-carbon power, the emissions from making its steel, concrete and hardware can be more than 40% of its total. Leaving them out therefore misses a large share.
- **Quote:** "embodied emissions can exceed 40% of a data center's total greenhouse gas emissions and may dominate the lifetime greenhouse gas emissions footprint"
- **URL:** https://icef.go.jp/wp-content/themes/icef_new/pdf/roadmap/2025/CHAPTER Ⅲ – 3. EMBODIED GREENHOUSE GAS EMISSIONS (SCOPE 3).pdf (spaces and symbols must be URL-encoded when linking)
- **Publisher / date:** ICEF (Innovation for Cool Earth Forum), Sustainable Data Centers Roadmap, chapter 3.3, by Julio Friedmann and Colin McCormick, October 2025
- **Status:** VERIFIED (PDF text extracted; the PDF uses a curly apostrophe in "center’s")
- **Numbers:** >40% of total GHG emissions (low-carbon-power case)
- **Tone:** The same paragraph names a company as an example. Keep to the practice.

### B5b. Supporting sources (already verified in Tile 3)
- 3b "Chasing Carbon": most emissions come from manufacturing and infrastructure.
- 3c BLOOM: counting manufacturing and other processes roughly doubles a training footprint (24.7 vs 50.5 t CO2eq).

## B6. Quoting PUE or efficiency instead of total consumption

### B6a. Efficiency gains can raise total use (rebound) (strongest; researchers)
- **Claim:** Efficiency gains do not guarantee lower total impact, because cheaper computing can lead to more of it (Jevons' paradox).
- **Quote:** "Rebound effects undermine the assumption that improved technical efficiency alone will ensure net reductions in environmental harm."
- **URL:** https://arxiv.org/abs/2501.16548
- **Publisher / date:** Luccioni, Strubell & Crawford, "From Efficiency Gains to Rebound Effects: The Problem of Jevons' Paradox in AI's Polarized Environmental Debate", arXiv, January 2025 (the venue, reportedly FAccT 2025, was not checked)
- **Status:** VERIFIED (abstract)
- **Numbers:** none

### B6b. PUE can improve without energy use falling (engineering journal)
- **Claim:** PUE only measures overhead relative to IT load. Some measures improve PUE without cutting energy use, and published values are sometimes design figures, not measured ones.
- **Quote:** "The limited scope PUE offers can make it unreliable for comparison as some strategies can improve PUE values without reducing energy consumption."
- **URL:** https://www.rehva.eu/rehva-journal/chapter/analysis-of-performance-metrics-for-data-center-efficiency-should-the-power-utilization-effectiveness-pue-still-be-used-as-the-main-indicator-part-1
- **Publisher / date:** REHVA Journal 01/2017 (T. van de Voort et al.)
- **Status:** VERIFIED
- **Numbers:** none
- **Caveat:** This is a 2017 trade-and-research journal, not peer-reviewed to Nature's standard.

### B6c. Context: US data-centre use tripled over a decade (government lab)
- **Claim:** Even with efficiency gains, US data-centre electricity use roughly tripled from 2014 to 2023.
- **Quote:** "The total data center electricity usage climbed from 58 TWh in 2014 to 176 TWh in 2023"
- **URL:** https://newscenter.lbl.gov/2025/01/15/berkeley-lab-report-evaluates-increase-in-electricity-demand-from-data-centers/
- **Publisher / date:** Lawrence Berkeley National Laboratory news, 15 January 2025 (adapted from a DOE release of 20 Dec 2024)
- **Status:** VERIFIED
- **Numbers:** 58 TWh (2014); 176 TWh (2023); 325–580 TWh (2028 range); 4.4% of US electricity (2023)
- **Gap:** The full report PDF (escholarship.org/uc/item/32d6m0d1) could not be downloaded, so its PUE-trend wording was not checked.

---

# Not found or not fetched

- **pjm.com** (press releases for the July 2025 and December 2025 auctions): the domain did not resolve from this machine. Utility Dive was used instead.
- **Monitoring Analytics** (PJM market monitor) reports: not fetched. The figures come through Utility Dive.
- **CRU decision paper CRU/2025236** and **EirGrid's 2022 Dublin statement**: not fetched. The DatacenterDynamics copy was blocked by a bot check.
- **Virginia JLARC 2024 "Data Centers in Virginia"** (grid and bills): connection refused. This would be a strong government source for Tile 1 and is worth retrying.
- **Virginia Mercury original** (403). Verified on a republication instead.
- **Shelby County Health Department permit** and **SELC's own pages**: not fetched.
- **NewClimate Institute Corporate Climate Responsibility Monitor 2025, tech sector** (market-based accounting, scope 3): 403 to curl and WebFetch. It would be a good second source for B1 and B5.
- **Carbon Market Watch's tech deep dive**: 403.
- **A state attorney-general letter to tech companies on unbundled RECs** (Sept 2025, attorneygeneral.gov): returned HTML, not the PDF. A regulator source for B1 if it can be fetched.
- **Peer-reviewed work on water-positive claims**: none found. B4 rests on journalism.
- **Northern Virginia transmission** (e.g. new lines for Loudoun): no specific source was gathered.
