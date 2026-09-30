// Right-hand detail drawer for events, planets, stars and constellations.
import { update, findEvent, allEvents } from '../core/store.js';
import { byId, esc, safeUrl, $$ } from '../core/dom.js';
import { eventAge, sourceAge } from '../core/time.js';
import { COLORS, ICONS } from '../domain/verticals.js';
import { PLANET_DATA, CONSTELLATION_DATA } from '../domain/sky-catalog.js';
import { PLANET_DEFS } from '../domain/astro.js';
import { flyTo } from './globe.js';
import { starColor } from './sky.js';

const BOX = 'background:rgba(255,255,255,.04);border:1px solid var(--border);border-radius:6px;padding:8px 10px';
const MINI_LBL = 'font-size:8px;letter-spacing:1px;color:var(--muted);text-transform:uppercase;margin-bottom:2px';

function open(html) {
  byId('d-body').innerHTML = html;
  byId('detail').classList.add('open');
}

export function closeDetail() {
  byId('detail').classList.remove('open');
  update({ selectedId: null });
}

const nl2br = s => esc(s).replace(/\n/g, '<br>');

function linkButton(url, color = '96,165,250', label = 'READ FULL ARTICLE') {
  const href = safeUrl(url);
  return href
    ? `<a href="${esc(href)}" target="_blank" rel="noopener" style="display:flex;align-items:center;justify-content:center;gap:7px;margin:14px 0;padding:10px 16px;background:rgba(${color},.14);border:1px solid rgba(${color},.35);border-radius:8px;color:rgb(${color});font-size:12px;font-weight:700;letter-spacing:.5px;text-decoration:none">&#x2197; ${label}</a>`
    : '';
}

function sourcesHtml(ev, c) {
  const rows = (ev.sources || []).map(s => {
    const href = safeUrl(s.url);
    return `<div class="d-src"><div class="d-src-dot" style="background:${c}"></div><span class="d-src-name">${esc(s.n)}</span>` +
      (href ? `<a class="d-src-link" href="${esc(href)}" target="_blank" rel="noopener">&#x2197;</a>` : '') +
      `<span class="d-src-age">${esc(sourceAge(s))}</span></div>`;
  }).join('');
  return rows || '<div class="d-src" style="color:var(--muted)">No sources</div>';
}

const tagsHtml = ev => (ev.tags || []).map(t => `<span class="d-tag-pill">${esc(t)}</span>`).join('');
const statsHtml = (ev, c) => (ev.stats || []).length
  ? `<div class="d-stats">${ev.stats.map(s => `<div class="d-stat"><div class="d-stat-lbl">${esc(s.label)}</div><div class="d-stat-val" style="color:${c}">${esc(s.val)}</div></div>`).join('')}</div>`
  : '';
const liveBadge = ev => ev.live ? '<span class="ds-badge ds-live">LIVE</span>' : '<span class="ds-badge ds-fallback">CACHED</span>';
const footer = (ev, c) => `<div class="d-sep"></div><div class="d-lbl">Sources</div>${sourcesHtml(ev, c)}<div class="d-sep"></div><div class="d-lbl">Tags</div><div class="d-tags">${tagsHtml(ev)}</div>`;

