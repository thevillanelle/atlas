import { fetchJSON } from '../http.js';

async function entityFor(label) {
  const p = new URLSearchParams({ action: 'wbsearchentities', search: label, language: 'en', limit: '1', format: 'json' });
  const data = await fetchJSON(`https://www.wikidata.org/w/api.php?${p}`, { source: 'wikidata', timeout: 6000 });
  return data && data.search && data.search[0];
}

export async function engineWikidata(evs) {
  const found = (await Promise.all(evs.map(e => entityFor(e.location.split(',')[0].trim())))).filter(Boolean);
  if (found.length < 2) {
    return { threads: ['Could not resolve Wikidata entities for these locations. Wikidata works best with city, country, or well-known place names.'], signals: [] };
  }
  const [a, b] = found;
  const sparql = `SELECT DISTINCT ?propLabel ?valueLabel WHERE { wd:${a.id} ?prop ?value . wd:${b.id} ?prop ?value . ?propItem wikibase:directClaim ?prop . FILTER(?value != wd:${a.id} && ?value != wd:${b.id}) SERVICE wikibase:label { bd:serviceParam wikibase:language "en" . } } LIMIT 15`;
  const result = await fetchJSON(`https://query.wikidata.org/sparql?query=${encodeURIComponent(sparql)}&format=json`, { source: 'wikidata', timeout: 10000 });
  const props = [...new Set(((result.results && result.results.bindings) || []).map(row => {
    const p = row.propLabel && row.propLabel.value;
    const v = row.valueLabel && row.valueLabel.value;
    if (!v || v.startsWith('Q')) return null;
    // propLabel is a bare URI or P-id when Wikidata has no label — drop it then.
    const prop = p && !p.startsWith('http') && !p.startsWith('P') ? p : null;
    return prop ? `${prop}: ${v}` : v;
  }).filter(Boolean))];
  const threads = props.length
    ? [
        `Wikidata links ${a.label} (${a.id}) and ${b.label} (${b.id}) through ${props.length} shared propert${props.length === 1 ? 'y' : 'ies'}.`,
        'Shared structural properties reveal the ontological backbone connecting these events — the same country, region, governing body, or historical classification.'
      ]
    : [
        `Wikidata found no direct shared properties between ${a.label} and ${b.label}.`,
        'These entities may be connected at a higher level of abstraction — try WIKI for category overlap or BACKLINKS for encyclopedic co-citation.'
      ];
  return { threads, signals: props.slice(0, 10) };
}
