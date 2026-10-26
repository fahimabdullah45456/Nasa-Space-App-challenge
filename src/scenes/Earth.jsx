import { forwardRef, useMemo } from 'react';
import { FrontSide, AdditiveBlending, Vector3 } from 'three';
export const SUN = new Vector3(-0.92, 0.4, 0.2).normalize();
const vertex = `varying vec3 vN; varying vec3 vV; void main(){vec4 wp=modelMatrix*vec4(position,1.0);vN=normalize(mat3(modelMatrix)*normal);vV=normalize(cameraPosition-wp.xyz);gl_Position=projectionMatrix*viewMatrix*wp;}`;
const fragment = `uniform vec3 sun;varying vec3 vN;varying vec3 vV;void main(){vec3 n=normalize(vN);float rim=pow(1.0-abs(dot(n,normalize(vV))),3.8);float light=smoothstep(-0.25,0.8,dot(n,sun));gl_FragColor=vec4(vec3(0.10,0.36,0.82),rim*(0.04+0.68*light));\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}`;
export default forwardRef(function Earth(
  { maps, surfaceRef, cloudRef, ...props },
  ref,
) {
  const atmosphere = useMemo(() => ({ sun: { value: SUN } }), []);
  const shader = useMemo(
    () => (shader) => {
      shader.uniforms.nightMap = { value: maps.night };
      shader.uniforms.sunDirection = { value: SUN };
      shader.vertexShader = shader.vertexShader
        .replace(
          '#include <common>',
          '#include <common>\nvarying vec3 planetNormal;',
        )
        .replace(
          '#include <begin_vertex>',
          '#include <begin_vertex>\nplanetNormal=normalize(mat3(modelMatrix)*normal);',
        );
      shader.fragmentShader = shader.fragmentShader
        .replace(
          '#include <common>',
          '#include <common>\nvarying vec3 planetNormal; uniform sampler2D nightMap; uniform vec3 sunDirection;',
        )
        .replace(
          '#include <emissivemap_fragment>',
          '#include <emissivemap_fragment>\nfloat dark=1.0-smoothstep(-0.14,0.12,dot(normalize(planetNormal),sunDirection));totalEmissiveRadiance+=texture2D(nightMap,vMapUv).rgb*dark*0.11;',
        );
    },
    [maps.night],
  );
  return (
    <group ref={ref} {...props}>
      <group rotation={[0.08, 0, 0.075]}>
        <mesh ref={surfaceRef} name="earth-surface" rotation={[0, -1.92, 0]}>
          <sphereGeometry args={[1, 96, 64]} />
          <meshStandardMaterial
            map={maps.day}
            roughness={0.78}
            metalness={0}
            onBeforeCompile={shader}
            customProgramCacheKey={() => 'earth-day-night-v1'}
          />
        </mesh>
        <mesh
          ref={cloudRef}
          name="earth-independent-clouds"
          rotation={[0, -1.92, 0]}
        >
          <sphereGeometry args={[1.004, 96, 64]} />
          <meshStandardMaterial
            color="#e6e9ed"
            alphaMap={maps.clouds}
            transparent
            opacity={0.72}
            alphaTest={0.015}
            roughness={1}
            depthWrite={false}
          />
        </mesh>
      </group>
      <mesh name="earth-atmosphere" renderOrder={3}>
        <sphereGeometry args={[1.012, 96, 64]} />
        <shaderMaterial
          uniforms={atmosphere}
          vertexShader={vertex}
          fragmentShader={fragment}
          side={FrontSide}
          blending={AdditiveBlending}
          transparent
          depthWrite={false}
        />
      </mesh>
    </group>
  );
});
