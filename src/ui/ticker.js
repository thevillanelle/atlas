// Bottom ticker. Markets for everyone; Pro/Team can add headline, science, seismic and
// space feeds (built from feeds already loaded — no extra upstream calls).
import { state, update, subscribe, isPro, writeLocal } from '../core/store.js';
import { byId, esc, actions } from '../core/dom.js';
import { getMarkets } from '../services/api.js';

const FEEDS = [
  { id: 'markets', label: 'Markets', desc: 'Crypto & forex' },
  { id: 'news', label: 'Headlines', desc: 'Breaking news from the Guardian' },
  { id: 'science', label: 'Science', desc: 'Science & environment news' },
  { id: 'quakes', label: 'Seismic', desc: 'M5+ earthquakes worldwide' },
  { id: 'space', label: 'Space', desc: 'Launches & astronomy events' }
];

let markets = [];
const short = (s, n) => s.replace(/\s*\|.*$/, '').slice(0, n);

function items() {
  const active = isPro() ? state.tickerFeeds : ['markets'];
  const out = [];
  for (const id of active) {
    if (id === 'markets') out.push(...markets);
    if (id === 'news') out.push(...(state.feeds.news || []).slice(0, 12).map(e => ({ sym: 'NEWS', px: short(e.title, 42) })));
    if (id === 'science') out.push(...(state.feeds.science || []).slice(0, 10).map(e => ({ sym: 'SCI', px: short(e.title, 42) })));
    if (id === 'quakes') out.push(...(state.feeds.disaster || []).slice(0, 10).map(e => ({ sym: e.title.split(' ')[0], px: e.location.replace(/^\d+ km \w+ of /, '').slice(0, 28), up: false })));
    if (id === 'space') out.push(...[...(state.feeds.launch || []), ...(state.feeds.astronomy || [])].slice(0, 8).map(e => ({ sym: e.type === 'launch' ? 'LAUNCH' : 'SPACE', px: short(e.title, 40) })));
  }
  return out.length ? out : [{ sym: '—', px: 'No feeds active' }];
}

function render() {
  const list = items();
  // Doubled so the CSS marquee loops seamlessly.
  byId('tk-inner').innerHTML = list.concat(list).map(d =>
    `<div class="tk-item"><span class="tk-sym">${esc(d.sym)}</span><span class="tk-px">${esc(d.px)}</span>` +
    (d.chg ? `<span class="${d.up ? 'tk-up' : 'tk-dn'}">${esc(d.chg)}</span>` : '') + '</div><span class="tk-div">|</span>'
  ).join('');
  const active = isPro() ? state.tickerFeeds : ['markets'];
  byId('tk-label-text').textContent = active.map(id => (FEEDS.find(f => f.id === id) || {}).label || id).join(' · ');
  byId('tk-gear').style.display = isPro() ? 'block' : 'none';
}

function renderSettings() {
  byId('ticker-settings').innerHTML = '<div class="tk-set-title">Customize Ticker</div>' + FEEDS.map(f => {
    const on = state.tickerFeeds.includes(f.id);
    return `<div class="tk-feed-opt" data-action="toggleTickerFeed" data-arg="${f.id}"><div class="tk-feed-check${on ? ' on' : ''}">${on ? '✓' : ''}</div>` +
      `<div class="tk-feed-info"><div class="tk-feed-name">${f.label}</div><div class="tk-feed-desc">${f.desc}</div></div></div>`;
  }).join('');
}

export async function refreshMarkets() {
  try {
    markets = (await getMarkets()).items.map(q => ({ ...q, up: q.up !== false }));
  } catch (e) {
    console.warn('[markets]', e.message);
  }
  render();
}

export function initTicker() {
  actions({
    toggleTickerSettings() {
      const el = byId('ticker-settings');
      if (el.classList.toggle('open')) renderSettings();
    },
    toggleTickerFeed(id) {
      const feeds = state.tickerFeeds.includes(id)
        ? (state.tickerFeeds.length > 1 ? state.tickerFeeds.filter(f => f !== id) : state.tickerFeeds)
        : [...state.tickerFeeds, id];
      writeLocal('atlas_ticker_feeds', feeds);
      update({ tickerFeeds: feeds });
      renderSettings();
    }
  });
  document.addEventListener('click', e => {
    const el = byId('ticker-settings');
    if (el.classList.contains('open') && !el.contains(e.target) && !byId('tk-gear').contains(e.target)) el.classList.remove('open');
  });
  subscribe(['tickerFeeds', 'tier', 'feeds'], render);
  render();
  refreshMarkets();
  setInterval(refreshMarkets, 60 * 1000);
}
