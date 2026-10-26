import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Box3, Color, Vector3 } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { ArrowDownLeft, Focus, Move, Rotate3D, RotateCcw, Tag, ZoomIn } from 'lucide-react';

const GREEN = new Color('#b7e5a7');
function disposeClone(scene) {
  const materials = new Set();
  scene?.traverse((object) => {
    if (!object.isMesh) return;
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) materials.add(material);
  });
  materials.forEach((material) => material.dispose());
}
function containsMesh(node) {
  let found = false;
  node?.traverse((child) => { if (child.isMesh) found = true; });
  return found;
}

export default function AssetStage({
  modelUrl, modelLabel = '3D model', fallbackImage, fallbackAlt = '', fallbackCredit = '',
  componentList = [], selectedId, onSelect = () => {}, onVerifiedComponents = () => {}, mode = 'rover', contextNote,
}) {
  const [asset, setAsset] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [orbit, setOrbit] = useState(true);
  const [pan, setPan] = useState(false);
  const [zoom, setZoom] = useState(true);
  const [labels, setLabels] = useState(false);
  const controlsRef = useRef(null);
  const cameraRef = useRef(null);
  const sceneRef = useRef(null);
  const focusRef = useRef(null);
  const controls = useMemo(() => ({ rotate: orbit, pan, zoom }), [orbit, pan, zoom]);
  const componentKey = componentList.map((item) => `${item.id}:${item.selectable !== false}`).join('|');

  useEffect(() => {
    if (!modelUrl) { setAsset(null); setLoadError(''); return undefined; }
    let live = true;
    setAsset(null); setLoadError('');
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath(`${import.meta.env.BASE_URL}draco/`);
    dracoLoader.setWorkerLimit(2);
    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader);
    loader.loadAsync(modelUrl).then((gltf) => {
      const scene = gltf.scene.clone(true);
      const originalMaterials = new WeakMap();
      scene.traverse((object) => {
        if (!object.isMesh) return;
        const cloneMaterial = (material) => {
          const copy = material.clone();
          if (mode === 'terrain') {
            copy.color?.set('#89877f');
            copy.vertexColors = false;
            if ('roughness' in copy) copy.roughness = 0.94;
            if ('metalness' in copy) copy.metalness = 0;
          }
          originalMaterials.set(copy, {
            color: copy.color?.clone(), emissive: copy.emissive?.clone(), emissiveIntensity: copy.emissiveIntensity,
          });
          return copy;
        };
        object.material = Array.isArray(object.material) ? object.material.map(cloneMaterial) : cloneMaterial(object.material);
      });
      // NASA STL height maps use +Z as up. Three.js scenes conventionally use +Y.
      if (mode === 'terrain') scene.rotation.x = -Math.PI / 2;
      const bounds = new Box3().setFromObject(scene);
      const center = bounds.getCenter(new Vector3());
      const size = bounds.getSize(new Vector3());
      const maxSize = Math.max(size.x, size.y, size.z) || 1;
      const fit = mode === 'terrain' ? 3.6 / maxSize : 2.8 / maxSize;
      const componentMap = {};
      for (const item of componentList) {
        if (item.selectable === false) continue;
        const target = scene.getObjectByName(item.id);
        if (target && containsMesh(target)) componentMap[item.id] = target;
      }
      if (!live) { disposeClone(scene); return; }
      setAsset({ scene, center, fit, componentMap, originalMaterials });
      onVerifiedComponents(Object.keys(componentMap));
    }).catch((error) => {
      if (live) {
        setLoadError(`The 3D asset could not be loaded: ${error?.message || 'network or file error'}`);
        onVerifiedComponents([]);
      }
    });
    return () => { live = false; dracoLoader.dispose(); };
    // componentKey deliberately represents only exact, verified node names.
  }, [modelUrl, mode, componentKey]);

  useEffect(() => {
    if (!asset) return undefined;
    return () => disposeClone(asset.scene);
  }, [asset]);

  useEffect(() => {
    if (!asset) return;
    const targets = new Set();
    const selected = asset.componentMap[selectedId];
    if (selected) selected.traverse((object) => { if (object.isMesh) targets.add(object); });
    asset.scene.traverse((object) => {
      if (!object.isMesh) return;
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
        const initial = asset.originalMaterials.get(material);
        if (!initial) continue;
        if (initial.color && material.color) material.color.copy(initial.color);
        if (initial.emissive && material.emissive) material.emissive.copy(initial.emissive);
        material.emissiveIntensity = initial.emissiveIntensity;
      }
      if (!targets.has(object)) return;
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
        if (material.color && asset.originalMaterials.get(material)?.color) material.color.copy(asset.originalMaterials.get(material).color).lerp(GREEN, 0.65);
        if (material.emissive) { material.emissive.copy(GREEN); material.emissiveIntensity = 0.45; }
      }
    });
  }, [asset, selectedId]);

  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.enableRotate = controls.rotate;
      controlsRef.current.enablePan = controls.pan;
      controlsRef.current.enableZoom = controls.zoom;
    }
  }, [controls, asset]);

  const resetView = () => {
    const camera = cameraRef.current, orbitControls = controlsRef.current;
    if (!camera || !orbitControls) return;
    camera.position.set(0, mode === 'terrain' ? 5.2 : 1.05, mode === 'terrain' ? 5.8 : 5.55);
    orbitControls.target.set(0, 0, 0);
    orbitControls.update();
  };
  const focusSelected = () => {
    const target = asset?.componentMap[selectedId];
    const camera = cameraRef.current, orbitControls = controlsRef.current;
    if (!target || !camera || !orbitControls) return;
    target.updateWorldMatrix(true, true);
    const bounds = new Box3().setFromObject(target);
    const center = bounds.getCenter(new Vector3());
    const radius = Math.max(bounds.getSize(new Vector3()).length() * 1.2, 0.65);
    const direction = camera.position.clone().sub(orbitControls.target).normalize();
    camera.position.copy(center).add(direction.multiplyScalar(radius * 2.4));
    orbitControls.target.copy(center);
    orbitControls.update();
  };
  focusRef.current = focusSelected;
  const selected = componentList.find((item) => item.id === selectedId);
  const verified = asset ? Object.keys(asset.componentMap) : [];

  return <section className={`asset-stage ${mode === 'terrain' ? 'terrain-stage' : ''}`} aria-label={`${modelLabel} viewer`}>
    <div className="stage-canvas" aria-label={`Interactive ${modelLabel} 3D view`}>
      {asset && <Canvas camera={{ position: [0, mode === 'terrain' ? 5.2 : 1.05, mode === 'terrain' ? 5.8 : 5.55], fov: 42 }} dpr={[1, 1.7]} onCreated={({ camera }) => { cameraRef.current = camera; }}>
        <color attach="background" args={['#050a10']} />
        <ambientLight intensity={mode === 'terrain' ? 0.62 : 1.25} />
        <directionalLight position={[4, 6, 5]} intensity={2.2} />
        <directionalLight position={[-4, 2, -5]} intensity={0.7} color="#9bb7ff" />
        <group scale={asset.fit}>
          <primitive
            object={asset.scene}
            position={[-asset.center.x, -asset.center.y, -asset.center.z]}
            onClick={(event) => {
              if (!verified.length) return;
              let node = event.object;
              while (node && node !== asset.scene) {
                const item = componentList.find((part) => asset.componentMap[part.id] === node);
                if (item) { event.stopPropagation(); onSelect(item.id); return; }
                node = node.parent;
              }
            }}
          />
        </group>
        <OrbitControls ref={controlsRef} makeDefault enableDamping dampingFactor={0.08} minDistance={1.6} maxDistance={11} />
      </Canvas>}
      {!asset && <div className="stage-placeholder">
        {fallbackImage && <img src={fallbackImage} alt={fallbackAlt} />}
        <div className="stage-placeholder-note">
          <span className="eyebrow">{!modelUrl ? 'NO VERIFIED MODEL' : loadError ? 'MODEL UNAVAILABLE' : 'LOADING 3D VIEW'}</span>
          <p>{loadError || contextNote || 'Preparing the sourced 3D asset…'}</p>
          {fallbackCredit && <small>{fallbackCredit}</small>}
        </div>
      </div>}
      {asset && labels && <div className="stage-annotation" role="status">
        <span className="eyebrow">ANNOTATION</span>
        {selected ? <><strong>{selected.title}</strong><span>{selected.description}</span></> : <span>Choose a component to show its label and explanation.</span>}
      </div>}
      {contextNote && asset && <div className="stage-context-note">{contextNote}</div>}
    </div>
    <div className="stage-toolbar" role="toolbar" aria-label="3D viewer controls">
      <button aria-pressed={orbit} onClick={() => setOrbit((value) => !value)} title="Toggle orbit"><Rotate3D size={16} /> Orbit</button>
      <button aria-pressed={pan} onClick={() => setPan((value) => !value)} title="Toggle pan"><Move size={16} /> Pan</button>
      <button aria-pressed={zoom} onClick={() => setZoom((value) => !value)} title="Toggle zoom"><ZoomIn size={16} /> Zoom</button>
      <button aria-pressed={labels} onClick={() => setLabels((value) => !value)} title="Toggle labels"><Tag size={16} /> Labels</button>
      <button disabled={!asset || !selectedId || !verified.includes(selectedId)} onClick={focusSelected} title="Focus selected component"><Focus size={16} /> Focus</button>
      <button onClick={resetView} disabled={!asset} title="Reset camera"><RotateCcw size={16} /> Reset</button>
      <span className="stage-hint"><ArrowDownLeft size={14} /> Drag to orbit · scroll to zoom</span>
    </div>
  </section>;
}
