# Vibe Coding Prompt Suite (v3)

A set of prompts to THINK, PLAN, BUILD, AUDIT, LAUNCH, and RUN apps with AI
coding tools. Works for my own projects and client projects, on any stack
and any size, from an afternoon script to a regulated platform.

**Every project starts with P00 (Project Triage).** It decides which of the
other prompts this project needs, how deeply to run each one, and when. It
also drafts extra prompts for anything the suite doesn't cover yet. The
result is docs/PROMPT_PLAN.md, so you never have to guess.

Prompts are numbered in the order a project first uses them. After launch
you keep coming back to P06 (every change), P13 (operations), P08
(quarterly security), P12 (when bills climb), and P03 (yearly privacy).

---

## 1. The suite

| ID  | Prompt                                | Stage      | When to run |
|-----|---------------------------------------|------------|-------------|
| P00 | Project Triage                        | Start      | First, for EVERY project; again after P02 and whenever a re-triage trigger is hit |
| P01 | Idea Refinement                       | Think      | Once per idea, client brief, or client PRD (P00 says whether you need it) |
| P02 | Project Blueprint                     | Plan       | Once per project; after major pivots; when inheriting a codebase with no plan |
| P03 | Privacy & Data Protection             | Plan + Audit | DESIGN mode right after P02; AUDIT mode before launch, after personal-data changes, and yearly |
| P04 | Project Setup & Guardrails            | Setup      | Once per repo, in milestone 1 (or when adopting the suite on an existing repo) |
| P05 | UI Design Direction                   | Build      | At project start and for major new screens. P05-A once per app whose design I love |
| P06 | Safe Change Protocol                  | Build      | EVERY task. Its permanent rules live in CLAUDE.md |
| P07 | Production Readiness Audit            | Audit      | Mid-project (MID mode) and before launch (PRE-LAUNCH mode) |
| P08 | Security Audit                        | Audit      | Before launch; after changes to auth, data access, payments, uploads, or AI features; every 3 months for live apps |
| P09 | Architecture & Product Quality Review | Audit      | Every 2-3 milestones; before client acceptance |
| P10 | AI Feature Review                     | Specialist | Apps with AI features: before launch, after model or prompt changes |
| P11 | SEO & Discoverability Audit           | Specialist | Public websites/pages only; before launch and after URL or content structure changes |
| P12 | Egress & Efficiency Audit             | Specialist | When usage or bills climb; before scaling; STRICT projects before launch |
| P13 | Live Operations & Incident Response   | Operate    | Part A before launch; Part B on the maintenance calendar; Part C when something breaks |
| P14 | Launch Gate                           | Launch     | The last step before going live, and before each major release or store submission |

Supporting files:
- AUDIT_STANDARD.md: shared rules for every audit (context loading, rigor
  levels, evidence, severity, report format, findings register, fixing).
