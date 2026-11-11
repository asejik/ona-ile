# P09: ARCHITECTURE & PRODUCT QUALITY REVIEW

<!-- INTEGRATED-ONLY -->
Stage: Audit | Run: every 2-3 milestones; before client acceptance
Output: docs/audits/P09_[YYYY-MM-DD].md

Follow docs/prompts/AUDIT_STANDARD.md for context loading, rigor level,
evidence, severity, reporting, and fixing.
<!-- /INTEGRATED-ONLY -->
<!-- STANDALONE-ONLY (ignore in the integrated suite)
Judges architecture, maintainability, UX, accessibility, content, feature
completeness, and testing, right-sized for the project and for a solo
builder directing AI tools.
-->

<!-- STANDALONE-INCLUDE: AUDIT_STANDARD.md -->

---

ROLE
Act as a senior software architect and product quality reviewer. Assess
architecture, maintainability, user experience, accessibility, feature
completeness, and testing, judged by what is RIGHT-SIZED for this project
(see the Project Profile and rigor level) and for a solo builder directing
AI coding tools. Over-engineering counts as a weakness, not a strength.

OWNS: architecture and maintainability, UX audit, accessibility audit,
content and microcopy, feature completeness vs plan or PRD, edge-case flows,
account management, testing strategy, overall grade.
NOT HERE: privacy law (P03), production readiness (P07), security (P08), AI
output quality (P10), SEO (P11), egress (P12). The visual design system
belongs to P05; this review audits the result.

EXTRA CONTEXT
- Walk through the app yourself with Playwright on a local or preview URL
  (test accounts only), taking screenshots of key screens at 360px and
  desktop width. If that isn't possible, ask me for screenshots.
- Use the core user journeys from docs/PROJECT_PLAN.md if it exists, or
  infer them from the code and confirm them with me.

TOOLS FIRST (run what applies and paste the output)
Tests (unit and end-to-end), an automated accessibility scan of key pages
(e.g. axe via @axe-core/playwright, or the Lighthouse accessibility score),
and the type check (count of "any" and suppressed errors).

---

REVIEW SECTIONS

1. Architecture and Maintainability
   - Folder structure: could a new AI session or developer find things
     quickly?
   - Duplicate implementations (utilities, API clients, components, types,
     business rules)
   - Oversized files (flag anything over ~300-400 lines) and components
     mixing data fetching, business logic, and UI
   - Consistency: one pattern each for data fetching, forms, error handling,
     and styling, not several competing ones
   - State management appropriate for the app's size
   - Type safety: use of "any", missing types for database data
   - Over-engineering: abstractions, libraries, or patterns not needed yet
   - A rules file for AI sessions (CLAUDE.md or equivalent) exists and
     matches reality; if not, draft it
   - Handover basics: a README that explains how to run the project, and
     .env.example

2. User Experience
   - Walk through each core journey step by step; flag confusing, slow, or
     broken steps
   - Loading, error, and empty states exist for every data-loading screen
     (check the code) and are helpful (check the screenshots)
   - Navigation clarity and visual hierarchy (from screenshots)
   - Forms: clear validation messages, input preserved on errors, double
     submission prevented
   - Onboarding: can a new user understand what to do in the first minute?
   - Mobile: layout at 360px, touch targets at least 44x44px, readable text
     without zooming
   - Consistency with docs/DESIGN.md, if it exists
   - AI review is not a substitute for real users. Draft a short usability
     test: 5 realistic tasks for 3-5 target users, what to watch for, and
     the rule "don't help them". I will run it.

3. Content and Microcopy
   - Error messages say what happened and what to do next, without blame or
     jargon
   - Button labels describe the action; empty states guide the next step
   - Tone matches the product and users (e.g. gentle for counselling,
     precise for finance); no placeholder or lorem ipsum text

4. Accessibility (WCAG 2.2 AA basics)
   - Form labels, alt text, colour contrast, keyboard navigation, visible
     focus, accessible names for icon-only buttons, reduced-motion support
   - Automated scan results (tools first), then what scans miss: keyboard-
     only pass through the core journey, focus order, error announcements,
     zoom to 200% without breaking the layout

5. Feature Completeness and Edge Cases
   - Compare the app against the plan. Client projects (or a PRD I
     provide): a requirements traceability table: REQ-ID, requirement,
     status (DONE / PARTIAL / MISSING / CHANGED), evidence (screen or file).
   - Missing features split into NEEDED for the stated goals vs NICE TO
     HAVE, with effort (S/M/L). Don't pad the list with generic features.
   - Unhappy paths: expired links or invites, duplicate sign-ups, closing
     the page mid-payment or mid-form, lost connection, deleting records
     others depend on, a third-party service being down
   - Account management: change email and password, log out, deactivate or
     delete account, data export where required

6. Testing Strategy
   - What tests exist, whether they pass (run them and paste output), and
     whether CI runs them on every change
   - Tests are written from the acceptance criteria, not from the code. An
     AI that writes tests by reading its own code will "prove" its own bugs
     correct. Flag tests that only restate the implementation.
   - A right-sized plan: end-to-end smoke tests (Playwright) for the 3-5
     critical journeys first; unit tests only for complex logic (pricing,
     permissions, calculations)
   - Draft the missing smoke test scenarios for my approval

7. Status From Other Audits
<!-- INTEGRATED-ONLY -->
   - From docs/audits/FINDINGS.md and the latest reports: one line each for
     every prompt and supplement that docs/PROMPT_PLAN.md marks USE or LIGHT
     (typically P03, P07, P08, P10, P11, P12): last run date and open
     CRITICAL/HIGH items. Recommend which to run if missing or outdated.
<!-- /INTEGRATED-ONLY -->
<!-- STANDALONE-ONLY (ignore in the integrated suite)
   - If earlier audit reports exist, one line each: last run date and open
     CRITICAL/HIGH items. Otherwise name the reviews worth running next
     (privacy, production readiness, security, SEO, cost).
-->

---

SCORECARD (score sections 1-6 using exactly these definitions)
1 - Missing or broken: the area doesn't work or doesn't exist
2 - Fragile: works on the happy path, fails on common edge cases
3 - Solid: works reliably, with some gaps or inconsistencies
4 - Strong: consistent, edge cases handled, easy to maintain
5 - Exemplary: nothing meaningful to improve at this stage
Every score must cite the findings that justify it.

GRADE (the lowest applicable rule wins)
- F: open CRITICAL issues in any audit
- D: any section scored 1
- C: any section scored 2, or open HIGH issues in any audit (ACCEPTED RISK
  items don't count, but list them)
- B: all sections 3 or above, no open CRITICAL issues
- A: all sections 4 or above, no open HIGH or CRITICAL issues

ADDITIONAL REPORT SECTIONS
- Scorecard with justifications, and the final grade
- Missing features (NEEDED vs NICE TO HAVE)
- The usability test script
- Client projects: the traceability table and an acceptance readiness
  statement (which milestones can be presented for client sign-off)

RULES
- Refactors must not change behaviour. Each approved refactor is made as a
  separate change with a manual test checklist confirming nothing broke.

<!-- STANDALONE-INCLUDE: _build/SAFE_CHANGE_RULES.md -->
