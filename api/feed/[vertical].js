// GET /api/feed/:vertical            → one feed vertical, normalized events
// GET /api/feed/nyc?c=Name|lat|lng   → local news for the given cities (repeat c, max 5)
import { handler, sendJSON, params, badRequest } from '../../server/http.js';
import { FEEDS, buildFeed, localNews } from '../../server/feeds.js';

const FALLBACK_CACHE = 60; // retry soon when an upstream was down

function parseCities(values) {
  return values.map(v => {
    const [name, lat, lng] = v.split('|');
    return { name: (name || '').trim().slice(0, 80), lat: Number(lat), lng: Number(lng) };
  }).filter(c => c.name && Number.isFinite(c.lat) && Number.isFinite(c.lng)).slice(0, 5);
}

export default handler(async (req, res) => {
  const q = params(req);
  const id = req.query?.vertical || q.get('vertical');
  if (!FEEDS[id]) throw badRequest(`unknown vertical "${id}"`);

  const cities = id === 'nyc' ? parseCities(q.getAll('c')) : [];
  const feed = await buildFeed(id, cities.length ? () => localNews(cities) : undefined);
  sendJSON(res, 200, feed, feed.status === 'fallback' ? FALLBACK_CACHE : FEEDS[id].cache);
});
