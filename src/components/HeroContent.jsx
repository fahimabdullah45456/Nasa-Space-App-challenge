import { useRef } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { destinations } from '../data/destinations';
import { useDestinationPresentation } from '../hooks/useDestinationPresentation';
export default function HeroContent({ destination = 'overview', phase, reduced, onBegin, onArchive }) {
  const root = useRef();
  const shown = useDestinationPresentation(destination, phase, reduced, root);
  const info = destinations[shown];
  return <section className="story" aria-labelledby="hero-title" ref={root} data-content-destination={shown}>
    <p className="chapter"><span />{shown === 'overview' ? 'FORGOTTEN WORLDS' : info.chapter}</p>
    <h1 id="hero-title" tabIndex={-1}>{(shown === 'overview' ? ['EXPLORE.', 'DISCOVER.', 'REMEMBER.'] : info.title).map((line) => <span key={line}>{line}</span>)}</h1>
    <p className="tagline">{shown === 'overview' ? <>The machines we left behind.<br />The discoveries they made possible.</> : info.tagline}</p>
    <p className="description">{shown === 'overview' ? 'Journey to the Moon and Mars to discover the spacecraft, rovers, and scientific instruments that expanded our understanding of other worlds.' : info.description}</p>
    <div className="hero-actions">
      <button className="primary-action" onClick={onBegin}>{shown === 'overview' ? 'BEGIN EXPLORATION' : 'RETURN TO OVERVIEW'} <ArrowUpRight size={20} /></button>
      <button className="secondary-action" onClick={onArchive}>EXPLORE THE ARCHIVE</button>
    </div>
  </section>;
}
