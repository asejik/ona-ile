"""
Build a compact, game-ready zone file from an OpenStreetMap JSON export.

Usage:
    python build_zone.py <osm map.json> <output zone.json | zone.js> [overrides.json]

The optional overrides file holds hand-checked fixes (road names, area names); see
content/zones/<id>.overrides.json. Junctions, name plates and signposts (NAV-2, NAV-3) are
computed only when an overrides file is given.

The OSM export can be downloaded with:
    https://api.openstreetmap.org/api/0.6/map.json?bbox=LEFT,BOTTOM,RIGHT,TOP

Map data (c) OpenStreetMap contributors, ODbL 1.0. https://www.openstreetmap.org/copyright
The game must show that credit wherever this data is used.
"""
import difflib
import json
import math
import random
import re
import sys
from collections import defaultdict

# ---- Zone settings (Prologue / Stage 1: Post Office + Unity Road) ----------
BBOX = (4.550, 8.476, 4.572, 8.494)  # left, bottom, right, top (lon/lat)
SCALE = 0.65  # "compressed Ilorin": shrink real distances so trips stay snappy
FLOOR_H = 2.9  # metres per storey in game units

ROAD_TYPES = {
    "trunk": 12.0, "trunk_link": 7.5,
    "primary": 10.5, "primary_link": 7.0,
    "secondary": 9.0, "secondary_link": 6.5,
    "tertiary": 8.0, "tertiary_link": 6.0,
    "unclassified": 6.5, "residential": 6.0, "living_street": 5.5,
}

# Pickup / drop-off spots. Public places and areas only (no brand chains).
# Each entry: game label -> substring to find in the OSM name.
SPOTS = [
    ("Post Office Terminus", "Post office terminal car park"),
    ("General Post Office", "General Post Office"),
    ("Unity Road Bus Park", "Kasmag Bus Pack"),
    ("Sadiku Hospital", "Sadiku Hospital"),
    ("Yoruba Road Market", "Yoruba Road Market"),
    ("Obo Market", "Obo Market"),
    ("Computer Village", "Computer Village"),
    ("Radio Kwara", "Radio Kwara"),
    ("High Court", "High Court of Justice"),
    ("NYSC Secretariat", "NYSC Kwara State Secretariat"),
    ("A Division Police", "A Division Police Station"),
    ("St Joseph's College", "St. Joseph Centenary"),
    ("Maraba", "Maraba"),
    ("Lajorin Junction", "Lajonrin Junction"),
    ("Ita Amodu Mosque", "Ita Amodu General Mosque, Old Yidi Road"),
    ("Circular Hotel", "Circular Hotel"),
    ("Olalomi Hospital", "Olalomi Hospital"),
    ("Challenge Shopping Complex", "Challenge shopping complex"),
    ("Charis Shopping Complex", "Charis Shopping Complex"),
    ("Balogun Fulani Road", "Balogun Fulani Microfinance"),
]

# Places for Baba's notebook (the Memory Book). Label, OSM match, Baba's note.
NOTEBOOK = [
    ("General Post Office", "General Post Office",
     "Before phones, the whole city came here to send letters. I carried many of them. Some I never delivered."),
    ("Radio Kwara", "Radio Kwara",
     "Every morning Tafa and I listened to Radio Kwara in the 504. He sang along. Badly."),
    ("Yoruba Road Market", "Yoruba Road Market Ilorin",
     "Iya Basira sold the best ewa here. She gave me credit when nobody else would."),
]


# ---- Junctions and signposts (NAV-2, NAV-3) --------------------------------
# A signpost blade names the first place a road leads to: follow the road from the junction (same
# name first, else the straightest way on) for up to WALK_MAX game metres and take the first named
# place, area or roundabout passed.
WALK_MAX = 800.0
TURN_MAX = math.radians(70)  # a bend sharper than this ends the walk (the road has ended at a T)
NEAR_PLACE = 45.0  # passing within this of a place counts as reaching it
NEAR_AREA = 90.0
NOT_HERE = 60.0  # a place this close to the junction is where you already are, not where it leads
CLUSTER = 25.0  # junction points closer than this are one junction
CLEAR = 30.0  # an exit's direction is measured where the road is this far from the junction centre
MERGE_DEG = 35  # exits closer in direction than this are the same way out


