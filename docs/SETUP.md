# Ọ̀nà Ilé: Setup (P04)

Set up 2026-11-11. Rigor level STANDARD. Re-check yearly, and again at M1 when the code stack is added.

**Decision (owner, 2026-11-11): the repo stays private.** This overrides P02's "public repo" choice. On GitHub Free, a private repo can't use branch protection or rulesets (the API returned 403), and push protection for secrets isn't available either. gitleaks in CI and the Claude Code deny rules stand in for them. Because the repo is private, the ODbL share-alike offer for the zone data has to be made another way before the M6 community release (NOTICE.md; S2 §1).

| # | Item | Status | Where configured | How you verify it |
|---|---|---|---|---|
| 1 | Version control | DONE | `.gitignore`, `.gitattributes` (LF line endings), private remote `github.com/asejik/ona-ile`, `LICENSE` (all rights reserved), `NOTICE.md` (OSM / ODbL) | `git status` is clean after a build. `.env` files and keystores never show up |
| 2 | Protected `main` | **N/A on GitHub Free with a private repo** | — | Rule kept by habit and CLAUDE.md: work on branches, merge with pull requests. Revisit if the repo goes public or you get GitHub Pro |
| 3 | CI | PARTIAL | `.github/workflows/ci.yml`: gitleaks, plus a check that `zone1.js` rebuilds exactly from the pinned OSM extract | Actions tab shows green. Hand-edit `baba-keke/zone1.js` on a branch and the zone job fails. **M1 adds** typecheck, lint, unit tests, build and Playwright |
| 4 | Secret protection | DONE (no push protection) | gitleaks scans the full history in CI. The history started on 2026-11-11, and the prototype holds no keys | Add a fake `AKIA…` key on a branch and the secrets job fails. `.env.example` arrives in M1 |
| 5 | Dependency hygiene | PARTIAL | `.github/dependabot.yml`: GitHub Actions monthly, grouped, 7-day cooldown | Dependabot shows under Insights → Dependency graph. **M1 adds** npm with the same policy, and the lockfile |
| 6 | Environments and keys | N/A (no secrets in v1.0) | — | M1 lists the Sentry DSN and Umami website ID **by name** for each environment here |
| 7 | AI tool guardrails | DONE | `CLAUDE.md`; `.claude/settings.json` denies reading `.env*`, keystores and `keystore.properties`, plus force-push, `git reset --hard`, `rm -rf` and `git clean -fdx`. Personal overrides go in `.claude/settings.local.json` (gitignored) | Ask Claude Code to show a `.env` file and it's refused. A deny rule covers only Claude's own tools, so keep production secrets off this PC |
| 8 | Strictness | DEFERRED to M1 | — | `tsconfig.json` strict settings, ESLint and Prettier, knip |
| 9 | Monitoring | DEFERRED to M1 | — | Sentry with PRIV-5 scrubbing, plus UptimeRobot (free) on the live URL |
| 10 | Accounts and billing | **ACTION FOR YOU** | See below | Each account's security page shows 2FA on |
| 11 | Backups | N/A for server data | Git (code and content). **Off-repo, in two places:** Blender `.blend` sources and the Android upload keystore with its password | Restore test: clone the repo on another folder and run the zone check. Open one `.blend` from the backup |
| 12 | Docs seeded | DONE | `docs/prompts/`, `docs/PROMPT_PLAN.md`, `docs/PROGRESS.md`, `docs/audits/FINDINGS.md`, `docs/DATA_INVENTORY.md`, this file, `.github/ISSUE_TEMPLATE/bug_report.md` (PRIV-12) | — |

## Actions for you (item 10)

1. **GitHub:** Settings → Password and authentication → enable two-factor authentication. Save the recovery codes in a password manager.
2. **Google account** (it will own the Play Console): myaccount.google.com → Security → 2-Step Verification.
3. **Cloudflare, Sentry, Umami** (when you create them in M1): turn on 2FA as soon as you sign up.
4. **Domain `asejik.com`:** at your registrar, turn on registrar lock and auto-renew, and enable 2FA on the registrar account. **Renewal date:** _[fill in]_.
5. **Spending caps:** nothing in v1.0 bills by usage. Re-check if you upgrade any plan.

## Renewal dates

| What | Date |
|---|---|
| `asejik.com` domain | _[fill in]_ |
| Paid plans | None |

## Environment variables (by name only)

None yet. M1 adds them, for example `VITE_SENTRY_DSN` and `VITE_UMAMI_WEBSITE_ID`, per environment.
