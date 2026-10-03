# vivMorph v2 — Mobile-First AI Image Studio: Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Rebuild vivMorph as a mobile-first, tab-based AI image studio (Create / Combine / Edit / About) powered by the latest Venice image models — Grok Imagine 2.0 as default — with an optional Mercury 2.5 prompt optimizer (user-triggered, never automatic).

**Architecture:** Single-page vanilla HTML/JS app (no build step), Netlify Functions as the API proxy layer, live model catalog from `GET /models` (never hardcoded), token-driven UI. Mobile-first layout with bottom tab bar in the thumb zone; each tab is a focused flow. Desktop simply widens.

**Tech Stack:** Vanilla HTML/CSS/JS (Tailwind CDN), Netlify Functions (Node 18, `fetch`), Venice API v1 (`/image/generate`, `/image/edit`, `/image/multi-edit`, `/models`), localStorage for prefs.

**Design read (frontend-design-taste skill):** Reading this as: a prosumer creative tool for casual mobile users, with a dark-tech, Linear-inspired, single-accent language, leaning toward token-driven native CSS + Space Grotesk, restrained motion, high mobile ergonomics.

**Dials:** DESIGN_VARIANCE 6 · MOTION_INTENSITY 3 · VISUAL_DENSITY 3.

---

## Verified facts (from live API + docs, 2026-10-03)

### Live model catalog (from `GET /models?type=image` and `?type=inpaint`, pulled today)

**Generation models (for Create tab)** — top picks for the curated list, sorted by the app at runtime; the FULL live list renders, this is just `preferredModelOrder` ranking:

| Model ID | Price | Notes |
|---|---|---|
| `grok-imagine-image-2-0` | 1K $0.07 / 2K $0.10 | **Default Create model** (user directive) |
| `grok-imagine-image-quality` | 1K $0.06 / 2K $0.09 | Grok quality tier |
| `grok-imagine-image` | 1K $0.03 / 2K $0.04 | cheap Grok |
| `flux-2-pro` | $0.03 | strong adherence |
| `qwen-image-3-pro` | 1K $0.05 / 2K $0. 09 | best faces (memory) |
| `seedream-v5-pro` | 1K $0. 06 / 2K $0.11 | |
| `nano-banana-pro` | 1K $0.18 / 2K $0.23 | |
| `gpt-image-2` | 1K $0.27 / 2K $0.51 / 4K $0.84 | expensive |
| `krea-v2-medium` / `luma-uni-1-max` | $0.04 / $0.12 | style refs (generate only) |

**Edit models (`?type=inpaint`)** — all support `combineImages` (verified):

| Model ID | Price | ARs | Prompt limit |
|---|---|---|---|
| `grok-imagine-image-2-0-edit` | 1K $0.07 / 2K $0.10 | 7 | 7500 |
| `grok-imagine-quality-edit` | 1K $0.06 / 2K $0.09 |  |
| `grok-imimagine-edit` | 1K $0.03 / 2K $0. 04 | | 7500 |
| `qwen-image-3-edit` / `qwen-image-3-pro-edit` | $0.04 / $0.05 | 9 | 10000 |
| `nano-banana-pro-edit` | 1K $0.18 / 2K $0.23 / 4K $0.35 | 9 | 32768 |
| `seedream-v5-pro-edit` | 1K $0.06 / 2K $0.11 | | |
| `flux-2-max-edit`, `gpt-image-2-edit` ($0.34+) | | | |

**Text models:** `mercury-2-5` exists and is live (verified in `GET /models?type=text`).

### API quirks (session-verified)
- `/image/generate` → JSON: `data.images[0]` = base64 string. `format` accepted.
- `/image/edit` → expects `model` key; returns **raw PNG or JPEG bytes** (sniff magic bytes). `format` key **rejected** (400).
- `/image/multi-edit` → expects **`modelId`** + `images[]` (base64 array, up to 3); returns raw bytes.
- Resolution-tier models (all Grok family): `aspect_ratio` + `resolution` ("1K"/"2K"). `quality` supported by gpt-image-2-family only.
- `/image/styles` → list of 72 style presets (free GET).
- Edit catalog: `combineImages: true` in `model_spec.constraints` is the multi-edit capability flag.
- Netlify Functions: ~34MB base64 limit per image (client limits at 25MB raw).

---

## Directory map (current → target)

