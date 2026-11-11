# Ọ̀nà Ilé: Progress

## Current state (2026-11-07)

- **Prototype v0.1** in `baba-keke/` is a single-file Three.js game with OSM zone data. It is published as an [artifact](https://claude.ai/artifact/LVmMr8ENW5UvSUw12b2p9V). It ran well on a real phone in mobile Chrome.
- **Planning is done:** PROMPT_PLAN (P00), IDEA_BRIEF (P01), PROJECT_PLAN, DATA_INVENTORY draft and CLAUDE.md (P02).
- **PRD:** https://claude.ai/artifact/DbR5D4bPuhmqcZtjaHE8A1. ACC-3 swipe-to-drive was added on 2026-11-07.
- **Repo:** `https://github.com/asejik/ona-ile` (private). The first commit was pushed on 2026-11-11.
- **M0 is done:** P03, P04 and P05-A. Next: P05-B (design direction), then M1 (walking skeleton).

## Log

| Date | Task | What changed | Next | Known issues |
|---|---|---|---|---|
| 2026-11-07 | P00, P01, P02 | Planning docs written. PRD updated (v1.0 offline and free, web first-class, ACC-3) | M0: P03 LIGHT DESIGN | Repo renamed to `asejik/ona-ile`. Suite templates added |
| 2026-11-07 | P03 LIGHT DESIGN | DATA_INVENTORY completed. PRIV-1..12 and the paperwork checklist added to PROJECT_PLAN §9. DPIA needed before M6 | P04 setup | Controller name and privacy contact email still open. Umami region and DPA to verify at M1 |
| 2026-11-11 | P04 setup | git and the private remote. `.gitignore`, LICENSE, NOTICE, CI (gitleaks and the zone reproducibility check), Dependabot, Claude deny rules, bug template, SETUP.md, FINDINGS.md. Pinned OSM extract in `data/osm/` | P05-A | MFA and domain renewal are actions for you. Branch protection isn't possible on a private Free repo |
| 2026-11-11 | P05-A design extraction | `docs/DESIGN.md`: tokens, type, layout, components, signature moments, and 23 findings (8 inconsistencies, 11 accessibility, 4 performance) | P05-B | Findings are open until the rebuild. No device measurement of the blur cost |
