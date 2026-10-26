import { Vector3 } from 'three';
export const atmosphereVertex = `
varying vec3 worldNormal; varying vec3 worldView;
void main(){vec4 wp=modelMatrix*vec4(position,1.);worldNormal=normalize(mat3(modelMatrix)*normal);worldView=cameraPosition-wp.xyz;gl_Position=projectionMatrix*viewMatrix*wp;}`;
// Directional single-shell Rayleigh/Mie-inspired approximation, not spectral ray marching.
export const atmosphereFragment = `
uniform vec3 sunDirection; uniform float strength; varying vec3 worldNormal;varying vec3 worldView;
void main(){vec3 n=normalize(worldNormal);vec3 v=normalize(worldView);vec3 s=normalize(sunDirection);
float mu=max(dot(n,v),0.);float day=smoothstep(-.18,.5,dot(n,s));float edge=pow(1.-mu,4.5);
float rayleigh=.75*(1.+pow(dot(v,s),2.));float forward=pow(max(dot(v,s),0.),12.);
vec3 blue=vec3(.12,.35,.8)*rayleigh+vec3(.32,.20,.11)*forward;
gl_FragColor=vec4(blue,edge*day*strength);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`;
/** Specializes standard PBR without replacing Three's lighting/color pipeline. */
export function earthSurfaceShader(maps, uniforms) {
  return shader => {
    shader.uniforms.planetNight = { value: maps.night };
    shader.uniforms.planetCloud = { value: maps.clouds };
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 planetWorldNormal;').replace('#include <begin_vertex>', '#include <begin_vertex>\nplanetWorldNormal=normalize(mat3(modelMatrix)*normal);');
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', `#include <common>
varying vec3 planetWorldNormal;uniform sampler2D planetNight;uniform sampler2D planetCloud;uniform vec3 sunDirection;uniform float cloudOffset;uniform float cloudShadow;uniform float nightIntensity;`)
      .replace('#include <color_fragment>', `#include <color_fragment>
float sunDot=dot(normalize(planetWorldNormal),normalize(sunDirection));
float cloudCover=texture2D(planetCloud,vec2(fract(vMapUv.x+cloudOffset),vMapUv.y)).a;
diffuseColor.rgb*=1.-cloudCover*cloudShadow*smoothstep(-.08,.35,sunDot);`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
float nightMask=1.-smoothstep(-.22,.08,sunDot);
vec3 nightColor=texture2D(planetNight,vMapUv).rgb;
nightColor=pow(nightColor,vec3(1.8));totalEmissiveRadiance+=nightColor*nightMask*nightIntensity;`);
  };
}
export function directionUniform(direction) { return { value: new Vector3(...direction).normalize() }; }