# ---- Street-name check from addresses -----------------------------------
# Shops, banks and offices often carry their street in an address ("Union Bank, Challenge Road, ...").
# Those clues confirm or dispute the names on OSM road lines, and name streets OSM left unnamed.
CLUE_NEAR = 60.0  # a clue this close to a road can be about that road (addresses sit back from it)
INFER_NEAR = 30.0  # an unnamed street takes a name only from clues this close
SAME_NAME = 0.82  # spelling similarity above which two names are the same street
SUFFIX = {"rd": "Road", "road": "Road", "way": "Way", "st": "Street", "street": "Street", "close": "Close",
          "avenue": "Avenue", "ave": "Avenue", "crescent": "Crescent", "lane": "Lane"}
STREET_RE = re.compile(
    r"^(?:no\.?\s*\d+[a-z]?\s+|[a-z]?\d+[a-z]?\s+)?([a-z][a-z'\-]*(?:\s+[a-z][a-z'\-]*){0,3})\s+"
    r"(rd|road|way|st|street|close|avenue|ave|crescent|lane)\.?$", re.I)


def street_clues(els, proj, nodes):
    """(street name, x, y) for every address-like mention of a street on a non-road feature."""
    out = []
    for e in els:
        t = e.get("tags", {})
        if not t or t.get("highway"):
            continue
        texts = [t.get("addr:street", "")]
        for k in ("name", "addr:full", "description"):
            texts += [p for p in t.get(k, "").replace(";", ",").split(",")]
        found = set()
        for part in texts:
            part = part.strip()
            if not part or "+" in part:
                continue
            m = STREET_RE.match(part)
            if not m:
                continue
            words = m.group(1)
            if re.search(r"\b(opp|opposite|beside|behind|near|along|by)\b", words, re.I):
                continue
            found.add(" ".join(w[:1].upper() + w[1:] for w in words.split()) + " " + SUFFIX[m.group(2).lower()])
        if not found:
            continue
        if e["type"] == "node":
            x, y = proj(e)
        else:
            ps = [proj(nodes[n]) for n in e.get("nodes", []) if n in nodes]
            if not ps:
                continue
            x, y = sum(p[0] for p in ps) / len(ps), sum(p[1] for p in ps) / len(ps)
        out += [(n, x, y) for n in sorted(found)]
    return out


def name_key(name):
    return re.sub(r"[^a-z ]", "", name.lower().replace("'", "")).strip()


def same_street(a, b):
    return difflib.SequenceMatcher(None, name_key(a), name_key(b)).ratio() >= SAME_NAME


def seg_dist(px, py, a, b):
    dx, dy = b[0] - a[0], b[1] - a[1]
    L = dx * dx + dy * dy
    t = 0 if L == 0 else max(0.0, min(1.0, ((px - a[0]) * dx + (py - a[1]) * dy) / L))
    return math.hypot(px - (a[0] + t * dx), py - (a[1] + t * dy))


def road_dist(r, out_nodes, x, y):
    pts = [out_nodes[i] for i in r["p"]]
    return min(seg_dist(x, y, a, b) for a, b in zip(pts, pts[1:]))


