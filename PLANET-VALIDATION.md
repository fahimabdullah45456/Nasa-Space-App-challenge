> Historical validation for the separate model lab. Current application integration results are in `INTEGRATION-VALIDATION.md`.

# Planet Model Lab — validation performed

## Final results

- Model-only production build (`npm run build:planets`): passed. Vite retains its large-vendor-chunk warning.
- Playwright model suite (`npm run test:planets`): **13 passed**, final rerun approximately 1.7 minutes, Chromium with software WebGL.
- Production runtime checks: all three together at 1680 x 900 and each alone at 1000 x 1000 loaded with zero captured console/page errors, zero failed HTTP responses, no horizontal page overflow, and no diagnostics exposed without an explicit QA/export query.
- All three GLBs: Khronos glTF Validator **zero errors, zero warnings**. Earth has one informational unused tangent on its transparent cloud mesh. Full reports are included.
- Portable models were reloaded with GLTFLoader, rendered, and their independent animation tracks tested.

## Automated coverage (13 tests)

1-3. Each component mounts alone, loads an 8192 x 4096 surface and real normal data, and rotates without another planet's asset dependencies. Earth has distinct surface/cloud/atmosphere meshes and unequal surface/cloud speeds.
4. Earth surface can be held at zero speed while clouds continue independently.
5. Clouds, atmosphere and night lights can be disabled, leaving an Earth surface alone.
6. System reduced motion freezes every layer of every planet.
7. The delta-time integration function agrees at 30, 60 and 120 FPS partitions.
8. Drag and wheel input change the real orbit camera.
9. 390 x 844 emulated preview displays three usable canvases without horizontal page overflow.
10-12. Each exported GLB loads, has normal data, renders and animates; Earth retains separate surface/cloud geometry.
13. A missing required Mars normal map produces a clear error, not a placeholder planet or indefinite loading text.

Motion checks wait for actual angle change rather than assuming a GPU frame-time budget: high-resolution texture upload/compilation on software rendering can stall startup. This is not a hardware performance benchmark.

## Actual visual inspection

Screenshots of each planet were individually opened and inspected at medium distance, close range, grazing light, reverse light and two different longitudes. Checks included recognizable surface regions, cloud transparency and attachment, day/night contrast, ocean glint, atmosphere thickness, geological/crater definition, material shine and visible seams. Portable GLB renders and the 390px mobile preview were also inspected.

Additional top-down pole views were captured. A radial lunar polar shading artifact in an early normal-map version was isolated by disabling normal contribution, then corrected with a smooth latitude-dependent attenuation. The new polar image was opened and inspected. Final preview framing was corrected so all three whole planets fit their individual canvases instead of being clipped at the sides. The replacement production screenshot was inspected.

There are no AI-generated planet images, screenshot texture substitutes, video backgrounds, fake model files or random decorative craters. Sphere geometry supplies a reasonable silhouette; measured/astronomical maps and materials supply detail.

## Limits

The maps are global visualization products, not infinite-resolution terrain. NASA's lunar polar color fill is lower resolution; normal relief is deliberately attenuated near the coordinate singularity. Normal shading does not cast terrain self-shadows or change the silhouette. Atmosphere/cloud shadows are efficient shader approximations, not volumetric or spectral simulations. Standalone Earth GLB omits custom shader effects, as documented.

Safari, Firefox, real phones/touch hardware, all assistive technologies and physical GPU frame-rate/memory benchmarks were not tested. Emulated mobile rendering is not a claim of real-device optimization. This high-resolution texture tier requires substantial memory and bandwidth; no KTX2/LOD pipeline is implemented.
