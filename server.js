// server.js - Ultra-lightweight zero-dependency HTTP server & cross-device sync engine
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = process.env.PORT || 3000;
const STORAGE_FILE = path.join(__dirname, 'sync_storage.json');

// In-memory sync store backed by file
let syncDb = {};
if (fs.existsSync(STORAGE_FILE)) {
  try {
    syncDb = JSON.parse(fs.readFileSync(STORAGE_FILE, 'utf8'));
  } catch (e) {
    console.error('Failed to load sync storage:', e);
  }
}

function saveDb() {
  try {
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(syncDb, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to save sync storage:', e);
  }
}

// MIME types
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  // CORS Headers for cross-device sync
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  // Sync API: GET /api/sync/:roomId
  if (req.method === 'GET' && pathname.startsWith('/api/sync/')) {
    const roomId = decodeURIComponent(pathname.replace('/api/sync/', ''));
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(syncDb[roomId] || { days: {} }));
    return;
  }

  // Sync API: POST /api/sync/:roomId
  if (req.method === 'POST' && pathname.startsWith('/api/sync/')) {
    const roomId = decodeURIComponent(pathname.replace('/api/sync/', ''));
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        syncDb[roomId] = payload;
        saveDb();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', syncedAt: new Date().toISOString() }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  // Static File Serving
  let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

// Find Local IPv4 addresses
function getLocalIps() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push(iface.address);
      }
    }
  }
  return addresses;
}

server.listen(PORT, '0.0.0.0', () => {
  const localIps = getLocalIps();
  console.log(`=======================================================`);
  console.log(`⚡  Productivity Tracker Server Running!`);
  console.log(`-------------------------------------------------------`);
  console.log(`🖥️  Desktop Local Access: http://localhost:${PORT}`);
  if (localIps.length > 0) {
    console.log(`📱  Android / Mobile Access (Same Wi-Fi):`);
    localIps.forEach(ip => {
      console.log(`    👉 http://${ip}:${PORT}`);
    });
  }
  console.log(`🔄  Real-Time Cloud/Local Sync Endpoint: /api/sync/:roomId`);
  console.log(`=======================================================`);
});
