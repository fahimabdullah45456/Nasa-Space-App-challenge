import Header from '../components/Header';
import MissionArchive from './MissionArchive';
import VehicleDetailPage from './VehicleDetailPage';
import LandingSitePage from './LandingSitePage';
import { vehicleById } from '../data/vehicles';
import { siteById } from '../data/landingSites';

export default function RoutePages({ path, onRoute, headerActions }) {
  let page;
  const roverMatch = path.match(/^\/rovers\/([^/]+)\/?$/);
  const siteMatch = path.match(/^\/landing-sites\/([^/]+)\/?$/);
  if (path === '/archive' || path === '/archive/') page = <MissionArchive onRoute={onRoute} />;
  else if (roverMatch && vehicleById[roverMatch[1]]) page = <VehicleDetailPage vehicle={vehicleById[roverMatch[1]]} onRoute={onRoute} />;
  else if (siteMatch && siteById[siteMatch[1]]) page = <LandingSitePage site={siteById[siteMatch[1]]} onRoute={onRoute} />;
  else page = <main id="page-main" className="not-found"><p className="page-kicker"><span /> AFTERLIGHT / 404</p><h1>FILE NOT FOUND</h1><p>This archive record is not in the collection.</p><button onClick={() => onRoute('/archive')}>RETURN TO THE ARCHIVE</button></main>;
  return <div className="app routed-app"><a className="skip-link" href="#page-main">Skip to page content</a><Header {...headerActions} />{page}</div>;
}
