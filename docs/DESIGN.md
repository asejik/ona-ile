# Ọ̀nà Ilé: Design System (P05-B)

Decided 2026-11-11. This is the system the rebuild follows. **All UI uses these tokens, never one-off values.**

- **Direction (owner's choice):** "Baba's notebook" for the interface, with Nigerian road-sign styling for everything that sits inside the 3D world.
- **As-built record of the prototype:** [design/PROTOTYPE_EXTRACTION.md](design/PROTOTYPE_EXTRACTION.md) (P05-A). Its finding numbers (I-1, A-3, P-1 and so on) are referenced below.
- **Status:** a specification. Nothing is built yet, so no screen has been checked in a browser. Contrast ratios are computed with the WCAG formula.

---

## 1. Brand brief

| | |
|---|---|
| Players | People in Ilorin and beyond, mostly on 3–4 GB Android phones, often outdoors in bright light, on costly data. Also desktop browsers |
| Feeling | **Warm, dusty, playful, handmade, local** |
| Product | A game, plus one small landing and privacy page |
| Platform | Web (phone and desktop browsers) and an Android app from the same build. Because it's a game, it follows its own conventions rather than Material Design, except for system behaviour (back button, safe areas) |
| Theme | **One theme.** Cream panels over the 3D view. No light/dark switch. TIME-3 (time of day) changes the scene, not the UI |
| Tech | Plain CSS variables, no Tailwind and no animation library (PROJECT_PLAN §5: no React, small bundle). One icon set |

## 2. The two rules of the direction

1. **If it's interface, it's a page from Baba's notebook.** HUD chips, cards, menus and prompts are cream paper with ink text and a thin ink outline. Handwritten touches (ticks, ruled lines, a dashed underline) are allowed. Blur, glass and gradients are not.
2. **If it's in the world, it's a road sign.** Street plates, junction signposts, challenge start markers and the current-street banner use sign green with white text and a white border, the way Nigerian road signs look. The banner is the one HUD element that borrows the sign style, because it mirrors a sign.

**Signature moments** (keep these special; don't add more):
1. **Today's page.** The mission tracker is a notebook to-do list. Finishing an item draws a tick and strikes the line through.
2. **Signs you can trust.** In-world plates and signposts look like real ones and name where each road leads.
3. **The memory page-turn.** Restoring a Memory Book page plays one page-turn, the game's only large UI animation.

---

## 3. Tokens

```css
:root {
  /* ---- Colour: brand ---- */
  --keke: #F2C230;          /* keke yellow: primary buttons, "you" marker, pickups */
  --keke-deep: #C9971A;     /* button lip only. Never text or icons (2.47:1 on paper) */
  --green: #1F6B45;         /* keke stripe: the one call to action per screen */
  --green-deep: #124A2F;    /* lip under the green button */
  --laterite: #B5643F;      /* decoration only: ruled lines, borders */
  --haze: #E6CFA8;          /* page background, title wash, scene fog (one value) */

  /* ---- Colour: surfaces and text ---- */
  --paper: #FFF6E4;         /* every interface surface */
  --paper-2: #F3E6CB;       /* inset areas: keycaps, tracks, table stripes */
  --ink: #1C1812;           /* text, outlines, icons */
  --text-secondary: #6F5F49;/* supporting text on paper (5.74:1) */
  --text-disabled: #8E806A; /* disabled labels only (3.59:1; not for readable text) */
  --laterite-text: #9A4F2E; /* eyebrow labels on paper (5.54:1) */
  --gold-text: #8A6508;     /* stars and gold accents on paper (4.96:1) */

  /* ---- Colour: state ---- */
  --go: #38A95B;            /* GO fill. Text on it is --ink (5.88:1) */
  --stop: #B83220;          /* STOP fill. Text on it is white (5.97:1) */
  --success-text: #1F6B45;  /* on paper (6.02:1) */
  --danger-text: #A82A18;   /* errors and "late" on paper (6.50:1) */

  /* ---- Colour: world signs and map ---- */
  --sign-green: #0E5A36;    /* sign panels. Text and border are white (8.29:1) */
  --sign-white: #FFFFFF;
  --route: #36D07A;         /* route line and destination, always with a 2px --ink casing */
  --notebook: #FFB14A;      /* notebook place markers, with an --ink ring */
  --map-ground: #C79466;

  /* ---- Type ---- */
  --font-display: 'Baloo 2', 'Arial Rounded MT Bold', system-ui, sans-serif;  /* weight 800 only */
  --font-body: 'Nunito', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; /* weights 600 and 800 */
  --text-xs: 12px;   /* smallest size allowed */
  --text-sm: 14px;
  --text-md: 16px;   /* body and dialogue */
  --text-lg: 18px;
  --text-xl: 22px;
  --text-2xl: 28px;
  --text-title: clamp(44px, 9vw, 68px);
  --leading-tight: 1.1;
  --leading-body: 1.45;
  --text-scale: 1;   /* Settings: 1, 1.15 or 1.3. Every size multiplies by it */

  /* ---- Spacing (4-based) ---- */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --gutter: max(16px, env(safe-area-inset-left, 0px));

  /* ---- Shape ---- */
  --radius-sign: 4px;       /* signs and sign-style banner */
  --radius-chip: 6px;
  --radius-button: 12px;
  --radius-panel: 12px;
  --radius-card: 18px;
  --radius-pill: 99px;
  --outline: inset 0 0 0 1.5px var(--ink);          /* the ink outline on every paper panel */
  --outline-soft: inset 0 0 0 2px rgba(28,24,18,.35);/* outline buttons */

  /* ---- Depth ---- */
  --shadow-panel: 0 2px 0 rgba(28,24,18,.25);       /* a hard, short "paper on a desk" shadow */
  --shadow-card: 0 10px 40px rgba(0,0,0,.35);
  --lip-keke: 0 3px 0 var(--keke-deep);
  --lip-green: 0 3px 0 var(--green-deep);

  /* ---- Motion ---- */
  --dur-fast: 150ms;        /* presses, toggles */
  --dur-base: 250ms;        /* toasts, ticks, bars */
  --dur-slow: 400ms;        /* cards in and out, the page-turn */
  --ease-out: cubic-bezier(.2, .8, .2, 1);
  --ease-in-out: cubic-bezier(.4, 0, .2, 1);

  /* ---- Touch ---- */
  --touch-min: 48px;        /* smallest tappable size (driving, one-handed) */
}
```

### Contrast table (computed)

| Pair | Ratio | Passes |
|---|---|---|
| `--ink` on `--paper` | 16.45 | AA text |
| `--ink` on `--paper-2` | 14.29 | AA text |
| `--text-secondary` on `--paper` / `--paper-2` | 5.74 / 4.98 | AA text |
| `--laterite-text` on `--paper` | 5.54 | AA text |
| `--gold-text` on `--paper` | 4.96 | AA text |
| `--danger-text` on `--paper` | 6.50 | AA text |
| `--success-text` on `--paper` | 6.02 | AA text |
| `--ink` on `--keke` | 10.54 | AA text |
| `--paper` on `--green` | 6.02 | AA text |
| `--ink` on `--go` | 5.88 | AA text |
| white on `--stop` | 5.97 | AA text |
| white on `--sign-green` | 8.29 | AA text |
| `--ink` outline against `--haze` | 11.66 | Panel edges (paper against haze alone is only 1.41, hence the outline) |
| `--ink` casing on `--map-ground` | 6.61 | Map graphics |

**Never use:** `--keke` or `--keke-deep` as text on paper; `--laterite` as text; white text on `--go`; `--text-disabled` for anything a player must read.

### Type

- **Two families, three weights:** Baloo 2 at 800; Nunito at 600 and 800. Self-hosted WOFF2, subset to Latin plus the Yoruba marks (ẹ ọ ṣ and the tone accents), `font-display: swap` (PRIV-10, I-8, P-2).
- Display font: titles, names, money, buttons, signs. Body font: everything else.
- Numbers that change use `font-variant-numeric: tabular-nums`.
- Uppercase is only for the 12px eyebrow label, with `letter-spacing: .08em`.
- Dialogue lines are at most 65 characters wide.
- Money is written "₦5,000" with a comma separator and no decimals.

---

## 4. Layout

- Design at **360 × 640 portrait first**, then landscape phone, then desktop.
- The 3D view fills the screen. The HUD floats at the edges. Cards rise from the bottom on phones and sit centred on desktop.
- Every edge respects the safe-area insets, with a 16px side gutter.
- The HUD layer ignores touches. Only its controls opt in. **Everything else on the driving view belongs to swipe-to-drive.**
- **Driving HUD zones (portrait):**

| Zone | Content |
|---|---|
| Top left | Today's page (mission tracker) |
| Top right | Minimap, with the pause button on its corner |
| Top centre, under those | Current-street banner |
| Middle band | Kept clear for the road. Toasts appear here, briefly |
| Bottom left | Horn |
| Bottom right | Damage and speed chip |
| Bottom centre | Context button (for example "Take a photo for Baba", "Pick up") |
| Bottom edge | Map credit, on a paper chip |

- In landscape, Today's page collapses to its first line and the banner sits at the top centre.

---

## 5. Motion

- Motion must tell the player something: a press, a state change, or one of the three signature moments.
- Durations: 150, 250 or 400ms. Easing: `--ease-out` for things arriving, `--ease-in-out` for things moving.
- Animate `transform` and `opacity` only (P-4). Bars grow with `scaleX`.
- **Reduced motion** (`prefers-reduced-motion`, plus a "Reduce motion" setting):
  - no toast pop, tick draw or bar animation;
  - no camera shake;
  - the photo flash becomes a brief paper-coloured fade at 40% (A-7);
  - the page-turn becomes a cross-fade.
- The minimap redraws at most 20 times a second (P-3).

---

## 6. Components

Every paper panel is `background: var(--paper)`, `box-shadow: var(--outline), var(--shadow-panel)`, `border-radius: var(--radius-panel)`. **No `backdrop-filter` anywhere** (P-1).

### Driving HUD

| Component | Specification |
|---|---|
| **Today's page (HUD-1)** | Paper panel, at most 190px wide, with ruled lines. Eyebrow "Today's page". Up to three lines, each with a checkbox: (1) the active ride or timed challenge in 14px/800 with distance and time left; (2) the stage goal with its amount; (3) the next story task. A finished line gets a drawn tick and a strike-through, then leaves after 2 s. With no ride it reads "Find a passenger". Tapping it opens the full list |
| **Current-street banner (NAV-1)** | Sign style: `--sign-green`, white 2px border, white display text at 16px, 4px radius. Updates within 1 s of turning |
| **Minimap (NAV-5)** | 112px circle (150px on desktop) with a 3px paper ring and an ink outline. Rotates with heading, with a floating "N". Road names appear along nearby roads. Markers all carry an ink ring. Tapping opens the full map |
| **Warden signal (CORE-2, A-3)** | **Shape and colour:** STOP is a white-bordered octagon on `--stop` with "STOP" in white. GO is a circle on `--go` with an arrow and "GO" in ink. The same shapes are used on the minimap and in the world |
| **Damage and speed chip (DMG-1)** | Paper chip: a keke icon, a damage bar and the percentage, then the speed. The bar fill is ink up to 50%, `--danger-text` above |
| **Comfort (CORE-1, A-9)** | A labelled "Comfort" bar inside the ride line of Today's page. It never relies on colour alone: the label shows a word (Smooth, Bumpy, Rough) |
| **Toast** | Paper panel, 14px/800, centred in the middle band, at most two at once, gone after 2.5 s. Good news has a tick icon and a `--success-text` left rule; bad news a warning icon and `--danger-text` |
| **Context button** | Pill, `--keke` with the keke lip, display 16px, at least 48px tall |
| **Pause button** | 48px paper circle with an ink outline and a pause icon (A-11) |
| **Map credit** | 12px on a paper chip: "© OpenStreetMap contributors" (A-6, A-8) |

### Controls

| Component | Specification |
|---|---|
| **Swipe-to-drive ring (ACC-3)** | Appears where the finger lands: an 80px ring (2px ink, with a 2px paper outer ring so it shows on any scene) and a 30px `--keke` thumb with an ink outline that follows the finger, clamped to the ring. Fades out over 150ms on release. A first-run hint shows a ghost ring and "Drag to drive" until the first successful drag |
| **Touch buttons** | Horn is always shown (48px, paper). The gas, brake and steer buttons appear only when the control setting is "Buttons" or "Both": 64px, paper at 92% opacity with an ink outline and ink icons, pressed state `--keke` (A-5) |
| **Keyboard help** | Keycaps on `--paper-2` with a 6px radius. Desktop only |

### World signs (rendered in 3D, same tokens)

| Component | Specification |
|---|---|
| **Street name plate (NAV-2)** | `--sign-green` plate, white border and white display text, on a grey pole at each named junction |
| **Junction signpost (NAV-3)** | One green blade per exit: an arrow and the place the road leads to ("→ Post Office"). At most three blades per post |
| **Challenge marker (TIME-1)** | A yellow `--keke` board with ink text and a stopwatch icon |
| **Pickup and drop-off (CORE-5)** | A `--keke` ring on the road edge for pickups and a `--route` ring for drop-offs, both with an ink casing. The passenger stands on the kerb beside it |
| **Pothole (REAL-5)** | Dark patch with a lighter broken rim, readable from at least 30 m |

### Cards and screens

| Component | Specification |
|---|---|
| **Card** | Paper, 18px radius, `--shadow-card`, ruled lines at 10% `--laterite`, 16–24px padding, at most 560px wide. Opening a card moves focus to its first button, keeps focus inside, and returns it on close (A-10) |
| **Dialogue card (STORY-1)** | Portrait (56px circle until portraits arrive: character colour, initial), name in display 22px, role in `--text-secondary`, line at 16px/600, buttons below. Subtitles are always shown |
| **Buttons** | Primary: `--keke`, ink text, keke lip. Call to action: `--green`, paper text, green lip; one per screen. Outline: `--outline-soft`. All at least 48px tall, 12px radius, display 16px. Press moves 2px down. Focus ring: 3px `--ink` outline with a 2px offset |
| **Ride summary** | Stars in `--gold-text` with the count in words ("4 of 5 stars"), then a table of fare, bonus and tip with dashed rules and a bold total |
| **Title screen** | Haze wash over the live scene. Card: eyebrow, the title in display, "The Last Delivery", one line of lede, "Start driving" (green), "Continue" when a save exists, then links to Settings, Credits and Privacy |
| **Pause menu** | Card: stage name, stars so far, Resume (primary), Settings, Full map, Challenges, Restart stage (outline, asks to confirm) |
| **Settings (SYS-1, ACC-1, ACC-2)** | A list of rows on paper. Controls: Swipe, Buttons or Both, and steering sensitivity. Display: text size (Normal, Large, Larger), graphics quality (Low, Medium, High), Reduce motion. Sound: effects and music sliders. Privacy: the two diagnostics toggles and a link to the notice. Save: export and import save code. Toggles are 48px tall with a visible On or Off word |
| **Full map (NAV-5)** | Full-screen map on `--map-ground` with road names, landmarks and markers, pinch and drag, a legend, and a paper close button |
| **Challenge board (TIME-2)** | A list: name, limit, best time, and a bronze, silver or gold medal shown as an icon with the word beside it. Empty state: "No runs yet. Find a yellow board to start one." |
| **Memory Book (CORE-3)** | A two-page notebook spread. Found pages show the render and Baba's note; missing pages show a dashed outline and a hint. Empty state: "Baba's notebook is waiting. Find the first place." |
| **Save code** | A read-only code box with Copy, and an input with Import. An invalid code shows "That save code isn't valid" in `--danger-text` under the field |
| **Stage select / city overview** | Paper map of Ilorin with a pin per stage: unlocked pins in `--keke`, locked ones outlined with a padlock icon and what unlocks them |

### States

| State | Specification |
|---|---|
| **Loading (title, zone)** | Haze screen with the keke icon driving along a dashed line that fills as the zone loads, plus the stage name. On the web, before fetching a stage: "Download Stage 2 (4 MB)?" with Download and Not now |
| **Error** | Paper card, plain words and one action: "Couldn't load the map. Check your connection." with Retry. "Your browser paused the 3D view." with Resume. Never a raw error string |
| **Offline** | Nothing is shown; the game keeps working |
| **Update needed** | Card: "A newer version is ready" with Update |

### Privacy and trust components

| Component | Specification |
|---|---|
| **Age check (PRIV-2)** | Card after the first paid ride: "Are you 18 or older?" with Yes and No as equal outline buttons. No pre-selection |
| **Diagnostics prompt (PRIV-2, PRIV-3)** | Shown only after Yes. Title "Help improve Ọ̀nà Ilé?". Two toggles, **both off**: "Send crash reports" and "Send anonymous play stats", each with one line saying what is sent and to whom. A line: "This is sent outside Nigeria. No name, account or location." Buttons of equal weight: Save choice and No thanks. A link to the privacy notice |
| **Privacy screen (PRIV-4, PRIV-7)** | The same two toggles plus the notice text, reachable from the title screen and Settings |
| **No cookie banner** | Not needed, because nothing optional loads before a choice (DATA_INVENTORY §4) |
| **Credits** | Map data credit with a link, fonts, Three.js, sound sources, readers |
| **Purchases (Online phase only)** | Not designed yet. When it is: a clear total in ₦ before paying, what is unlocked, and "Restore purchases" |

---

## 7. Icons and imagery

- **One icon set: Lucide**, as inline SVG at a 2px stroke, in `currentColor`. Bundle only the icons used. No emoji as icons.
- Icon-only buttons have an `aria-label`.
- Stars are icons, not text glyphs.
- Characters: coloured initial circles now; expressive portraits later (PRD art direction). Portraits are WebP, sized to 2× their display size.

## 8. The landing and privacy page

A single static page in the same system: the haze background, one paper card, the title, one sentence, a "Play now" green button, a short loop or still of the game, and links to Privacy and Credits. It must not use a centred hero with three icon cards. P11 covers its metadata.

---

## 9. How the P05-A findings are resolved

| Finding | Resolution |
|---|---|
| I-1 muted browns | `--text-secondary` and `--text-disabled` only |
| I-2 greens and reds | `--go`, `--stop`, `--route`, plus text variants |
| I-3 radii | Six radius tokens |
| I-4 spacing | The 4-based scale |
| I-5 font sizes | Whole-pixel scale, 12px minimum |
| I-6 inline styles | Tokens and classes only |
| I-7 two haze values | One `--haze`, used by the scene fog too |
| I-8, P-2 fonts | Self-hosted, subset, three weights |
| A-1 stars | `--gold-text`, with the count in words |
| A-2, A-3 STOP and GO | Shape plus colour; ink on `--go`, white on the darker `--stop` |
| A-4 eyebrow | `--laterite-text` |
| A-5 control labels | Paper controls with ink icons |
| A-6 small text | 12px minimum and a text size setting |
| A-7 flash | Softened under reduced motion |
| A-8 text over the scene | Everything sits on a paper chip |
| A-9 comfort | Labelled, with a word |
| A-10 focus | Focus moves into cards and back |
| A-11 pause | 48px |
| P-1 blur | Removed everywhere |
| P-3 minimap | 20 redraws a second at most |
| P-4 bars | `scaleX` transforms |

## 10. Build and review rule (P05-B step 4)

- Build **one screen first: the driving HUD at 360px portrait** (M2), then stop for the owner's review.
- For every screen: Playwright screenshots at 360px portrait and desktop width, a check against §2's two rules, and a note of anything that had to bend.
- Test legibility on a real phone outdoors before the M6 release.
