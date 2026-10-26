> Historical record from the earlier integration phase. The current exploration implementation and validation are documented in [EXPLORATION.md](EXPLORATION.md) and [EXPLORATION-VALIDATION.md](EXPLORATION-VALIDATION.md).

# Integration validation — actual results

## Outcome

The existing Space Explorer application loads the exact supplied Earth, Mars and Moon GLBs, with independent Earth clouds. Shared rotation defaults to 2.0× and is controlled from the existing Settings icon. The original application design, composition, archive, navigation and camera API are retained.

## Tests performed

### Source inspection and integrity

- Inspected all five ZIP entries, GLB nodes, materials, embedded images/buffers and animation clips.
- Loaded all three supplied GLBs through the existing preview before disabling the original scene visuals.
- Extracted files under `public/models/planets/`; all three GLBs compare byte-for-byte with `planet-glb-models.zip` and require no external texture files.
- SHA-256 hashes, file sizes, exact mesh/clip names and absence of external dependencies are recorded in `docs/integration/supplied-assets.json`.

### Production build

`npm run build` passed. Vite reports the existing large Three.js chunk warning; it is a bundle-size warning, not a failed build or runtime error. No dependency or animation library was installed for this change.

### Full acceptance/regression suite: 27 passed

```sh
npx playwright test tests/rotation-unit.spec.js tests/rotation-controls.spec.js tests/phase1.spec.js
```

Final run: **27 passed, 0 failed, 0 skipped, 0 flaky**. Log and machine-readable results: `docs/integration/final-tests.log` and `final-test-results.json`.

Coverage includes:

- Exact supplied assets, four scene meshes (Earth surface/clouds, Mars, Moon), embedded high-resolution maps, normal detail, Earth/Mars occlusion and original desktop layout bounds.
- One load per model and stable model/mesh/material identities, texture count, layout and camera across speed changes; no old planetary texture requests.
- Actual GLB clip progression at 0/1/2/4×, independent layer rates and frame-rate-independent numerical integration at simulated 30/60/120 FPS.
- Zero-speed orientation hold; 3× pause/resume; zero-speed resume remaining zero; reset to 2× unpaused.
- Trigger toggle, outside click, Escape, focus return, keyboard slider/Tab/Space/Enter controls, closed inert contents and pointer inactivity.
- Persistence across reload, malformed preferences and storage read/write failures.
- Touch interaction and popover bounds at 390px and 320px.
- Existing search, navigation, archive selection, profile dialog, motion/resolution controls and programmatic GSAP camera focus/reset.
- System reduced motion, hidden-tab pause/resume, explicit Earth/Mars/Moon asset failures, retry recovery and WebGL context-loss feedback.

After screenshot review, slider endpoint spacing and the optional preference labels were polished to avoid focus-outline overlap and narrow-screen truncation. The three affected motion/settings/touch regressions were repeated: **3 passed**. Results: `final-ui-tests.log` and `final-ui-results.json`. Production checks below were rerun after that final polish.

### Final production smoke checks: four viewport sizes passed

Served the final build with `npm run preview -- --port 4173` and ran `node tests/integration-production.mjs`.

| Viewport | Supplied model responses | Captured runtime errors | Failed requests | Result |
| --- | --- | ---: | ---: | --- |
| 1440 × 1024 | All three: HTTP 200 | 0 | 0 | Passed |
| 800 × 1024 | All three: HTTP 200 | 0 | 0 | Passed |
| 390 × 844 | All three: HTTP 200 | 0 | 0 | Passed |
| 320 × 844 | All three: HTTP 200 | 0 | 0 | Passed |

Checked slider endpoints/default value, pause/reset controls, popover bounds and dismissal, one Canvas, four hardware cards, no horizontal overflow and no development diagnostics in the production build. Desktop header, headline, hero-button, archive and mission-overview bounds match the pre-integration baseline exactly.

Intentional failure tests produce expected loading/context errors and verify usable feedback. The zero-error statement above applies to normal production smoke checks, not to intentionally aborted assets.

### Visual review

Individually inspected production overview screenshots at all four widths, desktop Settings at 0×/2×/4×, phone Settings, and expanded rendering preferences. Fixed the phone panel size/placement, focus-outline spacing and truncated option text, then inspected replacement screenshots. The final screenshot index and observations are in `docs/integration/visual-review.json`.

## Important limitations

- These supplied GLBs contain PBR surfaces, normal detail and Earth's independent cloud mesh. They **do not include** the separate model lab's custom atmosphere, night-light masking or cloud-shadow shaders. No substitute or regenerated models were introduced to imitate those omitted effects.
- Numerical 30/60/120-FPS tests verify animation integration, not GPU frame-rate performance. Browser tests used Linux Chromium with software WebGL; touch/mobile checks are emulations, not real-device benchmarks or a complete accessibility audit.
- The supplied 8K maps are memory/bandwidth intensive. Real hardware GPU performance was not benchmarked.
- The existing destination buttons retain their original selection behavior. No new cinematic destination experience or rover/terrain inspection was added.

## Delivery contents

The ZIP contains the updated existing project source, locked dependencies manifest, complete public runtime assets, original model-only lab, original NASA reference GLB, tests, final screenshots and reports. It excludes `node_modules`, redundant build outputs, historical raw texture downloads and failed-run traces. No model regeneration is needed to run or build the application.

```sh
cd space-explorer
npm ci
npm run dev
```

The full changed-file list and implementation decisions are in `INTEGRATION.md`.
