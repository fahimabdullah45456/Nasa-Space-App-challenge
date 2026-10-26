import { useEffect, useRef, useState } from 'react';
import { Settings2, Pause, Play, RotateCcw } from 'lucide-react';

export default function DisplaySettings({
  rotationSpeed, isRotationPaused, setRotationSpeed, toggleRotationPaused,
  resetRotation, reduced, mode, setMotion, quality, setQuality,
}) {
  const [open, setOpen] = useState(false);
  const anchor = useRef(null), trigger = useRef(null), slider = useRef(null);
  useEffect(() => {
    if (!open) return;
    const focus = requestAnimationFrame(() => slider.current?.focus());
    const outside = (event) => {
      if (!anchor.current?.contains(event.target)) setOpen(false);
    };
    const escape = (event) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      setOpen(false);
      trigger.current?.focus();
    };
    document.addEventListener('pointerdown', outside, true);
    document.addEventListener('focusin', outside);
    document.addEventListener('keydown', escape);
    return () => {
      cancelAnimationFrame(focus);
      document.removeEventListener('pointerdown', outside, true);
      document.removeEventListener('focusin', outside);
      document.removeEventListener('keydown', escape);
    };
  }, [open]);
  const value = `${rotationSpeed.toFixed(1)}×`;
  return (
    <div className="settings-anchor" ref={anchor}>
      <button
        ref={trigger}
        aria-label="Scene and motion settings"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="display-settings"
        onClick={() => setOpen((previous) => !previous)}
      >
        <Settings2 size={23} strokeWidth={1.4} />
      </button>
      <section
        id="display-settings"
        className="settings-popover"
        role="dialog"
        aria-labelledby="display-settings-heading"
        aria-modal="false"
        aria-hidden={!open}
        inert={!open}
        data-open={open}
      >
        <h2 id="display-settings-heading">DISPLAY SETTINGS</h2>
        <div className="rotation-heading">
          <label htmlFor="rotation-speed">PLANET ROTATION SPEED</label>
          <output htmlFor="rotation-speed" aria-live="polite">{value}</output>
        </div>
        <input
          ref={slider}
          id="rotation-speed"
          type="range"
          min="0" max="4" step="0.1"
          value={rotationSpeed}
          aria-valuetext={`${rotationSpeed.toFixed(1)} times`}
          aria-describedby="rotation-status"
          onChange={(event) => setRotationSpeed(event.currentTarget.valueAsNumber)}
          style={{ '--slider-progress': `${rotationSpeed / 4 * 100}%` }}
        />
        <div className="rotation-range" aria-hidden="true"><span>0.0×</span><span>4.0×</span></div>
        <div className="rotation-actions">
          <button onClick={toggleRotationPaused} aria-pressed={isRotationPaused}>
            {isRotationPaused ? <Play size={15} aria-hidden="true" /> : <Pause size={15} aria-hidden="true" />}
            {isRotationPaused ? 'RESUME ROTATION' : 'PAUSE ROTATION'}
          </button>
          <button className="rotation-reset" onClick={resetRotation}>
            <RotateCcw size={14} aria-hidden="true" /> RESET TO DEFAULT
          </button>
        </div>
        <p id="rotation-status" className="rotation-status">
          {reduced ? 'Reduced motion is on. Planet and cloud rotation are stopped.'
            : isRotationPaused ? `Paused. Resume keeps your ${value} setting.`
              : rotationSpeed === 0 ? 'Rotation stopped. Current orientations are held.'
                : 'One speed setting. Independent planetary rotation.'}
        </p>
        <details className="rendering-preferences">
          <summary>Rendering preferences</summary>
          <label htmlFor="motion-setting">Motion</label>
          <select id="motion-setting" value={mode} onChange={(event) => setMotion(event.target.value)}>
            <option value="system">System preference</option>
            <option value="reduce">Motion off</option>
          </select>
          <label htmlFor="quality-setting">Rendering resolution</label>
          <select id="quality-setting" value={quality} onChange={(event) => setQuality(event.target.value)}>
            <option value="auto">Balanced · max 1.5×</option>
            <option value="low">Low GPU use · 1×</option>
            <option value="high">Sharper · max 2×</option>
          </select>
          <p>System reduced motion takes priority. The scene also pauses in hidden tabs.</p>
        </details>
      </section>
    </div>
  );
}
