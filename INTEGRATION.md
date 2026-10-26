> Historical record from the earlier integration phase. The current exploration implementation and validation are documented in [EXPLORATION.md](EXPLORATION.md) and [EXPLORATION-VALIDATION.md](EXPLORATION-VALIDATION.md).

# Space Explorer — supplied GLB integration

This is an update to the existing application, not a replacement dashboard. Navigation, branding, hero, destination markers, mission overview, hardware cards, type, spacing, responsive layout and existing camera API are retained.

## Required source archive: inspected, not assumed

`planet-glb-models.zip` contains exactly:

| File | Bytes | Contents |
| --- | ---: | --- |
| earth.glb | 18,379,520 | Earth surface and independent transparent cloud mesh; two rotation clips |
| mars.glb | 18,886,560 | Mars surface; one rotation clip |
| moon.glb | 27,834,696 | Moon surface; one rotation clip |
| PLANET-ASSETS.md | 4,937 | Provenance and attribution |
| PLANET-LAB.md | 10,920 | Model lab documentation, APIs and export limitations |

All five files are extracted under `public/models/planets/`, preserving filenames and exact bytes. The GLBs embed all buffers and texture images: **no external texture files are required**. Installed GLB SHA-256 values and mesh/clip names are recorded in `docs/integration/supplied-assets.json`; all three were compared byte-for-byte against the required ZIP. They were also loaded through the existing model-only preview before disabling the original scene meshes.

The ZIP does not contain reusable React components, custom shaders or external textures. Its documentation describes a richer, separate model lab, but that implementation is not bundled in this source ZIP. The application therefore loads the supplied GLBs directly. It does not substitute the old low-resolution scene spheres, lab-generated spheres, static photos, other NASA models or regenerated assets. The separate model-only lab remains intact, but does not render in the application scene.

## Appearance and composition

- One Canvas and one Earth/Mars/Moon assembly. Earth’s supplied surface and clouds are distinct meshes, not duplicate planets.
- Existing responsive composition math, body scales, depth order, axial placement tilts, Sun direction, light intensity, exposure, stars and camera/controller are retained.
- GLB geometry, UVs, normal maps, ocean roughness map, base colors and material factors are retained. Cloud transparency uses `depthWrite=false` so the transparent shell does not mask the surface; no material or texture is replaced.
- The supplied GLBs are portable PBR baselines. **They do not contain custom atmosphere scattering, night-side light masking or cloud-shadow shaders.** Those effects are not claimed in this integrated GLB scene. Earth’s included independent cloud layer is preserved.
- Old scene components/maps are no longer imported/rendered as planet visuals. They remain in the repository as historical references; the richer, independent model-only lab is also unchanged. The original `SUN` direction is retained in shared scene configuration; none of the old planet components is imported by the live application scene.

## One rotation preference; one scene animation loop

`usePreferences` owns `rotationSpeed` and `isRotationPaused`. Defaults are **2.0** and **false**. Values are clamped to 0–4 and rounded to 0.1. Pause is separate from speed: pausing/resuming 3.0× preserves 3.0×; resuming 0.0× preserves 0.0×. Reset restores 2.0× and clears pause. System/explicit reduced motion still takes priority.

The existing `World` R3F `useFrame` callback advances each GLB's `AnimationMixer` by `delta * effectiveMultiplier`. The supplied clips retain their authored periods, approximately:

| Layer | Baseline rad/s | Default 2.0× rad/s |
| --- | ---: | ---: |
| Earth surface | .012 | .024 |
| Earth clouds | .014 | .028 |
| Mars | .009 | .018 |
| Moon | .005 | .010 |

These presentation rates are visibly faster than the old application rates (.0028/.00294/.0021/.000015). At 1.0×, the supplied model clips play at their original rate. The multiplier does not change transforms, geometry or camera distance. Slider changes do not seek animations, reconstruct models, reload textures or add frame callbacks. There are no per-frame React state updates.

Hidden tabs stop rendering and the first resumed delta is skipped, avoiding a catch-up jump. Reduced motion stops rotation/cloud motion and parallax, using the original demand-rendering behavior. Pausing rotation does not disable the existing camera controller or UI.

## Display Settings

The existing Settings icon now toggles an anchored, nonmodal popover up to 320px wide (constrained to viewport width/height, with a narrower left-aligned phone layout and side-by-side actions so more of Earth remains visible) instead of opening the old modal. It includes the requested heading/label, one-decimal live value, native range input, pause/resume and reset. Settings update immediately; no Save action.

It dismisses on trigger toggle, outside pointer/focus or Escape. Escape returns focus to the trigger; opening focuses the slider. Native keyboard range interaction and Tab order are retained, visible focus states are provided, and closed contents are inert, hidden from assistive technology and pointer-inactive. A short CSS transition uses no new dependency and respects reduced motion. Existing motion and rendering-resolution controls remain in a collapsible section.

The optional `space-rotation` localStorage value stores the two preferences. Invalid JSON, nonnumeric/nonfinite values, out-of-range numbers and nonboolean pause values have safe defaults or clamping. Storage denial does not disable controls. Existing `space-motion` behavior is retained.

## Resources and failures

The model-loading effect depends on stable scene callbacks and GPU anisotropy, not speed, pause or popover state. Each file is loaded once per scene mount; all supplied clips start once. One cleanup owns mixers, unique geometries/materials/textures and decoded image bitmaps. Late loads after failure/unmount are disposed. Error messages include the exact failed model URL and underlying error. Retry creates a fresh scene; the archive/navigation/settings remain usable without 3D.

## Changed files

- `src/App.jsx` — share preference state with header and existing scene.
- `src/components/Header.jsx` — use the existing icon as the popover trigger.
- `src/components/DisplaySettings.jsx` — new compact settings controls and dismissal/focus behavior.
- `src/components/ExplorerDialog.jsx` — remove unreachable old settings modal branch; update model credits/limitations. Search/profile dialogs are preserved.
- `src/hooks/usePreferences.js` — shared, validated, safely persisted rotation preference.
- `src/scenes/SpaceScene.jsx` — load the required GLBs in the unchanged composition; drive clips from the existing frame callback; exact-asset error handling; development-only test diagnostics.
- `src/scenes/usePlanetModels.js` — explicit GLB paths, layer/clip validation, resource ownership and disposal.
- `src/scenes/rotationSettings.js` — defaults, validation, effective multiplier and mixer advancement.
- `src/scenes/sceneConfig.js` — original Sun direction and reference rates from the supplied clips; retained numerical test utility.
- `src/index.css` — settings-only styles and viewport/reduced-motion behavior.
- `public/models/planets/*` — required archive contents, byte-preserved.
- `tests/phase1.spec.js` — existing regressions adapted to GLBs and popover; frame-aware waiting.
- `tests/rotation-unit.spec.js`, `tests/rotation-controls.spec.js` — new supplied-animation and UI acceptance coverage.
- `README.md`, `ASSETS.md`, this document and `INTEGRATION-VALIDATION.md` — current integration, provenance and actual validation.

## Run and verify

```sh
npm ci
npm run dev
npm run build
npx playwright test tests/rotation-unit.spec.js tests/rotation-controls.spec.js tests/phase1.spec.js
```

Tests use the configured Chromium/software-WebGL environment. `CHROMIUM_PATH` can select another installed browser. The separate model lab and its original tests remain available; their earlier results should not be mistaken for a new real-device benchmark.
