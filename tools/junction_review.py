"""
Writes the junction review page for the M3 exit check: every junction's name plates and signposts
(as computed by build_zone.py) with a small map and a link to the same spot on OpenStreetMap, so a
local can compare them with the real streets.

Usage:
    python -I tools/junction_review.py public/zones/zone1-post-office.json <out.html>

The page is a review aid, not part of the game; it is published as a private artifact, not committed.
Map data (c) OpenStreetMap contributors, ODbL 1.0.
"""
import html
import json
import math
import sys

# Must match tools/build_zone.py (zone 1).
BBOX = (4.550, 8.476, 4.572, 8.494)
LON0 = (BBOX[0] + BBOX[2]) / 2
LAT0 = (BBOX[1] + BBOX[3]) / 2
VIEW = 90.0  # game metres either side of the junction in the mini map
COMPASS = ["east", "north-east", "north", "north-west", "west", "south-west", "south", "south-east"]


def main(src, dst):
    z = json.load(open(src, encoding="utf-8"))
    scale = z["scale"]
    kx = math.cos(math.radians(LAT0)) * 111320.0 * scale
    ky = 110540.0 * scale
    nodes = z["nodes"]
    roads = z["roads"]

    def lonlat(x, y):
        return LON0 + x / kx, LAT0 + y / ky

    def svg(j):
        cx, cy = j["x"], j["y"]
        parts = []
        for r in roads:
            pts = [nodes[i] for i in r["p"]]
            if not any(abs(p[0] - cx) < VIEW * 1.4 and abs(p[1] - cy) < VIEW * 1.4 for p in pts):
                continue
            d = " ".join(f"{p[0] - cx:.1f},{cy - p[1]:.1f}" for p in pts)
            cls = "rd named" if r["n"] else "rd"
            parts.append(f'<polyline class="{cls}" points="{d}" stroke-width="{r["w"]:.1f}"/>')
        for e in j["exits"]:
            a = math.radians(e["h"])
            x1, y1 = math.cos(a) * 22, -math.sin(a) * 22
            x2, y2 = math.cos(a) * 62, -math.sin(a) * 62
            cls = "ex to" if e.get("to") else "ex"
            parts.append(f'<line class="{cls}" x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" marker-end="url(#arr)"/>')
        parts.append('<circle class="dot" r="5"/>')
        parts.append(f'<text class="n" x="{-VIEW + 4}" y="{-VIEW + 14}">N ↑</text>')
        return (f'<svg viewBox="{-VIEW} {-VIEW} {VIEW * 2} {VIEW * 2}" role="img" '
                f'aria-label="Map of the roads around this junction">{"".join(parts)}</svg>')

    def where(h):
        return COMPASS[round(h / 45) % 8]

    verdict = {e["name"]: e for e in z.get("nameCheck", [])}
    RANK = {"disputed": 0, "unconfirmed": 2, "inferred": 3, "confirmed": 3, "owner": 3}

    def level(j):
        # doubtful: a plate name the addresses dispute; check: an OSM name no address mentions.
        worst = min((RANK.get(verdict.get(p, {}).get("verdict", "unconfirmed"), 2) for p in j["plates"]), default=3)
        return "doubtful" if worst == 0 else "check" if worst < 3 else "confident"

    ORDER = {"doubtful": 0, "check": 1, "confident": 2}
    junctions = sorted(
        z["junctions"],
        key=lambda j: (ORDER[level(j)], j.get("rb") is None, -len(j["plates"]), j["x"]),
    )
    counts = {k: sum(1 for j in junctions if level(j) == k) for k in ORDER}
    cards = []
    for n, j in enumerate(junctions, 1):
        lon, lat = lonlat(j["x"], j["y"])
        osm = f"https://www.openstreetmap.org/?mlat={lat:.6f}&mlon={lon:.6f}#map=19/{lat:.6f}/{lon:.6f}"
        # Visual reference only (docs/prompts/project/real_world_setting.md): look, never copy into the game.
        gmaps = f"https://www.google.com/maps/search/?api=1&query={lat:.6f},{lon:.6f}"
        street = f"https://www.google.com/maps/@?api=1&map_action=pano&viewpoint={lat:.6f},{lon:.6f}"
        bing = f"https://www.bing.com/maps?cp={lat:.6f}~{lon:.6f}&lvl=19&style=h"
        mapillary = f"https://www.mapillary.com/app/?lat={lat:.6f}&lng={lon:.6f}&z=18"
        rb = j.get("rb")
        title = z["roundabouts"][rb]["name"] if rb is not None else " / ".join(j["plates"])
        def plate(p):
            v = verdict.get(p, {})
            why = {"disputed": f'addresses say “{html.escape(v.get("rival", ""))}”',
                   "inferred": "name from nearby addresses", "unconfirmed": "no address clues",
                   "confirmed": f'{v.get("agree", 0)} addresses agree', "owner": "you confirmed"}.get(
                v.get("verdict", "unconfirmed"), "")
            return f'<span class="plate">{html.escape(p)}</span><span class="why">{why}</span>'

        plates = "".join(f'<span class="pl">{plate(p)}</span>' for p in j["plates"])
        lv = level(j)
        badge = {"doubtful": "Doubtful name", "check": "Worth a look", "confident": "Names confirmed"}[lv]
        rows = []
        for e in j["exits"]:
            road = html.escape(e["road"]) if e["road"] else '<span class="muted">unnamed road</span>'
            to = (f'<span class="blade">→ {html.escape(e["to"])}</span> <span class="muted">{round(e["d"] / scale)} m</span>'
                  if e.get("to") else '<span class="muted">no sign (no named place within reach)</span>')
            rows.append(f"<tr><td>{where(e['h'])}</td><td>{road}</td><td>{to}</td></tr>")
        search = html.escape(" ".join([title] + j["plates"] + [e.get("to", "") for e in j["exits"]]).lower())
        cards.append(f'''
<article class="jn" id="j{n}" data-n="{n}" data-level="{lv}" data-search="{search}">
  <header><span class="num">J{n}</span><h2>{html.escape(title)}</h2><span class="lv {lv}">{badge}</span></header>
  <div class="body">
    <div class="map">{svg(j)}</div>
    <div class="info">
      <p class="label">Name plates</p>
      <div class="plates">{plates}</div>
      <p class="label">Signposts, by the way each road leaves</p>
      <div class="tablewrap"><table><thead><tr><th>Leaves to the</th><th>Road</th><th>Sign says</th></tr></thead>
      <tbody>{"".join(rows)}</tbody></table></div>
      <p class="links">Look at this spot:
        <a href="{street}" target="_blank" rel="noopener">Street View</a>
        <a href="{gmaps}" target="_blank" rel="noopener">Google Maps</a>
        <a href="{bing}" target="_blank" rel="noopener">Bing aerial</a>
        <a href="{mapillary}" target="_blank" rel="noopener">Mapillary photos</a>
        <a href="{osm}" target="_blank" rel="noopener">OpenStreetMap</a></p>
      <div class="verdict" role="group" aria-label="Verdict for J{n}">
        <button type="button" data-v="ok" aria-pressed="false">Matches</button>
        <button type="button" data-v="bad" aria-pressed="false">Something's wrong</button>
      </div>
      <label class="note" for="note{n}">What's wrong? (optional)</label>
      <input id="note{n}" class="noteinput" type="text" placeholder="e.g. the north road is really Taiwo Road">
    </div>
  </div>
</article>''')

    rbs = z["roundabouts"]
    unnamed = [(k, r) for k, r in enumerate(rbs) if r["name"] == "Roundabout"]
    long_names = [(k, r) for k, r in enumerate(rbs) if " / " in r["name"]]

    def rb_link(r):
        lon, lat = lonlat(r["x"], r["y"])
        return f"https://www.openstreetmap.org/?mlat={lat:.6f}&mlon={lon:.6f}#map=18/{lat:.6f}/{lon:.6f}"

    questions = []
    for k, r in unnamed:
        questions.append(f'<li>Roundabout {k} has no name in the map data. What do people call it? '
                         f'<a href="{rb_link(r)}" target="_blank" rel="noopener">See it on OpenStreetMap</a></li>')
    for k, r in long_names:
        questions.append(f'<li>Roundabout {k} is called “{html.escape(r["name"])}” for now. Too long for a sign: '
                         f'what do locals call it? <a href="{rb_link(r)}" target="_blank" rel="noopener">See it</a></li>')
    for e in z.get("nameCheck", []):
        if e["verdict"] == "disputed":
            questions.append(f'<li>The map calls it “{html.escape(e["name"])}”, but {e["rivalCount"]} nearby addresses say '
                             f'“{html.escape(e["rival"])}”. What is it called on the street?</li>')
    questions.append('<li>Any neighbourhood names signs should point to (GRA, Oko Erin, Sabo Oke…)? '
                     'Name them and roughly where they start.</li>')

    summary = (f'<b>{counts["confident"]}</b> junctions have names the addresses confirm, '
               f'<b>{counts["check"]}</b> have a name no address mentions (worth a look), and '
               f'<b>{counts["doubtful"]}</b> have a disputed name. Doubtful ones come first.')
    page = TEMPLATE.replace("{{SUMMARY}}", summary).replace("{{CARDS}}", "".join(cards)).replace("{{COUNT}}", str(len(junctions))) \
        .replace("{{QUESTIONS}}", "".join(questions))
    with open(dst, "w", encoding="utf-8", newline="\n") as f:
        f.write(page)
    print(f"{len(junctions)} junctions -> {dst}")


