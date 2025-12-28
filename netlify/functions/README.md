# Netlify Serverless Functions

These functions proxy API calls to Venice AI, keeping the API key secure on the server side.

## Environment Variable Setup

To use these functions, you need to set the `VENICE_AI_API_KEY` environment variable in Netlify:

1. Go to your Netlify dashboard
2. Navigate to Site settings → Environment variables
3. Add a new environment variable:
   - Key: `VENICE_AI_API_KEY`
   - Value: Your Venice AI API key

The functions will automatically use this environment variable when handling requests.

