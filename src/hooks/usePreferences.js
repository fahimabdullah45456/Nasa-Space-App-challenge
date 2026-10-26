import { useEffect, useState } from 'react';
import { DEFAULT_ROTATION, ROTATION_STORAGE_KEY, clampRotationSpeed, validateRotationPreference } from '../scenes/rotationSettings';
export function usePreferences() {
  const [systemReduced, setSystemReduced] = useState(
    () => matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const [mode, setMode] = useState(() => {
    try {
      return localStorage.getItem('space-motion') || 'system';
    } catch {
      return 'system';
    }
  });
  const [rotation, setRotation] = useState(() => {
    try { return validateRotationPreference(JSON.parse(localStorage.getItem(ROTATION_STORAGE_KEY))); }
    catch { return { ...DEFAULT_ROTATION }; }
  });
  useEffect(() => {
    try { localStorage.setItem(ROTATION_STORAGE_KEY, JSON.stringify(rotation)); }
    catch { /* Private browsing or storage limits must not break the controls. */ }
  }, [rotation]);
  const [visible, setVisible] = useState(!document.hidden);
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const change = () => setSystemReduced(media.matches);
    const visibility = () => setVisible(!document.hidden);
    media.addEventListener('change', change);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      media.removeEventListener('change', change);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, []);
  function setMotion(value) {
    setMode(value);
    try {
      localStorage.setItem('space-motion', value);
    } catch {
      /* storage is optional */
    }
  }
  return {
    reduced: systemReduced || mode === 'reduce',
    mode,
    setMotion,
    visible,
    ...rotation,
    setRotationSpeed: (value) => setRotation((previous) => ({ ...previous, rotationSpeed: clampRotationSpeed(value) })),
    toggleRotationPaused: () => setRotation((previous) => ({ ...previous, isRotationPaused: !previous.isRotationPaused })),
    resetRotation: () => setRotation({ ...DEFAULT_ROTATION }),
  };
}
