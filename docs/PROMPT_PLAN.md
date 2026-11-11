# Ọ̀nà Ilé: Prompt Plan (P00 Project Triage)

**History**
- **2026-11-07, first triage.**
- **2026-11-07, re-triage once the suite was added:**
  - Section numbers pinned.
  - Three owner decisions recorded.
  - NDPA flags added for players under 18 and the pre-release DPIA.
- **2026-11-07, update after P01** ([IDEA_BRIEF.md](IDEA_BRIEF.md)):
  - **v1.0 is offline and free.** In-app purchases, leaderboards and accounts move to a post-v1.0 **"Online and revenue"** phase.
  - P03, P08, P07 §3 and P12 work for those features moves into that phase.
  - v1.0 gets a lighter P03 for anonymous analytics and crash reports.
  - Added: a real-phone test in week 1, and fund preparation.
- **2026-11-07, re-triage after P02** ([PROJECT_PLAN.md](PROJECT_PLAN.md)):
  - No quick fact changed category. The plan stays STANDARD, with no backend and no personal data stored.
  - New facts:
    - Cloudflare Pages hosting (`ona-ile.asejik.com`).
    - Umami and Sentry as diagnostics processors, behind opt-in.
    - Public GitHub repo `asejik/ona-ile`.
    - Community APK sharing before Play.
  - Steps are now tied to the PROJECT_PLAN milestones (M0–M8).
  - **P03 LIGHT moves to M0**, because P02 wants error tracking from milestone 1.
  - New check-only items: sideload developer verification (2027) and the repo name.
  - ⚠️ `docs/prompts/templates/` (DATA_INVENTORY and FINDINGS templates) is missing from the suite. Add it before the first audit.

