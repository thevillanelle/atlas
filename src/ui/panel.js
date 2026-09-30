// Left panel: tabs, event list, search, watchlist, hide/show and collapse.
import { state, update, subscribe, allEvents, writeLocal } from '../core/store.js';
import { byId, esc, safeUrl, actions, $$ } from '../core/dom.js';
import { eventAge } from '../core/time.js';
import { listEvents, countByType } from '../core/filters.js';
import { VERTICALS, COLORS, ICONS } from '../domain/verticals.js';
import { FLIGHT_ROUTES } from '../domain/flights.js';
import { renderNatal } from './natal.js';
import { flyTo } from './globe.js';

const TABS = [...VERTICALS.map(v => [v.id, v.tab]), ['connection', 'Connections'], ['watchlist', 'Watchlist'], ['all', 'All']];

export const localLabel = () => (state.cities.length === 1 ? state.cities[0].name : 'Local');

function renderTabs() {
  byId('tabs').innerHTML = TABS.map(([id, label]) =>
    `<div class="tab${state.tab === id ? ' on' : ''}" data-action="setTab" data-arg="${id}">${esc(id === 'nyc' ? localLabel() : label)}</div>`
  ).join('');
}

function renderSummary() {
  const counts = countByType();
  const total = allEvents().length;
  byId('t-summary').textContent =
    `${total} events · ${counts.conflict || 0} conflicts · ${counts.disaster || 0} disasters · ${FLIGHT_ROUTES.length} flights`;
}

export function renderList() {
  renderSummary();
  const list = byId('evlist');
  if (state.feedHidden) { list.innerHTML = ''; return; }
  const evs = listEvents();
  byId('ph-count').textContent = evs.length + ' events';

  if (state.tab === 'astrology' && !state.history.open) return renderNatal(list);
  if (!evs.length) {
    list.innerHTML = `<div class="ev-empty">${state.history.open ? 'Pick a month and year, then GO' : 'No events match your filters'}</div>`;
    return;
  }
  list.innerHTML = evs.map(ev => {
    const c = COLORS[ev.type] || '#fff';
    const href = safeUrl(ev.url);
    const title = href ? `<a href="${esc(href)}" target="_blank" rel="noopener">${esc(ev.title)}</a>` : esc(ev.title);
    const cls = 'ev' + (ev.id === state.selectedId ? ' sel' : '') + (state.connect.ids.includes(ev.id) ? ' csel' : '');
    return `<div class="${cls}" data-action="selectEvent" data-arg="${esc(ev.id)}">` +
      `<div class="ev-row"><div class="ev-ico">${ICONS[ev.type] || '●'}</div><div class="ev-body">` +
      `<div class="ev-name">${title}</div>` +
      `<div class="ev-foot"><span class="ev-tag" style="background:${c}1a;color:${c}">${esc(ev.type.toUpperCase())}</span>` +
      `<span class="ev-loc">${esc(ev.location)}</span><span class="ev-age">${esc(eventAge(ev))}</span></div></div></div></div>`;
  }).join('');
}

export function syncListSelection() {
  $$('.ev').forEach(el => {
    el.classList.toggle('csel', state.connect.ids.includes(el.dataset.arg));
    el.classList.toggle('sel', el.dataset.arg === state.selectedId);
  });
}

function renderWatchlist() {
  byId('wl-tags').innerHTML = state.watchTags.map(t => {
    const on = state.tab === 'watchlist' && state.search === t;
    return `<div class="wl-tag${on ? ' on' : ''}" data-action="watchFilter" data-arg="${esc(t)}">${esc(t)}<span class="wl-tag-x" data-action="removeWatchTag" data-arg="${esc(t)}">×</span></div>`;
  }).join('');
}

function setWatchTags(tags) {
  writeLocal('atlas_watchlist', tags);
  const leaving = state.tab === 'watchlist' && state.search && !tags.includes(state.search);
  update({ watchTags: tags, ...(leaving ? { tab: 'all', search: '' } : {}) });
}

export function setTab(id) {
  byId('sinput').value = '';
  update({ tab: id, search: '' });
  if (id === 'astrology' || id === 'astronomy') flyTo({ altitude: 2.8 });
}

export function applyPanelOpen() {
  byId('panel').classList.toggle('hidden', !state.panelOpen);
  const t = byId('ptoggle');
  t.innerHTML = state.panelOpen ? '&#8249;' : '&#8250;';
  t.classList.toggle('closed', !state.panelOpen);
  t.style.left = state.panelOpen ? '300px' : '0';
}

export function initPanel() {
  actions({
    setTab,
    search(_, el) {
      update({ search: el.value.trim() });
    },
    watchFilter(tag) {
      const active = state.tab === 'watchlist' && state.search === tag;
      byId('sinput').value = '';
      update(active ? { tab: 'all', search: '' } : { tab: 'watchlist', search: tag });
    },
    removeWatchTag(tag, _el, e) {
      e.stopPropagation();
      setWatchTags(state.watchTags.filter(t => t !== tag));
    },
    addWatchTag() {
      const t = (prompt('Add topic to watchlist:') || '').trim();
      if (t && !state.watchTags.includes(t)) setWatchTags([...state.watchTags, t]);
    },
    clearWatchlist() {
      setWatchTags([]);
      if (state.tab === 'watchlist') update({ tab: 'all', search: '' });
    },
    toggleFeedHidden() {
      update({ feedHidden: !state.feedHidden });
      byId('ph-hide').textContent = state.feedHidden ? 'SHOW' : 'HIDE';
    },
    togglePanel() {
      update({ panelOpen: !state.panelOpen });
      applyPanelOpen();
    }
  });

  subscribe(['tab', 'cities'], renderTabs);
  subscribe(['feeds', 'skyEvents', 'tab', 'search', 'feedHidden', 'history', 'connect', 'tier', 'natal', 'layerVis'], renderList);
  subscribe(['watchTags', 'tab', 'search'], renderWatchlist);
  subscribe(['selectedId'], syncListSelection);
  renderTabs();
  renderWatchlist();
  applyPanelOpen();
}
