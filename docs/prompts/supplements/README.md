# Supplements

Extra prompts for platforms and domains the numbered suite doesn't cover in
depth (desktop apps, browser extensions, chat bots, regulated domains...).
They plug into a project's run order through P00 (Project Triage).

## How they're used

1. P00 spots a gap for a project (e.g. "this is a Windows app that deletes
   files").
2. If a supplement here fits, P00 copies it to the project's
   docs/prompts/project/ and adapts it. Otherwise P00 drafts a new one there,
   in the SUPPLEMENT FORMAT defined in P00.
3. PROMPT_PLAN.md says when it runs (e.g. "alongside P07 before the first
   release"). P14 (Launch Gate) checks it has a current report.

## Adding to this library

When a project supplement will be useful again (your second Windows app,
your second WhatsApp bot), copy it here:
- Remove project-specific details (names, paths, client facts).
- Keep it platform-level and checkable, and keep the SOURCES list with the
  dates the docs were checked. Platform rules change often, so re-check
  sources when you reuse it after a few months.
- Name it by topic: [platform_or_domain]_[focus].md.
- It must not repeat checks a numbered prompt already owns; point to that
  prompt instead.

If a supplement ends up used on most projects, promote it to a numbered
prompt (see README section 9 on renumbering).

## Library

| Supplement | Use for |
|------------|---------|
| desktop_app_release_safety.md | Windows (and macOS) desktop apps: destructive-action and file-system safety, privileges, packaging, signing, updates, distribution |
