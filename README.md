# AFTERLIGHT — Their missions ended. Their discoveries endure.

The existing React/Vite experience, extended in place with seven vehicle mission files, an expanded Moon/Mars archive, interactive inspection of sourced rover models, and nine landing-site explorers. The original Overview, planetary GLBs, navigation, camera travel, and animation system remain in place. No backend or user accounts are used.

## Start

Requires Node 20.19+ (or 22.12+ / 24) and npm.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. Build and inspect production:

```sh
npm run build
npm run preview
```

The separate static-site ZIP contains a prebuilt `dist/`. In the source ZIP, run `npm run build` first. Serve `dist/` over HTTP (not `file://`):

```sh
python3 -m http.server 4173 --directory dist
```

Open http://localhost:4173. There are no remote texture/font dependencies at runtime. Do not serve the entire source project publicly: only publish `dist/`.

## What works

- HTML/CSS layout based on the approved 1440 × 1024 Figma overview; actual Figma photo crops and brand vectors reused.
- Three independent spherical bodies with perspective depth: Earth occludes Mars, with the Moon nearby.
- Exact supplied `earth.glb`, `mars.glb` and `moon.glb` from `planet-glb-models.zip`. Embedded PBR maps, surface normal detail and Earth’s separate transparent cloud mesh are preserved. These portable GLBs do not include the model lab’s custom atmosphere, night-light masking or cloud-shadow shaders.
- One existing scene loop drives the supplied independent surface/cloud animation clips at a shared default **2.0×** multiplier. Baseline rates: Earth .012, clouds .014, Mars .009, Moon .005 radians/second. Sparse static stars and the original pointer parallax are retained.
- Brief GSAP UI entrance, CSS hover/focus treatment, explicit motion-off setting and system reduced-motion support.
- Compact Settings popover: live 0.0–4.0× speed slider, independent pause/resume, reset to 2.0×, outside/Escape dismissal, focus handling and optional validated local persistence. Existing motion/render-resolution preferences remain under “Rendering preferences.” Hardware search, destination/card selection, archive navigation and information dialog remain unchanged.
- Exact-asset GLB failure and context-loss feedback, retry, explicit model-resource disposal, visibility-based rendering pause, capped pixel ratio.

## Moon / Mars exploration

- One `overview | moon | mars` destination state synchronizes header, projected markers, real camera, destination copy and hardware cards. On the Overview, the Archive navigation preserves its original scroll/focus behavior; the `OPEN COMPLETE ARCHIVE` action opens the full route.
- Header and model markers use the same selection handler. Marker endpoints are raycast-verified against the actual visible GLB surfaces; hidden/occluded destinations do not show a misleading endpoint on Earth.
- A single cancellable GSAP timeline moves camera position along a curved approach and animates its look-at target and lens shift together. Arrival framing uses the loaded GLB surface bounding sphere transformed through its live parents, FOV and viewport. Default journeys take 2.4 seconds (2.2 seconds returning home); reduced motion settles directly.
- Planet geometry, materials and animation mixers stay mounted. Navigation does not reload models or change their scale. Global speed, pause/resume and reset continue to drive the same clips in every destination. Camera motion is independent of rotation pause.
- Overview retains all four original hardware cards. Moon shows Apollo 15's astronaut-driven rover and Apollo 12 scientific instruments; Mars shows Spirit and Opportunity. Expanded descriptions, mission status, original credits and NASA source links appear in hardware details. No rover GLBs are fabricated.

## AFTERLIGHT archive routes

- `/archive` — seven vehicle records with All / Mars / Moon filters and search.
- `/rovers/:id` — mission-specific story, engineering, instruments, timeline, discoveries, images, sources, model/fallback, and field-site links.
- `/landing-sites/:id` — nine documented mission-site records. Six NASA terrain meshes are available; the other three use a labeled existing planetary model as context, not as a local terrain reconstruction.
- Perseverance's NASA model exposes exact named geometry for component highlighting. The Spirit/Opportunity and Curiosity static models are each a single mesh; the Apollo LRV, Lunokhod 1, and Yutu-2 pages do not claim an unverified downloadable rover model.
- Routes work on direct page loads through the existing Vite SPA fallback. Build output keeps the site static; no router dependency was added.
- See [AFTERLIGHT-SOURCES.md](docs/AFTERLIGHT-SOURCES.md) for model/image provenance, terrain processing, coordinate semantics, and caveats.

