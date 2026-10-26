import { forwardRef, useRef } from 'react';
import { usePlanetMaps } from './usePlanetMaps';
import { useRotation } from './useRotation';
export default forwardRef(function Mars({ radius = 1, initialRotation = -1.3, rotationSpeed = .009, rotating = true, reducedMotion, relief = 1, assetPath, ...props }, ref) {
  const maps = usePlanetMaps('mars',assetPath); const mesh=useRef();
  useRotation(mesh,{rotating, rotationSpeed,reducedMotion});
  if (!maps) return null;
  return <group ref={ref} {...props} scale={props.scale ?? radius} name={props.name ?? 'Mars'}><mesh name="mars-surface" ref={mesh} rotation={[0,initialRotation,0]}>
    <sphereGeometry args={[1,160,96]} /><meshStandardMaterial map={maps.day} normalMap={maps.normal} normalScale={[relief,relief]} color="#ddd2c9" roughness={.96} metalness={0} />
  </mesh></group>;
});