- CLAUDE_TEMPLATE.md: permanent project rules (P06-A). Copy into each repo
  root as CLAUDE.md (or AGENTS.md, or your tool's rules file).
- templates/DATA_INVENTORY_TEMPLATE.md: the map of every piece of personal
  data the app holds (started by P02, completed by P03, kept current by P06).
- templates/FINDINGS_TEMPLATE.md: one register of findings across all audits,
  including accepted risks.
- supplements/: reusable extra prompts for platforms and domains the main
  suite doesn't cover (e.g. desktop apps). P00 adopts them into a project
  when they fit, and drafts new ones when nothing fits.
- standalone/: self-contained versions of every prompt for one-off use on
  any codebase (generated; see section 9).

---

## 2. Where to start

Always: **P00 first.** Its plan gives the exact run order for this project.
Typical results:

| Situation                                              | Typical path after P00 |
|--------------------------------------------------------|------------------------|
| Personal script or desktop utility (e.g. a large-file scanner) | Lean P02 -> P04 (version control, secrets) -> P06 for every change -> light P07/P08 (+ the desktop supplement if it deletes files or will be shared) |
| Simple data-collection platform (registration, forms, bookings) | P02 -> P03 (DESIGN) -> P04 -> P05 -> P06 -> P08 + P03 (AUDIT) -> P13 Part A -> P14 |
| My own raw idea for a product                          | P01 (Mode A) -> P02 -> re-run P00 -> P03 (DESIGN) -> P04 -> P05 -> P06 for every task |
| Client explained the idea (call, voice note, chat)     | P01 (Mode B) -> send CLIENT_QUESTIONS.md -> P02 -> re-run P00 -> P03 (DESIGN) -> send PLAN_SUMMARY.md for sign-off -> P04 -> P05 -> P06 |
| Client sent a PRD or spec                              | P01 (Mode C) -> send CLIENT_QUESTIONS.md -> P02 -> re-run P00 -> P03 (DESIGN) -> send PLAN_SUMMARY.md for sign-off -> P04 -> P05 -> P06 |
| Existing codebase with no plan (mine or a client's)    | P02 (Mode EXISTING) -> re-run P00 -> P04 -> P08 -> P03 (AUDIT) -> P07 |
| A live app that collects personal data and was never privacy-checked | P03 (AUDIT) first: some Nigerian GAID deadlines for existing apps have passed |

Any time:

| Situation | Prompt |
|-----------|--------|
| Adding a feature, fixing a bug, changing the database | P06 |
| Bills or usage climbing | P12 |
| About to launch | Whatever PROMPT_PLAN.md lists before launch, then P13 Part A, then P14 |
| Something is broken, a key leaked, or data may be exposed | P13 Part C, immediately |
| The project changed shape (logins, personal data, payments, AI, going public, sharing a personal tool) | Re-run P00 |

---

## 3. Area ownership (every area has ONE owner)

Other prompts may flag an issue in passing, but only the owner audits it in
depth. This prevents duplicated, shallow checks.

| Area | Owner |
|------|-------|
| Which prompts a project needs, at what depth and when; gaps and project supplements; re-triage triggers | P00 |
| Problem validation, market check, reach, viability, PRD gaps, client questions, licensing and legal flags | P01 |
| Scope, requirements mapping, stack, architecture, initial data model, build plan, estimates, client milestones and contract terms, confirmed rigor level | P02 |
| Lawful handling of personal data: data inventory, minimisation and retention, lawful basis and consent, notices, cookies and trackers, user rights, processors and cross-border transfers, children and sensitive data, legal side of breach notification, NDPC paperwork | P03 |
| Repo setup and automated guardrails: branch protection, CI, secret scanning, dependency updates, AI tool permissions, environments, monitoring baseline, MFA, spend caps | P04 |
| Visual design system and UI build rules | P05 (P09 audits the result) |
| How every change is planned, made, verified, reviewed, and reported; bug-fix discipline; tests per change | P06 (all audit fixes go through P06) |
| Database integrity and migrations, business logic, concurrency, payment correctness, reliability design, backups and recovery, code health and build, speed performance, PWA/native readiness, audit trails | P07 |
| ALL security: builder accounts and AI dev tools, access control and tenant isolation, secrets, auth and sessions, input handling, payment tampering, AI abuse and prompt injection, uploads, rate limiting and SMS fraud, headers/CORS, supply chain, security logging, native mobile | P08 |
| Architecture and maintainability, UX audit, accessibility audit, microcopy, feature completeness vs plan/PRD, edge cases, testing strategy, overall grade | P09 |
| AI output quality, evaluations, AI failure handling and UX, safety in high-stakes domains, human oversight, model and prompt lifecycle | P10 (AI cost P12, AI security P08, AI privacy P03) |
| Indexing, sitemap, robots, canonicals, structured data, link previews, search consoles | P11 (page speed stays with P07) |
| Egress/bandwidth, request volume, caching, payload size, media delivery, realtime traffic, usage-based API and AI token costs, cost projections | P12 (spend caps are set up in P04) |
| Production monitoring and alerts, runbook, incident and breach response, maintenance calendar, restore drills, access register, operational handover | P13 |
| The go/no-go decision and launch essentials (domain, email DNS, legal pages live, test data removed, client sign-off) | P14 |
| Platform- or domain-specific areas the suite doesn't cover | A supplement (supplements/ or docs/prompts/project/), which points to the owners above for everything else |

---

## 4. Scaling by project (rigor levels)

P00 proposes a rigor level and P02 confirms it in the Project Profile, using
the table in AUDIT_STANDARD.md: take the highest level that any of personal
data, money, legal status, or audience reaches. In short:

- LIGHT: no personal data beyond mine, no money, only me
- STANDARD: ordinary personal data, hosted-gateway payments, a known
  organisation or the public, or an Ordinary-High NDPC tier
- STRICT: sensitive data (health, mental health, financial, ID numbers,
  children, location, biometrics), wallets/balances/lending, Extra-High or
  Ultra-High NDPC tier, or a regulated sector

P00's plan is the source of truth for each project. This table is the
general default it starts from:

| Prompt | LIGHT | STANDARD | STRICT |
|--------|-------|----------|--------|
| P00 | Always | Always | Always |
| P01 | Usually skip | Yes | Full validation |
| P02 | Lean plan | Yes | Yes |
| P03 | Inventory + notice check, if any personal data | DESIGN + AUDIT | DESIGN + AUDIT + DPCO/DPO review |
| P04 | Items marked * | All | All |
| P05 | Optional | Yes | Yes |
| P06 | Always | Always | Always |
| P07 | PRE-LAUNCH, CRITICAL/HIGH only | MID + PRE-LAUNCH | MID + PRE-LAUNCH |
| P08 | Accounts, secrets, supply chain + five-minute test | Before launch | Before launch + after every sensitive change + quarterly; consider a human pen test |
| P09 | Optional | Every few milestones | Every few milestones |
| P10 | If AI features | If AI features | If AI features |
| P11 | If public | If public | If public |
| P12 | If costs rise | If costs rise | Before launch + if costs rise |
| P13 | Monitoring + backups, if others depend on it | Full | Full |
| P14 | Short gate, if released to others | Full | Full |

---

## 5. Project document layout

```
CLAUDE.md                  <- from CLAUDE_TEMPLATE.md (always loaded by the AI)
.claude/settings.json      <- AI tool permissions (P04), or your tool's equivalent
docs/
  prompts/                 <- copy of this suite: P00-P14, AUDIT_STANDARD.md,
                              CLAUDE_TEMPLATE.md, templates/, supplements/
    project/               <- supplements adopted or drafted for THIS project (P00)
  PROMPT_PLAN.md           <- P00 (which prompts, what depth, what order)
  IDEA_BRIEF.md            <- P01
  CLIENT_QUESTIONS.md      <- P01 / P02 / P03 (client projects)
  PROJECT_PLAN.md          <- P02 (starts with the Project Profile)
  DATA_INVENTORY.md        <- P02 starts, P03 completes, P06 keeps current
  SETUP.md                 <- P04
  DESIGN.md                <- P05
  PROGRESS.md              <- P06 (updated after every task)
  RUNBOOK.md               <- P13
  ACCESS_REGISTER.md       <- P13
  privacy/                 <- P03 drafts: PRIVACY_NOTICE_DRAFT, DPIA_INPUT,
                              COMPLIANCE_CHECKLIST
  ai/EVALS.md              <- P10 (apps with AI features)
  audits/                  <- dated reports (P08_2026-11-07.md ...) and FINDINGS.md
  incidents/               <- P13 incident reviews
  client/                  <- original PRD (never edited), PLAN_SUMMARY.md, sign-offs
```

Small projects create only the files their PROMPT_PLAN.md calls for. Don't
copy _build/, _archive/, or _review/ into projects; they're for maintaining
the suite itself.

Keep a personal design library outside any single repo (e.g.
design-library/counselling-app-DESIGN.md) with DESIGN.md files extracted by
P05-A, plus screenshots.

---

## 6. How to run a prompt

1. Start a FRESH AI session for each prompt or task. Long sessions are where
   the AI forgets rules, and the session that wrote the code is the worst
   judge of it.
2. Keep the suite in docs/prompts/ inside the repo, then simply say:
   "Follow docs/prompts/P07_production_readiness_audit.md in PRE-LAUNCH
   mode." PROMPT_PLAN.md gives you these lines ready to paste.
3. Fill in any [BRACKETS] (mode, scope, task).
4. For large codebases, or where the plan says LIGHT, run audits in parts:
   "Run P07, SCOPE: sections 2 and 3 only."
5. Work on a branch and commit before any prompt that may change code. Once
   P04 is set up, main only changes through pull requests whose checks pass.
6. The AI may use Playwright to check its own work on local and preview
   URLs (and public production pages, read-only). It never signs in with
   real accounts or submits real forms or payments.
7. Keep the dated reports and the findings register. Comparing runs shows
   whether the app is getting healthier or quietly accumulating problems.

---

## 7. Live app calendar (details in P13)

| Weekly | Monthly | Quarterly | Yearly |
|--------|---------|-----------|--------|
| Glance at errors, uptime, failed payments | Merge dependency updates (P06); cost check; backups ran; access review | Restore drill; rotate keys; P08 security audit; runbook check | P03 AUDIT; NDPC compliance audit, Compliance Audit Returns by 31 March (UHL/EHL) or registration renewal (OHL); training; DPIA and privacy notice review; re-triage check (P00); domain and plan renewals |

---

## 8. When AI isn't enough

Pay a human for:
- Data protection sign-off: an NDPC-accredited DPO signs DPIAs, and a
  licensed DPCO files audit returns for Extra-High and Ultra-High
  organisations. The AI prepares the inputs (P03); it cannot sign.
- Contracts: a lawyer to draft your standard client terms, a Data Processing
  Agreement template, and to review privacy policies. One-off, reusable.
- Security: a penetration test before launching a STRICT app that handles
  money or health data.
- Usability: 3-5 real users trying the core journey while you watch (P09
  writes the script).

---

## 9. Maintaining this suite

- Edit only the integrated files: P00-P14, AUDIT_STANDARD.md, and
  _build/SAFE_CHANGE_RULES.md. Then rebuild the standalone versions:

  ```bash
  node _build/build-standalone.mjs
  ```

- Never edit files in standalone/: the build overwrites them.
- Markers in the integrated files control the standalone build:
  INTEGRATED-ONLY blocks are dropped, STANDALONE-ONLY blocks are kept, and
  STANDALONE-INCLUDE lines pull in AUDIT_STANDARD.md or the safe-change
  rules. The AI ignores them when using the integrated suite.
- If you change the rules in CLAUDE_TEMPLATE.md or P06, make the same change
  in _build/SAFE_CHANGE_RULES.md (the condensed version used by the
  standalone prompts).
- If you add, rename, or re-scope a prompt, update three places: the
  CATALOGUE and ARCHETYPES tables in P00, and sections 1-4 of this README.
- Supplements: when P00 drafts a project supplement you'll need again (e.g.
  your second Windows app), copy it into supplements/ with the
  project-specific details removed. See supplements/README.md. If a
  supplement keeps being used on most projects, promote it to a numbered
  prompt.
- Keep prompt IDs in order of use. If you add a prompt in the middle, record
  the renumbering in the changelog so old reports stay readable.

---

## 10. Changelog

v3 (November 2026)
- Added P00 Project Triage: the first step for every project. It picks which
  prompts apply (USE / LIGHT / LATER / SKIP), with exact SCOPE lines and a
  run order, and drafts supplement prompts for gaps. Added supplements/ with
  a first supplement for desktop apps.
- Renumbered every prompt in order of use. Old reports and project
  references map like this:

  | v2.1 | v3 |
  |------|----|
  | (new) | P00 Project Triage |
  | P00 Idea Refinement | P01 |
  | P01 Project Blueprint | P02 |
  | (new) | P03 Privacy & Data Protection |
  | (new) | P04 Project Setup & Guardrails |
  | P06 UI Design Direction | P05 |
  | P07 Safe Change Protocol | P06 |
  | P03 Production Readiness Audit | P07 |
  | P04 Security Audit | P08 |
  | P05 Architecture & Product Quality Review | P09 |
  | (new) | P10 AI Feature Review |
  | P08 SEO & Discoverability Audit | P11 |
  | P02 Egress & Efficiency Audit | P12 |
  | (new) | P13 Live Operations & Incident Response |
  | (new) | P14 Launch Gate |

  For an existing project: replace docs/prompts/ with v3, update CLAUDE.md
  from the new template, run P00 to create PROMPT_PLAN.md, and keep old
  reports as they are (the table above tells you which audit they came
  from).
- Added P03 with Nigeria's NDPA 2023 and GAID 2025 built in (registration
  tiers, DPIA triggers, the app pre-install statement, cookie banner rules,
  72-hour breach notification, processor agreements, cross-border transfers)
  and a GDPR note.
