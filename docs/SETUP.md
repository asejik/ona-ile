# Ọ̀nà Ilé: Setup (P04)

Set up 2026-11-11. Rigor level STANDARD. Re-check yearly, and again at M1 when the code stack is added.

**Decision (owner, 2026-11-11): the repo stays private.** This overrides P02's "public repo" choice. On GitHub Free, a private repo can't use branch protection or rulesets (the API returned 403), and push protection for secrets isn't available either. gitleaks in CI and the Claude Code deny rules stand in for them. Because the repo is private, the ODbL share-alike offer for the zone data has to be made another way before the M6 community release (NOTICE.md; S2 §1).

| # | Item | Status | Where configured | How you verify it |
|---|---|---|---|---|
| 1 | Version control | DONE | `.gitignore`, `.gitattributes` (LF line endings), private remote `github.com/asejik/ona-ile`, `LICENSE` (all rights reserved), `NOTICE.md` (OSM / ODbL) | `git status` is clean after a build. `.env` files and keystores never show up |
| 2 | Protected `main` | **N/A on GitHub Free with a private repo** | — | Rule kept by habit and CLAUDE.md: work on branches, merge with pull requests. Revisit if the repo goes public or you get GitHub Pro |
| 3 | CI | DONE (2026-11-12) | `.github/workflows/ci.yml`: gitleaks; both zone files rebuild exactly from the pinned OSM extract; `npm ci`, `npm audit --audit-level=high`, type check, lint, unit tests, build, and the Playwright browser test at phone and desktop size. About 3–5 minutes | The Actions tab shows green. A type error on a branch fails the `app` job |
| 4 | Secret protection | DONE (no push protection) | gitleaks scans the full history in CI. `.gitleaks.toml` adds one narrow exception: the game's storage-key names (`onaile.<name>.v<n>`), which the generic API-key rule mistook for a secret. The history started on 2026-11-11, and the prototype holds no keys | Add a fake `AKIA…` key on a branch and the secrets job fails. `.env.example` arrives in M1 |
| 5 | Dependency hygiene | DONE (2026-11-12) | `package-lock.json` committed, exact versions pinned. `.github/dependabot.yml`: GitHub Actions and npm, monthly, grouped, 7-day cooldown | Dependabot pull requests appear monthly. **Don't merge TypeScript 7 yet:** `typescript-eslint` 8 supports TypeScript below 6.1 only |
| 6 | Environments and keys | DONE (2026-11-12) | No secrets. Cloudflare Pages builds `main` as production and every other branch as a preview (`<branch>.ona-ile.pages.dev`, marked `noindex` in `public/_headers`). Crash reporting runs only in production builds | Open a branch's preview URL: it works and sends `X-Robots-Tag: noindex` |
| 7 | AI tool guardrails | DONE | `CLAUDE.md`; `.claude/settings.json` denies reading `.env*`, keystores and `keystore.properties`, plus force-push, `git reset --hard`, `rm -rf` and `git clean -fdx`. Personal overrides go in `.claude/settings.local.json` (gitignored) | Ask Claude Code to show a `.env` file and it's refused. A deny rule covers only Claude's own tools, so keep production secrets off this PC |
| 8 | Strictness | PARTIAL (2026-11-12) | `tsconfig.json`: `strict`, `noUnusedLocals`, `noUnusedParameters`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`. ESLint with typescript-eslint, and Prettier. knip (unused code) not added yet | `npm run typecheck` and `npm run lint` pass |
| 9 | Monitoring | PARTIAL (2026-11-12) | Sentry (EU region) in `src/platform/crash.ts`: off until the player opts in, every data-collection category off, events scrubbed by `src/platform/scrub.ts`, switchable from `public/config.json`. **Still to do:** an uptime monitor once the site is live (M1c) | The browser test `tests/e2e/privacy.spec.ts` passes. A test error with opt-in appears in the Sentry project |
| 10 | Accounts and billing | PARTIAL | 2FA is on for GitHub and Google (you confirmed, 2026-11-11). The domain lock is on. Auto-renew needs checking (below) | Each account's security page shows 2FA on |
| 11 | Backups | N/A for server data | Git (code and content). **Off-repo, in two places:** Blender `.blend` sources and the Android upload keystore with its password | Restore test: clone the repo on another folder and run the zone check. Open one `.blend` from the backup |
| 12 | Docs seeded | DONE | `docs/prompts/`, `docs/PROMPT_PLAN.md`, `docs/PROGRESS.md`, `docs/audits/FINDINGS.md`, `docs/DATA_INVENTORY.md`, this file, `.github/ISSUE_TEMPLATE/bug_report.md` (PRIV-12) | — |

## Actions for you (item 10)

1. ✅ **GitHub** 2FA: on.
2. ✅ **Google account** (Play Console owner) 2-Step Verification: on.
3. **Cloudflare, Sentry, Umami** (when you create them in M1): turn on 2FA as soon as you sign up.
4. **Domain `asejik.com`** (registrar **GO54**, from the public RDAP record, checked 2026-11-11):
   - ✅ Transfer lock is on (status `client transfer prohibited`).
   - **Expires 2027-09-18.** In the GO54 client area, open the domain and turn **auto-renew** on, with a valid card or enough account credit. Otherwise, set a reminder for August 2027.
   - Turn on 2FA for the GO54 login, if it offers it.
5. **Spending caps:** nothing in v1.0 bills by usage. Re-check if you upgrade any plan.

## Cloudflare Pages (M1c)

**Settings** (enter them when creating the project):

| Setting | Value |
|---|---|
| Project name | `ona-ile` (gives `ona-ile.pages.dev`) |
| Production branch | `main` |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Environment variable | `NODE_VERSION` = `24` |
| Web Analytics | **Off** (it would add a tracker the privacy plan doesn't allow) |
| Custom domain | `ona-ile.asejik.com` (CNAME to `ona-ile.pages.dev` at the DNS host, WhoGoHost/GO54) |

**What `public/_headers` sets:** a strict Content-Security-Policy (only the game's own files plus the Sentry EU endpoint), `nosniff`, `no-referrer`, a Permissions-Policy that blocks camera, microphone and location, and caching (build files for a year, zones for a day, `config.json` never cached).

## Sentry dashboard settings

- ✅ 2026-11-12, organisation level: **Require Data Scrubber**, **Require Using Default Scrubbers** and **Prevent Storing of IP Addresses** are on for all projects.
- ✅ 2026-11-12: Data Processing Addendum accepted, and two-factor sign-in on (owner confirmed).
- To do: note the event retention period shown for your plan in `docs/DATA_INVENTORY.md`.

## Renewal dates

| What | Date |
|---|---|
| `asejik.com` domain (GO54) | 2027-09-18 |
| Paid plans | None |

## Environment variables (by name only)

None. The Sentry DSN is a public identifier and lives in `src/platform/crash.ts`. Crash reporting runs in production builds only, so no per-environment value is needed.
