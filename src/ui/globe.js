// The 3D globe: markers, arcs, flights, night terminator and theme textures — all derived
// from app state. Other modules call refresh helpers; nothing else touches `globe`.
import { state, findEvent } from '../core/store.js';
import { globeFeedEvents } from '../core/filters.js';
import { COLORS } from '../domain/verticals.js';
import { FLIGHT_ROUTES } from '../domain/flights.js';
import { sunSubpoint, nightPolygon, DEG } from '../domain/astro.js';

const IMG = {
  day: '//unpkg.com/three-globe/example/img/earth-day.jpg',
  night: '//unpkg.com/three-globe/example/img/earth-night.jpg',
  bump: '//unpkg.com/three-globe/example/img/earth-topology.png',
  sky: '//unpkg.com/three-globe/example/img/night-sky.png'
};

let globe = null;
let onSelect = () => {};
let onAnchor = () => {};

export const getGlobe = () => globe;

export function initGlobe(handlers) {
  onSelect = handlers.onSelect;
  onAnchor = handlers.onAnchor;
  globe = window.Globe({ animateIn: false })
    .globeImageUrl(IMG.night)
    .bumpImageUrl(IMG.bump)
    .backgroundImageUrl(IMG.sky)
    .showAtmosphere(true).atmosphereColor('#1e3a8a').atmosphereAltitude(0.18)
    .htmlElementsData([]).htmlElement(buildMarker)
    .htmlLat(d => d.lat).htmlLng(d => d.lng).htmlAltitude(0.01)
    .pointsData([]).pointLat(d => d.lat).pointLng(d => d.lng)
    .pointColor(() => '#10b981').pointAltitude(0.004).pointRadius(0.22)
    (document.getElementById('globe-wrap'));
  globe.arcsData([])
    .arcStartLat(d => d.sLat).arcStartLng(d => d.sLng)
    .arcEndLat(d => d.eLat).arcEndLng(d => d.eLng)
    .arcColor(d => d.color).arcDashLength(0.4).arcDashGap(0.15)
    .arcDashAnimateTime(1800).arcStroke(d => d.w).arcAltitude(0.18);
  globe.polygonsData([])
    .polygonGeoJsonGeometry(d => d.geo)
    .polygonCapColor(() => 'rgba(0,4,30,0.72)')
    .polygonSideColor(() => 'rgba(0,0,0,0)')
    .polygonStrokeColor(() => 'rgba(99,140,255,0.18)')
    .polygonAltitude(0.001);
  globe.width(window.innerWidth).height(window.innerHeight);
  window.addEventListener('resize', () => globe.width(window.innerWidth).height(window.innerHeight));
  const controls = globe.controls();
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.22;
  controls.enableDamping = true;
  // Start on the night side so the sun orb is visible from the first frame.
  const sun = sunSubpoint(new Date());
  globe.pointOfView({ lat: -sun.lat, lng: sun.lng + 180, altitude: 2.2 }, 0);

  const canvas = document.querySelector('#globe-wrap canvas');
  if (canvas) canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); showContextLost(); }, false);
  return globe;
}

function showContextLost() {
  const msg = document.createElement('div');
  msg.style.cssText = 'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.85);z-index:9999;color:#fff;font-family:Space Mono,monospace;font-size:13px;text-align:center;letter-spacing:.05em;';
  msg.innerHTML = '<div><div style="font-size:24px;margin-bottom:12px">⚠</div>Globe context lost.<br><br><button style="margin-top:12px;padding:8px 24px;background:#3b82f6;border:none;border-radius:8px;color:#fff;font-family:inherit;cursor:pointer;font-size:13px">↺ RELOAD</button></div>';
  msg.querySelector('button').onclick = () => location.reload();
  document.body.appendChild(msg);
}

