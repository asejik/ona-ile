# SETTING: Real-World Setting, Map Data and Representation (supplement)

Stage: Blueprint and pre-launch | Run: sections 1–2 alongside P02; sections 3–6 alongside P14 before launch, and whenever a new zone, landmark or real institution is added | Output: docs/audits/real_world_setting_[YYYY-MM-DD].md report
Follow docs/prompts/AUDIT_STANDARD.md for context loading, rigor level, evidence, severity, reporting, and fixing. Fixes go through P06.

ROLE
Act as a producer who has shipped games set in real cities, working with a local cultural reader and a licensing-literate engineer.

OWNS:
- Licensing of the map data (OpenStreetMap, ODbL).
- Using other map sources (such as Google Maps) as reference only.
- Depicting real places, institutions, officials and communities.
- Religious and cultural sensitivity.
- Real brands and trademarks in the world.
- Where attribution is shown.

NOT HERE:
- Personal data of players: P03.
- Store content rating and listing rules: S1 (play_store_release.md).
- UI legibility of signs: P05.
- Game balance: P07.

TOOLS FIRST
- `python baba-keke/tools/build_zone.py` (the pipeline)
- `grep` over zone files and game content for names
- osm.org changeset history for the bbox
- A list of every named place, person and institution exported from the game content (SPOTS, NOTEBOOK, CAST, dialogue lines)

SECTIONS (mark N/A where they don't apply)

1. OpenStreetMap licence (ODbL 1.0)
   - **Attribution:** "© OpenStreetMap contributors" with a link to openstreetmap.org/copyright. It must be visible where the map is used: in-game credits or title, the web page, and the store description.
   - **Share-alike:** the shipped zone files (`zone*.js`) are a derived database. Because the game distributes them publicly, you must also offer that database under ODbL, or offer the method used to make it. Usually that means publishing `build_zone.py` and the bbox, or the zone files, with an ODbL notice. Decide which, and document it.
   - Your own art and code (models, textures, the game) are a "Produced Work". They don't become ODbL just by using the data. Confirm the boundary with the OSMF guidance.
   - The OSM extract date and bbox are recorded, so the data can be reproduced.

2. Other map and imagery sources
   - Google Maps, Street View and satellite imagery are used for **visual reference only**. No geometry is traced or copied, no screenshots are used as textures, and no place data is copied. Confirm the art workflow follows this, and note it in docs.
   - Any photo used as a texture or reference image is your own, or has a licence that allows it.
   - Hand-added places not in OSM (for example a missing junction name) are entered from your own local knowledge or a permitted source. Consider contributing them back to OSM.

3. Real institutions and officials
   - List every real institution shown: the Emir's palace, police (A Division), the NYSC, the High Court, hospitals, the post office, Radio Kwara, schools, mosques and churches.
   - None of them is shown doing anything illegal or degrading in a way that reads as a claim about the real body. For example, a police officer asking for a bribe is a sensitive portrayal: decide whether to make it generic or fictional.
   - No official logos, crests or uniforms copied closely enough to imply endorsement. Use generic insignia.
   - The Emir and the Emirate: treat the royal institution respectfully. Do not depict a real, named current ruler as a character without a deliberate decision.

4. Cultural and religious sensitivity
   - Ilorin is a predominantly Muslim, Yoruba city with Fulani and Hausa heritage. Have the story and dialogue reviewed by at least one Ilorin local reader for:
     - religious respect (prayer times, mosques, dress);
     - correct Yoruba and Ilorin-dialect usage and diacritics;
     - stereotypes of ethnic groups, keke drivers, wardens or market women.
   - Mosques and churches are collision-safe, show no comic damage, and get no slapstick near places of worship.
   - Festival or ceremony depictions, if ever added (Durbar, Eid), are researched and respectful.

5. Brands, trademarks and private people
   - No real company names, logos or shopfront branding without permission. Use fictional or generic shop names. (The pipeline already filters brand chains out of SPOTS; re-check after each zone build.)
   - No real private individuals are recognisable. Characters are fictional, and no real residents' names appear on shops or houses.
   - Real public figures are not depicted or named in dialogue.

6. Attribution and credits placement
   - The credits screen lists the map data (OSM, ODbL), fonts and their licences (Baloo 2 and Nunito, OFL), Three.js (MIT), sound sources, and the cultural readers (with their consent).
   - The store listing and the web page carry the OSM line.

SELF-CHECK I CAN DO MYSELF
- Open the game's credits. Can you see the OpenStreetMap line without searching?
- Read every passenger line and the notebook notes aloud to someone from Ilorin. Note anything they wince at.
- Look at five random building fronts in-game. Is there a real logo on any of them?

RULES
- When unsure whether a depiction of a real body is acceptable, make it generic or fictional. Don't argue it.
- Licence conclusions in this report are practical guidance, not legal advice. Flag uncertain items for the owner to verify.

SOURCES (checked 2026-11-07 from prior knowledge; re-verify at run time)
- OSM copyright and attribution: https://www.openstreetmap.org/copyright
- ODbL 1.0 text: https://opendatacommons.org/licenses/odbl/1-0/
- OSMF Produced Work guideline: https://osmfoundation.org/wiki/Licence/Community_Guidelines/Produced_Work_-_Guideline
- OSMF Attribution guidelines: https://osmfoundation.org/wiki/Licence/Attribution_Guidelines
- Google Maps Platform / Google Maps terms (reference-only rule): https://www.google.com/help/terms_maps/
