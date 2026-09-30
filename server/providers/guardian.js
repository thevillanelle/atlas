import { fetchJSON, UpstreamError } from '../http.js';
import { findPlace, TECH_HUBS } from '../../src/domain/geo.js';

// Guardian Open Platform. A developer key allows ~1 req/s and 500/day, so every caller
// sits behind a CDN-cached endpoint and requests are retried once on 429.

export function guardianKey() {
  return process.env.GUARDIAN_API_KEY || '';
}

export async function guardianSearch({ section, q, pageSize = 20, path = 'search' } = {}) {
  const key = guardianKey();
  if (!key) throw new UpstreamError('guardian', 0, 'GUARDIAN_API_KEY is not set');
  const p = new URLSearchParams({
    'api-key': key,
    'page-size': String(Math.min(pageSize, 50)),
    'order-by': 'newest',
    'show-fields': 'trailText'
  });
  if (section) p.set('section', section);
  if (q) p.set('q', q);
  const data = await fetchJSON(`https://content.guardianapis.com/${path}?${p}`, { source: 'guardian', timeout: 9000, retries: 2 });
  return (data.response && data.response.results) || [];
}

const stripTags = s => (s || '').replace(/<[^>]*>/g, '').trim();

// pin: optional {lat, lng, label} that overrides place detection (local news, sky bodies).
export function toEvent(article, type, i, pin) {
  const place = findPlace(article.webTitle);
  const hub = TECH_HUBS[i % TECH_HUBS.length];
  const at = pin || place || { lat: hub[0], lng: hub[1] };
  return {
    id: `${type}:${article.id}`,
    type,
    title: article.webTitle,
    location: pin?.label || place?.name || article.sectionName,
    lat: at.lat,
    lng: at.lng,
    severity: 2,
    ts: article.webPublicationDate || null,
    brief: stripTags(article.fields && article.fields.trailText) || article.webTitle,
    url: article.webUrl,
    sources: [{ n: 'The Guardian', ts: article.webPublicationDate || null, url: article.webUrl }],
    tags: [type, article.sectionName].filter(Boolean),
    live: true
  };
}

export async function guardianEvents(type, query) {
  const results = await guardianSearch(query);
  return results.map((a, i) => toEvent(a, type, i));
}
