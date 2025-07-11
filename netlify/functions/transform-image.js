import fetch from 'node-fetch';

export const handler = async (event, context) => {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Hardcoded API key
    const API_KEY = 'ntmhtbP2fr_pOQsmuLPuN_nm6lm2INWKiNcvrdEfEC';

    // Parse the request body
    const { image_url, prompt } = JSON.parse(event.body);
    
    if (!image_url || !prompt) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Image and prompt are required' }),
      };
    }

    // Extract base64 from data URL if needed
    let imageBase64 = image_url;
    if (image_url.startsWith('data:image/')) {
      imageBase64 = image_url.split(',')[1];
    }

    // Make the request to Venice AI using the correct endpoint
    const response = await fetch('https://api.venice.ai/api/v1/image/edit', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt,
        image: imageBase64
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Venice AI API Error:', data);
      return {
        statusCode: response.status,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: data.error || 'API request failed' }),
      };
    }

    // Return the transformed image
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_url: `data:image/png;base64,${data.image}`
      }),
    };

  } catch (error) {
    console.error('Error transforming image:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Internal server error: ' + error.message }),
    };
  }
}; 