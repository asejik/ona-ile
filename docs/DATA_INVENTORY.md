# DATA INVENTORY: Ọ̀nà Ilé

Status: **COMPLETED in P03 LIGHT DESIGN, 2026-11-07** (SCOPE: sections A, B, C, D, G, H, L). Scope: v1.0 (offline and free). The Online and revenue phase adds rows when it is planned.

This is not legal advice. Items marked **[DPO]** need an NDPC-accredited Data Protection Officer or a licensed DPCO to confirm them. **[VERIFY]** means a vendor fact I couldn't confirm from official pages. Check it when you create the account (M1).

Last reviewed: 2026-11-07
- **Controller:** you, the owner. The name and contact you publish are still open (see §8). It moves to your business if you register one with the CAC.
- **Processors:** Cloudflare (hosting), Sentry (crash reports), Umami Cloud (anonymous events).
- **Laws:** NDPA 2023 and GAID 2025 (players in Nigeria, and Nigerian citizens abroad), Google Play User Data policy. GDPR / UK GDPR applies only if EU or UK players become a target market (re-triage trigger).

## 0. Step 0: roles, major importance, DPIA

| Question | Answer | Reasoning |
|---|---|---|
| Controller / processors | You are the controller. Cloudflare, Sentry and Umami are processors | You decide why and how data is used. The vendors act on your instructions under their terms and DPAs |
| Major importance? | **Possibly Ordinary-High (OHL), [DPO]** | The game stores no profiles. But the IP addresses of web visitors (Cloudflare) and of opted-in players (Sentry, Umami) are personal data, and more than 200 people in 6 months is likely. The sector isn't a listed one. OHL means NDPC registration (₦10,000 a year), a DPO, and no audit-return filing (P03 card, part 1). Budget for it and ask the DPO whether in-transit IPs alone count |
| DPIA mandatory? | **Yes, before deployment, [DPO]** | GAID Art. 31 requires a DPIA before deploying software or mobile apps. Cross-border transfers are also a DPIA trigger (card, parts 4 and 5). It must be signed by an accredited DPO using the GAID Schedule 4 template. "Deployment" here means **before the M6 community release** (the web link and APK shared beyond you) |
| Flags | Children (13–17 players may play), data stored outside Nigeria (all three processors) | No sensitive data, no AI, no automated decisions |

## 1. Personal data the app collects

| Data field | Who it's about | Why we need it (purpose) | Lawful basis | Sensitive? | Required or optional | Stored where (service, region) | Who can see it | Shared with | Kept for | How it's deleted |
|---|---|---|---|---|---|---|---|---|---|---|
| IP address and user agent in web-server logs | Web players | Deliver the game files and protect the site from abuse | **Contract / necessity** (serving the game the player asked for), plus legitimate interest for security [DPO: confirm, and a short LIA below] | No | Required to load the web game | Cloudflare global edge. Logs held by Cloudflare (US/EU) [VERIFY] | Cloudflare. You see aggregate dashboards only | None | Cloudflare default [VERIFY]. You don't export logs | Cloudflare retention. You keep no copies |
| Crash report: error type and message, stack trace, game version, OS and browser version, device model class. **No IP stored, no user ID, no breadcrumbs with free text** | Opted-in players aged 18+ (§6) | Find and fix crashes | **Consent** (opt-in prompt). It also covers the transfer abroad (card, part 11; no NDPC adequacy list exists) | No | Optional, off by default | Sentry, **EU region (Frankfurt)**, chosen when the org is created. Some Sentry metadata stays in the US [VERIFY] | You | None | **30 days or the shortest the plan allows** [VERIFY] | Automatic expiry. The in-game toggle stops new reports |
| Gameplay events: `session_start`, `stage_start`, `stage_complete`, `challenge_attempt` (with result tier), `quit_point` (stage, coarse location bucket). Each carries the game version, platform and a coarse screen class. **No user ID, no cookies, no free text** | Opted-in players aged 18+ | Measure the success criteria (PROJECT_PLAN §1) and find where players quit | **Consent** (same prompt, separate toggle) | No | Optional, off by default | Umami Cloud, region [VERIFY: if no EU region, consent still covers it] | You | None | **12 months**, or the plan's limit if shorter [VERIFY] | Vendor retention. Delete the Umami website to purge it. The toggle stops new events |
| IP address in transit to Sentry and Umami | Opted-in players | None. It's a side effect of any web request | (covered by the consent above) | No | — | Used for geolocation and anti-abuse, then discarded: Sentry with IP storage off, Umami hashes into a rotating session ID [VERIFY both] | Vendor | — | Not stored, if the settings hold | — |

