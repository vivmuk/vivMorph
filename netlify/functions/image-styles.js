// Proxies Venice's style-preset catalog so the client can offer a real style picker.
// GET /.netlify/functions/image-styles  ->  { styles: ["Cinematic", "Watercolor", ...] }
//
// Venice returns { data: ["3D Model", "Analog Film", ...] } from
// GET https://api.venice.ai/api/v1/image/styles — it is not part of the published
// OpenAPI spec, so this is deliberately tolerant about the response shape.
exports.handler = async (event) => {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: cors, body: '' };
  }
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers: cors, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const apiKey = process.env.VENICE_AI_API_KEY || process.env.VENICE_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'API key not configured. Please set VENICE_AI_API_KEY environment variable.' })
    };
  }

  const url = 'https://api.venice.ai/api/v1/image/styles';

  // One retry on transient failures, same policy as the other proxies.
  let response;
  let lastError;
  for (let attempt = 0; attempt <= 1; attempt++) {
    try {
      response = await fetch(url, { headers: { 'Authorization': `Bearer ${apiKey}` } });
      if (response.ok || (response.status < 500 && response.status !== 429)) break;
      lastError = `Venice API returned ${response.status}`;
      if (attempt < 1) await new Promise(r => setTimeout(r, 1200));
    } catch (err) {
      lastError = err.message;
      if (attempt < 1) await new Promise(r => setTimeout(r, 1200));
    }
  }

  if (!response) {
    return {
      statusCode: 502,
      headers: { ...cors, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: `Venice API unreachable: ${lastError}` })
    };
  }

  if (!response.ok) {
    return {
      statusCode: response.status,
      headers: { ...cors, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: `Venice API returned ${response.status}` })
    };
  }

  try {
    const data = await response.json();
    // Tolerate { data: [...] }, { styles: [...] } or a bare array; entries may be
    // plain strings or objects with a name/id.
    const raw = Array.isArray(data) ? data : (data.data || data.styles || []);
    const styles = raw
      .map(s => (typeof s === 'string' ? s : (s && (s.name || s.id))))
      .filter(s => typeof s === 'string' && s.trim())
      .map(s => s.trim());

    return {
      statusCode: 200,
      headers: {
        ...cors,
        'Content-Type': 'application/json',
        // The catalog is stable — let the CDN and the browser hold it.
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800'
      },
      body: JSON.stringify({ styles })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Bad response from Venice', message: err.message })
    };
  }
};
