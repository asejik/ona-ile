# P05: UI DESIGN DIRECTION

<!-- INTEGRATED-ONLY -->
Stage: Build | Two parts:
- P05-A (Design System Extraction): run ONCE on an app whose design I love.
  Output: a DESIGN.md for my personal design library.
- P05-B (Design Direction): run at the start of each project and for major
  new screens. Output: docs/DESIGN.md for this project.
<!-- /INTEGRATED-ONLY -->
<!-- STANDALONE-ONLY (ignore in the integrated suite)
Two independent parts; use whichever you need.
- Part A - EXTRACT: capture the design system of an app you like (or any
  app) into a reusable DESIGN spec.
- Part B - DIRECT: give a new or existing app a distinctive, modern UI, and
  produce its DESIGN spec.
-->

Tip: attach 4-5 screenshots of the reference app along with its DESIGN.md.
Images communicate design far more reliably than words.

---

## P05-A: DESIGN SYSTEM EXTRACTION

ROLE
Act as a senior product designer and design systems engineer. Analyse this
app's interface and extract its design system into a reusable DESIGN.md, so
other apps can adapt the same quality without copying it blindly.

EXTRACT (use the actual values from the code, not descriptions)
1. Colour: every colour in use, grouped into roles (background, surface,
   text primary/secondary, border, accent, success, warning, error), for
   light and dark mode if both exist
2. Typography: font families, size scale, weights, line heights, letter
   spacing for headings and body; how fonts are loaded
3. Spacing and layout: spacing scale, container widths, grid, section
   padding
4. Shape and depth: corner radii, shadow values, borders, blur/glass usage
   and where it appears
5. Motion: every animation, its duration, easing curve, and trigger; whether
   prefers-reduced-motion is respected
6. Components: buttons, cards, inputs, navigation, modals, tables, empty
   states, loading states; how each looks and behaves
7. Icons and imagery: icon set, stroke width, illustration or photo style
8. Signature moments: the 2-3 details that make this app feel distinctive
9. Personality: 3-5 words describing the feeling this design creates, and
   which choices create it

If the app is running, use Playwright to take screenshots at 360px and
desktop width to confirm the values you extract.

ALSO REPORT
- Inconsistencies (e.g. five slightly different greys, mixed radii) so the
  system can be cleaned up
- Accessibility problems: contrast failures, motion without a
  reduced-motion fallback, hover-only information
- Performance concerns on mid-range Android phones (heavy blur, particles,
  large animations, many font files)

OUTPUT
- DESIGN.md with design tokens (colours, type scale, spacing, radii,
  shadows, motion) in a copy-ready format (CSS variables and/or Tailwind
  theme config), plus the rules, signature moments, and personality notes
- Do not change any code in this app

---

## P05-B: DESIGN DIRECTION

ROLE
Act as a senior product designer working with a frontend engineer. Give this
app a distinctive, modern, cohesive interface that does NOT look like a
generic AI-generated app. Every visual choice must serve the product's users
and personality. Restraint beats effects.

Read the plan and idea brief first (docs/PROJECT_PLAN.md with its Project
Profile, docs/IDEA_BRIEF.md) if they exist; otherwise ask.

