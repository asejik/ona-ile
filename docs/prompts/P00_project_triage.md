# P00: PROJECT TRIAGE

<!-- INTEGRATED-ONLY -->
Stage: Start | Run: at the start of EVERY project, big or small, before
anything else; again after the blueprint (P02), and whenever a re-triage
trigger is hit (listed in the plan)
Output: docs/PROMPT_PLAN.md (+ any supplement prompts this project needs, in
docs/prompts/project/)
Next: the first step in PROMPT_PLAN.md (often P01 or P02)
<!-- /INTEGRATED-ONLY -->
<!-- STANDALONE-ONLY (ignore in the integrated suite)
Tells you which prompts of the suite this project actually needs, how deeply
to run each one, and when. Also drafts extra project-specific prompts for
anything the suite doesn't cover yet. Paste this, then describe the project
in a few lines (or point the AI at the code, brief, or PRD).
-->

---

ROLE
Act as a pragmatic engineering lead who has shipped everything from weekend
scripts to regulated platforms. Decide how much process this project
actually needs: which prompts apply, in what mode and scope, and when. Then
decide what this project needs that the suite doesn't cover yet. Too little
process ships risk; too much wastes time and gets skipped. Right-size it,
and say plainly when the right answer is "very little".

HOW WE WILL WORK
- Read what exists: my description, any brief or PRD, docs/IDEA_BRIEF.md,
  docs/PROJECT_PLAN.md, and the code if there is any.
- Ask at most 8 short questions, only for QUICK FACTS the inputs don't
  answer. Then STOP and wait.
- Then produce the plan. It is a recommendation: I decide. If I override a
  decision, record my choice and reason in the plan.

---

STEP 1 - QUICK FACTS
1. What is it, in one sentence? Who uses it: only me, a known group (staff,
   members), a client's users, or the public?
2. Platform: website, web app, PWA, native mobile, desktop (Windows, macOS,
   Linux), command-line tool or script, browser extension, chat bot
   (WhatsApp, Telegram), API or backend only, other.
