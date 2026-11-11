# Ọ̀nà Ilé: Design System (P05-A extraction)

Extracted 2026-11-11 from prototype v0.1 (`baba-keke/index.html`). No prototype code was changed.

**Status:** this is the *as-built* system. P05-B (design direction) extends it for the rebuild: signage, swipe controls, menus, settings and the full map. Until then, treat the tokens in §1–§5 as the source of truth and the findings in §10 as open.

**How it was checked:** every value is read from the prototype's CSS and script. Contrast ratios are computed with the WCAG formula, with translucent panels measured over the haze colour. The screens were viewed at phone portrait, phone landscape and desktop widths during the prototype's testing on 2026-11-07. No new screenshots were taken for this extraction.

---

## 1. Colour

There is one theme. The UI is dark panels and cream cards over a bright 3D scene, with no light/dark switch.

### UI tokens (copy-ready)

```css
:root {
  /* Brand */
  --keke: #F2C230;        /* keke yellow: money, primary buttons, player marker, pickups */
  --keke-deep: #C9971A;   /* button "lip" shadow, star glyphs, title accent */
  --green: #1F6B45;       /* keke stripe: the main call-to-action button */
  --green-deep: #124A2F;  /* lip shadow under the green button (inline today) */
  --laterite: #B5643F;    /* Ilorin red earth: eyebrow labels, notebook rules */
  --haze: #E6CFA8;        /* harmattan sky: page background, title wash */

  /* Surfaces and text */
  --ink: #1C1812;         /* text on cream; dark chips */
  --paper: #FFF6E4;       /* card surface; text on dark panels */
  --paper-2: #F3E6CB;     /* keycap background */
  --muted: #CDBEA4;       /* small labels on dark panels */
  --panel: rgba(28, 24, 18, .74);  /* HUD panel background */

  /* State */
  --stop: #D9432F;        /* warden STOP, bad toasts, low comfort */
  --go: #38A95B;          /* warden GO, good toasts, Respect bar */

  /* Extra colours used inline today (promote to tokens in the rebuild) */
  --text-secondary: #6F5F49;  /* character role line on cards */
  --text-help: #5E5040;       /* key help */
  --text-fine: #7A6A55;       /* fine print */
  --late: #FF9B87;            /* late timer on a dark panel */
  --route: #36D07A;           /* route line and destination on the minimap */
  --notebook: #FFB14A;        /* notebook place marker and light beam */
}
```

### Roles

| Role | Token | Notes |
|---|---|---|
| Page background | `--haze` | The scene fog uses a near-identical `#E3C9A0` |
| HUD surface | `--panel` | With a 6 px backdrop blur |
| Card surface | `--paper` | With ruled lines at 10% `--laterite` |
| Text on cards | `--ink` | Secondary `--text-secondary`, fine print `--text-fine` |
| Text on HUD | `--paper` | Labels `--muted` |
| Accent | `--keke` | Money, primary action, "you" |
| Main call to action | `--green` | One per screen ("Start driving") |
| Success / go | `--go` | |
| Error / stop | `--stop` | |
| Warning / late | `--late` | |
| Border | none | Borders are drawn as inset box-shadows (see §4) |

### World palette (3D scene and minimap)

| Use | Values |
|---|---|
| Sky and fog | `#E3C9A0` (fog from 55 m to 420 m; 300 m in low-detail mode) |
| Building walls | `#EADCC0 #DCBF92 #CF9A5C #B9C7A3 #A9C6D6 #F0EBE0 #E3B3A1 #C7835C #D8D0B0 #BFA98A #E9D39B` |
| Roofs (zinc and rust) | `#9AA0A4 #8A5236 #6E7A82 #B7AEA0 #7F8B8F #A0643F` |
| Kiosks | `#2F7FC1 #E0B92F #C0392B #3A9A5B #E67E22 #8E44AD #16A085` |
| Traffic cars | `#F1F1EE #B9BCC0 #6D1F2B #24477A #1B1B1B #B08A3E #E3E1DA` |
| Minimap ground | `#C79466` |
| Minimap markers | Route and destination `--route`. Pickups `--keke`. Notebook places `--notebook`. Wardens `--stop` or `--go` with a white ring. All others are ringed in `--ink` |

---

## 2. Typography

```css
:root {
  --font-display: 'Baloo 2', 'Arial Rounded MT Bold', system-ui, sans-serif;
  --font-body: 'Nunito', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
}
```

