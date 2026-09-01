const fs = require('fs');
const http = require('http');
const path = require('path');

const buildDir = path.resolve(__dirname, '..', 'build');
const indexPath = path.join(buildDir, 'index.html');
const port = Number(process.env.PORT || 3001);
const host = process.env.HOST || '0.0.0.0';

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

if (!fs.existsSync(indexPath)) {
  console.error('No existe build/index.html. Ejecuta npm run build antes de iniciar en produccion.');
  process.exit(1);
}

function safeResolve(urlPath) {
  const cleanPath = decodeURIComponent(urlPath.split('?')[0]).replace(/^\/+/, '');
  const requestedPath = path.resolve(buildDir, cleanPath || 'index.html');
  if (!requestedPath.startsWith(buildDir)) {
    return indexPath;
  }
  return requestedPath;
}

const server = http.createServer((req, res) => {
  let filePath = safeResolve(req.url || '/');

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = indexPath;
  }

  const ext = path.extname(filePath).toLowerCase();
  res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');

  if (filePath.includes(`${path.sep}static${path.sep}`)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  } else {
    res.setHeader('Cache-Control', 'no-cache');
  }

  fs.createReadStream(filePath)
    .on('error', () => {
      res.statusCode = 500;
      res.end('Error leyendo archivo');
    })
    .pipe(res);
});

server.listen(port, host, () => {
  console.log(`Sirviendo build en http://${host}:${port}`);
});
