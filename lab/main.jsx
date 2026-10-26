import React,{Component,Suspense,useRef,useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Canvas,useThree} from '@react-three/fiber';
import {OrbitControls} from '@react-three/drei';
import {ACESFilmicToneMapping,SRGBColorSpace,Vector3} from 'three';
import {Earth,Mars,Moon,PlanetLighting} from '../src/planets';
import './preview.css';
import PortableModel from './PortableModel';
const params=new URLSearchParams(location.search);const all={Earth,Mars,Moon};
const SUN=params.get('light')==='side'?[-4,.8,.5]:params.get('light')==='reverse'?[3,1,2]:[-3,1.5,3];
class Boundary extends Component{state={error:null};static getDerivedStateFromError(error){return {error};}componentDidCatch(){this.props.onError?.();}render(){return this.state.error?<p role="alert">Model could not load. {this.state.error.message} Reload to retry.</p>:this.props.children;}}
function Inspector({name,root,status}){
 const {gl,scene,camera}=useThree();
 useEffect(()=>{let canceled=false; const tick=()=>{const surface=root.current?.getObjectByName(name.toLowerCase()+'-surface');if(surface){status('ready');return;}if(!canceled)setTimeout(tick,100);};tick();return()=>{canceled=true};},[root,name,status]);
 useEffect(()=>{
   // Explicit QA/export switch only; production preview has no diagnostics by default.
   if(!params.has('qa')&&!params.has('export'))return;
   window.__PLANET_LAB__??={};
   const entry={root,scene,camera,gl,snapshot:()=>{const g=root.current; const meshes=[];g?.traverse(o=>{if(o.isMesh)meshes.push({name:o.name,geometry:o.geometry.type,vertices:o.geometry.attributes.position.count,angle:o.rotation.y,normal:!!o.material.normalMap,mapSize:o.material.map?[o.material.map.image.width,o.material.map.image.height]:null});});return {meshes,position:g?.position.toArray(),camera:camera.position.toArray(),frames:gl.info.render.frame,calls:gl.info.render.calls};},angle:(a)=>{root.current?.traverse(o=>{if(o.name.endsWith('surface')||o.name==='earth-clouds')o.rotation.y=a;});}};
   entry.exportGLB=async()=>{const {exportPlanet}=await import('./exportPlanet');await exportPlanet(root.current,name);};
   window.__PLANET_LAB__[name]=entry;
   return()=>{delete window.__PLANET_LAB__?.[name];};
 },[name,root,scene,camera,gl]);
 return null;
}
function CameraFit(){
 const {camera,size}=useThree();
 useEffect(()=>{if(params.has('close'))return;const aspect=size.width/size.height;const half=Math.atan(Math.tan(camera.fov*Math.PI/360)*Math.min(aspect,1));camera.position.set(0,0,Math.max(3.8,1.12/Math.sin(half)));camera.lookAt(0,0,0);camera.updateProjectionMatrix();},[camera,size.width,size.height]);return null;
}
function Viewer({name}){
 const Model=all[name];const root=useRef();const [state,setState]=useState('loading');const close=params.has('close');
 const initial={Earth:-1.9,Mars:-1.3,Moon:-Math.PI/2}[name]+Number(params.get('angle')||0);
 return <figure data-planet={name} data-status={state}><Boundary onError={()=>setState('error')}><Canvas dpr={[1,1.5]} camera={{position:[0,0,close?2.65:3.8],fov:38,near:.02,far:100}} gl={{antialias:true,preserveDrawingBuffer:params.has('export'),powerPreference:'high-performance'}} onCreated={({gl})=>{gl.toneMapping=ACESFilmicToneMapping;gl.toneMappingExposure=1;gl.outputColorSpace=SRGBColorSpace;}} fallback={<p role="alert">WebGL is required to inspect these models.</p>}>
 <CameraFit/><color attach="background" args={['#05070a']} /><PlanetLighting direction={SUN} />
 <Suspense fallback={null}>{params.has('glb')?<PortableModel name={name} ref={root} rotating={!params.has('still')}/>:<Model ref={root} initialRotation={initial} rotating={!params.has('still')} {...(params.has('speed')?{rotationSpeed:Number(params.get('speed'))}:{})} {...(name==='Earth'?{cloudsRotating:!params.has('still'),...(params.has('cloudSpeed')?{cloudSpeed:Number(params.get('cloudSpeed'))}:{}),sunDirection:SUN,clouds:!params.has('noClouds'),atmosphere:!params.has('noAir'),nightLights:!params.has('noNight')}:{})} />}</Suspense>
 <OrbitControls makeDefault enableDamping dampingFactor={.08} minDistance={1.15} maxDistance={8} />
 <Inspector name={name} root={root} status={setState}/>
 </Canvas></Boundary>{state==='loading'&&<span className="loading">Loading {name} textures…</span>}
 <figcaption>{name}<span>Drag to orbit · Scroll to inspect</span></figcaption></figure>;
}
const selected=Object.keys(all).includes(params.get('planet'))?params.get('planet'):null;
createRoot(document.getElementById('root')).render(<main className={selected?'single':'three'} aria-label="Independent 3D planet previews">{(selected?[selected]:Object.keys(all)).map(name=><Viewer key={name} name={name}/>)}</main>);