```
vivMorph/
├── index.html                # REWRITE as tab-based mobile-first app (keep app JS patterns)
├── manifest.json             # update theme color to accent, name/desc refresh
┌── sw.js                     # bump cache version
├── netlify/functions/
│   ├── image-generate.js     # NEW — proxy for /image/generate
│   ├── image-edit.js         # keep (already correct: `model` key, dual response shape)
│   ├── image-multi-edit.js   # keep (correct: `modelId` + images[])
│   ├── chat-completions.js   # keep (Mercury 2.5 calls flow through here)
│   ├── list-models.js        # MODIFY — accept ?type=image|inpaint|text passthrough
│   ├── upscale.js, background-remove.js  # keep
│   └── README.md
├── server.js                 # ADD generate route (local dev parity)
├── QUICK-FIX.md              # DELETE — contains a real API key in plaintext!
├── test-merge.html, test-api.html, benchmark.html, benchmark-results/, benchmark-assets/  # DELETE (stale)
├── output/pdf/               # DELETE (stale benchmark PDF)
├── start.bat                 # DELETE (Windows dev helper, unneeded)
└── README.md                 # rewrite for v2
```

---

## Task 1: Create `image-generate.js` Netlify function

**Objective:** Add the missing generation endpoint proxy.

**Files:** Create `netlify/functions/image-generate.js`

**Implementation** — copy `image-edit.js` as skeleton, change:
- Endpoint: `https://api.venice.ai/api/v1/image/generate`
- Validate `prompt` (required, ≤ 40000 chars); NO image required.
- Forward: `model`, `prompt`, `aspect_ratio`, `resolution`, `quality`, `negative_prompt`, `format` (JSON b64 response expected — keep dual-shape sniffing anyway).
- Same retry (≤2 retries on 5xx/429), same error-body passthrough, same CORS.

**Verify:** `node -e "require('./netlify/functions/image-generate.js')"` — no syntax errors.

## Task 2: Update `list-models.js` type passthrough

**Files:** Modify `netlify/functions/list-models.js`

Change the hardcoded `?type=inpaint` to read `event.queryStringParameters.type` (default `inpaint`), validating against an allowlist `['image','inpaint','text']`. Cache-Control 300s. Keep CORS.

**Verify:** request `/…/list-models?type=image` locally via server.js → JSON array with `grok-imagine-image-2-0` present.

## Task 3: Add generate route to `server.js` (local dev parity)

**Files:** Modify `server.js` (the netlify-simulating local server)

Add: `if (req.url === '/.netlify/functions/image-generate' && req.method === 'POST')` → dispatch to `image-generate.js` handler, same as the existing edit routes. Also pass `type` query param through on list-models (matches Task 2).

**Verify:** `node server.js` boots; `curl -X POST localhost:3000/.netlify/functions/image-generate` returns 400 (prompt required) as expected.

## Task 4: Rewrite `index.html` — Mobile-first tab architecture

**Objective:** One screen per concern: **Create / Combine / Edit / About** + global header. This is the heart of the revamp.

**Keep from current codebase** (proven patterns): the VivMorph app-class structure, fetch/error/retry wiring, progress overlay, mask canvas painting, compare slider, history (localStorage), HEIC paste/upload support, dual-view toggle, safe-area handling, Tailwind CDN, Space Grotesk + JetBrains Mono.

**Remove entirely:**
- Presets section (Trump presets, @Aubrey reference) — user directive: remove unnecessary presets
- `modelSuggestion` banner + `autoPickModel` auto-switching logic (auto-switch violates "don't automatically do it" ethos)
- `modeToggleWrap` Single/Multi toggle (superseded by tabs)
- Unused/duplicated drop zones per mode
- `identityModelIds` auto-switch heuristic (keep only a passive hint in model sheet)
- All hover-only interactions on controls (mobile-first: no hover dependency)

**New structure:**

```
<header>  — wordmark + status dot + settings (history, clear data)
<main>   — 4 <section data-tab> panels:
  CREATE: prompt textarea → aspect ratio chips → model sheet (live image catalog) → resolution chips → Generate
  COMBINE: 1–3 image upload stack → prompt → model (live inpaint catalog w/ combineImages flag) → Blend
  EDIT: image upload → prompt → mask tools (brush/eraser/size) → model (live inpaint catalog) → Apply
  ABOUT: how-to for each of the three features, privacy note, cost table per model (live prices)
 ABOUT: pricing transparency + credits
<footer nav> — bottom tab bar: Create · Combine · Edit · About (48px icons + labels, safe-area padded, thumb zone)
```

