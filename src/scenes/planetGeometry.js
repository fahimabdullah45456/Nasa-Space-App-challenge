import { Sphere, Vector3, Raycaster, MathUtils } from 'three';

// Compute once from loaded GLB vertices. Rotation never changes the radius of
// these spherical assets; matrixWorld supplies all live parent transforms.
export function localModelSphere(model) {
  model.scene.updateMatrixWorld(true);
  const mesh = model.layers[Object.keys(model.layers).find((name) => name.endsWith('-surface'))];
  mesh.geometry.computeBoundingSphere();
  return mesh.geometry.boundingSphere.clone();
}
export function worldModelSphere(model, localSphere, result = new Sphere()) {
  const mesh = model.layers[Object.keys(model.layers).find((name) => name.endsWith('-surface'))];
  mesh.updateWorldMatrix(true, false);
  return result.copy(localSphere).applyMatrix4(mesh.matrixWorld);
}

export const FRAMING = Object.freeze({ occupancy: .76, margin: 1.08, duration: 2.4 });
export function fitPlanetCamera(sphere, camera, width, height, name, options = {}) {
  const { occupancy, margin } = { ...FRAMING, ...options };
  const halfVertical = MathUtils.degToRad(camera.fov / 2);
  const screenCenterX = options.screenCenterX ?? (width > 1050 ? .68 : width > 760 ? .70 : .5);
  const halfHorizontal = Math.atan(Math.tan(halfVertical) * width / height * 2 * Math.min(screenCenterX, 1 - screenCenterX));
  // Fit the whole bounding sphere in the narrower dimension, not just a box.
  const distance = sphere.radius * margin / Math.sin(Math.min(halfVertical, halfHorizontal) * occupancy);
  const direction = new Vector3(...(name === 'mars' ? [-1, .35, .5] : [-.75, .3, 1])).normalize();
  return { position: sphere.center.clone().addScaledVector(direction, distance), target: sphere.center.clone(), distance, radius: sphere.radius, lensShift: .5 - screenCenterX, viewport: { width, height } };
}

const ray = new Raycaster();
const projected = new Vector3();
const right = new Vector3();
const edge = new Vector3();
const view = new Vector3();
export function projectPlanetMarker(name, sphere, camera, size, surfaces, destination = 'overview') {
  projected.copy(sphere.center).project(camera);
  view.copy(sphere.center).applyMatrix4(camera.matrixWorldInverse);
  if (view.z >= 0 || projected.z < -1 || projected.z > 1) return null;
  const cx = (projected.x + 1) * size.width / 2;
  const cy = (1 - projected.y) * size.height / 2;
  right.setFromMatrixColumn(camera.matrixWorld, 0);
  edge.copy(sphere.center).addScaledVector(right, sphere.radius).project(camera);
  const radius = Math.abs((edge.x - projected.x) * size.width / 2);
  if (cx + radius < 0 || cx - radius > size.width || cy + radius < 0 || cy - radius > size.height) return null;
  // Raycast the candidate screen point against ALL opaque planet surfaces.
  // A marker is never shown with an endpoint on a nearer, different planet.
  for (const [ox, oy] of [[-.6,.3],[-.55,-.3],[0,0],[0,-.6],[.5,-.45],[.5,.3]]) {
    const x = cx + radius * ox, y = cy + radius * oy;
    if (x < 4 || y < 4 || x > size.width - 4 || y > size.height - 4) continue;
    ray.setFromCamera({ x: x / size.width * 2 - 1, y: 1 - y / size.height * 2 }, camera);
    const hit = ray.intersectObjects(surfaces, false)[0];
    if (hit?.object.name !== `${name}-surface`) continue;
    const labelWidth = name === 'mars' ? 150 : 78;
    // Reserve the existing text column on narrower desktop overviews. Only
    // label layout changes; the endpoint always remains the verified GLB hit.
    const rightOfBody = destination === 'overview' && size.width > 760 && size.width <= (name === 'mars' ? 1050 : 1300);
    const desiredX = rightOfBody ? cx + radius + 16 : name === 'mars' ? cx - radius - 140 : size.width > 760 && size.width <= 1050 ? cx - radius - 72 : x - 45;
    const lx = MathUtils.clamp(desiredX, 12, Math.max(12, size.width - labelWidth - 12));
    const ly = MathUtils.clamp(name === 'mars' ? cy - radius - (rightOfBody ? 76 : 28) : cy + radius + 24, 12, Math.max(12, size.height - 56));
    return { anchor: [x,y], center: [cx,cy], radius, worldCenter: sphere.center.toArray(), worldEndpoint: hit.point.toArray(), hit: hit.object.name, label: [lx,ly], start: [lx + (rightOfBody ? 4 : name === 'mars' ? 128 : 34), ly + (name === 'mars' ? 40 : 0)] };
  }
  return null;
}
