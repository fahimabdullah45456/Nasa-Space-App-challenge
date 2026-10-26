import { forwardRef, useRef } from 'react';
import { usePlanetMaps } from './usePlanetMaps';
import { useRotation } from './useRotation';
export default forwardRef(function Moon({ radius = 1, initialRotation = -Math.PI/2, rotationSpeed = .005, rotating = true, reducedMotion, relief = 1, assetPath, ...props }, ref) {
  const maps = usePlanetMaps('moon',assetPath); const mesh=useRef();
  useRotation(mesh,{rotating,rotationSpeed,reducedMotion});
  if (!maps) return null;
  return <group ref={ref} {...props} scale={props.scale ?? radius} name={props.name ?? 'Moon'}><mesh name="moon-surface" ref={mesh} rotation={[0,initialRotation,0]}>
    <sphereGeometry args={[1,160,96]} /><meshStandardMaterial map={maps.day} normalMap={maps.normal} normalScale={[relief,relief]} roughness={1} metalness={0} />
  </mesh></group>;
});
