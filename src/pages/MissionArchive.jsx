import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUpRight, Search, SlidersHorizontal } from 'lucide-react';
import { vehicles } from '../data/vehicles';

export default function MissionArchive({ onRoute }) {
  const [filter, setFilter] = useState('All hardware');
  const [query, setQuery] = useState('');
  const searchRef = useRef(null);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).has('focusSearch')) searchRef.current?.focus();
  }, []);
  const visible = useMemo(() => vehicles.filter((vehicle) => {
    const matchesWorld = filter === 'All hardware' || vehicle.world === filter;
    const haystack = `${vehicle.name} ${vehicle.mission} ${vehicle.world} ${vehicle.deck}`.toLowerCase();
    return matchesWorld && haystack.includes(query.toLowerCase().trim());
  }), [filter, query]);
  return <main id="page-main" className="archive-page">
    <section className="page-intro archive-intro">
      <p className="page-kicker"><span /> AFTERLIGHT / FIELD ARCHIVE</p>
      <h1>THE ARCHIVE</h1>
      <p className="page-tagline">Their missions ended. Their discoveries endure.</p>
      <p className="page-deck">Seven machines. Nine field sites. A record of the hardware that carried science across the Moon and Mars.</p>
    </section>
    <section className="archive-controls" aria-label="Filter archive">
      <div className="archive-search"><Search size={18} /><input ref={searchRef} type="search" placeholder="Search vehicles, missions, worlds…" value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Search vehicles" /></div>
      <div className="archive-filters" role="group" aria-label="Filter by world">
        <span><SlidersHorizontal size={16} /> FILTER</span>
        {['All hardware', 'Mars', 'Moon'].map((name) => <button key={name} aria-pressed={filter === name} className={filter === name ? 'active' : ''} onClick={() => setFilter(name)}>{name}</button>)}
      </div>
    </section>
    <div className="archive-result-count" aria-live="polite">{visible.length} {visible.length === 1 ? 'record' : 'records'} · {filter.toUpperCase()}</div>
    {visible.length ? <section className="archive-grid" aria-label="Mission records">
      {visible.map((vehicle, index) => <article className="archive-card" key={vehicle.id}>
        <button className="archive-card-open" onClick={() => onRoute(`/rovers/${vehicle.id}`)} aria-label={`Open ${vehicle.name} mission record`}>
          <span className="archive-card-image"><img src={vehicle.image} alt={vehicle.imageAlt} loading={index > 3 ? 'lazy' : 'eager'} /><span className="archive-image-tag">{vehicle.world} / {vehicle.status}</span></span>
          <span className="archive-card-copy">
            <span className="archive-card-mission">{vehicle.mission}</span>
            <strong>{vehicle.name}</strong>
            <span className="archive-card-deck">{vehicle.deck}</span>
            <span className="archive-card-meta">{vehicle.dates}</span>
            <span className="archive-card-cta">OPEN MISSION FILE <ArrowUpRight size={16} /></span>
          </span>
        </button>
        <p className="archive-photo-credit">{vehicle.imageCredit}{vehicle.id === 'yutu-2' ? ' · contextual texture, not mission photography' : ''}</p>
      </article>)}
    </section> : <p className="archive-empty">No mission records match that search. Try another vehicle or destination.</p>}
    <aside className="archive-note"><span className="eyebrow">SOURCE NOTE</span><p>Mission pages distinguish verified vehicle models from archival-photo or planetary-context fallbacks. Component selection is enabled only for geometry that can be mapped to a named model node.</p></aside>
  </main>;
}
