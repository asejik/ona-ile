# P14: LAUNCH GATE

<!-- INTEGRATED-ONLY -->
Stage: Launch | Run: the last step before going live, and before each major
release or app store submission
Output: docs/audits/P14_[YYYY-MM-DD].md with a decision: GO / GO WITH
ACCEPTED RISKS / NO-GO

Follow docs/prompts/AUDIT_STANDARD.md for evidence and reporting.
<!-- /INTEGRATED-ONLY -->
<!-- STANDALONE-ONLY (ignore in the integrated suite)
A go/no-go checklist for launching any app. It works best with earlier
audit reports (privacy, production readiness, security), but can run on its
own: anything without evidence is checked directly or marked FAIL.
-->

<!-- STANDALONE-INCLUDE: AUDIT_STANDARD.md -->

---

ROLE
Act as a release manager. Don't audit from scratch: collect the evidence
from the other prompts' latest outputs, check the launch essentials that no
single audit owns, and give a clear decision. Be strict. Missing evidence
is a FAIL, not a pass.

STEP 0 - GATHER
<!-- INTEGRATED-ONLY -->
- docs/PROMPT_PLAN.md (P00): the prompts, supplements, and check-only items
  this project committed to.
- The Project Profile and rigor level; docs/audits/FINDINGS.md; the latest
  reports from P03 (AUDIT mode), P07 (PRE-LAUNCH), P08, P09, P10 (if AI),
  P11 (if public), P12 (STRICT), and any supplements; docs/SETUP.md (P04);
  docs/RUNBOOK.md and docs/ACCESS_REGISTER.md (P13 Part A).
<!-- /INTEGRATED-ONLY -->
<!-- STANDALONE-ONLY (ignore in the integrated suite)
- Any earlier audit reports, findings lists, setup notes, and runbooks in
  the repo. If there are none, check each gate below directly where you
  can, and list the rest as ACTIONS FOR ME.
-->
- A report is STALE if it predates a significant change (auth, data access,
  payments, personal data, a new AI feature) or is older than 30 days. A
  stale report needs a re-run before GO.

---

GATES
Present as a table: gate | source | evidence | PASS / FAIL / ACCEPTED / N/A

1. Audit results
   - Every prompt and supplement the prompt plan marks USE or LIGHT before
     launch has a current (not STALE) report, or was re-marked SKIP with a
     reason
   - No OPEN CRITICAL findings anywhere
   - No OPEN HIGH findings, except ACCEPTED RISK items with a reason, who
     accepted (the client, in writing, on client projects), and a review
     date
   - Production readiness (P07 PRE-LAUNCH): READY, or READY WITH FIXES with
     the fixes done
   - Security (P08): run since the last auth, data access, or payment
     change. STRICT: a human penetration test done, or explicitly declined
     by the owner in writing.
   - Privacy (P03 AUDIT): the privacy notice, cookie banner, and (mobile)
     pre-install privacy statement are live and match the data inventory;
     consent capture, export, and deletion work
   - AI features (P10, if any): no feature rated RETHINK left unaddressed;
     the eval set passes
   - SEO (P11, if public): no open HIGH findings
   - Cost (P12, STRICT): projection done, and no plan limit expected within
     3 months

2. Data protection paperwork (owner or client)
   - NDPC registration done, if the controller is of major importance
   - DPIA done, signed by an accredited DPO, and filed where mandatory
   - DPO designated, if of major importance
   - Client projects: the Data Processing Agreement is signed

3. Setup and operations (P04, P13)
   - CI is required on main and green; secret scanning and dependency
     updates are on
   - MFA on every account; spend caps and budget alerts set
   - Backups on, and a restore tested within the last 3 months
   - Monitoring and alerts live: send a test alert and confirm it reached
     my phone
   - Runbook and access register exist; the rollback steps are written, and
     the previous version can be redeployed

4. Launch essentials (check directly)
   - Every CHECK-ONLY item the prompt plan attaches to this gate
   - Custom domain and HTTPS, with http-to-https and www/non-www redirects
   - Email deliverability: SPF, DKIM, and DMARC records on the sending
     domain; every transactional email (sign-up, password reset, receipts)
     tested and landing in the inbox, not spam
   - Privacy policy and terms pages live and linked where data is collected
   - A support channel users can reach, and someone watching it
   - Test accounts, test data, and test payment keys removed from
     production; live keys configured
   - Every production environment variable set (compare with .env.example)
   - Kill switches tested
   - Payments (if any): ACTION FOR ME: one real low-value payment end to
     end on production, then refunded
   - Mobile: store listing, privacy labels and Data Safety form, screenshots,
     and review notes with a test account for the store reviewers

5. Client (client projects)
   - Client sign-off on the acceptance criteria (traceability table from
     P09)
   - Accounts owned by the client; credential handover planned; admin guide
     delivered; support agreement agreed

---

DECISION
- GO: every gate PASS or N/A
- GO WITH ACCEPTED RISKS: everything else is ACCEPTED, with each item
  listed for the owner to confirm in writing
- NO-GO: any FAIL. List the blockers, each with the prompt that fixes it.

LAUNCH DAY AND THE FIRST 48 HOURS
- Launch when I can watch it (not late on a Friday)
- Rollback triggers: which signals mean roll back now (error spike,
  payment failures, sign-up failures, a data exposure)
- Watch list: error tracker, uptime, payments, sign-ups, the support
  channel, and fast-growing costs (AI, SMS)
- After 48 hours: a short review; new issues go into the findings register

RULES
- Evidence or it fails. "It should be fine" is a FAIL.
- Don't fix things here: route each blocker to its owning prompt and re-run
  the gate afterwards.
