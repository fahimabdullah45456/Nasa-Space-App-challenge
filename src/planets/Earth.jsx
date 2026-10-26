import { forwardRef, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, FrontSide } from 'three';
import { usePlanetMaps } from './usePlanetMaps';
import { useRotation } from './useRotation';
import { DEFAULT_SUN } from './PlanetLighting';
import { atmosphereVertex, atmosphereFragment, earthSurfaceShader, directionUniform } from './PlanetMaterials';
/** Radius 1; +Y north. ref -> Group; named child meshes remain independently accessible. */
export default forwardRef(function Earth({ radius = 1, initialRotation = -1.9, rotationSpeed = .012, cloudSpeed = .014, rotating = true, cloudsRotating = true, reducedMotion, clouds = true, atmosphere = true, surface = true, nightLights = true, cloudShadows = true, sunDirection = DEFAULT_SUN, assetPath, ...props }, ref) {
  const maps = usePlanetMaps('earth', assetPath); const earth = useRef(); const cloud = useRef();
  useRotation(earth, { rotating, rotationSpeed, reducedMotion });
  useRotation(cloud, { rotating: cloudsRotating && rotating, rotationSpeed: cloudSpeed, reducedMotion });
  const uniforms = useMemo(() => ({ sunDirection: directionUniform(sunDirection), cloudOffset: { value: 0 }, cloudShadow: { value: clouds && cloudShadows ? .18 : 0 }, nightIntensity: { value: nightLights ? .22 : 0 } }), [sunDirection, clouds, cloudShadows, nightLights]);
  const airUniforms = useMemo(() => ({ sunDirection: directionUniform(sunDirection), strength: { value: .64 } }), [sunDirection]);
  const compile = useMemo(() => maps ? earthSurfaceShader(maps, uniforms) : undefined, [maps, uniforms]);
  useFrame(() => { uniforms.cloudOffset.value = ((earth.current?.rotation.y ?? initialRotation) - (cloud.current?.rotation.y ?? initialRotation)) / (2 * Math.PI); });
  if (!maps) return null;
  return <group ref={ref} {...props} scale={props.scale ?? radius} name={props.name ?? 'Earth'}>
    <mesh ref={earth} name="earth-surface" visible={surface} rotation={[0, initialRotation, 0]}>
      <sphereGeometry args={[1, 192, 128]} />
      <meshPhysicalMaterial map={maps.day} normalMap={maps.normal} normalScale={[.32,.32]} roughnessMap={maps.roughness} roughness={1} metalness={0} ior={1.333} specularIntensity={.55} onBeforeCompile={compile} customProgramCacheKey={() => 'planet-lab-earth-pbr-v2'} />
    </mesh>
    {clouds && <mesh ref={cloud} name="earth-clouds" rotation={[0, initialRotation, 0]} scale={1.0035} renderOrder={1}>
      <sphereGeometry args={[1, 160, 96]} />
      <meshStandardMaterial map={maps.clouds} transparent opacity={.88} depthWrite={false} roughness={1} metalness={0} />
    </mesh>}
    {atmosphere && <mesh name="earth-atmosphere" scale={1.009} renderOrder={2}>
      <sphereGeometry args={[1,160,96]} />
      <shaderMaterial uniforms={airUniforms} vertexShader={atmosphereVertex} fragmentShader={atmosphereFragment} transparent depthWrite={false} side={FrontSide} blending={AdditiveBlending} />
    </mesh>}
  </group>;
});
