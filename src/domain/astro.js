// Astronomy math — Meeus + Keplerian elements (Paul Schlyter, J2000). Zero dependencies.
// Shared by the client (globe, sky, natal chart) and the server (pinning astronomy news).

export const DEG = Math.PI / 180;
export const RAD = 180 / Math.PI;

export const norm360 = x => ((x % 360) + 360) % 360;
export const norm180 = x => { x = norm360(x); return x > 180 ? x - 360 : x; };

const jde = date => date.getTime() / 86400000 + 2440587.5;
const julT = date => (jde(date) - 2451545.0) / 36525;
export const daysSinceJ2000 = date => date.getTime() / 86400000 - 10957.5;

export function gmstDeg(date) {
  const jd = jde(date);
  const t = (jd - 2451545.0) / 36525;
  return norm360(280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * t * t - t * t * t / 38710000);
}

export const gmstFromDays = d => norm360(280.46061837 + 360.98564736629 * d);

// ---------------------------------------------------------------------------
// Sub-points: the spot on Earth directly beneath a body
// ---------------------------------------------------------------------------
export function sunSubpoint(date) {
  const t = julT(date);
  const L0 = norm360(280.46646 + 36000.76983 * t);
  const M = norm360(357.52911 + 35999.05029 * t - 0.0001537 * t * t) * DEG;
  const C = (1.914602 - 0.004817 * t) * Math.sin(M) + 0.019993 * Math.sin(2 * M) + 0.000289 * Math.sin(3 * M);
  const lon = norm360(L0 + C);
  const omega = norm360(125.04 - 1934.136 * t);
  const lam = norm360(lon - 0.00569 - 0.00478 * Math.sin(omega * DEG));
  const eps = (23.439291111 - 0.013004167 * t) * DEG;
  const ra = Math.atan2(Math.cos(eps) * Math.sin(lam * DEG), Math.cos(lam * DEG)) * RAD;
  const dec = Math.asin(Math.sin(eps) * Math.sin(lam * DEG)) * RAD;
  return { lat: dec, lng: norm180(norm360(ra) - gmstDeg(date)) };
}

export function moonSubpoint(date) {
  const t = julT(date);
  const L1 = norm360(218.3164477 + 481267.88123421 * t);
  const D = norm360(297.8501921 + 445267.1114034 * t) * DEG;
  const M = norm360(357.5291092 + 35999.0502909 * t) * DEG;
  const Mp = norm360(134.9633964 + 477198.8675055 * t) * DEG;
  const F = norm360(93.2720950 + 483202.0175233 * t) * DEG;
  const lonM = L1 + 6.288774 * Math.sin(Mp) + 1.274027 * Math.sin(2 * D - Mp) + 0.658314 * Math.sin(2 * D) + 0.213618 * Math.sin(2 * Mp) - 0.185116 * Math.sin(M) - 0.114332 * Math.sin(2 * F);
  const latM = 5.128122 * Math.sin(F) + 0.280602 * Math.sin(Mp + F) + 0.277693 * Math.sin(Mp - F) + 0.173237 * Math.sin(2 * D - F);
  const eps = (23.439291111 - 0.013004167 * t) * DEG;
  const lr = lonM * DEG, br = latM * DEG;
  const ra = Math.atan2(Math.sin(lr) * Math.cos(eps) - Math.tan(br) * Math.sin(eps), Math.cos(lr)) * RAD;
  const dec = Math.asin(Math.sin(br) * Math.cos(eps) + Math.cos(br) * Math.sin(eps) * Math.sin(lr)) * RAD;
  return { lat: dec, lng: norm180(norm360(ra) - gmstDeg(date)) };
}

export function moonPhaseName(date) {
  const t = julT(date);
  const D = norm360(297.8501921 + 445267.1114034 * t);
  const phases = ['New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous', 'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent'];
  return phases[Math.floor(((D + 22.5) % 360) / 45)];
}

// Low-precision mean-longitude sub-points used by the live astrology layer.
const PLANET_MEAN_LON = {
  Mercury: [252.250906, 149472.6746358, -0.00000535],
  Venus:   [181.979801, 58517.8156760, 0.00000165],
  Mars:    [19.971970, 19140.302327, 0.00000097],
  Jupiter: [34.351432, 3034.905661, -0.00008501],
  Saturn:  [50.077444, 1222.113849, 0.00021004],
  Uranus:  [314.055070, 428.466998, -0.00000031],
  Neptune: [304.348791, 218.486200, 0.00000059]
};

