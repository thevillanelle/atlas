// Feed registry: how each vertical is built server-side, how long it may be cached,
// and what to serve when its upstream is down. Every feed resolves to
//   { vertical, status: 'live' | 'fallback' | 'static', events, error? }

import { guardianEvents, guardianSearch, toEvent } from './providers/guardian.js';
import { earthquakes } from './providers/usgs.js';
import { frontPage } from './providers/hackernews.js';
import { upcomingLaunches } from './providers/launches.js';
import { predictedKp } from './providers/noaa.js';
import { dedupeByTitle } from '../src/domain/geo.js';
import { PLANET_DEFS, planetGeogLatLng, daysSinceJ2000, gmstFromDays } from '../src/domain/astro.js';
import { STAR_CATALOG } from '../src/domain/sky-catalog.js';
import { CHOKEPOINTS, ECONOMIC_STRESS, POLITICAL_FLASH, SEEDS, FALLBACK_LAUNCHES } from './static-events.js';

const HOUR = 3600;

// Old seed/static records use {a: '2024'} for source ages; the API speaks {age}.
const normalizeStatic = ev => ({
  ...ev,
  live: false,
  sources: (ev.sources || []).map(s => ({ n: s.n, age: s.a, url: s.url }))
});

const guardian = (type, query, limit) => async () =>
  dedupeByTitle(await guardianEvents(type, { pageSize: limit, ...query })).slice(0, limit);

// Several Guardian queries merged into one vertical; tolerates partial failure.
const guardianMulti = (type, queries, limit) => async () => {
  const settled = await Promise.allSettled(queries.map(q => guardianEvents(type, q)));
  if (settled.every(r => r.status === 'rejected')) throw settled[0].reason;
  return dedupeByTitle(settled.flatMap(r => r.status === 'fulfilled' ? r.value : [])).slice(0, limit);
};

async function astronomyNews() {
  const results = await guardianSearch({
    section: 'science',
    q: 'Mercury OR Venus OR Mars OR Jupiter OR Saturn OR Uranus OR Neptune OR NASA OR "space telescope" OR "James Webb" OR asteroid OR comet OR supernova OR nebula OR "neutron star"',
    pageSize: 30
  });
  const d = daysSinceJ2000(new Date());
  const gmst = gmstFromDays(d);
  const observatories = [[19.8, -155.5], [28.7, -17.9], [-30.2, -70.7], [31.9, 35.0], [-23.2, 16.5]];
  return results.map((a, i) => {
    const title = a.webTitle.toLowerCase();
    const planet = PLANET_DEFS.find(p => title.includes(p.name.toLowerCase()));
    const star = planet ? null : STAR_CATALOG.find(s => title.includes(s[0].toLowerCase()));
    let pin;
    if (planet) {
      const pos = planetGeogLatLng(planet, d);
      pin = { lat: pos.lat, lng: pos.lng, label: planet.name };
    } else if (star) {
      let lng = star[1] - gmst;
      if (lng > 180) lng -= 360;
      if (lng < -180) lng += 360;
      pin = { lat: star[2], lng, label: star[0] };
    } else {
      const o = observatories[i % observatories.length];
      pin = { lat: o[0], lng: o[1], label: 'Deep Space' };
    }
    const ev = toEvent(a, 'astronomy', i, pin);
    ev.tags = ['Astronomy', pin.label === 'Deep Space' ? 'Space' : pin.label];
    ev.planet = planet ? planet.name : null;
    ev.star = star ? star[0] : null;
    return ev;
  });
}

// Server half of the astrology layer: the NOAA aurora forecast. Planet sub-points are
// computed live in the browser and merged in there.
async function aurora() {
  const kp = await predictedKp();
  if (kp === null) return [];
  const lat = 66.5 - kp * 2.5;
  return [{
    id: 'sky:aurora',
    type: 'astrology',
    title: `Aurora Forecast — Kp ${kp.toFixed(1)}`,
    location: `~${lat.toFixed(0)}° latitude`,
    lat, lng: 0,
    severity: kp >= 7 ? 5 : kp >= 5 ? 4 : kp >= 3 ? 3 : 2,
    age: 'NOAA Forecast',
    brief: `NOAA Kp index: ${kp.toFixed(1)}.\nAurora visible above ~${lat.toFixed(0)}° latitude.\n\nKp 0 = quiet · Kp 5+ = geomagnetic storm · Kp 9 = extreme.`,
    stats: [{ label: 'Kp Index', val: kp.toFixed(1) }, { label: 'Visible above', val: lat.toFixed(0) + '°' }],
    sources: [{ n: 'NOAA SWPC', age: 'Forecast', url: 'https://www.swpc.noaa.gov' }],
    tags: ['Aurora', 'NOAA', 'Space Weather'],
    body: { emoji: '🌌', name: 'Aurora' },
    live: true
  }];
}

