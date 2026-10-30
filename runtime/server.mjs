import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { Readable } from 'node:stream';
import { POST } from './api.mjs';
import { GET } from './config.mjs';

const port = Number(process.env.PORT || 5173);
const host = process.env.HOST || '127.0.0.1';
// Set this to the externally visible HTTPS origin behind a reverse proxy.
// Do not trust arbitrary X-Forwarded-* request headers.
const publicOrigin = process.env.PUBLIC_ORIGIN ? new URL(process.env.PUBLIC_ORIGIN).origin : null;
const assets = new Map([['/', ['index.html', 'text/html; charset=utf-8']], ['/app.js', ['app.js', 'text/javascript; charset=utf-8']], ['/app.css', ['app.css', 'text/css; charset=utf-8']], ['/favicon.svg', ['favicon.svg', 'image/svg+xml']]]);
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, publicOrigin || `http://${req.headers.host || 'localhost'}`);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Cache-Control', 'no-store');
    if (url.pathname === '/api/audit' && req.method === 'POST') {
      const request = new Request(url, { method: 'POST', headers: req.headers, body: Readable.toWeb(req), duplex: 'half' });
      const response = await POST(request);
      res.writeHead(response.status, Object.fromEntries(response.headers));
      if (response.body) Readable.fromWeb(response.body).pipe(res); else res.end();
      return;
    }
    if (url.pathname === '/api/config' && req.method === 'GET') {
      const response = await GET(); res.writeHead(response.status, Object.fromEntries(response.headers)); res.end(await response.text()); return;
    }
    const asset = assets.get(url.pathname);
    if (asset && (req.method === 'GET' || req.method === 'HEAD')) {
      const bytes = await readFile(new URL(`./public/${asset[0]}`, import.meta.url));
      res.writeHead(200, { 'Content-Type': asset[1] }); res.end(req.method === 'HEAD' ? undefined : bytes); return;
    }
    res.writeHead(404, { 'Content-Type': 'application/json' }); res.end('{"error":"Not found"}');
  } catch {
    if (!res.headersSent) res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end('{"error":"The server could not complete this request."}');
  }
});
server.listen(port, host, () => { console.log(`TraceProof is ready: http://${host}:${port}`); console.log('Open Connections to add keys. Ctrl+C stops the server.'); });
server.on('error', e => { console.error(e.code === 'EADDRINUSE' ? `Port ${port} is already in use. Set PORT to another port.` : e.message); process.exitCode = 1; });