`SpaceScene` retains its React ref API:

```js
await sceneRef.current.focusDestination('Mars');
await sceneRef.current.resetCamera();
```

See [EXPLORATION.md](EXPLORATION.md) for implementation details and [EXPLORATION-VALIDATION.md](EXPLORATION-VALIDATION.md) for tests actually completed. Earlier integration/lab documentation is retained as historical provenance, not as the current scope description.

## Original NASA reference model

`source-assets/EarthClouds_1_12756.glb` is preserved byte-for-byte. Inspection found one mesh/node and one material, a normal image and a combined Earth/cloud color atlas. There is no separate cloud sphere, cloud-opacity texture or atmosphere. The embedded images are PNG, despite their internal `.jpg` names, at 4096 × 3072. Details and SHA-256 are in `docs/earth-model-inspection.json`.

That original NASA file is a historical reference, not the current rendered Earth. The current application loads the exact three portable GLBs supplied in `planet-glb-models.zip` directly. No models were recreated or re-exported for this integration. See [ASSETS.md](ASSETS.md) and [PLANET-ASSETS.md](PLANET-ASSETS.md).

## Original project map (historical)

```text
src/
  App.jsx, main.jsx, index.css
  components/ Header, HeroContent, MissionOverview, HardwareStrip, ExplorerDialog
  scenes/ SpaceScene, Earth, Mars, Moon, StarField,
          usePlanetTextures, sceneConfig
  animation/ introTimeline, cameraTransitions
  hooks/ usePreferences
  data/ missions
public/
  textures/ five inspected runtime planetary maps
  archive/ four original Figma/NASA photo crops
  brand/ two original Figma vectors
source-assets/ EarthClouds_1_12756.glb (original; not loaded by the app)
docs/ model inspection, asset manifest, validation records, browser previews
tests/ phase1.spec.js
index.html, vite.config.js, playwright.config.js
package.json, package-lock.json
```

This workspace contained no application or package configuration; one app was created in this project root, not nested inside another React app.

## Dependencies added

Runtime: React, React DOM, Three.js, React Three Fiber, Drei, GSAP, lucide-react and locally hosted Inter through Fontsource. Development: Vite, its React plugin and Playwright Test. Exact installed versions are locked in `package-lock.json`. No Tailwind setup existed; styling is standard CSS. No Anime.js, backend or database dependency was added.

## Tests

```sh
# If a compatible Chromium is not installed:
npx playwright install chromium
npm test
# While npm run dev is running, run the multi-viewport exploration acceptance script:
npm run test:exploration
```

The configuration uses `/usr/local/bin/chromium` when present; optionally set `CHROMIUM_PATH` to your browser executable. Tests start/reuse the Vite server automatically and use software WebGL for repeatability. Development-only `window.__SPACE_EXPLORER__` diagnostics inspect actual meshes, angles and camera transforms; they are omitted from the production build.

See [VALIDATION.md](VALIDATION.md) for tests actually executed and limitations. Passing browser tests is not a claim of a complete accessibility audit, astronomical accuracy, universal mobile support or a hardware GPU frame-rate benchmark.

## Remaining work / limitations

- Three rover models are included from NASA sources. Component-level selection is enabled only for the Perseverance model's actual named groups; the static MER and Curiosity assets are single-mesh models.
- Apollo LRV, Lunokhod 1, and Yutu-2 use sourced archival or clearly labeled contextual media because a verifiable official downloadable model was not established for this build.
- Local terrain assets are NASA landing-site meshes where available. Jezero, Mare Imbrium, and Von Kármán use planetary context models without invented terrain detail, coordinates-on-mesh markers, or rover routes.
- No actual-time orbital model; speeds, sizes and distances are presentation choices. The Moon is held near its approved composition rather than physically orbiting Earth.
- The real texture set and shading intentionally differ from the AI raster reference; screen regions/type/spacing are matched, not pixel-identical planetary features.
- The live scene preserves the supplied GLBs’ embedded PBR maps and separate Earth cloud mesh. No new atmosphere, cloud-shadow shader or fabricated elevation map was added.
- The supplied GLBs total about 65 MB uncompressed, with 8K surface maps; they are not KTX2/LOD streamed. Vite reports a large Three.js vendor chunk; no heavy post-processing is used. Test on real target hardware before making performance claims.
- Real-device touch, Safari, Firefox, full assistive-technology testing and GPU benchmarking remain untested.
