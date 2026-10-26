import { useRef } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { missions } from '../data/missions';
import { useDestinationPresentation } from '../hooks/useDestinationPresentation';
export default function HardwareStrip({ destination = 'overview', phase, reduced, selected, onSelect, onCredits, onCompleteArchive }) {
  const cards = useRef();
  const shown = useDestinationPresentation(destination, phase, reduced, cards);
  const worlds = shown === 'overview' ? ['Moon','Mars'] : [shown === 'moon' ? 'Moon' : 'Mars'];
  return <section className="hardware-strip" id="archive" aria-labelledby="archive-heading" data-destination={shown}>
    <h2 id="archive-heading" tabIndex={-1}>HARDWARE LEFT BEHIND</h2>
    <p>{shown === 'overview' ? 'Discover the machines that explored the Moon and Mars.' : shown === 'moon' ? 'Discover the vehicles and scientific instruments left on the Moon.' : 'Discover the robotic explorers that studied Mars.'}</p>
    <div className="destination-groups" ref={cards} aria-busy={phase === 'traveling'}>
      {worlds.map((world) => <section className={`destination-group ${world.toLowerCase()}`} key={world} aria-label={`${world} exploration`}>
        <h3><i />{world.toUpperCase()} EXPLORATION<span /></h3>
        <div className="hardware-cards">
          {missions.filter((mission) => mission.destination === world).map((mission) => <button
            key={mission.id}
            className={`hardware-card ${selected === mission.id ? 'selected' : ''}`}
            aria-pressed={selected === mission.id}
            aria-label={`Explore ${mission.mission} ${mission.name} mission details`}
            title={mission.credit}
            onClick={() => onSelect(mission)}
          >
            <span className="hardware-photo"><img src={mission.image} alt={`${mission.name} — archival NASA photograph`} width="152" height="136" /></span>
            <span className="card-copy">
              <span className="mission-label">{mission.mission}</span>
              <span className={`asset-name ${world === 'Mars' ? 'rover' : ''}`}>{mission.name}</span>
              {shown !== 'overview' && <><span className="hardware-dates">{mission.dates}</span><span className="hardware-status">{mission.status}</span><span className="hardware-description">{mission.description}</span></>}
              <span className="explore-label">EXPLORE <ArrowUpRight size={15} /></span>
            </span>
          </button>)}
        </div>
      </section>)}
    </div>
    <footer className="strip-credits"><button onClick={onCredits}>ARCHIVAL IMAGERY / NASA · JPL-CALTECH</button><button className="full-archive-link" onClick={onCompleteArchive}>OPEN COMPLETE ARCHIVE · 7 VEHICLES <ArrowUpRight size={14} /></button><span>NASA SPACE APPS CHALLENGE PROJECT</span></footer>
  </section>;
}
