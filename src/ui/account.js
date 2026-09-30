// Account UI: sign in/up, user menu, profile, home cities, theme sync.
import { state, update, subscribe } from '../core/store.js';
import { byId, esc, safeUrl, actions } from '../core/dom.js';
import * as account from '../services/account.js';
import { geocode } from '../services/api.js';
import { loadAnchorFor, renderAnchorButton } from './anchor.js';
import { reloadLocalNews } from '../services/feeds.js';

let mode = 'signin';
let pendingCities = [];

// ---- auth modal ----
function setMode(next) {
  mode = next;
  const up = mode === 'signup';
  byId('auth-submit').textContent = up ? 'CREATE ACCOUNT' : 'SIGN IN';
  byId('auth-mode-label').textContent = up ? 'Create your account' : 'Sign in to your account';
  byId('auth-toggle-link').innerHTML = up ? 'Already have an account? <span>Sign in</span>' : 'No account? <span>Create one</span>';
  byId('auth-password').autocomplete = up ? 'new-password' : 'current-password';
  byId('auth-err').textContent = '';
}

async function submitAuth() {
  const email = byId('auth-email').value.trim();
  const password = byId('auth-password').value;
  const err = byId('auth-err');
  const btn = byId('auth-submit');
  err.style.color = '';
  if (!email || !password) { err.textContent = 'Email and password are required.'; return; }
  btn.disabled = true;
  err.textContent = '';
  const result = mode === 'signup' ? await account.signUp(email, password) : await account.signIn(email, password);
  btn.disabled = false;
  if (result.error) { err.textContent = result.error.message; return; }
  if (mode === 'signup' && result.data.user && !result.data.session) {
    err.style.color = '#34d399';
    err.textContent = 'Check your email to confirm your account.';
    return;
  }
  byId('auth-modal').classList.remove('open');
  byId('auth-email').value = '';
  byId('auth-password').value = '';
}

function renderAuthButton() {
  const user = state.user;
  const label = byId('auth-label');
  const avatar = byId('auth-avatar');
  if (user) {
    const name = account.displayName(user);
    const pic = safeUrl(account.avatarUrl(user));
    label.textContent = name.split(' ')[0].toUpperCase();
    avatar.style.display = pic ? 'block' : 'none';
    if (pic) avatar.src = pic;
    byId('aup-name').textContent = name;
    byId('aup-email').textContent = user.email;
    byId('auth-btn').style.borderColor = 'rgba(163,230,53,.4)';
    byId('mob-auth-item').textContent = name.split(' ')[0].toUpperCase();
  } else {
    label.textContent = 'SIGN IN';
    avatar.style.display = 'none';
    avatar.removeAttribute('src');
    byId('auth-btn').style.borderColor = '';
    byId('mob-auth-item').textContent = 'Sign In';
  }
}

