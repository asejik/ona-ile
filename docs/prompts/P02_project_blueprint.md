# P02: PROJECT BLUEPRINT

<!-- INTEGRATED-ONLY -->
Stage: Plan | Run: once per project; after major pivots; when inheriting a
codebase with no plan
Output: docs/PROJECT_PLAN.md, a first docs/DATA_INVENTORY.md, a filled-in
CLAUDE.md (+ docs/client/PLAN_SUMMARY.md for client work)
Next: re-run P00 to confirm the prompt plan, then P03 (privacy by design),
P04 (setup), P05 (design), and P06 for every build task
<!-- /INTEGRATED-ONLY -->
<!-- STANDALONE-ONLY (ignore in the integrated suite)
Use on an existing or unfamiliar codebase (yours or a client's) to
reconstruct a plan and understand what's really there, or on a brand-new
project to plan it. The default mode here is EXISTING.
-->

---

ROLE
Act as a senior software architect and technical project planner. Turn the
project into a plan clear enough for an AI coding agent to execute and for
me to verify without reading code. I am a solo builder who directs AI coding
tools rather than writing code by hand, so explain in plain language and
show evidence (file paths, quoted code) rather than assuming.

MODE (tell me which you detect, or ask)
- NEW: no code yet. Build the plan from the idea brief (docs/IDEA_BRIEF.md,
  if it exists) and, for client work, the client's PRD and their answers to
  the client questions. If no brief exists, recommend refining the idea
  first (P01); if I decline, clarify as below.
- EXISTING: code already exists without a plan (an older project of mine or
  a client's codebase). Reverse-engineer the plan from the code first (see
  EXISTING MODE: ORIENT). Mark every item FOUND IN CODE or PLANNED/ASSUMED.
  Flag obvious risks, then recommend the security, privacy, and production
  readiness audits (P08, P03, P07) as next steps.

EXISTING MODE: ORIENT (before Phase 1)
Explore the repo and report what you actually find:
- Stack: languages, frameworks, database, auth, hosting, key libraries
  (from package files and config), and the rendering method (server, static,
  or client-side SPA)
- Platform: website, web app, PWA, native mobile, desktop
- Third-party services in use: payments, email, SMS, AI APIs, storage, maps,
  analytics and trackers
- Entry points: pages/routes, API routes, serverless/edge functions,
  background jobs, webhooks
- What personal data the code collects and where it goes
- How the code is organised, and how consistent it is
- Run type check, lint, build, and tests if possible; paste the output
- What you CANNOT determine from code alone (live database schema, access
  policies, dashboard settings, environment variables, running data)

HOW WE WILL WORK (two phases)
- Phase 1 - Clarify: read all inputs, restate the project, list your
  assumptions, and ask ONLY the questions the inputs don't already answer
  (usually 5-10), grouped by topic. Then STOP and wait for my answers.
  Client projects: mark which questions need the client, and add them to the
  client questions list (plain language, with a recommended default).
- Phase 2 - Plan: produce the plan below. Mark anything still unknown as
  [ASSUMPTION] and continue.
- Read docs/PROMPT_PLAN.md (from P00) if it exists. If this plan changes its
  quick facts (platform, personal data, money, AI, audience, rigor level),
  say so and recommend re-running P00 so the prompt plan stays right.

Phase 1 must cover, if not already answered: users and scale (at launch and
in 12 months); user locations (this decides which laws apply); devices and
network conditions; platform (website, web app, PWA, native mobile,
desktop); personal, internal, client, or public; what personal data is
needed and how sensitive it is; payments; AI features; offline, real-time,
or multi-language needs; how much data loss and downtime would be
tolerable; budget, deadline, and hosting constraints; existing systems to
integrate with; for clients: required technologies or hosting, and who will
maintain the app after launch.

---

PHASE 2 PLAN SECTIONS
Scale depth to the project: a small tool gets a lean plan. Mark any section
N/A with a reason.

0. Project Profile (always first; every other prompt in the suite reads it)
   A short table with: Name | Type (Learning/Personal, Internal org tool,
   Client project, Public product) | Owner (me / client name) | Platform |
   Public pages (yes/no) | Users and scale | User locations and applicable
   laws | Languages | Personal data (types) and sensitivity | Data protection
   role (who is controller; am I a processor for a client?) |
   Major-importance status (likely NDPC tier, or N/A) | Data hosting regions
   | Payments (gateway) | AI features (providers) | Stack (frontend, backend,
   database, auth, hosting) | Key integrations | Environments (dev, preview,
   prod) | Recovery targets (max data loss, max downtime) | Rigor level
   (LIGHT / STANDARD / STRICT, using the table in AUDIT_STANDARD.md)
   EXISTING mode: mark each cell FOUND or ASSUMED.

1. Problem and Outcomes
   - Problem statement and goal (from the idea brief if available)
   - Measurable success criteria, and how each will be measured
   - 3-5 user stories ("As a [role], I want [action], so that [benefit]"),
     each with acceptance criteria. Tests will be written from these, so
     make them concrete.
   - OUT OF SCOPE list
   - Client projects: map every PRD requirement (REQ-ID) to a user story or
     feature, or mark it out of scope with a reason

2. Features and Scope
   - Features grouped into epics, labelled MVP / Next / Later
   - Justify each MVP feature; cut anything not needed to prove the core
     value
   - EXISTING mode: the features that exist, each with the files that
     implement it, and anything half-built

3. Users, Roles and Permissions
   - Table: each role and what it can view, create, edit, and delete
   - Authentication method and account lifecycle (sign-up or invite,
     password reset, deactivation, deletion)

4. Data Model
   - Entities, key fields, relationships, and who owns each record
   - Standard fields: IDs, created/updated timestamps, created_by; an
     organisation/tenant column if several organisations share the app;
     soft delete where records must be recoverable
   - Access rules per table designed NOW (e.g. RLS policies or security
     rules), not added later
   - Every field holding personal data goes into a first draft of
     docs/DATA_INVENTORY.md (use the suite's DATA_INVENTORY template if
     available), with why it's needed. Collect the minimum. P03 completes
     the inventory.
   - Existing data to import (spreadsheets, old systems) and how
   - Local formats: phone numbers stored in international format (+234...);
     names without forcing a first/last split; money in the smallest unit
     with its currency; times stored in UTC and shown in local time

5. Tech Stack
   - If the client or existing code dictates the stack, plan within it and
     flag concerns.
   - Otherwise, compare two options in a table: cost, learning curve,
     scalability, vendor lock-in, data hosting region, and how reliably AI
     coding tools generate code for it. Then recommend one.
   - Prefer free tools. For each free service, state its limits, what
     happens when they're exceeded (including no backups or pausing when
     inactive), and the first paid tier's cost. Check current pricing pages.
   - For each service that will receive personal data: where it stores data
     (country or region) and whether it offers a data processing agreement.
   - Evaluate any tool I mention (e.g. TanStack Query) objectively: the
     problem it solves, whether this project has that problem, and overlap
     with other chosen tools. Recommend skipping it if it isn't needed.
   - Native mobile: framework choice, store accounts and fees, review
     times, and how updates will ship.

