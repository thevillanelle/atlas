// History bar: pick a month/year, plot that month's Wikipedia events, and move the sky
// (planets, stars, orbits) to that date.
import { state, update, subscribe } from '../core/store.js';
import { byId, actions } from '../core/dom.js';
import { getHistory } from '../services/api.js';
import { recomputeOrbits } from './sky.js';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const setHistory = patch => update({ history: { ...state.history, ...patch } });
const status = msg => { byId('hb-status').textContent = msg; };

export function toggleHistory(force) {
  const open = force ?? !state.history.open;
  byId('hist-bar').classList.toggle('open', open);
  byId('hist-btn').classList.toggle('active', open);
  document.body.classList.toggle('hist-open', open);
  if (open) {
    setHistory({ open: true });
  } else {
    setHistory({ open: false, events: [], date: null });
    update({ layerVis: { ...state.layerVis, history: false } });
    status('');
    recomputeOrbits();
  }
}

export async function loadHistory() {
  const month = parseInt(byId('hb-month').value, 10);
  const year = parseInt(byId('hb-year').value, 10);
  const maxYear = new Date().getFullYear();
  if (!(year >= 100 && year <= maxYear)) { status(`Enter a year between 100 and ${maxYear}`); return; }
  const label = `${MONTHS[month - 1]} ${year}`;
  status(`Loading ${label}…`);
  byId('hb-go').disabled = true;
  try {
    const { events } = await getHistory(year, month);
    // Year 100–999 needs setFullYear: new Date(99, …) would mean 1999.
    const date = new Date(2000, month - 1, 15);
    date.setFullYear(year);
    setHistory({ events, date });
    update({ layerVis: { ...state.layerVis, history: true } });
    recomputeOrbits();
    status(`${label} — ${events.length} events · planets at ${label}`);
  } catch {
    status('Failed to load — try another date');
  }
  byId('hb-go').disabled = false;
}

export function initHistory() {
  byId('hb-month').innerHTML = MONTHS.map((m, i) => `<option value="${i + 1}"${i === 9 ? ' selected' : ''}>${m}</option>`).join('');
  byId('hb-year').max = new Date().getFullYear();
  actions({
    toggleHistory: () => toggleHistory(),
    loadHistory
  });
  subscribe(['history'], () => byId('hist-btn').classList.toggle('active', state.history.open));
}
