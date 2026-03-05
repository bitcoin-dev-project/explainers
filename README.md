# Bitcoin Explainers

Visual explainers that break down how Bitcoin works.

## Episodes

| # | Title | Duration |
|---|-------|----------|
| 1 | Satoshi's Off-By-One Error | 2:20 |
| 2 | How SegWit Addresses Work | 2:09 |
| 3 | SHA-256 Padding *(draft)* | 1:54 |

## Setup

Requires **Node.js 20+**.

```sh
npm install
npm run dev:client
```

Opens at `http://localhost:5173`.

## Project Structure

```
client/src/
  episodes/
    ep1-off-by-one/    # Episode 1: Off-by-one error (15 scenes)
    ep2-segwit/        # Episode 2: SegWit addresses (8 scenes)
    ep3-sha256/        # Episode 3: SHA-256 padding (13 scenes)
  lib/video/           # Shared hooks & animation presets
  pages/               # Home page
scripts/
  generate-voiceover.mjs   # ElevenLabs TTS (needs ELEVENLABS_API_KEY in .env)
  record.mjs               # Playwright video capture + ffmpeg merge
```

## Adding an Episode

1. Create `client/src/episodes/ep<N>-<slug>/`
2. Add `VideoTemplate.tsx` and a `scenes/` folder
3. Register the route in `App.tsx`
4. Add it to the episodes list in `pages/Home.tsx`

## Tech

React, TypeScript, Vite, Framer Motion, GSAP, Tailwind CSS, Three.js

## License

MIT
