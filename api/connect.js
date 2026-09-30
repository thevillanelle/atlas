// GET /api/connect?engine=guardian|wiki|wikidata|backlinks&e=type~title~location&e=...
// Runs one analysis engine over 2+ connected events.
import { handler, sendJSON, params, badRequest } from '../server/http.js';
import { guardianSearch } from '../server/providers/guardian.js';
import { engineWiki, engineBacklinks } from '../server/providers/wikipedia.js';
import { engineWikidata } from '../server/providers/wikidata.js';

async function engineGuardian(evs) {
  const terms = evs.map(e => e.location.split(',')[0].trim());
  const arts = await guardianSearch({ q: terms.map(t => `"${t}"`).join(' AND '), pageSize: 10 });
  if (!arts.length) {
    return { threads: [`The Guardian found no articles covering ${terms.join(' + ')} together. Try connecting events that share a region or geopolitical theme.`], signals: [] };
  }
  const sections = [...new Set(arts.map(a => a.sectionName))];
  const trail = arts.map(a => a.fields && a.fields.trailText).find(Boolean);
  return {
    threads: [
      `The Guardian found ${arts.length} article${arts.length !== 1 ? 's' : ''} covering ${terms.join(' + ')} in the same story.`,
      `Most recent: "${arts[0].webTitle}" (${(arts[0].webPublicationDate || '').slice(0, 10)})`,
      `Coverage appears in: ${sections.join(', ')} — the section spread reveals how editors are framing the connection.`,
      ...(trail ? [`From the coverage: "${trail.replace(/<[^>]+>/g, '').slice(0, 180)}…"`] : [])
    ],
    signals: sections,
    links: arts.slice(0, 5).map(a => ({ title: a.webTitle, url: a.webUrl }))
  };
}

const ENGINES = { guardian: engineGuardian, wiki: engineWiki, wikidata: engineWikidata, backlinks: engineBacklinks };

export default handler(async (req, res) => {
  const q = params(req);
  const engine = ENGINES[q.get('engine')];
  if (!engine) throw badRequest('engine must be one of ' + Object.keys(ENGINES).join(', '));
  const evs = q.getAll('e').slice(0, 6).map(raw => {
    const [type, title, location] = raw.split('~');
    return { type: type || '', title: title || '', location: location || title || '' };
  }).filter(e => e.title);
  if (evs.length < 2) throw badRequest('connect needs at least 2 events');
  sendJSON(res, 200, await engine(evs), 86400);
});
