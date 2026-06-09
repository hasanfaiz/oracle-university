import http from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(process.cwd(), process.env.SERVE_DIR || 'dist');
const host = process.env.HOST || '127.0.0.1';
const port = Number(process.env.PORT || 8080);

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

function safeResolve(urlPath) {
  const decodedPath = decodeURIComponent(urlPath.split('?')[0]);
  const normalizedPath = normalize(decodedPath).replace(/^([/\\])+/, '');
  const candidate = resolve(root, normalizedPath);
  return candidate.startsWith(root) ? candidate : null;
}

function findFile(requestUrl) {
  let filePath = safeResolve(new URL(requestUrl, `http://${host}:${port}`).pathname);
  if (!filePath) return null;

  if (existsSync(filePath) && statSync(filePath).isDirectory()) {
    filePath = join(filePath, 'index.html');
  }

  if (existsSync(filePath) && statSync(filePath).isFile()) return filePath;

  const indexCandidate = join(filePath, 'index.html');
  if (existsSync(indexCandidate) && statSync(indexCandidate).isFile()) return indexCandidate;

  const notFound = join(root, '404.html');
  if (existsSync(notFound)) return notFound;

  return null;
}

const server = http.createServer((req, res) => {
  if (!existsSync(root)) {
    res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('dist folder not found. Run: npm run build');
    return;
  }

  const filePath = findFile(req.url || '/');
  if (!filePath) {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Not found');
    return;
  }

  const type = mime[extname(filePath).toLowerCase()] || 'application/octet-stream';
  const isNotFound = filePath.endsWith('/404.html') || filePath.endsWith('\\404.html');
  res.writeHead(isNotFound ? 404 : 200, {
    'content-type': type,
    'cache-control': 'no-store'
  });
  createReadStream(filePath).pipe(res);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use. Try: PORT=8081 npm run dev`);
    process.exit(1);
  }
  console.error(error);
  process.exit(1);
});

server.listen(port, host, () => {
  console.log(`Oracle University Daily preview running at http://${host}:${port}`);
  console.log(`Serving: ${root}`);
  console.log('Stop server: Control + C');
});
