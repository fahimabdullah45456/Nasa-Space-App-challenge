import { forwardRef,useEffect,useMemo } from 'react';
import { useLoader,useFrame } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { AnimationMixer } from 'three';
import { useReducedMotion } from '../src/planets/useRotation';
export default forwardRef(function PortableModel({name,rotating=true},ref){
 const gltf=useLoader(GLTFLoader,`${import.meta.env.BASE_URL}models/planets/${name.toLowerCase()}.glb`);
 const mixer=useMemo(()=>new AnimationMixer(gltf.scene),[gltf]);const reduce=useReducedMotion();
 useEffect(()=>{gltf.animations.forEach(c=>mixer.clipAction(c).play());return()=>{mixer.stopAllAction();mixer.uncacheRoot(gltf.scene)};},[gltf,mixer]);
 useFrame((_,dt)=>{if(rotating&&!reduce&&!document.hidden)mixer.update(dt);});
 return <group ref={ref}><primitive object={gltf.scene}/></group>;
});
