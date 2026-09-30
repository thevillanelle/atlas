// GET /api/geocode?q=Lisbon → {lat, lng, display} | 404
import { handler, sendJSON, params, badRequest } from '../server/http.js';
import { geocode } from '../server/providers/nominatim.js';

export default handler(async (req, res) => {
  const query = (params(req).get('q') || '').trim().slice(0, 120);
  if (!query) throw badRequest('q is required');
  const place = await geocode(query);
  if (!place) return sendJSON(res, 404, { error: 'not found' });
  sendJSON(res, 200, place, 30 * 86400);
});
