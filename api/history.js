// GET /api/history?year=1962&month=10 → Wikipedia events for that month, pinned to places
import { handler, sendJSON, params, badRequest } from '../server/http.js';
import { historicalEvents } from '../server/providers/wikipedia.js';

export default handler(async (req, res) => {
  const q = params(req);
  const year = parseInt(q.get('year'), 10);
  const month = parseInt(q.get('month'), 10);
  const thisYear = new Date().getUTCFullYear();
  if (!(year >= 100 && year <= thisYear) || !(month >= 1 && month <= 12)) {
    throw badRequest(`year must be 100–${thisYear} and month 1–12`);
  }
  const events = await historicalEvents(month, year);
  // Past months don't change; the current month is still being written.
  const settled = year < thisYear || month < new Date().getUTCMonth() + 1;
  sendJSON(res, 200, { year, month, events }, settled ? 7 * 86400 : 3600);
});
