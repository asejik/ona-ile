<!-- INTEGRATED-ONLY -->
# AUDIT STANDARD

Shared rules for every audit prompt: P03 (AUDIT mode), P07, P08, P09, P10,
P11, P12, the checks in P13 and P14, and every supplement. Each says
"Follow docs/prompts/AUDIT_STANDARD.md". Keep the whole suite in
docs/prompts/ of every repo.

(Blocks marked STANDALONE-ONLY or STANDALONE-INCLUDE are used only when the
standalone versions are built. Ignore them here.)
<!-- /INTEGRATED-ONLY -->
<!-- STANDALONE-ONLY (ignore in the integrated suite)
GROUND RULES (built in, so this prompt needs no other files)
-->

---

## 1. Before auditing

- Read whatever project docs exist: README, docs/PROMPT_PLAN.md,
  docs/PROJECT_PLAN.md (especially the Project Profile), docs/IDEA_BRIEF.md,
  docs/DATA_INVENTORY.md, docs/DESIGN.md, docs/PROGRESS.md,
  docs/audits/FINDINGS.md, and the most recent report of this audit in
  docs/audits/. If none exist, work from the code and ask me only what you
  cannot determine.
- If there is no Project Profile, build one from the code (stack, platform,
  backend, services, public/private pages, payments, AI features, personal
  data collected) and ask me to confirm: project type, owner (me or a
  client), user locations, and data sensitivity.
- Set the RIGOR LEVEL (section 2) and tell me which one you are using and
  why.
- Inventory the codebase: main features and the files that implement them.
- Mark each audit section APPLIES or N/A, with a one-line reason. Never
  invent findings for sections that don't apply.
- Stack examples in the prompts (Supabase, Vite, Paystack, TanStack Query)
  are examples only. Detect the actual stack and apply the equivalent checks
  (e.g. Firebase Security Rules instead of RLS, Express middleware instead
  of edge functions, Expo instead of a PWA).
- Check current documentation for anything version-specific: library APIs,
  provider limits and pricing, platform rules, and regulations. Your
  training data may be out of date. Use web search or a docs tool if you
  have one; otherwise mark the claim UNVERIFIED.
- Ask me for what you cannot see: database schema, access policies,
  dashboard settings, usage numbers, screenshots.
- State what you can and cannot review fully. If the codebase is too large
  for one careful pass, propose splitting the audit into sessions by section.
- If I specify SCOPE: [sections], audit only those. If docs/PROMPT_PLAN.md
  marks this prompt LIGHT with a SCOPE, use that scope unless I say
  otherwise, and list the sections you skipped.
- Browser: you may use Playwright (or another browser tool) to open local
  and preview URLs, and public production pages read-only. Never sign in
  with real user accounts, submit real forms or payments, or change
  production data. Use test accounts only.

## 2. Rigor levels

Take the HIGHEST column that any row reaches:

| Question | LIGHT | STANDARD | STRICT |
|----------|-------|----------|--------|
| Personal data | None, or only mine | Ordinary (names, emails, phone numbers) | Sensitive: health or mental health, financial, BVN/NIN or other ID numbers, children, precise location, biometrics |
| Money | None | Payments through a hosted gateway | Wallets, balances, credits, payouts, lending |
| Legal status | None | Data controller of major importance, Ordinary-High tier | Extra-High or Ultra-High tier, or a licensed/regulated sector |
| Who can use it | Only me | A known organisation, or the public | — |

- LIGHT: report CRITICAL and HIGH findings in full; summarise the rest as a
  short list.
- STANDARD: full audit.
- STRICT: full audit. Assume hostile users. Treat SUSPECTED high-impact
  issues as HIGH until disproven. Say where a human expert should also
  review (penetration tester, licensed data protection organisation,
  lawyer).

## 3. Evidence

- Never claim something is fine unless you actually checked it.
- Tools first, then judgment: run the automated checks the prompt lists
  (scanners, advisors, linters, Lighthouse, axe), paste their real output,
  then spend your effort on what tools cannot see. If you cannot run a
  command, say so and give me the exact command to run.
