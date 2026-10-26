import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowUpRight, ChevronDown, ChevronUp, MapPin, Search, X } from 'lucide-react';
import AssetStage from '../components/AssetStage';
import { landingSites } from '../data/landingSites';

const categoryFor = (item) => {
  const id = item.id.toLowerCase();
  if (/wheel|suspension|body|chassis/.test(id)) return 'Mobility';
  if (/camera|navcam|hazcam|mastcam|pancam/.test(id)) return 'Imaging';
  if (/antenna|uhf|high-gain|communication/.test(id)) return 'Communications';
  return 'Science & systems';
};
function displayComponents(vehicle) {
  if (vehicle.components) return vehicle.components.map((item) => ({ ...item, category: categoryFor(item), selectable: true }));
  return vehicle.instruments.slice(0, 8).map((description, index) => ({
    id: `unmapped-${index}`, title: description.split(' — ')[0], description: description.includes(' — ') ? description.split(' — ').slice(1).join(' — ') : description,
    category: 'Documented equipment', selectable: false,
  }));
}

export default function VehicleDetailPage({ vehicle, onRoute }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [selectedId, setSelectedId] = useState('');
  const [verifiedIds, setVerifiedIds] = useState([]);
  const componentList = useMemo(() => displayComponents(vehicle), [vehicle]);
  const categories = useMemo(() => ['All', ...new Set(componentList.map((item) => item.category))], [componentList]);
  const filtered = componentList.filter((item) => (category === 'All' || item.category === category) && `${item.title} ${item.description}`.toLowerCase().includes(query.toLowerCase().trim()));
  const selected = componentList.find((item) => item.id === selectedId);
  const modelAvailable = !!vehicle.model?.url;
  const linkedSites = landingSites.filter((site) => site.vehicleId === vehicle.id);
  const primarySite = linkedSites.find((site) => site.id === vehicle.siteId) || linkedSites[0];
  const showSelection = (id) => {
    if (verifiedIds.includes(id)) setSelectedId(id);
  };
  return <main id="page-main" className="vehicle-page">
    <div className="detail-backline"><button onClick={() => onRoute('/archive')}><ArrowLeft size={16} /> BACK TO ARCHIVE</button><span>{vehicle.world.toUpperCase()} / MISSION RECORD</span></div>
    <section className="vehicle-hero">
      <div className="vehicle-heading">
        <p className="page-kicker"><span /> {vehicle.mission.toUpperCase()}</p>
        <h1>{vehicle.name.toUpperCase()}</h1>
        <p className="vehicle-deck">{vehicle.deck}</p>
        <div className="vehicle-statusline"><span>{vehicle.dates}</span><span className="status-dot" />{vehicle.status}</div>
      </div>
      {modelAvailable ? <AssetStage
        modelUrl={vehicle.model.url} modelLabel={`${vehicle.name} rover`} fallbackImage={vehicle.image} fallbackAlt={vehicle.imageAlt} fallbackCredit={vehicle.imageCredit}
        componentList={componentList} selectedId={selectedId} onSelect={showSelection} onVerifiedComponents={setVerifiedIds}
        contextNote={vehicle.model.note}
      /> : <div className="vehicle-photo-stage">
        <img src={vehicle.image} alt={vehicle.imageAlt} />
        <div className="photo-stage-caption"><span className="eyebrow">ARCHIVAL / CONTEXT IMAGE</span><p>{vehicle.imageCredit}</p><small>{vehicle.model.note}</small></div>
      </div>}
      <div className="vehicle-explorer-row">
        <button className="explorer-open" onClick={() => setDrawerOpen(true)}>OPEN ROVER EXPLORER <ArrowUpRight size={17} /></button>
        {primarySite && <button className="site-link" onClick={() => onRoute(`/landing-sites/${primarySite.id}`)}><MapPin size={16} /> EXPLORE {primarySite.title.toUpperCase()} <ArrowUpRight size={15} /></button>}
      </div>
      {vehicle.model?.note && <p className="model-attribution"><span className="eyebrow">MODEL AVAILABILITY</span>{vehicle.model.note} {vehicle.model.source && <a href={vehicle.model.source} target="_blank" rel="noreferrer">Model source <ArrowUpRight size={13} /></a>}</p>}
    </section>

    <div className="vehicle-story-grid">
      <nav className="story-index" aria-label="On this page"><span className="eyebrow">IN THIS FILE</span><a href="#mission-story">Mission story</a><a href="#engineering">Engineering</a><a href="#instruments">Instruments</a><a href="#timeline">Timeline</a><a href="#discoveries">Discoveries</a><a href="#field-sites">Field sites</a><a href="#sources">Sources</a></nav>
      <div className="vehicle-story">
        <section id="mission-story" className="story-section"><p className="section-kicker">01 / MISSION</p><h2>A machine with a purpose</h2><p>{vehicle.story}</p><div className="fact-ribbon"><div><span>WORLD</span><strong>{vehicle.world}</strong></div><div><span>MISSION</span><strong>{vehicle.mission}</strong></div><div><span>STATUS</span><strong>{vehicle.status}</strong></div></div></section>
        <section id="engineering" className="story-section"><p className="section-kicker">02 / ENGINEERING</p><h2>Built for another world</h2><p>{vehicle.engineering}</p></section>
        <section id="instruments" className="story-section"><p className="section-kicker">03 / SCIENCE PAYLOAD</p><h2>Tools that turned terrain into evidence</h2><ul className="instrument-list">{vehicle.instruments.map((item) => <li key={item}><span className="list-marker" />{item}</li>)}</ul></section>
        <section id="timeline" className="story-section"><p className="section-kicker">04 / TIMELINE</p><h2>Mission log</h2><ol className="mission-timeline">{vehicle.timeline.map(([date, event]) => <li key={`${date}-${event}`}><time dateTime={date}>{new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', { year: 'numeric', month: 'short', timeZone: 'UTC' })}</time><p>{event}</p></li>)}</ol></section>
        <section id="discoveries" className="story-section"><p className="section-kicker">05 / DISCOVERIES</p><h2>What the mission found</h2><ul className="discovery-list">{vehicle.findings.map((item) => <li key={item}>{item}</li>)}</ul></section>
        <section className="story-section photo-story"><p className="section-kicker">06 / IN THE FIELD</p><h2>Mission imagery</h2><figure><img src={vehicle.image} alt={vehicle.imageAlt} loading="lazy"/><figcaption>{vehicle.imageCredit}. {vehicle.id === 'yutu-2' ? 'Illustrative lunar texture; not a mission photograph.' : 'Source-linked mission image.'}</figcaption></figure>{vehicle.extraImages?.map((image) => <figure key={image.src}><img src={image.src} alt={image.alt} loading="lazy"/><figcaption>{image.credit}</figcaption></figure>)}</section>
        <section id="field-sites" className="story-section"><p className="section-kicker">07 / GEOGRAPHY</p><h2>Where it went</h2><p>Explore the documented mission region and see exactly what the available terrain data can—and cannot—show.</p>{linkedSites.length ? <div className="field-site-list">{linkedSites.map((site) => <button key={site.id} onClick={() => onRoute(`/landing-sites/${site.id}`)}><span><strong>{site.title}</strong><small>{site.region}</small></span><ArrowUpRight size={18} /></button>)}</div> : <p>Site record not available.</p>}</section>
        <section id="sources" className="story-section"><p className="section-kicker">08 / SOURCES</p><h2>Research & attribution</h2><ul className="source-list">{vehicle.sources.map(([label, url]) => <li key={url}><a href={url} target="_blank" rel="noreferrer">{label}<ArrowUpRight size={14} /></a></li>)}</ul></section>
      </div>
    </div>

    <aside className={`component-drawer ${drawerOpen ? 'is-open' : ''}`} aria-label={`${vehicle.name} rover explorer`} aria-hidden={!drawerOpen} inert={!drawerOpen}>
      <div className="drawer-heading"><div><span className="eyebrow">AFTERLIGHT / COMPONENT EXPLORER</span><h2>{vehicle.name}</h2></div><button aria-label="Minimize rover explorer" onClick={() => setDrawerOpen(false)}><ChevronDown size={20} /></button></div>
      <p className="drawer-note">{vehicle.model?.meshMode === 'named' ? 'Select a mapped part to highlight its source mesh in green.' : modelAvailable ? 'Documented equipment is listed, but this NASA static model is a single mesh; parts cannot be isolated honestly.' : 'Documented equipment is listed for reference. No verified 3D vehicle model is available in this build.'}</p>
      <div className="drawer-search"><Search size={16} /><input type="search" placeholder="Find a component…" value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Find a component" /></div>
      <div className="drawer-categories" role="group" aria-label="Component categories">{categories.map((name) => <button key={name} aria-pressed={category === name} onClick={() => setCategory(name)}>{name}</button>)}</div>
      <div className="component-list">{filtered.map((item) => {
        const canSelect = verifiedIds.includes(item.id);
        return <button key={item.id} className={`component-row ${selectedId === item.id ? 'selected' : ''}`} disabled={!canSelect} onClick={() => showSelection(item.id)} aria-pressed={selectedId === item.id} title={canSelect ? 'Highlight this model component' : 'This part cannot be isolated in the available model'}>
          <span className="component-index">{String(componentList.indexOf(item) + 1).padStart(2, '0')}</span><span className="component-copy"><strong>{item.title}</strong><small>{item.description}</small></span><span className="component-state">{canSelect ? 'SELECT' : 'INFO'}</span>
        </button>;
      })}{!filtered.length && <p className="drawer-empty">No component matches that search.</p>}</div>
      <div className="drawer-footer">{selected ? <><div className="selected-component"><span className="eyebrow">SELECTED COMPONENT</span><strong>{selected.title}</strong><p>{selected.description}</p></div><button className="clear-selection" onClick={() => setSelectedId('')}><X size={14} /> CLEAR SELECTION</button></> : <p>{modelAvailable ? `${verifiedIds.length} model-mapped parts available.` : 'Selection disabled: no verified part geometry.'}</p>}
        <button className="drawer-minimize" onClick={() => setDrawerOpen(false)}><ChevronUp size={16} /> MINIMIZE EXPLORER</button>
      </div>
    </aside>
    {drawerOpen && <button className="drawer-scrim" aria-label="Close rover explorer" onClick={() => setDrawerOpen(false)} />}
  </main>;
}
