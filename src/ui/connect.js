// Connect mode: select events, run an analysis engine over them, save them as a shareable
// "string" (throughline), and view strings shared via /?s=<slug>.
import { state, update, subscribe, findEvent, isPro } from '../core/store.js';
import { byId, esc, safeUrl, actions, show } from '../core/dom.js';
import { COLORS } from '../domain/verticals.js';
import { runConnect } from '../services/api.js';
import * as account from '../services/account.js';
import { flyTo } from './globe.js';

const ENGINES = [
  { id: 'guardian', label: 'GUARDIAN', desc: 'News co-coverage' },
  { id: 'wiki', label: 'WIKI', desc: 'Encyclopedic categories' },
  { id: 'wikidata', label: 'WIKIDATA', desc: 'Entity relationships' },
  { id: 'backlinks', label: 'BACKLINKS', desc: 'Cross-references' }
];

const engineCache = new Map();

const selected = () => state.connect.ids.map(findEvent).filter(Boolean);
const setConnect = patch => update({ connect: { ...state.connect, ...patch } });

export function toggleConnected(id) {
  const ids = state.connect.ids.includes(id) ? state.connect.ids.filter(x => x !== id) : [...state.connect.ids, id];
  setConnect({ ids });
}

export function setConnectMode(on) {
  // Seed with the event that's open in the drawer so it doesn't need a second click.
  const ids = on && state.selectedId && !state.connect.ids.includes(state.selectedId) ? [...state.connect.ids, state.selectedId] : on ? state.connect.ids : [];
  setConnect({ on, ids });
}

function renderButton() {
  const btn = byId('connect-btn');
  btn.classList.toggle('active', state.connect.on);
  btn.textContent = state.connect.on ? '⟷ ON' : '⟷ CONNECT';
  byId('hb-connect-hint').style.display = state.connect.on && state.history.open ? 'inline' : 'none';
}

function renderPanel() {
  const panel = byId('ap');
  if (!state.connect.on) { panel.classList.remove('open'); return; }
  const evs = selected();
  const badges = evs.map(ev => {
    const c = COLORS[ev.type] || '#fff';
    return `<div class="ap-badge" style="background:${c}1a;border:1px solid ${c}40;color:${c}" data-action="toggleConnected" data-arg="${esc(ev.id)}">` +
      `${esc(ev.title.slice(0, 30))}${ev.title.length > 30 ? '…' : ''}<span class="ap-bx">✕</span></div>`;
  }).join('');
  const header = `<div class="ap-hdr"><span class="ap-title">⟷ CONNECT — ${evs.length} selected</span>` +
    (evs.length >= 2 ? '<span class="ap-save-str" data-action="openThroughline">⊛ SAVE STRING</span>' : '') +
    `<span class="ap-close" data-action="clearConnect">Clear all</span></div><div class="ap-sel">${badges}</div>`;

  if (evs.length < 2) {
    const more = 2 - evs.length;
    panel.innerHTML = header + `<div class="ap-prompt">Select ${more} more event${more !== 1 ? 's' : ''} to begin analysis</div>`;
  } else {
    panel.innerHTML = header +
      `<div class="ap-engines"><span class="ap-eng-lbl">Engine</span>` +
      ENGINES.map(e => `<button class="ap-eng${state.connect.engine === e.id ? ' on' : ''}" data-action="setEngine" data-arg="${e.id}" title="${e.desc}">${e.label}</button>`).join('') +
      `</div><div id="ap-analysis"></div>`;
    runEngine(evs);
  }
  panel.classList.add('open');
}

async function runEngine(evs) {
  const engine = state.connect.engine;
  const key = engine + ':' + evs.map(e => e.id).sort().join(',');
  const el = byId('ap-analysis');
  if (!engineCache.has(key)) {
    el.innerHTML = `<div class="ap-loading">⟳ QUERYING ${engine.toUpperCase()}…</div>`;
    engineCache.set(key, runConnect(engine, evs).catch(e => {
      engineCache.delete(key);
      return { threads: ['Query failed: ' + e.message], signals: [] };
    }));
  }
  const result = await engineCache.get(key);
  const target = byId('ap-analysis');
  if (target && state.connect.engine === engine) target.innerHTML = renderResult(result);
}

function renderResult(r) {
  let html = '<div class="ap-eng-result">';
  for (const t of r.threads || []) html += `<div class="ap-eng-thread">${esc(t)}</div>`;
  if ((r.signals || []).length) {
    html += '<div class="ap-eng-lbl-row">Signals</div><div class="ap-eng-signals">' +
      r.signals.slice(0, 12).map(s => `<span class="ap-eng-sig">${esc(s)}</span>`).join('') + '</div>';
  }
  if ((r.links || []).length) {
    html += '<div class="ap-eng-lbl-row">Sources</div><div class="ap-eng-signals">' +
      r.links.map(l => {
        const href = safeUrl(l.url);
        return href ? `<a class="ap-eng-source" href="${esc(href)}" target="_blank" rel="noopener">${esc(l.title.slice(0, 48))}</a>` : '';
      }).join('') + '</div>';
  }
  return html + '</div>';
}

