const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.VENICE_AI_API_KEY || process.env.VENICE_API_KEY;
const MAX_BODY_SIZE = 50 * 1024 * 1024; // 50MB max request body

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
};

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
}

function jsonResponse(res, status, data) {
  cors(res);
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', chunk => {
      size += chunk.length;
      if (size > MAX_BODY_SIZE) { req.destroy(); reject(new Error('Request body too large')); return; }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString()));
    req.on('error', reject);
  });
}

async function handleListModels(req, res) {
  if (!API_KEY) return jsonResponse(res, 500, { error: 'API key not configured.' });

  try {
    const response = await fetch('https://api.venice.ai/api/v1/models?type=inpaint', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${API_KEY}` }
    });
    const data = await response.json();
    cors(res);
    res.writeHead(response.status, {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300'
    });
    res.end(JSON.stringify(data));
  } catch (error) {
    jsonResponse(res, 500, { error: 'Failed to fetch models', message: error.message });
  }
}

async function fetchWithRetry(url, options, maxRetries = 2) {
  let response, lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      response = await fetch(url, options);
      if (response.ok || (response.status < 500 && response.status !== 429)) return response;
      lastError = `Venice API returned ${response.status}`;
      if (attempt < maxRetries) await new Promise(r => setTimeout(r, (attempt + 1) * 1500));
    } catch (err) {
      lastError = err.message;
      response = null;
      if (attempt < maxRetries) await new Promise(r => setTimeout(r, (attempt + 1) * 1500));
    }
  }
  return response; // return last response even if error, caller will handle
}

async function handleVeniceResponse(response, res) {
  if (!response) {
    return jsonResponse(res, 502, { error: 'Venice API unreachable after retries' });
  }
  if (!response.ok) {
    let errorMsg = `Venice API returned ${response.status}`;
    try {
      const text = await response.text();
      try {
        const data = JSON.parse(text);
        errorMsg = data.message || data.error || data.detail || (data.errors ? JSON.stringify(data.errors) : null) || errorMsg;
      } catch {
        if (text && text.length < 500) errorMsg = text;
      }
    } catch {}
    return jsonResponse(res, response.status, { error: errorMsg });
  }
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    const data = await response.json();
    jsonResponse(res, 200, data);
  } else {
    const imageBuffer = await response.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    jsonResponse(res, 200, { image: base64Image });
  }
}

async function handleImageEdit(req, res) {
  if (!API_KEY) return jsonResponse(res, 500, { error: 'API key not configured.' });

  try {
    const body = JSON.parse(await readBody(req));

    const venicePayload = {
      prompt: body.prompt,
      image: body.image,
    };
    if (body.modelId) venicePayload.modelId = body.modelId;
    if (body.aspect_ratio) venicePayload.aspect_ratio = body.aspect_ratio;
    if (body.mask) venicePayload.mask = body.mask;

    const response = await fetchWithRetry('https://api.venice.ai/api/v1/image/edit', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(venicePayload)
    });

    await handleVeniceResponse(response, res);
  } catch (error) {
    jsonResponse(res, 500, { error: 'Internal server error', message: error.message });
  }
}

async function handleImageMultiEdit(req, res) {
  if (!API_KEY) return jsonResponse(res, 500, { error: 'API key not configured.' });

  try {
    const body = JSON.parse(await readBody(req));

    const venicePayload = {
      prompt: body.prompt,
      images: body.images,
    };
    if (body.modelId) venicePayload.modelId = body.modelId;

    const response = await fetchWithRetry('https://api.venice.ai/api/v1/image/multi-edit', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(venicePayload)
    });

    await handleVeniceResponse(response, res);
  } catch (error) {
    jsonResponse(res, 500, { error: 'Internal server error', message: error.message });
  }
}

async function handleChatCompletions(req, res) {
  if (!API_KEY) return jsonResponse(res, 500, { error: 'API key not configured.' });

  try {
    const body = await readBody(req);
    const response = await fetch('https://api.venice.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: body
    });
    const data = await response.json();
    jsonResponse(res, response.status, data);
  } catch (error) {
    jsonResponse(res, 500, { error: 'Internal server error', message: error.message });
  }
}

function serveStatic(req, res) {
  let filePath = req.url === '/' ? '/index.html' : req.url;
  // Strip query strings
  filePath = filePath.split('?')[0];

  const fullPath = path.join(__dirname, filePath);

  // Security: prevent directory traversal
  if (!fullPath.startsWith(__dirname)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  const ext = path.extname(fullPath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(fullPath, (err, data) => {
    if (err) {
      // SPA fallback: serve index.html for unknown routes
      fs.readFile(path.join(__dirname, 'index.html'), (err2, indexData) => {
        if (err2) {
          res.writeHead(404);
          res.end('Not found');
          return;
        }
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(indexData);
      });
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    cors(res);
    res.writeHead(200);
    res.end();
    return;
  }

  // API routes (compatible with Netlify function paths)
  if (req.url === '/.netlify/functions/list-models' && req.method === 'GET') {
    return handleListModels(req, res);
  }
  if (req.url === '/.netlify/functions/image-edit' && req.method === 'POST') {
    return handleImageEdit(req, res);
  }
  if (req.url === '/.netlify/functions/image-multi-edit' && req.method === 'POST') {
    return handleImageMultiEdit(req, res);
  }
  if (req.url === '/.netlify/functions/chat-completions' && req.method === 'POST') {
    return handleChatCompletions(req, res);
  }

  // Static files
  serveStatic(req, res);
});

// Allow long-running requests (image generation can take 30+ seconds)
server.timeout = 120000; // 2 minutes
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;

server.listen(PORT, () => {
  console.log(`vivMorph server running on port ${PORT}`);
});
