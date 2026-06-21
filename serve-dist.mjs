// Servidor estático temporal para verificar el build con la CSP de producción.
// NO se commitea — reproduce las cabeceras de vercel.json sobre dist/.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const ROOT = join(process.cwd(), 'dist');
const PORT = 4322;

const CSP = "default-src 'self'; script-src 'self' https://www.googletagmanager.com; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://*.supabase.co https://images.unsplash.com https://*.googleusercontent.com https://www.googletagmanager.com https://www.google-analytics.com; frame-src https://www.youtube.com https://www.google.com https://webpay3g.transbank.cl https://webpay3gint.transbank.cl; connect-src 'self' https://*.supabase.co https://www.google-analytics.com https://analytics.google.com; object-src 'none'; base-uri 'self'; form-action 'self' https://webpay3g.transbank.cl https://webpay3gint.transbank.cl;";

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml',
};

createServer(async (req, res) => {
  try {
    let path = decodeURIComponent((req.url || '/').split('?')[0]);
    if (path.endsWith('/')) path += 'index.html';
    if (!extname(path)) path += '/index.html';
    const file = normalize(join(ROOT, path));
    if (!file.startsWith(ROOT)) { res.writeHead(403).end('forbidden'); return; }
    const body = await readFile(file);
    res.writeHead(200, {
      'Content-Type': TYPES[extname(file)] || 'application/octet-stream',
      'Content-Security-Policy': CSP,
    });
    res.end(body);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/html' }).end('<h1>404</h1>');
  }
}).listen(PORT, () => console.log(`dist served with prod CSP on http://localhost:${PORT}`));