def check_names(roads, out_nodes, clues, owner_names):
    """Names unnamed streets from nearby addresses (marking them "ns": "a") and returns a report per name."""
    named = [r for r in roads if r["n"]]
    near_named = []  # for each clue: is it explained by a named road close by?
    for name, x, y in clues:
        near_named.append(any(same_street(name, r["n"]) and road_dist(r, out_nodes, x, y) < CLUE_NEAR for r in named))

    # Unnamed streets: a name needs 2+ agreeing clues close by that no named road already explains.
    inferred = defaultdict(int)
    for r in roads:
        if r["n"] or r.get("rb"):
            continue
        votes = [c[0] for c, explained in zip(clues, near_named)
                 if not explained and road_dist(r, out_nodes, c[1], c[2]) < INFER_NEAR]
        if len(votes) < 2:
            continue
        best = max(votes, key=lambda v: sum(same_street(v, w) for w in votes))
        agree = sum(same_street(best, w) for w in votes)
        if agree >= 2 and agree * 3 >= len(votes) * 2:
            # A spelling variant of a road OSM already names ("Emirs Road") is that road.
            best = next((o["n"] for o in named if same_street(best, o["n"])), best)
            r["n"] = best
            r["ns"] = "a"
            inferred[best] += 1

    report = []
    for name in sorted({r["n"] for r in roads if r["n"]}):
        mine = [r for r in roads if r["n"] == name]
        near_clues = [c for c in clues if any(road_dist(r, out_nodes, c[1], c[2]) < CLUE_NEAR for r in mine)]
        agree = sum(same_street(name, c[0]) for c in near_clues)
        others = defaultdict(int)
        for c in near_clues:
            # A clue for another street that runs close by (the main road at a corner) is no dispute.
            if not same_street(name, c[0]) and not any(
                    r2["n"] != name and same_street(c[0], r2["n"]) and road_dist(r2, out_nodes, c[1], c[2]) < CLUE_NEAR
                    for r2 in roads if r2["n"]):
                others[c[0]] += 1
        rival, rival_n = max(others.items(), key=lambda kv: kv[1]) if others else ("", 0)
        if name in owner_names:
            verdict = "owner"
        elif name in inferred and not any(r.get("ns") is None for r in mine):
            verdict = "inferred"
        elif rival_n >= 3 and rival_n >= 2 * agree:
            verdict = "disputed"
        elif agree:
            verdict = "confirmed"
        else:
            verdict = "unconfirmed"
        entry = {"name": name, "verdict": verdict, "agree": agree}
        if rival_n:
            entry["rival"], entry["rivalCount"] = rival, rival_n
        report.append(entry)
    return report


