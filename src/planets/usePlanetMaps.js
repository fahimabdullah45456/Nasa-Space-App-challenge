import { useEffect, useState } from 'react';
import { useThree } from '@react-three/fiber';
import { TextureLoader, SRGBColorSpace, NoColorSpace, RepeatWrapping, ClampToEdgeWrapping, LinearMipmapLinearFilter } from 'three';
export const PLANET_MAPS = {
  earth: { day: 'earth-day.jpg', night: 'earth-night.jpg', clouds: 'earth-clouds.png', normal: 'earth-normal.png', roughness: 'earth-roughness.png' },
  mars: { day: 'mars-color.jpg', normal: 'mars-normal.png' },
  moon: { day: 'moon-color.jpg', normal: 'moon-normal.png' },
};
/** Each mounted component owns its textures; no shared-cache disposal surprises. */
export function usePlanetMaps(planet, assetPath = `${import.meta.env.BASE_URL}textures/planets/`) {
  const [state, setState] = useState({ maps: null, error: null });
  const gl = useThree(s => s.gl);
  useEffect(() => {
    let alive = true; const allocated = [];
    setState({ maps: null, error: null });
    const loader = new TextureLoader();
    Promise.all(Object.entries(PLANET_MAPS[planet]).map(async ([key, file]) => {
      const t = await loader.loadAsync(assetPath + file);
      if (!alive) { t.dispose(); return null; }
      allocated.push(t);
      t.colorSpace = ['day', 'night', 'clouds'].includes(key) ? SRGBColorSpace : NoColorSpace;
      t.wrapS = RepeatWrapping; t.wrapT = ClampToEdgeWrapping;
      t.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
      t.minFilter = LinearMipmapLinearFilter; t.needsUpdate = true;
      return [key, t];
    })).then(entries => { if (alive) setState({ maps: Object.fromEntries(entries), error: null }); })
      .catch(e => { if (alive) { setState({ maps: null, error: new Error(`${planet} texture load failed: ${e.message}`) }); alive = false; allocated.forEach(t => t.dispose()); } });
    return () => { alive = false; allocated.forEach(t => t.dispose()); };
  }, [planet, assetPath, gl]);
  if (state.error) throw state.error;
  return state.maps;
}
