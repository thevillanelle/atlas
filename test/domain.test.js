import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sunSubpoint, computeNatalChart, signFromLon, nightPolygon, planetGeogLatLng, PLANET_DEFS, daysSinceJ2000 } from '../src/domain/astro.js';
import { findPlace, dedupeByTitle } from '../src/domain/geo.js';
import { VERTICALS, COLORS, FEED_IDS } from '../src/domain/verticals.js';
import { FEEDS } from '../server/feeds.js';

test('sun sub-point tracks the seasons', () => {
  const june = sunSubpoint(new Date('2026-06-21T12:00:00Z'));
  const dec = sunSubpoint(new Date('2026-12-21T12:00:00Z'));
  assert.ok(Math.abs(june.lat - 23.44) < 0.1, `June solstice lat ${june.lat}`);
  assert.ok(Math.abs(dec.lat + 23.44) < 0.1, `December solstice lat ${dec.lat}`);
  // Solar noon at Greenwich → sun roughly over the prime meridian (± equation of time).
  assert.ok(Math.abs(june.lng) < 3, `June noon lng ${june.lng}`);
});

test('natal chart: known sun signs', () => {
  assert.equal(signFromLon(computeNatalChart('1990-07-15').sunLon).sign.name, 'Cancer');
  assert.equal(signFromLon(computeNatalChart('2000-01-01').sunLon).sign.name, 'Capricorn');
  const full = computeNatalChart('1990-07-15', '14:30', 40.71, -74.0);
  assert.equal(full.hasTime && full.hasPlace, true);
  assert.notEqual(full.ascLon, null);
  assert.equal(computeNatalChart('1990-07-15').ascLon, null);
});

test('planet positions are finite and geocentric', () => {
  const d = daysSinceJ2000(new Date('2026-09-30T00:00:00Z'));
  for (const p of PLANET_DEFS) {
    const pos = planetGeogLatLng(p, d);
    assert.ok(Number.isFinite(pos.lat) && Number.isFinite(pos.lng) && pos.au > 0, p.name);
    assert.ok(Math.abs(pos.lat) <= 90 && Math.abs(pos.lng) <= 180, p.name);
  }
});

test('night polygon is a closed ring', () => {
  const ring = nightPolygon(new Date('2026-09-30T12:00:00Z'))[0].geo.coordinates[0];
  assert.deepEqual(ring[0], ring[ring.length - 1]);
  assert.ok(ring.length > 360);
});

test('findPlace prefers the longest match', () => {
  assert.equal(findPlace('Fighting spreads in South Sudan').name, 'South Sudan');
  assert.equal(findPlace('nothing to see here'), null);
});

test('dedupeByTitle ignores case and punctuation', () => {
  const out = dedupeByTitle([{ title: 'Hello, World!' }, { title: 'hello world' }, { title: 'Other' }]);
  assert.equal(out.length, 2);
});

test('every vertical has a color and a server feed', () => {
  for (const v of VERTICALS) {
    assert.ok(COLORS[v.id], `color for ${v.id}`);
    assert.ok(FEEDS[v.id], `server feed for ${v.id}`);
  }
  assert.ok(FEEDS.connection);
  assert.equal(new Set(FEED_IDS).size, FEED_IDS.length);
});
