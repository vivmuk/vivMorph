# Photo Studio - AI Image Transformation App

A modern, responsive web application that allows users to upload images and transform them using Venice AI's powerful image editing API.

## Features

- **Image Upload**: Support for various image formats (JPEG, PNG, WebP, etc.)
- **AI-Powered Transformations**: Transform images using natural language prompts
- **Preset Transformations**: Quick-access buttons for common transformations
- **Real-time Preview**: Toggle between original and transformed images
- **Modern UI**: Dark theme with beautiful animations and responsive design
- **Local Storage**: Securely stores API key locally
- **Download Support**: Save transformed images directly to your device

## Setup Instructions

### 1. Get Your Venice AI API Key

1. Visit [Venice AI](https://venice.ai) and create an account
2. Navigate to your API settings and generate an API key
3. Keep this key secure - you'll need it to use the app

### 2. Run the Application

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
Simply open the `index.html` file in your web browser. The app will:

1. Prompt you to enter your Venice AI API key on first use
2. Store the key securely in your browser's local storage
3. Be ready to transform images!

### 3. Test the API (Optional)

Use the included `test-api.html` file to verify your API key works:

1. Open `test-api.html` in your browser
2. Your API key is pre-filled - just click "Test Models Endpoint"
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

## Privacy & Security

- **API Key**: Stored locally in your browser only
- **Images**: Processed by Venice AI's secure servers
- **No Data Collection**: This app doesn't collect or store any personal data
- **Local Processing**: All file handling happens in your browser

## Troubleshooting

### Common Issues

**"API Key Required" Error**
- Ensure you've entered a valid Venice AI API key
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

### Version 1.1 - API Fix Update
- **Fixed API Format**: Changed from JSON to multipart form-data (resolves 401 errors)
- **Added API Testing**: New `test-api.html` for debugging API issues
- **Improved Error Handling**: Better error messages and logging
- **Enhanced Security**: Safe element access to prevent JavaScript errors
- **Better Loading States**: Improved visual feedback during transformations

---

**Note**: This app requires a valid Venice AI API key to function. The key is stored locally in your browser and is not transmitted to any third parties other than Venice AI for image processing. 