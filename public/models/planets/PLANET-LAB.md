# Photorealistic Planet Model Lab

Three independent React Three Fiber components and portable GLB models. No dashboard, navigation bar, hero, missions, rover, terrain, backend or account system is part of this deliverable.

## Run the model-only preview

Node 20.19+ or 22.12+ / 24; npm.

```sh
npm ci
npm run lab
```

Open `/planet-lab.html` on the Vite URL. The preview contains three independent orbitable canvases against a plain dark background. Drag to orbit; wheel/pinch to zoom; right-drag to pan. There is no automatic camera travel. Each model can also be inspected alone:

- `/planet-lab.html?planet=Earth`
- `/planet-lab.html?planet=Mars`
- `/planet-lab.html?planet=Moon`

Add `&close` for close inspection, `&light=side` or `&light=reverse` for alternate sunlight, `&angle=1.7` for another longitude, or `&still` to stop rotation. `?planet=Earth&glb` loads the actual portable export instead of the specialized component. Model captions are the only persistent HTML content.

```sh
npm run build:planets
npm run preview:planets
npm run test:planets
```

The model-only static output is `planet-lab-dist/`. Serve that folder over HTTP; do not open the HTML via `file://`. The production entry is `/planet-lab.html`. Only planet assets are copied into this build.

## Integration into the existing application

Copy `src/planets/` and `public/textures/planets/` into your React/Vite application. Do not replace your App, router, dashboard or package configuration. The modules depend only on already-installed React, Three.js and React Three Fiber. Drei is used by the preview's orbit controls, not by the planet components. There is no GSAP dependency in the model implementation.

```jsx
import { Canvas } from '@react-three/fiber';
import { ACESFilmicToneMapping, SRGBColorSpace } from 'three';
import { Earth, PlanetLighting } from './planets';

const sun = [-3, 1.5, 3];

export function EarthScene() {
  return (
    <Canvas camera={{ position: [0, 0, 3.8], fov: 38 }} dpr={[1, 1.5]}
      onCreated={({ gl }) => {
        gl.toneMapping = ACESFilmicToneMapping;
        gl.toneMappingExposure = 1;
        gl.outputColorSpace = SRGBColorSpace;
      }}>
      <PlanetLighting direction={sun} />
      <Earth position={[0, 0, 0]} radius={1}
        sunDirection={sun} rotationSpeed={0.012} cloudSpeed={0.014} />
    </Canvas>
  );
}
```

Mars and Moon work the same way and do not load Earth textures. Components do not insert lights, cameras, controls, backgrounds or UI. PlanetLighting is optional: use your own compatible lights if preferred. With your own sunlight, pass its normalized direction (from the planet toward the Sun) as Earth's `sunDirection`. Update both light and shader direction together. It is a world-space direction; lighting is not an HDR environment.

### Compact component API

All models accept standard group transforms (`position`, `rotation`, uniform `scale`) and a forwarded ref to their Group. `radius` is a convenient default uniform group scale; use either `radius` or `scale`, not both (explicit scale wins). Units are arbitrary and the default radius is one. +Y is north. Initial rotation and speed are radians and radians/second.

| Prop | Earth | Mars | Moon |
| --- | --- | --- | --- |
| `radius` | 1 | 1 | 1 |
| `initialRotation` (Y) | -1.9 | -1.3 | -PI/2 |
| `rotationSpeed` | .012 | .009 | .005 |
| `rotating` | true | true | true |
| `reducedMotion` | system preference by default | same | same |
| `assetPath` | optional URL prefix, trailing slash required | same | same |
| `relief` | specialized normal strength .32 | 1 | 1 |

Earth-only options: `cloudSpeed=.014`, `cloudsRotating=true`, `clouds=true`, `atmosphere=true`, `surface=true`, `nightLights=true`, `cloudShadows=true`, `sunDirection=[-3,1.5,3]`.

- Set `rotationSpeed={0}` to hold Earth's surface while clouds continue; set `cloudsRotating={false}` to hold clouds while the surface moves. `rotating={false}` is the global stop.
- `reducedMotion={true}` freezes all model rotation. By default the system preference is respected and updates live.
- Named meshes are `earth-surface`, `earth-clouds`, `earth-atmosphere`, `mars-surface`, `moon-surface`. A Group ref's `getObjectByName()` exposes a layer for advanced integration.
- Render-loop mutations use refs and delta time, not React state per frame. Hidden-document frames do not advance component rotation; the first resumed frame is skipped to avoid a catch-up jump.
- Mount a React error boundary around the scene to catch missing required assets. The included preview demonstrates an explicit failure message instead of a substitute sphere.

## Rendering implementation

**Earth:** 8K cloud-free day map; 4K RGBA independent cloud sphere at 1.0035 radii; 4K night map gated by the world-space Sun direction; 2K normal data; 2K ocean-mask-derived roughness; nonmetallic physical material with IOR 1.333 and restrained specular strength. A separate shell at 1.009 radii uses a light-directed Rayleigh/Mie-inspired Fresnel approximation. Cloud opacity modulates surface shading in co-registered UVs using the actual surface/cloud angle difference.

