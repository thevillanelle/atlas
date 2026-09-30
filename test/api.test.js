// Handler tests run offline: upstream fetches are stubbed per test.
import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import feedHandler from '../api/feed/[vertical].js';
import connectHandler from '../api/connect.js';
import geocodeHandler from '../api/geocode.js';
import historyHandler from '../api/history.js';
import { buildFeed } from '../server/feeds.js';

const realFetch = globalThis.fetch;
let calls;

function stubFetch(routes) {
  calls = [];
  globalThis.fetch = async url => {
    calls.push(String(url));
    const hit = Object.entries(routes).find(([pattern]) => String(url).includes(pattern));
    if (!hit) return new Response('{}', { status: 404 });
    const [status, body] = typeof hit[1] === 'function' ? hit[1](url) : hit[1];
    return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
  };
}

async function call(handler, url, query = {}) {
  const res = {
    statusCode: 200, headers: {}, body: '',
    setHeader(k, v) { this.headers[k.toLowerCase()] = v; },
    end(b) { this.body = b; }
  };
  await handler({ url, query }, res);
  return { status: res.statusCode, cache: res.headers['cache-control'], json: JSON.parse(res.body) };
}

const guardianArticle = (id, title, section = 'world') => ({
  id, webTitle: title, sectionName: section, webUrl: `https://www.theguardian.com/${id}`,
  webPublicationDate: '2026-09-30T10:00:00Z', fields: { trailText: '<p>Trail</p>' }
});

beforeEach(() => { process.env.GUARDIAN_API_KEY = 'test-key'; });
afterEach(() => { globalThis.fetch = realFetch; delete process.env.GUARDIAN_API_KEY; });

test('feed: live Guardian vertical is normalized and CDN-cached', async () => {
  stubFetch({ 'content.guardianapis.com': [200, { response: { results: [guardianArticle('a/1', 'Protests in Kenya'), guardianArticle('a/2', 'Markets rally')] } }] });
  const r = await call(feedHandler, '/api/feed/world', { vertical: 'world' });
  assert.equal(r.status, 200);
  assert.equal(r.json.status, 'live');
  assert.equal(r.json.events[0].location, 'Kenya');
  assert.equal(r.json.events[0].brief, 'Trail');
  assert.equal(r.json.events[0].id, 'world:a/1');
  assert.match(r.cache, /s-maxage=3600/);
  assert.ok(calls[0].includes('api-key=test-key') && calls[0].includes('section=world%7Cglobal-development'));
});

test('feed: Guardian outage falls back to seeds with a short cache', async () => {
  stubFetch({ 'content.guardianapis.com': [500, {}] });
  const r = await call(feedHandler, '/api/feed/conflict', { vertical: 'conflict' });
  assert.equal(r.json.status, 'fallback');
  assert.ok(r.json.events.length >= 3, 'conflict seeds served');
  assert.equal(r.json.events[0].live, false);
  assert.match(r.cache, /s-maxage=60/);
});

test('feed: missing key is reported, not thrown', async () => {
  delete process.env.GUARDIAN_API_KEY;
  stubFetch({});
  const r = await call(feedHandler, '/api/feed/news', { vertical: 'news' });
  assert.equal(r.json.status, 'fallback');
  assert.match(r.json.error, /GUARDIAN_API_KEY/);
  assert.equal(calls.length, 0);
});

test('feed: local news pins to the requested cities', async () => {
  stubFetch({ 'content.guardianapis.com': [200, { response: { results: [guardianArticle('l/1', 'Council vote tonight')] } }] });
  const r = await call(feedHandler, '/api/feed/nyc?c=Lisbon|38.7|-9.1', { vertical: 'nyc' });
  assert.equal(r.json.events[0].location, 'Lisbon');
  assert.equal(r.json.events[0].lat, 38.7);
  assert.ok(calls[0].includes('q=%22Lisbon%22'));
});

test('feed: unknown vertical is a 400', async () => {
  const r = await call(feedHandler, '/api/feed/nope', { vertical: 'nope' });
  assert.equal(r.status, 400);
});

test('feed: static layers need no upstream', async () => {
  stubFetch({});
  const f = await buildFeed('connection');
  assert.equal(f.status, 'static');
  assert.ok(f.events.every(e => e.sources.every(s => 'age' in s)));
  assert.equal(calls.length, 0);
});

test('connect: validates engine and event count', async () => {
  assert.equal((await call(connectHandler, '/api/connect?engine=nope&e=a~b~c&e=d~e~f')).status, 400);
  assert.equal((await call(connectHandler, '/api/connect?engine=wiki&e=a~b~c')).status, 400);
});

test('geocode: requires q, 404s on no match', async () => {
  assert.equal((await call(geocodeHandler, '/api/geocode')).status, 400);
  stubFetch({ 'nominatim.openstreetmap.org': [200, []] });
  assert.equal((await call(geocodeHandler, '/api/geocode?q=zzzz')).status, 404);
});

test('history: rejects out-of-range dates', async () => {
  assert.equal((await call(historyHandler, '/api/history?year=3000&month=1')).status, 400);
  assert.equal((await call(historyHandler, '/api/history?year=1962&month=13')).status, 400);
});
