import { useEffect, useState, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
export function integrateAngle(angle, seconds, speed) { return angle + seconds * speed; }
export function useReducedMotion(override) {
  const [system, setSystem] = useState(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => { const m = window.matchMedia('(prefers-reduced-motion: reduce)'); const changed = () => setSystem(m.matches); m.addEventListener('change', changed); return () => m.removeEventListener('change', changed); }, []);
  return override ?? system;
}
export function useRotation(ref, { rotating = true, rotationSpeed = .012, reducedMotion } = {}) {
  const reduce = useReducedMotion(reducedMotion);
  const resumed = useRef(false);
  useEffect(() => { const visibility = () => { resumed.current = true; }; document.addEventListener('visibilitychange', visibility); return () => document.removeEventListener('visibilitychange', visibility); }, []);
  useFrame((_, dt) => { if (resumed.current) { resumed.current = false; return; } if (ref.current && rotating && !reduce && !document.hidden) ref.current.rotation.y = integrateAngle(ref.current.rotation.y, dt, rotationSpeed); });
}
