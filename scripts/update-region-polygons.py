#!/usr/bin/env python3
"""Regenerate regionPolygons outlines from regionDots in src/app/lib/mapPaths.ts.

Each regionPolygons `d` traces the boundary of the union of 8x8 cells centered on
each dot of the regionDots object with the same id (cell edges sit at dot-center +/- 4).
The boundary is walked keeping the filled region on the right at all times, so outer
rings come out clockwise and holes counter-clockwise -- which renders correctly under
SVG's default nonzero fill rule.

Workflow: edit the `d` of any regionDots object(s), then run this script. It compares
every polygon to the outline implied by its dots and rewrites ONLY the ones that no
longer match (i.e. the regions whose dots you just changed). regionDots is never touched.

Usage:
    python3 scripts/update-region-polygons.py            # rewrite mismatched polygons
    python3 scripts/update-region-polygons.py --check    # report mismatches, write nothing

Requires only the Python 3 standard library.
"""
import re
import sys
import os

SRC = os.path.join(os.path.dirname(__file__), "..", "src", "app", "lib", "mapPaths.ts")


def load():
    text = open(SRC).read()
    dots_idx = text.index("export const regionDots")
    poly_section = text[:dots_idx]
    dots_section = text[dots_idx:]
    dots = {}
    for m in re.finditer(r'\{\s*id:\s*"(\w+)",\s*fill:\s*"([^"]*)",\s*d:\s*"([^"]*)"\s*\}', dots_section):
        dots[m.group(1)] = m.group(3)
    polys = {}
    for m in re.finditer(r'\{\s*id:\s*"(\w+)",\s*color:\s*"([^"]*)",\s*d:\s*"([^"]*)"\s*\}', poly_section):
        polys[m.group(1)] = m.group(3)
    return text, poly_section, dots_section, dots, polys


def centers(d):
    return [(int(x), int(y)) for x, y in re.findall(r'M\s*(\d+),(\d+)', d)]


def _cw(d):
    x, y = d
    return (-y, x)


def _ccw(d):
    x, y = d
    return (y, -x)


def _neg(d):
    return (-d[0], -d[1])


def outline(cs):
    """Return list of vertex-loops outlining the union of 8x8 cells centered on cs."""
    occ = set(cs)
    edges = set()
    for (cx, cy) in cs:
        X0, X1, Y0, Y1 = cx - 4, cx + 4, cy - 4, cy + 4
        TL, TR, BR, BL = (X0, Y0), (X1, Y0), (X1, Y1), (X0, Y1)
        if (cx, cy - 8) not in occ:
            edges.add((TL, TR))   # top,    +x
        if (cx + 8, cy) not in occ:
            edges.add((TR, BR))   # right,  +y
        if (cx, cy + 8) not in occ:
            edges.add((BR, BL))   # bottom, -x
        if (cx - 8, cy) not in occ:
            edges.add((BL, TL))   # left,   -y
    remaining = set(edges)
    loops = []
    while remaining:
        s0, cur = next(iter(remaining))
        remaining.discard((s0, cur))
        d_in = ((cur[0] - s0[0]) // 8, (cur[1] - s0[1]) // 8)
        pts = [s0]
        while cur != s0:
            pts.append(cur)
            picked = None
            for dirn in (_cw(d_in), d_in, _ccw(d_in), _neg(d_in)):
                nxt = (cur[0] + dirn[0] * 8, cur[1] + dirn[1] * 8)
                if (cur, nxt) in remaining:
                    picked = (dirn, nxt)
                    break
            if picked is None:
                raise RuntimeError(f"dead end while tracing at {cur}")
            dirn, nxt = picked
            remaining.discard((cur, nxt))
            d_in, cur = dirn, nxt
        loops.append(pts)
    return loops


def loops_to_d(loops):
    parts = []
    for pts in loops:
        parts.append("M %d,%d " % pts[0] + " ".join("L %d,%d" % p for p in pts[1:]) + " Z")
    return " ".join(parts)


def unit_edges(d):
    """Undirected set of 8px edges for a polygon `d` (orientation-agnostic compare)."""
    es = set()
    for sub in d.split("Z"):
        pts = [(int(a), int(b)) for a, b in re.findall(r'(-?\d+),(-?\d+)', sub)]
        if len(pts) < 2:
            continue
        pts.append(pts[0])
        for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
            if x0 == x1:
                step = 8 if y1 > y0 else -8
                for y in range(y0, y1, step):
                    es.add(frozenset([(x0, y), (x0, y + step)]))
            elif y0 == y1:
                step = 8 if x1 > x0 else -8
                for x in range(x0, x1, step):
                    es.add(frozenset([(x, y0), (x + step, y0)]))
            else:
                raise RuntimeError("unexpected diagonal segment in polygon d")
    return es


def main():
    check_only = "--check" in sys.argv or "--dry-run" in sys.argv
    _, poly_section, dots_section, dots, polys = load()

    changed = []
    for rid, dd in dots.items():
        if rid not in polys:
            continue
        cs = centers(dd)
        want = unit_edges(loops_to_d(outline(cs))) if cs else set()
        have = unit_edges(polys[rid])
        if want != have:
            changed.append(rid)

    if not changed:
        print("All regionPolygons already match their regionDots. Nothing to do.")
        return

    print(("Would update" if check_only else "Updating") + f" {len(changed)} polygon(s): {', '.join(changed)}")
    if check_only:
        return

    new_poly = poly_section
    for rid in changed:
        newd = loops_to_d(outline(centers(dots[rid])))
        pat = re.compile(r'(\{\s*id:\s*"' + rid + r'",\s*color:\s*"[^"]*",\s*d:\s*")[^"]*(")')
        new_poly, n = pat.subn(lambda m: m.group(1) + newd + m.group(2), new_poly)
        if n != 1:
            raise SystemExit(f"{rid}: expected exactly 1 polygon to replace, found {n}")
    open(SRC, "w").write(new_poly + dots_section)
    print("Done.")


if __name__ == "__main__":
    main()
