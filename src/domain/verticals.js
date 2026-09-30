// Single source of truth for every feed vertical: drives the landing grid, tabs, layer
// toggles, marker colors and the /api/feed endpoints.

export const VERTICALS = [
  { id: 'news',         name: 'Breaking News', tab: 'Breaking News', layer: 'Breaking News', color: '#ef4444', icon: '📰', desc: 'Live world events and developing stories' },
  { id: 'world',        name: 'World News',    tab: 'World News',    layer: 'World',         color: '#818cf8', icon: '🌐', desc: 'Foreign press — Africa, Asia, Europe, Americas' },
  { id: 'usnews',       name: 'US News',       tab: 'US',            layer: 'US News',       color: '#94a3b8', icon: '🇺🇸', desc: 'Politics, society, and national stories' },
  { id: 'nyc',          name: 'Local News',    tab: 'Local',         layer: 'Local',         color: '#fb923c', icon: '🗽', desc: 'Defaults to NYC — sign in to set your city' },
  { id: 'money',        name: 'Money',         tab: 'Money',         layer: 'Money',         color: '#34d399', icon: '💰', desc: 'Markets, economy, finance, luxury' },
  { id: 'tech',         name: 'Tech',          tab: 'Tech',          layer: 'Tech',          color: '#06b6d4', icon: '💻', desc: 'Hacker News, AI, the internet' },
  { id: 'science',      name: 'Science',       tab: 'Science',       layer: 'Science',       color: '#22d3ee', icon: '🔬', desc: 'Research, climate, biology, space science' },
  { id: 'fashion',      name: 'Fashion',       tab: 'Fashion',       layer: 'Fashion',       color: '#f472b6', icon: '👗', desc: 'Runway, luxury, global style' },
  { id: 'culture',      name: 'Culture',       tab: 'Culture',       layer: 'Culture',       color: '#fb7185', icon: '🎭', desc: 'Film, music, books, arts, theater' },
  { id: 'party',        name: 'Party',         tab: 'Party',         layer: 'Party',         color: '#e879f9', icon: '🪩', desc: 'Nightlife, dining, hospitality, events' },
  { id: 'fraud',        name: 'Fraud',         tab: 'Fraud',         layer: 'Fraud',         color: '#dc2626', icon: '🕵️', desc: 'Scams, corruption, white collar crime, cults' },
  { id: 'astrology',    name: 'Astrology',     tab: 'Astrology',     layer: 'Astrology',     color: '#c084fc', icon: '✨', desc: 'Planetary placements, celestial events' },
  { id: 'astronomy',    name: 'Astronomy',     tab: 'Astronomy',     layer: 'Astronomy',     color: '#38bdf8', icon: '🔭', desc: 'Space news pinned to planets' },
  { id: 'conflict',     name: 'Conflicts',     tab: 'Conflicts',     layer: 'Conflicts',     color: '#f97316', icon: '⚔️', desc: 'Wars, attacks, military movements' },
  { id: 'disaster',     name: 'Disasters',     tab: 'Disasters',     layer: 'Disasters',     color: '#eab308', icon: '🌊', desc: 'Earthquakes, floods, natural events' },
  { id: 'storm',        name: 'Storms',        tab: 'Storms',        layer: 'Storms',        color: '#60a5fa', icon: '🌀', desc: 'Hurricanes, cyclones, severe weather' },
  { id: 'humanitarian', name: 'Humanitarian',  tab: 'Aid',           layer: 'Humanitarian',  color: '#ec4899', icon: '🏥', desc: 'Aid, crises, relief operations' },
  { id: 'launch',       name: 'Launches',      tab: 'Launches',      layer: 'Launches',      color: '#a78bfa', icon: '🚀', desc: 'Upcoming rocket launches' }
];

// Explore modes shown above the feed grid on the landing screen.
export const EXPLORE_MODES = [
  { id: 'history',    name: 'History',     color: '#a3e635', desc: 'Step back to any point in time — see what was happening anywhere in the world' },
  { id: 'connection', name: 'Connections', color: '#f59e0b', desc: 'Surface the threads linking events — chokepoints, fault lines, economic pressure' }
];

// Non-feed layers that still render on the globe.
export const EXTRA_LAYERS = [
  { id: 'flight',     layer: 'Live Flights', color: '#10b981', icon: '✈️' },
  { id: 'connection', layer: 'Connections',  color: '#f59e0b', icon: '🔗' },
  { id: 'history',    layer: 'Historical',   color: '#a3e635', icon: '🕰️' }
];

export const COLORS = Object.fromEntries(
  [...VERTICALS, ...EXTRA_LAYERS].map(v => [v.id, v.color]).concat([['anchor', '#ef4444']])
);
export const ICONS = Object.fromEntries(
  [...VERTICALS, ...EXTRA_LAYERS].map(v => [v.id, v.icon]).concat([['anchor', '⊕']])
);

export const FEED_IDS = VERTICALS.map(v => v.id);