- **Loading today:** a Google Fonts stylesheet (Baloo 2 at 600 and 800; Nunito at 400, 600, 700 and 800). **The rebuild self-hosts both** (PRIV-10). Baloo 2 weight 600 is loaded but never used, so drop it.
- Both families were chosen because they render Yoruba diacritics (Ọ̀, ẹ, ṣ, tone marks).
- Numbers that change use `font-variant-numeric: tabular-nums`.

| Style | Family | Size | Weight | Line height | Other |
|---|---|---|---|---|---|
| Game title (h1) | Display | `clamp(44px, 9vw, 68px)` | 800 | 0.95 | `text-wrap: balance` |
| Screen heading (h2) | Display | 30px | 800 | default | |
| Money | Display | 28px (23px under 700 px wide) | 800 | 1 | `--keke` |
| Character name | Display | 21px | 800 | 1 | |
| Speed | Display | 20px | 800 | | Unit in body 12px/800 |
| Trip destination | Display | 18px | 800 | 1.1 | |
| Button | Display | 16.5px (photo button 17px) | 800 | 1.1 | |
| Dialogue | Body | 16.5px | 600 | 1.45 | Max 65 characters wide |
| Lede | Body | 16px | 600 | 1.45 | Max 52 characters wide |
| Toast | Body | 14.5px | 700 | 1.3 | |
| Detail table | Body | 14px | 400, totals 800 | 1.4 | Total row 16px |
| HUD value | Body | 13px | 800 | | |
| Goal, warden, role | Body | 12.5px | 700–800 | 1.25 | |
| Eyebrow | Body | 11.5px | 800 | | Uppercase, `letter-spacing: .11em` |
| HUD label | Body | 10.5px | 800 | | Uppercase, `letter-spacing: .09em` |
| Fine print | Body | 11.5px | 400 | | |

---

## 3. Spacing and layout

- **Layout idea:** the 3D view fills the screen. The HUD floats in the corners "like a keke dashboard". Conversation and menus are cream cards.
- **Safe areas:** every edge uses `max(<gutter>, env(safe-area-inset-*))`. The side gutter is 16px; top and bottom are 10–12px.
- **Spacing in use:** 2, 3, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 16, 18, 22 and 24 px. This is not a scale (see §10). Proposed scale for the rebuild: `4, 8, 12, 16, 24, 32`.
- **Widths:** card `min(560px, 100%)`; stats panel `min(250px, 44vw)`; trip panel 220–360px; toasts up to 460px.
- **Minimap:** a 150px circle; 112px under 700 px wide; 104px when the screen is under 480 px tall.
- **Card position:** dialogue cards sit at the bottom of the screen. The title and pause cards are centred.
- **Breakpoints:**
  - `max-width: 700px`: compact HUD.
  - `max-width: 520px` with touch: speed and the photo button move above the controls.
  - `max-height: 480px` (landscape phones): the goal line hides and toasts move up.
- **Pointer rule:** the HUD layer ignores taps (`pointer-events: none`), and only buttons opt back in. This matters for swipe-to-drive (ACC-3).

---

## 4. Shape and depth

```css
:root {
  --radius-chip: 6px;      /* STOP/GO chip, keycaps (5px today) */
  --radius-button: 12px;   /* buttons, toasts */
  --radius-panel: 14px;    /* HUD panels */
  --radius-card: 18px;     /* cards */
  --radius-pedal: 24px;    /* gas (24px) and brake (22px today) */
  --radius-pill: 99px;     /* bars, photo button; round controls use 50% */

  --shadow-panel: 0 3px 14px rgba(0,0,0,.25);
  --shadow-card: 0 10px 40px rgba(0,0,0,.35);
  --shadow-chip: 0 2px 8px rgba(0,0,0,.3);
  --shadow-map: 0 0 0 3px rgba(255,246,228,.9), 0 4px 16px rgba(0,0,0,.3);
  --lip-keke: 0 3px 0 var(--keke-deep);    /* the "pressable" button lip */
  --lip-green: 0 3px 0 var(--green-deep);
  --lip-photo: 0 4px 0 var(--keke-deep), 0 8px 18px rgba(0,0,0,.25);
}
```

- **Borders** are inset shadows, never `border`:
  - outline button: `inset 0 0 0 2px rgba(28,24,18,.35)`;
  - touch controls: `inset 0 0 0 2px rgba(255,246,228,.35)`;
  - toasts: `inset 0 0 0 2px` in `--go` or `--stop`.
