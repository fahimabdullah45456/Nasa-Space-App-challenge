export const destinations = {
  overview: { label: 'Overview' },
  moon: { label: 'Moon', title: ['THE', 'MOON.'], chapter: 'LUNAR EXPLORATION', tagline: 'Lunar exploration and surface hardware.', description: 'Explore the Moon’s cratered surface and the vehicles and scientific instruments left by Apollo astronauts.' },
  mars: { label: 'Mars', title: ['MARS.'], chapter: 'ROBOTIC EXPLORATION', tagline: 'Robotic exploration and scientific discoveries.', description: 'Discover a world of ancient water and the robotic explorers that studied its rocks, soils and changing landscapes.' },
};
export function normalizeDestination(name) {
  const key = String(name).toLowerCase();
  return Object.hasOwn(destinations, key) ? key : null;
}
