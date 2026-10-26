import { useEffect, useState } from 'react';
import {
  TextureLoader,
  SRGBColorSpace,
  NoColorSpace,
  LinearMipmapLinearFilter,
  RepeatWrapping,
  ClampToEdgeWrapping,
} from 'three';
import { texturePaths } from '../data/missions';
export function usePlanetTextures(onReady, onError, anisotropy) {
  const [maps, setMaps] = useState(null);
  useEffect(() => {
    let live = true;
    const allocated = [];
    const loader = new TextureLoader();
    Promise.all(
      Object.entries(texturePaths).map(async ([name, url]) => {
        const texture = await loader.loadAsync(url).catch(() => {
          throw new Error(`Could not load ${url}`);
        });
        if (!live) {
          texture.dispose();
          return null;
        }
        allocated.push(texture);
        texture.colorSpace = name === 'clouds' ? NoColorSpace : SRGBColorSpace;
        texture.wrapS = RepeatWrapping;
        texture.wrapT = ClampToEdgeWrapping;
        texture.minFilter = LinearMipmapLinearFilter;
        texture.anisotropy = Math.min(anisotropy, 8);
        texture.needsUpdate = true;
        return [name, texture];
      }),
    )
      .then((entries) => {
        if (live) {
          setMaps(Object.fromEntries(entries));
          onReady();
        }
      })
      .catch((error) => {
        if (live) {
          onError(
            new Error(
              'A required planetary texture could not be loaded. ' +
                error.message,
            ),
          );
          live = false;
          allocated.forEach((t) => t.dispose());
        }
      });
    return () => {
      live = false;
      allocated.forEach((t) => t.dispose());
    };
  }, [onReady, onError, anisotropy]);
  return maps;
}
