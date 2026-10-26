import {
  Component,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  ACESFilmicToneMapping,
  SRGBColorSpace,
  MathUtils,
  Vector3,
  Raycaster,
} from 'three';
import { SUN } from './sceneConfig';
import { effectiveRotationSpeed, advancePlanetAnimations } from './rotationSettings';
import StarField from './StarField';
import { usePlanetModels } from './usePlanetModels';
import { localModelSphere, worldModelSphere, projectPlanetMarker, fitPlanetCamera } from './planetGeometry';
import { createCameraTransitions } from '../animation/cameraTransitions';
class SceneBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(e) {
    this.props.onError(e);
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}
function composition(width, height) {
  const mobile = width < 760;
  const f = height / (2 * Math.tan((32 * Math.PI) / 360));
  const p = (x, y, z, r) => {
    const distance = 18 - z;
    const radius = (distance * r) / Math.sqrt(f * f + r * r);
    const correction = 1 - (radius * radius) / (distance * distance);
    return {
      position: [
        (((x - width / 2) * distance) / f) * correction,
        (((height / 2 - y) * distance) / f) * correction,
        z,
      ],
      radius,
    };
  };
  return mobile
    ? {
        earth: p(
          width * 0.67,
          height * 0.46,
          0,
          Math.min(width * 0.32, height * 0.36),
        ),
        mars: p(width * 0.4, height * 0.2, -7, width * 0.18),
        moon: p(width * 0.21, height * 0.72, 1, width * 0.065),
      }
    : {
        earth: p(width * 0.692, height * 0.459, 0, width * 0.2144),
        mars: p(width * 0.524, height * 0.459 - width * 0.14195, -7, width * 0.098),
        moon: p(
          width * (width < 1150 ? 0.49 : 0.444),
          height * 0.459 + width * (width < 1150 ? 0.15 : 0.10577),
          1,
          width * 0.035,
        ),
      };
}
function World({ api, reduced, visible, rotationSpeed, isRotationPaused, markers, destination, requestRevision, onJourney, onSelectDestination, onReady, onError }) {
  const { size, gl, camera, scene: threeScene, invalidate } = useThree();
  const layout = useMemo(
    () => composition(size.width, size.height),
    [size.width, size.height],
  );
  const models = usePlanetModels(
    onReady,
    onError,
    gl.capabilities.getMaxAnisotropy(),
  );
  const localBounds = useMemo(() => models && Object.fromEntries(Object.entries(models).map(([name, model]) => [name, localModelSphere(model)])), [models]);
  useEffect(() => {
    const lost = (e) => {
      e.preventDefault();
      onError(new Error('WebGL context was lost. Retry to restore the scene.'));
    };
    gl.domElement.addEventListener('webglcontextlost', lost);
    return () => gl.domElement.removeEventListener('webglcontextlost', lost);
  }, [gl, onError]);
  const earth = useRef(),
    clouds = useRef(),
    mars = useRef(),
    moon = useRef();
  useEffect(() => {
    earth.current = models?.earth.layers['earth-surface'];
    clouds.current = models?.earth.layers['earth-clouds'];
    mars.current = models?.mars.layers['mars-surface'];
    moon.current = models?.moon.layers['moon-surface'];
  }, [models]);
  const eg = useRef(),
    mg = useRef(),
    lg = useRef();
  const pointer = useRef({ x: 0, y: 0 });
  const smooth = useRef({ x: 0, y: 0 });
  const count = useRef(0);
  const elapsedSceneSeconds = useRef(0);
  const skipDelta = useRef(true);
  useEffect(() => {
    skipDelta.current = true;
  }, [visible, reduced]);
  const controller = useRef();
  const latestReduced = useRef(reduced);
  latestReduced.current = reduced;
  useEffect(() => {
    controller.current = createCameraTransitions(
      camera,
      invalidate,
      () => latestReduced.current,
    );
    return () => controller.current?.cancel();
  }, [camera, invalidate]);
  useEffect(() => {
    const layer = gl.domElement;
    const move = (e) => {
      const b = layer.getBoundingClientRect();
      pointer.current = {
        x: MathUtils.clamp(((e.clientX - b.left) / b.width) * 2 - 1, -1, 1),
        y: MathUtils.clamp(((e.clientY - b.top) / b.height) * 2 - 1, -1, 1),
      };
    };
    const reset = () => {
      pointer.current = { x: 0, y: 0 };
    };
    if (matchMedia('(pointer:fine)').matches) {
      window.addEventListener('pointermove', move);
      document.addEventListener('pointerleave', reset);
    }
    return () => {
      window.removeEventListener('pointermove', move);
      document.removeEventListener('pointerleave', reset);
    };
  }, [gl]);
  const initialized = useRef(false);
  const lastFraming = useRef(null);
  useEffect(() => {
    if (!models || !controller.current) return;
    const flight = controller.current;
    // Stable body positions during a scripted approach; no globe is resized.
    smooth.current = { x: 0, y: 0 };
    for (const [ref, name] of [[eg, 'earth'], [mg, 'mars'], [lg, 'moon']]) ref.current?.position.set(...layout[name].position);
    threeScene.updateMatrixWorld(true);
    const spheres = Object.fromEntries(Object.entries(models).map(([name, model]) => [name, worldModelSphere(model, localBounds[name])]));
    if (!initialized.current && destination === 'overview') {
      initialized.current = true;
      lastFraming.current = { destination, width: size.width, height: size.height };
      onJourney({ destination, phase: 'arrived' });
      return;
    }
    initialized.current = true;
    const resized = lastFraming.current?.destination === destination;
    lastFraming.current = { destination, width: size.width, height: size.height };
    let cancelled = false;
    onJourney({ destination, phase: 'traveling' });
    try {
      const options = { duration: resized ? .65 : destination === 'overview' ? 2.2 : 2.4, obstacles: Object.values(spheres) };
      const promise = destination === 'overview'
        ? flight.reset({ width: size.width, height: size.height }, options)
        : flight.fly(fitPlanetCamera(spheres[destination], camera, size.width, size.height, destination), options);
      promise.then((result) => {
        if (!cancelled && !result.cancelled) onJourney({ destination, phase: 'arrived' });
      });
    } catch (error) { onJourney({ destination, phase: 'error', error: error.message }); }
    return () => { cancelled = true; flight.cancel(); };
  }, [models, localBounds, layout, destination, camera, size.width, size.height, threeScene, onJourney, requestRevision]);
  useEffect(() => { controller.current?.suspend(!visible); }, [visible]);
  useEffect(() => { if (reduced) controller.current?.complete(); }, [reduced]);
  useImperativeHandle(api, () => ({
    focusDestination: (name) => onSelectDestination(name),
    resetCamera: () => onSelectDestination('overview'),
  }), [onSelectDestination]);
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    window.__SPACE_EXPLORER__ = {
      snapshot: () => ({
        ready: !!models,
        markers: markers.current?.snapshot(),
        destination,
        isTransitioning: !!controller.current?.busy,
        activeTimelines: controller.current?.activeTimelines,
        target: controller.current?.target.toArray(),
        cameraQuaternion: camera.quaternion.toArray(),
        cameraLensShift: controller.current?.lensShift,
        cameraPlan: controller.current?.plan && {
          position: controller.current.plan.position.toArray(),
          target: controller.current.plan.target.toArray(),
          radius: controller.current.plan.radius,
          distance: controller.current.plan.distance,
          path: controller.current.plan.path,
        },
        worldBounds: models && Object.fromEntries(Object.entries(models).map(([name, model]) => {
          const bound = worldModelSphere(model, localBounds[name]);
          const center = bound.center.clone().project(camera);
          return [name, { center: bound.center.toArray(), radius: bound.radius, projected: center.toArray() }];
        })),
        rotationSpeed,
        isRotationPaused,
        effectiveRotationSpeed: effectiveRotationSpeed(rotationSpeed, isRotationPaused, reduced),
        modelUrls: models && Object.values(models).map((model) => model.url),
        modelIds: models && Object.values(models).map((model) => model.scene.uuid),
        meshIds: [earth, clouds, mars, moon].map((ref) => ref.current?.uuid),
        materialIds: [earth, clouds, mars, moon].map((ref) => ref.current?.material.uuid),
        quaternions: [earth, clouds, mars, moon].map((ref) => ref.current?.quaternion.toArray()),
        animationTimes: models && Object.values(models).flatMap((model) => model.actions.map((action) => action.time)),
        animationPeriods: models && Object.values(models).flatMap((model) => model.actions.map((action) => action.getClip().duration)),
        meshNames: models && Object.values(models).flatMap((model) => Object.keys(model.layers)),
        normalMaps: [earth, mars, moon].map((ref) => !!ref.current?.material.normalMap),
        mapSizes: [earth, mars, moon].map((ref) => [ref.current?.material.map?.image.width, ref.current?.material.map?.image.height]),
        frames: count.current,
        elapsedSceneSeconds: elapsedSceneSeconds.current,
        scenePlanetMeshes: (() => {
          const names = [];
          threeScene.traverse((object) => { if (object.isMesh && /^(earth|mars|moon)-(surface|clouds)$/.test(object.name)) names.push(object.name); });
          return names;
        })(),
        reduced,
        visible,
        earth: earth.current && 2 * Math.atan2(earth.current.quaternion.y, earth.current.quaternion.w),
        clouds: clouds.current && 2 * Math.atan2(clouds.current.quaternion.y, clouds.current.quaternion.w),
        mars: mars.current && 2 * Math.atan2(mars.current.quaternion.y, mars.current.quaternion.w),
        moon: moon.current && 2 * Math.atan2(moon.current.quaternion.y, moon.current.quaternion.w),
        geometry: [earth, mars, moon].map((x) => x.current?.geometry.type),
        cloudGeometry: clouds.current?.geometry.type,
        pixelRatio: gl.getPixelRatio(),
        camera: camera.position.toArray(),
        layout,
        drawCalls: gl.info.render.calls,
        triangles: gl.info.render.triangles,
        textures: gl.info.memory.textures,
      }),
      focusDestination: (name) => api.current.focusDestination(name),
      resetCamera: () => api.current.resetCamera(),
      loseContext: () =>
        gl.getContext().getExtension('WEBGL_lose_context')?.loseContext(),
      occlusion: () => {
        const point = new Vector3(...layout.mars.position)
          .lerp(new Vector3(...layout.earth.position), 0.4)
          .project(camera);
        const ray = new Raycaster();
        ray.setFromCamera({ x: point.x, y: point.y }, camera);
        return ray
          .intersectObjects([earth.current, mars.current])
          .map((hit) => hit.object.name);
      },
    };
    return () => {
      delete window.__SPACE_EXPLORER__;
    };
  }, [models, reduced, visible, layout, camera, gl, api, rotationSpeed, isRotationPaused, threeScene, destination, localBounds, markers]);
  useFrame((_, dt) => {
    count.current++;
    if (!models || !visible) return;
    const delta = skipDelta.current ? 0 : dt;
    skipDelta.current = false;
    elapsedSceneSeconds.current += delta;
    const multiplier = effectiveRotationSpeed(rotationSpeed, isRotationPaused, reduced);
    if (multiplier > 0) {
      // One existing R3F frame callback; the authored GLB clips retain their own
      // rates, including independent surface/cloud motion. Never seek/reset time.
      advancePlanetAnimations(models, delta, multiplier);
    }
    if (!reduced && destination === 'overview' && !controller.current?.busy) {
      smooth.current.x = MathUtils.damp(
        smooth.current.x,
        pointer.current.x,
        4,
        delta,
      );
      smooth.current.y = MathUtils.damp(
        smooth.current.y,
        pointer.current.y,
        4,
        delta,
      );
    } else {
      smooth.current = { x: 0, y: 0 };
    }
    for (const [ref, body, amount] of [
      [eg, layout.earth, 1],
      [mg, layout.mars, 0.6],
      [lg, layout.moon, 1.25],
    ])
      if (ref.current) {
        ref.current.position.set(
          body.position[0] + smooth.current.x * 0.035 * amount,
          body.position[1] - smooth.current.y * 0.025 * amount,
          body.position[2],
        );
      }
    threeScene.updateMatrixWorld(true);
    const surfaces = [earth.current, mars.current, moon.current].filter(Boolean);
    for (const name of ['moon', 'mars']) markers.current?.update(name, projectPlanetMarker(name, worldModelSphere(models[name], localBounds[name]), camera, size, surfaces, destination));
  });
  return (
    <>
      <ambientLight intensity={0.06} />
      <directionalLight
        position={SUN.clone().multiplyScalar(25).toArray()}
        intensity={2.4}
      />
      <StarField />
      {models && (
        <>
          <group ref={eg} name="earth-placement" position={layout.earth.position} scale={layout.earth.radius} rotation={[0.08, 0, 0.075]}>
            <primitive object={models.earth.scene} dispose={null} />
          </group>
          <group ref={mg} name="mars-placement" position={layout.mars.position} scale={layout.mars.radius} rotation={[0.06, 0, 0.04]}>
            <primitive object={models.mars.scene} dispose={null} />
          </group>
          <group ref={lg} name="moon-placement" position={layout.moon.position} scale={layout.moon.radius} rotation={[0.04, 0, 0.08]}>
            <primitive object={models.moon.scene} dispose={null} />
          </group>
        </>
      )}
    </>
  );
}
export default forwardRef(function SpaceScene(
  { reduced, visible, quality, rotationSpeed, isRotationPaused, markers, destination, onJourney, onSelectDestination, onUnavailable, onAvailable, requestRevision },
  ref,
) {
  const [status, setStatus] = useState('loading'),
    [error, setError] = useState(''),
    [attempt, setAttempt] = useState(0);
  const onReady = useCallback(() => { setStatus('ready'); onAvailable?.(); }, [onAvailable]);
  const onError = useCallback((e) => {
    setError(e.message || 'The 3D environment could not start.');
    setStatus('error');
    onUnavailable?.(e);
  }, [onUnavailable]);
  useEffect(() => {
    if (status !== 'loading') return;
    const timeout = setTimeout(
      () =>
        onError(
          new Error(
            'The planetary assets took too long to load. Check the connection, then retry.',
          ),
        ),
      60000,
    );
    return () => clearTimeout(timeout);
  }, [status, onError, attempt]);
  const retry = () => {
    setError('');
    setStatus('loading');
    setAttempt((n) => n + 1);
  };
  return (
    <div
      className={'scene-layer ' + (status === 'ready' ? 'is-ready' : '')}
      data-testid="scene"
      data-status={status}
    >
      <div
        className="canvas-wrap"
        role="img"
        aria-label={destination === 'overview' ? 'Real-time 3D Earth, independent clouds, Mars behind Earth, and the Moon. Not to astronomical scale.' : `Real-time 3D ${destination === 'moon' ? 'Moon' : 'Mars'} exploration close-up. Not to astronomical scale.`}
      >
        {status !== 'error' && (
          <SceneBoundary key={attempt} onError={onError}>
            <Canvas
              camera={{ fov: 32, position: [0, 0, 18], near: 0.1, far: 120 }}
              dpr={
                quality === 'low' ? 1 : quality === 'high' ? [1, 2] : [1, 1.5]
              }
              frameloop={!visible ? 'never' : reduced ? 'demand' : 'always'}
              gl={{
                antialias: true,
                alpha: true,
                powerPreference: 'high-performance',
              }}
              onCreated={({ gl }) => {
                gl.toneMapping = ACESFilmicToneMapping;
                gl.toneMappingExposure = 0.95;
                gl.outputColorSpace = SRGBColorSpace;
              }}
              fallback={<span>WebGL is unavailable on this device.</span>}
            >
              <World
                api={ref}
                markers={markers}
                destination={destination}
                requestRevision={requestRevision}
                onJourney={onJourney}
                onSelectDestination={onSelectDestination}
                reduced={reduced}
                visible={visible}
                rotationSpeed={rotationSpeed}
                isRotationPaused={isRotationPaused}
                onReady={onReady}
                onError={onError}
              />
            </Canvas>
          </SceneBoundary>
        )}
      </div>
      {status === 'loading' && (
        <p className="scene-feedback" role="status">
          Loading supplied planetary models…
        </p>
      )}
      {status === 'error' && (
        <div className="scene-feedback scene-error" role="alert">
          <strong>3D environment unavailable</strong>
          <p>{error}</p>
          <button onClick={retry}>Retry scene</button>
          <span>The archive and page controls remain available.</span>
        </div>
      )}
    </div>
  );
});
