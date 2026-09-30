// Personal Anchor (Pro): pin a place + optional moment; the globe threads every event back
// to it and, if a date is set, overlays that month's historical events.
import { state, update, isPro } from '../core/store.js';
import { byId, actions, show } from '../core/dom.js';
import { geocode, getHistory } from '../services/api.js';
import * as account from '../services/account.js';

let resolved = null; // {lat, lng, display} from the last lookup

async function activate(anchor) {
  let anchorEvents = [];
  if (anchor && anchor.date) {
    const [year, month] = anchor.date.split('-').map(Number);
    try {
      const { events } = await getHistory(year, month);
      anchorEvents = events.map(e => ({ ...e, id: 'anc_' + e.id }));
    } catch { /* overlay is optional */ }
  }
  update({ anchor, anchorEvents });
}

export async function loadAnchorFor(userId) {
  const anchor = await account.loadAnchor(userId);
  await activate(anchor);
}

export function renderAnchorButton() {
  const signedIn = !!state.user;
  show('anchor-btn', signedIn);
  show('anchor-sep', signedIn);
  const btn = byId('anchor-btn');
  btn.classList.toggle('active', !!state.anchor);
  btn.textContent = state.anchor ? '⊕ ANCHORED' : '⊕ ANCHOR';
}

function openModal() {
  byId('anc-err').textContent = '';
  show('anc-form', isPro());
  show('anc-upsell', !isPro());
  if (isPro()) {
    const a = state.anchor;
    byId('anc-title').value = a ? a.title || '' : '';
    byId('anc-city').value = a ? a.place || '' : byId('anc-city').value;
    byId('anc-date').value = a ? a.date || '' : '';
    byId('anc-time').value = a ? a.time || '' : '';
    if (a && !resolved) resolved = { lat: a.lat, lng: a.lng, display: a.place };
    byId('anc-resolved').textContent = resolved ? '✓ ' + resolved.display : '';
  }
  byId('anchor-modal').classList.add('open');
}

const closeModal = () => byId('anchor-modal').classList.remove('open');

export function initAnchor() {
  actions({
    openAnchor: openModal,
    closeAnchor: closeModal,
    async lookupAnchor() {
      const input = byId('anc-city').value.trim();
      if (!input) return;
      const btn = byId('anc-lookup');
      const err = byId('anc-err');
      btn.disabled = true;
      btn.textContent = '…';
      byId('anc-resolved').textContent = '';
      err.textContent = '';
      try {
        resolved = await geocode(input);
        if (resolved) byId('anc-resolved').textContent = '✓ ' + resolved.display;
        else err.textContent = 'Location not found. Try a city name or country.';
      } catch {
        resolved = null;
        err.textContent = 'Lookup failed. Check your connection.';
      }
      btn.disabled = false;
      btn.textContent = 'LOOK UP';
    },
    async submitAnchor() {
      const btn = byId('anc-save');
      const err = byId('anc-err');
      const title = byId('anc-title').value.trim();
      if (!title) { err.textContent = 'Enter a name for this anchor.'; return; }
      if (!resolved) { err.textContent = 'Look up a location first.'; return; }
      const anchor = {
        title,
        place: byId('anc-city').value.trim(),
        lat: resolved.lat,
        lng: resolved.lng,
        date: byId('anc-date').value || null,
        time: byId('anc-time').value || null
      };
      btn.disabled = true;
      err.textContent = '';
      try {
        await account.saveAnchor(state.user.id, anchor);
        await activate(anchor);
        closeModal();
      } catch {
        err.textContent = isPro() ? 'Save failed. Try again.' : 'Personal Anchor requires a Pro account.';
      }
      btn.disabled = false;
    },
    async clearAnchor() {
      if (state.user) await account.deleteAnchor(state.user.id);
      resolved = null;
      update({ anchor: null, anchorEvents: [] });
      closeModal();
    }
  });
}
