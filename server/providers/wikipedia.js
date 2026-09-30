import { fetchJSON } from '../http.js';
import { findPlace } from '../../src/domain/geo.js';

const API = 'https://en.wikipedia.org/w/api.php';
const wiki = (params, timeout = 10000) =>
  fetchJSON(`${API}?${new URLSearchParams({ format: 'json', ...params })}`, { source: 'wikipedia', timeout });

export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const articleUrl = title => 'https://en.wikipedia.org/wiki/' + encodeURIComponent(title.replace(/ /g, '_'));

function histEvent(id, title, place, label, brief, url, monthName, year) {
  return {
    id, type: 'history', title,
    location: place.name, lat: place.lat, lng: place.lng,
    severity: 3, age: label, brief, url,
    sources: [{ n: 'Wikipedia', age: label, url }],
    tags: [String(year), monthName, 'Historical', place.name],
    live: false
  };
}

// PRIMARY: articles filed under Category:<Month Year>
async function fromCategory(monthName, year) {
  const data = await wiki({
    action: 'query', generator: 'categorymembers', gcmtitle: `Category:${monthName} ${year}`,
    gcmlimit: '50', gcmtype: 'page', prop: 'extracts', exintro: '1', explaintext: '1', exchars: '500'
  }, 15000);
  return Object.values((data.query && data.query.pages) || {}).map(page => {
    if (!page.extract) return null;
    const place = findPlace(page.title + '. ' + page.extract);
    if (!place) return null;
    const brief = page.extract.slice(0, 200) + (page.extract.length > 200 ? '…' : '');
    return histEvent(`hist:c:${page.pageid}`, page.title, place, `${monthName} ${year}`, brief, articleUrl(page.title), monthName, year);
  }).filter(Boolean);
}

// SECONDARY: dated bullet lines from the "<Month> <Year>" article
async function fromMonthArticle(monthName, year) {
  const data = await wiki({ action: 'query', prop: 'extracts', titles: `${monthName}_${year}`, explaintext: '1', exsectionformat: 'plain' }, 12000);
  const page = Object.values((data.query && data.query.pages) || {})[0];
  if (!page || page.missing !== undefined || !page.extract) return [];
  const events = [];
  let inEvents = false;
  page.extract.split('\n').forEach((raw, i) => {
    const line = raw.replace(/\[\d+\]/g, '').trim();
    if (/^Events?\s*$/i.test(line)) { inEvents = true; return; }
    if (/^(Births?|Deaths?|Holidays?|Notes?)\s*$/i.test(line)) { inEvents = false; return; }
    if (!inEvents || line.length < 15) return;
    const m = line.match(/^(?:[A-Za-z]+ )?(\d{1,2})\s*[–—-]\s*(.{20,})/);
    if (!m) return;
    const desc = m[2].trim();
    const place = findPlace(desc);
    if (!place) return;
    const label = `${monthName} ${m[1]}, ${year}`;
    const url = 'https://en.wikipedia.org/wiki/Special:Search?search=' + encodeURIComponent(desc.split(/[,.]/)[0].trim().slice(0, 60) + ' ' + year);
    events.push(histEvent(`hist:a:${year}-${monthName}-${i}`, desc.slice(0, 90) + (desc.length > 90 ? '…' : ''), place, label, desc, url, monthName, year));
  });
  return events;
}

// TERTIARY: keyword search fallback
async function fromSearch(monthName, year) {
  const data = await wiki({ action: 'query', list: 'search', srsearch: `${monthName} ${year}`, srnamespace: '0', srlimit: '50' });
  return ((data.query && data.query.search) || []).map(r => {
    const snippet = r.snippet.replace(/<[^>]*>/g, '').trim();
    const place = findPlace(r.title + ' ' + snippet);
    if (!place) return null;
    return histEvent(`hist:s:${r.pageid}`, r.title, place, `${monthName} ${year}`, snippet, articleUrl(r.title), monthName, year);
  }).filter(Boolean);
}

