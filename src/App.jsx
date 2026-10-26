import { useCallback, useEffect, useRef, useState } from 'react';
import Header from './components/Header';
import HeroContent from './components/HeroContent';
import MissionOverview from './components/MissionOverview';
import HardwareStrip from './components/HardwareStrip';
import ExplorerDialog from './components/ExplorerDialog';
import SpaceScene from './scenes/SpaceScene';
import DestinationMarkers from './components/DestinationMarkers';
import { usePreferences } from './hooks/usePreferences';
import { useIntro } from './animation/introTimeline';
import { destinations, normalizeDestination } from './data/destinations';
import { vehicleById } from './data/vehicles';
import RoutePages from './pages/RoutePages';

function OverviewExperience({ onRoute }) {
  const queryDestination = new URLSearchParams(window.location.search).get('world');
  const initialDestination = normalizeDestination(queryDestination || (window.location.pathname !== '/' ? window.location.pathname.slice(1) : 'overview')) || 'overview';
  const app = useRef(), scene = useRef(), opener = useRef(), markers = useRef();
  const destinationRef = useRef(initialDestination), pending = useRef(null), phaseRef = useRef('arrived');
  const [destination, setDestination] = useState(initialDestination);
  const sceneAvailable = useRef(null);
  const [requestRevision, setRequestRevision] = useState(0);
  const [phase, setPhase] = useState('arrived');
  const [selected, setSelected] = useState('');
  const [dialog, setDialog] = useState(null);
  const [hardware, setHardware] = useState(null);
  const [quality, setQuality] = useState('auto');
  const [message, setMessage] = useState('');
  const preferences = usePreferences();
  const { reduced, visible, rotationSpeed, isRotationPaused } = preferences;
  const reducedRef = useRef(reduced); reducedRef.current = reduced;
  useIntro(app);
  const openDialog = useCallback((kind) => { opener.current = document.activeElement; setDialog(kind); }, []);
  const closeDialog = useCallback(() => { setDialog(null); requestAnimationFrame(() => { const target = opener.current?.isConnected ? opener.current : document.querySelector('.primary-nav .active'); target?.focus({ preventScroll: true }); }); }, []);
  const navigate = useCallback((name) => {
    if (String(name).toLowerCase() === 'archive') {
      document.getElementById('archive').scrollIntoView({ behavior: reducedRef.current ? 'instant' : 'smooth', block: 'start' });
      document.getElementById('archive-heading').focus({ preventScroll: true });
      setMessage('Explore the archival hardware below, or open the complete archive.');
      return Promise.resolve({ cancelled: false });
    }
    if (sceneAvailable.current === false) { setMessage('The 3D scene is unavailable. Use Retry scene to restore planet travel.'); return Promise.resolve({ cancelled: true }); }
    const next = normalizeDestination(name);
    if (!next) return Promise.resolve({ cancelled: true });
    if (destinationRef.current === next) {
      if (pending.current) return pending.current.promise;
      if (phaseRef.current === 'arrived') return Promise.resolve({ cancelled: false });
    }
    pending.current?.resolve({ cancelled: true });
    let resolve;
    const promise = new Promise((done) => { resolve = done; });
    pending.current = { promise, resolve };
    destinationRef.current = next;
    phaseRef.current = 'traveling';
    setDestination(next); setRequestRevision((revision) => revision + 1); setPhase('traveling'); setSelected('');
    setMessage(next === 'overview' ? 'Returning to Overview…' : `Approaching ${destinations[next].label}…`);
    if (window.scrollY > 100) window.scrollTo({ top: 0, behavior: reducedRef.current ? 'instant' : 'smooth' });
    return promise;
  }, [onRoute]);
  const onJourney = useCallback((event) => {
    if (event.destination !== destinationRef.current) return;
    phaseRef.current = event.phase; setPhase(event.phase);
    if (event.phase === 'arrived') {
      const requested = !!pending.current;
      pending.current?.resolve({ cancelled: false }); pending.current = null;
      if (requested) setMessage(event.destination === 'overview' ? 'Overview restored.' : `${destinations[event.destination].label} exploration ready.`);
    } else if (event.phase === 'error') {
      pending.current?.resolve({ cancelled: true, error: event.error }); pending.current = null;
      setMessage(event.error);
      destinationRef.current = 'overview'; setDestination('overview');
    }
  }, []);
  const available = useCallback(() => { sceneAvailable.current = true; }, []);
  const unavailable = useCallback((error) => {
    sceneAvailable.current = false;
    pending.current?.resolve({ cancelled: true, error: error.message }); pending.current = null;
    destinationRef.current = 'overview'; phaseRef.current = 'error';
    setDestination('overview'); setPhase('error'); setMessage(error.message);
    for (const name of ['moon','mars']) markers.current?.update(name, null);
  }, []);
  const select = useCallback((mission) => {
    navigate(mission.destination);
    setSelected(mission.id); setHardware(mission); openDialog('hardware');
  }, [navigate, openDialog]);
  useEffect(() => { document.documentElement.dataset.reducedMotion = String(reduced); }, [reduced]);
  useEffect(() => { if (!message) return; const timeout = setTimeout(() => setMessage(''), 6500); return () => clearTimeout(timeout); }, [message]);
  useEffect(() => () => pending.current?.resolve({ cancelled: true }), []);
  return <div className="app" ref={app} id="overview" data-destination={destination} data-journey={phase}>
    <a className="skip-link" href="#hero-title">Skip to introduction</a>
    <Header destination={destination} onNavigate={navigate} onDialog={openDialog} settings={{ ...preferences, quality, setQuality }} />
    <main>
      <section className="space-stage" aria-label="Exploration destinations">
        <SpaceScene ref={scene} markers={markers} reduced={reduced} visible={visible} quality={quality} rotationSpeed={rotationSpeed} isRotationPaused={isRotationPaused} destination={destination} onJourney={onJourney} onSelectDestination={navigate} onUnavailable={unavailable} onAvailable={available} requestRevision={requestRevision} />
        <svg className="trajectory" viewBox="0 0 1440 668" preserveAspectRatio="none" aria-hidden="true"><path d="M619 629 C749 693 981 665 1221 559" /><circle cx="772" cy="645" r="2" /></svg>
        <HeroContent destination={destination} phase={phase} reduced={reduced} onBegin={() => navigate(destination === 'overview' ? 'mars' : 'overview')} onArchive={() => navigate('archive')} />
        <DestinationMarkers ref={markers} destination={destination} onSelect={navigate} />
        <MissionOverview destination={destination} onSelect={navigate} />
      </section>
      <HardwareStrip destination={destination} phase={phase} reduced={reduced} selected={selected} onSelect={select} onCredits={() => openDialog('credits')} onCompleteArchive={() => onRoute('/archive')} />
    </main>
    {message && <p className="selection-status" role="status">{message}</p>}
    {dialog && <ExplorerDialog kind={dialog} hardware={hardware} destination={destination} onClose={closeDialog} onSelect={select} />}
  </div>;
}