def build_junctions(out_nodes, roads, roundabouts, targets):
    adj = defaultdict(list)
    for ri, r in enumerate(roads):
        for a, b in zip(r["p"], r["p"][1:]):
            if a != b:
                adj[a].append((b, ri))
                adj[b].append((a, ri))
    ring = {i for r in roads if r.get("rb") for i in r["p"]}

    def dist(a, b):
        return math.hypot(a[0] - b[0], a[1] - b[1])

    def rb_of(i):
        return min(range(len(roundabouts)), key=lambda k: dist(out_nodes[i], (roundabouts[k]["x"], roundabouts[k]["y"])))

    ring_rb = {i: rb_of(i) for i in ring} if roundabouts else {}

    def head(a, b):
        return math.atan2(b[1] - a[1], b[0] - a[0])

    def turn(h1, h2):
        return abs((h2 - h1 + math.pi) % (2 * math.pi) - math.pi)

    def walk(centre, members, start, nxt, ri, home_rb):
        """Follows the road out of a junction. Returns (heading out, place it leads to, distance)."""
        name = roads[ri]["n"]
        prev, cur, d, seen = start, nxt, dist(out_nodes[start], centre), set(members)
        out_h = None
        while True:
            p = out_nodes[cur]
            d += dist(p, out_nodes[prev])
            if out_h is None and dist(p, centre) >= CLEAR:
                out_h = head(centre, p)
            if d > WALK_MAX:
                break
            if cur in ring_rb and ring_rb[cur] != home_rb:
                # An unnamed roundabout says nothing on a sign; name it in the overrides file.
                rb = roundabouts[ring_rb[cur]]
                rb_name = rb["name"]
                if rb_name != "Roundabout" and dist(centre, (rb["x"], rb["y"])) > NOT_HERE:
                    return out_h if out_h is not None else head(centre, p), rb_name, d
                break
            for t in targets:
                if dist(p, (t["x"], t["y"])) < t["r"] and dist(centre, (t["x"], t["y"])) > NOT_HERE:
                    return out_h if out_h is not None else head(centre, p), t["name"], d
            seen.add(cur)
            h = head(out_nodes[prev], p)
            options = [(nb, r2) for nb, r2 in adj[cur] if nb not in seen]
            if not options:
                break
            same = [o for o in options if name and roads[o[1]]["n"] == name]
            nb, r2 = min(same or options, key=lambda o: turn(h, head(p, out_nodes[o[0]])))
            if turn(h, head(p, out_nodes[nb])) > TURN_MAX:
                break
            prev, cur = cur, nb
            if roads[r2]["n"]:
                name = roads[r2]["n"]
        if out_h is None:
            out_h = head(centre, out_nodes[cur])
        return out_h, "", 0

    def exits_of(centre, members, home_rb):
        raw = []
        for i in sorted(members):
            for nb, ri in adj[i]:
                if nb in members or (home_rb >= 0 and nb in ring):
                    continue
                h, to, d = walk(centre, members, i, nb, ri, home_rb)
                raw.append({"h": round(math.degrees(h)) % 360, "road": roads[ri]["n"], "to": to, "d": round(d)})
        # One exit per direction: the two carriageways of a divided road, and links that lead back out
        # through a neighbouring part of the same junction, collapse into one.
        merged = []
        for e in sorted(raw, key=lambda e: (e["to"] == "", e["road"] == "", e["d"])):
            def apart(m):
                return abs((e["h"] - m["h"] + 180) % 360 - 180)

            if any(apart(m) < MERGE_DEG or (e["to"] and m["to"] == e["to"] and m["road"] == e["road"] and apart(m) < 60)
                   for m in merged):
                continue
            merged.append(e)
        out = []
        for e in sorted(merged, key=lambda e: e["h"]):
            x = {"h": e["h"], "road": e["road"]}
            if e["to"]:
                x["to"], x["d"] = e["to"], e["d"]
            out.append(x)
        return out

    # Ordinary junctions: three or more ways meet. Points closer than CLUSTER are one junction
    # (divided roads draw each carriageway, so one real crossing is several points).
    points = [i for i in sorted(adj) if i not in ring and len({nb for nb, _ in adj[i]}) >= 3]
    parent = {i: i for i in points}

    def root(i):
        while parent[i] != i:
            parent[i] = parent[parent[i]]
            i = parent[i]
        return i

    for a_i, a in enumerate(points):
        for b in points[a_i + 1:]:
            if dist(out_nodes[a], out_nodes[b]) < CLUSTER:
                parent[root(a)] = root(b)
    groups = defaultdict(list)
    for i in points:
        groups[root(i)].append(i)

    junctions = []
    for members in sorted(groups.values(), key=lambda g: min(g)):
        plates = sorted({roads[ri]["n"] for i in members for _, ri in adj[i] if roads[ri]["n"]})
        if not plates:
            continue
        cx = sum(out_nodes[i][0] for i in members) / len(members)
        cy = sum(out_nodes[i][1] for i in members) / len(members)
        exits = exits_of((cx, cy), set(members), -1)
        if len(exits) < 3:
            continue
        junctions.append({"x": round(cx, 1), "y": round(cy, 1), "plates": plates, "exits": exits})
    # Roundabouts: one junction each, with an exit for every road leaving the ring.
    for k, rb in enumerate(roundabouts):
        members = {n for n, kk in ring_rb.items() if kk == k}
        plates = sorted({roads[ri]["n"] for i in members for nb, ri in adj[i] if nb not in ring and roads[ri]["n"]})
        exits = exits_of((rb["x"], rb["y"]), members, k)
        if exits:
            junctions.append({"x": rb["x"], "y": rb["y"], "rb": k, "plates": plates, "exits": exits})
    return junctions


# ---------------- Potholes (REAL-5) -------------------------------------
POTHOLE_SEED = 20261121
POTHOLE_EVERY_MINOR = 110.0  # game metres between potholes on side streets
POTHOLE_EVERY_MAJOR = 380.0  # main roads (10 m wide or more) are kept in better repair
POTHOLE_GAP = 18.0  # no two potholes closer than this
POTHOLE_CLEAR_JUNCTION = 22.0  # none in the middle of a junction
POTHOLE_CLEAR_ROUNDABOUT = 15.0  # none on or right beside a roundabout


