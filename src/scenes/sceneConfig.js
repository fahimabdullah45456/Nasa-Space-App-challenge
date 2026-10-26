import { Vector3 } from 'three';
// Retain the existing application’s illumination direction.
export const SUN = new Vector3(-0.92, 0.4, 0.2).normalize();

// Authored GLB baseline rates (radians/second). Actual animation uses the
// supplied clips via AnimationMixer, not these reference values. Not astronomical time.
export const RATES = {
  earth: 0.012,
  clouds: 0.014,
  mars: 0.009,
  moon: 0.005,
};
export function advanceAngle(angle, delta, rate) {
  return angle + delta * rate;
}