**Short legitimate interest assessment (LIA) for server logs:**
- **Purpose:** security and abuse protection of the site.
- **Necessity:** a website can't be served without IP addresses.
- **Balance:** standard, expected, short-lived, never combined with other data, and you have no access to raw logs.
- **Outcome:** proceed. [DPO: confirm]

**Not stored on the device as personal data:** the save, the settings and the save code hold no names or identifiers. The consent record (§5) holds a choice and a date only. Memory Book "photos" are renders of the game world.

## 2. Hidden copies of personal data

| Place | What personal data ends up there | Can it be avoided or masked? | Kept for |
|---|---|---|---|
| Server/function logs | Only Cloudflare's edge logs (above). There are no functions | Yes: no log export, no Workers logging | Cloudflare default |
| Error tracking | Risk: device details, IPs, file paths, any text in error messages | **Yes, and required:** `sendDefaultPii: false`; IP storage off in project settings; `beforeSend` keeps only an allow-list of fields; breadcrumbs off; no session replay; game errors never include player-typed text (the save code) | 30 days [VERIFY] |
| Analytics / session replay | None intended. **No session replay, no heatmaps** | Yes: an allow-list of event names and properties enforced in code | 12 months |
| Backups | None (no server data) | — | — |
| Emails, SMS, WhatsApp messages | Feedback from playtesters reaches you personally, outside the app | Keep it out of the repo, issues and AI prompts. Delete it when no longer needed | Your choice; aim for 6 months or less |
| Exports, PDFs, spreadsheets | Save codes: none. Analytics exports: aggregate only | Don't export raw events | — |
| AI prompts and responses | None at runtime. Development prompts must never paste playtesters' names, numbers or messages | Yes (CLAUDE.md rule) | — |
| Dev / test databases | None (no database). Local saves are your own | — | — |
| GitHub issues and the public repo | Risk: playtesters reporting bugs with their names or numbers | Use a bug-report template that asks for no personal details. Moderate issues | Repo lifetime |

## 3. Third parties that receive personal data (processors)