export function planetSubpoint(name, date) {
  const L0 = PLANET_MEAN_LON[name];
  const t = julT(date);
  const L = norm360(L0[0] + L0[1] * t + L0[2] * t * t) * DEG;
  const eps = (23.439291111 - 0.013004167 * t) * DEG;
  const ra = Math.atan2(Math.sin(L) * Math.cos(eps), Math.cos(L)) * RAD;
  const dec = Math.asin(Math.sin(eps) * Math.sin(L)) * RAD;
  return { lat: dec, lng: norm180(norm360(ra) - gmstDeg(date)) };
}

const CONST_BANDS = [
  [0, 30, 'Pisces'], [30, 60, 'Aries'], [60, 90, 'Taurus'], [90, 120, 'Gemini'],
  [120, 150, 'Cancer'], [150, 180, 'Leo'], [180, 210, 'Virgo'], [210, 240, 'Libra'],
  [240, 270, 'Scorpius'], [270, 300, 'Sagittarius'], [300, 330, 'Capricornus'], [330, 360, 'Aquarius']
];
export function constellationForRA(raDeg) {
  const ra = norm360(raDeg);
  const band = CONST_BANDS.find(b => ra >= b[0] && ra < b[1]);
  return band ? band[2] : 'Unknown';
}

// [lng, lat] ring tracing the night side, for globe.polygonsData
export function nightPolygon(date = new Date()) {
  const sun = sunSubpoint(date);
  const slat = sun.lat * DEG;
  const coords = [];
  for (let lng = -180; lng <= 180; lng++) {
    const dlng = (lng - sun.lng) * DEG;
    const latRad = Math.abs(sun.lat) < 0.5
      ? (Math.cos(dlng) >= 0 ? -1 : 1) * Math.PI / 2 * 0.999
      : Math.atan(-Math.cos(dlng) / Math.tan(slat));
    coords.push([lng, latRad * RAD]);
  }
  const pole = sun.lat >= 0 ? -90 : 90;
  coords.push([180, pole], [-180, pole], coords[0]);
  return [{ geo: { type: 'Polygon', coordinates: [coords] } }];
}

// ---------------------------------------------------------------------------
// Keplerian planetary positions
// ---------------------------------------------------------------------------
export const EARTH_ELEMS = { N0: 0, dN: 0, i0: 0, di: 0, w0: 282.9404, dw: 4.70935e-5, a0: 1, da: 0, e0: 0.016709, de: -1.151e-9, M0: 356.0470, dM: 0.9856002585 };

export const PLANET_DEFS = [
  { name: 'Mercury', color: '#c8c8c8', r: 4, N0: 48.3313, dN: 3.24587e-5, i0: 7.0047, di: 5e-8, w0: 29.1241, dw: 1.01444e-5, a0: 0.387098, da: 0, e0: 0.205635, de: 5.59e-10, M0: 168.6562, dM: 4.0923344368 },
  { name: 'Venus', color: '#ffe580', r: 7, N0: 76.6799, dN: 2.46590e-5, i0: 3.3946, di: 2.75e-8, w0: 54.8910, dw: 1.38374e-5, a0: 0.723330, da: 0, e0: 0.006773, de: -1.302e-9, M0: 48.0052, dM: 1.6021302244 },
  { name: 'Mars', color: '#ff6b3d', r: 6, N0: 49.5574, dN: 2.11081e-5, i0: 1.8497, di: -1.78e-8, w0: 286.5016, dw: 2.92961e-5, a0: 1.523688, da: 0, e0: 0.093405, de: 2.516e-9, M0: 18.6021, dM: 0.5240207766 },
  { name: 'Jupiter', color: '#ffcc88', r: 9, N0: 100.4542, dN: 2.76854e-5, i0: 1.3030, di: -1.557e-7, w0: 273.8777, dw: 1.64505e-5, a0: 5.20256, da: 0, e0: 0.048498, de: 4.469e-9, M0: 19.8950, dM: 0.0830853001 },
  { name: 'Saturn', color: '#e8d580', r: 8, rings: { w: 5.5, h: 1.8, rot: -22, opacity: 0.62 }, N0: 113.6634, dN: 2.38980e-5, i0: 2.4886, di: -1.081e-7, w0: 339.3939, dw: 2.97661e-5, a0: 9.55475, da: 0, e0: 0.055546, de: -9.499e-9, M0: 316.9670, dM: 0.0334442282 },
  { name: 'Uranus', color: '#7de8e8', r: 5, rings: { w: 3.2, h: 4.2, rot: 80, opacity: 0.35 }, N0: 74.0005, dN: 1.3978e-5, i0: 0.7733, di: 1.9e-8, w0: 96.6612, dw: 3.0565e-5, a0: 19.18171, da: -1.55e-8, e0: 0.047318, de: 7.45e-9, M0: 142.5905, dM: 0.011725806 },
  { name: 'Neptune', color: '#6688ff', r: 5, N0: 131.7806, dN: 3.0173e-5, i0: 1.7700, di: -2.55e-7, w0: 272.8461, dw: -6.027e-6, a0: 30.05826, da: 3.313e-8, e0: 0.008606, de: 2.15e-9, M0: 260.2471, dM: 0.005995147 },
  { name: 'Pluto', color: '#c2a27a', r: 3, N0: 110.3039, dN: 1.98169e-5, i0: 17.1417, di: 1.1e-8, w0: 113.7633, dw: 1.71e-5, a0: 39.48168, da: -3.16e-7, e0: 0.24883, de: 5.1e-10, M0: 14.5300, dM: 0.003974 }
];

