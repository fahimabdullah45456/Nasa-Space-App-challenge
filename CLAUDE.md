# AFTERLIGHT — Animation Style Guide

This document describes the **animation style and camera transition behavior** for the first three pages (Overview, Moon, Mars) of the AFTERLIGHT experience. It covers the zoom-in transition, planet positioning, and state synchronization.

## 1. Camera Transition — Zoom In / Out

**File:** `src/animation/cameraTransitions.js`

### Core Mechanism
- **GSAP-driven** timeline animating a `motion.progress` value (0 → 1)
- **QuadraticBezierCurve3** path with a control point offset for a curved approach
- **Obstacle avoidance**: Iteratively adjusts control point to clear other planet bounding spheres (Earth occludes Mars, Moon nearby)

### Timing
| Transition | Duration | Easing |
|------------|----------|--------|
| Overview → Moon/Mars | 2.4s | `power2.inOut` |
| Moon/Mars → Overview | 2.2s | `power2.inOut` |
| Resize during travel | 0.65s | `power2.inOut` |
| Reduced motion / `prefers-reduced-motion` | 0s (instant) | — |

### Camera Framing (`fitPlanetCamera` in `src/scenes/planetGeometry.js`)
- Fits the **entire bounding sphere** of the target planet in the narrower viewport dimension
- **Occupancy**: 76% of the view frustum
- **Margin**: 1.08× safety factor
- **Direction vectors** (normalized):
  - Moon: `[-0.75, 0.3, 1]` (behind and above)
  - Mars: `[-1, 0.35, 0.5]` (side and slightly above)
- **Lens shift** applied for off-center framing (`.5 - screenCenterX`)

### State Machine (in `SpaceScene.jsx` useEffect)
```js
// On destination change:
onJourney({ destination, phase: 'traveling' })
// → GSAP timeline runs
// → onComplete:
onJourney({ destination, phase: 'arrived' })
```
- `phase` drives UI: content fade, marker visibility, hardware strip layout
- Camera motion is **independent** of planet rotation pause/resume

---

## 2. Planet Positioning & Layout

**File:** `src/scenes/SpaceScene.jsx` — `composition()` function

### Viewport-Dependent Layout
```js
// Desktop (≥760px)
earth:  { x: 69.2%, y: 45.9%, z: 0,     radius: 21.44% }
mars:   { x: 52.4%, y: 31.7%, z: -7,    radius: 9.8%  }
moon:   { x: 44.4%, y: 56.5%, z: 1,     radius: 3.5%  }

// Mobile (<760px)
earth:  { x: 67%,   y: 46%,   z: 0,     radius: 32%/36% }
mars:   { x: 40%,   y: 20%,   z: -7,    radius: 18%  }
moon:   { x: 21%,   y: 72%,   z: 1,     radius: 6.5%  }
```
- `z` = depth (negative = farther); Earth at 0, Mars at -7, Moon at +1
- `radius` = on-screen visual size (scale applied to GLB)
- **Earth occludes Mars** when camera is at Overview position

### Parallax (Overview only, not reduced motion)
```js
smooth.current = damp(smooth.current, pointer.current, 4, delta)
// Applied per-body with different amounts:
Earth:  1.0×
Mars:   0.6×
Moon:   1.25×
```
- Smooth pointer-following offset on X/Y only
- Disabled during camera travel (`controller.current?.busy`) and in reduced motion

---

## 3. Planet Rotation & Animation

**File:** `src/scenes/rotationSettings.js` + `SpaceScene.jsx` useFrame

### Baseline Rates (rad/s, from authored GLB clips)
| Body | Rate |
|------|------|
| Earth surface | 0.012 |
| Earth clouds | 0.014 |
| Mars | 0.009 |
| Moon | 0.005 |

### Runtime Control
```js
effectiveRotationSpeed(speed, paused, reduced) = paused || reduced ? 0 : clamp(speed, 0..4)
```
- **Default speed**: 2.0× multiplier (user-adjustable 0.0–4.0×)
- **Pause/Resume**: Independent of camera — rotation continues during travel unless paused
- **AnimationMixer** updates each model's GLB clips at `delta * multiplier`

---

## 4. Destination Markers (Projected Anchors)

**Files:** `src/components/DestinationMarkers.jsx`, `src/scenes/planetGeometry.js`

### World Projection (`projectPlanetMarker`)
1. Project planet bounding sphere center to screen
2. **Raycast** from candidate screen points against **all opaque surfaces**
3. Only show marker if hit object name === `${name}-surface`
4. This prevents misleading endpoints on occluded planets (e.g., Mars behind Earth)

### Visual Elements
- **Leader line** (SVG) from label to surface hit point
- **Dot** at surface hit point
- **Button** with destination label (MOON / MARS + "EXPLORE DESTINATION")
- Colors: Moon = `--blue`, Mars = `--amber`
- Hidden when occluded or off-screen

