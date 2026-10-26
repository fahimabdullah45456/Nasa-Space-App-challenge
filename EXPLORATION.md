# Moon / Mars exploration update

This modifies the existing application in place. It introduces no replacement project, additional webpage routes, sidebar, planet catalog, or new model exports. Existing overview composition, fonts, colors, assets, Earth lighting/cloud animation, archive controls and rotation Settings remain the foundation.

## Inspected source assets

The actual supplied archive contains `earth.glb`, `mars.glb` and `moon.glb`. Their inspected meshes are `earth-surface`, `earth-clouds`, `mars-surface`, `moon-surface`. Each surface and the clouds has its supplied rotation clip. The application already loads these exact assets through `usePlanetModels`; this update reuses that loader and persistent assembly rather than introducing another set of planets. `docs/integration/supplied-assets.json` records the earlier byte-integrity inspection.

## Marker repair

`src/scenes/planetGeometry.js` derives each surface's local bounding sphere from its GLB geometry and applies the current mesh `matrixWorld`, accounting for parent translation, rotation and scale. The active camera projects its world center and apparent radius into canvas coordinates. Candidate leader endpoints are raycast against all three opaque surfaces. Only a first hit on the intended surface is accepted; offscreen, behind-camera and fully occluded markers are hidden instead of pointing at Earth. Both destinations use the same logic. On narrower desktop overviews, labels sit on the unobstructed side of the projected sphere to stay clear of the hero; the raycast-verified endpoint is unchanged.

`DestinationMarkers` writes small DOM/SVG updates through refs from the existing R3F lifecycle. It avoids per-frame React state updates or DOM measurements. The full overlay and leader SVG are pointer-transparent; only the 44px-minimum label buttons accept input. Selected emphasis uses the existing restrained underline/color treatment.

## State and camera ownership

`App` owns one world selection: `overview | moon | mars`. Header, marker buttons, mission summary, hero action and public scene ref all use the same `navigate` callback. Archive retains scroll/focus behavior without changing the selected world. Journey phase tracks presentation readiness, not a competing destination.

`createCameraTransitions` is the sole camera owner; the live scene has no OrbitControls to disable or restore. Its single GSAP timeline animates a curved world-space path, look-at target and lens shift with `power2.inOut`. Path planning samples intervening bounding spheres and pushes the curve away from surfaces; unsafe paths report a recoverable error. Starting another selection cancels the old promise/timeline and begins at the current camera pose. Camera up remains stable with no roll animation.

`fitPlanetCamera` calculates distance from the actual transformed sphere, camera FOV, viewport and configurable `FRAMING` occupancy/safety margin. It preserves planet scale. Desktop framing reserves the existing text region; portrait framing centers the selected sphere. Resize reframes the current world with a short 0.65-second adjustment. Overview reset restores the original camera position, target and lens shift. Normal journeys are 2.4 seconds; return is 2.2 seconds. Reduced motion completes directly. Hidden tabs suspend the active timeline.

No orbital/physics accuracy is implied. Positions and scale remain the approved presentation composition. Earth is not artificially shrunk or replaced during selection. Its existing surface/cloud appearance and lighting are unchanged.

## Rotation and hardware

Navigation retains the existing model instances, mixer times, textures, materials and global preferences. The original frame loop advances authored clips at the selected 0–4x multiplier. At the default 2x, Moon rotates about .010 radians/second and Mars .018 radians/second; clouds remain independent. Pause stops all applicable rotation without stopping camera travel. Reset remains 2x/unpaused.

`useDestinationPresentation` coordinates a restrained fade/vertical shift with journey phase. Hero and hardware content swap once per destination, not every frame. Overview has the original four cards; Moon and Mars have the appropriate two. Original archival images/credits are reused. Expanded descriptions distinguish an astronaut-driven rover from stationary lunar experiments and distinguish the final rover contact/operations years from formal mission closure. Every hardware detail dialog has a NASA source link. No terrain, rover model, telemetry or new mission is invented.

Selected-state tablet styling expands cards to one column and keeps destination information below the sphere without disturbing the overview. Hardware dialogs support dismissal and focus restoration; a removed opener falls back to the active navigation item.

## Main files

- `src/App.jsx`: shared world state, journey synchronization, cancellation promises and recovery.
- `src/scenes/SpaceScene.jsx`: persistent GLBs, camera orchestration, resize/reduced-motion/visibility handling, live markers.
- `src/scenes/planetGeometry.js`: transformed GLB bounds, FOV fitting and occlusion-safe projected markers.
- `src/animation/cameraTransitions.js`: cancellable camera path, target and lens-shift timeline.
- `src/components/DestinationMarkers.jsx`: projected clickable labels/leader SVG.
- `src/components/Header.jsx`, `HeroContent.jsx`, `MissionOverview.jsx`: synchronized selection and copy.
- `src/components/HardwareStrip.jsx`, `ExplorerDialog.jsx`: destination cards, accurate descriptions and source details.
- `src/hooks/useDestinationPresentation.js`, `src/data/destinations.js`, `src/data/missions.js`: presentation timing and data.
- `src/index.css`: projected-label and selected-content styles, including tablet/phone layouts.

## Verified mission sources

- Apollo 15: https://www.nasa.gov/missions/apollo/apollo-15/apollo-15-mission-details/
- Apollo surface experiments: https://www.nasa.gov/wp-content/uploads/static/history/alsj/HamishALSEP.html
- Spirit: https://science.nasa.gov/mission/mer-spirit/
- Opportunity: https://science.nasa.gov/mission/mer-opportunity/

## Running

```sh
npm ci
npm run dev
npm run test:exploration # dev server must be running
npm test
npm run build
npm run preview
```

The separate static-site ZIP provides a prebuilt `dist/`. The source ZIP creates `dist/` with `npm run build`. Serve the static site over HTTP. Run `python3 -m http.server 4173 --directory dist` from the project root if no Node setup is needed. Publish only `dist`, not source/reference assets. Tests use Chromium/software WebGL and do not establish real-device frame rates or Safari/Firefox compatibility.

## Failure feedback stacking

The failure-injection test exposed a pre-existing phone stacking issue: the hero’s transparent top padding intercepted Retry clicks. Error-only scene stacking now raises the feedback above that padding while keeping the rest of the overlay pointer-transparent. Successful scene stacking is unchanged.
