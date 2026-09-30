// Place-name → coordinates lookup shared by the server (pinning articles) and the client.

export const PLACES = {
  Afghanistan:[33.93,67.71],Algeria:[28.03,1.66],Angola:[-11.2,17.87],
  Argentina:[-38.42,-63.62],Australia:[-25.27,133.78],Bangladesh:[23.68,90.35],
  Brazil:[-14.24,-51.93],Cambodia:[12.57,104.99],Canada:[56.13,-106.35],
  Chad:[15.45,18.73],Chile:[-35.68,-71.54],China:[35.86,104.20],
  Colombia:[4.57,-74.30],'DR Congo':[-4.03,21.76],Egypt:[26.82,30.80],
  Ethiopia:[9.15,40.49],France:[46.23,2.21],Gaza:[31.35,34.31],
  Germany:[51.17,10.45],Greece:[39.07,21.82],Haiti:[18.97,-72.29],
  India:[20.59,78.96],Indonesia:[-0.79,113.92],Iran:[32.43,53.69],
  Iraq:[33.22,43.68],Israel:[31.05,34.85],Italy:[41.87,12.57],
  Japan:[36.2,138.25],Jordan:[30.59,36.24],Kenya:[-0.02,37.91],
  Lebanon:[33.85,35.86],Libya:[26.34,17.23],Mali:[17.57,-3.99],
  Mexico:[23.63,-102.55],Morocco:[31.79,-7.09],Myanmar:[21.91,95.96],
  Nepal:[28.39,84.12],Niger:[17.61,8.08],Nigeria:[9.08,8.68],
  Pakistan:[30.38,69.35],Palestine:[31.35,34.31],Peru:[-9.19,-75.02],
  Philippines:[12.88,121.77],Russia:[61.52,105.32],'Saudi Arabia':[23.89,45.08],
  Somalia:[5.15,46.2],'South Africa':[-30.56,22.94],'South Sudan':[6.88,31.31],
  Sudan:[12.86,30.22],Syria:[34.80,38.99],Taiwan:[23.7,120.96],
  Thailand:[15.87,100.99],Turkey:[38.96,35.24],Uganda:[1.37,32.29],
  Ukraine:[48.38,31.17],'United Kingdom':[55.38,-3.44],'United States':[37.09,-95.71],
  USA:[37.09,-95.71],UK:[55.38,-3.44],Venezuela:[6.42,-66.59],
  Vietnam:[14.06,108.28],Yemen:[15.55,48.52],Zimbabwe:[-19.02,29.15],
  Paris:[48.86,2.35],Milan:[45.46,9.19],London:[51.51,-0.13],
  'New York':[40.71,-74.01],Tokyo:[35.69,139.69],
  'San Francisco':[37.77,-122.42],Brussels:[50.85,4.35],Singapore:[1.35,103.82]
};

export const TECH_HUBS = [
  [37.39,-122.08],[47.61,-122.33],[40.71,-74.01],[51.51,-0.13],[52.52,13.40],
  [1.35,103.82],[35.69,139.69],[48.86,2.35],[37.77,-122.42],[43.65,-79.38],
  [55.75,37.62],[-33.87,151.21],[28.61,77.21],[22.54,114.06],[59.33,18.07]
];

// Longest names first so "South Sudan" wins over "Sudan".
const PLACE_NAMES = Object.keys(PLACES).sort((a, b) => b.length - a.length);

export function findPlace(text) {
  if (!text) return null;
  const lower = text.toLowerCase();
  const name = PLACE_NAMES.find(n => lower.includes(n.toLowerCase()));
  return name ? { name, lat: PLACES[name][0], lng: PLACES[name][1] } : null;
}

export function dedupeByTitle(events) {
  const seen = new Set();
  return events.filter(e => {
    const key = e.title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 50);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
