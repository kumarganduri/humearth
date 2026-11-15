# Hum: launch drafts

Drafts for Kumar to post under his own name. Nothing here has been posted. Every figure below is taken from a live answer on humearth.org; if you change a number, check it against that answer first.

**Before posting anywhere**

- Post one place at a time, a few days apart, and stay online for two or three hours afterwards to answer comments. A post with no replies from its author dies quickly.
- Read each community's rules on the day you post. Rules on self-promotion change, and I have not checked them.
- Lead with one answer, not the whole site. In both test rounds, the bottle-of-water answer was the one people said they would share.
- One decision is yours: whether to say Hum was built with an AI coding assistant. People on Hacker News often ask. I recommend saying so plainly; the sentence is marked **[optional]** below.

---

## 1. Hacker News (Show HN)

Post at news.ycombinator.com/submit. Weekday mornings US Eastern time tend to get the most readers.

**Title**

> Show HN: Hum – Sourced answers to claims about AI's electricity and water use

**URL**

> https://humearth.org

**First comment (post it yourself, right after submitting)**

> Hi HN. I kept seeing the same claims about AI and the environment ("a bottle of water per email", "10x a Google search") repeated with no source, so I built a site that checks each one and shows where every number comes from.
>
> How it works:
>
> - Each answer cites quotes I read on the source's own page, with a link and the date it was checked. A weekly job re-downloads every page and flags any quote that changed or disappeared.
> - Any arithmetic is shown, and the build fails if a sum doesn't add up or a number on the page isn't in a quote.
> - A company's own figure is labelled as the company's and never ranked against independent measurements.
> - When nobody has published a number, the answer says so.
>
> A few results that surprised me:
>
> - "A bottle of water per ChatGPT email": the study behind it said one 500 ml bottle per 10 to 50 answers, for GPT-3. Nobody has published an independent figure for today's models. https://humearth.org/q/bottle-of-water
> - One ChatGPT question is about 2% of a phone charge, by OpenAI's own figure (0.34 Wh). The total is the big part: data centres used about 485 TWh in 2025, by the IEA's estimate.
> - Ireland's data centres used about 23% of the country's metered electricity in 2025, up from 5% in 2015, by its statistics office.
>
> There are 47 answers so far. It's independent and self-funded; no company pays for it. Code, data and every quote are open: https://github.com/kumarganduri/humearth
>
> **[optional]** I built it with heavy use of an AI coding assistant, which is part of why I wanted the numbers checked by the build and not by trust.
>
> I'd most like to hear where an answer is wrong or a source is weak. There's a "report an error" link on the About page.

---

## 2. Reddit

Pick the subreddit that matches the answer you lead with. Check each one's rules on self-promotion and link posts first; some want a text post with the link in the body, some allow links only on certain days.

### 2a. For a community about ChatGPT or AI tools

**Title**

> I checked the "ChatGPT uses a bottle of water per email" claim against its source

**Body**

> The claim comes from a UC Riverside study. What it actually estimated: one 500 ml bottle for every 10 to 50 medium-length answers, and that was for GPT-3. For today's models nobody has published an independent figure. OpenAI and Google each give a number well under a millilitre per question, but those are the companies' own figures.
>
> I wrote this up with the quotes and links here: https://humearth.org/q/bottle-of-water
>
> It's part of a small site I made that does the same for other claims (10x a Google search, should you stop using it, please and thank you). I made it myself and no company funds it. Happy to be corrected if I've read a source wrong.

### 2b. For a community about energy or climate

**Title**

> How much electricity do data centres use? I collected the published figures by country, with sources

**Body**

> I've been collecting what official sources actually publish, because the numbers quoted in news stories vary a lot.
>
> - World: about 1.5% of electricity in 2024 (IEA).
> - United States: about 4.7% in 2024 (Berkeley Lab).
> - Ireland: about 23% of metered electricity in 2025 (Central Statistics Office).
> - Great Britain: about 2% in 2024, by the government's first official count.
> - Virginia: about a quarter in 2023 (EPRI estimate).
>
> Several countries publish nothing official, and where that's the case the page says so and labels whatever estimate exists.
>
> Each figure links to the page it came from: https://humearth.org/topics
>
> I made the site myself and it's self-funded. If you know a better primary source for your country, I'd like to add it.

### 2c. For a general "interesting websites" community

**Title**

> A site that fact-checks claims about AI's energy and water use, with every number sourced

**Body**

> You guess first, then it shows the answer and where it comes from. For example: one ChatGPT question uses about as much electricity as 2% of a phone charge, by OpenAI's own figure.
>
> https://humearth.org
>
> I made it; no ads and no sign-up.

---

## 3. Note to reporters and teachers

Short, personal, one answer. Send it individually, not as a mass mail. Change the first line to say why you're writing to that person.

**Subject**

> A sourced fact-check of the "bottle of water per ChatGPT email" claim

**Body**

> Hello [name],
>
> [One line on why them: "I read your piece on data centres in ..." or "I saw you teach ..."]
>
> I've built a small independent site that checks common claims about AI's electricity and water use against their sources. The one I think is most useful to you:
>
> "ChatGPT uses a bottle of water for every email." The study behind it estimated one 500 ml bottle per 10 to 50 answers, for GPT-3. Nobody has published an independent figure for today's models. The page has the quotes and links: https://humearth.org/q/bottle-of-water
>
> Every number on the site links to the page it came from, and each quote is re-checked weekly. It's self-funded, and no company is involved. You're welcome to use anything on it, and I'd be grateful to hear if you spot an error.
>
> Kumar Ganduri
> https://humearth.org/about

**Who to send it to (you choose the names)**

- Reporters who have recently written about data centres, AI energy use or local data-centre planning fights.
- Science and computing teachers, and people who run media-literacy or fact-checking classes.
- Newsletter writers who cover energy or AI.

---

## After each post

- Tell me which post went up and when. I'll read the Cloudflare Web Analytics numbers with you a few days later: visits, which pages people landed on, and where they came from.
- Send me any correction someone raises. A fixed error, acknowledged in the open, is the best thing that can happen in a launch thread.