### Responsive Positions (CSS fallbacks for initial render)
```css
/* Desktop */
.mars-marker  { left: 30.07%; top: 25px; }
.moon-marker  { left: 40.07%; top: 555px; }
/* Media queries adjust for viewport widths 761–1440px */
```

---

## 5. Content Transition (Hero / UI)

**File:** `src/hooks/useDestinationPresentation.js`

### Fade Behavior
| From → To | Opacity | Y-offset | Duration | Easing |
|-----------|---------|----------|----------|--------|
| Any → Different destination | 1 → 0.18 | 0 → 6px | 0.2s | `power1.out` |
| Arrival (phase: traveling) | 0.18 → 0.48 | 6 → 3px | 0.3s | `power2.out` |
| Arrival (phase: arrived) | 0.48 → 1 | 3 → 0px | 0.5s | `power2.out` |
| Reduced motion | Instant | 0 | 0s | — |

- **Single state update** at content swap (`setShown(destination)`)
- Previous fade cancelled before stale callback runs (`gsap.killTweensOf(node)`)

### Hero Content (`src/components/HeroContent.jsx`)
| Destination | Chapter | Title | Tagline |
|-------------|---------|-------|---------|
| Overview | FORGOTTEN WORLDS | EXPLORE. / DISCOVER. / REMEMBER. | The machines we left behind. The discoveries they made possible. |
| Moon | LUNAR EXPLORATION | THE / MOON. | Lunar exploration and surface hardware. |
| Mars | ROBOTIC EXPLORATION | MARS. | Robotic exploration and scientific discoveries. |

---

## 6. State Synchronization

### App-Level State (`src/App.jsx` — `OverviewExperience`)
```js
const [destination, setDestination] = useState('overview') // 'overview' | 'moon' | 'mars'
const [phase, setPhase] = useState('arrived')             // 'arrived' | 'traveling' | 'error'
const [phaseRef, destinationRef] = useRefs()              // refs for async coordination
```

### Navigation Flow
```js
navigate('moon') 
  → setDestination('moon'); setPhase('traveling'); requestRevision++
  → SpaceScene useEffect detects destination change
  → cameraTransitions.fly() starts
  → onJourney({ destination: 'moon', phase: 'traveling' })
  → onJourney({ destination: 'moon', phase: 'arrived' })
  → phaseRef = 'arrived'; setPhase('arrived')
```

### Props Passed to SpaceScene
```jsx
<SpaceScene
  destination={destination}           // 'overview' | 'moon' | 'mars'
  onJourney={onJourney}               // receives { destination, phase, error? }
  onSelectDestination={navigate}      // called by marker clicks
  reduced={reduced}                   // boolean (prefers-reduced-motion or user setting)
  visible={visible}                   // tab visibility (pauses render loop)
  rotationSpeed={rotationSpeed}       // 0–4 multiplier
  isRotationPaused={isRotationPaused} // boolean
  markers={markers}                   // ref for DestinationMarkers imperative API
  requestRevision={requestRevision}   // increments on each navigation
/>
```

---

## 7. Reduced Motion & Accessibility

- **System preference**: `matchMedia('(prefers-reduced-motion: reduce)')`
- **User override**: Stored in `localStorage.setItem('space-motion', 'reduce')`
- **Applied to**:
  - Camera transitions: instant (0s duration)
  - Content fades: instant
  - Parallax: disabled (`smooth = {0,0}`)
  - CSS: `html[data-reduced-motion='true'] * { transition: none !important; animation: none !important; }`
  - Scroll: `scroll-behavior: auto !important`

---

## 8. Key Files Summary

| File | Responsibility |
|------|----------------|
| `src/animation/cameraTransitions.js` | GSAP camera path planning & execution |
| `src/scenes/planetGeometry.js` | Bounding spheres, camera framing, marker projection |
| `src/scenes/rotationSettings.js` | Rotation speed config, AnimationMixer advancement |
| `src/scenes/SpaceScene.jsx` | Scene composition, render loop, transition trigger |
| `src/components/DestinationMarkers.jsx` | Imperative marker updates (leader lines, dots, buttons) |
| `src/hooks/useDestinationPresentation.js` | Content cross-fade during navigation |
| `src/components/HeroContent.jsx` | Destination-specific hero copy |
| `src/App.jsx` (OverviewExperience) | Navigation state machine, phase coordination |
| `src/index.css` | Marker positions, reduced-motion overrides, responsive layout |

---

## 9. Animation Principles (Do Not Change)

1. **No model reload/scale change** on navigation — planets stay mounted
2. **Camera independent of rotation** — pause rotation doesn't pause camera
3. **Raycast-verified markers** — never show endpoint on wrong planet
4. **Single source of truth** — `destination` state drives everything
5. **Compositor-friendly** — only `transform`, `opacity`, lens shift animated
6. **Reduced motion = instant** — no partial durations
7. **2.4s journey** — not stretched by hidden-tab suspension (`gsap.ticker.lagSmoothing(0)`)