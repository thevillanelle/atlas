// Relative time is computed in the browser so CDN-cached feeds never show a frozen "5m ago".
export function timeAgo(ts) {
  const ms = typeof ts === 'number' ? ts : new Date(ts).getTime();
  const diff = Date.now() - ms;
  if (Number.isNaN(diff)) return 'Recent';
  if (diff < 0) {
    const days = Math.floor(-diff / 86400000);
    return days <= 0 ? 'Imminent' : days === 1 ? 'Tomorrow' : `In ${days}d`;
  }
  const m = Math.floor(diff / 60000);
  if (m < 2) return 'Just now';
  if (m < 60) return m + 'm ago';
  const h = Math.floor(m / 60);
  if (h < 24) return h + 'h ago';
  return Math.floor(h / 24) + 'd ago';
}

// Events carry either a fixed label (`age`, e.g. "Structural") or a timestamp (`ts`).
export const eventAge = ev => ev.age || (ev.ts ? timeAgo(ev.ts) : 'Recent');
export const sourceAge = s => s.age || s.a || (s.ts ? timeAgo(s.ts) : '');
