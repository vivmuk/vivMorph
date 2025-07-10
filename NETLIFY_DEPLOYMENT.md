# vivMorph - Netlify Deployment Guide

This guide will help you deploy vivMorph to Netlify with serverless functions for secure API key handling.

## Prerequisites

- GitHub account
- Netlify account (free tier works fine)
- Venice AI API key

## Deployment Steps

### 1. Fork or Clone the Repository

If you haven't already, ensure your code is in a GitHub repository:

```bash
git add .
git commit -m "Add Netlify configuration and serverless functions"
git push origin master
```

### 2. Connect to Netlify

1. Go to [Netlify](https://www.netlify.com/) and sign in
2. Click "New site from Git"
3. Choose GitHub and authorize Netlify
4. Select your `vivMorph` repository
5. Configure build settings:
   - **Build command**: Leave empty (static site)
   - **Publish directory**: `.` (current directory)
   - **Functions directory**: `netlify/functions`

### 3. Configure Environment Variables

1. In your Netlify dashboard, go to **Site settings**
2. Click **Environment variables**
3. Add a new variable:
   - **Key**: `VENICE_API_KEY`
   - **Value**: Your Venice AI API key (e.g., `ntmhtbP2fr_pOQsmuLPuN_nm6lm2INWKiNcvrdEfEC`)

### 4. Deploy

1. Click **Deploy site**
2. Wait for the deployment to complete
3. Your site will be available at a URL like `https://your-site-name.netlify.app`

## Features

### Secure API Key Handling
- Your Venice AI API key is stored securely in Netlify's environment variables
- No API key is exposed in the client-side code
- Serverless functions handle all API calls

### Serverless Functions
- **`/.netlify/functions/optimize-prompt`**: Optimizes prompts using Venice AI
- **`/.netlify/functions/transform-image`**: Transforms images using FLUX.1

### Automatic Deployment
- Any push to your GitHub repository will trigger a new deployment
- Netlify automatically handles the build and deployment process

## Local Development

To test locally with Netlify CLI:

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Link your local repo to the Netlify site
netlify link

# Start local development server
netlify dev
```

This will start a local server that mimics the Netlify environment, including the serverless functions.

## Environment Variables for Local Development

Create a `.env` file in your project root:

```env
VENICE_API_KEY=your_api_key_here
```

## Troubleshooting

### Functions Not Working
- Ensure your `netlify.toml` file is in the project root
- Check that functions are in the `netlify/functions` directory
- Verify environment variables are set in Netlify dashboard

### API Errors
- Check the Netlify function logs in the dashboard
- Ensure your Venice AI API key is valid and has sufficient credits
- Verify the API endpoints are correct

### Storage Issues
- The app uses browser localStorage for saving images
- If storage is full, users can clear saved images using the storage management panel

## Security Features

- CORS headers are properly configured
- API key is never exposed to the client
- All API calls go through secure serverless functions
- Headers include security best practices

## Performance

- Static site deployment for fast loading
- Serverless functions scale automatically
- Image processing is handled server-side
- Client-side compression for local storage

## Support

If you encounter issues, check:
1. Netlify function logs in the dashboard
2. Browser console for client-side errors
3. Network tab to see API call responses
4. Environment variables are correctly set

## Updating the Site

To update your deployed site:

1. Make changes to your code
2. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Your update message"
   git push origin master
   ```
3. Netlify will automatically redeploy

Your vivMorph app is now securely deployed with serverless functions handling all API interactions! 