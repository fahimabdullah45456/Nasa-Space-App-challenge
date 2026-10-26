import { forwardRef } from 'react';
export default forwardRef(function Moon({ map, surfaceRef, ...props }, ref) {
  return (
    <group ref={ref} {...props}>
      <mesh name="moon-surface" ref={surfaceRef} rotation={[0.04, -1.5, 0.08]}>
        <sphereGeometry args={[1, 64, 48]} />
        <meshStandardMaterial
          map={map}
          color="#bcb9b4"
          roughness={1}
          metalness={0}
        />
      </mesh>
    </group>
  );
});