Inputs:
- the design chat;
- the [PRD](https://claude.ai/artifact/DbR5D4bPuhmqcZtjaHE8A1), updated 2026-11-07 for this scope;
- prototype v0.1 (`baba-keke/`);
- the quick-fact answers and the P01 rounds;
- the suite prompts P01–P14 and `supplements/`.

✅ `docs/prompts/AUDIT_STANDARD.md` was added on 2026-11-07. By its rigor table, v1.0 is **STANDARD**: the public can use it, and there's no personal data beyond anonymous diagnostics. The Online phase becomes **STRICT** if it stores data about 13–17-year-olds, because the "children" row is STRICT.

---

## 1. Quick facts and classification

| Fact | v1.0 (now) | After v1.0 ("Online and revenue") |
|---|---|---|
| What | A 3D story-driving game: a returnee drives Baba's keke around a compressed, real Ilorin, carrying passengers through a prologue and 7 stages. | Same game |
| Users | The public: Ilorin locals and diaspora, other Nigerians, international players, portfolio viewers. | Same |
| Platform | **Web build (phone and desktop browsers, first-class)** plus an **Android app** on Google Play (Capacitor). | iOS considered |
| Owner and kind | Yours: solo, Ilorin-based, passion and portfolio, released publicly. A few hours daily, no deadline. | Same |
| Personal data | Saves on the device. **Anonymous analytics and crash reports only**, with no personal identifiers (to be confirmed in P03). | **Accounts and leaderboards** (nickname, no email, an account or device identity). Some players are 13–17. |
| Money | None | **In-app purchases on Android only.** The web build stays free. |
| AI | None at runtime | Same |
| Shape | Static hosting plus an app. **No backend.** | A small backend (leaderboards, accounts, purchase verification) |
| Actions with consequences | None | None |
| Scale and lifetime | Public, from hundreds to thousands of players. Kept for years. | Same |

**Archetype:** Native mobile app, plus a public web build. It's a game, so the store and platform rules matter.

**Risk drivers**

| Driver | v1.0 | After v1.0 | Why |
|---|---|---|---|
| Personal data | some, low | some to high | v1.0: crash and analytics data, even when "anonymous" (device model, IP at the vendor). Later: accounts, including under-18s. |
| Money | none | some | Play Billing handles cards. Entitlements, restores and refunds have to be right. |
| Legal status | some | likely high | v1.0: Play privacy policy and Data safety form, the GAID Art. 31 app privacy statement, the ODbL licence. Later: likely NDPA major importance (over 200 people in 6 months), DPO, DPIA, guardian consent for under-18s. |
| Destructive actions | none | none | |
| Public exposure | high | high | Store listing, public site, real institutions shown on screen. Later, leaderboards invite cheating. |
| AI | none | none | |

**Provisional rigor level: STANDARD for v1.0.** P02 confirms it once `AUDIT_STANDARD.md` is in place. Re-triage at the start of the Online and revenue phase, where STRICT is likely for P03 and P08.

---

## 2. Run order

✋ = steps you can do without the AI. Paths are relative to `docs/prompts/`.

**Now: before the vertical slice**

1. ✅ **P00 Project Triage.** 2026-11-07 (this file).
2. ✅ **P01 Idea Refinement**, MODE A, public product. 2026-11-07, recorded in [IDEA_BRIEF.md](IDEA_BRIEF.md). Verdict: **GO, with refined scope**.
3. ✅ ✋ **Real-phone test, week 1.** Done 2026-11-07: it ran well in mobile Chrome. The playtester asked for swipe-to-drive touch controls, added to the PRD as ACC-3 (P0). The notes below describe the test as it was planned.
   - Open the [prototype](https://claude.ai/artifact/LVmMr8ENW5UvSUw12b2p9V) in Chrome on a 3–4 GB Tecno or Infinix (borrowed is fine).
   - Note the frame rate (by eye: smooth, slightly choppy, or a slideshow), the load time, and whether the phone heats up.
   - Bring the results to P02. This is the brief's top kill-or-pivot test.
4. ✅ **P02 Project Blueprint, USE.** Done 2026-11-07: [PROJECT_PLAN.md](PROJECT_PLAN.md), [DATA_INVENTORY.md](DATA_INVENTORY.md) (draft), [PROGRESS.md](PROGRESS.md), CLAUDE.md. S2 sections 1–2 are still to run, at M5 when the Stage 1 zone data is built. P00 has been re-run. The original step text follows:
   - Stack: Vite, TypeScript, Three.js, Capacitor. Web-first asset loading.
   - Data model: saves and migration from `babaKeke.v1`.
   - The zone pipeline as a build step. The analytics choice. Project Profile and CLAUDE.md. Confirm the rigor level.
   - Run S2 sections 1–2 alongside it:
     > Follow docs/prompts/project/real_world_setting.md, SCOPE: sections 1, 2.
   - Then **re-run P00**.
5. ✅ **P04 Project Setup & Guardrails, USE (STANDARD: items 1–12).** Done 2026-11-11 ([SETUP.md](SETUP.md)). Items 3, 5, 8 and 9 are finished in M1. Item 2 isn't possible on a private Free repo.
   > Follow docs/prompts/P04_project_setup_guardrails.md.

   Item 11 (backups) is N/A until a backend exists.
   - ✋ Turn on MFA for Google (Play Console), GitHub, the domain registrar and hosting (item 10).
   - ✋ Set spend caps (item 10).
   - ✋ Create the Play Console personal account, and recruit 12+ closed testers from your Ilorin communities. A new personal account needs a 14-day closed test before production.
6. **P05 UI Design Direction, USE.** P05-A is done (2026-11-11, [DESIGN.md](DESIGN.md)). P05-B is next. P05-A (extract from the prototype), then P05-B (signage, HUD, menus, touch controls).
   > Follow docs/prompts/P05_ui_design_direction.md, P05-A then P05-B.
7. **P06 Safe Change Protocol, USE, every change.**
8. ✋ **Fund preparation**, at any time before mid-2027. Register a business name or company with the CAC, so you can apply to the next Google Play Indie Games Fund Africa round. It requires a registered studio and an already-launched game. See IDEA_BRIEF, Sustainability.

**Milestone: vertical slice done** (Prologue and Stage 1)

9. **P07 Production Readiness, LIGHT, MID-PROJECT.**
   > Follow docs/prompts/P07_production_readiness_audit.md, MID-PROJECT, SCOPE: sections 1, 2, 5, 6, 7.
10. **P09 Architecture & Product Quality, LIGHT.**
    > Follow docs/prompts/P09_architecture_quality_review.md, SCOPE: sections 1, 2, 4, 6.
11. **P08 Security, LIGHT.**
    > Follow docs/prompts/P08_security_audit.md, SCOPE: sections 1, 3, 11.

**Before adding analytics or crash reporting** (v1.0). **This now runs at M0, before steps 5–6**, because M1 wires up Sentry.

12. ✅ **P03 Privacy & Data Protection, LIGHT, DESIGN mode.** Done 2026-11-07. It completed DATA_INVENTORY.md and added PRIV-1..12 and the section L checklist to PROJECT_PLAN §9. Findings: the **DPIA is mandatory before the M6 community release** (GAID Art. 31), so **P03 AUDIT now runs at M6**, not only before v1.0. Diagnostics are limited to players who confirm they're 18+.
    > Follow docs/prompts/P03_privacy_data_protection.md, DESIGN mode, SCOPE: sections A, B, C, D, G, H, L.

    Output: `docs/DATA_INVENTORY.md`. It must settle:
    - whether the analytics and crash data really carries no identifiers;
    - the privacy policy for Play and the web;
    - the GAID Art. 31 app privacy statement;
    - the Data safety form inputs;
    - whether a DPIA is needed for v1.0.

**Slice release** (optional early-access release on web and Play, which also counts as a launched game for the fund)

13. **S1 Play Store release, USE.**
    > Follow docs/prompts/project/play_store_release.md.

    Section 6 (Billing) is N/A for v1.0.
14. **P14 Launch Gate, USE (short).** Covers the slice on the web and the Play closed test, then production.

**Before the v1.0 launch** (all 7 stages)

15. **P03, AUDIT mode**, at the LIGHT scope from step 12.
16. **P07, USE, PRE-LAUNCH mode.** Sections 1, 2, 4, 5, 6, 7. Section 3 (payments) and section 8 (audit trails) are N/A for v1.0.
17. **P08, USE.** All sections that apply. Sections 2, 4, 6 and 7 are N/A while there are no accounts or purchases. Section 8 is N/A because there's no AI.
18. **P09, USE** (all sections).
19. **P11 SEO & Discoverability, LIGHT**, for the web build.
    > Follow docs/prompts/P11_seo_discoverability_audit.md, SCOPE: sections 1, 2, 4, 6.
20. **S2, sections 3–6.**
    > Follow docs/prompts/project/real_world_setting.md, SCOPE: sections 3, 4, 5, 6.
21. **S1** again, for the production release.
22. **P13 Live Operations, Part A, LIGHT.**
    > Follow docs/prompts/P13_live_operations.md, PART A, SCOPE: items 1, 2, 3, 4.

    That covers crash alerts, a runbook for "Play policy email" and "site down", the access register, and the maintenance calendar.
23. **P14 Launch Gate, USE.** Once for the Play production release and once for the web launch.

**After launch**

24. **P13 Part B** as its calendar sets out. **Part C** if an incident happens.
25. **P06** on every update. S1 upkeep (the target API rises every August).

**Online and revenue phase** (only after v1.0 is fully tested)

26. **Re-run P00 first.** This phase adds personal data, payments and a backend.
27. **P02 update** for the backend, data model, entitlements and leaderboard.
28. **P03, USE, DESIGN mode** (all sections A–L):
    - the under-18 approach (age gate, no personal data, or guardian consent);
    - account deletion in the app and on the web;
    - the major-importance assessment and NDPC registration;
    - a DPO and the DPIA before release.
29. **P08, LIGHT, design review.**
    > Follow docs/prompts/P08_security_audit.md, SCOPE: sections 2, 4, 5, 6, 10, 13.
30. **P12 Egress & Efficiency, LIGHT.**
    > Follow docs/prompts/P12_egress_efficiency_audit.md, SCOPE: sections A, B, C, G, H, plus PROJECTION.
31. **P07 section 3 and P08 section 7** before purchases. **P04 item 11** (backups) once the backend exists.
32. Then: S1 section 6 (Billing), P03 AUDIT, P07 PRE-LAUNCH, P08 full, P13 Part A update, and P14.

---

## 3. Decisions table

| ID | Decision | Mode, scope, when | Reason, or trigger for LATER |
|---|---|---|---|
| P01 | **USE**, ✅ done | MODE A, 2026-11-07 | Public product with a PRD (decision rule). |
| P02 | **USE** | Now. Updated for the Online phase | Moving from a single-file prototype to a real stack. |
| P03 | **LIGHT** for v1.0. **USE** for the Online phase | v1.0: DESIGN with sections A, B, C, D, G, H, L, then AUDIT. Online: all sections | v1.0 has only analytics and crash data. Accounts and minors come later. |
| P04 | **USE** | All items now. Item 11 when a backend exists | Distributed and kept for years (decision rule). |
| P05 | **USE** | P05-A then P05-B, now | The UI is judged constantly, and the signage is a core feature. |
| P06 | **USE** | Every change | Code will be written (decision rule). |
| P07 | **USE** | Sections 1, 2, 5, 6, 7 MID. Pre-launch without sections 3 and 8. Section 3 in the Online phase | Low-end performance, save integrity. Payments come later. |
| P08 | **USE** | Sections 1, 3, 11 at the slice. All applicable pre-launch. Sections 2, 4, 6, 7, 10, 13 in the Online phase | Public and distributed. Accounts and purchases come later. |
| P09 | **USE** | Sections 1, 2, 4, 6 at the slice. All pre-launch | A portfolio piece, so quality and accessibility are the point. |
| P10 | **SKIP** | — | No AI at runtime. **Trigger:** AI-generated dialogue, voices or passengers. |
| P11 | **LIGHT** | Sections 1, 2, 4, 6, before the web launch | The web build is a main channel for reach. |
| P12 | **LATER** | Sections A, B, C, G, H plus PROJECTION | **Trigger:** the Online phase's backend, or hosting bills appearing. v1.0 is static hosting. |
| P13 | **LIGHT** (Part A) | Items 1–4 before launch, then Part B | Public players depend on it, including crash monitoring (decision rule). |
| P14 | **USE** | Slice release (short), v1.0 launch, Online phase | Released to the public (decision rule). |

**Owner decisions:**
- ✅ 2026-11-07: **Sell only on Android.** The web build is free.
- ✅ 2026-11-07: **Leaderboards use nicknames, no email.**
- ✅ 2026-11-07: **Rated 13+, not designed for children.** Under-18 handling is decided in the Online phase P03.
- ✅ 2026-11-07, from P01: **v1.0 is offline and free.** In-app purchases, leaderboards and accounts come in a post-v1.0 phase, after v1.0 is fully tested.
- ✅ 2026-11-07, from P01: **The web build is first-class** in phone and desktop browsers, not a side build.

_Overrides of my recommendations:_
- 2026-11-11: **The repo stays private** (owner's choice). It was recommended public in P02 and P04 for branch protection, push protection and the ODbL offer. Instead: gitleaks in CI and Claude deny rules, `main` protected by habit, and the ODbL zone-data offer made separately before M6. See docs/SETUP.md.

---

## 4. Supplements

| Path | Covers | Runs | Add to suite library? |
|---|---|---|---|
| [prompts/project/play_store_release.md](prompts/project/play_store_release.md) | First Google Play release of a Capacitor game: account and testing rules, target API, signing, Data safety, account deletion, Billing, content rating, WebView performance, listing, upkeep | Steps 13 and 21. Section 6 in the Online phase. Each August | **Yes:** `supplements/android_play_release.md`, generalised |
| [prompts/project/real_world_setting.md](prompts/project/real_world_setting.md) | Real-place settings: ODbL attribution and share-alike, the Google Maps reference-only rule, real institutions, cultural and religious sensitivity, brands | Sections 1–2 with P02 (step 4). Sections 3–6 before launch (step 20). Again with each new zone | **Yes:** `supplements/real_world_setting_map_data.md` |

There's no overlap with the library: `desktop_app_release_safety.md` covers desktop apps only.

---

## 5. Check-only items

| Checked in | Item |
|---|---|
| P02 | Decide the fate of the `baba-keke/` folder name and the `babaKeke.v1` save key. If you rename either, add save migration. |
| P02 | The zone pipeline runs as a build step, reproducible from a pinned OSM extract. Run it on each later stage's bbox before designing that stage. |
| P02 | Web-first loading: zones load lazily and textures are compressed, to fit the PRD's 150 MB install and 5 MB-per-zone budgets. |
| P04 item 3 | CI runs the zone build and fails if `zone*.js` drifts from its source extract. |
| P08 section 11 | Three.js and fonts are bundled locally. The Android build loads no code from a CDN. |
| P05-B | Yoruba diacritics render correctly in every font and surface, including the launcher name and the store listing. |
| P07 section 4 | Fully playable offline. Analytics and crash reporting fail quietly. |
| P07 section 2 | Timed challenges can't be gamed by pausing, backgrounding the app or changing the device clock. Best times are saved locally (TIME-2). |
| P07 section 6 | 30 fps and a zone load under 10 s on the target phone, **in Chrome and in the Capacitor app**. |
| P03 A/G | The analytics and crash vendor sends no personal identifiers, and this matches the Data safety form and the privacy policy. |
| P11 section 6 | The web build has an Open Graph image and the title "Ọ̀nà Ilé: The Last Delivery". |
| P14 section 4 | "© OpenStreetMap contributors" is visible in the game, on the web page and in the store description. |
| P14 section 4 | Content rating done, and the target audience is declared as 13+. |
| P14 section 4 | Store art shows no real brand logos or recognisable private individuals. |
| S2 section 1 | Before M6, publish the ODbL share-alike offer for the zone data, for example a small public repo with `build_zone.py` and the zone JSON, because the main repo is private. |
| S1 section 1 | The developer identity is verified in Play Console before community APKs need it. Google extends sideload verification globally in 2027. |
| P04 item 1 (done 2026-11-11: private repo, LICENSE all rights reserved, NOTICE.md) | Licence split: code, zone script and zone data under open licences (MIT for code, ODbL for zone data). Art, music and story "all rights reserved", or kept in a private repo. |
| P14 section 2 | Online phase only: the DPIA is signed by an accredited DPO, and NDPC registration is done if you're over 200 people in 6 months. |

---

## 6. Minimum if short on time

1. P06 on every change.
2. The week-1 real-phone test (step 3).
3. P04 items 1, 4 and 10: git, secret protection, MFA.
4. P03 LIGHT before analytics: privacy policy, Data safety form, no identifiers.
5. P08 sections 1, 3 and 11.
6. S1 sections 2 and 5: target API, policy declarations.
7. S2 section 1: OSM attribution and share-alike.
8. P14 before each release.

---

## 7. Re-triage triggers

Run P00 again when any of these happens:
- P02 is finished (planned).
- **The Online and revenue phase starts** (planned): accounts, leaderboards, purchases, a backend.
- **Ads** are added.
- Purchases are added **on the web**, or outside Google Play.
- **Cloud saves, notebook-photo sharing, chat or any user-generated content.**
- **AI-generated content at runtime** (brings in P10).
- **iOS / App Store** release.
- Targeting **children** or schools, or a rating below 13+.
- Real **businesses or sponsors** in the game.
- Joining Google Play Pass, or receiving grant funding with obligations.
- A collaborator, publisher or client joins, or the project is handed over.
- The analytics choice turns out to collect identifiers. Or the EU or UK becomes a target market (GDPR).
- New cities or zones beyond Ilorin.
