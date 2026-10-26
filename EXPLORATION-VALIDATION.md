# Exploration validation

## Completed acceptance checks

- Development application: **1440×1024, 800×1024, 390×844**. Repeated Overview → Moon → Overview → Mars → Overview transitions, both projected label clicks, active navigation, destination-specific card counts (4/2/2), rapid interrupted navigation, card dialogs, archive focus, and reduced motion passed. No successful-path console/runtime/HTTP errors were recorded. Each context loaded exactly the three supplied GLBs once. Model instance IDs remained stable across navigation.
- Settings in close-up: change to 3.0x, pause on Moon, navigate to Mars while paused, verify unchanged mesh quaternions across rendered frames, resume and verify rotation, then reset. Preferences stayed synchronized with the real scene. Camera travel still completed while rotation was paused.
- Final tablet label/layout refinement: the 800px acceptance script was rerun with real text/control collision checks, including all selected states and interruptions. Label layout avoids the hero text and actual button targets. A final top-spacing refinement keeps the Mars sublabel above Earth's bright limb; it was rendered in the subsequent production run.
- Production build: all three viewports and all three destination states passed, including resizing an active Moon close-up down by 30×50px and back. Exactly three GLB requests; no successful-path errors; development diagnostics absent. Cards remained 4 in Overview and 2 in each close-up. No horizontal document overflow at the tested widths (including 360px during resize).
- Production failure injection: abort `moon.glb`, verify a clear exact-path error, all four archive cards, safe rejection of unavailable travel, unblock the asset, click the actual Retry button, and travel to Moon successfully. This exposed and fixed the phone Retry stacking bug; the final test uses an ordinary click, not a forced click.
- Build: `npm run build` succeeded. Vite's existing large Three.js vendor-chunk warning remains advisory, not a build failure.

## Unit and regression suite

**31 relevant tests passed:** 11 camera/marker/rotation unit tests and 20 application/Settings UI regressions. The final 20-test UI run completed successfully without another WebGL browser competing for memory.

The geometry tests fit sampled spheres at three scales in desktop, tablet and square/phone viewports; every sample remains within the frustum. Camera interruption preserves the live pose, cancels the old promise and retains one timeline. The path test samples clearance around an intervening sphere. Independent marker raycasts verify actual Moon/Mars endpoints, resize behavior, complete occlusion and behind-camera hiding. Rotation unit tests use the actual supplied animation clips and check frame-rate independence and independent cloud rates.

The UI regressions cover original desktop layout, genuine GLB meshes/clouds, search/profile/hardware interactions, archive focus, system/explicit reduced motion, the public camera API, phone controls, missing-asset retry, hidden-tab rendering, context loss, Settings dismissal/keyboard interaction, 0/1/2/4x speed, invalid/blocked storage, resource identity and persistence.

## Evidence

- `docs/exploration/validation.json`, `validation.log`: three-viewport development acceptance results.
- `docs/exploration/validation-final-800.json`, `.log`: refined tablet collision/interaction acceptance results.
- `docs/exploration/production-validation.json`, `.log`: final production navigation, close-up resize, resource/error and retry results.
- `docs/exploration/unit-tests.log`, `ui-regression.log`, `final-ui-results.json`: final relevant unit/UI outcomes.
- `docs/exploration/production-{1440,800,390}-{overview,moon,mars}.png`: rendered production states.
- `docs/exploration/production-mobile-asset-error.png`, `production-mobile-recovered.png`: real fallback and recovered scene.
- `docs/exploration/visual-review.json`: individual visual inspections and resolved issues.
- `docs/integration/supplied-assets.json`: inspected supplied GLB identities and hashes. Packaging also verifies all three against `planet-glb-models.zip` byte-for-byte.

Earlier parallel browser regressions exhausted the 4.2 GiB sandbox and were killed by the OS; they are not reported as passing runs. Final regression checks are run sequentially without a second WebGL browser competing for memory. Full-page modal screenshots include the current scroll offset and backdrop region; dialog usability is checked by browser interactions rather than treating those full-document capture artifacts as webpage layout defects.

## Scope and limitations

Tests use headless Chromium with software WebGL. They demonstrate implemented interactions and rendered states, not a hardware GPU frame-rate benchmark, real-device touch certification, Safari/Firefox compatibility, or a complete accessibility audit. Timings are configured presentation durations, not a guarantee on every GPU. The 8K embedded textures and approximately 65 MB of GLBs can be expensive on low-memory devices; no LOD/streaming system was added. No terrain, rover GLBs, orbital simulation or live telemetry is included. Earth and the selected world preserve the existing lighting/material implementation; no new atmospheric shader is claimed.