- Added P04 so CI, branch protection, secret scanning, dependency updates,
  AI tool permissions, MFA, and spend caps enforce the rules mechanically.
- Added P10 (AI quality, evals, safety), P13 (operations, incidents,
  breaches, maintenance calendar), and P14 (go/no-go).
- Moved compliance out of production readiness (now P03), and launch
  essentials into P14.
- AUDIT_STANDARD: rigor decided by risk (data, money, legal status,
  audience); legal exposure in severity; tools first; disprove findings
  before reporting; check current docs; findings register with accepted
  risk; follows the scope set in PROMPT_PLAN.md.
- CLAUDE_TEMPLATE: Playwright for checking work (with production limits);
  branch per task; "ask first" list; secrets and AI tool rules; privacy
  rules; fail closed.
- P06: fast lane for trivial changes, privacy, re-triage and size checks,
  independent review for risky changes, tests from acceptance criteria, CI
  and preview before merge.
- P08: builder accounts and AI dev tools, 2025 supply-chain defences, SMS
  pumping, excessive data exposure, fail closed, security logging, native
  mobile, OWASP Top 10:2025 and LLM Top 10 mapping.
- Standalone versions are now generated from the integrated files by
  _build/build-standalone.mjs (all 15 prompts), so they can't drift.
- Fixed (v2.1 issues): the wrong production-readiness filename in the run
  instructions; the AUDIT_STANDARD path; the browser rule that contradicted
  the screenshot steps.

v2 (September 2026)
- Added Idea Refinement with three entry modes: my idea, client idea, client
  PRD.
- Added the Project Profile so every prompt adapts to project type,
  platform, stack, and rigor level.
- Added client-project support throughout: requirements IDs, client
  questions, plan summaries, sign-offs, traceability, account ownership,
  handover, and client summaries in audit reports.
- Assigned every area a single owner; removed overlaps between audits.
- Extracted shared audit rules into AUDIT_STANDARD.md.
- Made all prompts stack-aware (Supabase examples, with equivalents for
  Firebase, custom backends, and native mobile).
- Split the design prompt into A (extract a design system) and B (apply a
  direction), and the safe-change prompt into A (permanent rules in
  CLAUDE.md) and B (per-task protocol), with bug-fix discipline.
