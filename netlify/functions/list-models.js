exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  const apiKey = process.env.VENICE_AI_API_KEY || process.env.VENICE_API_KEY;

  if (!apiKey) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'API key not configured.' })
    };
  }

  try {
    const type = event.queryStringParameters?.type;
    const allowedTypes = ['image', 'inpaint', 'text'];
    const modelType = allowedTypes.includes(type) ? type : 'inpaint';
    const response = await fetch(`https://api.venice.ai/api/v1/models?type=${modelType}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    const data = await response.json();

    // Venice tags every catalog row with its own `type`. Keep only rows of the
    // requested type so the Edit/Combine pickers never list text-to-image models
    // (and vice versa), and drop rows Venice reports as offline.
    if (response.ok && Array.isArray(data.data)) {
      const filtered = data.data.filter(m => m && m.id && (!m.type || m.type === modelType) && !(m.model_spec && m.model_spec.offline));
      if (filtered.length) data.data = filtered;
    }

    return {
      statusCode: response.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300',
        // Let Netlify's edge serve repeat catalog requests without a cold function call.
        'Netlify-CDN-Cache-Control': response.ok ? 'public, s-maxage=300, stale-while-revalidate=3600' : 'no-store'
      },
      body: JSON.stringify(data)
    };
  } catch (error) {
    console.error('Error fetching models:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to fetch models', message: error.message })
    };
  }
};
