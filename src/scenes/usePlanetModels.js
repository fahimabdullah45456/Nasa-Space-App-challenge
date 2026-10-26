import { useEffect, useState } from 'react';
import { AnimationMixer } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// These exact, self-contained files were extracted from planet-glb-models.zip.
// Keep paths explicit: never fall back to the old image-based scene.
export const MODEL_PATHS = Object.freeze({
  earth: `${import.meta.env.BASE_URL}models/planets/earth.glb`,
  mars: `${import.meta.env.BASE_URL}models/planets/mars.glb`,
  moon: `${import.meta.env.BASE_URL}models/planets/moon.glb`,
});
const LAYERS = { earth: ['earth-surface', 'earth-clouds'], mars: ['mars-surface'], moon: ['moon-surface'] };

function disposeModel(model) {
  model.mixer?.stopAllAction();
  model.mixer?.uncacheRoot(model.scene);
  const geometries = new Set(), materials = new Set(), textures = new Set(), images = new Set();
  model.scene.traverse((object) => {
    if (!object.isMesh) return;
    geometries.add(object.geometry);
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      materials.add(material);
      for (const value of Object.values(material)) if (value?.isTexture) textures.add(value);
    }
  });
  textures.forEach((texture) => { images.add(texture.source?.data); texture.dispose(); });
  images.forEach((image) => image?.close?.());
  materials.forEach((material) => material.dispose());
  geometries.forEach((geometry) => geometry.dispose());
}

export function usePlanetModels(onReady, onError, anisotropy) {
  const [models, setModels] = useState(null);
  useEffect(() => {
    let live = true;
    const allocated = new Set();
    const loader = new GLTFLoader();
    const disposeAll = () => { allocated.forEach(disposeModel); allocated.clear(); };
    Promise.all(Object.entries(MODEL_PATHS).map(async ([name, url]) => {
      let gltf;
      try { gltf = await loader.loadAsync(url); }
      catch (error) { throw new Error(`Could not load ${url}: ${error.message || String(error)}`); }
      const model = { ...gltf, url };
      if (!live) { disposeModel(model); return null; }
      allocated.add(model);
      model.layers = Object.fromEntries(LAYERS[name].map((layer) => {
        const mesh = model.scene.getObjectByName(layer);
        if (!mesh?.isMesh) throw new Error(`${url}: required mesh "${layer}" is missing.`);
        return [layer, mesh];
      }));
      model.scene.traverse((object) => {
        if (!object.isMesh) return;
        for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
          for (const texture of Object.values(material)) if (texture?.isTexture) texture.anisotropy = Math.min(anisotropy, 8);
          // glTF BLEND does not encode Three.js depthWrite. Keep independent
          // transparent clouds from masking the surface; no material replacement.
          if (material.transparent) { material.depthWrite = false; object.renderOrder = 1; }
        }
      });
      model.mixer = new AnimationMixer(model.scene);
      model.actions = LAYERS[name].map((layer) => {
        const clip = model.animations.find((item) => item.name === `${layer}-rotation`);
        if (!clip) throw new Error(`${url}: required animation "${layer}-rotation" is missing.`);
        return model.mixer.clipAction(clip).play();
      });
      // Evaluate the supplied initial quaternions before the first visible frame.
      model.mixer.update(0);
      return [name, model];
    })).then((entries) => {
      if (live) { setModels(Object.fromEntries(entries)); onReady(); }
    }).catch((error) => {
      if (live) { live = false; disposeAll(); onError(error); }
    });
    return () => { live = false; disposeAll(); };
  }, [onReady, onError, anisotropy]);
  return models;
}