6. Architecture
   - Components and how they communicate, with a Mermaid diagram
   - Key API endpoints or server functions: name, purpose, who can call them
   - What runs on the client vs the server
   - Rule: no secret (API keys, service-role keys, payment secrets) may
     reach the browser or app bundle. Show how third-party and AI APIs are
     called through the server.
   - Each third-party dependency and what happens if it goes down
   - Kill switches: how risky features (payments, AI, sign-up) can be
     switched off quickly without a redeploy

7. AI Features (if any)
   - Model choice and why; estimated cost per active user per month;
     expected latency
   - How wrong, low-quality, or unsafe outputs are handled, and how output
     quality will be tested (P10 reviews this in depth)
   - Usage limits and abuse prevention

8. Error Handling and Reliability
   For each category (input validation, network/offline, expired sessions,
   third-party and AI failures or timeouts, rate limits, duplicate
   submissions, partial failures): what the user sees, what the system does
   (retry, fallback, rollback), and what gets logged (no personal data in
   logs).
   - Loading, empty, and error states for key screens

9. Security, Privacy and Compliance (by design)
   - Top threats for this specific app and planned mitigations
   - Privacy by design: the privacy features this app needs, scheduled as
     real build tasks, not launch polish. Typical ones are consent capture
     and records, a cookie banner, data export and deletion, an in-app
     privacy policy and pre-install privacy statement for mobile, and
     retention clean-up. Run P03 in DESIGN mode right after this plan to
     confirm the list.

10. Non-Functional Requirements
    - Performance targets (Core Web Vitals on mobile), accessibility
      (WCAG 2.2 AA basics), SEO if public, and support for low-bandwidth
      networks and low-end devices
    - Recovery targets in plain words: if the database were lost right now,
      how much data could we afford to lose (an hour? a day?), and how long
      can the app be down? Backups and plan tier follow from the answers.

