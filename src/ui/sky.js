// Sky overlay drawn around the globe: planets, named stars, constellation figures, orbit
// rings and the sun orb. Positions follow the history date when history mode is active.
import { state } from '../core/store.js';
import { byId } from '../core/dom.js';
import { PLANET_DEFS, planetGeogLatLng, planetSkyDist, daysSinceJ2000, gmstFromDays, norm180, orbitPaths, sunSubpoint } from '../domain/astro.js';
import { STAR_CATALOG, CONSTELLATIONS } from '../domain/sky-catalog.js';
import { projectSky, cameraDistance } from './globe.js';

let orbits = {};
const labelPos = {};  // constellation name → screen position this frame
let hovered = null;
let handlers = {};

const skyDate = () => state.history.date || new Date();

export const starColor = spectral =>
  ({ O: '#9BB0FF', B: '#AABFFF', A: '#E8EDFF', F: '#FFF4E8', G: '#FFEECC', K: '#FFDDAA', M: '#FFAA88', W: '#AAFFD0' })[spectral[0]] || '#FFFFFF';

export function initSky(h) {
  handlers = h; // {onPlanet(planet), onStar(star), onConstellation(name)}
  const planets = byId('planet-orbs');
  planets.innerHTML = '';
  for (const p of PLANET_DEFS) {
    const el = document.createElement('div');
    el.className = 'porb';
    el.id = 'porb-' + p.name.toLowerCase();
    el.style.setProperty('--pc', p.color);
    el.style.setProperty('--pr', p.r + 'px');
    el.style.cursor = 'pointer';
    let back = '', front = '';
    if (p.rings) {
      const rg = p.rings;
      const style = `width:calc(var(--pr)*${rg.w});height:calc(var(--pr)*${rg.h});border:1.5px solid ${p.color}${Math.round(rg.opacity * 255).toString(16).padStart(2, '0')};transform:translate(-50%,-50%) rotate(${rg.rot}deg);`;
      back = `<span class="porb-ring back" style="${style}"></span>`;
      front = `<span class="porb-ring front" style="${style}clip-path:polygon(0% 50%,100% 50%,100% 100%,0% 100%)"></span>`;
    }
    el.innerHTML = `${back}<span class="porb-dot"></span><span class="porb-label">${p.name}</span>${front}`;
    el.onclick = e => { e.stopPropagation(); handlers.onPlanet(p); };
    planets.appendChild(el);
  }

  const stars = byId('star-orbs');
  stars.innerHTML = '';
  STAR_CATALOG.forEach((s, i) => {
    const mag = s[3];
    const r = mag < 0 ? 5.5 : mag < 1 ? 4.5 : mag < 2 ? 3.5 : mag < 2.5 ? 2.8 : 2.2;
    const color = starColor(s[4]);
    const el = document.createElement('div');
    el.className = 'sorb';
    el.id = 'sorb-' + i;
    el.title = s[0];
    el.style.cssText = `width:${r * 2}px;height:${r * 2}px;display:none;background:${color};box-shadow:0 0 ${r * 2.5}px ${r}px ${color}55;`;
    el.onclick = e => { e.stopPropagation(); handlers.onStar(s); };
    stars.appendChild(el);
  });

  // The orbit canvas is pointer-events:none, so constellation labels are hit-tested here.
  const nearestLabel = e => {
    // Only the open globe counts — not clicks on panels or modals that sit over a label.
    if (cameraDistance() < 200 || !e.target.closest('#globe-wrap')) return null;
    let best = null, bestD = 38;
    for (const [name, pos] of Object.entries(labelPos)) {
      if (!pos) continue;
      const d = Math.hypot(e.clientX - pos.x, e.clientY - pos.y);
      if (d < bestD) { bestD = d; best = name; }
    }
    return best;
  };
  document.addEventListener('click', e => { const name = nearestLabel(e); if (name) handlers.onConstellation(name); });
  document.addEventListener('mousemove', e => {
    const name = nearestLabel(e);
    if (name !== hovered) { hovered = name; document.body.style.cursor = name ? 'pointer' : ''; }
  });

  recomputeOrbits();
  requestAnimationFrame(tick);
}

export function recomputeOrbits() {
  orbits = orbitPaths(skyDate());
}

function place(el, sp, opacity) {
  if (!sp || opacity <= 0) { el.style.display = 'none'; return; }
  el.style.display = 'block';
  el.style.opacity = opacity;
  el.style.left = sp.x + 'px';
  el.style.top = sp.y + 'px';
}