export default function App() {
  const [path, setPath] = useState(() => window.location.pathname);
  const [routeRevision, setRouteRevision] = useState(0);
  const [dialog, setDialog] = useState(null);
  const preferences = usePreferences();
  const go = useCallback((nextPath) => {
    const next = nextPath || '/';
    window.history.pushState({}, '', next);
    setPath(window.location.pathname);
    setRouteRevision((revision) => revision + 1);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);
  useEffect(() => {
    const pop = () => { setPath(window.location.pathname); setRouteRevision((revision) => revision + 1); setDialog(null); };
    window.addEventListener('popstate', pop);
    return () => window.removeEventListener('popstate', pop);
  }, []);
  useEffect(() => {
    const isRover = path.startsWith('/rovers/');
    const rover = isRover ? vehicleById[path.split('/')[2]] : null;
    document.title = rover ? `${rover.name} — AFTERLIGHT` : path === '/archive'
      ? 'Archive — AFTERLIGHT'
      : path.startsWith('/landing-sites/') ? 'Landing Sites — AFTERLIGHT'
        : 'AFTERLIGHT — Their missions ended. Their discoveries endure.';
  }, [path]);

  const settings = { ...preferences, quality: 'auto', setQuality: () => {} };
  if (path === '/' || path === '/moon' || path === '/mars') {
    return <OverviewExperience onRoute={go} />;
  }
  const headerActions = {
    destination: path.startsWith('/landing-sites/') ? 'archive' : 'archive',
    settings,
    hideSettings: true,
    onNavigate: (name) => {
      const lower = String(name).toLowerCase();
      if (lower === 'moon' || lower === 'mars') go(`/?world=${lower}`);
      else go(lower === 'overview' ? '/' : '/archive');
    },
    onDialog: (kind) => {
      if (kind === 'search') { go('/archive?focusSearch=1'); return; }
      setDialog(kind);
    },
  };
  const selectFromDialog = (item) => {
    setDialog(null);
    if (vehicleById[item.id]) go(`/rovers/${item.id}`);
    else go('/archive');
  };
  return <>
    <RoutePages key={routeRevision} path={path} onRoute={go} headerActions={headerActions} />
    {dialog && <ExplorerDialog kind={dialog} destination="archive" searchAll onClose={() => setDialog(null)} onSelect={selectFromDialog} />}
  </>;
}