// cities: [{name, lat, lng}] — pinned to the city rather than whatever the headline mentions.
export async function localNews(cities) {
  const perCity = Math.max(8, Math.ceil(25 / cities.length));
  const settled = await Promise.allSettled(cities.map(async city => {
    const results = await guardianSearch({ q: `"${city.name}"`, pageSize: perCity });
    return results.map((a, i) => toEvent(a, 'nyc', i, { lat: city.lat, lng: city.lng, label: city.name }));
  }));
  if (settled.every(r => r.status === 'rejected')) throw settled[0].reason;
  return dedupeByTitle(settled.flatMap(r => r.status === 'fulfilled' ? r.value : [])).slice(0, 25);
}

export const DEFAULT_CITY = { name: 'New York City', lat: 40.7128, lng: -74.006 };

export const FEEDS = {
  news:     { cache: HOUR, load: guardian('news', {}, 25) },
  nyc:      { cache: HOUR, load: () => localNews([DEFAULT_CITY]) },
  world:    { cache: HOUR, load: guardian('world', { section: 'world|global-development' }, 50) },
  usnews:   { cache: HOUR, load: guardian('usnews', { section: 'us-news' }, 35) },
  money:    { cache: HOUR, load: guardian('money', { section: 'business|money' }, 35) },
  science:  { cache: HOUR, load: guardian('science', { section: 'science|environment' }, 30) },
  fashion:  { cache: HOUR, load: guardian('fashion', { section: 'fashion' }, 35) },
  culture:  { cache: HOUR, load: guardian('culture', { section: 'culture|books|film|music|stage|artanddesign' }, 30) },
  party:    { cache: HOUR, load: guardianMulti('party', [
    { section: 'food', pageSize: 12 },
    { section: 'lifeandstyle|travel', q: 'nightlife OR restaurant OR cocktail OR bar OR club OR dining OR hotel OR resort OR festival OR venue', pageSize: 20 }
  ], 30) },
  fraud:    { cache: HOUR, load: guardian('fraud', {
    section: 'business|world|money|us-news',
    q: 'fraud OR scam OR corruption OR embezzlement OR bribery OR "ponzi scheme" OR "insider trading" OR indictment OR cult'
  }, 30) },
  conflict: { cache: HOUR, load: guardian('conflict', { section: 'world', q: 'conflict OR war OR attack OR military' }, 10), seeds: SEEDS.conflict, mergeSeeds: true },
  storm:    { cache: HOUR, load: guardian('storm', { section: 'world|environment|us-news', q: 'hurricane OR cyclone OR typhoon OR storm OR tornado' }, 10) },
  astronomy:{ cache: HOUR, load: astronomyNews },
  astrology:{ cache: 30 * 60, load: aurora },
  tech:     { cache: 15 * 60, load: () => frontPage(15) },
  disaster: { cache: 10 * 60, load: () => earthquakes({ limit: 30 }) },
  launch:   { cache: HOUR, load: () => upcomingLaunches(6), seeds: FALLBACK_LAUNCHES },
  // No free live humanitarian source yet — curated seeds, labelled as such.
  humanitarian: { cache: 24 * HOUR, static: SEEDS.humanitarian },
  connection:   { cache: 24 * HOUR, static: [...CHOKEPOINTS, ...ECONOMIC_STRESS, ...POLITICAL_FLASH] }
};

export async function buildFeed(id, load) {
  const feed = FEEDS[id];
  if (feed.static) return { vertical: id, status: 'static', events: feed.static.map(normalizeStatic) };
  const seeds = (feed.seeds || []).map(normalizeStatic);
  try {
    const events = await (load || feed.load)();
    if (!events.length && seeds.length) return { vertical: id, status: 'fallback', events: seeds, error: 'no results' };
    return { vertical: id, status: 'live', events: feed.mergeSeeds ? dedupeByTitle(events.concat(seeds)) : events };
  } catch (e) {
    console.error(`[feed:${id}]`, e.message);
    return { vertical: id, status: 'fallback', events: seeds, error: e.message };
  }
}
