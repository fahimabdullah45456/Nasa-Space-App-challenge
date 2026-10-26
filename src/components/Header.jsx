import { Search, UserCircle } from 'lucide-react';
import DisplaySettings from './DisplaySettings';
const base = import.meta.env.BASE_URL;
export default function Header({ destination, onNavigate, onDialog, settings, hideSettings = false }) {
  return (
    <header className="topbar">
      <a
        className="brand"
        href="#overview"
        onClick={(e) => {
          e.preventDefault();
          onNavigate('Overview');
        }}
        aria-label="Afterlight overview"
      >
        <span className="brand-emblem">
          <img src={base + 'brand/orbit.svg'} alt="" />
          <img src={base + 'brand/compass.svg'} alt="" />
        </span>
        <span>AFTERLIGHT</span>
      </a>
      <nav className="primary-nav" aria-label="Main navigation">
        {['Overview', 'Moon', 'Mars', 'Archive'].map((name) => (
          <button
            key={name}
            className={'nav-link ' + (destination === name.toLowerCase() ? 'active' : '')}
            aria-current={destination === name.toLowerCase() ? 'page' : undefined}
            onClick={() => onNavigate(name)}
          >
            {name.toUpperCase()}
          </button>
        ))}
      </nav>
      <div className="header-actions">
        <button
          aria-label="Search exploration hardware"
          onClick={() => onDialog('search')}
        >
          <Search size={23} strokeWidth={1.4} />
        </button>
        {!hideSettings && <DisplaySettings {...settings} />}
        <button
          aria-label="Explorer information"
          onClick={() => onDialog('profile')}
        >
          <UserCircle size={29} strokeWidth={1.1} />
        </button>
      </div>
    </header>
  );
}