def place_potholes(out_nodes, roads, roundabouts, junctions):
    """Potholes along the roads, the same on every build: [x, y, radius, deep (0 or 1)]."""
    rnd = random.Random(POTHOLE_SEED)
    out = []
    for r in roads:
        if r.get("rb"):
            continue
        every = POTHOLE_EVERY_MAJOR if r["w"] >= 10 else POTHOLE_EVERY_MINOR
        pts = [out_nodes[i] for i in r["p"]]
        nxt = rnd.uniform(0.3, 1.0) * every
        run = 0.0
        for a, b in zip(pts, pts[1:]):
            dx, dy = b[0] - a[0], b[1] - a[1]
            seg = math.hypot(dx, dy)
            while seg > 0 and run + seg >= nxt:
                t = (nxt - run) / seg
                nxt += every * rnd.uniform(0.7, 1.3)
                rad = rnd.uniform(0.7, 1.2)
                deep = 1 if rnd.random() < 0.3 else 0
                side = rnd.uniform(-1, 1)
                room = r["w"] / 2 - rad - 0.6
                if room <= 0:
                    continue
                ux, uy = dx / seg, dy / seg
                x = a[0] + dx * t - uy * side * room
                y = a[1] + dy * t + ux * side * room
                if any(math.hypot(x - j["x"], y - j["y"]) < POTHOLE_CLEAR_JUNCTION for j in junctions):
                    continue
                if any(math.hypot(x - rb["x"], y - rb["y"]) < rb["r"] + POTHOLE_CLEAR_ROUNDABOUT for rb in roundabouts):
                    continue
                if any(math.hypot(x - q[0], y - q[1]) < POTHOLE_GAP for q in out):
                    continue
                out.append([round(x, 1), round(y, 1), round(rad, 2), deep])
            run += seg
    return out


