// Splash progress + the "What are you monitoring today?" landing grid with live status
// dots from /api/health.
import { state, update, subscribe } from '../core/store.js';
import { byId, esc, actions } from '../core/dom.js';
import { VERTICALS, EXPLORE_MODES } from '../domain/verticals.js';
import { getHealth } from '../services/api.js';
import { flyTo } from './globe.js';
import { toggleHistory } from './history.js';
import { setConnectMode } from './connect.js';
import { localLabel } from './panel.js';

export function splash(pct, msg) {
  byId('sfill').style.width = pct + '%';
  byId('smsg').textContent = msg;
}

export function hideSplash() {
  return new Promise(resolve => {
    setTimeout(() => {
      byId('splash').classList.add('out');
      setTimeout(() => { byId('splash').remove(); resolve(); }, 700);
    }, 400);
  });
}

const cell = (v, cls) =>
  `<div class="${cls}" data-action="selectMode" data-arg="${v.id}"><div class="ms-dot" id="msdot-${v.id}" style="background:${v.color};--dc:${v.color}"></div>` +
  (cls === 'ms-fn-cell' ? '<div>' : '') +
  `<div class="ms-cell-name">${esc(v.id === 'nyc' ? localLabel() : v.name)}</div>` +
  `<div class="ms-cell-desc">${esc(v.id === 'nyc' && state.cities.length ? state.cities.map(c => c.name).join(' · ') : v.desc)}</div>` +
  (cls === 'ms-fn-cell' ? '</div>' : '') + '</div>';

function renderGrid() {
  byId('ms-explore').innerHTML = EXPLORE_MODES.map(v => cell(v, 'ms-fn-cell')).join('');
  byId('ms-feeds').innerHTML = VERTICALS.map(v => cell(v, 'ms-feed-cell')).join('');
}

async function checkHealth() {
  try {
    const h = await getHealth();
    for (const [id, ok] of Object.entries(h.verticals)) {
      const dot = byId('msdot-' + id);
      if (dot && ok) dot.classList.add('live');
    }
    byId('ms-status-txt').textContent = `● ${h.up} / ${h.total} systems nominal`;
    if (!h.ok) console.warn('[health] degraded sources:', Object.entries(h.sources).filter(([, s]) => !s.ok).map(([n, s]) => `${n}: ${s.error}`).join('; '));
  } catch (e) {
    byId('ms-status-txt').textContent = '● Status unavailable';
  }
}

export function openLanding() {
  const ms = byId('mode-select');
  ms.scrollTop = 0;
  ms.classList.add('open');
}

function selectMode(mode) {
  try { sessionStorage.setItem('atlas_visited', '1'); } catch { /* private mode */ }
  const ms = byId('mode-select');
  if (ms.classList.contains('open')) {
    ms.classList.remove('open');
    ms.classList.add('out');
    setTimeout(() => ms.remove(), 500);
  }
  if (mode === 'history') return setTimeout(() => toggleHistory(true), 400);
  if (mode === 'connection') {
    update({ tab: 'all' });
    return setConnectMode(true);
  }
  update({ tab: mode === 'all' ? 'all' : mode });
  if (mode === 'astrology' || mode === 'astronomy') flyTo({ altitude: 2.8 }, 800);
}

export const hasVisited = () => {
  try { return !!sessionStorage.getItem('atlas_visited'); } catch { return false; }
};

export function initLanding() {
  actions({ selectMode });
  renderGrid();
  subscribe(['cities'], () => byId('ms-feeds') && renderGrid());
  checkHealth();
}