// ---- profile ----
async function openProfile() {
  byId('auth-user-panel').classList.remove('open');
  const user = state.user;
  if (!user) return;
  const name = account.displayName(user);
  const pic = safeUrl(account.avatarUrl(user));
  byId('prof-name').textContent = name;
  byId('prof-email-txt').textContent = user.email;
  byId('prof-avatar-wrap').innerHTML = pic ? `<img src="${esc(pic)}" alt="">` : esc(name.charAt(0).toUpperCase());
  const tier = byId('prof-tier');
  tier.textContent = state.tier.toUpperCase();
  tier.className = 'prof-tier ' + state.tier;
  byId('prof-cities').innerHTML = state.cities.length
    ? state.cities.map(c => `<span class="prof-chip">${esc(c.name)}</span>`).join('')
    : '<span class="prof-empty">No cities set yet</span>';
  byId('prof-wl').innerHTML = state.watchTags.length
    ? state.watchTags.map(t => `<span class="prof-chip clickable" data-action="profileWatchTag" data-arg="${esc(t)}">${esc(t)}</span>`).join('')
    : '<span class="prof-empty">No tags being watched</span>';
  const a = state.anchor;
  if (a) {
    let when = '';
    if (a.date) {
      when = new Date(a.date + 'T12:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      if (a.time) when += ' · ' + a.time;
    }
    byId('prof-anchor-content').innerHTML =
      `<div class="prof-anchor-place">${esc(a.title || a.place)}</div><div class="prof-anchor-date">${esc(a.place)}${when ? ' · ' + esc(when) : ''}</div>`;
  } else {
    byId('prof-anchor-content').innerHTML = '<span class="prof-empty">No anchor set — available on Pro &amp; Team</span>';
  }
  byId('profile-modal').classList.add('open');

  const tl = byId('prof-throughlines');
  tl.innerHTML = '<span class="prof-empty">Loading…</span>';
  const rows = await account.listThroughlines(user.id);
  tl.innerHTML = rows.length
    ? '<div class="prof-tl-list">' + rows.map(r =>
        `<div class="prof-tl-row"><span class="prof-tl-title">${esc(r.title)}</span><span class="prof-tl-meta">${r.event_count} events</span>` +
        `<a class="prof-tl-link" href="${esc(account.stringLink(r.slug))}" target="_blank" rel="noopener">SHARE →</a></div>`).join('') + '</div>'
    : '<span class="prof-empty">No throughlines saved yet — connect events and save them as a String</span>';
}

const closeProfile = () => byId('profile-modal').classList.remove('open');

// ---- cities ----
function renderCityList() {
  byId('cities-list').innerHTML = pendingCities.length
    ? pendingCities.map((c, i) => `<div class="city-row"><span class="city-row-name">${esc(c.name)}</span><button class="city-row-del" data-action="removeCity" data-arg="${i}">×</button></div>`).join('')
    : '<div style="font-size:10px;color:var(--muted);padding:6px">No cities added yet.</div>';
}

function openCities() {
  closeProfile();
  byId('auth-user-panel').classList.remove('open');
  pendingCities = state.cities.slice();
  byId('city-input').value = '';
  byId('city-resolved').textContent = '';
  byId('city-err').textContent = '';
  renderCityList();
  byId('cities-modal').classList.add('open');
}

async function addCity() {
  const input = byId('city-input').value.trim();
  if (!input) return;
  const btn = byId('city-lookup');
  const err = byId('city-err');
  btn.disabled = true;
  btn.textContent = '…';
  err.textContent = '';
  try {
    const geo = await geocode(input);
    if (!geo) err.textContent = 'City not found. Try a different spelling.';
    else if (pendingCities.length >= 5) err.textContent = 'Up to 5 cities.';
    else {
      pendingCities.push({ name: geo.display.split(',')[0].trim(), lat: geo.lat, lng: geo.lng });
      byId('city-input').value = '';
      renderCityList();
    }
  } catch {
    err.textContent = 'Lookup failed. Try again.';
  }
  btn.disabled = false;
  btn.textContent = '+ ADD';
}

async function saveCities() {
  if (!pendingCities.length) { byId('city-err').textContent = 'Add at least one city.'; return; }
  update({ cities: pendingCities.slice() });
  byId('cities-modal').classList.remove('open');
  if (state.user) account.saveCities(state.user.id, state.cities);
  reloadLocalNews();
}

// ---- session ----
async function onUser(user) {
  update({ user, tier: 'free', ...(user ? {} : { anchor: null, anchorEvents: [] }) });
  renderAuthButton();
  renderAnchorButton();
  if (!user) {
    byId('ticker-settings').classList.remove('open');
    return;
  }
  const [tier, prefs] = await Promise.all([account.fetchTier(user.id), account.loadPrefs(user.id)]);
  update({ tier, ...(prefs.theme !== undefined ? { theme: prefs.theme } : {}) });
  if (prefs.cities) {
    update({ cities: prefs.cities });
    reloadLocalNews();
  }
  await loadAnchorFor(user.id);
}

export function initAccount() {
  actions({
    authClick() {
      if (state.user) byId('auth-user-panel').classList.toggle('open');
      else byId('auth-modal').classList.add('open');
    },
    closeAuth: () => byId('auth-modal').classList.remove('open'),
    authSubmit: submitAuth,
    authToggleMode: () => setMode(mode === 'signin' ? 'signup' : 'signin'),
    signOut() {
      byId('auth-user-panel').classList.remove('open');
      closeProfile();
      account.signOut();
    },
    openProfile,
    closeProfile,
    profileWatchlist() {
      closeProfile();
      update({ tab: 'watchlist', search: '' });
    },
    profileWatchTag(tag) {
      closeProfile();
      update({ tab: 'watchlist', search: tag });
    },
    openCities,
    closeCities: () => byId('cities-modal').classList.remove('open'),
    addCity,
    removeCity(i) {
      pendingCities.splice(Number(i), 1);
      renderCityList();
    },
    saveCities
  });

  // Close the user menu on outside click.
  document.addEventListener('click', e => {
    const panel = byId('auth-user-panel');
    if (panel.classList.contains('open') && !panel.contains(e.target) && !byId('auth-btn').contains(e.target)) panel.classList.remove('open');
  });

  subscribe(['anchor', 'user'], renderAnchorButton);
  account.onAuthChange(onUser);
}