- **Blur:** `backdrop-filter: blur(6px)` on HUD panels only (stats, trip, warden). Toasts and controls have none.
- **Card texture:** ruled notebook lines, `repeating-linear-gradient(transparent 0 27px, rgba(181,100,63,.10) 27px 28px)`.
- **Avatar:** a 50px circle in the character's colour with their initial, and an inner bottom shade of `inset 0 -4px 0 rgba(0,0,0,.18)`.

---

## 5. Motion

| Animation | Duration and easing | Trigger | Reduced motion |
|---|---|---|---|
| Toast "pop" (rises 8px, scales .96 to 1, fades in) | 250ms ease-out | A toast appears | Off |
| Progress bars (width) | 350ms ease | A value changes | Off |
| Button press (moves down 2px) | Instant | `:active` | Kept (tiny) |
| Photo flash (white, opacity .9 to 0) | 600ms ease-out | Taking a notebook photo | **Not handled** (see §10) |
| Camera shake | Up to 0.5 m, decays in about 0.3 s | Collisions | Off (the script checks the setting) |
| Minimap rotation | Every frame | The player turns | Not handled; arguably essential |

```css
:root {
  --dur-fast: 250ms;
  --dur-base: 350ms;
  --dur-flash: 600ms;
  --ease-out: ease-out;
}
```

---

## 6. Components

| Component | Look | Behaviour |
|---|---|---|
| **Primary button** `.btn` | `--keke` fill, `--ink` text, 12px radius, 11×16px padding, keke lip | Presses down 2px. Focus ring: 3px `--keke` outline, 2px offset |
| **Call-to-action** `.btn.green` | `--green` fill, `--paper` text, green lip | One per screen |
| **Outline button** `.btn.alt` | Transparent, 2px inset ink outline | Secondary actions |
| **Photo button** | Pill, `--keke`, 17px text, deeper lip and drop shadow | Appears only near a notebook place |
| **HUD panel** `.panel` | `--panel`, blur, 14px radius | Never takes taps |
| **Stats panel** | Label and value rows; money large in `--keke`; 7px bars | Bars animate |
| **Progress bar** `.bar` | 7px pill on a 16% paper track. Fill `--keke`; Respect `--go`; comfort a red-yellow-green gradient | |
| **Trip panel** | Centred at the top: passenger label, destination, distance · time · fare, comfort bar | The timer turns `--late` when late |
| **Warden chip** | Name plus a STOP or GO chip (white on `--stop` or `--go`) | Shown near a warden |
| **Minimap** | Circle with a cream ring, rotating with heading, and a floating "N" tag | Edge dots point to off-map targets |
| **Toast** | Dark block with a 12px radius, centred at 34% height. Good and bad variants are ringed green or red | Stacks; pops in |
| **Dialogue card** | Cream ruled card at the bottom: avatar, name, role, line, optional table (dashed row rules, bold right column), star row, buttons | `role="dialog"`, `aria-live="polite"` |
| **Title and pause cards** | Centred card: eyebrow, big title, lede, buttons, key help, fine print | The title sits on a haze gradient wash |
| **Touch controls** | Left: two 74px round steer buttons. Right: 54px horn, 74px brake (red tint), 82×96px gas (green tint). Translucent, with a light inset ring | The pressed state turns `--keke` |
| **Keycap** `kbd` | `--paper-2`, 5px radius, inner bottom shade | Key help on desktop only |
| **Fatal error** | Centred ink text on haze | Shown if the engine or map fails to load |
| Inputs, data tables, navigation, empty and loading states | **Don't exist yet** | P05-B designs them: settings, full map, challenge board, save code, loaders |

---

## 7. Icons and imagery

- **Icons:** only two inline SVG chevrons (24px viewBox, filled, `currentColor`) for steering. Everything else is text ("GAS", "BRAKE", "HORN", "II" for pause, "N" for north) or a glyph (★ for stars).
- **Characters:** coloured circles with an initial. Portraits come later (PRD art direction).
- **World art:** flat-shaded low-poly shapes with vertex colours, plus canvas-drawn sprites for the coin, the notebook and the STOP/GO signs.

---

## 8. Signature moments

1. **The cream notebook card.** Dialogue looks like a page from Baba's notebook: ruled laterite lines, ink text, a round character badge. It ties the UI to the story's central object.
2. **Chunky "lipped" buttons in keke yellow and stripe green.** They look pressable, and they are the colours of the vehicle itself.
3. **The round, rotating minimap with a cream ring and a floating N.** It reads as a dashboard dial.
4. **Harmattan haze everywhere.** The page background, the title wash and the scene fog share one warm colour, so the UI and the world feel like one place.

## 9. Personality

