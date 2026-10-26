export default function MissionOverview({ destination = 'overview', onSelect }) {
  return <aside className="mission-overview" aria-label="Mission overview">
    <h2>{destination === 'overview' ? 'MISSION OVERVIEW' : 'DESTINATION'}</h2>
    {destination === 'overview' ? <>
      <button className="destination-summary" onClick={() => onSelect('moon')}><strong>MOON</strong><span>Lunar surface<br />equipment</span></button>
      <div className="mission-separator" />
      <button className="destination-summary" onClick={() => onSelect('mars')}><strong>MARS</strong><span>Robotic exploration<br />hardware</span></button>
    </> : <>
      <p className="destination-summary"><strong>{destination === 'moon' ? 'THE MOON' : 'MARS'}</strong><span>{destination === 'moon' ? 'Lunar exploration and surface hardware.' : 'Robotic exploration and scientific discoveries.'}</span></p>
      <div className="mission-separator" />
      <button className="destination-summary" onClick={() => onSelect('overview')}><strong>OVERVIEW</strong><span>Return to Earth,<br />Moon and Mars</span></button>
    </>}
  </aside>;
}