export const ORBITAL_PERIODS = { Mercury: 88, Venus: 225, Mars: 687, Jupiter: 4333, Saturn: 10759, Uranus: 30687, Neptune: 60190 };

function solveKepler(M, e) {
  let E = M + e * Math.sin(M) * (1 + e * Math.cos(M));
  for (let i = 0; i < 6; i++) E = E - (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
  return E;
}

function keplerXYZ(el, d) {
  const N = norm360(el.N0 + el.dN * d) * DEG;
  const inc = (el.i0 + el.di * d) * DEG;
  const w = norm360(el.w0 + el.dw * d) * DEG;
  const a = el.a0 + el.da * d;
  const e = el.e0 + el.de * d;
  const M = norm360(el.M0 + el.dM * d) * DEG;
  const E = solveKepler(M, e);
  const xv = a * (Math.cos(E) - e);
  const yv = a * (Math.sqrt(1 - e * e) * Math.sin(E));
  const v = Math.atan2(yv, xv);
  const r = Math.sqrt(xv * xv + yv * yv);
  return {
    x: r * (Math.cos(N) * Math.cos(v + w) - Math.sin(N) * Math.sin(v + w) * Math.cos(inc)),
    y: r * (Math.sin(N) * Math.cos(v + w) + Math.cos(N) * Math.sin(v + w) * Math.cos(inc)),
    z: r * Math.sin(v + w) * Math.sin(inc)
  };
}

export function planetGeogLatLng(planet, d) {
  const ph = keplerXYZ(planet, d);
  const eh = keplerXYZ(EARTH_ELEMS, d);
  const gx = ph.x - eh.x, gy = ph.y - eh.y, gz = ph.z - eh.z;
  const au = Math.sqrt(gx * gx + gy * gy + gz * gz);
  const eps = (23.4393 - 3.563e-7 * d) * DEG;
  const ye = gy * Math.cos(eps) - gz * Math.sin(eps);
  const ze = gy * Math.sin(eps) + gz * Math.cos(eps);
  const ra = Math.atan2(ye, gx) * RAD;
  const dec = Math.atan2(ze, Math.sqrt(gx * gx + ye * ye)) * RAD;
  return { lat: dec, lng: norm180(ra - gmstFromDays(d)), au };
}

// Geocentric AU distance → sky projection units (log scale, 400–800)
export const planetSkyDist = au => 400 + 400 * Math.log(1 + au) / Math.log(33);

export function orbitPaths(date) {
  const d0 = daysSinceJ2000(date);
  const paths = {};
  for (const p of PLANET_DEFS) {
    const period = ORBITAL_PERIODS[p.name] || 365;
    const pts = [];
    for (let i = 0; i < 72; i++) pts.push(planetGeogLatLng(p, d0 + (i / 72) * period));
    paths[p.name] = pts;
  }
  return paths;
}

// ---------------------------------------------------------------------------
// Natal chart
// ---------------------------------------------------------------------------
export const SIGNS = [
  { name: 'Aries', glyph: '♈', element: 'Fire', ruler: 'Mars' },
  { name: 'Taurus', glyph: '♉', element: 'Earth', ruler: 'Venus' },
  { name: 'Gemini', glyph: '♊', element: 'Air', ruler: 'Mercury' },
  { name: 'Cancer', glyph: '♋', element: 'Water', ruler: 'Moon' },
  { name: 'Leo', glyph: '♌', element: 'Fire', ruler: 'Sun' },
  { name: 'Virgo', glyph: '♍', element: 'Earth', ruler: 'Mercury' },
  { name: 'Libra', glyph: '♎', element: 'Air', ruler: 'Venus' },
  { name: 'Scorpio', glyph: '♏', element: 'Water', ruler: 'Pluto' },
  { name: 'Sagittarius', glyph: '♐', element: 'Fire', ruler: 'Jupiter' },
  { name: 'Capricorn', glyph: '♑', element: 'Earth', ruler: 'Saturn' },
  { name: 'Aquarius', glyph: '♒', element: 'Air', ruler: 'Uranus' },
  { name: 'Pisces', glyph: '♓', element: 'Water', ruler: 'Neptune' }
];

export function signFromLon(lon) {
  const l = norm360(lon);
  return { sign: SIGNS[Math.floor(l / 30)], degree: Math.floor(l % 30) };
}

function sunEclipticLon(t) {
  const L0 = norm360(280.46646 + 36000.76983 * t);
  const M = norm360(357.52911 + 35999.05029 * t - 0.0001537 * t * t) * DEG;
  const C = (1.914602 - 0.004817 * t) * Math.sin(M) + 0.019993 * Math.sin(2 * M) + 0.000289 * Math.sin(3 * M);
  return norm360(L0 + C);
}

function moonEclipticLon(t) {
  const L1 = norm360(218.3164477 + 481267.88123421 * t);
  const D = norm360(297.8501921 + 445267.1114034 * t) * DEG;
  const M = norm360(357.5291092 + 35999.0502909 * t) * DEG;
  const Mp = norm360(134.9633964 + 477198.8675055 * t) * DEG;
  const F = norm360(93.2720950 + 483202.0175233 * t) * DEG;
  return norm360(L1 + 6.288774 * Math.sin(Mp) + 1.274027 * Math.sin(2 * D - Mp) + 0.658314 * Math.sin(2 * D) + 0.213618 * Math.sin(2 * Mp) - 0.185116 * Math.sin(M) - 0.114332 * Math.sin(2 * F));
}

function planetEclipticLon(planet, d) {
  const ph = keplerXYZ(planet, d);
  const eh = keplerXYZ(EARTH_ELEMS, d);
  return norm360(Math.atan2(ph.y - eh.y, ph.x - eh.x) * RAD);
}

function ascendantEclipticLon(d, lat, lng) {
  const RAMC = norm360(280.46061837 + 360.98564736629 * d + lng) * DEG;
  const eps = (23.4393 - 3.563e-7 * d) * DEG;
  const phi = lat * DEG;
  return norm360(Math.atan2(-Math.cos(RAMC), Math.sin(eps) * Math.tan(phi) + Math.cos(eps) * Math.sin(RAMC)) * RAD);
}

export function computeNatalChart(dateStr, timeStr, lat, lng) {
  const hasTime = !!(timeStr && timeStr.length >= 4);
  const hasPlace = lat != null && lng != null;
  const dtStr = dateStr + 'T' + (hasTime ? timeStr : '12:00') + ':00';
  // Approximate local solar time from longitude when both time and place are known.
  const dt = hasTime && hasPlace
    ? new Date(new Date(dtStr).getTime() - (lng / 15) * 3600000)
    : new Date(dtStr + 'Z');
  const d = daysSinceJ2000(dt);
  const t = d / 36525;
  return {
    sunLon: sunEclipticLon(t),
    moonLon: moonEclipticLon(t),
    ascLon: hasTime && hasPlace ? ascendantEclipticLon(d, lat, lng) : null,
    planets: PLANET_DEFS.map(p => ({ name: p.name, color: p.color, lon: planetEclipticLon(p, d) })),
    hasTime,
    hasPlace
  };
}
