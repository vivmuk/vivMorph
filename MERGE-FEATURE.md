# Dual-Image Merge Feature

## Overview

The vivMorph application now supports a new **Merge Images** mode that allows users to upload two images and create seamless collages with AI-generated merge prompts. This feature works around the limitation of the inpainting model (which can only process one image at a time) by creating a collage that users can then transform.

## How It Works

### 1. Upload Mode Selection
- Users can toggle between **Single Image** and **Merge Images** modes
- The interface adapts based on the selected mode

### 2. Dual Image Upload
- **Left Image**: First image to be merged
- **Right Image**: Second image to be merged
- Both images are validated (file type, size < 10MB)
- Preview thumbnails are shown for uploaded images

### 3. Collage Generation
- When both images are uploaded, the "Generate Collage" button becomes active
- Creates a side-by-side collage using HTML5 Canvas
- Maintains aspect ratios and adds a 20px gap between images
- Maximum height is capped at 512px for optimal processing

### 4. AI-Powered Prompt Generation
- Uses the **mistral-32-24b** vision model from Venice AI
- Analyzes both images to understand their content
- Generates a detailed merge prompt describing how to combine the images
- Focuses on seamless integration, lighting consistency, and visual harmony

### 5. Transformation Workflow
- The collage becomes the "original" image for transformation
- Users can modify the AI-generated prompt
- Standard transformation workflow applies (edit mode, iterations, etc.)

## Technical Implementation

### Key Methods

#### `switchUploadMode(mode)`
- Handles switching between single and merge modes
- Resets application state
- Shows/hides relevant UI elements

#### `handleLeftImageUpload(event)` / `handleRightImageUpload(event)`
- Process individual image uploads
- Validate files and create previews
- Check if collage generation is ready

#### `generateCollage()`
- Main orchestration method
- Creates collage using `createCollage()`
- Generates merge prompt using `generateMergePrompt()`
- Transitions to edit screen

#### `createCollage(leftImage, rightImage)`
- Uses HTML5 Canvas for image manipulation
- Calculates optimal dimensions maintaining aspect ratios
- Creates side-by-side layout with gap
- Returns base64 encoded PNG

#### `generateMergePrompt(leftImage, rightImage)`
- Calls Venice AI vision model API
- Sends both images for analysis
- Returns detailed merge instructions
- Includes fallback prompt for error handling

### API Integration

```javascript
// Vision model call for prompt generation
const response = await fetch('https://api.venice.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
        'Authorization': 'Bearer ntmhtbP2fr_pOQsmuLPuN_nm6lm2INWKiNcvrdEfEC',
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        model: 'mistral-32-24b',
        messages: [
            {
                role: 'system',
                content: 'You are an expert at analyzing images and creating detailed prompts for seamless image merging...'
            },
            {
                role: 'user',
                content: [
                    { type: 'text', text: 'Analyze these two images...' },
                    { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${leftImage}` } },
                    { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${rightImage}` } }
                ]
            }
        ],
        max_tokens: 300,
        temperature: 0.7
    })
});
```

## User Experience

### Workflow
1. **Select Mode**: Choose "Merge Images" from the upload mode toggle
2. **Upload Images**: Upload left and right images with previews
3. **Generate Collage**: Click to create collage and get AI prompt
4. **Review Prompt**: AI suggests how to merge the images
5. **Modify Prompt**: Edit the prompt if needed
6. **Transform**: Use standard transformation workflow
7. **Iterate**: Use edit mode to refine results

### UI Elements
- **Mode Toggle**: Switch between single and merge modes
- **Dual Upload Areas**: Separate upload buttons for left/right images
- **Preview Thumbnails**: Show uploaded images
- **Generate Button**: Creates collage when both images are ready
- **Merge Tips**: Contextual help for merge mode
- **Merge Preset**: Quick preset button for merge transformations

## Example Prompts

The AI generates prompts similar to this example:

> "Create a cohesive image by combining the following elements into a single scene:
> 
> 1. The woman in the light pink crop top and blue jeans from the left image.
> 2. The blue boat from the right image, positioned in front of her, as if she is standing on the shore looking at it.
> 3. The serene coastal landscape from the right image as the background, including the calm sea, distant hills, and clear sky with scattered clouds.
> 4. Replace the city background behind the woman with the coastal scenery, ensuring the woman appears to be standing on a beach or near the water's edge.
> 5. Make sure the lighting and shadows are consistent throughout the image, giving it a natural and harmonious look."

## Benefits

1. **Workaround Limitation**: Enables multi-image processing despite model constraints
2. **AI Assistance**: Vision model provides intelligent merge suggestions
3. **User Control**: Users can modify AI-generated prompts
4. **Seamless Integration**: Fits into existing transformation workflow
5. **Visual Feedback**: Preview thumbnails and collage generation
6. **Error Handling**: Graceful fallbacks for API failures

## Testing

Use `test-merge.html` to verify:
- Canvas collage creation
- File validation
- Base64 conversion methods
- Error handling

## Future Enhancements

- Multiple collage layouts (grid, overlay, etc.)
- Drag-and-drop image positioning
- Real-time collage preview
- Advanced merge algorithms
- Batch processing for multiple image pairs 