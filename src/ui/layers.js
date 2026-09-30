// Layer toggles (bottom-left). Clicking a content layer isolates it; clicking the isolated
// layer again turns everything back on. Flights and History are plain on/off toggles.
import { state, update, subscribe } from '../core/store.js';
import { byId, esc, actions } from '../core/dom.js';
import { countByType } from '../core/filters.js';
import { VERTICALS, EXTRA_LAYERS } from '../domain/verticals.js';
import { FLIGHT_ROUTES } from '../domain/flights.js';
import { localLabel } from './panel.js';

const ROWS = [...VERTICALS, ...EXTRA_LAYERS];
const TOGGLES = new Set(['flight', 'history']);
const CONTENT = ROWS.map(r => r.id).filter(id => !TOGGLES.has(id));

// 'live' → green, 'fallback'/'static' → amber, loading → dim
const STATUS_CLASS = { live: 'on', fallback: 'fb', static: 'fb' };

function render() {
  const counts = countByType();
  byId('lctrl-rows').innerHTML = ROWS.map(r => {
    const n = r.id === 'flight' ? FLIGHT_ROUTES.length : r.id === 'history' ? state.history.events.length : counts[r.id];
    const status = r.id === 'history' ? '' : r.id === 'flight' ? 'fb' : STATUS_CLASS[state.feedStatus[r.id]] || '';
    const label = r.id === 'nyc' ? localLabel() : r.layer;
    return `<div class="lc-row${state.layerVis[r.id] ? '' : ' off'}" data-action="toggleLayer" data-arg="${r.id}">` +
      `<div class="lc-dot" style="background:${r.color}"></div><span>${esc(label)}</span>` +
      `<div class="lc-live ${status}"></div><span class="lc-n">${n || '–'}</span></div>`;
  }).join('');
}

export function initLayers() {
  let open = true;
  actions({
    toggleLayer(id) {
      const vis = { ...state.layerVis };
      if (TOGGLES.has(id)) {
        vis[id] = !vis[id];
      } else {
        const isolated = vis[id] && CONTENT.filter(k => vis[k]).length === 1;
        for (const k of CONTENT) vis[k] = isolated || k === id;
      }
      update({ layerVis: vis });
    },
    toggleLayersPanel() {
      open = !open;
      byId('lctrl-rows').classList.toggle('hidden', !open);
      byId('lc-chevron').classList.toggle('closed', !open);
    }
  });
  subscribe(['feeds', 'feedStatus', 'layerVis', 'history', 'cities'], render);
  render();
}
