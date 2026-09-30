// Shared HTTP plumbing for /api handlers: upstream fetches with timeouts + retries,
// CDN cache headers, and error handling that always lands in the Vercel logs.

// Wikimedia and Nominatim both require an identifying User-Agent — browsers can't send one.
export const USER_AGENT = 'ATLAS/2.0 (https://atlas.ritualware.app)';

const sleep = ms => new Promise(r => setTimeout(r, ms));

export class UpstreamError extends Error {
  constructor(source, status, message) {
    super(`${source}: ${message || 'HTTP ' + status}`);
    this.source = source;
    this.status = status;
  }
}

export async function fetchJSON(url, { source = new URL(url).hostname, timeout = 9000, headers = {}, retries = 1 } = {}) {
  for (let attempt = 0; ; attempt++) {
    let res;
    try {
      res = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT, Accept: 'application/json', ...headers },
        signal: AbortSignal.timeout(timeout)
      });
    } catch (e) {
      if (attempt < retries) { await sleep(400 * (attempt + 1)); continue; }
      throw new UpstreamError(source, 0, e.name === 'TimeoutError' ? 'timed out' : e.message);
    }
    // 429 / 5xx are worth one more try; everything else is a hard failure.
    if ((res.status === 429 || res.status >= 500) && attempt < retries) {
      const retryAfter = Number(res.headers.get('retry-after')) * 1000;
      await sleep(retryAfter || 1100 * 2 ** attempt);
      continue;
    }
    if (!res.ok) throw new UpstreamError(source, res.status);
    return res.json();
  }
}

// Query params, including repeated keys (?c=a&c=b), independent of the runtime.
export function params(req) {
  return new URL(req.url, 'http://localhost').searchParams;
}

// cacheSeconds > 0 → shared CDN cache with a long stale-while-revalidate window, so
// visitors get an instant (possibly slightly stale) response while Vercel refreshes it.
export function sendJSON(res, status, body, cacheSeconds = 0) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', cacheSeconds > 0 && status === 200
    ? `public, max-age=60, s-maxage=${cacheSeconds}, stale-while-revalidate=86400`
    : 'no-store');
  res.end(JSON.stringify(body));
}

export function handler(fn) {
  return async (req, res) => {
    try {
      await fn(req, res);
    } catch (e) {
      const status = e instanceof UpstreamError ? 502 : e.status || 500;
      if (status >= 500) console.error(`[${req.url}]`, e);
      else console.warn(`[${req.url}] ${status} ${e.message}`);
      sendJSON(res, status, { error: e.message });
    }
  };
}

export function badRequest(message) {
  const e = new Error(message);
  e.status = 400;
  return e;
}