export function openEvent(id) {
  const ev = findEvent(id);
  if (!ev) return;
  update({ selectedId: id });
  $$('.ev').forEach(el => el.classList.toggle('sel', el.dataset.arg === id));

  const skyBody = (ev.type === 'astronomy' || ev.type === 'astrology') && (ev.planet || ev.star || ev.body);
  // Sky-body events: pull way back so Earth reads as a disc in space, not a wall.
  flyTo(skyBody
    ? { lat: -ev.lat, lng: ev.lng + 180, altitude: 6.0 }
    : { lat: ev.lat, lng: ev.lng, altitude: ev.type === 'astronomy' || ev.type === 'astrology' ? 2.8 : 1.6 });

  const c = COLORS[ev.type] || '#fff';

  if (ev.type === 'astrology' && ev.body) {
    return open(
      `<div style="text-align:center;padding:10px 0 4px"><div style="font-size:36px;margin-bottom:6px">${esc(ev.body.emoji)}</div>` +
      `<div style="font-size:20px;font-weight:700;color:var(--col-astrology)">${esc(ev.body.name)}</div>` +
      `<div style="font-size:10px;color:var(--muted);margin-top:3px">${esc(ev.location)}</div>${liveBadge(ev)}</div>` +
      `<div class="d-sep"></div>${statsHtml(ev, c)}<div class="d-lbl">Current Position</div><div class="d-brief">${nl2br(ev.brief)}</div>` +
      footer(ev, c));
  }

  if (ev.type === 'astronomy') {
    const planet = ev.planet && PLANET_DEFS.find(p => p.name === ev.planet);
    const color = planet ? planet.color : '#38bdf8';
    const name = ev.planet || ev.star || 'Deep Space';
    const data = planet ? PLANET_DATA[planet.name] || {} : {};
    const about = planet
      ? `<div class="d-sep"></div><div class="d-lbl">About ${esc(planet.name)}</div>` +
        `<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:10px">` +
        `<div style="${BOX}"><div style="${MINI_LBL}">Distance</div><div style="font-size:13px;font-weight:700;color:${color}">${esc(data.dist || '—')}</div></div>` +
        `<div style="${BOX}"><div style="${MINI_LBL}">Period</div><div style="font-size:13px;font-weight:700;color:var(--text)">${esc(data.period || '—')}</div></div></div>` +
        `<div style="font-size:11px;line-height:1.6;color:rgba(216,221,232,.8);margin-bottom:10px">${esc(data.note || '')}</div>`
      : '';
    return open(
      `<div class="d-cat" style="color:#38bdf8">🔭 ASTRONOMY ${liveBadge(ev)}</div>` +
      `<div class="d-title" style="font-size:14px;line-height:1.5;margin-bottom:6px">${esc(ev.title)}</div>` +
      `<div style="display:inline-block;padding:3px 8px;border-radius:12px;background:${color}22;border:1px solid ${color}55;color:${color};font-size:10px;font-weight:700;letter-spacing:.5px;margin-bottom:4px">${esc(name)}</div> ` +
      `<span style="font-size:10px;color:var(--muted)">${esc(eventAge(ev))}</span>` +
      linkButton(ev.url, '56,189,248') +
      `<div class="d-lbl">Summary</div><div class="d-brief">${esc(ev.brief || ev.title)}</div>` + about + footer(ev, c));
  }

  const subtype = ev.subtype
    ? ` · <span style="font-size:8px;font-weight:700;letter-spacing:1px;padding:2px 5px;border-radius:3px;background:${c}1a;color:${c}">${esc(ev.subtype.toUpperCase())}</span>`
    : '';
  open(
    `<div class="d-cat" style="color:${c}">${ICONS[ev.type] || '●'} ${esc(ev.type.toUpperCase())} ${liveBadge(ev)}</div>` +
    `<div class="d-title">${esc(ev.title)}</div>` +
    `<div class="d-where">📍 ${esc(ev.location)}${subtype} &middot; <span style="color:var(--muted)">${esc(eventAge(ev))}</span></div>` +
    linkButton(ev.url) + statsHtml(ev, c) +
    `<div class="d-lbl">Brief</div><div class="d-brief">${nl2br(ev.brief || 'No details.')}</div>` + footer(ev, c));
}

function relatedNews(match, types, limit) {
  const items = allEvents().filter(e => types.includes(e.type) && match(e)).slice(0, limit);
  if (!items.length) return '';
  return '<div class="d-sep"></div><div class="d-lbl">In the news</div>' + items.map(e => {
    const href = safeUrl(e.url);
    const title = href
      ? `<a href="${esc(href)}" target="_blank" rel="noopener" style="color:var(--text);text-decoration:none;border-bottom:1px solid rgba(255,255,255,.12)">${esc(e.title)}</a>`
      : esc(e.title);
    return `<div style="padding:8px 10px;background:rgba(255,255,255,.03);border:1px solid var(--border);border-radius:7px;margin-bottom:5px">` +
      `<div style="font-size:9px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;color:${COLORS[e.type] || '#fff'};margin-bottom:4px">${esc(e.type)}</div>` +
      `<div style="font-size:11px;line-height:1.4;margin-bottom:4px">${title}</div>` +
      `<div style="font-size:9px;color:var(--muted);font-family:'Space Mono',monospace">${esc(eventAge(e))}${e.sources && e.sources[0] ? ' · ' + esc(e.sources[0].n) : ''}</div></div>`;
  }).join('');
}

const statBox = (label, value, color = 'var(--text)', sub = '') =>
  `<div style="${BOX}"><div style="${MINI_LBL}">${label}</div><div style="font-size:14px;font-weight:700;color:${color}">${esc(value)}</div>${sub ? `<div style="font-size:8px;color:var(--muted)">${esc(sub)}</div>` : ''}</div>`;

