export const DEFAULT_SUN = [-3, 1.5, 3];
/** Direction from each planet toward a distant Sun. Use the same vector on Earth. */
export default function PlanetLighting({ direction = DEFAULT_SUN, intensity = 3, fill = .025 }) {
  return <><ambientLight intensity={fill} /><directionalLight position={direction.map(v => v * 100)} intensity={intensity} /></>;
}
