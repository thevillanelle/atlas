import { fetchJSON } from '../http.js';

// mode=list only returns the pad name as a string (no coordinates), so use mode=normal.
export async function upcomingLaunches(limit = 6) {
  const d = await fetchJSON(`https://ll.thespacedevs.com/2.2.0/launch/upcoming/?format=json&limit=${limit}&mode=normal`, { source: 'spacedevs', timeout: 12000 });
  return (d.results || []).map(l => {
    const lat = parseFloat(l.pad && l.pad.latitude);
    const lng = parseFloat(l.pad && l.pad.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    const provider = (l.launch_service_provider && l.launch_service_provider.name) || 'Provider';
    const rocket = l.rocket && l.rocket.configuration;
    const net = l.net ? new Date(l.net) : null;
    return {
      id: `launch:${l.id}`,
      type: 'launch',
      title: l.name,
      location: (l.pad && l.pad.location && l.pad.location.name) || 'Launch Site',
      lat, lng,
      severity: 2,
      ts: l.net || null,
      upcoming: true,
      brief: `${l.name}. Vehicle: ${(rocket && rocket.full_name) || 'Unknown'}. NET: ${net ? net.toUTCString() : 'TBD'}.`,
      stats: [{ label: 'Vehicle', val: (rocket && rocket.name) || 'TBD' }],
      sources: [{ n: provider, ts: l.net || null }],
      tags: ['Launch', provider],
      live: true
    };
  }).filter(Boolean);
}
