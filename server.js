const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.VENICE_AI_API_KEY;

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
    req.on('data', chunk => chunks.push(chunk));
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

    const response = await fetch('https://api.venice.ai/api/v1/image/edit', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(venicePayload)
    });

    const contentType = response.headers.get('content-type');

    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      jsonResponse(res, response.status, data);
    } else {
      const imageBuffer = await response.arrayBuffer();
      const base64Image = Buffer.from(imageBuffer).toString('base64');
      jsonResponse(res, response.status, { image: base64Image });
    }
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
  if (req.url === '/.netlify/functions/chat-completions' && req.method === 'POST') {
    return handleChatCompletions(req, res);
  }

  // Static files
  serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log(`vivMorph server running on port ${PORT}`);
});
