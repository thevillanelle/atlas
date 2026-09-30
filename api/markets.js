// GET /api/markets → ticker quotes (crypto + FX)
import { handler, sendJSON } from '../server/http.js';
import { marketQuotes } from '../server/providers/markets.js';

export default handler(async (req, res) => {
  const quotes = await marketQuotes();
  sendJSON(res, 200, quotes, quotes.items.length ? 120 : 30);
});