TEMPLATE = r'''<title>Ọ̀nà Ilé Junction Check</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@800&family=Nunito:wght@600;800&display=swap">
<style>
/* Layout: one column of junction cards, each a mini map beside its plates and signposts (stacked on phones). */
:root {
  --paper: #fff6e4; --paper-2: #f3e6cb; --ink: #1c1812; --muted: #6f5f49; --rule: rgba(181,100,63,.18);
  --sign: #0e5a36; --sign-fg: #ffffff; --keke: #f2c230; --road: #8a7d6b; --road-named: #4a4034;
  --bad: #a82a18; --good: #1f6b45; --bg: #e6cfa8;
  --display: 'Baloo 2', 'Arial Rounded MT Bold', system-ui, sans-serif;
  --body: 'Nunito', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
}
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) {
  --paper: #2a241c; --paper-2: #362e24; --ink: #f6ead2; --muted: #c4b294; --rule: rgba(242,194,48,.14);
  --sign: #157a4b; --road: #8f8270; --road-named: #e3d3b6; --bad: #ff8a73; --good: #7fd3a2; --bg: #1d1913; color-scheme: dark; } }
:root[data-theme="dark"] {
  --paper: #2a241c; --paper-2: #362e24; --ink: #f6ead2; --muted: #c4b294; --rule: rgba(242,194,48,.14);
  --sign: #157a4b; --road: #8f8270; --road-named: #e3d3b6; --bad: #ff8a73; --good: #7fd3a2; --bg: #1d1913; color-scheme: dark; }
body { background: var(--bg); color: var(--ink); font: 600 15px/1.5 var(--body); }
.wrap { max-width: 960px; margin: 0 auto; padding-block: 20px 48px;
  padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); }
h1 { font: 800 clamp(28px, 6vw, 40px)/1.05 var(--display); margin: 0 0 8px; text-wrap: balance; }
h2 { font: 800 19px/1.2 var(--display); margin: 0; text-wrap: balance; }
.lede { max-width: 65ch; margin: 0 0 12px; }
.panel { background: var(--paper); border-radius: 14px; box-shadow: inset 0 0 0 1.5px var(--ink); padding: 16px; margin-bottom: 16px; }
.panel h2 { margin-bottom: 8px; }
.panel ol, .panel ul { margin: 0; padding-left: 20px; display: grid; gap: 6px; }
.tools { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; margin: 16px 0; }
.tools input { flex: 1 1 220px; min-width: 0; min-height: 44px; border-radius: 10px; border: 0; padding: 0 12px;
  background: var(--paper); color: var(--ink); box-shadow: inset 0 0 0 1.5px var(--ink); font: 600 15px var(--body); }
button { font: 800 15px var(--display); color: var(--ink); min-height: 44px; padding: 0 14px; border-radius: 10px; border: 0;
  background: transparent; box-shadow: inset 0 0 0 2px var(--muted); cursor: pointer; }
button.primary { background: var(--keke); color: #1c1812; box-shadow: 0 3px 0 #c9971a; }
button:focus-visible, a:focus-visible, input:focus-visible { outline: 3px solid var(--ink); outline-offset: 2px; }
.count { font-variant-numeric: tabular-nums; color: var(--muted); }
.jn { background: var(--paper); border-radius: 14px; box-shadow: inset 0 0 0 1.5px var(--ink); margin-bottom: 14px; overflow: hidden; }
.jn > header { display: flex; gap: 10px; align-items: center; padding: 12px 16px; border-bottom: 1px solid var(--rule); }
.num { font: 800 14px var(--display); background: var(--ink); color: var(--paper); border-radius: 6px; padding: 1px 8px; font-variant-numeric: tabular-nums; }
.body { display: grid; grid-template-columns: 220px 1fr; gap: 16px; padding: 16px; }
.info { min-width: 0; }
.map svg { width: 100%; max-width: 220px; aspect-ratio: 1; display: block; background: var(--paper-2); border-radius: 10px; }
.rd { fill: none; stroke: var(--road); stroke-linecap: round; stroke-linejoin: round; opacity: .55; }
.rd.named { stroke: var(--road-named); opacity: .8; }
.ex { stroke: var(--muted); stroke-width: 3; }
.ex.to { stroke: var(--sign); stroke-width: 4; }
.dot { fill: var(--keke); stroke: var(--ink); stroke-width: 2; }
.n { fill: var(--muted); font: 800 11px var(--body); }
#arr path { fill: var(--sign); }
.label { font-size: 12px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; color: var(--muted); margin: 0 0 6px; }
.plates { display: flex; flex-wrap: wrap; gap: 8px 12px; margin-bottom: 14px; }
.pl { display: inline-flex; flex-direction: column; gap: 2px; }
.why { font-size: 12px; color: var(--muted); }
.lv { margin-left: auto; font-size: 12px; font-weight: 800; padding: 2px 8px; border-radius: 999px; white-space: nowrap; box-shadow: inset 0 0 0 1.5px currentColor; }
.lv.doubtful { color: var(--bad); }
.lv.check { color: var(--muted); }
.lv.confident { color: var(--good); }
.jn > header { flex-wrap: wrap; }
.plate { background: var(--sign); color: var(--sign-fg); font: 800 14px var(--display); padding: 2px 10px; border-radius: 4px; box-shadow: inset 0 0 0 2px var(--sign-fg), 0 0 0 1px var(--sign); }
.blade { background: var(--sign); color: var(--sign-fg); font: 800 13px var(--display); padding: 1px 8px; border-radius: 3px; white-space: nowrap; }
.tablewrap { overflow-x: auto; margin-bottom: 10px; }
table { border-collapse: collapse; width: 100%; font-size: 14px; }
th { text-align: left; font-size: 12px; color: var(--muted); font-weight: 800; padding: 4px 8px 4px 0; }
td { padding: 6px 8px 6px 0; border-top: 1px dashed var(--rule); vertical-align: top; }
.muted { color: var(--muted); font-size: 13px; }
a { color: var(--ink); }
.links { display: flex; flex-wrap: wrap; gap: 4px 12px; align-items: baseline; }
.links a { display: inline-block; padding: 6px 0; font-weight: 800; }
.verdict { display: flex; gap: 8px; flex-wrap: wrap; margin: 10px 0 8px; }
.verdict button[data-v="ok"][aria-pressed="true"] { background: var(--good); color: var(--paper); box-shadow: none; }
.verdict button[data-v="bad"][aria-pressed="true"] { background: var(--bad); color: var(--paper); box-shadow: none; }
.note { display: block; font-size: 13px; color: var(--muted); margin-bottom: 4px; }
.noteinput { width: 100%; box-sizing: border-box; min-height: 40px; border-radius: 8px; border: 0; padding: 0 10px;
  background: var(--paper-2); color: var(--ink); box-shadow: inset 0 0 0 1px var(--muted); font: 600 14px var(--body); }
.status { min-height: 1.4em; color: var(--muted); }
footer { color: var(--muted); font-size: 13px; margin-top: 24px; }
@media (max-width: 560px) { .body { grid-template-columns: 1fr; } .map svg { max-width: 100%; } }
</style>
<div class="wrap">
  <h1>Junction check, Zone 1</h1>
  <p class="lede">These are the street name plates and signposts the game will put at each junction around the Post Office and Unity Road. Pick at least 5 junctions you know well, compare them with the real streets, and mark each one.</p>
  <section class="panel" aria-labelledby="auto">
    <h2 id="auto">Checked automatically</h2>
    <p>Shops, banks and offices in the map data often give their street in their address. Claude used those clues to confirm road names, name streets the map left unnamed, and flag names the addresses disagree with. {{SUMMARY}} You only need to look at the doubtful ones and a few worth a look.</p>
  </section>
  <section class="panel" aria-labelledby="howto">
    <h2 id="howto">How to check</h2>
    <ol>
      <li>Find a junction (search by road or place name below). You don't have to go there: open its <b>Street View</b> or <b>Google Maps</b> link and look around.</li>
      <li>Are the plates the right road names? Does each sign point the right way to that place? The small map has north at the top, like Google Maps.</li>
      <li>Tap <b>Matches</b> or <b>Something's wrong</b>, add a note if it's wrong.</li>
      <li>When you've done 5 or more, tap <b>Copy my results</b> and paste them to Claude.</li>
    </ol>
  </section>
  <p class="lede muted">Google, Bing and Mapillary are for looking only. If something differs, tell Claude what you saw or know; nothing is copied from those maps into the game. Street View may not cover every street in Ilorin; Bing aerial and Google's satellite view always show the road shapes.</p>
  <section class="panel" aria-labelledby="names">
    <h2 id="names">Name questions</h2>
    <ul>{{QUESTIONS}}</ul>
  </section>
  <div class="tools">
    <input id="q" type="search" placeholder="Search a road or place, e.g. Unity Road" aria-label="Search junctions">
    <button type="button" class="primary" id="copy">Copy my results</button>
    <span class="count" id="count">{{COUNT}} junctions</span>
  </div>
  <p class="status" id="status" role="status"></p>
  <svg width="0" height="0" aria-hidden="true" style="position:absolute"><defs><marker id="arr" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0 0L10 5L0 10z"/></marker></defs></svg>
  <main id="list">{{CARDS}}</main>
  <footer>Map data © OpenStreetMap contributors (ODbL). Distances are real-world metres along the road. The arrows on each map show where every road leaves; green ones carry a sign.</footer>
</div>
<script>
(() => {
  const KEY = 'junction-check-zone1';
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch { saved = {}; }
  const store = () => { try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch {} };
  const cards = [...document.querySelectorAll('.jn')];
  for (const card of cards) {
    const n = card.dataset.n;
    const btns = card.querySelectorAll('.verdict button');
    const note = card.querySelector('.noteinput');
    const paint = () => btns.forEach((b) => b.setAttribute('aria-pressed', String(saved[n]?.v === b.dataset.v)));
    if (saved[n]?.note) note.value = saved[n].note;
    paint();
    btns.forEach((b) => b.addEventListener('click', () => {
      saved[n] = { ...(saved[n] || {}), v: saved[n]?.v === b.dataset.v ? undefined : b.dataset.v };
      store(); paint();
    }));
    note.addEventListener('input', () => { saved[n] = { ...(saved[n] || {}), note: note.value }; store(); });
  }
  const q = document.getElementById('q');
  const count = document.getElementById('count');
  q.addEventListener('input', () => {
    const t = q.value.trim().toLowerCase();
    let shown = 0;
    for (const c of cards) { const ok = !t || c.dataset.search.includes(t); c.hidden = !ok; if (ok) shown++; }
    count.textContent = `${shown} of ${cards.length} junctions`;
  });
  const status = document.getElementById('status');
  document.getElementById('copy').addEventListener('click', () => {
    const lines = cards.filter((c) => saved[c.dataset.n]?.v).map((c) => {
      const s = saved[c.dataset.n];
      const name = c.querySelector('h2').textContent;
      return `J${c.dataset.n} ${name}: ${s.v === 'ok' ? 'matches' : 'wrong'}${s.note ? ` (${s.note})` : ''}`;
    });
    if (!lines.length) { status.textContent = 'Mark at least one junction first.'; return; }
    const text = `Junction check, Zone 1 (${lines.length} checked)\n` + lines.join('\n');
    const done = () => { status.textContent = `Copied ${lines.length} results. Paste them to Claude.`; };
    const fallback = () => {
      const ta = document.createElement('textarea'); ta.value = text; ta.className = 'noteinput'; ta.rows = Math.min(12, lines.length + 2);
      status.replaceChildren('Copy this text and paste it to Claude:', ta); ta.select();
    };
    try { navigator.clipboard.writeText(text).then(done, fallback); } catch { fallback(); }
  });
})();
</script>
'''

if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
