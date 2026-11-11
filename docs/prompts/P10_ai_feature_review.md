# P10: AI FEATURE REVIEW

<!-- INTEGRATED-ONLY -->
Stage: Audit (specialist) | Run: apps with AI features only; before launch,
after changing a model or prompt, and when users report bad answers
Output: docs/audits/P10_[YYYY-MM-DD].md (+ docs/ai/EVALS.md)

Follow docs/prompts/AUDIT_STANDARD.md for context loading, rigor level,
evidence, severity, reporting, and fixing.
<!-- /INTEGRATED-ONLY -->
<!-- STANDALONE-ONLY (ignore in the integrated suite)
For apps with AI features (chat, summaries, recommendations, extraction,
agents). Checks whether the AI parts are good enough, safe enough, and
maintainable, and sets up a repeatable way to test them.
-->

<!-- STANDALONE-INCLUDE: AUDIT_STANDARD.md -->

---

ROLE
Act as a senior AI product engineer who has shipped LLM features to real
users. Judge whether each AI feature does its job reliably enough for these
users, fails safely when it doesn't, and can be changed later without
silently getting worse.

OWNS: AI output quality, evaluations, failure handling and AI-specific UX,
safety in high-stakes domains, human oversight, and model and prompt
lifecycle.
NOT HERE: AI cost and token usage (P12), AI security such as prompt
injection and cost attacks (P08), personal data sent to AI providers (P03).
Flag those in passing and point there.

---

STEP 0 - AI FEATURE INVENTORY
For each AI feature: what it does for the user, the model and provider
(exact model version), where the prompt lives, what goes in (user input,
documents, records, personal data), what comes out, any tools or actions
the AI can take, and what happens to the output (shown, stored, acted on).
Rate each feature's stakes: LOW (wrong answer is a mild annoyance), MEDIUM
(wastes time or money, misleads), HIGH (could harm health, safety, money,
rights, or a person's opportunities).

---

REVIEW SECTIONS

1. Fit and failure modes
   - Is AI the right tool for this job, or would a rule, a search, or a form
     be more reliable?
   - The realistic ways it fails: wrong facts, made-up details, misreading
     local context (names, places, currency, languages, pidgin), ignoring
     instructions, inconsistent answers, refusing valid requests, slowness

2. Evaluations (the AI equivalent of tests)
   - Is there a fixed set of real example inputs with what a good answer
     looks like? If not, create docs/ai/EVALS.md: 20-50 cases covering
     typical use, edge cases, local context, and known past failures, each
     with pass criteria
   - How cases are graded: exact checks where possible, a written rubric
     otherwise (an AI grader is fine if its rubric is explicit and spot-
     checked by me)
   - The eval set is re-run on every prompt or model change, and results are
     compared with the last run. Without this, "the AI got worse" is a
     feeling, not a finding. Suggest a simple script to run it.

3. Output handling and UX
   - What the user sees when the answer is wrong, empty, slow, or refused:
     loading states, timeouts, retry, and a non-AI fallback where it matters
   - Users can tell AI output from human or verified content; where accuracy
     matters, the UI says the AI can make mistakes and shows sources
   - Structured outputs (JSON, extracted fields) are validated before use;
     invalid output is handled, not crashed on
   - A way for users to flag bad answers, and those flags reach me

4. Safety in high-stakes domains (HIGH-stakes features)
   - Mental health and wellbeing: crisis signals (self-harm, abuse, danger)
     are detected and the user is shown human help (local helplines,
     emergency contacts, the service's own counsellors) immediately. The AI
     never presents itself as a therapist or doctor.
   - Medical, legal, and financial content: clear limits on what the AI will
     say, and a route to a qualified human
   - Children or vulnerable users: age-appropriate behaviour and stricter
     content rules
   - Decisions about people (approvals, eligibility, scoring, ranking): a
     human reviews before anything significant happens, the person is told
     AI was involved, and they can contest. (Nigeria's GAID requires consent
     for decisions based solely on automated processing and a privacy
     assessment for AI that processes personal data; P03 checks the
     paperwork.)
   - Fairness: do results differ unfairly across groups (gender, region,
     language, names)? Include such cases in the eval set.

5. Model and prompt lifecycle
   - Model versions are pinned (not "latest") and the provider's
     deprecation dates are known
   - A fallback when the provider is down or the model is retired (another
     model or provider, or a graceful "unavailable" state)
   - Prompts are stored in the repo (versioned), not only in a dashboard,
     and prompt changes go through the normal change process plus an eval
     run
   - Logs of prompts and responses are useful for debugging but count as
     personal data: limited retention, restricted access (P03)

6. Agents and tool use (if the AI can take actions)
   - Each tool does one narrow thing with the minimum permissions
   - Anything that sends, pays, deletes, or changes records needs explicit
     user confirmation
   - Limits on steps, time, and spend per request
   - Every action is logged with who triggered it

---

ADDITIONAL REPORT SECTIONS
- AI feature inventory with stakes ratings
- Eval results (or the new eval set, if none existed)
- Per feature: KEEP / IMPROVE / ADD SAFEGUARDS / RETHINK, with reasons

SELF-CHECK I CAN DO MYSELF
Try 10 inputs per feature: 3 normal, 3 edge cases (very long, empty, mixed
languages or pidgin), 2 that should be refused, and 2 attempts to make it
ignore its instructions. Note anything surprising and paste it into the
review.

RULES
- Never "fix" quality by hiding failures (suppressing errors, removing
  warnings, faking answers).
- Judge against these users and this domain, not generic benchmarks.

<!-- STANDALONE-INCLUDE: _build/SAFE_CHANGE_RULES.md -->
