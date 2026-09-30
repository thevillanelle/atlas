import { fetchJSON } from '../http.js';

const COINS = [
  { sym: 'BTC', id: 'bitcoin' }, { sym: 'ETH', id: 'ethereum' }, { sym: 'SOL', id: 'solana' },
  { sym: 'XRP', id: 'ripple' }, { sym: 'ADA', id: 'cardano' }
];

// Crypto (CoinGecko) + FX (open.er-api). Each half fails independently.
export async function marketQuotes() {
  const [crypto, fx] = await Promise.allSettled([
    fetchJSON(`https://api.coingecko.com/api/v3/simple/price?ids=${COINS.map(c => c.id).join(',')}&vs_currencies=usd&include_24hr_change=true`, { source: 'coingecko' }),
    fetchJSON('https://open.er-api.com/v6/latest/USD', { source: 'er-api' })
  ]);
  const items = [];
  if (crypto.status === 'fulfilled') {
    for (const c of COINS) {
      const q = crypto.value[c.id];
      if (!q) continue;
      const ch = q.usd_24h_change || 0;
      items.push({
        sym: c.sym,
        px: q.usd > 100 ? q.usd.toLocaleString('en', { maximumFractionDigits: 2 }) : q.usd.toFixed(4),
        chg: (ch >= 0 ? '+' : '') + ch.toFixed(2) + '%',
        up: ch >= 0
      });
    }
  }
  if (fx.status === 'fulfilled' && fx.value.rates) {
    const r = fx.value.rates;
    if (r.EUR) items.push({ sym: 'EUR/USD', px: (1 / r.EUR).toFixed(4) });
    if (r.GBP) items.push({ sym: 'GBP/USD', px: (1 / r.GBP).toFixed(4) });
    if (r.JPY) items.push({ sym: 'USD/JPY', px: r.JPY.toFixed(2) });
    if (r.CNY) items.push({ sym: 'USD/CNY', px: r.CNY.toFixed(4) });
  }
  return { items, sources: { coingecko: crypto.status === 'fulfilled', fx: fx.status === 'fulfilled' } };
}