**Warm, dusty, playful, handmade, local.**
- **Warm and dusty:** haze, laterite and paper tones instead of white, grey or black.
- **Playful:** the rounded Baloo 2 display face, lipped buttons, star glyphs.
- **Handmade:** notebook rules, dashed table lines, inset shading instead of crisp borders.
- **Local:** the palette comes from the keke (yellow and green) and from Ilorin's earth and sky.

---

## 10. Findings

Nothing here is fixed in the prototype. Each item is input for P05-B and the M1–M2 rebuild.

### Inconsistencies

| # | Issue | Suggested clean-up |
|---|---|---|
| I-1 | Three near-identical muted browns on cream: `#6F5F49`, `#5E5040`, `#7A6A55` | Two tokens: `--text-secondary` and `--text-fine` |
| I-2 | Three "go" greens (`--go #38A95B`, route `#36D07A`, sign `#5BE38A`) and two reds (`--stop #D9432F`, `#C0392B`) | One green and one red for state, plus one named `--route` |
| I-3 | Radii of 5, 6, 12, 14, 18, 22 and 24 px | The six radius tokens in §4 |
| I-4 | Spacing uses 16 different values | The 4-based scale in §3 |
| I-5 | Font sizes include 10.5, 11.5, 12.5, 14.5 and 16.5 px | A whole-pixel type scale |
| I-6 | Inline styles on the pause heading and one eyebrow. `#124A2F`, `#FF9B87` and `#fff` are hard-coded | Promote to tokens and classes |
| I-7 | The scene haze `#E3C9A0` differs slightly from `--haze #E6CFA8` | Use one value |
| I-8 | Baloo 2 weight 600 is downloaded but unused | Load 800 only |

### Accessibility

| # | Issue | Evidence | Suggested fix |
|---|---|---|---|
| A-1 | Star rating and title accent in `--keke-deep` on cream | Contrast 2.47:1 (large text and graphics need 3:1) | A darker gold, about `#9A7208`, or ink stars |
| A-2 | White "GO" on `--go` | 3.0:1 at 12.5px bold (needs 4.5:1). STOP on `--stop` is 4.38:1, also just short | Ink text on `--go`, or darker fills |
| A-3 | **STOP and GO differ mainly by colour** | Red and green chips, red and green minimap dots | Add shape: an octagon for STOP, an arrow or circle for GO (PRD ACC-2 already requires it) |
| A-4 | Eyebrow in `--laterite` on cream | 4.02:1 at 11.5px (needs 4.5:1) | A darker laterite for text, about `#9A4F2E` |
| A-5 | "BRAKE" and "GAS" labels on tinted controls | About 3.8:1 over haze, and it varies with the scene behind | More opaque fills, or icons with a dark backing |
| A-6 | Small text: 10.5px labels, 11.5px fine print, 10.5px map credit | Hard to read on a phone in sunlight | 12px minimum. PRD ACC-2 adds a text size setting |
| A-7 | The photo flash ignores reduced motion | Full-screen white at 90% | Skip or soften it when reduced motion is set |
| A-8 | Text sits directly on the live scene (speed, map credit) | Ink on haze is 11.7:1, but buildings pass behind it | Give both a small backing chip |
| A-9 | The comfort bar's meaning is only in a `title` tooltip | Hover-only, so it's invisible on touch | A visible "Comfort" label |
| A-10 | The dialogue card has no focus management | Focus isn't moved into the card or trapped there | Move focus to the first button, and return it on close |
| A-11 | The pause button is 34px | Under the 44px touch-target minimum | 44px |

**Passing:**
- ink on paper: 16.5:1;
- paper on the HUD panel: 8.4:1;
- labels on the panel: 4.9:1;
- money on the panel: 5.4:1;
- ink on the keke button: 10.5:1;
- paper on the green button: 6.0:1;
- every button has a visible focus ring.

### Performance on mid-range Android

| # | Concern | Suggested fix |
|---|---|---|
| P-1 | `backdrop-filter: blur(6px)` on three HUD panels over a WebGL canvas that redraws every frame. The browser has to re-blur each frame, which is costly in Android WebView [not measured on a device] | Drop the blur and raise the panel opacity to about .82, or keep blur only in the high-quality setting |
| P-2 | Five font files from a third-party CDN delay first paint and need a connection | Self-host two or three WOFF2 files, subset to Latin plus Yoruba marks, with `font-display: swap` |
| P-3 | The minimap canvas redraws every frame at 300×300 | Redraw at 15–20 fps, or only when the player has moved |
| P-4 | Bar width transitions cause layout work | Animate `transform: scaleX()` instead |
