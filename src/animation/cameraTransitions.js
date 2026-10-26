import gsap from 'gsap';
import { QuadraticBezierCurve3, Vector3 } from 'three';
// Visible slow frames must not stretch a 2.4s journey into minutes. Hidden-tab
// suspension is handled explicitly by the scene, independently of rotation.
gsap.ticker.lagSmoothing(0);

export function planCameraPath(start, end, obstacles = []) {
  const distance = start.distanceTo(end);
  const control = start.clone().lerp(end, .5).add(new Vector3(-distance * .10, distance * .07, 0));
  const curve = new QuadraticBezierCurve3(start.clone(), control, end.clone());
  const point = new Vector3();
  for (let pass = 0; pass < 8; pass++) {
    let changed = false;
    for (const sphere of obstacles) for (let i = 1; i < 40; i++) {
      const t = i / 40;
      curve.getPoint(t, point);
      const clearance = sphere.radius * 1.12;
      const gap = point.distanceTo(sphere.center);
      if (gap >= clearance) continue;
      const away = point.clone().sub(sphere.center);
      if (away.lengthSq() < 1e-8) away.set(-1, 1, 0);
      control.addScaledVector(away.normalize(), (clearance - gap + .01) / (2 * t * (1 - t)));
      changed = true;
    }
    if (!changed) break;
  }
  for (const sphere of obstacles) for (let i = 1; i < 80; i++) {
    if (curve.getPoint(i / 80, point).distanceTo(sphere.center) < sphere.radius * 1.02) throw new Error('A safe camera approach could not be calculated. Return to Overview and retry.');
  }
  return curve;
}

// Sole camera owner. The live scene has no OrbitControls to compete with it.
export function createCameraTransitions(camera, invalidate, reduced) {
  let timeline = null, pending = null, busy = false, lensShift = 0;
  let currentPlan = null, lastResult = null;
  const target = camera.position.clone().addScaledVector(camera.getWorldDirection(new Vector3()), 18);
  const home = { position: new Vector3(0,0,18), target: new Vector3(), lensShift: 0 };
  function cancel() {
    timeline?.kill(); timeline = null; busy = false;
    pending?.({ cancelled: true }); pending = null;
  }
  function fly(plan, { duration = 2.4, obstacles = [] } = {}) {
    const from = camera.position.clone(), fromTarget = target.clone(), initialLens = lensShift;
    const curve = planCameraPath(from, plan.position, obstacles);
    cancel();
    busy = true;
    currentPlan = { ...plan, path: curve.getPoints(40).map((point) => point.toArray()) };
    const motion = { progress: 0 };
    const update = () => {
      curve.getPoint(motion.progress, camera.position);
      target.lerpVectors(fromTarget, plan.target, motion.progress);
      lensShift = initialLens + ((plan.lensShift || 0) - initialLens) * motion.progress;
      if (Math.abs(lensShift) > 1e-7) camera.setViewOffset(plan.viewport.width, plan.viewport.height, plan.viewport.width * lensShift, 0, plan.viewport.width, plan.viewport.height);
      else camera.clearViewOffset();
      camera.lookAt(target); camera.updateMatrixWorld(true); invalidate();
    };
    return new Promise((resolve) => {
      pending = resolve;
      const finish = () => { busy = false; timeline = null; lastResult = { cancelled: false }; pending = null; resolve(lastResult); };
      if (reduced() || duration === 0) { motion.progress = 1; update(); finish(); return; }
      timeline = gsap.timeline().to(motion, { progress: 1, duration, ease: 'power2.inOut', onUpdate: update, onComplete: finish });
    });
  }
  return {
    get busy() { return busy; },
    get target() { return target; },
    get lensShift() { return lensShift; },
    get plan() { return currentPlan; },
    get activeTimelines() { return timeline ? 1 : 0; },
    fly,
    reset(viewport, options) { return fly({ ...home, position: home.position.clone(), target: home.target.clone(), viewport }, { duration: 2.2, ...options }); },
    complete() { timeline?.progress(1); },
    suspend(value) { if (timeline) value ? timeline.pause() : timeline.resume(); },
    cancel,
  };
}
