// GET /api/health → one server-side probe per upstream, mapped onto the verticals that
// depend on it. Replaces the 16 browser-side probes the landing screen used to fire.
import { handler, sendJSON, fetchJSON } from '../server/http.js';
import { guardianSearch } from '../server/providers/guardian.js';

const PROBES = {
  guardian:  () => guardianSearch({ pageSize: 1 }),
  usgs:      () => fetchJSON('https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&minmagnitude=5&limit=1', { source: 'usgs', retries: 0, timeout: 5000 }),
  hackernews:() => fetchJSON('https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=1', { source: 'hackernews', retries: 0, timeout: 5000 }),
  spacedevs: () => fetchJSON('https://ll.thespacedevs.com/2.2.0/launch/upcoming/?format=json&limit=1&mode=list', { source: 'spacedevs', retries: 0, timeout: 5000 }),
  noaa:      () => fetchJSON('https://services.swpc.noaa.gov/products/noaa-planetary-k-index-forecast.json', { source: 'noaa', retries: 0, timeout: 5000 }),
  wikipedia: () => fetchJSON('https://en.wikipedia.org/w/api.php?action=query&meta=siteinfo&format=json', { source: 'wikipedia', retries: 0, timeout: 5000 }),
  markets:   () => fetchJSON('https://open.er-api.com/v6/latest/USD', { source: 'er-api', retries: 0, timeout: 5000 })
};

// vertical → upstream it needs (null = computed or curated, always available)
const DEPENDS_ON = {
  news: 'guardian', world: 'guardian', usnews: 'guardian', nyc: 'guardian', money: 'guardian',
  science: 'guardian', fashion: 'guardian', culture: 'guardian', party: 'guardian', fraud: 'guardian',
  conflict: 'guardian', storm: 'guardian', astronomy: 'guardian',
  tech: 'hackernews', disaster: 'usgs', launch: 'spacedevs', history: 'wikipedia',
  astrology: null, humanitarian: null, connection: null
};

export default handler(async (req, res) => {
  const names = Object.keys(PROBES);
  const results = await Promise.all(names.map(async name => {
    const t0 = Date.now();
    try {
      await PROBES[name]();
      return [name, { ok: true, ms: Date.now() - t0 }];
    } catch (e) {
      console.error(`[health:${name}]`, e.message);
      return [name, { ok: false, ms: Date.now() - t0, error: e.message }];
    }
  }));
  const sources = Object.fromEntries(results);
  const verticals = Object.fromEntries(Object.entries(DEPENDS_ON).map(([v, src]) => [v, src ? sources[src].ok : true]));
  const up = Object.values(verticals).filter(Boolean).length;
  sendJSON(res, 200, { ok: up === Object.keys(verticals).length, up, total: Object.keys(verticals).length, sources, verticals }, 3600);
});
