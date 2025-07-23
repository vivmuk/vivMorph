# Merge Functionality Improvement

## Problem
The original merge functionality created a side-by-side collage of two images, but users wanted to create a true unified scene where both subjects appear together naturally, like they're in the same location at the same time.

## Solution
Enhanced the AI prompt generation to focus on creating unified scenes rather than collages.

## Key Changes

### 1. Enhanced Vision Model Prompt
**Before:**
```
"Analyze these two images and create a detailed prompt for merging them into a single, seamless scene. The prompt should describe how to combine elements from both images naturally, maintaining consistent lighting, perspective, and visual harmony."
```

**After:**
```
"Analyze these two images and create a detailed prompt for merging them into a single, unified scene. The goal is to place both subjects together in the same environment, as if they are in the same location at the same time. The prompt should describe how to position both people together naturally, choose the best background from either image, and ensure consistent lighting and perspective. Focus on creating a scene where both individuals appear to be together, like they are on vacation or in the same moment."
```

### 2. Updated System Instructions
**Before:**
```
"Focus on describing the key elements from each image, their positioning, lighting, and how they should be integrated naturally."
```

**After:**
```
"Focus on creating a cohesive composition where both people are positioned together in the same environment, maintaining consistent lighting, perspective, and visual harmony."
```

### 3. Enhanced Fallback Prompt
**Before:**
```
"Create a cohesive image by combining elements from both images into a single, harmonious scene. Maintain consistent lighting and perspective while seamlessly integrating the key subjects and backgrounds from each image."
```

**After:**
```
"Create a unified scene by combining both subjects into a single, cohesive image. Position both people together naturally in the same environment, as if they are in the same location at the same time. Choose the best background from either image and ensure both subjects are properly integrated with consistent lighting, perspective, and visual harmony. Make it look like both people are together in the same moment."
```

## Example Output

### For the street scene images:
**Old Approach:** Would create a collage with both people in separate halves

**New Approach:** Generates prompts like:
> "Create a unified street scene featuring both individuals together. Position the woman in the lime-green dress and the man in the patterned shirt standing together on the cobblestone street. Use the warm evening lighting from the first image as the primary background, incorporating the historic buildings and streetlights. Place both people naturally in the same frame, as if they are walking together or posing for a photo together. Ensure consistent lighting and perspective so it looks like they are in the same moment, sharing the same experience."

## Benefits

1. **True Unity**: Creates scenes where both subjects appear together naturally
2. **Better Context**: Focuses on shared experiences and moments
3. **Natural Positioning**: Suggests how to place both people in the same environment
4. **Vacation-like Results**: Encourages prompts that make it look like people are together
5. **Enhanced User Experience**: More intuitive and expected results

## Technical Implementation

- Increased `max_tokens` from 300 to 400 for more detailed prompts
- Updated system role to emphasize unified scenes
- Enhanced user prompt to focus on togetherness
- Improved fallback prompt for better error handling
- Updated UI text to reflect the new approach

## User Workflow

1. Upload two images in merge mode
2. AI generates a prompt focused on creating a unified scene
3. Users can modify the prompt to fine-tune the positioning
4. Transformation creates a single image with both subjects together
5. Results look like both people are in the same moment, sharing an experience 