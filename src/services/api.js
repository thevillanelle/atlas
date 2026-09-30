// The only place the browser talks to the Atlas backend. No third-party APIs are called
// from the client anymore — everything goes through /api (cached, logged, keyed server-side).

async function get(path, { timeout = 20000 } = {}) {
  const res = await fetch(path, { signal: AbortSignal.timeout(timeout) });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(body.error || `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return body;
}

export function getFeed(vertical, { cities } = {}) {
  const p = new URLSearchParams();
  if (vertical === 'nyc' && cities) for (const c of cities) p.append('c', `${c.name}|${c.lat.toFixed(4)}|${c.lng.toFixed(4)}`);
  const qs = p.toString();
  return get(`/api/feed/${vertical}${qs ? '?' + qs : ''}`);
}

export const getHealth = () => get('/api/health', { timeout: 12000 });
export const getMarkets = () => get('/api/markets');
export const getHistory = (year, month) => get(`/api/history?year=${year}&month=${month}`, { timeout: 30000 });

export async function geocode(q) {
  try {
    return await get(`/api/geocode?q=${encodeURIComponent(q)}`);
  } catch (e) {
    if (e.status === 404) return null;
    throw e;
  }
}

export function runConnect(engine, events) {
  const p = new URLSearchParams({ engine });
  // Sorted so the same selection hits the same CDN cache entry regardless of click order.
  events
    .map(e => [e.type, e.title, e.location].map(s => String(s || '').replace(/~/g, ' ')).join('~'))
    .sort()
    .forEach(e => p.append('e', e));
  return get(`/api/connect?${p}`, { timeout: 30000 });
}
