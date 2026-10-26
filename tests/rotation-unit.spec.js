import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { Object3D, AnimationMixer, AnimationClip, QuaternionKeyframeTrack } from 'three';
import { advancePlanetAnimations, effectiveRotationSpeed, clampRotationSpeed, validateRotationPreference, DEFAULT_ROTATION } from '../src/scenes/rotationSettings.js';

// Read the actual, unmodified supplied GLB animation buffers. No WebGL, texture
// substitutions or synthesized rotation tracks are involved in these unit tests.
function suppliedAnimationModels() {
  return Object.fromEntries(['earth', 'mars', 'moon'].map((name) => {
    const bytes = readFileSync(`public/models/planets/${name}.glb`);
    const jsonLength = bytes.readUInt32LE(12);
    const json = JSON.parse(bytes.subarray(20, 20 + jsonLength).toString());
    const bin = 28 + jsonLength;
    const read = (index) => {
      const accessor = json.accessors[index], view = json.bufferViews[accessor.bufferView];
      const components = { SCALAR: 1, VEC4: 4 }[accessor.type];
      expect(accessor.componentType).toBe(5126);
      return Array.from({ length: accessor.count * components }, (_, i) => bytes.readFloatLE(bin + (view.byteOffset || 0) + (accessor.byteOffset || 0) + i * 4));
    };
    const scene = new Object3D();
    json.nodes.filter((node) => node.mesh !== undefined).forEach((node) => { const child = new Object3D(); child.name = node.name; scene.add(child); });
    const mixer = new AnimationMixer(scene);
    const actions = json.animations.map((animation) => {
      const channel = animation.channels[0], sampler = animation.samplers[channel.sampler];
      const target = json.nodes[channel.target.node].name;
      const clip = new AnimationClip(animation.name, -1, [new QuaternionKeyframeTrack(`${target}.quaternion`, read(sampler.input), read(sampler.output))]);
      return mixer.clipAction(clip).play();
    });
    mixer.update(0);
    return [name, { scene, mixer, actions }];
  }));
}
function state(models) {
  return Object.values(models).flatMap((model) => model.scene.children.map((child) => child.quaternion.toArray()));
}

test('rotation values validate, clamp and preserve pause separately from zero speed', () => {
  expect(DEFAULT_ROTATION).toEqual({ rotationSpeed: 2, isRotationPaused: false });
  expect([-1, 0, 1, 2, 3.04, 4, 99].map(clampRotationSpeed)).toEqual([0, 0, 1, 2, 3, 4, 4]);
  for (const invalid of [NaN, Infinity, -Infinity, null, undefined, '3', {}, []]) expect(clampRotationSpeed(invalid)).toBe(2);
  expect(validateRotationPreference(null)).toEqual(DEFAULT_ROTATION);
  expect(validateRotationPreference({ rotationSpeed: 99, isRotationPaused: 'true' })).toEqual({ rotationSpeed: 4, isRotationPaused: false });
  expect(effectiveRotationSpeed(3, true, false)).toBe(0);
  expect(effectiveRotationSpeed(3, false, false)).toBe(3);
  expect(effectiveRotationSpeed(0, false, false)).toBe(0);
  expect(effectiveRotationSpeed(4, false, true)).toBe(0);
});

for (const speed of [0, 1, 2, 4]) {
  test(`supplied clips at ${speed}x are frame-rate independent at 30/60/120 fps`, () => {
    const results = [30, 60, 120].map((fps) => {
      const models = suppliedAnimationModels(), before = state(models);
      for (let i = 0; i < fps * 10; i++) advancePlanetAnimations(models, 1 / fps, speed);
      const after = state(models);
      Object.values(models).flatMap((model) => model.actions).forEach((action) => expect(action.time).toBeCloseTo(10 * speed, 9));
      if (speed === 0) expect(after).toEqual(before);
      else after.forEach((quaternion, i) => expect(quaternion).not.toEqual(before[i]));
      return after;
    });
    results[0].flat().forEach((value, i) => expect(value).toBeCloseTo(results[2].flat()[i], 9));
    results[1].flat().forEach((value, i) => expect(value).toBeCloseTo(results[2].flat()[i], 9));
  });
}

test('supplied cloud and planet clips keep independent baseline rates', () => {
  const models = suppliedAnimationModels();
  const periods = Object.values(models).flatMap((model) => model.actions.map((action) => action.getClip().duration));
  const rates = periods.map((period) => 2 * Math.PI / period);
  [.012, .014, .009, .005].forEach((rate, i) => expect(rates[i]).toBeCloseTo(rate, 8));
  const initial = state(models);
  advancePlanetAnimations(models, 5, 2);
  state(models).forEach((q, i) => {
    const angle = 2 * Math.atan2(q[1], q[3]) - 2 * Math.atan2(initial[i][1], initial[i][3]);
    expect(angle).toBeCloseTo(rates[i] * 10, 6);
  });
});

test('speed changes and pause/resume never seek or reset the supplied orientations', () => {
  const models = suppliedAnimationModels();
  advancePlanetAnimations(models, 1, effectiveRotationSpeed(3, false, false));
  const a = state(models);
  advancePlanetAnimations(models, 100, effectiveRotationSpeed(3, true, false));
  expect(state(models)).toEqual(a);
  advancePlanetAnimations(models, 100, effectiveRotationSpeed(0, false, false));
  expect(state(models)).toEqual(a);
  advancePlanetAnimations(models, 1, effectiveRotationSpeed(3, false, false));
  Object.values(models).flatMap((model) => model.actions).forEach((action) => expect(action.time).toBe(6));
  const b = state(models);
  advancePlanetAnimations(models, 0, 4);
  expect(state(models)).toEqual(b);
  advancePlanetAnimations(models, 1, 2);
  Object.values(models).flatMap((model) => model.actions).forEach((action) => expect(action.time).toBe(8));
});
