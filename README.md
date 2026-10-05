# vivMorph v2 - AI Image Studio

A mobile-first web app for creating, combining, and editing images with AI, powered by the Venice AI API. Installable as a PWA.

## Features

- **Four tabs**: Create (text to image), Combine (blend 2-3 images into one), Edit (modify a photo with an optional painted mask), About (in-app guide)
- **Live model catalogs**: all models, prices, and limits are fetched from the Venice API at runtime, never hardcoded
- **Grok Imagine 2.0 defaults**: `grok-imagine-image-2-0` for Create, `grok-imagine-image-2-0-edit` for Edit and Combine
- **Mercury prompt optimizer**: optional. Tap the Optimize button to rewrite your prompt with `mercury-2-5`. It only runs when you tap it and always shows a preview before replacing your text. Never automatic.
- **Mobile-first**: bottom tab bar in the thumb zone, safe-area aware, touch targets sized for phones, works great on desktop too

## Setup

### Netlify

1. Set the `VENICE_AI_API_KEY` environment variable in your Netlify site settings.
2. Publish directory is the repo root. No build step.

### Local development

```bash
VENICE_AI_API_KEY=yourkey node server.js
```

Then open http://localhost:3000

## Architecture

- `index.html` - the entire app: four-tab UI, model pickers, Mercury optimizer, mask painting, compare slider, history
- `netlify/functions/` - serverless functions that proxy the Venice API, keeping the API key server-side:
  - `image-generate.js` - POST /image/generate (Create tab)
  - `image-edit.js` - POST /image/edit (Edit tab)
  - `image-multi-edit.js` - POST /image/multi-edit (Combine tab)
  - `chat-completions.js` - POST /chat/completions (Mercury optimizer)
  - `list-models.js` - GET /models with ?type=image|inpaint|text passthrough
  - `upscale.js` - POST /image/upscale
  - `background-remove.js` - POST /image/background-remove
- `server.js` - local dev server that simulates the Netlify function routes
- `sw.js` + `manifest.json` - PWA shell (service worker + install manifest)

## Model notes

- All model lists, prices, aspect ratios, prompt limits, and resolution tiers come from `GET /models` at runtime. New Venice models appear automatically; removed models are dropped from the pickers.
- Single-image edit sends `model`; multi-edit sends `modelId`, per the Venice API contract.
- Resolution tiers (1K, 2K, 4K) and quality tiers (low, medium, high) are shown only for models that support them, based on the live catalog.
- The Combine tab only lists models whose catalog entry has `combineImages: true`.

## Styles

Tailwind is precompiled — the page loads `/styles.css`, not the Tailwind CDN runtime.
After changing classes in `index.html` or rules in `src/styles.css`, rebuild and commit:

```bash
npm install
npm run build:css
```

## Masked edits

Venice's `/image/edit` has no mask input. When a mask is painted in the Edit tab, the
whole photo is sent for editing at its original framing, and the result is blended back
through a feathered copy of the mask on the client, so only the painted area changes.
