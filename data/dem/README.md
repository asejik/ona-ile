# Heights: Copernicus DEM GLO-30, cropped to Ilorin

`ilorin_glo30.i16` holds ground heights for Ilorin (lon 4.45–4.65 E, lat 8.40–8.58 N), used by
`tools/build_zone.py` to give each zone its hills (M4c). `ilorin_glo30.json` says where the grid sits.

- **Source:** Copernicus DEM GLO-30 public release, tile N08 E004 (1 arc-second cells, about 30 m).
- **Licence:** free to use, copy and redistribute, including commercially, with this attribution:
  "Copernicus DEM GLO-30 © DLR e.V. 2010-2014 and © Airbus Defence and Space GmbH 2014-2018 provided under
  COPERNICUS by the European Union and ESA; all rights reserved". The game shows a short form on the title
  card next to the OpenStreetMap credit.
- **Format:** heights in decimetres, little-endian int16, row by row from the north-west cell. The first
  cell's centre is at (`lon0`, `lat0`); cells are `step` degrees apart. Heights are above the EGM2008 geoid.
- **It is a surface model:** it includes buildings and trees, so the zone build smooths it over about 150 m
  before use.
- **Regenerate** (needs numpy and Pillow, not used in CI):
  `python -I tools/crop_dem.py <cop30_N08_E004.tif> data/dem/ilorin_glo30`