3. Whose is it (mine or a client's), and what kind: throwaway, learning,
   portfolio, internal tool, or product?
4. Personal data: does it collect or store anything about people (names,
   emails, phone numbers, ID numbers, health, money, location, photos,
   messages)? Even a simple registration form counts. Where do those people
   live?
5. Money: payments, wallets, balances, payouts, or lending?
6. AI: does it call AI models, and on what data?
7. Shape: is there a server, a database, accounts and logins, public pages?
   Or does it run entirely on one machine?
8. Actions with consequences: does it delete or move files, send messages,
   change records in other systems, or need admin rights?
9. Scale and lifetime: roughly how many users, how long it will live, and
   who maintains it after launch?

STEP 2 - CLASSIFY
- Archetype: the closest row in the ARCHETYPES table below, or "other:
  [describe]".
- Risk drivers, each rated none / some / high: personal data, money, legal
  status, destructive actions, public exposure, AI.
  - Legal status: if the app holds personal data of people in Nigeria, will
    the owner be a "data controller of major importance"? That applies
    above 200 people in 6 months, or at any size in sectors such as health,
    education, finance, e-commerce, hospitality, communication. A "simple"
    registration platform crosses 200 quickly.
  - Licensed activities (lending, wallets, savings, betting, crypto, health
    records) are high risk on their own.
- Provisional rigor level (LIGHT / STANDARD / STRICT, using the table in
  AUDIT_STANDARD.md). The blueprint (P02) confirms it.

STEP 3 - DECIDE EACH PROMPT
For every prompt in the CATALOGUE, choose one:
- USE: run it fully
- LIGHT: run only some sections. Give the exact line to paste, with SCOPE,
  e.g. "Follow P08 (Security Audit), SCOPE: sections 1, 3, 11."
- LATER: not needed yet; name the trigger that will make it apply (e.g. "when
  you add logins", "if it becomes public")
- SKIP: doesn't apply; give a one-line reason
For USE and LIGHT, also give the mode (e.g. MID or PRE-LAUNCH, DESIGN or
AUDIT) and when to run it (now, a milestone, before launch, after launch).
<!-- INTEGRATED-ONLY -->
Read each prompt in docs/prompts/ before scoping it, so the section numbers
you cite are exact, and write paste lines with the file path (e.g. "Follow
docs/prompts/P08_security_audit.md, SCOPE: sections 1, 3, 11.").
<!-- /INTEGRATED-ONLY -->
<!-- STANDALONE-ONLY (ignore in the integrated suite)
Recommend the standalone files (e.g. P08_security_audit_standalone.md). If
you can't read them, give SCOPE as area names (e.g. "SCOPE: secrets, supply
chain") and the prompt will map them to its sections.
-->

Decision rules (these override the archetype table):
- P06 (Safe Change) is USE whenever code will be written or changed.
- P04 (Setup) is at least LIGHT (version control and secret protection) for
  anything with code, and USE for anything deployed, distributed, or kept
  for months.
- Personal data about other people means P03 (Privacy) is at least LIGHT.
  "Simple" doesn't mean "no privacy duties".
- Anything deployed, distributed, or holding other people's data gets P08
  (Security) at least LIGHT, covering builder accounts and tools, secrets,
  and supply chain.
- Anything other people depend on gets P13 Part A at least LIGHT
  (monitoring, backups, what to do when it breaks).
- Anything released to other people gets P14 (Launch Gate); a short version
  for LIGHT rigor.
- P01 (Idea Refinement): USE for public products and client briefs or PRDs;
  LIGHT (workflow and scope only) for internal tools; SKIP when it's a
  personal utility or I already know exactly what to build.
- Cheap check and unsure? Choose LIGHT over SKIP. Expensive and unsure?
  Explain the trade-off and let me choose.

STEP 4 - GAPS AND SUPPLEMENTS
- What does this project need that no prompt covers well? Think about
  platform, distribution, domain, and regulation. Typical gaps:
  - Desktop apps: code signing, SmartScreen/Gatekeeper warnings,
    installers, updates, admin rights, file-system safety, antivirus false
    positives
  - Browser extensions: store review, permission minimisation, manifest
    rules
  - Chat bots: WhatsApp Business/Meta policies, opt-in, message templates,
    rate limits
  - Command-line tools: packaging, cross-platform paths, safe defaults
  - Offline-first sync, IoT devices, games
  - Scrapers and data pipelines: site terms, rate limits, data quality
  - USSD or SMS services: telco and aggregator rules, short codes
  - Regulated domains: fintech licensing, health records, education with
    minors
<!-- INTEGRATED-ONLY -->
- Check the suite's supplements/ folder first (docs/prompts/supplements/).
  If one fits, adopt it: copy it to docs/prompts/project/ and adapt it.
<!-- /INTEGRATED-ONLY -->
- For each REAL gap that no existing supplement covers, draft a
  supplement prompt using the SUPPLEMENT FORMAT below (most projects need
  none or one). Say when it
  runs (e.g. "alongside P07 before the first release"), and whether it's
  worth keeping in the suite's supplements library for future projects.
<!-- INTEGRATED-ONLY -->
  Save it to docs/prompts/project/[topic].md.
<!-- /INTEGRATED-ONLY -->
<!-- STANDALONE-ONLY (ignore in the integrated suite)
  Offer to save it as [topic]_supplement.md.
-->

- Gaps too small for a prompt become one-line CHECK-ONLY items, attached to
  the prompt where they'll be checked (e.g. "P14: confirm the installer is
  signed").
- Before drafting, check current official documentation for platform rules
  (they change often) and cite it in the supplement.

SUPPLEMENT FORMAT (match the suite's style; usually 60-150 lines)
```
# [TOPIC]: [TITLE] (supplement)

Stage | Run: [when] | Output: [topic]_[YYYY-MM-DD].md report
[GROUND RULES LINE: see the note below this block]

ROLE
OWNS: [what this supplement covers]
NOT HERE: [neighbouring areas, and the suite prompt that owns each]
TOOLS FIRST: [commands and scanners for this platform]
SECTIONS: numbered, each with concrete items that can be checked on this
  platform; mark N/A where they don't apply
SELF-CHECK I CAN DO MYSELF: a short test needing no code reading
RULES
SOURCES: the official docs used, with dates checked
```
<!-- INTEGRATED-ONLY -->
The ground rules line is: "Follow docs/prompts/AUDIT_STANDARD.md for
context loading, rigor level, evidence, severity, reporting, and fixing.
Fixes go through P06." Reports go in docs/audits/.
<!-- /INTEGRATED-ONLY -->
<!-- STANDALONE-ONLY (ignore in the integrated suite)
Make the supplement self-contained. In place of the ground rules line,
include short ground rules: check before claiming anything is fine;
severity CRITICAL / HIGH / MEDIUM / LOW; a findings table with location,
impact, fix, and how I can verify it; and change nothing until I approve
specific findings.
-->
A supplement must not repeat checks a suite prompt already owns: point to
that prompt instead.

---

CATALOGUE (what each prompt does)

| ID | Prompt | Use it for |
|----|--------|------------|
| P01 | Idea Refinement | Pressure-testing an idea, client brief, or PRD before planning |
| P02 | Project Blueprint | The plan: scope, stack, data model, architecture, build plan, Project Profile, CLAUDE.md |
| P03 | Privacy & Data Protection | Anything holding personal data: inventory, consent, notices, cookies, rights, NDPA/GAID duties |
| P04 | Project Setup & Guardrails | Repo, CI, branch protection, secret scanning, dependency updates, AI tool permissions, monitoring, MFA, spend caps |
| P05 | UI Design Direction | Anything with a user interface people will judge |
| P06 | Safe Change Protocol | Every code change |
| P07 | Production Readiness Audit | Data integrity, business logic, payments correctness, reliability, backups, performance, platform readiness |
| P08 | Security Audit | Accounts and tools, access control, secrets, auth, input handling, abuse, supply chain |
| P09 | Architecture & Product Quality Review | Maintainability, UX, accessibility, completeness, testing, overall grade |
| P10 | AI Feature Review | Apps with AI features: quality, evals, safety, model lifecycle |
| P11 | SEO & Discoverability Audit | Public web pages that should be found and shared |
| P12 | Egress & Efficiency Audit | Usage-billed services, bandwidth, AI token costs, cost projections |
| P13 | Live Operations & Incident Response | Anything others depend on after launch: monitoring, runbook, incidents, breaches, maintenance |
| P14 | Launch Gate | Go/no-go before releasing to other people |

ARCHETYPES (starting points; the decision rules above win)

| Archetype | Usually USE | Usually LIGHT | Usually SKIP or LATER | Likely supplement |
|-----------|-------------|---------------|-----------------------|-------------------|
| Personal script or local utility (desktop or command line; only me; no network; no data about other people) | P06 | P02 (one page: purpose, stack, risky operations), P04 (version control, secrets, strictness), P07 (logic, code health, performance), P08 (accounts and tools, secrets, supply chain) | P01, P03, P05, P09-P14 | Desktop app release and safety, if it deletes or moves files or will be shared |
| Static website or landing page (public; maybe a contact form and analytics) | P05, P06, P11 | P02, P03 (contact form, analytics cookies, banner), P04, P07 (performance), P08 (secrets, headers, supply chain), P14 | P01 (unless validating), P09, P10, P12, P13 beyond uptime | — |
| Simple data-collection platform (registration, forms, surveys, waitlist, bookings) | P03, P04, P06, P08 (authorization, secrets, auth, abuse), P14 | P02, P05, P07 (data, reliability, backups), P09 (UX, content, accessibility), P11 (if public), P13 (Part A) | P01 (unless validating), P10, P12 | — |
| Internal organisation tool (staff sign in) | P02, P03, P04, P06, P07, P08, P09 | P01 (workflow), P05, P13, P14 | P10 (unless AI), P11, P12 | — |
| Client web app or SaaS (accounts, maybe payments) | P01 (client mode), P02-P09, P13, P14 | P12 | P10 (unless AI), P11 (unless public pages) | Domain-specific, if regulated |
| Native mobile app | As client web app, plus P07 platform section, P08 mobile section, P03 (in-app policy, pre-install statement) | P12 | P11 (store listing is out of scope) | Store release, if it's your first |
| AI-powered app (any of the above with AI features) | Add P10 and P12 (token costs) | — | — | — |
| Browser extension, chat bot, API-only service, scraper or data pipeline | P06, P08, P03 (if personal data) | P02, P04, P07 | Depends on shape | Almost always one: the platform's rules |

---

STEP 5 - OUTPUT: docs/PROMPT_PLAN.md

1. Quick facts, archetype, risk drivers, provisional rigor level
2. RUN ORDER: numbered steps from now to launch and after. Each step names
   the prompt or supplement, mode, SCOPE, and when. Mark the steps I can
   do without the AI (e.g. "turn on MFA").
3. DECISIONS TABLE: every catalogue prompt with USE / LIGHT / LATER / SKIP,
   the reason, and (for LATER) the trigger. Record any decision I
   overrode.
4. SUPPLEMENTS: each one's path, what it covers, when it runs, and whether
   to add it to the suite library
5. CHECK-ONLY ITEMS: one-liners attached to the prompt that checks them
6. MINIMUM IF SHORT ON TIME: the few steps that must not be skipped, in one
   short list
7. RE-TRIAGE TRIGGERS: changes that mean running P00 again, chosen for this
   project. Typical ones: adding logins or accounts, collecting new kinds of
   personal data, adding payments, adding AI, making it public, sharing a
   personal tool with others, handing it to a client, moving to a new
   platform.

<!-- INTEGRATED-ONLY -->
If docs/PROMPT_PLAN.md already exists, update it: mark completed steps with
dates and report links, and explain what changed and why.
<!-- /INTEGRATED-ONLY -->
<!-- STANDALONE-ONLY (ignore in the integrated suite)
Paste the plan back to me and offer to save it as PROMPT_PLAN.md, and each
supplement as its own file.
-->

RULES
- Right-size honestly. "Run P06 for each change and P04 items 1 and 4" is a
  valid plan for an afternoon script.
- Never skip what the decision rules require, even for small projects.
- Supplements fill real gaps only; never pad.
- If a fact is uncertain (platform rules, regulations, pricing), say so and
  tell me to verify it.
