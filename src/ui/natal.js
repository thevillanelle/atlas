// Astrology tab: Pro natal chart (Sun/Moon/Rising + planets + Pluto generation).
// Birth details stay in this browser only (localStorage), never sent to the server.
import { state, update, isPro, writeLocal } from '../core/store.js';
import { byId, esc, actions } from '../core/dom.js';
import { computeNatalChart, signFromLon } from '../domain/astro.js';
import { PLUTO_GENS, PLANET_GLYPHS } from '../domain/sky-catalog.js';
import { geocode } from '../services/api.js';

let pendingGeo = null;

function upsell() {
  return `<div class="natal-upsell"><div class="natal-upsell-icon">♇</div><div class="natal-upsell-title">Natal Chart</div>` +
    `<div class="natal-upsell-text">Enter your birthdate and time to unlock your full planetary placements — Sun, Moon, Rising, Mercury through Pluto — computed live from the same orbital mechanics powering the globe.</div>` +
    `<div class="natal-upsell-btn" data-action="authClick">${state.user ? 'Upgrade to Pro' : 'Sign in'}</div></div>`;
}

function form() {
  return `<div class="natal-form"><div class="natal-form-title">Your Natal Chart</div>` +
    `<div class="natal-form-sub">Enter your birth details. Time and place are optional but unlock your Moon sign accuracy and Rising sign.</div>` +
    `<div class="natal-field"><div class="natal-label">Birth Date *</div><input class="natal-input" type="date" id="natal-date" max="${new Date().toISOString().split('T')[0]}"></div>` +
    `<div class="natal-field"><div class="natal-label">Birth Time <span class="natal-opt">(optional — for Moon &amp; Rising)</span></div><input class="natal-input" type="time" id="natal-time"></div>` +
    `<div class="natal-field"><div class="natal-label">Birthplace <span class="natal-opt">(optional — for Rising sign)</span></div>` +
    `<div class="natal-geo-row"><input class="natal-input" type="text" id="natal-city" placeholder="City, Country" data-enter="natalFind">` +
    `<button class="natal-geo-btn" id="natal-city-btn" data-action="natalFind">FIND</button></div><div id="natal-city-result"></div></div>` +
    `<button class="natal-submit" data-action="natalSave">Generate Chart</button></div>`;
}

function bigThree(cls, glyph, label, placement, note) {
  return `<div class="natal-body ${cls}"><div class="natal-body-glyph">${glyph}</div><div class="natal-body-planet">${label}</div>` +
    `<div class="natal-body-sign">${placement.sign.glyph} ${placement.sign.name}</div>` +
    `<div class="natal-body-deg">${placement.degree}°${note ? ' · ' + note : ''}</div></div>`;
}

function chart(n) {
  const c = computeNatalChart(n.date, n.time, n.lat, n.lng);
  const sun = signFromLon(c.sunLon);
  const moon = signFromLon(c.moonLon);
  const asc = c.ascLon !== null ? signFromLon(c.ascLon) : null;
  const when = new Date(n.date + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) +
    (n.time ? ' · ' + n.time : '') + (n.place ? ' · ' + n.place : '');
  const planets = c.planets.map(p => {
    const s = signFromLon(p.lon);
    return `<div class="natal-prow"><div class="natal-prow-icon" style="color:${p.color}">${PLANET_GLYPHS[p.name] || '●'}</div>` +
      `<div class="natal-prow-info"><div class="natal-prow-name">${p.name}</div><div class="natal-prow-sign">${s.sign.glyph} ${s.sign.name}</div>` +
      `<div class="natal-prow-deg">${s.degree}°</div></div></div>`;
  }).join('');
  const plutoSign = signFromLon(c.planets.find(p => p.name === 'Pluto').lon).sign.name;
  const gen = PLUTO_GENS[plutoSign];
  const genBlock = gen
    ? `<div class="natal-pluto-gen"><div class="natal-pluto-gen-hdr"><div class="natal-pluto-gen-glyph">♇</div>` +
      `<div><div class="natal-pluto-gen-label">Pluto Generation · ${gen.years}</div><div class="natal-pluto-gen-sign">Pluto in ${plutoSign}</div></div></div>` +
      `<div class="natal-pluto-gen-text">${gen.text}</div></div>`
    : '';
  return `<div class="natal-wrap"><div class="natal-hdr"><div class="natal-hdr-info"><div class="natal-hdr-title">Natal Chart</div>` +
    `<div class="natal-hdr-date">${esc(when)}</div></div><div class="natal-edit" data-action="natalEdit">Edit</div></div>` +
    `<div class="natal-big-three">` +
    bigThree('sun', '☉', 'Sun', sun) +
    bigThree('moon', '☽', 'Moon', moon, c.hasTime ? null : 'approx') +
    (asc ? bigThree('rising', '↑', 'Rising', asc)
      : '<div class="natal-body rising no-time"><div class="natal-body-glyph" style="opacity:.4">↑</div><div class="natal-body-planet">Rising</div><div class="natal-body-sign" style="font-size:9px;color:var(--muted)">Add time &amp; place</div></div>') +
    `</div><div class="natal-section-label">Planetary Placements</div><div class="natal-planets">${planets}</div>${genBlock}</div>`;
}

export function renderNatal(list) {
  list.innerHTML = !isPro() ? upsell() : state.natal && state.natal.date ? chart(state.natal) : form();
}

export function initNatal() {
  actions({
    async natalFind() {
      const input = byId('natal-city').value.trim();
      if (!input) return;
      const btn = byId('natal-city-btn');
      const out = byId('natal-city-result');
      btn.disabled = true;
      btn.textContent = '…';
      out.className = '';
      out.textContent = '';
      try {
        pendingGeo = await geocode(input);
        out.className = pendingGeo ? 'natal-resolved' : 'natal-field-err';
        out.textContent = pendingGeo ? '✓ ' + pendingGeo.display : 'City not found.';
      } catch {
        pendingGeo = null;
        out.className = 'natal-field-err';
        out.textContent = 'Lookup failed.';
      }
      btn.disabled = false;
      btn.textContent = 'FIND';
    },
    natalSave() {
      const date = byId('natal-date').value;
      if (!date) return byId('natal-date').focus();
      const natal = {
        date,
        time: byId('natal-time').value || null,
        place: pendingGeo ? byId('natal-city').value.trim() : null,
        lat: pendingGeo ? pendingGeo.lat : null,
        lng: pendingGeo ? pendingGeo.lng : null
      };
      pendingGeo = null;
      writeLocal('atlas_natal', natal);
      update({ natal });
    },
    natalEdit() {
      writeLocal('atlas_natal', null);
      update({ natal: null });
    }
  });
}
