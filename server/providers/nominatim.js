import { fetchJSON } from '../http.js';

export async function geocode(query) {
  const data = await fetchJSON(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
    { source: 'nominatim', timeout: 8000 }
  );
  if (!data || !data[0]) return null;
  return {
    lat: parseFloat(data[0].lat),
    lng: parseFloat(data[0].lon),
    display: data[0].display_name.split(',').slice(0, 3).join(',').trim()
  };
}
