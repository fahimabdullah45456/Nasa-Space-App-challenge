import { useEffect, useRef, useState } from 'react';
import { X, ArrowUpRight } from 'lucide-react';
import { missions } from '../data/missions';
import { vehicles } from '../data/vehicles';
export default function ExplorerDialog({
  kind,
  onClose,
  onSelect,
  hardware,
  destination,
  searchAll = false,
}) {
  const ref = useRef();
  const [query, setQuery] = useState('');
  const records = searchAll ? vehicles.map((vehicle) => ({
    ...vehicle,
    destination: vehicle.world,
  })) : missions;
  const found = records.filter((m) =>
    (m.name + ' ' + m.mission + ' ' + m.destination)
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  useEffect(() => {
    const d = ref.current;
    d.showModal();
    return () => d.close();
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby="dialog-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="dialog-body">
        <button
          className="close-dialog"
          aria-label="Close dialog"
          onClick={onClose}
        >
          <X size={23} />
        </button>
        <p className="dialog-eyebrow">AFTERLIGHT / {(destination || 'overview').toUpperCase()}</p>
        <h2 id="dialog-title">
          {kind === 'hardware' ? hardware?.name : kind === 'search'
            ? 'Find exploration hardware'
            : kind === 'profile'
                ? 'Your exploration starts here'
                : 'Image & texture credits'}
        </h2>
        {kind === 'hardware' ? (
          <section className="hardware-detail">
            <img src={hardware.image} alt={`${hardware.name} — archival NASA photograph`} />
            <p className="hardware-dates">{hardware.dates}</p>
            <p className="hardware-status">{hardware.status}</p>
            <p>{hardware.description}</p>
            <p className="dialog-note">{hardware.credit}. Archival mission information, not live telemetry.</p>
            <a href={hardware.source} target="_blank" rel="noreferrer">Read the NASA mission source <ArrowUpRight size={15} /></a>
          </section>
        ) : kind === 'search' ? (
          <>
            <label htmlFor="hardware-search">
              Search the Moon and Mars archive
            </label>
            <input
              id="hardware-search"
              autoFocus
              type="search"
              placeholder="Try Spirit or Apollo…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="search-results">
              {found.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    onClose();
                    onSelect(m);
                  }}
                >
                  <span>
                    <strong>{m.name}</strong>
                    <small>
                      {m.mission} · {m.destination}
                    </small>
                  </span>
                  <ArrowUpRight size={18} />
                </button>
              ))}
              {!found.length && (
              <p>
                No hardware matches “{query}”. Try Moon, Mars, Apollo, Spirit,
                Opportunity, Curiosity, Perseverance, Lunokhod or Yutu-2.
                </p>
              )}
            </div>
            <p className="dialog-note">
              Select a record to open the associated mission information. Detailed vehicle pages are available in the complete archive.
            </p>
          </>
        ) : kind === 'profile' ? (
          <>
            <p>
              A local, educational exploration experience. There are no user
              accounts, sign-ins or tracking profiles in Phase 1.
            </p>
            <p>
              Choose the Moon or Mars to travel to its existing planetary model, then open the archive to explore mission stories, sourced terrain, and the vehicle models available for inspection.
            </p>
            <Credits />
          </>
        ) : (
          <Credits />
        )}
      </div>
    </dialog>
  );
}
function Credits() {
  return (
    <section className="asset-credits">
      <h3>Source acknowledgements</h3>
      <p>
        Archival photographs: NASA/JSC; NASA/JPL-Caltech/Cornell; Arizona State
        University. The approved Figma image crops are retained.
      </p>
      <p>
        Planet models: the supplied Earth, Mars and Moon GLBs, with embedded
        maps from Solar System Scope / INOVE (CC BY 4.0), NASA / LRO and Mars
        MOLA elevation data. Earth includes a separate animated cloud layer.
        See PLANET-ASSETS.md for source credits and transformations. Sizes,
        distances and rotation rates are illustrative, not astronomical scale.
      </p>
      <p>
        The supplied portable GLBs retain their PBR materials and surface
        detail. Custom model-lab atmosphere, night-light masking and cloud-shadow
        shaders are not included in these GLB files.
      </p>
    </section>
  );
}
