import { fetchJSON } from '../http.js';
import { findPlace, TECH_HUBS } from '../../src/domain/geo.js';

export async function frontPage(limit = 15) {
  const d = await fetchJSON(`https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=${limit}`, { source: 'hackernews' });
  return (d.hits || []).map((h, i) => {
    const place = findPlace(h.title) || findPlace(h.url || '');
    const hub = TECH_HUBS[i % TECH_HUBS.length];
    const discussion = `https://news.ycombinator.com/item?id=${h.objectID}`;
    return {
      id: `hn:${h.objectID}`,
      type: 'tech',
      title: h.title,
      location: place ? place.name : 'Tech Hub',
      lat: place ? place.lat : hub[0],
      lng: place ? place.lng : hub[1],
      severity: Math.min(4, Math.max(1, Math.floor((h.points || 0) / 150) + 1)),
      ts: h.created_at,
      brief: `${h.title}\n\n${h.points || 0} points · ${h.num_comments || 0} comments · by ${h.author}`,
      url: h.url || discussion,
      sources: [{ n: 'Hacker News', ts: h.created_at, url: discussion }],
      tags: ['Tech', 'Hacker News'],
      live: true
    };
  });
}