// ---- strings (throughlines) ----
const TYPE_LABELS = {
  news: 'News', conflict: 'Conflict', disaster: 'Disaster', storm: 'Storm', humanitarian: 'Aid', tech: 'Tech',
  fashion: 'Fashion', astrology: 'Astrology', astronomy: 'Space', launch: 'Launch', connection: 'Chokepoint',
  history: 'History', money: 'Finance', world: 'World', nyc: 'Local', usnews: 'US News', science: 'Science',
  culture: 'Culture', party: 'Party', fraud: 'Fraud'
};
const autoTitle = evs => [...new Set(evs.map(e => TYPE_LABELS[e.type] || e.type))].join(' → ');

function openThroughlineModal() {
  byId('tl-err').textContent = '';
  show('tl-result', false);
  show('tl-form', isPro());
  show('tl-upsell', !isPro());
  if (isPro()) {
    const evs = selected();
    byId('tl-title').value = autoTitle(evs);
    byId('tl-preview').innerHTML = evs.map(e => {
      const c = COLORS[e.type] || '#fff';
      return `<div class="tl-prev-badge" style="background:${c}1a;border:1px solid ${c}40;color:${c}">${esc(e.title.slice(0, 22))}${e.title.length > 22 ? '…' : ''}</div>`;
    }).join('');
  }
  byId('throughline-modal').classList.add('open');
}

async function copy(text, btn, label) {
  try {
    await navigator.clipboard.writeText(text);
    btn.textContent = 'COPIED!';
  } catch {
    btn.textContent = 'COPY FAILED';
  }
  setTimeout(() => { btn.textContent = label; }, 1500);
}

export async function openSharedString(slug) {
  try {
    const row = await account.loadThroughline(slug);
    const events = row.events.map((e, i) => ({ ...e, id: `tl_${i}_${e.id}`, severity: 3, live: false, tags: [], sources: [] }));
    update({ throughline: { row, events } });
    byId('sc-title').textContent = row.title;
    byId('sc-events').innerHTML = row.events.map(e =>
      `<div class="sc-ev"><div class="sc-ev-dot" style="background:${COLORS[e.type] || '#fff'}"></div><div>${esc(e.title.slice(0, 58))}${e.title.length > 58 ? '…' : ''}</div></div>`
    ).join('');
    byId('string-card').classList.add('open');
    const pinned = events.filter(e => e.lat && e.lng);
    if (pinned.length) {
      flyTo({
        lat: pinned.reduce((a, e) => a + e.lat, 0) / pinned.length,
        lng: pinned.reduce((a, e) => a + e.lng, 0) / pinned.length,
        altitude: 2.5
      }, 1500);
    }
    return true;
  } catch (e) {
    console.warn('String load failed:', e);
    return false;
  }
}

export function initConnect() {
  actions({
    toggleConnect: () => setConnectMode(!state.connect.on),
    toggleConnected,
    clearConnect: () => setConnect({ ids: [] }),
    setEngine: id => setConnect({ engine: id }),
    openThroughline: openThroughlineModal,
    closeThroughline: () => byId('throughline-modal').classList.remove('open'),
    async saveThroughline() {
      const btn = byId('tl-save');
      const err = byId('tl-err');
      const title = byId('tl-title').value.trim();
      const evs = selected();
      if (!title) { err.textContent = 'Give your string a name.'; return; }
      if (evs.length < 2) { err.textContent = 'Connect at least 2 events first.'; return; }
      btn.disabled = true;
      err.textContent = '';
      try {
        const slug = await account.saveThroughline(state.user.id, title, evs);
        byId('tl-link').textContent = account.stringLink(slug);
        show('tl-form', false);
        show('tl-result', true);
      } catch {
        err.textContent = isPro() ? 'Save failed. Try again.' : 'Strings require a Pro account.';
      }
      btn.disabled = false;
    },
    copyThroughlineLink: (_, btn) => copy(byId('tl-link').textContent, btn, 'COPY LINK'),
    copyStringLink: (_, btn) => state.throughline && copy(account.stringLink(state.throughline.row.slug), btn, 'COPY LINK'),
    closeStringCard: () => byId('string-card').classList.remove('open'),
    clearStringView() {
      update({ throughline: null });
      byId('string-card').classList.remove('open');
      history.replaceState(null, '', location.pathname);
    }
  });

  let lastKey = '';
  subscribe(['connect', 'history'], () => {
    renderButton();
    // Only rebuild the analysis panel when the selection or engine actually changed.
    const key = `${state.connect.on}|${state.connect.ids.join(',')}|${state.connect.engine}`;
    if (key !== lastKey) { lastKey = key; renderPanel(); }
  });
}