The atmosphere is an efficient single-shell scattering approximation, not a spectral/volumetric atmospheric solver. Cloud shadows are an opacity-based approximation, not ray-traced cloud shadows. Clouds are not volumetric. Night lights are intentionally subtle and masked out in daylight.

**Mars:** 8K planetary color map and a 4K tangent-space normal map computed from measured MOLA elevations, not grayscale albedo. The DEM is rolled 180 degrees to match the color map's -180..180 longitude convention; Olympus Mons and Valles Marineris were checked visually for registration. Rough, nonmetallic material; no artificial orange light or halo.

**Moon:** 8K NASA LROC color map and 4K normal data derived from the co-registered LOLA elevation product. Dry nonmetallic material, no atmosphere. Crater relief is visible under directional and grazing light.

Mars/Moon normal conversion uses actual metric radii and longitude spacing corrected by cosine latitude. Relief is modestly exaggerated 1.5x for readability; the `relief` prop scales that normal contribution. It is normal shading, not geometric displacement or self-shadowed terrain. The spherical silhouette is deliberately preserved. Normal relief is smoothly attenuated above 80 degrees latitude and reaches neutral by 88 degrees to avoid a tangent-coordinate singularity at the poles. NASA's lunar color source has lower-resolution polar fill; it is not uniform scientific-resolution imagery.

All maps use mipmaps and capped anisotropy. Color maps are sRGB; normal/roughness data is non-color. Each mounted component owns and disposes its loaded textures; geometry/material lifecycle is managed by R3F. No texture or geometry allocation occurs inside the animation loop.

## Portable GLBs

`public/models/planets/{earth,mars,moon}.glb` are real, self-contained glTF 2 binary files with embedded textures and independent quaternion rotation clips. Surface radii are one unit. For Earth, start both surface/cloud clips to retain independent motion. GLB consumers must advance their own animation mixer and apply reduced-motion policy.

These are portable PBR baselines, **not exact visual equivalents of custom shaders**. Standard glTF cannot carry Three.js `onBeforeCompile` shaders. Earth GLB preserves the surface, separate transparent clouds, ocean roughness and normal data; shader atmosphere, night masking and cloud-shadow modulation remain in the React component only. Use Earth.jsx for maximum fidelity in Space Explorer.

Exports were reloaded through GLTFLoader, rendered and animated. Khronos glTF Validator found zero errors and zero warnings in all three. Earth has one informational unused-tangent message on the cloud mesh (no normal texture is needed there). Pole vertices with degenerate UV triangles receive valid fallback tangents rather than zero tangent vectors.

## Assets and provenance

See `PLANET-ASSETS.md` and `docs/planet-lab/runtime-manifest.json` for exact files, resolution, transformations, bytes and hashes. The original supplied NASA Earth GLB remains unmodified in `source-assets/EarthClouds_1_12756.glb` in the working project. Its single mesh/material contains combined surface/cloud color and an atlas normal image, both 4096 x 3072 PNG images internally named `.jpg`; no separate cloud geometry, cloud opacity or atmosphere exists. Embedded data has no external buffer or image dependency. The original is preserved as reference because that atlas cannot supply independent cloud motion or directly match spherical UV maps. No fake conversion is claimed.

The downloadable model-only integration kit excludes the earlier dashboard and bulky raw source texture downloads; the original NASA GLB is included as a reference. It includes all runtime maps, GLBs, components, processing scripts, source URLs, inspection records and validation reports. Raw source downloads also remain preserved in the working project; the raw sources can be retrieved again with `scripts/planet-assets.py` and processed with `scripts/prepare-planet-maps.py` (Python, Pillow and NumPy required).

## Performance and limitations

This is a high-fidelity desktop texture tier, not a low-bandwidth preset. The nine runtime maps total approximately 57 MiB compressed; three 8K maps plus associated mipmapped textures can consume roughly 0.7-0.9 GB of decoded GPU texture memory depending on format/driver. Load one planet when possible, and downsample the actual source maps for smaller devices. The independent preview uses three WebGL contexts for genuinely separate controls. A production app can render these components in one Canvas and share a single light setup.

There is no KTX2/Basis compression, streaming LOD, spectral atmosphere, volumetric weather, displaced landing terrain or astronomical time simulation. Optional Mars atmosphere was omitted rather than adding an inappropriate glow. Vite reports a large vendor bundle. No claim of real-device mobile optimization or GPU frame rate is made. Global maps cannot support unlimited surface-level magnification.

## Validation

See `PLANET-VALIDATION.md` for the exact checks run, screenshots, test reports and untested areas. No new runtime dependency was added to the existing project. Khronos validation tooling was installed separately from the application for asset QA.

### Optional tooling

For tests on a machine without compatible Chromium, run `npx playwright install chromium` first, or set `CHROMIUM_PATH` to its executable. The three export/validation files already supplied do not require this tooling to use. To regenerate exports, run the lab on port 5174, then `node scripts/export-planets.mjs`. For optional validator reruns, install `gltf-validator` separately and set `GLTF_VALIDATOR_PATH` to that module if it is outside Node resolution.