| Service | What it receives | Purpose | Data location (country/region) | DPA available/signed? | Retention and training settings (AI providers) | Transfer basis if outside Nigeria |
|---|---|---|---|---|---|---|
| Cloudflare Pages | IP and user agent of every web visitor | Hosting the web build, `config.json` and zones | Global edge. Logs and analytics in the US/EU [VERIFY] | Cloudflare's DPA is part of its self-serve terms [VERIFY: accept it in the dashboard] | n/a | Necessity for the service the player requested (NDPA s.43 derogation) [DPO] |
| Sentry | Crash reports of opted-in players | Crash diagnostics | **EU (Frankfurt)**. Organisation metadata in the US ([Sentry](https://sentry.zendesk.com/hc/en-us/articles/35210332258459-Why-are-EU-Event-Ingestion-IPs-pointing-to-the-US)) | Opt-in DPA, accepted electronically ([ComplyDog](https://complydog.com/blog/is-sentry-gdpr-compliant)). **Accept it at M1** | n/a | **Consent** (GAID Art. 18(1)(e)). No adequacy list has been published |
| Umami Cloud | ID-free events of opted-in players | Anonymous analytics | [VERIFY at sign-up] | [VERIFY: check umami.is legal pages] | n/a | **Consent** |
| ~~Google Fonts~~ | ~~IP of every player~~ | — | — | — | — | **Removed in the rebuild** (self-hosted fonts). It exists only in the v0.1 prototype |

**Fallback:** if Umami Cloud has no acceptable DPA or region at sign-up, drop gameplay events for v1.0. Use Play Console statistics and Cloudflare's aggregate visit counts instead. Removing collection beats justifying it.

## 4. Cookies, local storage, pixels, and SDKs

| Name / script | Set by (first or third party) | Purpose | Necessary? (security, network stability, accessibility only) | Loads before consent? (must be NO if not necessary) | Lifetime |
|---|---|---|---|---|---|
| Save (IndexedDB `ona-ile` / Capacitor Preferences) | First party | Game progress, the service the player asked for | Yes (strictly needed for the game) | Yes (allowed) | Until deleted or uninstalled |
| Settings, including the consent record | First party | Preferences and the diagnostics choice | Yes | Yes (allowed) | Same |
| `config.json` cache | First party | Kill switches when offline | Yes | Yes (allowed) | Replaced each launch |
| Umami script | Third party | Analytics | **No** | **No:** not even downloaded before opt-in | Sets no cookies |
| Sentry SDK | Third party (bundled code that sends to Sentry) | Crash reports | **No** | **No:** not initialised before opt-in | Sets no cookies |
| Cloudflare cookies (for example bot management) | Third party | Security | Yes, if any are set [VERIFY: check in M1's Playwright cookie test] | Allowed if necessary | Cloudflare default |
| Legacy `localStorage['babaKeke.v1']` | First party | Prototype save: migrated, then removed | Yes | Yes | Removed after migration |

**Cookie banner:** not needed, because nothing non-necessary loads before choice. The in-game diagnostics prompt (§5) is the consent mechanism, and it meets card part 6: shown full-screen at a natural pause, with equal **Yes** and **No** buttons, purposes listed, who's responsible, and how to change your mind.

## 5. Consent records

- **Where:** `Settings.diagnostics`, stored on the device: `{ crash: bool, stats: bool, at: <UTC ISO>, noticeVersion: "<n>", ageConfirmed18: bool }`.
- **When asked:** once, after the Prologue's first ride has paid out (a natural pause, not the first screen). **Only if the player confirms being 18 or older** (§6). Otherwise nothing is asked and diagnostics stay off.
- **What is shown:** "Help improve Ọ̀nà Ilé?" with two separate toggles, both off ("Send crash reports", "Send anonymous play stats"), and buttons **Save choice** and **No thanks**. Plus a one-line purpose for each, "sent to Sentry (EU) and Umami (outside Nigeria)", and a link to the privacy notice.
- **Withdrawal:** Settings, then Privacy, then the same two toggles. The SDKs stop at once and aren't loaded on the next launch. It's as easy as giving consent.
- **Re-asking:** only when `noticeVersion` changes materially.
- **No server-side record** exists, because there's no account. Vendor data carries no ID that links back to a record.

## 6. Special categories

- **Sensitive data handled:** none.
- **Children (under 18):**
  - The game is rated 13+ and isn't designed for children.
  - **Players under 18 never get the diagnostics prompt.** Diagnostics stay off unless the player confirms being 18 or older.
  - Server logs are needed to serve any visitor, minors included. Note this in the DPIA [DPO].
  - The privacy notice says this.
  - ⚠️ The Online phase (accounts and leaderboards) must design guardian consent or 18+ gating before it's built.
- **Automated decisions with significant effects:** none.

## 7. Change log

| Date | Change | Made in (task/PR) | Privacy re-check needed? |
|---|---|---|---|
| 2026-11-07 | First draft | P02 planning | Yes: P03 at M0 |
| 2026-11-07 | Moved to the suite template | Templates added | Same |
| 2026-11-12 | Crash reporting built (M1b). Verified: Sentry org is in the EU region (DSN host `ingest.de.sentry.io`); events carry `infer_ip: never`, no user, request, breadcrumbs or contexts; the SDK loads only after opt-in. Sentry 11 has no `sendDefaultPii`; `dataCollection` is set to off for every category instead. Still to verify in the Sentry dashboard: "Prevent Storing of IP Addresses", retention, DPA accepted | M1b, `src/platform/` | No: within what P03 approved. P03 AUDIT before M6 as planned |
| 2026-11-07 | Completed: lawful bases, regions, retention, consent design, the 18+ rule for diagnostics, the Umami fallback | P03 LIGHT DESIGN | P03 AUDIT before the M6 community release |

## 8. Open items (yours or the DPO's)

1. **[You]** The controller identity and contact for the notice: your name, or a business name, plus a privacy contact email.
2. **[DPO]** Is v1.0 of major importance (OHL) only because of in-transit and edge-log IPs? Engage a DPO before M6. You need one anyway for the Art. 31 DPIA.
3. **[DPO]** The transfer basis for Cloudflare edge logs (necessity versus consent).
4. **[VERIFY at M1]** Umami Cloud region, DPA and retention; Sentry free-plan retention and the IP-storage setting; Cloudflare log retention and DPA acceptance.