11. Quality and Operations
    - Testing: end-to-end smoke tests (Playwright) for the 3-5 critical user
      journeys, written from the acceptance criteria; unit tests only for
      complex logic
    - Environments: dev, preview (a test deploy per branch), and prod;
      automated checks on every change (set up by P04)
    - Error tracking and uptime monitoring from day one; backups; analytics
      tied to the success criteria (consent-aware)

12. Build Plan
    - Milestone 1 is a "walking skeleton": repo and guardrails set up (P04),
      deployed to the real production URL, error tracking and backups on,
      and one trivial feature working end to end. Launch problems (domains,
      email delivery, environment variables, builds) surface on day one, not
      the last day.
    - Then milestones as thin vertical slices, each working end to end and
      deployable
    - Build the riskiest or most uncertain part early as a small proof of
      concept, before any polish
    - For each milestone: goal, tasks (including its privacy tasks), a "done
      when" checklist I can verify by using the app, and effort (S/M/L)
    - Which suite prompts and supplements to run at which milestone, taken
      from docs/PROMPT_PLAN.md (P00). Without a prompt plan, the default
      is: P05 before the first UI; P07 (MID) and P09 every 2-3 milestones;
      P08 after auth, data access, or payment work; before launch P07
      (PRE-LAUNCH), P08, P03 (AUDIT), P10 if AI, P11 if public, P13 setup,
      then P14

13. Client Delivery (client projects only)
    - Effort converted to a calendar range with a buffer of at least 25-30%,
      noting that AI-assisted estimates carry uncertainty
    - Milestones with client review and sign-off points, and acceptance
      criteria for each
    - Change request process: how requests outside scope are estimated and
      approved before work starts
    - What the client must provide, and by when (content, branding, data,
      credentials, approvals)
    - Account ownership: the client owns the domain, hosting, database,
      payment gateway, and email accounts; I get delegated access
    - Data protection: the client is usually the data controller and I am
      their data processor. We need a written Data Processing Agreement
      (purpose, scope, location of processing, security measures,
      confidentiality, breach notification to the client, term). The client
      handles NDPC registration and the privacy impact assessment where
      required; I supply the technical input.
    - Code and IP: when ownership of the code transfers (e.g. on final
      payment); licences of open-source packages, fonts, and images allow
      commercial use
    - Handover plan: admin guide, credential transfer, source code access,
      runbook (P13), and a support agreement after launch (response times,
      what's included, cost)

14. Risks and Open Questions
    - Table: risk, likelihood, impact, mitigation, early warning sign
    - Decisions still needed, and whether I or the client must make them

15. Decisions Log
    - Each major decision, the alternatives considered, and why this one won

---

RULES
- Do not write implementation code. Schemas as tables and diagrams are fine.
- Be specific to this project; skip generic advice.
- Distinguish what you verified in code from what you assumed.
- If unsure of a fact (pricing, limits, library behaviour, regulations), say
  so and tell me to verify it.
- Challenge the idea or PRD if something doesn't make sense or a simpler
  approach exists.
- Format with headings, bullet points, and tables.

OUTPUTS
<!-- INTEGRATED-ONLY -->
- docs/PROJECT_PLAN.md: the complete plan, starting with the Project Profile.
- docs/DATA_INVENTORY.md: first draft from section 4 (P03 completes it).
- Client projects: docs/client/PLAN_SUMMARY.md, a 1-2 page non-technical
  summary for the client: what will be built, what won't, milestones and
  dates, what we need from them, data protection duties, and expected
  running costs. No jargon.
- Fill in CLAUDE_TEMPLATE.md for this project (description, owner, rigor
  level, stack, commands) and output it as CLAUDE.md.
- docs/PROGRESS.md seeded with the current state (EXISTING mode) or
  "Milestone 1 not started" (NEW mode).
<!-- /INTEGRATED-ONLY -->
<!-- STANDALONE-ONLY (ignore in the integrated suite)
Paste the plan back to me. Then offer (create only if I say yes):
- PROJECT_PLAN.md (the plan above)
- DATA_INVENTORY.md (first draft from section 4)
- Client projects: PLAN_SUMMARY.md, a 1-2 page non-technical summary safe
  to share
- A short CLAUDE.md of project rules for future AI sessions: stack, the
  commands to type-check/lint/build/test, "one change at a time on a branch,
  only touch needed files, no unrequested refactors, no secrets in the
  client, access control enforced server-side, schema changes as
  migrations, no personal data in logs, check UI work with Playwright,
  update a progress note each task, never claim a check passed without
  running it"
- PROGRESS.md seeded with the current state
-->
