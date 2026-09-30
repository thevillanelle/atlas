import { fetchJSON } from '../http.js';

export async function earthquakes({ minMagnitude = 5.0, limit = 25 } = {}) {
  const d = await fetchJSON(
    `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&minmagnitude=${minMagnitude}&limit=${limit}&orderby=time`,
    { source: 'usgs', timeout: 12000 }
  );
  return (d.features || []).map(f => {
    const p = f.properties;
    const mag = p.mag || 0;
    const place = p.place || 'Unknown';
    const depth = f.geometry.coordinates[2] || 0;
    const tsunami = p.tsunami === 1;
    const ts = new Date(p.time).toISOString();
    return {
      id: `usgs:${f.id}`,
      type: 'disaster',
      title: `M${mag.toFixed(1)} Earthquake — ${place}`,
      location: place,
      lat: f.geometry.coordinates[1],
      lng: f.geometry.coordinates[0],
      severity: mag >= 7.5 ? 5 : mag >= 6.5 ? 4 : mag >= 6 ? 3 : 2,
      ts,
      brief: `M${mag.toFixed(1)} earthquake ${place} at ${depth.toFixed(0)} km depth.` +
        (tsunami ? ' Tsunami advisory issued.' : '') +
        (p.alert ? ` PAGER alert: ${p.alert.toUpperCase()}.` : ''),
      stats: [{ label: 'Magnitude', val: 'M' + mag.toFixed(1) }, { label: 'Depth', val: depth.toFixed(0) + ' km' }],
      sources: [{ n: 'USGS', ts, url: p.url || 'https://earthquake.usgs.gov' }],
      tags: ['Earthquake', 'USGS', tsunami ? 'Tsunami' : 'Natural Disaster'],
      live: true
    };
  });
}
