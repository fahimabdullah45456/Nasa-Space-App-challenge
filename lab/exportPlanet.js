import {GLTFExporter} from 'three/examples/jsm/exporters/GLTFExporter.js';
import {AnimationClip,QuaternionKeyframeTrack,Quaternion,Vector3,MeshStandardMaterial} from 'three';
/** Portable PBR baseline; runtime-only atmospheric/night/shadow shaders are intentionally omitted. */
export async function exportPlanet(object,name){
 const copy=object.clone(true);const remove=[];const clips=[];
 copy.traverse(o=>{if(!o.isMesh)return;if(o.name==='earth-atmosphere'){remove.push(o);return;}
   o.geometry=o.geometry.clone();o.geometry.computeTangents();
   // Degenerate UV triangles at sphere poles have no unique tangent. Supply a
   // normalized perpendicular fallback rather than exporting invalid zero vectors.
   const ta=o.geometry.attributes.tangent,na=o.geometry.attributes.normal;
   for(let i=0;i<ta.count;i++){const t=new Vector3(ta.getX(i),ta.getY(i),ta.getZ(i));if(t.lengthSq()<.5){const n=new Vector3().fromBufferAttribute(na,i);t.set(Math.abs(n.y)>.9?1:0,Math.abs(n.y)>.9?0:1,0).cross(n).normalize();ta.setXYZW(i,t.x,t.y,t.z,1);}}

   const old=o.material;
   if(old.map&&!old.transparent)old.map.userData.mimeType='image/jpeg';const m=new MeshStandardMaterial({map:old.map??null,normalMap:old.normalMap??null,normalScale:old.normalScale?.clone(),roughnessMap:old.roughnessMap??null,roughness:old.roughness??1,metalness:0,color:old.color?.clone(),transparent:old.transparent,opacity:old.opacity,depthWrite:old.depthWrite});
   o.material=m;
   const speed={'earth-surface':.012,'earth-clouds':.014,'mars-surface':.009,'moon-surface':.005}[o.name];
   if(speed){const period=2*Math.PI/speed;const times=[],values=[];for(let i=0;i<=8;i++){times.push(period*i/8);const q=new Quaternion().setFromAxisAngle(new Vector3(0,1,0),o.rotation.y+i*Math.PI/4);values.push(...q.toArray());}clips.push(new AnimationClip(`${o.name}-rotation`,period,[new QuaternionKeyframeTrack(`${o.name}.quaternion`,times,values)]));}
 });remove.forEach(o=>o.removeFromParent());copy.userData={description:'Planet Model Lab portable PBR baseline. See PLANET-LAB.md for shader limitations and asset credits.'};
 const data=await new GLTFExporter().parseAsync(copy,{binary:true,animations:clips,maxTextureSize:8192});
 const blob=new Blob([data],{type:'model/gltf-binary'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`${name.toLowerCase()}.glb`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 copy.traverse(o=>{if(o.isMesh){o.material.dispose();o.geometry.dispose();}});
}
