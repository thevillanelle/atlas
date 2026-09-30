// Loads every feed vertical from /api/feed/* into the store. Each vertical renders as soon
// as it arrives, so one slow or failing source never blocks the rest.
import { state, update } from '../core/store.js';
import { FEED_IDS } from '../domain/verticals.js';
import { skyEvents } from '../domain/sky-events.js';
import { getFeed } from './api.js';

// These share one Guardian key (≈1 req/s). On a cold CDN cache, fire them a few at a time.
const GUARDIAN_BACKED = new Set(['news', 'nyc', 'world', 'usnews', 'money', 'science', 'fashion', 'culture', 'party', 'fraud', 'conflict', 'storm', 'astronomy']);
const GUARDIAN_CONCURRENCY = 3;

async function loadOne(id) {
  update({ feedStatus: { ...state.feedStatus, [id]: 'loading' } });
  try {
    const feed = await getFeed(id, id === 'nyc' ? { cities: state.cities } : undefined);
    update({ feeds: { ...state.feeds, [id]: feed.events }, feedStatus: { ...state.feedStatus, [id]: feed.status } });
    if (feed.status === 'fallback') console.warn(`[feed:${id}] fallback — ${feed.error}`);
  } catch (e) {
    console.error(`[feed:${id}]`, e.message);
    update({ feedStatus: { ...state.feedStatus, [id]: 'fallback' } });
  }
}

async function pool(ids, size, fn) {
  const queue = [...ids];
  await Promise.all(Array.from({ length: size }, async () => {
    while (queue.length) await fn(queue.shift());
  }));
}

export async function loadAllFeeds(onProgress = () => {}) {
  update({ skyEvents: skyEvents() });
  const ids = [...FEED_IDS, 'connection'];
  let done = 0;
  const tracked = async id => {
    await loadOne(id);
    onProgress(++done / ids.length, id);
  };
  await Promise.all([
    Promise.all(ids.filter(id => !GUARDIAN_BACKED.has(id)).map(tracked)),
    pool(ids.filter(id => GUARDIAN_BACKED.has(id)), GUARDIAN_CONCURRENCY, tracked)
  ]);
}

export const reloadLocalNews = () => loadOne('nyc');

// Planet sub-points move continuously; the feeds themselves refresh behind the CDN.
export function startRefreshing() {
  setInterval(() => update({ skyEvents: skyEvents() }), 60 * 1000);
  setInterval(() => FEED_IDS.forEach(loadOne), 10 * 60 * 1000);
}