export async function historicalEvents(month, year) {
  const monthName = MONTHS[month - 1];
  const results = await Promise.allSettled([fromCategory(monthName, year), fromMonthArticle(monthName, year), fromSearch(monthName, year)]);
  if (results.every(r => r.status === 'rejected')) throw results[0].reason;
  const seen = new Set();
  return results.flatMap(r => r.status === 'fulfilled' ? r.value : [])
    .filter(e => {
      const key = e.title.slice(0, 40).toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 50);
}

// ---------------------------------------------------------------------------
// Connection engines
// ---------------------------------------------------------------------------
async function resolveArticle(ev) {
  const locs = ev.location.split(',').map(s => s.trim().replace(/^\d+\s*km\s+\w+\s+of\s+/i, '').trim()).filter(s => s.length > 3);
  const candidates = ev.type === 'history' ? [ev.title] : [ev.title.slice(0, 60), ...locs.reverse()];
  for (const term of candidates.filter(Boolean)) {
    const data = await wiki({ action: 'query', list: 'search', srsearch: term, srlimit: '1' }, 6000);
    const hit = data.query && data.query.search && data.query.search[0];
    if (hit) return hit.title;
  }
  return null;
}

export async function engineWiki(evs) {
  const results = await Promise.all(evs.map(async ev => {
    const title = await resolveArticle(ev);
    if (!title) return null;
    const data = await wiki({ action: 'query', titles: title, prop: 'categories', cllimit: '50', clshow: '!hidden' }, 6000);
    const page = Object.values((data.query && data.query.pages) || {})[0];
    const cats = ((page && page.categories) || []).map(c => c.title.replace('Category:', ''));
    return cats.length ? { label: title, cats } : null;
  }));
  const found = results.filter(Boolean);
  if (found.length < 2) return { threads: ['Wikipedia could not find matching articles for one or more of these events.'], signals: [] };
  const shared = found[0].cats.filter(c => found.slice(1).every(r => r.cats.includes(c)));
  const [a, b] = found;
  const threads = shared.length
    ? [
        `Wikipedia places "${a.label}" and "${b.label}" in ${shared.length} shared categor${shared.length === 1 ? 'y' : 'ies'}.`,
        'Shared classification signals structural similarity — these events belong to the same encyclopedic territory.',
        ...(shared.length > 3 ? [`High overlap (${shared.length} categories) suggests deep entanglement — same conflict, region, or systemic cause.`] : [])
      ]
    : [
        `No shared Wikipedia categories between "${a.label}" and "${b.label}".`,
        'The connection is likely indirect — economic, causal, or temporal. Try BACKLINKS for co-citation patterns.'
      ];
  return { threads, signals: shared.slice(0, 12) };
}

export async function engineBacklinks(evs) {
  const results = await Promise.all(evs.map(async ev => {
    const title = ev.type === 'history' ? ev.title : ev.location.split(',')[0].trim();
    const data = await wiki({ action: 'query', titles: title, prop: 'linkshere', lhlimit: '100', lhnamespace: '0' }, 7000);
    const page = Object.values((data.query && data.query.pages) || {})[0];
    return ((page && page.linkshere) || []).map(l => l.title);
  }));
  const shared = results[0].filter(link => results.slice(1).every(r => r.includes(link)));
  const threads = shared.length
    ? [
        `${shared.length} Wikipedia article${shared.length !== 1 ? 's' : ''} cite${shared.length === 1 ? 's' : ''} both events — these are the connective tissue.`,
        `Articles referencing both: ${shared.slice(0, 5).join(', ')}${shared.length > 5 ? ` and ${shared.length - 5} more` : ''}.`,
        'Shared citations reveal the broader topics, conflicts, and histories that contain both events at an encyclopedic level — this is the structural frame.'
      ]
    : [
        'No Wikipedia articles directly reference both events.',
        'Their connection is likely lateral rather than hierarchical — look for a third event or actor that bridges them rather than a parent topic that contains them both.'
      ];
  return { threads, signals: shared.slice(0, 10) };
}
