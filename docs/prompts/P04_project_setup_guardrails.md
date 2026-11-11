# P04: PROJECT SETUP & GUARDRAILS

<!-- INTEGRATED-ONLY -->
Stage: Setup | Run: once per repo, in milestone 1 of a new project or when
adopting the suite on an existing repo; re-check yearly
Output: a configured repo + docs/SETUP.md (what is set up, where, and what is
left for me)
Next: P05 (design), then P06 for every task
<!-- /INTEGRATED-ONLY -->
<!-- STANDALONE-ONLY (ignore in the integrated suite)
Sets up any repo, new or existing, so that the important rules are enforced
automatically: checks on every change, protected main branch, secret
scanning, dependency updates, AI tool permissions, monitoring, and account
protection.
-->

---

ROLE
Act as a senior DevOps engineer setting up a solo builder's repository so
that the important rules are enforced by machines, not by memory. A rule in
a prompt is a request; a required check or a permission setting is a fact.
Right-size everything to the rigor level and prefer free tiers.

HOW WE WILL WORK
- Detect the stack, git host (GitHub assumed; give the GitLab or Bitbucket
  equivalent if different), hosting, database, and package manager.
- For each checklist item, report the CURRENT STATE first (DONE, PARTIAL, or
  MISSING, with evidence), then propose what to add. STOP for my approval
  before changing anything.
- Items that need dashboards I control go under ACTIONS FOR ME, with
  click-by-click steps and how I confirm each one worked.
<!-- INTEGRATED-ONLY -->
- Make approved changes through P06 on a branch (a brand-new empty repo may
  get its first commit directly).
<!-- /INTEGRATED-ONLY -->
<!-- STANDALONE-ONLY (ignore in the integrated suite)
- Make approved changes using the safe-change rules at the end of this
  prompt, on a branch (a brand-new empty repo may get its first commit
  directly).
-->
- Configuration syntax changes often. Check current official docs for every
  config file you write, and say which docs you used.
- LIGHT rigor: items marked * only. STANDARD and STRICT: everything.

---

CHECKLIST

1. Version control *
   - A git repo whose .gitignore covers .env files, build output, and OS
     files
   - A private remote repo. Client projects: in the client's organisation,
     or a transfer planned at handover.

2. Protected main branch
   - Changes reach main only through pull requests; the automated checks
     (item 3) must pass; no force-pushes; no deletion. Solo builders don't
     need required reviewers, but the checks must be required.
   - ACTIONS FOR ME: the exact settings path (e.g. GitHub > Settings > Rules
     > Rulesets) and what to tick.

3. Automated checks (CI) *
   - On every push and pull request: install from the lockfile (e.g. npm ci
     or pnpm install --frozen-lockfile), type check, lint, unit tests, and
     production build.
   - STANDARD and STRICT: end-to-end smoke tests with Playwright for the
     critical journeys. Start with one: the app loads, a test account signs
     in, and the main journey completes. Run it against a local build or
     the preview deploy.
   - Dependency audit (e.g. npm audit --audit-level=high): fail on critical,
     report the rest.
   - Keep it under about 10 minutes so it never gets skipped.
   - This is what makes "never claim a check passed" true without trusting
     anyone, including the AI.

4. Secret protection *
   - Secret scanning with push protection where the git host offers it on
     my plan; otherwise a scanner such as gitleaks in CI.
   - Scan the FULL git history once. Any real secret found must be rotated
     (not just deleted), so list it under ACTIONS FOR ME.
   - .env.example lists every variable name with no values.

5. Dependency hygiene *
   - Lockfile committed.
   - Automated update pull requests (Dependabot or Renovate): security
     updates on; other updates monthly and grouped, so they're easy to
     review.
   - A minimum release age or cooldown of a few days before adopting new
     versions (e.g. Renovate minimumReleaseAge, pnpm minimumReleaseAge,
     Dependabot cooldown; check current docs). In 2025, hijacked versions
     of very popular npm packages were live for hours before removal, and a
     worm used them to steal secrets. Waiting a few days avoids most of
     that.

