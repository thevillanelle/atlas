// App state in one place. Modules read `state` directly and change it only through
// update(), which notifies subscribers with the set of keys that changed.
import { VERTICALS, EXTRA_LAYERS } from '../domain/verticals.js';

function readLocal(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v == null ? fallback : JSON.parse(v);
  } catch {
    return fallback;
  }
}

export function writeLocal(key, value) {
  try {
    if (value == null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch { /* storage unavailable (private mode) — keep in memory only */ }
}

export const state = {
  // feeds
  feeds: {},        // vertical → events[]
  feedStatus: {},   // vertical → 'loading' | 'live' | 'fallback' | 'static'
  skyEvents: [],    // live planet sub-points (computed client-side)

  // feed panel
  tab: 'all',
  search: '',
  selectedId: null,
  feedHidden: false,
  panelOpen: window.innerWidth >= 768,
  layerVis: Object.fromEntries([...VERTICALS, ...EXTRA_LAYERS].map(v => [v.id, v.id !== 'history'])),
  watchTags: readLocal('atlas_watchlist', ['Gaza', 'Ukraine', 'AI', 'Markets', 'Fashion', 'Climate']),

  // explore modes
  history: { open: false, events: [], date: null },
  connect: { on: false, ids: [], engine: 'guardian' },
  throughline: null, // shared string being viewed: {row, events}

  // account
  user: null,
  tier: 'free',
  cities: [],         // user's home cities; empty → the server defaults Local to NYC
  anchor: null,       // {title, place, lat, lng, date?, time?}
  anchorEvents: [],
  natal: readLocal('atlas_natal', null),

  // chrome
  theme: 0,           // 0 night · 1 day · 2 IRL
  tickerFeeds: readLocal('atlas_ticker_feeds', ['markets'])
};

const listeners = new Set();

export function update(patch) {
  const changed = new Set(Object.keys(patch));
  Object.assign(state, patch);
  listeners.forEach(fn => fn(changed));
}

// fn(changedKeys) — runs after every update touching any of `keys` (or all, if omitted).
export function subscribe(keys, fn) {
  const wanted = keys && new Set(keys);
  const wrapped = changed => {
    if (!wanted || [...changed].some(k => wanted.has(k))) fn(changed);
  };
  listeners.add(wrapped);
  return () => listeners.delete(wrapped);
}

// All live-feed events in vertical order (history/anchor/string pins are separate layers).
export function allEvents() {
  return VERTICALS.flatMap(v => v.id === 'astrology'
    ? state.skyEvents.concat(state.feeds.astrology || [])
    : state.feeds[v.id] || []).concat(state.feeds.connection || []);
}

export function findEvent(id) {
  return allEvents().find(e => e.id === id)
    || state.history.events.find(e => e.id === id)
    || state.anchorEvents.find(e => e.id === id)
    || (state.throughline && state.throughline.events.find(e => e.id === id));
}

export const isPro = () => state.tier === 'pro' || state.tier === 'team';
