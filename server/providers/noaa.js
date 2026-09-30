import { fetchJSON } from '../http.js';

// Max predicted planetary Kp over the next ~12h. NOAA now returns row objects
// ({kp, observed}) instead of the old arrays, which silently broke the aurora layer;
// both shapes are accepted.
export async function predictedKp() {
  const d = await fetchJSON('https://services.swpc.noaa.gov/products/noaa-planetary-k-index-forecast.json', { source: 'noaa' });
  const rows = (d || []).map(r => Array.isArray(r)
    ? { kp: parseFloat(r[1]), kind: r[2] }
    : { kp: parseFloat(r.kp), kind: r.observed });
  const predicted = rows.filter(r => r.kind === 'predicted' && Number.isFinite(r.kp));
  return predicted.length ? Math.max(...predicted.slice(0, 4).map(r => r.kp)) : null;
}