function tick() {
  const camDist = cameraDistance();
  const d = daysSinceJ2000(skyDate());
  const gmst = gmstFromDays(d);
  const opacity = Math.min(1, Math.max(0, (camDist - 160) / 120));

  for (const p of PLANET_DEFS) {
    const el = byId('porb-' + p.name.toLowerCase());
    const pos = planetGeogLatLng(p, d);
    place(el, opacity > 0 && projectSky(pos.lat, pos.lng, planetSkyDist(pos.au), true), opacity);
  }
  STAR_CATALOG.forEach((s, i) => {
    place(byId('sorb-' + i), opacity > 0 && projectSky(s[2], norm180(s[1] - gmst), 618, false), opacity);
  });

  drawCanvas(camDist, d, gmst);
  drawSunOrb();
  requestAnimationFrame(tick);
}

function drawCanvas(camDist, d, gmst) {
  const oc = byId('orbit-canvas');
  const orbitOpacity = Math.min(0.55, Math.max(0, (camDist - 220) / 130));
  const constOpacity = Math.min(0.9, Math.max(0, (camDist - 200) / 80));
  if (oc.width !== window.innerWidth || oc.height !== window.innerHeight) {
    oc.width = window.innerWidth;
    oc.height = window.innerHeight;
  }
  const ctx = oc.getContext('2d');
  ctx.clearRect(0, 0, oc.width, oc.height);

  if (orbitOpacity > 0) {
    ctx.lineWidth = 0.6;
    ctx.setLineDash([3, 5]);
    for (const p of PLANET_DEFS) {
      const pts = orbits[p.name];
      if (!pts || !pts.length) continue;
      ctx.beginPath();
      ctx.strokeStyle = p.color + Math.round(orbitOpacity * 0x55).toString(16).padStart(2, '0');
      let started = false;
      for (let i = 0; i <= pts.length; i++) {
        const pos = pts[i % pts.length];
        const sp = projectSky(pos.lat, pos.lng, planetSkyDist(pos.au || 5), true);
        if (!sp) { started = false; continue; }
        if (started) ctx.lineTo(sp.x, sp.y); else { ctx.moveTo(sp.x, sp.y); started = true; }
      }
      ctx.stroke();
    }
    ctx.setLineDash([]);
  }

  if (constOpacity <= 0) {
    for (const k of Object.keys(labelPos)) labelPos[k] = null;
    return;
  }
  ctx.lineWidth = 0.75;
  for (const c of CONSTELLATIONS) {
    ctx.strokeStyle = `rgba(160,170,255,${constOpacity * 0.28})`;
    for (const path of c.paths) {
      ctx.beginPath();
      let started = false;
      for (const [ra, dec] of path) {
        const sp = projectSky(dec, norm180(ra - gmst), 619, true);
        if (!sp) { started = false; continue; }
        if (started) ctx.lineTo(sp.x, sp.y); else { ctx.moveTo(sp.x, sp.y); started = true; }
      }
      ctx.stroke();
    }
    const lsp = projectSky(c.dec, norm180(c.ra - gmst), 619, true);
    labelPos[c.name] = lsp || null;
    if (!lsp) continue;
    const hot = hovered === c.name;
    ctx.fillStyle = `rgba(${hot ? '220,225,255' : '180,185,255'},${constOpacity * (hot ? 0.9 : 0.55)})`;
    ctx.font = (hot ? 'bold ' : '') + '8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(c.name.toUpperCase(), lsp.x, lsp.y - 10);
    if (hot) {
      ctx.strokeStyle = `rgba(180,185,255,${constOpacity * 0.35})`;
      ctx.lineWidth = 1;
      ctx.strokeRect(lsp.x - 28, lsp.y - 20, 56, 13);
      ctx.lineWidth = 0.75;
    }
  }
}

function drawSunOrb() {
  const el = byId('sun-orb');
  const sun = sunSubpoint(new Date());
  const sp = projectSky(sun.lat, sun.lng, 550, false);
  if (!sp) { el.style.display = 'none'; return; }
  el.style.display = 'block';
  el.style.left = (sp.x - 60) + 'px';
  el.style.top = (sp.y - 60) + 'px';
  // Dimmed at night so it reads as "where daytime is" rather than a blinding glow.
  el.style.opacity = state.theme === 0 ? '0.45' : '1';
}
