import {test,expect} from '@playwright/test';
import {Sphere,Vector3,PerspectiveCamera} from 'three';
import {fitPlanetCamera} from '../src/scenes/planetGeometry.js';
import {createCameraTransitions,planCameraPath} from '../src/animation/cameraTransitions.js';
test('GLB-bound camera fitting accounts for portrait and desktop viewports and model scale',()=>{
 for(const [width,height]of [[1440,668],[800,720],[390,390]])for(const radius of [.3,1,5]){
  const camera=new PerspectiveCamera(32,width/height,.1,200);const bound=new Sphere(new Vector3(2,-1,-4),radius);
  const plan=fitPlanetCamera(bound,camera,width,height,'moon');camera.position.copy(plan.position);camera.setViewOffset(width,height,width*plan.lensShift,0,width,height);camera.lookAt(plan.target);camera.updateMatrixWorld(true);
  for(let a=0;a<Math.PI*2;a+=.15)for(let b=0;b<Math.PI;b+=.15){const point=new Vector3(Math.cos(a)*Math.sin(b),Math.sin(a)*Math.sin(b),Math.cos(b)).multiplyScalar(radius).add(bound.center).project(camera);expect(Math.abs(point.x)).toBeLessThan(1);expect(Math.abs(point.y)).toBeLessThan(1);}
  expect(plan.target.toArray()).toEqual(bound.center.toArray());
 }
});
test('camera timeline can be interrupted without a jump and retains a single owner',async()=>{
 const camera=new PerspectiveCamera(32,2,.1,200);camera.position.set(0,0,18);camera.lookAt(0,0,0);
 const c=createCameraTransitions(camera,()=>{},()=>false);const sphere=new Sphere(new Vector3(-2,0,-2),1);const plan=fitPlanetCamera(sphere,camera,1440,668,'moon');
 const first=c.fly(plan);const before=camera.position.clone();const second=c.reset({width:1440,height:668});expect(camera.position.toArray()).toEqual(before.toArray());expect(await first).toEqual({cancelled:true});expect(c.activeTimelines).toBe(1);c.complete();expect(await second).toEqual({cancelled:false});expect(camera.position.toArray()).toEqual([0,0,18]);expect(c.activeTimelines).toBe(0);
});
test('approach detours around an intervening surface',()=>{
 const obstacle=new Sphere(new Vector3(),2);const path=planCameraPath(new Vector3(0,0,8),new Vector3(0,0,-8),[obstacle]);for(const point of path.getPoints(120))expect(point.distanceTo(obstacle.center)).toBeGreaterThan(2.02);
});

test('Moon and Mars marker endpoints hit their own meshes; occluded and behind-camera labels disappear', async()=>{
 const {Mesh,SphereGeometry,MeshBasicMaterial,Raycaster}=await import('three');
 const {projectPlanetMarker}=await import('../src/scenes/planetGeometry.js');
 const camera=new PerspectiveCamera(32,1440/668,.1,200);camera.position.set(0,0,18);camera.lookAt(0,0,0);camera.updateMatrixWorld(true);
 const bodies=[['earth',3,[3,0,0]],['moon',.6,[-2,-1,1]],['mars',1,[0,3,-5]]].map(([name,radius,position])=>{const mesh=new Mesh(new SphereGeometry(radius,32,24),new MeshBasicMaterial());mesh.name=`${name}-surface`;mesh.position.set(...position);mesh.updateMatrixWorld(true);return {mesh,radius,name};});
 const surfaces=bodies.map(b=>b.mesh);const ray=new Raycaster();
 for(const body of bodies.filter(b=>b.name!=='earth')){
  const sphere=new Sphere(body.mesh.position.clone(),body.radius);const marker=projectPlanetMarker(body.name,sphere,camera,{width:1440,height:668},surfaces);
  expect(marker).not.toBeNull();ray.setFromCamera({x:marker.anchor[0]/1440*2-1,y:1-marker.anchor[1]/668*2},camera);const hit=ray.intersectObjects(surfaces,false)[0];expect(hit.object).toBe(body.mesh);expect(hit.point.toArray()).toEqual(marker.worldEndpoint);
  camera.aspect=1;camera.updateProjectionMatrix();const resized=projectPlanetMarker(body.name,sphere,camera,{width:390,height:390},surfaces);expect(resized.hit).toBe(`${body.name}-surface`);expect(resized.anchor).not.toEqual(marker.anchor);camera.aspect=1440/668;camera.updateProjectionMatrix();
 }
 const moon=bodies.find(b=>b.name==='moon');moon.mesh.position.copy(bodies[0].mesh.position);moon.mesh.updateMatrixWorld(true);expect(projectPlanetMarker('moon',new Sphere(moon.mesh.position.clone(),.6),camera,{width:1440,height:668},surfaces)).toBeNull();
 expect(projectPlanetMarker('moon',new Sphere(new Vector3(0,0,20),.6),camera,{width:1440,height:668},surfaces)).toBeNull();
 for(const body of bodies){body.mesh.geometry.dispose();body.mesh.material.dispose();}
});