// Planets are sky objects — the camera stays put (flying there would put Earth in the way).
export function openPlanet(p) {
  const data = PLANET_DATA[p.name] || {};
  const name = p.name.toLowerCase();
  const wiki = safeUrl(data.wiki);
  open(
    `<div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">` +
    `<div style="width:24px;height:24px;border-radius:50%;flex-shrink:0;background:radial-gradient(circle at 35% 35%,${p.color}ee,${p.color},${p.color}88);box-shadow:0 0 18px 6px ${p.color}55"></div>` +
    `<div><div style="font-size:18px;font-weight:700;color:var(--text)">${esc(p.name)}</div>` +
    `<div style="font-size:10px;color:var(--muted);letter-spacing:1px;text-transform:uppercase">${esc(data.type || 'Planet')} · Solar System</div></div></div>` +
    `<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:10px">` +
    statBox('Distance', data.dist || '—', p.color) + statBox('Orbital Period', data.period || '—') +
    statBox('Radius', data.radius || '—') + statBox('Moons', data.moons ?? '—') + `</div>` +
    `<div class="d-sep"></div><div class="d-lbl">About</div><div style="font-size:11px;line-height:1.7;color:rgba(216,221,232,.85);margin-bottom:12px">${esc(data.note || '')}</div>` +
    (wiki ? `<a href="${esc(wiki)}" target="_blank" rel="noopener" style="display:flex;align-items:center;justify-content:center;gap:6px;padding:9px 14px;background:rgba(255,255,255,.05);border:1px solid var(--border);border-radius:7px;color:var(--muted);font-size:10px;font-weight:700;letter-spacing:1px;text-decoration:none;text-transform:uppercase;margin-bottom:12px">&#x2197; Wikipedia</a>` : '') +
    relatedNews(e => e.title.toLowerCase().includes(name) || (e.tags || []).some(t => t.toLowerCase() === name), ['astronomy', 'astrology', 'tech', 'news', 'science'], 5));
}

export function openStar(s) {
  const color = starColor(s[4]);
  const name = s[0].toLowerCase();
  open(
    `<div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">` +
    `<div style="width:22px;height:22px;border-radius:50%;flex-shrink:0;background:radial-gradient(circle at 35% 35%,${color}cc,${color},${color}88);box-shadow:0 0 16px 5px ${color}55"></div>` +
    `<div><div style="font-size:18px;font-weight:700;color:var(--text)">${esc(s[0])}</div>` +
    `<div style="font-size:10px;color:var(--muted);letter-spacing:1px;text-transform:uppercase">${esc(s[6])} · ${esc(s[4])}</div></div></div>` +
    `<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:12px">` +
    statBox('Distance', s[5] < 10 ? s[5].toFixed(2) : Math.round(s[5]), color, 'light-years') +
    statBox('Magnitude', s[3], 'var(--text)', 'visual') +
    statBox('Spectral', s[4][0], color, s[4]) + `</div>` +
    `<div style="${BOX};padding:9px 11px;margin-bottom:12px;font-family:'Space Mono',monospace"><div style="${MINI_LBL};margin-bottom:5px">Coordinates (J2000)</div>` +
    `<div style="font-size:10px;color:var(--text)">RA ${s[1].toFixed(2)}°&ensp;·&ensp;Dec ${s[2] >= 0 ? '+' : ''}${s[2].toFixed(2)}°</div></div>` +
    `<div class="d-sep"></div><div class="d-lbl">About</div><div style="font-size:11px;line-height:1.7;color:rgba(216,221,232,.85);margin-bottom:4px">${esc(s[7])}</div>` +
    relatedNews(e => e.title.toLowerCase().includes(name), ['astronomy', 'astrology'], 4));
}

export function openConstellation(name) {
  const data = CONSTELLATION_DATA[name] || {};
  open(
    `<div style="margin-bottom:16px"><div style="font-size:10px;letter-spacing:3px;color:rgba(160,170,255,.7);text-transform:uppercase;margin-bottom:5px">Constellation</div>` +
    `<div style="font-size:22px;font-weight:700;color:var(--text);letter-spacing:.02em">${esc(name)}</div>` +
    (data.area ? `<div style="font-size:10px;color:var(--muted);margin-top:3px">${esc(data.area)} &nbsp;·&nbsp; ${esc(data.hemisphere)} &nbsp;·&nbsp; Best: ${esc(data.season)}</div>` : '') + `</div>` +
    (data.note ? `<div style="font-size:12px;line-height:1.75;color:rgba(255,255,255,.72);margin-bottom:14px">${esc(data.note)}</div>` : '') +
    (data.stars ? `<div class="d-sep"></div><div class="d-lbl">Notable Stars</div><div style="font-size:11px;color:var(--muted);line-height:1.7;margin-top:6px">${esc(data.stars)}</div>` : ''));
}
