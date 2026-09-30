// Guardian Open Platform proxy — keeps GUARDIAN_API_KEY server-side.
// Client calls /api/guardian?path=search&section=world&page-size=10 ...
// Responses are cached at the edge so a free developer key stays under its daily limit.

const ALLOWED_PATH = /^[a-z0-9-]+$/;

module.exports = async function handler(req, res) {
  const key = process.env.GUARDIAN_API_KEY;
  if (!key) {
    res.status(500).json({ error: 'GUARDIAN_API_KEY is not set' });
    return;
  }

  const params = new URLSearchParams(req.query);
  const path = params.get('path') || 'search';
  if (!ALLOWED_PATH.test(path)) {
    res.status(400).json({ error: 'invalid path' });
    return;
  }
  params.delete('path');
  params.delete('api-key');
  params.set('api-key', key);

  try {
    const upstream = await fetch('https://content.guardianapis.com/' + path + '?' + params.toString(), {
      signal: AbortSignal.timeout(8000)
    });
    const body = await upstream.text();
    if (upstream.ok) {
      res.setHeader('Cache-Control', 'public, s-maxage=1800, stale-while-revalidate=86400');
    }
    res.setHeader('Content-Type', 'application/json');
    res.status(upstream.status).send(body);
  } catch (e) {
    res.status(502).json({ error: 'Guardian upstream failed' });
  }
}