// Tap (not drag) on a marker. stopPropagation keeps OrbitControls from capturing the pointer.
function onTap(el, fn) {
  let t, x, y;
  el.addEventListener('pointerdown', e => { e.stopPropagation(); t = Date.now(); x = e.clientX; y = e.clientY; });
  el.addEventListener('pointerup', e => {
    if (Date.now() - t < 400 && Math.abs(e.clientX - x) < 8 && Math.abs(e.clientY - y) < 8) fn();
  });
}

function buildMarker(d) {
  const el = document.createElement('div');
  const delay = d.type === 'anchor' ? 0 : Math.random() * 2;
  el.className = 'marker'
    + (d.type === 'anchor' ? ' anchor-marker' : '')
    + (d.severity >= 4 && d.type !== 'anchor' ? ' sev5' : '')
    + (state.connect.ids.includes(d.id) ? ' csel' : '');
  el.style.cssText = `--mc:${COLORS[d.type] || '#fff'};width:22px;height:22px;cursor:pointer;pointer-events:auto`;
  el.dataset.id = d.id;
  el.title = d.title;
  el.innerHTML = `<div class="m-ring" style="animation-delay:${delay.toFixed(2)}s"></div><div class="m-ring m-ring2" style="animation-delay:${(delay + 0.9).toFixed(2)}s"></div><div class="m-dot"></div>`;
  onTap(el, () => (d.type === 'anchor' ? onAnchor() : onSelect(d.id)));
  return el;
}

const anchorPin = () => state.anchor && {
  id: '__anchor__', type: 'anchor', title: '⊕ ' + (state.anchor.title || state.anchor.place),
  location: state.anchor.place, lat: state.anchor.lat, lng: state.anchor.lng, severity: 5
};

export function flightPoints() {
  const hours = Date.now() / 3600000;
  return FLIGHT_ROUTES.map((r, i) => {
    const t = ((hours + i * 1.3) % 12) / 12;
    return { lat: r.sLat + (r.dLat - r.sLat) * t, lng: r.sLng + (r.dLng - r.sLng) * t, label: `${r.s}-${r.d}` };
  });
}

export function refreshMarkers() {
  if (!globe) return;
  const pin = anchorPin();
  if (state.feedHidden) {
    globe.htmlElementsData([]);
    globe.pointsData([]);
  } else if (state.history.open) {
    globe.htmlElementsData(state.history.events.concat(pin ? [pin] : []));
    globe.pointsData([]);
  } else {
    globe.htmlElementsData([
      ...globeFeedEvents(),
      ...(state.layerVis.history ? state.history.events : []),
      ...(pin ? state.anchorEvents : []),
      ...(pin ? [pin] : []),
      ...(state.throughline ? state.throughline.events : [])
    ]);
    globe.pointsData(state.layerVis.flight ? flightPoints() : []);
  }
  refreshTerminator();
}

export function refreshArcs() {
  if (!globe) return;
  const arcs = [];
  // Connect mode: every pair; teal across time, purple when tags overlap, faint otherwise.
  const evs = state.connect.ids.map(findEvent).filter(Boolean);
  for (let i = 0; i < evs.length; i++) {
    for (let j = i + 1; j < evs.length; j++) {
      const a = evs[i], b = evs[j];
      const temporal = a.type === 'history' || b.type === 'history';
      const shared = (a.tags || []).some(t => (b.tags || []).includes(t));
      const strong = temporal ? '#2dd4bf' : '#a855f7';
      const weak = temporal ? 'rgba(45,212,191,0.3)' : 'rgba(168,85,247,0.3)';
      const c = shared || temporal ? strong : weak;
      arcs.push({ sLat: a.lat, sLng: a.lng, eLat: b.lat, eLng: b.lng, color: [c, c], w: temporal ? 1.1 : shared ? 0.9 : 0.35 });
    }
  }
  // Anchor: red threads from the pin to every event on the globe.
  if (state.anchor) {
    for (const ev of state.anchorEvents.concat(globeFeedEvents())) {
      if (ev.lat && ev.lng) arcs.push({ sLat: state.anchor.lat, sLng: state.anchor.lng, eLat: ev.lat, eLng: ev.lng, color: ['#ef4444', 'rgba(239,68,68,0.2)'], w: 0.5 });
    }
  }
  // Shared string: amber web between its events.
  const tl = state.throughline ? state.throughline.events : [];
  for (let i = 0; i < tl.length; i++) {
    for (let j = i + 1; j < tl.length; j++) {
      if (tl[i].lat && tl[j].lat) arcs.push({ sLat: tl[i].lat, sLng: tl[i].lng, eLat: tl[j].lat, eLng: tl[j].lng, color: ['#f59e0b', 'rgba(245,158,11,0.2)'], w: 0.85 });
    }
  }
  globe.arcsData(arcs);
}

