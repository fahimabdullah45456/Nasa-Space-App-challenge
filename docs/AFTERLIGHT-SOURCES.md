# AFTERLIGHT source register

Mission content and asset provenance for the archive and field-site explorers. Links point to the original source records; page-level vehicle records in `src/data/vehicles.js` link the relevant material directly.

## Rover model files

| Vehicle(s) | Included file | Official record | Notes |
|---|---|---|---|
| Spirit / Opportunity | `public/models/rovers/mars/mer/spirit-opportunity.glb` | [NASA/JPL MER static rover model](https://science.nasa.gov/resource/spirit-and-opportunity-rover-3d-model/) | Official shared static model; 1 mesh. Component highlighting is intentionally unavailable. |
| Curiosity | `public/models/rovers/curiosity/curiosity.glb` | [NASA/JPL Curiosity static rover model](https://science.nasa.gov/resource/curiosity-rover-3d-model/) | Official static model; 1 mesh. Component highlighting is intentionally unavailable. |
| Perseverance | `public/models/rovers/perseverance/perseverance.glb` | [NASA/JPL Perseverance 3D model](https://science.nasa.gov/3d-resources/mars-2020-perseverance-rover/) | Official model with named geometry. The explorer maps only exact verified node names; 15 entries are exposed. |

The NASA/JPL source records and direct asset URLs are also stored in the vehicle data. The Perseverance GLB uses `KHR_draco_mesh_compression`; the locally bundled decoder in `public/draco/` is the glTF decoder distributed with Three.js examples under the [Apache 2.0 license](https://github.com/google/draco/blob/master/LICENSE), so this model does not depend on a remote decoder. No verified downloadable official model was found for the Apollo Lunar Roving Vehicle, Lunokhod 1, or Yutu-2. Those pages use archival or clearly labeled contextual imagery instead of inventing a model.

## Terrain meshes

The six included NASA terrain GLBs are derived from the STL files linked from NASA 3D resource pages: Spirit/Gusev, Opportunity/Meridiani, Curiosity/Gale, Apollo 15/Hadley–Apennine, Apollo 16/Descartes, and Apollo 17/Taurus–Littrow. The source checksum, download URL, original and reduced triangle counts, output size, and vertical-exaggeration statement for each are recorded in [`terrain/manifest.json`](terrain/manifest.json).

Conversion reduced triangle counts only. No projection, vertical scaling, texture painting, rover route, or coordinate marker was added. The browser rotates NASA's +Z-up height map into the viewer's +Y-up convention and applies neutral material shading for legibility; it does not rewrite the terrain file or add geographic data. NASA's published exaggeration notes are preserved in the UI; when a numeric value is not stated by NASA, AFTERLIGHT does not infer one. Jezero, Mare Imbrium, and Von Kármán do not have a verified NASA local terrain model in this build, so the explorer uses an existing planetary model as labeled geographic context, not as local terrain.

## Mission photographs

- Perseverance: `PIA26344-cheyava-selfie.jpg` — NASA/JPL-Caltech/MSSS; [mission record](https://science.nasa.gov/mission/mars-2020-perseverance/).
- Curiosity: `PIA16027-curiosity-deck.jpg` and `PIA26695-curiosity-flashlight.jpg` — NASA/JPL-Caltech and NASA/JPL-Caltech/MSSS respectively; [mission record](https://science.nasa.gov/mission/msl-curiosity/).
- Lunokhod 1: `PIA12967-lunar-reconnaissance.jpg` — NASA/GSFC/Arizona State University; [NASA Photojournal record](https://science.nasa.gov/photojournal/soviet-union-lunar-rovers/).
- Existing Apollo, Spirit, and Opportunity card images are retained with their credits in [`ASSETS.md`](../ASSETS.md) and the relevant vehicle records.
- Yutu-2: CNSA-originated images are not mirrored. The page's Moon texture is explicitly marked as illustrative contextual imagery, not a mission photograph; source/license: [Solar System Scope textures](https://www.solarsystemscope.com/textures/).

## Research sources

- Spirit: [NASA mission](https://science.nasa.gov/mission/mer-spirit/)
- Opportunity: [NASA mission](https://science.nasa.gov/mission/mer-opportunity/)
- Curiosity: [NASA mission](https://science.nasa.gov/mission/msl-curiosity/) · [instruments](https://science.nasa.gov/mission/msl-curiosity/science-instruments/)
- Perseverance: [NASA mission](https://science.nasa.gov/mission/mars-2020-perseverance/) · [components](https://science.nasa.gov/mission/mars-2020-perseverance/rover-components/) · [science](https://science.nasa.gov/mission/mars-2020-perseverance/science/)
- Apollo LRV: [NSSDCA technical summary](https://nssdc.gsfc.nasa.gov/planetary/lunar/apollo_lrv.html) · [lunar-site coordinate reference](https://nssdc.gsfc.nasa.gov/planetary/lunar/lunar_sites.html)
- Lunokhod 1: [NSSDCA Soviet lunar missions](https://nssdc.gsfc.nasa.gov/planetary/lunar/lunarussr.html) · [LROC rover location and traverse](https://lroc.im-ldi.com/images/402)
- Yutu-2: [CNSA landing record](https://www.cnsa.gov.cn/english/n6465652/n6465653/c6805231/content.html) · [CNSA payload record](https://www.cnsa.gov.cn/english/n6465652/n6465653/c6805105/content.html) · [LROC refined Chang'e 4 lander coordinates](https://lroc.im-ldi.com/images/1168)

Lunar coordinates identify their source reference (Apollo lunar-module site, Lunokhod landing or final parked site, or Chang'e 4 lander site). They are not used to fabricate a rover path or a marker on an unrelated terrain model. The Yutu-2 coordinates refer to the Chang'e 4 lander, not the rover's current position.
