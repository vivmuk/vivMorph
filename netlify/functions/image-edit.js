exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // Get API key from environment variable
  const apiKey = process.env.VENICE_AI_API_KEY || process.env.VENICE_API_KEY;

  if (!apiKey) {
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'API key not configured. Please set VENICE_AI_API_KEY environment variable.' })
    };
  }

  try {
    // Parse the request body
    const requestBody = JSON.parse(event.body);

    // Build the Venice AI request payload
    const venicePayload = {
      prompt: requestBody.prompt,
      image: requestBody.image,
    };

    // Pass through modelId if provided
    if (requestBody.modelId) {
      venicePayload.modelId = requestBody.modelId;
    }

    // Pass through aspect_ratio if provided
    if (requestBody.aspect_ratio) {
      venicePayload.aspect_ratio = requestBody.aspect_ratio;
    }

    // Pass through mask if provided (for region-based inpainting)
    if (requestBody.mask) {
      venicePayload.mask = requestBody.mask;
    }

    // Forward the request to Venice AI API with retry for transient errors
    const maxRetries = 2;
    let response;
    let lastError;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        response = await fetch('https://api.venice.ai/api/v1/image/edit', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(venicePayload)
        });
        // Only retry on 500, 502, 503, 504 (transient server errors)
        if (response.ok || (response.status < 500 && response.status !== 429)) break;
        lastError = `Venice API returned ${response.status}`;
        if (attempt < maxRetries) await new Promise(r => setTimeout(r, (attempt + 1) * 1500));
      } catch (fetchErr) {
        lastError = fetchErr.message;
        if (attempt < maxRetries) await new Promise(r => setTimeout(r, (attempt + 1) * 1500));
      }
    }

    if (!response) {
      return {
        statusCode: 502,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: `Venice API unreachable after ${maxRetries + 1} attempts: ${lastError}` })
      };
    }

    // Handle error responses first — read body as text so we can surface the message
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
      return {
        statusCode: response.status,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: errorMsg })
      };
    }

    // Success — could be JSON or binary image
    const contentType = response.headers.get('content-type');

    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      };
    } else {
      // Binary image response
      const imageBuffer = await response.arrayBuffer();
      const base64Image = Buffer.from(imageBuffer).toString('base64');

      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ image: base64Image })
      };
    }
  } catch (error) {
    console.error('Error proxying request:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Internal server error', message: error.message })
    };
  }
};
