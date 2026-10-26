> Historical validation for the original Phase 1. Current application integration results are in `INTEGRATION-VALIDATION.md`.

# Phase 1 validation

## Executed against this implementation

- `npm run build`: passed. Vite warns about the large Three.js vendor chunk; this remains a performance consideration, not a build failure.
- `npm test`: **10 passed (59.8 seconds)** in Chromium using software WebGL. Detailed report: `docs/test-results.json`; output: `docs/test-run.log`.
- `node tests/production-smoke.mjs`: passed at 1440 × 1024, 1080 × 900, 800 × 900 and 320 × 844. No captured page/console errors, failed HTTP responses or horizontal page overflow. Development scene diagnostics were absent from the production build.
- Production screenshots were visually inspected at the four smoke-test widths. The tablet Mars-label/headline overlap was corrected and the replacement capture inspected. The target-size scene, photo crops, layout and hierarchy were inspected against the Figma reference, not claimed pixel-identical.

## Automated coverage

1. Real SphereGeometry for Earth/Mars/Moon and separate cloud sphere; independent motion; real Earth-before-Mars ray intersection and 3D depth; target layout landmarks; no captured runtime errors.
2. Rotation integration agrees over 30/60/120 frame partitions.
3. Destination navigation, archive focus, hardware search/selection, profile scope explanation and Escape/focus return.
4. Explicit reduced motion stops Earth/cloud/Mars rotation; low-resolution setting caps DPR at 1; rendering becomes on-demand.
5. System reduced motion applies from startup.
6. Real GSAP camera movement toward Mars and restoration through the reusable scene API.
7. 390 × 844 emulated mobile layout, visible planetary region, reachable cards/settings, header action target widths and no horizontal page overflow.
8. Required Mars texture failure: clear message, retained archive controls and successful retry after restoring the resource.
9. Simulated hidden-document signal pauses rendering and resumption preserves the scene.
10. Actual WebGL context-loss extension produces clear failure feedback.

## Visual and asset checks

- Inspected the supplied GLB and embedded textures before choosing the runtime implementation. Original retained without modification; no independent cloud map/mesh was present.
- Inspected real day/cloud/night/Mars/Moon source maps, their dimensions and formats; production files are local and have documented attribution.
- Reused original Figma archive crops and branding vectors. Target node 10:2 was unavailable; the approved named 1440 × 1024 frame at 2:2 was used and this substitution is recorded in ASSETS.md.
- Inspected desktop, narrow/mobile, selection, settings and required-asset-failure screenshots during implementation. No final flat-image planetary substitute is used.

## Scope and limits

These checks do not certify all-device accessibility, AA compliance, physical astronomical accuracy, real-device touch quality, universal WebGL support or target GPU frame rate. Safari, Firefox, real phones, screen readers and hardware benchmarking were not tested. Large vendor payload remains; KTX2/LOD is not implemented. Optional normal/specular provider assets were unavailable and are not referenced.

Public destination controls retain the overview and clearly communicate later-phase scope. GSAP camera focus/reset is a tested integration hook, not a complete Mars journey. Terrain, rover models, landing sites, model picking, backend and authentication are intentionally absent.
