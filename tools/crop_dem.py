"""Crops a Copernicus DEM GLO-30 tile to Ilorin and writes it in a format the zone build reads with the
Python standard library alone (no numpy in CI).

Run once, by hand, when the crop changes (needs numpy and Pillow):
    python -I tools/crop_dem.py <cop30_N08_E004.tif> data/dem/ilorin_glo30

Output:
    <out>.i16   heights in decimetres, little-endian int16, row by row from the north-west corner
    <out>.json  where the grid sits: the centre of the first cell, the cell size, the grid size, the licence

The source tile is the Copernicus DEM GLO-30 public release for N08 E004 (1 arc-second cells, centres on
whole arc-seconds, lat 8-9 N and lon 4-5 E).
"""
import json
import sys

import numpy as np
from PIL import Image

Image.MAX_IMAGE_PIXELS = None

TILE_LON, TILE_LAT = 4, 9  # the tile's west edge and north edge
CELLS = 3600  # per degree
# Ilorin city and around: enough for all seven stages.
LON0, LON1, LAT0, LAT1 = 4.45, 4.65, 8.40, 8.58
ATTRIBUTION = (
    "Copernicus DEM GLO-30 © DLR e.V. 2010-2014 and © Airbus Defence and Space GmbH 2014-2018 "
    "provided under COPERNICUS by the European Union and ESA; all rights reserved"
)


def main(src, out):
    a = np.array(Image.open(src), dtype=np.float32)
    assert a.shape == (CELLS, CELLS), a.shape
    c0 = round((LON0 - TILE_LON) * CELLS)
    c1 = round((LON1 - TILE_LON) * CELLS)
    r0 = round((TILE_LAT - LAT1) * CELLS)
    r1 = round((TILE_LAT - LAT0) * CELLS)
    crop = a[r0:r1, c0:c1]
    dm = np.round(crop * 10).astype("<i2")
    dm.tofile(out + ".i16")
    meta = {
        "source": "Copernicus DEM GLO-30, tile Copernicus_DSM_COG_10_N08_00_E004_00_DEM",
        "attribution": ATTRIBUTION,
        "units": "decimetres above the EGM2008 geoid, int16 little-endian",
        "lon0": TILE_LON + c0 / CELLS,
        "lat0": TILE_LAT - r0 / CELLS,
        "step": 1 / CELLS,
        "cols": int(crop.shape[1]),
        "rows": int(crop.shape[0]),
    }
    with open(out + ".json", "w", encoding="utf-8", newline="\n") as f:
        json.dump(meta, f, indent=2)
        f.write("\n")
    print(f"{crop.shape[1]} x {crop.shape[0]} cells, {crop.min():.1f}-{crop.max():.1f} m")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
