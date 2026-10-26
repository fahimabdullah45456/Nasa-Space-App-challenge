# Planet Lab — sources and reuse

## Solar System Scope / INOVE

Source catalog: https://www.solarsystemscope.com/textures/
License: Creative Commons Attribution 4.0 International, https://creativecommons.org/licenses/by/4.0/
Required credit: **Solar System Scope / INOVE**. Preserve attribution, source/license links and the description of processing changes when redistributing.

The provider bases maps on NASA imagery/elevation and adjusts color/saturation. The catalog warns that some unmapped gaps include synthesized fill. These are not entirely unmodified NASA scientific data.

| Runtime | Source filename at https://www.solarsystemscope.com/textures/download/ | Treatment |
| --- | --- | --- |
| earth-day.jpg, 8192x4096 | 8k_earth_daymap.jpg | sRGB JPEG re-encoding |
| earth-night.jpg, 4096x2048 | 8k_earth_nightmap.jpg | resized and re-encoded; shader dark-side mask |
| earth-clouds.png, 4096x2048 | 8k_earth_clouds.jpg | resized, grayscale transferred to alpha; white RGB |
| earth-normal.png, 2048x1024 | 2k_earth_normal_map.tif | preserved actual normal data as PNG; normal strength reduced |
| earth-roughness.png, 2048x1024 | 2k_earth_specular_map.tif | white ocean mask remapped to .33 roughness, land .86 |
| mars-color.jpg, 8192x4096 | 8k_mars.jpg | re-encoded; restrained material tint |

All listed source files were actually downloaded and inspected for format and dimensions. In this task, the normal/specular URLs succeeded (unlike their earlier availability during dashboard work).

## NASA Moon: aligned color and elevation

Catalog: https://svs.gsfc.nasa.gov/4720/
Credit: **NASA's Scientific Visualization Studio; Ernie Wright; LRO/LROC/LOLA teams**.

- Color source: https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/lroc_color_poles_8k.tif — 8192x4096 RGB, 2019 CGI Moon Kit product. Re-encoded as moon-color.jpg.
- Height source: https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/ldem_16_uint.tif — 5760x2880 unsigned 16-bit samples. Elevation in meters = sample * .5 - 10000, relative to 1737.4 km radius. Converted to a 4096x2048 tangent normal map using metric spherical derivatives, mild 1.5x relief and smooth polar attenuation; not treated as a color image.
- Both map products are centered at 0 degrees longitude. No arbitrary feature offsets or random crater synthesis.

NASA explains that the map is optimized for aesthetics, that color polar fill is lower-resolution, and that scientific applications should use instrument source data. The runtime is a visualization, not a scientific measurement product.

## Mars MOLA elevation

Data product: https://pds-geosciences.wustl.edu/mgs/urn-nasa-pds-mgs_mola_topography_derived/meg016/megt90n000eb.img
PDS4 label: https://pds-geosciences.wustl.edu/mgs/urn-nasa-pds-mgs_mola_topography_derived/meg016/megt90n000eb.xml
Catalog: https://pds-geosciences.wustl.edu/missions/mgs/megdr.html
Credit: **NASA/MGS/MOLA Science Team; NASA PDS Geosciences Node**.

The label was inspected: 5760 samples by 2880 lines, 16 pixels/degree, signed big-endian 16-bit integers, meters, central meridian 180 degrees, positive-east longitude. Read as >i2; rolled half a map width into -180..180 longitude alignment with the color map. Computed 4K normal data from actual heights at radius 3396 km, with 1.5x relief and smooth polar attenuation. No normal map was inferred from grayscale Mars color.

## Original NASA Earth GLB

User supplied: EarthClouds_1_12756.glb, 18,928,336 bytes.
Catalog: https://science.nasa.gov/resource/earth-with-clouds-3d-model/
Credit: NASA Visualization Technology Applications and Development (VTAD).
SHA-256: f0989772fa9ab1aeee32911df9b5da4ee1a938580414357ace51c9e05b5f3929

Preserved without conversion in the working project. One node (Cube.001), one mesh (Cube.002), one material. Two embedded 4096x3072 PNG images internally named earth_norm.jpg and earthClouds_diff.jpg. The latter is combined cloud/land color, not independent cloud opacity. No external data files, no separate cloud/atmospheric mesh. Preserved as reference, not downloaded by the preview or passed off as a newly exported model.

## Reuse notes

NASA media guidance: https://www.nasa.gov/nasa-brand-center/images-and-media/
NASA SVS usage guidance: https://svs.gsfc.nasa.gov/help/#faq
NASA/PDS scientific-source credits do not imply NASA endorsement, rights to NASA insignia, or rights to any third-party assets. Preserve instrument/source credits and consult linked guidance for the intended redistribution. No NASA logos or mission photographs are used by the model lab.

Runtime texture transformations, sizes and hashes are recorded in docs/planet-lab/runtime-manifest.json. GLBs embed processed versions of these textures; they carry the same attribution obligations. Source TIFF normal/specular data are not simply mislabeled grayscale normals. Locally processed normal maps are derived from measured elevation with the documented conversion.
