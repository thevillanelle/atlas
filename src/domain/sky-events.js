// Live sub-points of the Sun, Moon and planets as feed events (astrology layer).
import { sunSubpoint, moonSubpoint, planetSubpoint, gmstDeg, norm360, constellationForRA, moonPhaseName } from './astro.js';

const BODIES = [
  { name: 'Sun', emoji: '☀️' }, { name: 'Moon', emoji: '🌕' }, { name: 'Mercury', emoji: '☿' },
  { name: 'Venus', emoji: '♀' }, { name: 'Mars', emoji: '♂' }, { name: 'Jupiter', emoji: '♃' },
  { name: 'Saturn', emoji: '♄' }, { name: 'Uranus', emoji: '♅' }, { name: 'Neptune', emoji: '♆' }
];

export function skyEvents(now = new Date()) {
  return BODIES.map(b => {
    const pt = b.name === 'Sun' ? sunSubpoint(now) : b.name === 'Moon' ? moonSubpoint(now) : planetSubpoint(b.name, now);
    const con = constellationForRA(norm360(gmstDeg(now) + pt.lng));
    const isMoon = b.name === 'Moon';
    const phase = isMoon ? moonPhaseName(now) : null;
    return {
      id: 'sky:' + b.name.toLowerCase(),
      type: 'astrology',
      title: `${b.emoji} ${b.name} — ${con}`,
      location: `${pt.lat.toFixed(2)}°, ${pt.lng.toFixed(2)}°`,
      lat: pt.lat,
      lng: pt.lng,
      severity: b.name === 'Sun' || isMoon ? 3 : 2,
      age: 'Live',
      brief: `Subpoint: ${pt.lat.toFixed(3)}°, ${pt.lng.toFixed(3)}°\nConstellation: ${con}.${phase ? ' Phase: ' + phase + '.' : ''}\n\nThe subpoint is the location on Earth directly beneath ${b.name} right now.`,
      stats: [{ label: 'Constellation', val: con }, isMoon ? { label: 'Phase', val: phase } : { label: 'Sub-lat', val: pt.lat.toFixed(1) + '°' }],
      sources: [{ n: 'Meeus Algorithms', age: 'Computed live' }],
      tags: ['Astronomy', b.name, con, 'Sky'],
      body: b,
      live: true
    };
  });
}
