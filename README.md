# ATLAS — Global Intelligence Feed

A 3D globe of live world events — news, conflicts, earthquakes, launches, markets, sky
positions — with history, connection analysis, personal anchors and shareable strings.

## Architecture

```
index.html            page shell (markup only)
src/                  browser — native ES modules, no build step
  main.js             boots the app, wires state → UI
  config.js           public Supabase URL + anon key
  core/               store (state + subscriptions), DOM/action helpers, filters, time
  domain/             pure data + math, shared with the server
                      (verticals, astronomy, geography, sky catalog, flight routes)
  services/           api.js (the only client of /api), account.js (Supabase), feeds.js
  ui/                 one module per piece of UI (globe, sky, panel, detail, connect, …)
  styles.css
api/                  Vercel functions — thin HTTP handlers
  feed/[vertical].js  GET /api/feed/:vertical   normalized events for one feed
  health.js           GET /api/health           one probe per upstream → per-vertical status
  markets.js          GET /api/markets          crypto + FX quotes
  history.js          GET /api/history          Wikipedia events for a month
  connect.js          GET /api/connect          connection engines (Guardian, Wiki, Wikidata, Backlinks)
  geocode.js          GET /api/geocode          Nominatim, with the User-Agent it requires
server/               backend logic used by api/
  feeds.js            feed registry: sources, cache lifetimes, fallbacks
  providers/          one adapter per upstream (Guardian, USGS, HN, Launch Library, NOAA, …)
  http.js             fetch with timeout/retry, CDN cache headers, error logging
  static-events.js    curated structural events + fallback seeds
supabase/migrations/  database schema + RLS
test/                 `npm test` (offline — upstreams are stubbed)
```

**Rules of the road**

- The browser never calls a third-party API. Everything goes through `/api`, where keys stay
  secret, responses are CDN-cached, and failures show up in Vercel's logs.
- Every feed returns `{ vertical, status: 'live' | 'fallback' | 'static', events }`, so the UI
  always knows whether it's showing live data.
- Paid features are enforced by Supabase RLS (`get_user_tier()`), not by the browser.
- Events carry a timestamp (`ts`) and the browser computes "5m ago", so cached feeds never
  show frozen ages.

## Develop

```bash
cp .env.example .env.local   # add GUARDIAN_API_KEY
npm run dev                  # http://localhost:3000 — same routing as Vercel
npm test
```

Restart `npm run dev` after editing files under `server/` (Node caches imported modules).

## Environment

| Variable | Where | Purpose |
|---|---|---|
| `GUARDIAN_API_KEY` | Vercel (Production + Preview) | All Guardian-backed feeds. A free developer key allows ~500 calls/day; feeds are cached for an hour to stay under it. |

## Guardian quota

13 verticals use the Guardian. With hour-long CDN caching that's roughly 13 × 24 ≈ 312 calls a
day plus local-news cities, which fits a free developer key for low traffic. For fresher news
or more traffic, apply for a production key and lower the `cache` values in `server/feeds.js`.
