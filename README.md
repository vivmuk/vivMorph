# Photo Studio - AI Image Transformation App

A modern, responsive web application that allows users to upload images and transform them using Venice AI's powerful image editing API.

## Features

- **Image Upload**: Support for various image formats (JPEG, PNG, WebP, etc.)
- **AI-Powered Transformations**: Transform images using natural language prompts
- **Preset Transformations**: Quick-access buttons for common transformations
- **Real-time Preview**: Toggle between original and transformed images
- **Modern UI**: Dark theme with beautiful animations and responsive design
- **Secure API Key**: API key stored as environment variable in Netlify
- **Download Support**: Save transformed images directly to your device

## Setup Instructions

### 1. Get Your Venice AI API Key

1. Visit [Venice AI](https://venice.ai) and create an account
2. Navigate to your API settings and generate an API key
3. Keep this key secure - you'll need it to configure the app

### 2. Deploy to Netlify

#### Set Environment Variable

1. Go to your Netlify dashboard
2. Navigate to **Site settings** → **Environment variables**
3. Add a new environment variable:
   - **Key**: `VENICE_AI_API_KEY`
   - **Value**: Your Venice AI API key
4. Redeploy your site for the changes to take effect

The app uses Netlify serverless functions to securely proxy API calls, keeping your API key on the server side.

### 3. Run the Application Locally (Development)

#### Option A: Local HTTP Server (Recommended)
For best results, run a local HTTP server to avoid CORS issues:

```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx http-server

# Using PHP
php -S localhost:8000
```

Then visit `http://localhost:8000` in your browser.

#### Option B: Direct File Access
Simply open the `index.html` file in your web browser.

**Note**: For local development, you'll need to set up the environment variable. For production, deploy to Netlify and configure the environment variable in the Netlify dashboard.

### 4. Test the API (Optional)

Use the included `test-api.html` file to verify your API key works:

1. Open `test-api.html` in your browser
2. Enter your API key and click "Test Models Endpoint"
3. If successful, try uploading an image and testing the transformation

## How to Use

### 1. Upload an Image
- Click the **"Upload Image"** button on the home screen
- Select an image from your device (max 10MB)
- The app will automatically switch to the edit screen

### 2. Transform Your Image
- Enter a transformation prompt in the text field
- Use preset buttons for common transformations:
  - **Studio Ghibli**: Anime art style
  - **Vintage**: Retro photograph look
  - **Black & White**: Monochrome conversion
  - **Colorful**: Enhanced vibrant colors
- Click **"Transform"** to apply the changes

### 3. View Results
- Toggle between **Original** and **Transformed** views
- Compare the results side by side
- The transformation process typically takes 10-30 seconds

### 4. Save Your Work
- Click the **Share** button (export icon) to download the image
- Images are saved in PNG format with timestamp

## Transformation Tips

### Effective Prompts
- **Be specific**: "Change the sky to a sunset" vs "make it pretty"
- **Use descriptive language**: "Add vibrant autumn colors to the trees"
- **Keep it concise**: Shorter prompts often work better

### Example Prompts
- "Convert to black and white with high contrast"
- "Make it look like a painting by Van Gogh"
- "Add snow and winter atmosphere"
- "Change the background to a beach scene"
- "Apply a vintage film filter"
- "Make the colors more vibrant and saturated"

## Technical Details

### Supported Image Formats
- JPEG/JPG
- PNG
- WebP
- GIF (static)
- BMP
- TIFF

### Browser Compatibility
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

### API Integration
- **Endpoint**: `https://api.venice.ai/api/v1/image/edit`
- **Method**: POST
- **Authentication**: Bearer token
- **Max Image Size**: 10MB
- **Response Format**: PNG image

## Model Catalog

The edit-model list is driven by the live Venice catalog (`GET /models?type=inpaint`),
not by a hardcoded allow-list. Every inpaint-capable model Venice exposes on your key is
selectable in both the app and `benchmark.html`, so newly released models — the Grok
Imagine and GPT Image families included — show up without a code change.

Ordering is curated, not restrictive:

1. The default model (`grok-imagine-edit`) is pinned first.
2. Then the known models, in the order listed in `preferredModelOrder` (index.html) /
   `DEFAULT_SET` (benchmark.html): Grok Imagine 2.0, Grok Imagine Quality, Grok Imagine,
   GPT Image 2, GPT Image 1.5, Qwen Image 2, Seedream V5 Pro, Seedream V4.5,
   Wan 2.7 Pro, Flux 2 Max, Nano Banana Pro.
3. Then anything else the catalog returns, cheapest first.

Models with no benchmark run in `benchmark-results/` are tagged **new** in the picker.
Per-model price, privacy tier, prompt character limit, supported aspect ratios, image-combine
support, and quality tiers all come from the API's `model_spec`, so the UI adapts to each
model's real constraints. A built-in fallback list is used only when the catalog can't be
fetched; its specs are estimates and are replaced as soon as the live list loads.

Models exposing `constraints.quality` (e.g. the GPT Image family) render Low/Medium/High
buttons, and the selected tier is forwarded to Venice by both the Netlify functions and the
local `server.js` dev proxy.

## Privacy & Security

- **API Key**: Stored securely as environment variable in Netlify (server-side only)
- **Images**: Processed by Venice AI's secure servers
- **No Data Collection**: This app doesn't collect or store any personal data
- **Local Processing**: All file handling happens in your browser

## Troubleshooting

### Common Issues

**"API Key Required" Error**
- Ensure you've set the `VENICE_AI_API_KEY` environment variable in Netlify
- Check that your key hasn't expired
- Verify the key format (no extra spaces)

**"Image Too Large" Error**
- Reduce image size to under 10MB
- Use image compression tools if needed

**"Transformation Failed" Error**
- Check your internet connection
- Verify your API key is valid and active
- Try a different, simpler prompt
- Ensure the image format is supported
- Use the test page (`test-api.html`) to verify API connectivity

**"401 Unauthorized" Error**
- Double-check your API key is correct
- Ensure there are no extra spaces in the key
- Verify your Venice AI account is active
- Try the test page to validate the key

**Slow Performance**
- Large images take longer to process
- Complex prompts may require more processing time
- Check your internet connection speed

### Getting Help

If you encounter issues:
1. Check the browser console for error messages
2. Verify your API key is correct
3. Try with a different image or prompt
4. Ensure you have a stable internet connection

## Development

### File Structure
```
InPainting/
├── index.html          # Main application file
├── test-api.html       # API testing utility
├── demo.html           # Demo page
├── README.md           # This file
└── (no other files needed!)
```

### Key Components
- **PhotoStudio Class**: Main application logic
- **File Upload Handler**: Processes image uploads
- **API Integration**: Handles Venice AI requests
- **UI Management**: Screen transitions and user feedback
- **Error Handling**: Comprehensive error management

## License

This project is open source and available under the MIT License.

## Credits

- **Venice AI**: Image transformation API
- **Tailwind CSS**: UI styling framework
- **Phosphor Icons**: Icon library
- **Google Fonts**: Plus Jakarta Sans & Noto Sans fonts

## Recent Updates

### Version 1.2 - Live Model Catalog
- **All Venice edit models available**: the picker no longer filters the catalog down to a
  fixed list, so new Grok and GPT edit models appear as soon as Venice ships them
- **Curated ordering + "new" badge**: benchmarked models stay at the top; unbenchmarked ones
  are labelled rather than hidden
- **Fallback list refreshed**: Grok Imagine 2.0, Grok Imagine Quality, GPT Image 2 and
  Seedream V4.5 added for offline/no-catalog runs
- **Dev proxy parity**: `server.js` now sends `model` (not `modelId`) to `/image/edit` and
  forwards the `quality` tier, matching the Netlify functions

### Version 1.1 - API Fix Update
- **Fixed API Format**: Changed from JSON to multipart form-data (resolves 401 errors)
- **Added API Testing**: New `test-api.html` for debugging API issues
- **Improved Error Handling**: Better error messages and logging
- **Enhanced Security**: Safe element access to prevent JavaScript errors
- **Better Loading States**: Improved visual feedback during transformations

---

**Note**: This app requires a valid Venice AI API key to function. The key is stored securely as an environment variable in Netlify and is never exposed to the client-side code. 