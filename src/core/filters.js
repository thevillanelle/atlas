// Which events are visible — shared by the feed list and the globe so they always agree.
import { state, allEvents } from './store.js';

const matchesTerm = (ev, term) => {
  const t = term.toLowerCase();
  return ev.title.toLowerCase().includes(t)
    || (ev.location || '').toLowerCase().includes(t)
    || (ev.tags || []).some(tag => tag.toLowerCase().includes(t));
};

function byTab(events) {
  if (state.tab === 'watchlist') {
    const terms = state.search ? [state.search] : state.watchTags;
    return terms.length ? events.filter(ev => terms.some(t => matchesTerm(ev, t))) : [];
  }
  return state.tab === 'all' ? events : events.filter(ev => ev.type === state.tab);
}

const bySearch = events =>
  state.search && state.tab !== 'watchlist' ? events.filter(ev => matchesTerm(ev, state.search)) : events;

// Sidebar list. Connection (structural) events only show while connect mode is on.
export function listEvents() {
  if (state.history.open) return state.history.events;
  let evs = allEvents();
  if (!state.connect.on) evs = evs.filter(ev => ev.type !== 'connection');
  return bySearch(byTab(evs)).sort((a, b) => (b.severity || 0) - (a.severity || 0));
}

// Globe markers for live feeds (layers + tab + search).
export function globeFeedEvents() {
  return bySearch(byTab(allEvents().filter(ev => state.layerVis[ev.type])));
}

export function countByType() {
  const counts = {};
  for (const ev of allEvents()) counts[ev.type] = (counts[ev.type] || 0) + 1;
  return counts;
}