**Model sheets per tab:**
- Create: `GET /…/list-models?type=image` → render ALL models with live price/name/specs; default `grok-imagine-image-2-0`; sort: default first → curated → cheapest.
- Combine + Edit: `?type=inpaint`; default `grok-imagine-image-2-0-edit`; filter/hide models with `combineImages: false` only in Combine tab.
- Each sheet: name, price, privacy, prompt limit, offline badge, "new" badge for unbenchmark...

(one unknown model...

**Resolution chips:** derived from `model_spec.pricing.resolutions` keys (1K/2K/4K where present) — only shown for models that have them.

**Client validation:** prompt required, ≤ model prompt limit, image ≤ 25MB each, 1–3 images in Combine.

**All text:** ≥13px body, tab labels 11px mono uppercase; single accent color `--c-glow` for active/CTA; hairline borders; `100dvh`; `prefers-reduced-motion` respected.

**Aspect ratios:** chips from `model_spec.constraints.aspectRatios` (default `auto`).

**Verify:** browser screenshot at 360×740, 390×844, 1280×800 — every tab, empty + loaded + error states. Console clean.

## Task 5: Mercury 2.5 prompt optimizer (optional, user-invoked)

**Files:** Modify `index.html` (JS section)

- Button "✨ Optimize with Mercury" next to prompt on each tab; NOT automatic; returns an improved prompt.
- Call: `/…/chat-completions` with `{ model: 'mercury-2-5', messages: [{role:'system', content:'Rewrite this image prompt for maximum visual clarity and intent fidelity. Keep it one paragraph, under 120 words. Return ONLY the prompt, no preamble.'}, {role:'user', content: rawPrompt}], max_tokens: 200, temperature: 0.4 }`.
- **Preview-first flow (user preference: show edits before expensive steps):** on click → call Mercury → show optimized text in a small sheet with **Use it / Keep mine / Edit** options — never auto-replace. Store a per-session `optimizedFor` so a second click re-optimizes the (possibly edited) current text.
- Strip ```json fences if Mercury wraps output (known chat-model quirk).

**Verify:** real Mercury call with a test prompt; sheet shows the result; "Keep mine" restores original.

## Task 6: Update sw.js + manifest.json

- `sw.js`: bump `CACHE_NAME` to `vivmorph-v2`; precache `/`, `/index.html`, `/manifest.json`.
- `manifest.json`: name "vivMorph — AI Image Studio", theme_color → `#7c5bf5`... actually update to the new accent hex once set in Task 4; add 3-tab description; keep SVG data-URI icons.

## Task 7: Delete stale files + security fix

- Delete: `QUICK-FIX.md` (exposes a real Venice API key in plaintext — must be purged from future commits; note: history rewrite is out of scope here, flag to user), `test-merge.html`, `test-api.html`, `benchmark.html`, `benchmark-results/` (5 runs), `benchmark-assets/`, `output/`, `start.bat`.
- Keep `netlify/functions/README.md` if current, else refresh.

## Task 8: README rewrite

- New features overview (3 flows + About), model defaults (Grok Imagine 2.0 family), Mercury optimizer usage, live-catalog behavior, setup (Netlify env var), local dev (`node server.js`), design decisions section.

## Task 9: Verification loop (real API calls)

With server running locally + `VENICE_AI_API_KEY` env var:
1. **Models:** `list-models?type=image` and `?type=inpaint` → grok 2.0 defaults present.
2. **Create:** generate 1 real image with `grok-imagine-image-2-0` (1K, default AR) — assert b64 decodes to a valid WebP/JPEG ≥100KB.
3. **Edit:** real edit call with `grok-imagine-image-2-0-edit` — sniff PNG/JPEG magic bytes.
4. **Combine:** 2-image multi-edit with `modelId` — assert success.
5. **Mercury:** optimize one prompt end-to-end.
6. **Browser QA:** screenshots all tabs × {empty, loaded, error} × {360px, 390px, 1280px}; console error-free.
7. Commit in ~5-8 logical commits.

## Task 10: PR

Branch `vivmorph-v2-mobile-first` → PR to master with plan summary + per-verification evidence (sizes, screenshot paths, API call results).
