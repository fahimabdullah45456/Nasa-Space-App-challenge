import { forwardRef, useImperativeHandle, useRef } from 'react';

export default forwardRef(function DestinationMarkers({ destination, onSelect }, api) {
  const refs = useRef({});
  const last = useRef({});
  useImperativeHandle(api, () => ({
    update(name, point) {
      const elements = refs.current[name];
      if (!elements) return;
      const { button, line, dot } = elements;
      const visible = !!point;
      button.hidden = !visible;
      line.style.visibility = dot.style.visibility = visible ? 'visible' : 'hidden';
      if (!visible) { last.current[name] = null; return; }
      const previous = last.current[name];
      if (previous && [...point.anchor,...point.label].every((value,i) => Math.abs(value - [...previous.anchor,...previous.label][i]) < .1)) return;
      button.style.transform = `translate3d(${point.label[0]}px, ${point.label[1]}px, 0)`;
      line.setAttribute('x1', point.start[0]); line.setAttribute('y1', point.start[1]);
      line.setAttribute('x2', point.anchor[0]); line.setAttribute('y2', point.anchor[1]);
      dot.setAttribute('cx', point.anchor[0]); dot.setAttribute('cy', point.anchor[1]);
      button.dataset.anchorX = point.anchor[0]; button.dataset.anchorY = point.anchor[1];
      button.dataset.hit = point.hit;
      last.current[name] = point;
    },
    snapshot: () => last.current,
  }), []);
  return <div className="destination-markers" aria-label="Planet destinations">
    <svg className="destination-leaders" aria-hidden="true">
      {['mars','moon'].map((name) => <g key={name} className={`leader-${name}`}>
        <line ref={(node) => { (refs.current[name] ??= {}).line = node; }} />
        <circle r="2" ref={(node) => { (refs.current[name] ??= {}).dot = node; }} />
      </g>)}
    </svg>
    {['mars','moon'].map((name) => <button
      key={name}
      hidden
      ref={(node) => { (refs.current[name] ??= {}).button = node; }}
      className={`planet-marker projected-marker ${name}-marker ${destination === name ? 'selected' : ''}`}
      aria-label={`Select ${name === 'moon' ? 'Moon' : 'Mars'} destination`}
      aria-pressed={destination === name}
      onClick={() => onSelect(name)}
    ><strong>{name.toUpperCase()}</strong>{name === 'mars' && <span>EXPLORE DESTINATION</span>}</button>)}
  </div>;
});
