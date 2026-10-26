import { ArrowLeft, ArrowUpRight, MapPin } from 'lucide-react';
import AssetStage from '../components/AssetStage';
import { vehicleById } from '../data/vehicles';
import { landingSites } from '../data/landingSites';
const base = import.meta.env.BASE_URL;

export default function LandingSitePage({ site, onRoute }) {
  const vehicle = vehicleById[site.vehicleId];
  const hasLocalTerrain = !!site.terrain;
  const modelUrl = site.terrain || `${base}models/planets/${site.body.toLowerCase()}.glb`;
  const note = hasLocalTerrain
    ? `NASA terrain mesh · ${site.terrainNote}`
    : `Planetary context only · ${site.terrainNote}`;
  return <main id="page-main" className="landing-page">
    <div className="detail-backline"><button onClick={() => onRoute(`/rovers/${site.vehicleId}`)}><ArrowLeft size={16} /> BACK TO {vehicle.name.toUpperCase()}</button><span>{site.body.toUpperCase()} / FIELD SITE</span></div>
    <section className="landing-hero">
      <div className="landing-heading">
        <p className="page-kicker"><span /> LANDING SITE / {site.region.toUpperCase()}</p>
        <h1>{site.title.toUpperCase()}</h1>
        <p className="vehicle-deck">{site.location}</p>
        <div className="landing-coordinate"><MapPin size={18} /><div><span>LOCATION REFERENCE</span><strong>{site.coordinates || 'Not published in the referenced mission source'}</strong></div></div>
        {site.coordinateNote && <p className="coordinate-note">{site.coordinateNote}</p>}
      </div>
      <AssetStage modelUrl={modelUrl} mode={hasLocalTerrain ? 'terrain' : 'planet'} modelLabel={hasLocalTerrain ? `${site.title} NASA terrain` : `${site.body} planetary context`} contextNote={note} />
      <div className="landing-disclaimer"><span className="eyebrow">DATA LIMITS</span><p>{site.terrainNote}</p><a href={site.terrainSource || site.source} target="_blank" rel="noreferrer">Open source record <ArrowUpRight size={14} /></a></div>
    </section>
    <section className="landing-facts-grid">
      <article><span className="eyebrow">SITE RECORD</span><h2>{site.region}</h2><p>{site.location}</p></article>
      <article><span className="eyebrow">VEHICLE</span><h2>{vehicle.name}</h2><p>{vehicle.deck}</p><button onClick={() => onRoute(`/rovers/${vehicle.id}`)}>OPEN MISSION FILE <ArrowUpRight size={15} /></button></article>
      <article><span className="eyebrow">TERRAIN SOURCE</span><h2>{hasLocalTerrain ? 'NASA model available' : 'No verified local terrain model'}</h2><p>{site.terrainNote}</p><a href={site.terrainSource || site.source} target="_blank" rel="noreferrer">View source <ArrowUpRight size={14} /></a></article>
    </section>
    <section className="landing-source-footer"><span className="eyebrow">REFERENCE & ATTRIBUTION</span><p>Location facts and coordinate conventions are attributed to the linked mission sources. A coordinate is shown only when its source and meaning are stated; it is not used to fabricate a rover route or pin on an unrelated terrain mesh.</p><a href={site.source} target="_blank" rel="noreferrer">Primary location source <ArrowUpRight size={14} /></a><button onClick={() => onRoute('/archive')}>RETURN TO ARCHIVE <ArrowUpRight size={15} /></button></section>
    <div className="site-next-sites"><span className="eyebrow">OTHER FIELD SITES</span><div>{landingSites.filter((item) => item.body === site.body && item.id !== site.id).map((item) => <button key={item.id} onClick={() => onRoute(`/landing-sites/${item.id}`)}>{item.title}<ArrowUpRight size={14} /></button>)}</div></div>
  </main>;
}