def main(src, dst, overrides_path=None):
    overrides = json.load(open(overrides_path, encoding="utf-8")) if overrides_path else {}
    name_fixes = overrides.get("roadNames", {})
    data = json.load(open(src, encoding="utf-8"))
    els = data["elements"]
    nodes = {e["id"]: e for e in els if e["type"] == "node"}
    ways = [e for e in els if e["type"] == "way"]

    lon0 = (BBOX[0] + BBOX[2]) / 2
    lat0 = (BBOX[1] + BBOX[3]) / 2
    kx = math.cos(math.radians(lat0)) * 111320.0 * SCALE
    ky = 110540.0 * SCALE

    def proj(n):
        return ((n["lon"] - lon0) * kx, (n["lat"] - lat0) * ky)

    def inside(n, m=0.0):
        return (BBOX[0] - m <= n["lon"] <= BBOX[2] + m) and (BBOX[1] - m <= n["lat"] <= BBOX[3] + m)

    # ---------------- Roads -----------------------------------------------
    node_index = {}
    out_nodes = []

    def idx(nid):
        if nid not in node_index:
            x, y = proj(nodes[nid])
            node_index[nid] = len(out_nodes)
            out_nodes.append([round(x, 1), round(y, 1)])
        return node_index[nid]

    def clean_name(name):
        if not name:
            return ""
        if "+" in name or "Mosque" in name:
            return ""
        name = name.split(",")[0].strip()
        fixes = {"Amadu Bello Way": "Ahmadu Bello Way", "Offa road": "Offa Road",
                 "Sulu Gambari road": "Sulu Gambari Road", "Sulu Gambari": "Sulu Gambari Road",
                 "Lajorin": "Lajorin Road", "Yoruba": "Yoruba Road"}
        name = fixes.get(name, name)
        return name_fixes.get(name, name)

    roads = []
    roundabouts = []
    for w in ways:
        t = w.get("tags", {})
        hw = t.get("highway")
        is_rb = t.get("junction") in ("roundabout", "circular")
        if hw not in ROAD_TYPES and not (is_rb and hw):
            continue
        width = ROAD_TYPES.get(hw, 7.0)
        ids = [n for n in w["nodes"] if n in nodes]
        # split into pieces that stay inside the zone
        piece = []
        pieces = []
        for nid in ids:
            if inside(nodes[nid], 0.0005):
                piece.append(nid)
            else:
                if len(piece) > 1:
                    pieces.append(piece)
                piece = []
        if len(piece) > 1:
            pieces.append(piece)
        for p in pieces:
            roads.append({
                "n": clean_name(t.get("name")),
                "w": width,
                "p": [idx(n) for n in p],
                **({"rb": 1} if is_rb else {}),
                **({"ow": 1} if t.get("oneway") == "yes" else {}),
            })
        if is_rb and ids:
            pts = [proj(nodes[n]) for n in ids]
            cx = sum(p[0] for p in pts) / len(pts)
            cy = sum(p[1] for p in pts) / len(pts)
            r = sum(math.hypot(p[0] - cx, p[1] - cy) for p in pts) / len(pts)
            roundabouts.append({"x": round(cx, 1), "y": round(cy, 1), "r": round(r, 1), "ids": set(ids)})

    name_report = None
    if overrides_path:
        owner_names = set(name_fixes.values())
        name_report = check_names(roads, out_nodes, street_clues(els, proj, nodes), owner_names)

    # name roundabouts from the roads that touch them
    for rb in roundabouts:
        names = []
        for w in ways:
            t = w.get("tags", {})
            if t.get("highway") in ROAD_TYPES and t.get("junction") is None:
                if rb["ids"].intersection(w["nodes"]):
                    nm = clean_name(t.get("name"))
                    if nm and nm not in names:
                        names.append(nm)
        rb["roads"] = names[:3]
        del rb["ids"]
    # The roundabout next to the Post Office terminus is the Post Office Roundabout.
    term = None
    for e in els:
        if e["type"] == "node" and "Post office terminal car park" in e.get("tags", {}).get("name", ""):
            term = proj(e)
    if term:
        best = min(roundabouts, key=lambda r: math.hypot(r["x"] - term[0], r["y"] - term[1]))
        best["name"] = "Post Office Roundabout"
    for k, rb in enumerate(roundabouts):
        if str(k) in overrides.get("roundaboutNames", {}):
            rb["name"] = overrides["roundaboutNames"][str(k)]
        if "name" not in rb:
            rb["name"] = (" / ".join(rb["roads"][:2]) + " Roundabout") if rb["roads"] else "Roundabout"

    # spatial grid of road segments for clearance tests
    CELL = 20.0
    grid = {}
    for r in roads:
        hw2 = r["w"] / 2
        pts = [out_nodes[i] for i in r["p"]]
        for a, b in zip(pts, pts[1:]):
            x0, x1 = sorted((a[0], b[0]))
            y0, y1 = sorted((a[1], b[1]))
            for gx in range(int(math.floor((x0 - hw2) / CELL)), int(math.floor((x1 + hw2) / CELL)) + 1):
                for gy in range(int(math.floor((y0 - hw2) / CELL)), int(math.floor((y1 + hw2) / CELL)) + 1):
                    grid.setdefault((gx, gy), []).append((a, b, hw2))

    def road_dist(x, y):
        best = 1e9
        for a, b, hw2 in grid.get((int(math.floor(x / CELL)), int(math.floor(y / CELL))), []):
            dx, dy = b[0] - a[0], b[1] - a[1]
            L = dx * dx + dy * dy
            t = 0 if L == 0 else max(0, min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / L))
            d = math.hypot(x - (a[0] + t * dx), y - (a[1] + t * dy)) - hw2
            best = min(best, d)
        return best

    # ---------------- Buildings -------------------------------------------
    rnd = random.Random(7)
    buildings = []
    dropped = 0
    for w in ways:
        t = w.get("tags", {})
        if "building" not in t:
            continue
        ids = [n for n in w["nodes"] if n in nodes]
        if len(ids) < 4 or ids[0] != ids[-1]:
            continue
        if not all(inside(nodes[n]) for n in ids):
            continue
        pts = [proj(nodes[n]) for n in ids[:-1]]
        # area (shoelace); skip slivers
        area = 0.5 * sum(pts[i][0] * pts[(i + 1) % len(pts)][1] - pts[(i + 1) % len(pts)][0] * pts[i][1]
                         for i in range(len(pts)))
        if abs(area) < 6:
            continue
        if area < 0:
            pts.reverse()  # store counter-clockwise
        cx = sum(p[0] for p in pts) / len(pts)
        cy = sum(p[1] for p in pts) / len(pts)
        if road_dist(cx, cy) < 1.0 or any(road_dist(p[0], p[1]) < 0.6 for p in pts):
            dropped += 1
            continue
        lv = t.get("building:levels")
        try:
            levels = max(1, min(8, int(float(lv))))
        except (TypeError, ValueError):
            roll = rnd.random()
            levels = 1 if roll < 0.62 else 2 if roll < 0.9 else 3 if roll < 0.97 else 4
        flat = []
        for p in pts:
            flat += [round(p[0], 1), round(p[1], 1)]
        buildings.append([levels] + flat)

    # ---------------- Spots & notebook ------------------------------------
    named = []
    for e in els:
        nm = e.get("tags", {}).get("name")
        if not nm:
            continue
        if e["type"] == "node":
            named.append((nm, proj(e)))
        elif e["type"] == "way":
            ns = [nodes[n] for n in e["nodes"] if n in nodes]
            if ns:
                ps = [proj(n) for n in ns]
                named.append((nm, (sum(p[0] for p in ps) / len(ps), sum(p[1] for p in ps) / len(ps))))

    def find(sub):
        for nm, p in named:
            if sub.lower() in nm.lower():
                return p
        return None

    spots = []
    for label, sub in SPOTS:
        p = find(sub)
        if p and abs(p[0]) < 900 and abs(p[1]) < 900:
            spots.append({"name": label, "x": round(p[0], 1), "y": round(p[1], 1)})
        else:
            print("spot not found:", label, file=sys.stderr)
    notebook = []
    for label, sub, note in NOTEBOOK:
        p = find(sub)
        if p:
            notebook.append({"name": label, "x": round(p[0], 1), "y": round(p[1], 1), "note": note})
        else:
            print("notebook place not found:", label, file=sys.stderr)

    junctions = None
    if overrides_path:
        targets = [{"name": s["name"], "x": s["x"], "y": s["y"], "r": NEAR_PLACE} for s in spots]
        targets += [{"name": n["name"], "x": n["x"], "y": n["y"], "r": NEAR_PLACE}
                    for n in notebook if n["name"] not in {s["name"] for s in spots}]
        for a in overrides.get("areas", []):
            ax, ay = proj({"lon": a["lon"], "lat": a["lat"]})
            targets.append({"name": a["name"], "x": round(ax, 1), "y": round(ay, 1), "r": NEAR_AREA})
        junctions = build_junctions(out_nodes, roads, roundabouts, targets)

    xs = [n[0] for n in out_nodes]
    ys = [n[1] for n in out_nodes]
    zone = {
        "id": "zone1-post-office",
        "title": "Post Office & Unity Road",
        "scale": SCALE,
        "floorH": FLOOR_H,
        "bounds": [round(min(xs)), round(min(ys)), round(max(xs)), round(max(ys))],
        "attribution": "Map data © OpenStreetMap contributors (ODbL)",
        "nodes": out_nodes,
        "roads": roads,
        "roundabouts": roundabouts,
        "buildings": buildings,
        "spots": spots,
        "notebook": notebook,
    }
    if junctions is not None:
        zone["junctions"] = junctions
        zone["potholes"] = place_potholes(out_nodes, roads, roundabouts, junctions)
    if name_report is not None:
        # How sure each street name is; read by the junction review page, not by the game.
        zone["nameCheck"] = name_report
    # .json output is the rebuild's format; .js keeps the prototype's window.ZONE file.
    with open(dst, "w", encoding="utf-8", newline="\n") as f:
        if dst.endswith(".json"):
            json.dump(zone, f, separators=(",", ":"))
            f.write("\n")
        else:
            f.write("// Generated by tools/build_zone.py. Map data (c) OpenStreetMap contributors, ODbL 1.0.\n")
            f.write("window.ZONE = ")
            json.dump(zone, f, separators=(",", ":"))
            f.write(";\n")
    print(f"nodes={len(out_nodes)} roads={len(roads)} roundabouts={len(roundabouts)} "
          f"buildings={len(buildings)} (dropped {dropped} on roads) spots={len(spots)} notebook={len(notebook)}"
          + (f" junctions={len(junctions)} potholes={len(zone['potholes'])}" if junctions is not None else ""))
    for rb in roundabouts:
        print("  roundabout:", rb["name"], rb["x"], rb["y"], "r=", rb["r"])


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else None)
