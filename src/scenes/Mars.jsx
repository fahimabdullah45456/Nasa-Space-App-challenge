import { forwardRef } from 'react';
export default forwardRef(function Mars({ map, surfaceRef, ...props }, ref) {
  return (
    <group ref={ref} {...props}>
      <mesh name="mars-surface" ref={surfaceRef} rotation={[0.06, 0.7, 0.04]}>
        <sphereGeometry args={[1, 80, 48]} />
        <meshStandardMaterial
          map={map}
          color="#bdb4af"
          roughness={0.95}
          metalness={0}
        />
      </mesh>
    </group>
  );
});