- Try to disprove each finding before reporting it. Report only what
  survives, and list the suspected issues you ruled out under CHECKED AND
  PASSED.
- Every finding includes:
  - ID (e.g. P08-03), severity, and section
  - Location: file path and line numbers with the code quoted, or the
    setting, policy, or URL
  - What's wrong, and the impact in plain language
  - The minimal COMPLETE fix, and every other place the same pattern appears
  - How I can verify it myself without reading code
  - Confidence: VERIFIED (checked directly) or SUSPECTED (needs confirmation)
- Tag capabilities that don't exist yet as [MISSING].
- No generic best-practice padding. Every item must be about this codebase.

## 4. Severity

- CRITICAL: easy to exploit or certain to happen; causes a data leak, data
  loss, money loss, account takeover, outage, or a personal data breach
  that must be reported to the regulator. Fix immediately. CRITICAL
  findings cannot be accepted as a risk: fix them or switch the feature off.
- HIGH: serious harm under realistic conditions. This includes handling
  personal data in a way that breaks data protection law: no lawful basis,
  missing consent where it is required, no way to honour deletion, no
  breach procedure. Fix before launch or the next release.
- MEDIUM: bugs, poor experience, or costs that grow with users. Fix soon.
- LOW: polish and hardening. Fix when convenient.

## 5. Report

Structure every report as:

1. Context: rigor level, sections audited, sections N/A (with reasons)
2. Top 5 fixes (biggest impact for the effort)
3. Findings table sorted by severity
4. Findings in detail
5. CHECKED AND PASSED, with evidence (including ruled-out suspicions)
6. NOT VERIFIED, with reasons
7. ACTIONS FOR ME: settings to change, dashboards to check, questions for
   the client
8. Comparison with the previous report of the same audit, if one exists:
   fixed, new, regressed
9. CLIENT SUMMARY (client projects or someone else's app): a half-page,
   non-technical summary of the app's status, main risks, and what is being
   done, safe to share. No jargon, no blame, no secrets, no file paths.

<!-- INTEGRATED-ONLY -->
Save as docs/audits/[PROMPT-ID]_[YYYY-MM-DD].md (e.g.
docs/audits/P08_2026-11-07.md).
<!-- /INTEGRATED-ONLY -->
<!-- STANDALONE-ONLY (ignore in the integrated suite)
Paste the report back to me and offer to save it as a dated markdown file.
-->

## 6. Findings register and accepted risk

<!-- INTEGRATED-ONLY -->
- Every audit updates docs/audits/FINDINGS.md (create it from
  docs/prompts/templates/FINDINGS_TEMPLATE.md if missing): add new findings,
  mark fixed ones FIXED, and never delete rows.
<!-- /INTEGRATED-ONLY -->
<!-- STANDALONE-ONLY (ignore in the integrated suite)
- Offer to create a findings register (FINDINGS.md): one row per finding
  with ID, title, severity, status, dates, and notes.
-->
- Statuses: OPEN, FIXED, ACCEPTED RISK, WON'T FIX.
- If the same issue reappears in a later run, reuse its original ID and mark
  it REGRESSED.
- ACCEPTED RISK needs a reason, who accepted it (for clients, in writing),
  and a date to review it. CRITICAL findings cannot be accepted.

## 7. Fixing

- Do not change any code, settings, or data until I approve specific
  finding IDs.
<!-- INTEGRATED-ONLY -->
- Fix approved items through P06 (Safe Change Protocol), highest severity
  first, one at a time.
<!-- /INTEGRATED-ONLY -->
<!-- STANDALONE-ONLY (ignore in the integrated suite)
- Fix approved items using the SAFE-CHANGE RULES at the end of this prompt
  (where this prompt makes fixes), highest severity first, one at a time.
-->
- After fixes, re-run the relevant checks and update the report and the
  findings register with the results.
