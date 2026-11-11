# Ọ̀nà Ilé: Idea Brief (P01)

Date: 2026-11-07 · Mode: A (my idea) · Project type: public product (passion and portfolio) · Owner: you (solo, based in Ilorin)
Working name: **Ọ̀nà Ilé: The Last Delivery** (store spelling "Ona Ile") · Input: [PRD](https://claude.ai/artifact/DbR5D4bPuhmqcZtjaHE8A1), prototype v0.1, P00 triage, two P01 rounds.

**Verdict: GO, with refined scope.** Build the vertical slice (Prologue and Stage 1) as a finished, offline product on **web and Android** first. Test it on a real phone in week 1, because that is the cheapest way to kill or confirm the biggest technical risk.

---

## Problem statement

The problem is what players lack, because this is a game.
- **Ilorin locals and the diaspora** almost never see their own streets, slang and characters in a game. Nigerian games that use real places are mostly about Lagos (see the alternatives below).
- **Nigerians from other cities and international players** have no warm, easy way to "visit" a Nigerian city that isn't Lagos.
- **For you:** you need a public, finished piece of work that proves your craft and range, and brings downloads, reviews, job offers and client leads.

## Current alternatives and why they fall short

| Alternative | What it is | Gap |
|---|---|---|
| [Lagos Run](https://innovation-village.com/nigerian-developer-turns-lagos-danfo-into-viral-game/) | A browser danfo arcade game that went viral | Lagos, arcade only, no story or real map. *It proves a shareable browser link can reach Nigerian players.* |
| [Danfo Reloaded II](https://techcabal.com/?p=4929) | Lagos bus-route driving game | Lagos, no emotional story |
| Danfo Hustle: Lasgidi Payback (planned) | Story-driven action driving game in a stylised Lagos | Lagos, action rather than warmth, not released yet |
| [Keke on the Run 2](https://djogundipe.itch.io/keke-on-the-run-2) | Small keke chase game on itch.io | Arcade, no real place |
| Taxi Ranked (South Africa, [Google Indie Games Fund 2026](https://blog.google/intl/en-africa/products/android-chrome-play/indie-games-fund-2026-meet-the-selected-studios-in-africa/)) | Comic-style minibus taxi game | Not Nigeria, not a real map |
| Big taxi and driving games (Crazy Taxi style) | Polished arcade driving | No local meaning |

**Nobody combines a real city's map, a heartfelt story, and Ilorin.** That combination is the edge. Each part alone is common.

## Value proposition and reach

For **Ilorin people and curious players** who **never see this city in games**, Ọ̀nà Ilé lets them **drive its real streets in a warm family story**, unlike **Lagos-only arcade games**.

**Why you:** you live in Ilorin, belong to several communities there, and already have a working prototype built from real map data.

**How the first 100 players find it** (FACT: your community access; ASSUMPTION: it converts into players):
1. Share the web build link in your Ilorin communities: WhatsApp groups, Unilorin contacts and local social media. It needs no install and works on any phone.
2. Recruit the 12+ Play closed testers from the same groups. That satisfies Google's 14-day testing rule and gives you the first reviewers.
3. Post short clips (a real roundabout, a warden scene) on X and TikTok with Ilorin tags. Locals recognising their streets is the shareable moment.
4. Publish a making-of write-up for the portfolio audience: "a 3D game of a real Nigerian city built with AI-assisted development".

## Users and context

| User | Context |
|---|---|
| Ilorin locals and diaspora | Mostly Android phones with 3–4 GB of RAM (Tecno, Infinix, Samsung A). Expensive mobile data, patchy connections. English, Pidgin and Yoruba. |
| Other Nigerians | The same devices. Want keke life with an Ilorin twist. |
| International players | PC browser or phone. Need subtitles and a gentle learning curve. |
| Portfolio viewers | Open the web link on a laptop. Spend under 5 minutes, so the first minute has to impress. |

**Web is first-class, not a side build** (your answer). The same build must work in a phone browser and a desktop browser, not only in the Android app.

## Core job of version one

**Make a stranger feel they've driven through a real, living Ilorin and want the next chapter.** That means:
- knowing where you are (signs and street names);
- one complete, moving stage of story;
- a ride loop that stays fun.

| Must have, in the slice (Prologue and Stage 1) | v1.0 (all seven stages) | After v1.0 is fully tested |
|---|---|---|
| NAV-1, NAV-2, NAV-3, NAV-5. DMG-1, DMG-3, DMG-4. TIME-1. CORE-1..3. REAL-1 for the Post Office. SYS-1, ACC-2, PERF-1. Web and Android builds. OSM credit. | All P0 rows across 7 stages. P1 rows as time allows. Anonymous analytics and crash reports. | **In-app purchases**, **online leaderboards**, **accounts** (nickname, no email), and iOS if wanted |

**Out of scope for v1.0:** online features of any kind, real-money purchases, ads, multiplayer, full voice acting (short barks only), a 1:1 map, and zones beyond the seven stages.

## Assumptions

| Assumption | Status | How to test or confirm |
|---|---|---|
| Three.js holds 30 fps on a 3–4 GB Android, in Chrome **and** in the Capacitor app | UNKNOWN | **Week 1:** open the prototype link on a borrowed Tecno or Infinix. Record fps, heat and load time. Do the same in the Android build once it exists. |
| One person can build a polished stage in a reasonable time | UNKNOWN | Measure the vertical slice. A few hours a day is your budget. Use the slice time to set the stage dates. |
| Locals enjoy seeing their city and share it | ASSUMPTION, likely | Share the slice in 3 communities. Watch play time and shares, and collect quotes. |
| Outsiders care about Ilorin | ASSUMPTION | Compare play time between non-Ilorin and Ilorin players in the slice's anonymous analytics. |
| Players will pay (purchases after v1.0) | ASSUMPTION, weak | Before building purchases, ask 5–10 slice players what they last paid for in a mobile game, and offer a "support the game" option to see who uses it. |
| Locals will review zones and dialogue | FACT (you live there and belong to communities) | Name 5–10 reviewers before Stage 1 content is final. |
| OSM data for later stages (Okelele, Sobi Hill, Asa Dam) is good enough | UNKNOWN | Run `build_zone.py` on each stage's bbox before designing that stage, and check the counts. |
| The art pipeline (Blender and AI drafts) produces Pixar-style characters you're happy with | UNKNOWN | Make one character (Baba) end to end in the slice. |

## Sustainability

- **Success definition** (yours): downloads, reviews, job offers and client leads within 90 days of launch.
- **v1.0 running costs:** close to zero.
  - Static web hosting (a free tier should be enough).
  - Play Console one-off fee of US$25.
  - A domain name, about US$10–15 a year.
  - Anonymous analytics and crash reporting on free tiers.
- **Currency risk:** low for v1.0, since there are almost no USD bills. It grows with a post-v1.0 backend (leaderboards and accounts), which bills in USD. Decide then which card pays it, and cap spending.
- **Revenue later:** in-app purchases after v1.0. A likely shape is one "unlock the full story" purchase after a free Prologue and Stage 1. Price it for Nigerian players (Play local pricing in ₦).
- **Funding route: Google Play Indie Games Fund Africa.** This is a recurring Google Play fund: [the 2026 round](https://tech-ish.com/2026/07/06/google-play-indie-games-fund-africa/) ran from 1 to 31 July 2026 and gave grants of US$50k–200k to 10 studios.
  - Eligibility, as reported (verify on the official portal):
    - **legally registered** in an eligible country (Nigeria is one);
    - privately owned, with 50 or fewer employees;
    - **has already launched at least one game**;
    - publishes on Google Play and joins Play Pass non-exclusively for 2 years.
  - **A solo developer can apply only as a registered business.** In Nigeria that means registering a business name or company with the CAC. It also needs a game already launched.
  - **Path:** register with the CAC, and get the vertical slice live on Play (as an early-access or free first release) before the next window, likely mid-2027 if the yearly pattern holds.
  - Play Pass participation fits well with a game whose purchases are light.
- **Account ownership:** all yours (Google, GitHub, domain, hosting).

## Legal flags

These are for a professional to confirm. They are not legal advice.
- **No licensed activity.** No lending, wallets or betting. Play Billing handles any later payments.
- **Map data:** OSM's ODbL licence. Show the credit, and offer the derived zone data or the script that makes it (S2 supplement).
- **NDPA, for v1.0:** if analytics and crash reports carry no personal identifiers, the personal data is minimal. Even so, Play needs a privacy policy and a Data safety form, and GAID Art. 31 (software and mobile apps) may still expect a privacy statement. Confirm in P03.
- **NDPA, after v1.0:** accounts and leaderboards will likely pass 200 people in 6 months (major importance: NDPC registration, a DPO, a DPIA before release). Players aged 13–17 are children under the NDPA, so their data needs guardian consent. Design for this before building accounts.
- **Harm check:** low. Real institutions (the Emir's Palace, police, wardens, mosques) need respectful portrayal. The tone rules are already in the PRD, and the S2 supplement checks them.

## Constraints and dependencies

- Solo builder, a few hours daily, no fixed deadline. The work proceeds in small playable steps.
- No Android test phone in hand yet. **Borrow or buy a target-class phone before the slice is built.**
- Depends on OSM data quality per zone, local reviewers, reference photos of landmarks, and an art pipeline that hasn't been tested yet.

## Success metrics, first 90 days after the slice or v1.0 launch

These are suggested targets. Adjust them once you see the slice numbers.
- 1,000+ web plays, and 500+ Play installs.
- 4.3★ or better on Play, from at least 30 reviews.
- 5+ written reactions from Ilorin players you can quote in the portfolio.
- At least 2 job or client conversations credited to the game or the making-of write-up.

## Kill or pivot signals

- **The phone can't reach 25+ fps** on a 3–4 GB device even in the lowest-detail mode. Switch to the Godot fallback, or make the game PC and web first.
- **The slice takes more than about 3 months** at your pace. Cut v1.0 to 3 stages and fold the story's ending into Stage 3.
- **Locals don't finish the Prologue,** or don't share it. Fix the first 5 minutes before building more stages.
- **Reviewers flag a portrayal as offensive.** Stop and rework it before release, without exception.

## Open questions for planning (P02)

- The engine bundle and asset strategy that keep the web build small and fast on phones (lazy-load zones, compressed textures).
- Analytics choice: something with no identifiers (for example, self-hosted or cookieless) versus Firebase. P03 decides.
- Whether the slice goes to Play as an early-access first release, which counts toward the fund's launched-game requirement.
- Whether Ayo is male, female or the player's choice (the PRD says player's choice), and how much voice acting there is.
- Which roundabout monuments can be modelled from your own photos.