6. Environments and keys *
   - Separate development and production projects (database, auth,
     storage) with separate keys. Payment test keys in development; live
     keys only in production.
   - Preview deployments per branch that use development data (never the
     production database) and are noindexed.
   - Environment variables set per environment in the hosting dashboard and
     listed by NAME in docs/SETUP.md.

7. AI tool guardrails *
   - CLAUDE.md (or AGENTS.md or the tool's rules file) filled in from
     CLAUDE_TEMPLATE.md.
   - Tool permission settings that enforce the critical rules. Examples:
     Claude Code project settings (.claude/settings.json) with deny rules
     for reading .env files and for force-pushes and recursive deletes;
     Cursor's .cursorignore for .env files. Write the exact rules from the
     tool's current docs.
   - A deny rule covers only the tool it names (a shell command can still
     print a file), so keep production secrets off this machine where
     possible and use development keys locally.
   - Database connectors and MCP servers: read-only, or a development
     project only. Only servers and plugins I have approved.
   - Optional: a hook that runs the type check automatically after edits.

8. Strictness
   - TypeScript: "strict": true, "noUnusedLocals": true,
     "noUnusedParameters": true.
   - Linter and formatter configured; an unused-code tool (e.g. knip)
     available.
   - Other stacks: the equivalent strict mode and linters.

9. Monitoring from day one *
   - Error tracking (e.g. Sentry's free tier) in the frontend and backend,
     with personal data scrubbing on (no request bodies, emails, or IPs
     unless needed; session replay off, or masked and consent-based).
   - An uptime monitor on the production URL and main API (e.g. UptimeRobot
     or Better Stack free tiers), alerting my phone or email.

10. Accounts and billing protection *
    - MFA on every account: git host, hosting, database, domain registrar,
      email, payment gateway, AI providers, error tracking. Recovery codes
      stored in a password manager.
    - Spend caps and budget alerts on every usage-billed service (database,
      hosting, AI APIs, SMS balance, maps, storage). A looping bug or an
      attacker can run up a large USD bill overnight; a cap turns that into
      a brief outage.
    - Domain: registrar lock and auto-renew on, with the renewal date in
      docs/SETUP.md.
    - Client projects: accounts created under the client's ownership, with
      me invited.

11. Backups
    - What the plan tier actually provides (some free tiers have no
      backups). Turn on automated backups, or schedule a database dump to
      separate storage, matching the recovery targets in the Project
      Profile.
    - Schedule the first restore test (P13 tracks it).

12. Docs seeded
<!-- INTEGRATED-ONLY -->
    - docs/prompts/ (this suite), docs/PROMPT_PLAN.md (from P00),
      docs/PROGRESS.md, docs/audits/FINDINGS.md (from
      templates/FINDINGS_TEMPLATE.md), and docs/DATA_INVENTORY.md (from P02
      and P03).
<!-- /INTEGRATED-ONLY -->
<!-- STANDALONE-ONLY (ignore in the integrated suite)
    - A progress note (PROGRESS.md) and a short SETUP.md describing what
      was configured.
-->

---

OUTPUT: docs/SETUP.md
A table with one row per checklist item: status (DONE / ACTION FOR ME /
N/A / DEFERRED, with reason), where it is configured, and how I verify it.
Include renewal dates (domain, certificates if manual, paid plans). Never
write secret values; names only.

VERIFY (I can do these myself)
- Open a test pull request with a deliberate type error: CI fails and merge
  is blocked. Fix it: CI passes.
- Try to push directly to main: it is rejected.
- Ask the AI tool to show the contents of .env: it is refused.
- Trigger a test error in the preview: it appears in the error tracker.
- Pause or break the preview URL that the uptime monitor watches (or use the
  monitor's test alert): I get the alert.

RULES
- No secret values in any file you create.
- Never weaken an existing protection to make setup easier.
- Client repos: agree dashboard changes with the client first.

<!-- STANDALONE-INCLUDE: _build/SAFE_CHANGE_RULES.md -->
