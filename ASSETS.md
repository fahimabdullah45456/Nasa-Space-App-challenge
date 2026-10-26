> **Current integration:** The application now uses the exact `earth.glb`, `mars.glb` and `moon.glb` extracted from `planet-glb-models.zip`. Their textures are embedded; the older scene texture files described below are no longer loaded by the application. See `PLANET-ASSETS.md`, `INTEGRATION.md` and `docs/integration/supplied-assets.json`. The model-only lab remains separate and unchanged.

# Asset provenance and usage

## User-supplied Earth GLB

- Original: `source-assets/EarthClouds_1_12756.glb`, 18,928,336 bytes, preserved without conversion.
- Official catalog matching the filename: [NASA Earth with Clouds 3D Model](https://science.nasa.gov/resource/earth-with-clouds-3d-model/).
- Catalog credit: NASA Visualization Technology Applications and Development (VTAD).
- Inspection: glTF 2 binary; `Cube.001` node; `Cube.002` mesh; one primitive/material (`Default OBJ`); embedded PNG images internally named `earth_norm.jpg` and `earthClouds_diff.jpg`, each 4096 × 3072. The names are source names, not assumptions about scene geometry.
- The base-color texture is a cloud-painted atlas, not a separate opacity map. No independent cloud geometry, cloud opacity or atmospheric material was found.
- Preserved as reference, not loaded on the first page. The browser downloads no 19 MB model. No supporting source texture was overwritten; embedded originals remain in the GLB. A texture inspection preview is provided in `docs/supplied-model-texture.png`.
- Source SHA-256 and inspection metadata: `docs/earth-model-inspection.json`. Remote/source byte identity was not separately verified.
- Consult [NASA image/media guidance](https://www.nasa.gov/nasa-brand-center/images-and-media/) before redistribution; NASA credits do not grant rights to protected insignia, third-party content or imply endorsement.

## Runtime planetary maps

Source catalog: [Solar System Scope Textures](https://www.solarsystemscope.com/textures/), credit **Solar System Scope / INOVE**, licensed [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/). Catalog describes its imagery/elevation basis in NASA data and its color adjustments; it also warns that unmapped gaps can include synthesized terrain. Do not describe these as entirely unmodified NASA scientific products.

| Runtime file                       | Verified source download                                                                          | Treatment                                                                    |
| ---------------------------------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `public/textures/earth-day.jpg`    | [8k_earth_daymap.jpg](https://www.solarsystemscope.com/textures/download/8k_earth_daymap.jpg)     | Resized to 4096 × 2048, JPEG re-encoded                                      |
| `public/textures/earth-clouds.jpg` | [2k_earth_clouds.jpg](https://www.solarsystemscope.com/textures/download/2k_earth_clouds.jpg)     | 2048 × 1024, grayscale opacity data used on separate sphere; JPEG re-encoded |
| `public/textures/earth-night.jpg`  | [2k_earth_nightmap.jpg](https://www.solarsystemscope.com/textures/download/2k_earth_nightmap.jpg) | 2048 × 1024, night-masked low-intensity emissive only                        |
| `public/textures/mars.jpg`         | [2k_mars.jpg](https://www.solarsystemscope.com/textures/download/2k_mars.jpg)                     | 2048 × 1024, re-encoded; material brightness moderated                       |
| `public/textures/moon.jpg`         | [2k_moon.jpg](https://www.solarsystemscope.com/textures/download/2k_moon.jpg)                     | 2048 × 1024, re-encoded, directionally lit                                   |

Color maps use sRGB; cloud opacity uses linear/no-color-space data. Horizontal wrapping is periodic and vertical wrapping clamped. No Figma screenshot or flat image plane supplies a planet. Shader atmosphere and sparse point stars are procedural 3D effects, not generated planetary textures.

The optional catalog links `2k_earth_normal_map.tif` and `2k_earth_specular_map.tif` returned HTTP 403 during preparation. Neither file is a production dependency. No imaginary filename, made-up elevation texture or silent cartoon fallback was introduced.

Visible attribution is available through the archive-credit button and scene-preference/explorer dialogs. Attribution, license URL and processing changes remain here for redistributors.

## Archive and branding from Figma

Approved frame: [Space Explorer — Forgotten Worlds, node 2:2](https://www.figma.com/design/E23CY1QfqgrtAoqgiIC0di?node-id=2-2). The request's `10:2` node was unavailable; the same approved, named frame created in the preceding work was inspected instead. The Figma document was not modified by this implementation task.

Original exported image crops:

- `archive/apollo-lrv.png`: NASA/JSC, AS15-88-11901.
- `archive/alsep.png`: NASA/JSC, AS12-47-6918.
- `archive/spirit.png`: NASA/JPL-Caltech/Cornell, PIA16442.
- `archive/opportunity.png`: NASA/JPL-Caltech/Cornell/ASU, PIA18079.

The source identifiers/credits are preserved in the data file and card titles. These are photographs, not generated replacement rover assets. Source archive: [NASA Images](https://images.nasa.gov/). Check NASA media guidance and any third-party rights before reuse.

`brand/orbit.svg` and `brand/compass.svg` are the original custom Space Explorer emblem exports. They are not NASA insignia.

## Type and icons

- Inter, distributed through `@fontsource/inter`, is locally hosted; see `docs/licenses/Inter-OFL.txt`.
- Lucide icons use lucide-react; see `docs/licenses/Lucide-ISC.txt`.
- Package licenses and exact versions remain in the npm dependency metadata/lockfile.