STEP 1 - BRAND BRIEF (ask me what the docs don't answer, then STOP and wait)
- Who are the users, what devices and networks do they use, and what should
  they FEEL using this app? (3-5 personality words)
- Is this mainly a marketing site, an app/tool, or both?
- Platform: web, PWA, or native mobile? (Native apps follow platform
  conventions: Apple Human Interface Guidelines and Material Design.)
- Light mode, dark mode, or both? (Decide now; adding dark mode later is
  expensive.)
- Reference: which ONE primary style should this lean toward, e.g.
  Apple (editorial, minimal), Linear (sharp, dark-forward), Stripe
  (structured, trustworthy), Framer (expressive), Vercel (stark,
  technical); or adapt a DESIGN.md from my design library?
- Client projects: brand guidelines, logo, colours, fonts, and any existing
  website or app to stay consistent with. Client brand rules override
  personal taste. Who approves the design, and how many revision rounds?
- Existing app: what to keep and what to change, so it stays consistent
- Any screenshots or references I can share

STEP 2 - DESIGN DIRECTION (for my approval before any code)
Propose 2 distinct directions. For each: personality, colour palette, font
pairing, layout approach, motion philosophy, and the 2-3 "signature moments"
that make it memorable, and explain how it fits the brief. If a design or
mockup tool is available, show mockups of the key screens. Client projects:
present the directions in a form I can share with the client.

STEP 3 - DESIGN SYSTEM (after a direction is chosen)
Create docs/DESIGN.md with tokens (colours with contrast checked, type
scale, spacing, radii, shadows, motion durations and easing) as CSS
variables and/or Tailwind theme config. All UI must use these tokens, never
one-off values. Include the compliance and trust components below.

---

DESIGN RULES

Hierarchy
- One dominant element per screen. On landing pages the hero headline wins
  above the fold: large type, tight line height, strong contrast.
- Create hierarchy with size, weight, and spacing before colour.
- One primary action per screen. Secondary actions are visible immediately
  but visually quieter.

Avoid the generic AI look
- Do not default to: Inter/system font everywhere, purple-to-blue
  gradients, a centered hero with two buttons followed by three icon cards,
  emoji as icons, glassmorphism on everything, gradient text everywhere,
  lorem ipsum or vague marketing copy.
- Put distinctiveness into typography, colour, layout, imagery, and copy,
  not into stacking effects.

Typography and weight budget
- At most 2 font families and about 4 weights in total. Self-host as woff2,
  use font-display: swap, and subset where possible. Users on mobile data
  pay for every kilobyte, and distinctive type shouldn't cost them.
- Images: modern formats (WebP/AVIF), sized to how they're displayed, lazy
  loaded below the fold.

Motion
- Motion must communicate something (feedback, state change, continuity) or
  create one signature moment. No ambient motion everywhere.
- Use a small set of durations (e.g. 150ms, 250ms, 400ms) and one or two
  easing curves.
- Respect prefers-reduced-motion: remove parallax, background motion, and
  large movements for those users.
- Content is visible by default; scroll reveals are enhancements only.
- Background motion (if any) is slow, low contrast, and never behind body
  text.

Depth
- Soft, layered shadows and clear foreground/background separation.
- Glass/blur used sparingly (1-2 places at most), always with readable
  contrast.

Mobile and touch
- Design at 360px first. Touch targets at least 44x44px.
- Hover effects are enhancements; nothing important is hover-only. Give
  touch users equivalent feedback (pressed states).
- Avoid heavy blur, particles, and parallax on mobile. Scrolling must stay
  smooth on a mid-range Android phone.

App screens, not just marketing pages
- Dashboards, tables, forms, lists, and settings get the same design quality
  as the landing page: clear navigation, readable tables on mobile, helpful
  empty states, consistent loading skeletons, friendly error states.

Local forms and formats
- Phone input with a country code (default +234 where users are in
  Nigeria); currency formatted with the right symbol (e.g. ₦) and
  separators; names without a forced first/last split; dates in the local
  format.

Trust on money and data screens
- Clear totals before payment, who is being paid, receipts, and what happens
  next. Users are rightly wary of scams; show it plainly.

Compliance components (design them; don't bolt them on)
- Cookie banner: visible without scrolling and not a thin bottom strip, with
  equal-weight Accept and Reject buttons and a link to change choices later
  (Nigeria's GAID requires a conspicuous banner).
- Consent checkboxes (never pre-ticked), privacy links at the point of data
  collection, account settings with export and delete, and for mobile apps
  the pre-install privacy statement and in-app privacy policy screen.

Accessibility
- WCAG 2.2 AA contrast, visible focus states, labelled inputs and icon-only
  buttons.

Tech constraints
- Use [Tailwind + one animation library, e.g. Motion] and one icon set (e.g.
  Lucide) with consistent stroke width. No additional UI or animation
  libraries without asking me.
- Animate with CSS transforms and opacity (cheap to render).

---

STEP 4 - BUILD AND REVIEW LOOP
- Build one key screen first, then STOP for my review before continuing.
- For each screen, use Playwright to take screenshots at 360px and desktop
  width (or tell me exactly what to capture). Critique the result against
  the brand brief and these rules, list anything that feels generic or off,
  and fix it before showing me.
- Report any rule you had to bend and why.
- Existing app: change one screen or component at a time, so nothing else
  breaks.
<!-- INTEGRATED-ONLY -->
- Build changes follow P06.
<!-- /INTEGRATED-ONLY -->
<!-- STANDALONE-ONLY (ignore in the integrated suite)
- Commit to git before changing styles, and follow the safe-change rules at
  the end of this prompt.
-->

<!-- STANDALONE-INCLUDE: _build/SAFE_CHANGE_RULES.md -->
