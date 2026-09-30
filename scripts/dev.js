// Local dev server that mirrors Vercel: static files from the repo root, /api/* routed to
// the same handlers Vercel runs (including [param] segments), SPA fallback to index.html.
//   npm run dev            → http://localhost:3000
//   GUARDIAN_API_KEY=... npm run dev
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT) || 3000;

// Load .env.local if present (same file `vercel env pull` writes).
const envFile = path.join(ROOT, '.env.local');
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"]*)"?\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon' };

// Resolve /api/a/b to api/a/b.js, or api/a/[param].js with {param: 'b'}.
function resolveApi(pathname) {
  const parts = pathname.replace(/^\/api\//, '').split('/').filter(Boolean);
  let dir = path.join(ROOT, 'api');
  const query = {};
  for (let i = 0; i < parts.length; i++) {
    const last = i === parts.length - 1;
    const exact = path.join(dir, parts[i] + (last ? '.js' : ''));
    if (existsSync(exact)) { dir = exact; continue; }
    const dynamic = readdirSync(dir).find(f => /^\[.+\](\.js)?$/.test(f) && (last ? f.endsWith('.js') : !f.endsWith('.js')));
    if (!dynamic) return null;
    query[dynamic.replace(/^\[|\](\.js)?$/g, '')] = decodeURIComponent(parts[i]);
    dir = path.join(dir, dynamic);
  }
  return dir.endsWith('.js') ? { file: dir, query } : null;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const t0 = Date.now();
  res.on('finish', () => console.log(`${res.statusCode} ${req.method} ${url.pathname}${url.search} ${Date.now() - t0}ms`));

  if (url.pathname.startsWith('/api/')) {
    const route = resolveApi(url.pathname);
    if (!route) { res.statusCode = 404; return res.end('{"error":"no such endpoint"}'); }
    req.query = { ...Object.fromEntries(url.searchParams), ...route.query };
    const mod = await import(pathToFileURL(route.file).href + `?t=${Date.now()}`);
    return mod.default(req, res);
  }

  let file = path.join(ROOT, decodeURIComponent(url.pathname));
  if (!file.startsWith(ROOT)) { res.statusCode = 403; return res.end(); }
  try {
    if ((await stat(file)).isDirectory()) file = path.join(file, 'index.html');
  } catch {
    file = path.join(ROOT, 'index.html');
  }
  try {
    const body = await readFile(file);
    res.setHeader('Content-Type', TYPES[path.extname(file)] || 'application/octet-stream');
    res.setHeader('Cache-Control', 'no-store');
    res.end(body);
  } catch {
    res.statusCode = 404;
    res.end('not found');
  }
});

server.listen(PORT, () => {
  console.log(`ATLAS dev server → http://localhost:${PORT}`);
  if (!process.env.GUARDIAN_API_KEY) console.log('  (GUARDIAN_API_KEY not set — Guardian feeds will serve fallbacks)');
});
