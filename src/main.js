// ATLAS client entry point: wires state → UI modules and boots the app.
//
//   src/domain    pure data + math (shared with the server)
//   src/core      store, DOM/event helpers, filters
//   src/services  /api client, Supabase account access, feed loading
//   src/ui        one module per piece of the interface
import { state, update, subscribe } from './core/store.js';
import { byId, actions, installActions } from './core/dom.js';
import { saveTheme } from './services/account.js';
import { loadAllFeeds, startRefreshing } from './services/feeds.js';
import { initGlobe, refreshMarkers, refreshArcs, syncSelectedMarkers, applyTheme, refreshTerminator } from './ui/globe.js';
import { initSky } from './ui/sky.js';
import { openEvent, openPlanet, openStar, openConstellation, closeDetail } from './ui/detail.js';
import { initPanel } from './ui/panel.js';
import { initLayers } from './ui/layers.js';
import { initNatal } from './ui/natal.js';
import { initConnect, toggleConnected, openSharedString } from './ui/connect.js';
import { initHistory } from './ui/history.js';
import { initAnchor } from './ui/anchor.js';
import { initAccount } from './ui/account.js';
import { initTicker } from './ui/ticker.js';
import { initLanding, splash, hideSplash, openLanding, hasVisited } from './ui/landing.js';

function initTopbar() {
  const tick = () => { byId('t-clock').textContent = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC'; };
  tick();
  setInterval(tick, 1000);

  actions({
    setTheme(_, el) {
      update({ theme: parseInt(el.value, 10) });
      if (state.user) saveTheme(state.user.id, state.theme);
    },
    toggleMobNav: () => byId('mob-nav').classList.toggle('open'),
    // Mobile menu items proxy the desktop buttons, then close the menu. Stopping the
    // original click keeps outside-click handlers from immediately closing what opened.
    mob(name, _el, e) {
      e.stopImmediatePropagation();
      byId('mob-nav').classList.remove('open');
      const target = { toggleHistory: 'hist-btn', toggleConnect: 'connect-btn', authClick: 'auth-btn' }[name];
      if (target) byId(target).click();
    },
    selectEvent: id => (state.connect.on ? toggleConnected(id) : openEvent(id)),
    closeDetail
  });
  document.addEventListener('click', e => {
    const nav = byId('mob-nav');
    if (nav.classList.contains('open') && !nav.contains(e.target) && !byId('mob-menu-btn').contains(e.target)) nav.classList.remove('open');
  });
  subscribe(['theme'], () => {
    byId('theme-btn').value = state.theme;
    byId('mob-theme-sel').value = state.theme;
    applyTheme();
  });
}

async function boot() {
  installActions();
  splash(5, 'Initializing 3D globe…');
  initGlobe({
    onSelect: id => (state.connect.on ? toggleConnected(id) : openEvent(id)),
    onAnchor: () => byId('anchor-btn').click()
  });
  initSky({ onPlanet: openPlanet, onStar: openStar, onConstellation: openConstellation });
  initTopbar();
  initPanel();
  initLayers();
  initNatal();
  initConnect();
  initHistory();
  initAnchor();
  initTicker();
  initLanding();
  initAccount();

  // Globe layers follow state.
  subscribe(['feeds', 'skyEvents', 'tab', 'search', 'layerVis', 'feedHidden', 'history', 'anchor', 'anchorEvents', 'throughline'], () => { refreshMarkers(); refreshArcs(); });
  subscribe(['connect'], () => { syncSelectedMarkers(); refreshArcs(); });
  setInterval(refreshTerminator, 60 * 1000);

  splash(10, 'Connecting to live feeds…');
  await loadAllFeeds((fraction, id) => splash(10 + Math.round(fraction * 86), `Loaded ${id}…`));
  splash(100, 'Systems nominal');
  startRefreshing();
  await hideSplash();

  const slug = new URLSearchParams(location.search).get('s');
  if (slug && await openSharedString(slug)) return;
  if (hasVisited()) byId('mode-select').remove();
  else openLanding();
}

boot().catch(e => {
  console.error('ATLAS failed to start', e);
  splash(100, 'Something went wrong starting ATLAS — try reloading.');
});
