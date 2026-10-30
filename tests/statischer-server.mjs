// Kleiner statischer Server für die Web-App-Tests (nur Node-Bordmittel).
// Liefert _site/ unter /denk-werkstatt/ aus – wie GitHub Pages unter /<repo>/.
// So prüfen die Tests, dass alle Pfade (auch im Service Worker) relativ sind.
//
//   node tests/statischer-server.mjs [port]      Standard: 4173 (oder PORT)

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const WURZEL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '_site');
const BASIS = '/denk-werkstatt/';
const PORT = Number(process.argv[2] || process.env.PORT || 4173);
const TYPEN = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  let p = decodeURIComponent(url.pathname);
  if (p === '/' || p === BASIS.slice(0, -1)) { res.writeHead(302, { Location: BASIS }); return res.end(); }
  if (!p.startsWith(BASIS)) { res.writeHead(404); return res.end('nicht gefunden'); }
  p = p.slice(BASIS.length) || 'index.html';
  if (p.endsWith('/')) p += 'index.html';
  const datei = path.normalize(path.join(WURZEL, p));
  if (!datei.startsWith(WURZEL + path.sep)) { res.writeHead(403); return res.end(); }
  fs.readFile(datei, (err, inhalt) => {
    if (err) { res.writeHead(404); return res.end('nicht gefunden'); }
    res.writeHead(200, {
      'Content-Type': TYPEN[path.extname(datei)] || 'application/octet-stream',
      'Cache-Control': 'max-age=600',          // wie GitHub Pages
    });
    res.end(inhalt);
  });
});
server.listen(PORT, '127.0.0.1', () => console.log('Web-App: http://localhost:' + PORT + BASIS));