// Keep marker highlight in sync without rebuilding every marker.
export function syncSelectedMarkers() {
  document.querySelectorAll('.marker').forEach(el => el.classList.toggle('csel', state.connect.ids.includes(el.dataset.id)));
}

export function refreshTerminator() {
  if (globe) globe.polygonsData(state.theme === 2 ? nightPolygon(new Date()) : []);
}

export function applyTheme() {
  if (!globe) return;
  if (state.theme === 0) globe.globeImageUrl(IMG.night).atmosphereColor('#1e3a8a').atmosphereAltitude(0.14);
  else if (state.theme === 1) globe.globeImageUrl(IMG.day).atmosphereColor('#93c5fd').atmosphereAltitude(0.14);
  else {
    globe.globeImageUrl(IMG.day).atmosphereColor('#5bb8ff').atmosphereAltitude(0.22);
    const sun = sunSubpoint(new Date());
    globe.pointOfView({ lat: -sun.lat, lng: sun.lng + 180, altitude: 2.2 }, 800);
  }
  refreshTerminator();
}

// Fly the camera, pausing auto-rotate for a few seconds so the user can read.
let resumeTimer = null;
export function flyTo(pov, ms = 1200) {
  if (!globe) return;
  globe.controls().autoRotate = false;
  globe.pointOfView(pov, ms);
  clearTimeout(resumeTimer);
  resumeTimer = setTimeout(() => { globe.controls().autoRotate = true; }, 6000);
}

export const cameraDistance = () => (globe ? globe.camera().position.length() : 0);

// World-space point → screen coords via the globe camera. occlude hides points behind Earth.
export function projectToScreen(wx, wy, wz, occlude) {
  const cam = globe.camera();
  if (occlude) {
    const cp = cam.position;
    const dot = wx * cp.x + wy * cp.y + wz * cp.z;
    if (dot / (cp.length() * Math.sqrt(wx * wx + wy * wy + wz * wz)) < 0) return null;
  }
  const m = cam.matrixWorldInverse.elements;
  const p = cam.projectionMatrix.elements;
  const vx = m[0] * wx + m[4] * wy + m[8] * wz + m[12];
  const vy = m[1] * wx + m[5] * wy + m[9] * wz + m[13];
  const vz = m[2] * wx + m[6] * wy + m[10] * wz + m[14];
  const vw = m[3] * wx + m[7] * wy + m[11] * wz + m[15];
  const cx = p[0] * vx + p[4] * vy + p[8] * vz + p[12] * vw;
  const cy = p[1] * vx + p[5] * vy + p[9] * vz + p[13] * vw;
  const cw = p[3] * vx + p[7] * vy + p[11] * vz + p[15] * vw;
  if (cw <= 0.01) return null;
  const nx = cx / cw, ny = cy / cw;
  if (Math.abs(nx) > 1.6 || Math.abs(ny) > 1.6) return null;
  return { x: (nx + 1) / 2 * window.innerWidth, y: (-ny + 1) / 2 * window.innerHeight };
}

// lat/lng on a sphere of radius `dist` around Earth → screen.
export function projectSky(lat, lng, dist, occlude) {
  const la = lat * DEG, ln = lng * DEG;
  return projectToScreen(dist * Math.cos(la) * Math.sin(ln), dist * Math.sin(la), dist * Math.cos(la) * Math.cos(ln), occlude);
}
