"""
Build a compact, game-ready zone file from an OpenStreetMap JSON export.

Usage:
    python build_zone.py <osm map.json> <output zone.json | zone.js>

The OSM export can be downloaded with:
    https://api.openstreetmap.org/api/0.6/map.json?bbox=LEFT,BOTTOM,RIGHT,TOP

Map data (c) OpenStreetMap contributors, ODbL 1.0. https://www.openstreetmap.org/copyright
The game must show that credit wherever this data is used.
"""
import json
import math
import random
import sys

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


def main(src, dst):
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
        return fixes.get(name, name)

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
    for rb in roundabouts:
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
          f"buildings={len(buildings)} (dropped {dropped} on roads) spots={len(spots)} notebook={len(notebook)}")
    for rb in roundabouts:
        print("  roundabout:", rb["name"], rb["x"], rb["y"], "r=", rb["r"])


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
