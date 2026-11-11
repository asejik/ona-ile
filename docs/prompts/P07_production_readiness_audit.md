# P07: PRODUCTION READINESS AUDIT

<!-- INTEGRATED-ONLY -->
Stage: Audit | Run: mid-project (MID mode) and before launch (PRE-LAUNCH
mode)
Output: docs/audits/P07_[YYYY-MM-DD].md

Follow docs/prompts/AUDIT_STANDARD.md for context loading, rigor level,
evidence, severity, reporting, and fixing.
<!-- /INTEGRATED-ONLY -->
<!-- STANDALONE-ONLY (ignore in the integrated suite)
Checks whether the app will work reliably, correctly, and maintainably with
real users and real data.
-->

<!-- STANDALONE-INCLUDE: AUDIT_STANDARD.md -->

---

ROLE
Act as a Principal Full-Stack Engineer and Production Quality Architect.
Assess whether this app will work reliably, correctly, and maintainably with
real users and real data.

MODE: [MID-PROJECT or PRE-LAUNCH]
- MID-PROJECT: prioritise what is expensive to change later: data model,
  migrations, business logic, payment correctness, reliability foundations.
  List cosmetic items briefly.
- PRE-LAUNCH: audit every section fully.

OWNS: database integrity and migrations, business logic, concurrency,
payment correctness, reliability design, backups and recovery, code health
and build, speed performance, platform readiness (PWA/native), and audit
trails of admin and financial actions.
NOT HERE: privacy and data protection law (P03), security (P08), UX,
accessibility and feature completeness (P09), SEO (P11), egress and usage
cost (P12), running operations and incident response (P13), the go-live
checklist (P14). Flag those in passing only.

Also compare the code with docs/PROJECT_PLAN.md (if it exists) and flag
drift from the plan.

TOOLS FIRST (run what applies and paste the output)
Type check, lint, tests, production build, an unused-code tool (e.g. knip),
an outdated-packages check (e.g. npm outdated), the database provider's
performance advisor (e.g. Supabase Performance Advisor), and Lighthouse or
PageSpeed Insights on key pages in mobile mode.

---

AUDIT SECTIONS

1. Data and Database
   - Schema vs code: queries, types, and API contracts match the actual
     schema (ask me for a schema export or generated types if you can't read
     it). Flag every mismatch.
   - Are schema changes tracked in migrations or version-controlled rules
     files? Is there a risk of dev/prod drift from dashboard edits?
   - Constraints: required fields, uniqueness, foreign keys, sensible
     defaults; validation enforced in the database, not only in the UI
   - Missing indexes on columns used in filters, joins, sorting, and foreign
     keys
   - What happens to child records when a parent is deleted (orphans,
     cascades)

2. Business Logic
   - Hardcoded IDs, emails, names, mock data, or fallback values that will
     break with real users or staff
   - Business rules (pricing, coupons, limits, feature flags, settings)
     hardcoded instead of stored where authorised admins can change them
   - Every status (e.g. pending, approved, failed, cancelled, refunded,
     expired) has defined transitions, a UI display, and a handler; flag
     impossible or unhandled states
   - Concurrency: many users acting at once on limited resources (last
     slots, stock, seats, balances). Check for race conditions and the use
     of transactions or atomic updates.
   - Dates and time: stored in UTC, displayed in local time; scheduled jobs
     and expiry logic behave correctly across time zones

3. Payments and Money (if applicable)
   - Idempotency: payment requests use idempotency keys; webhook handlers
     safely ignore duplicate events
   - Full webhook lifecycle: success, failure, refund, chargeback, dispute,
     and abandoned payments
   - Money stored as integers in the smallest unit (kobo, cents), never as
     floats; currency stored with every amount
   - Transaction records sufficient for reconciliation against gateway
     reports
   - (Payment SECURITY such as signature verification and price tampering
     belongs to P08)

4. Reliability and Recovery
   - Error tracking in production: will I know when something breaks, with
     enough detail to fix it?
   - Logs are useful but free of personal data and secrets
   - Dev and production separated (databases, keys, payment test/live modes)
   - Backups: what the current plan tier actually provides (some free tiers
     have none), whether it meets the recovery targets in the Project
     Profile, and whether a restore has ever been tested. STRICT: an
     off-platform copy as well (if the provider account is locked or
     deleted, its built-in backups go with it).
   - Free-tier traps: projects that pause when inactive, quotas that stop
     the app instead of billing
   - Timeouts, retries, and graceful degradation when third parties fail
     (payments, AI APIs, email, SMS)
   - Kill switches: risky features (payments, AI, sign-up) can be switched
     off quickly without a redeploy
   - Environment variables documented (e.g. .env.example) so the app can be
     redeployed by someone else
   - Deployment and rollback: how a bad release is undone, and how long it
     takes

5. Code Health and Build
   - RUN the type check, linter, tests, and production build. Paste the real
     output.
   - Outdated or deprecated packages and framework versions (known
     vulnerabilities belong to P08)
   - Unused code, exports, files, and dependencies (e.g. knip): list them
     for approval, and check for dynamic references before calling anything
     unused
   - console.log and debug output left in production code

6. Performance (speed)
   - Targets: Google's "good" Core Web Vitals on mobile: LCP (main content
     visible) at most 2.5 s, INP (response to taps) at most 200 ms, CLS
     (layout shift) at most 0.1. Measure key pages with PageSpeed Insights
     or Lighthouse in mobile mode and paste the scores.
   - Bundle size and largest dependencies; code splitting for routes and
     heavy components; a JavaScript size budget per route
   - Images: format, sizing, lazy loading; fonts: number of files and
     weights
   - Slow queries, repeated queries inside loops ("N+1"), and request
     waterfalls (requests waiting on each other unnecessarily)
   - Likely experience on a mid-range Android phone on a slow mobile
     connection
   - Spike test only where spikes are expected (ticket sales, exam results,
     salary-day promotions): simulate the expected peak

7. Platform Readiness (whichever applies)
   - PWA: manifest (icon sizes, separate any/maskable icons, scope,
     start_url), service worker registration, update behaviour (users not
     stuck on old versions), offline behaviour that matches the app's needs
   - Native mobile: store guidelines, permission explanations, crash
     reporting, minimum OS versions, update strategy (store releases vs
     over-the-air). Privacy labels and the pre-install privacy statement
     belong to P03.
   - Standard web app: N/A

8. Audit Trails
   - Admin actions (role changes, status overrides, financial edits,
     deletions) write to an append-only audit log that normal users and
     admins cannot edit or delete
   - The log records who, what, when, and the before/after values, without
     copying unnecessary personal data

---

VERDICT
READY / READY WITH FIXES / NOT READY, with the blockers listed.

<!-- STANDALONE-INCLUDE: _build/SAFE_CHANGE_RULES.md -->
