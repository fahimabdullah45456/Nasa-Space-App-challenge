import { useMemo } from 'react';
export default function StarField() {
  const positions = useMemo(() => {
    let seed = 53;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    return new Float32Array(
      Array.from({ length: 90 }, () => [
        (rand() - 0.5) * 58,
        (rand() - 0.5) * 32,
        -18 - rand() * 20,
      ]).flat(),
    );
  }, []);
  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#bacbdb"
        size={0.028}
        sizeAttenuation
        transparent
        opacity={0.46}
        depthWrite={false}
      />
    </points>
  );
}
