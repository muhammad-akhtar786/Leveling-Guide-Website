const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const root = path.resolve(__dirname, '..');
http.createServer((req, res) => {
  let file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
  if (!file.startsWith(root + path.sep) && file !== root) { res.writeHead(403).end(); return; }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file)) { res.writeHead(404).end(); return; }
  const mime = {'.html':'text/html', '.css':'text/css', '.js':'text/javascript', '.webp':'image/webp', '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.txt':'text/plain', '.xml':'application/xml'};
  res.setHeader('Content-Type', (mime[path.extname(file)] || 'application/octet-stream') + ( /\.(html|css|js)$/.test(file) ? '; charset=utf-8' : ''));
  res.setHeader('Cache-Control', 'no-cache');
  let data = fs.readFileSync(file);
  if (/\.(html|css|js|svg)$/.test(file) && /gzip/.test(req.headers['accept-encoding'] || '')) { data = zlib.gzipSync(data); res.setHeader('Content-Encoding', 'gzip'); }
  res.end(data);
}).listen(4173, '127.0.0.1', () => console.log('Serving on http://127.0.0.1:4173'));
