export const DEFAULT_ROTATION_SPEED = 2;
export const ROTATION_STORAGE_KEY = 'space-rotation';
export const DEFAULT_ROTATION = Object.freeze({
  rotationSpeed: DEFAULT_ROTATION_SPEED,
  isRotationPaused: false,
});

export function clampRotationSpeed(value) {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.round(Math.min(4, Math.max(0, value)) * 10) / 10
    : DEFAULT_ROTATION_SPEED;
}

export function validateRotationPreference(value) {
  return {
    rotationSpeed: clampRotationSpeed(value?.rotationSpeed),
    isRotationPaused: value?.isRotationPaused === true,
  };
}

export function effectiveRotationSpeed(speed, paused, reduced) {
  return paused || reduced ? 0 : clampRotationSpeed(speed);
}

export function advancePlanetAnimations(models, delta, multiplier) {
  if (multiplier <= 0) return;
  for (const model of Object.values(models)) model.mixer.update(delta * multiplier);
}
