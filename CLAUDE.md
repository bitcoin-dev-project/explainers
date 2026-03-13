# Bitcoin Error Explainer — Animated Video Series

This project creates animated Bitcoin educational video explainers using React + Framer Motion, recorded to MP4 via Playwright + FFmpeg.

## Workspace
- `client/src/episodes/` — each episode is a folder with a `VideoTemplate.tsx` and `scenes/` directory
- `client/src/lib/video/` — shared hooks (`useVideoPlayer`, `useSceneTimer`), animation presets, `DevControls`
- `scripts/` — recording (`record.mjs`) and voiceover generation (`generate-voiceover.mjs`)
- `client/public/audio/` — scene voiceover MP3s
- `references/` — brand guidelines, writing style references

## Episode Format

Each episode is a sequence of **scenes** (React components). Each scene is a **full-screen animation** with timed element reveals.

### Episode Structure
```
ep<N>-<slug>/
├── VideoTemplate.tsx    # Scene orchestrator (durations, audio, layout)
└── scenes/
    ├── Scene1.tsx       # Title scene
    ├── Scene2.tsx       # Opening — start from familiar ground
    ├── ...              # Teaching scenes
    └── SceneN.tsx       # CTA / series teaser
```

### VideoTemplate Pattern
- Define `SCENE_DURATIONS` object: `{ scene1: 6000, scene2: 8000, ... }` (milliseconds)
- Use `useVideoPlayer({ durations: SCENE_DURATIONS })` hook
- Render scenes conditionally inside `<AnimatePresence mode="wait">`
- Include `<DevControls player={player} />` for development playback

### Scene Structure
- Each scene is a standalone React component wrapped in `motion.div` with a scene transition
- Elements animate in sequentially using staggered delays (0.3s, 0.6s, 1.0s, etc.)
- Use viewport-relative units (`vw`, `vh`) for responsive 1920×1080 capture
- Import from `@/lib/video/animations`: springs, easings, sceneTransitions, element animations

## Duration Constraint
- **Total video duration MUST NOT exceed 2 minutes (120 seconds).** Sum all `SCENE_DURATIONS` values — if they exceed 120s, cut scenes or shorten durations. Prefer fewer, tighter scenes over cramming. If the topic can be explained in 60-90 seconds, do it — shorter is better. Keep it simple.
- **Before finalizing an episode**, always verify: `Object.values(SCENE_DURATIONS).reduce((a, b) => a + b, 0) <= 120000`

## Scene Rules
- **Use as many scenes as the topic needs** — no limit on scene count. More scenes with simpler content each is better than fewer dense scenes.
- **One idea per scene.** Each scene teaches ONE concept, shows ONE step, or makes ONE point.
- **Scene 1 = Title scene.** Topic name, part number if applicable.
- **Scene 2 — start from familiar ground.** Don't open with jargon or scary technical terms. Start from something the viewer already understands, then naturally lead into the topic. A cold open on "Merkle proofs" or "SPV clients" loses people instantly. Instead: "A block bundles transactions" → "How do you prove yours is inside?" → introduces the concept. The hook emerges from the progression, not from forcing a dramatic opener. Only use a punchy hook-first opening when the topic is already familiar to the audience.
- **Last scene = CTA** ("Follow @bitcoin_devs") + optional series teaser for the next episode.
- **Scene duration = content density.** Simple text reveal: 6-7s. Diagram building up: 8-10s. Complex multi-step animation: 10-12s. Never exceed 12s unless the scene has a running transformation that needs time to breathe.

## Scene Text Rules (CRITICAL)
These rules are the #1 factor in engagement. The SHA-256 explainer (best performer) averaged **6-10 words per text element**.

- **ONE sentence per scene heading.** Max ~15 words. The animation teaches — the text labels it.
- **Text is a caption for the animation**, not a standalone explanation. The diagram/animation does the teaching. The text just tells the viewer what they're looking at.
- **Progressive reveal** — each scene adds ONE small piece. Like a conversation, not a lecture.
- **Two short text elements are OK when one isn't enough.** A heading + a subtitle. Keep both short (6-10 words each). The goal is clarity, not minimalism for its own sake.
- **No paragraphs on screen.** If you're writing 3+ sentences, you need to split across scenes.
- **Breathing room** — scenes should feel spacious, not dense. Whitespace is content. Let animations breathe with appropriate delays before next elements appear.
- **Use real worked examples** — actual values, actual data, actual calculations. "bitcoin" → 01100010... is better than "the input gets converted to binary."

Bad (too much text in one scene):
> "Bitcoin adjusts mining difficulty every 2016 blocks (~2 weeks). Too fast? Difficulty goes UP. Too slow? Difficulty goes DOWN. It checks: 'How long did the last 2016 blocks take?'"

Good (one sentence + animated visual):
> Text: "Bitcoin retargets every 2016 blocks"
> Animation: timeline of blocks building up, clock counting ~2 weeks, UP/DOWN arrows animating in

## Animation Principles

### Progressive Reveal (The Core Pattern)
Every scene follows the same principle: elements appear **one at a time** with staggered delays. The viewer's eye follows a guided path through the content. Never dump everything on screen at once.

```tsx
// Good: staggered reveals tell a story
<motion.p transition={{ delay: 0.3 }}>  {/* Label appears first */}
<motion.div transition={{ delay: 0.8 }}> {/* Diagram builds next */}
<motion.span transition={{ delay: 1.5 }}> {/* Result appears last */}
```

### Scene Transitions
Use `sceneTransitions` from the shared animation library. Vary transitions between scenes — don't use the same one for every scene. Good defaults:
- `fadeBlur` — title scenes, section openers
- `slideLeft` — forward progression, step-by-step sequences
- `scaleFade` — zooming into detail, "let's look inside"
- `wipe` — clean break between sections

### Element Animation Patterns
- **Flow diagrams**: Input → [Box] → Output pattern with arrows drawing in via `pathLength`
- **Tables/grids**: Rows stagger in one by one, cells highlight on the active step
- **Labels and badges**: `popIn` or `fadeUp` with springs for emphasis
- **Running state**: Show the full data in every scene with the current step's portion highlighted/boxed — viewer always sees where they are in the process
- **SVG line drawing**: Use `pathLength: 0 → 1` for arrows, connections, circuit diagrams

### Timing Guidelines
- Scene intro transition: 0.4-0.6s
- First content element: delay 0.3-0.5s after scene enters
- Subsequent elements: stagger 0.3-0.6s apart
- Final emphasis element: use `springs.bouncy` or `springs.poppy`
- Leave 1-2s of "hold" time at end of scene before auto-advancing (viewer needs time to absorb)

## Visual Style
- Beige/cream background (`var(--color-bg-light)`: #E6D3B3)
- Orange accent (`var(--color-primary)`: #E77F32) for highlights, step numbers, key values
- Dark text (`var(--color-text-primary)`: #1C1C1C)
- Muted blue secondary (`var(--color-secondary)`: #6F7DC1) for accents
- Font: DM Sans for display/body, JetBrains Mono for code/technical data
- Hedgehog characters as mascots (Alice, Bob, Carol — distinct outfit colors)
- Hand-drawn feel: arrows, labeled boxes, simple diagrams
- Bold headers, numbered steps ("Step 1:", "Step 2:")
- Checkmarks and cross marks for comparisons
- Color-coded elements (orange for labels, blue/red for key value highlights)

## Tone & Voice
- Casual-educational, peer-to-peer (teaching alongside, not lecturing)
- Direct address: "Let's see...", "Let's say...", "Now let's look inside..."
- Conversational pacing — scenes flow like someone talking you through it at a whiteboard
- Reactions for emphasis: "Whaaaat!!", "But we're not done yet..."
- ELI5 ethos even on deep technical topics — keep it simple, cut anything that doesn't directly serve understanding
- Never academic or stiff. **Never walls of text.**
- **When in doubt, simplify.** If a concept can be taught without a sub-concept, skip the sub-concept. The goal is one clear takeaway per episode, not comprehensive coverage.

### Visualize Value Sauce (Hooks & Headers ONLY)
Jack Butcher's writing patterns (`references/jackbutcher.md`) apply **only to hooks and headers** — scene 1 title, section header scenes, and key takeaway text. They do NOT apply to teaching scenes.

**Where to use JB style:**
- Scene 1 title text (the opening punch)
- Bold section header text that introduces a new concept
- Final takeaway/punchline lines

**Where NOT to use JB style:**
- Step-by-step teaching scenes — these stay pure ELI5 walkthrough
- Anything with "Step 1:", "Let's look at...", "Now we take..." — that's the teaching voice, keep it conversational and plain

**JB principles (for hooks/headers only):**
- **Compression** — every word earns its place, cut ruthlessly
- **Contrast pairs** — set up tension between two ideas (complexity/clarity, noise/signal)
- **Reframes** — flip a common assumption
- **Land on a noun** — end statements on a concrete word, not a verb or adverb

The teaching voice sounds like someone walking you through it at a whiteboard: "Now let's look inside the black box", "But we're not done yet...", "Step 1: Convert each character". Plain, warm, direct. Don't make it clever — make it clear.

## Analogies
**NEVER force analogies.** Only use one when it maps naturally and genuinely illuminates the concept (restaurant bill → CoinJoin, postdated check → timelock). If no analogy fits cleanly, just explain directly with clear steps and animated diagrams. A bad analogy is WORSE than no analogy.

## Teaching Approaches
1. **Analogy-First** — walk through analogy in early scenes, then map to technical concept (only when analogy fits naturally)
2. **Problem-Solution** — present attack/problem, show danger with character scenarios, introduce fix
3. **Definition-Deep-Dive** — define concept, layer complexity scene by scene, show internals step by step with progressive animations
4. **Dialogue-Driven** — characters ask questions, get answers. Natural Q&A flow. Works great for protocol/system explainers.

## Characters
- Alice, Bob, Carol (Eve/Mallory for attackers)
- Give roles: "Bob (Victim)", "Carol (Attacker)"
- Characters have personality and reactions — animate expressions when possible
- Each character is a hedgehog with a distinct outfit color (see `references/brand-guidelines.md`)
- Character images stored in `client/public/` (alice.png, bob.png, etc.)

## Engagement Techniques (from top performers)

### Key Insight "Highlight Scene"
One scene per episode should visually break the pattern to signal the core takeaway. Different background color (e.g., primary orange), larger text, dramatic spring animation. This is the ONE thing you want people to remember. Mark it with `{/* HIGHLIGHT SCENE */}` comment in code.

### "Why Is This a Big Deal?" Beat
After teaching the mechanism, dedicate a scene to explicitly frame the significance. Don't assume the viewer connects the dots. Tell them why they should care. This scene should feel like a pause — different pacing, maybe a zoom-out or scale change.

### Define by Negation
When introducing a new concept, say what it IS by saying what it ISN'T: "Nostr is a Protocol, not an App nor a platform." Instantly reframes expectations. Use when the audience likely has a wrong mental model.

### Series Teasers
End the second-to-last or last scene with a preview of upcoming content. "Next episode: how events are signed." This drives follows beyond the CTA. Optional — use when the topic naturally has deeper layers.

### Dissection Layout — Pull Apart One Real Value
Take a single real value (address, transaction, hash) and visually dissect it piece by piece across scenes. Arrows point to each segment with labels. Anatomy-poster style. The SegWit episode does this with a bech32 address. The entire episode is one dissection.

### Show Running State
When doing a multi-step transformation, show the full data in every scene with the current step's portion highlighted/boxed. The viewer always sees where they are in the process. Don't just show the output of each step — show it in context of the whole. This is especially powerful in video because you can animate the highlight moving across the data.

### Grid/Table Visuals for Data
When showing character mappings, encoding tables, or number conversions, use animated grid components (rows × columns) with staggered row reveals. Structured data should look structured and build up visually.

### Persistent Panel Pattern
For complex topics, keep a reference diagram visible alongside the main scene content (see EP4 garbled circuits). Split layout: main content on left (`flex-1`), persistent reference panel on right (`30vw`). The reference panel updates its state per scene but stays visible across multiple scenes.

## What Makes Top Performers Work
1. Timeliness — first to explain a hot/new concept visually
2. Visual novelty — topics nobody else has animated
3. Depth-to-accessibility ratio — go deep but stay approachable
4. The "aha moment" — make something people heard of but don't understand click
5. Real examples — actual values, real tool names, real scenarios
6. Smooth animations — progressive reveal feels like magic, keeps viewers watching

## Content Checklist
- Pick a topic people have heard of but don't really understand
- Find a natural analogy (or skip it if none fits)
- Open from what the viewer already knows, then build toward the technical concept
- **One sentence per scene heading, max ~15 words** — if you're writing more, split it
- **Every scene should have animated visuals** — text captions the animation, not the other way around
- Use a real worked example with actual values when possible
- Progressive reveal in every scene — staggered delays, never dump everything at once
- End with CTA on last scene
- Use as many scenes as needed — no limit on count, just stay under 2 minutes total

## Voiceover Script & Audio Sync

**By default, every episode includes voiceover.** When generating a new episode, always produce all deliverables: scenes, voiceover script, ElevenLabs generation script, audio-synced VideoTemplate, AND run the generation script to produce MP3 files.

**Opt-out:** If the user says **"no voice"**, **"no voiceover"**, **"silent"**, or **"no audio"** in their prompt, skip everything in this section — no transcript, no generation script, no audio wiring in VideoTemplate. Just generate the scenes and VideoTemplate without audio.

### 1. Write the Voiceover Transcript

Create a `transcript.txt` in the episode folder. Format:

```
EPISODE <N> - <TITLE>
Voice-over transcript for ElevenLabs
(Each slide is marked with its scene number. Timing will be adjusted later to match animations.)

---

SLIDE 1 - Title (scene1, ~5s)

<Voiceover text for this scene. Conversational, matches the teaching voice.>

---

SLIDE 2 - <Scene name> (scene2, ~8s)

<Voiceover text...>
```

**Voiceover writing rules:**
- **Match the Tone & Voice section** — casual-educational, peer-to-peer, ELI5 ethos
- **One scene = one voiceover paragraph.** The voice narrates what the animation is showing.
- **The voiceover complements the on-screen text**, it does NOT repeat it verbatim. On-screen text is a short label; the voice explains what's happening.
- **Use natural spoken language** — contractions ("let's", "it's", "don't"), direct address ("notice how...", "here's the key..."), conversational connectors ("But here's the thing...", "Now watch what happens...")
- **Estimate duration** — roughly 2.5 words/second for natural speech. A 20-word voiceover ≈ 8s audio.
- **Mark timing cues** when specific phrases must align with animation beats: `// Voice says "and here's the result" at ~3.5s → delay: 3.9`

### 2. Generate the Voiceover Script

Create a `scripts/generate-voiceover-ep<N>.mjs` file (or update `generate-voiceover.mjs`) with the SCENES array for ElevenLabs:

```js
const SCENES = [
  { file: 'scene1.mp3', text: `Episode <N>. <voiceover text>` },
  { file: 'scene2.mp3', text: `<voiceover text>` },
  // ...
];

const OUTPUT_DIR = './client/public/audio/ep<N>-<slug>';
```

Uses ElevenLabs API with voice ID `InRyolULHTXjegISsXuJ`, model `eleven_multilingual_v2`, settings: `{ stability: 0.6, similarity_boost: 0.8, style: 0.3 }`.

### 3. Sync Animation Durations to Audio

**This is critical.** Scene durations must accommodate the voiceover length + animation breathing room.

**Duration formula:** `SCENE_DURATION = audio_length + buffer`
- Buffer = 2-3s for scene transition + hold time
- Comment the audio length next to each duration for future reference

```tsx
const SCENE_DURATIONS = {
  scene1: 13000,    // audio 10.6s — Title
  scene2: 19000,    // audio 16.2s — Opening concept
  scene3: 22000,    // audio 19.5s — Deep explanation
  // ...
};
```

### 4. Wire Up Audio Playback in VideoTemplate

Add `SCENE_AUDIO` array and the audio sync effect to `VideoTemplate.tsx`:

```tsx
import { useEffect, useRef } from 'react';

const SCENE_AUDIO = [
  '/audio/ep<N>-<slug>/scene1.mp3',
  '/audio/ep<N>-<slug>/scene2.mp3',
  // ...
];

// Inside the component:
const audioRef = useRef<HTMLAudioElement | null>(null);

useEffect(() => {
  if (audioRef.current) {
    audioRef.current.pause();
    audioRef.current = null;
  }
  const timer = setTimeout(() => {
    const audio = new Audio(SCENE_AUDIO[currentScene]);
    audio.play().catch(() => {});
    audioRef.current = audio;
  }, 400); // 400ms delay for scene transition
  return () => {
    clearTimeout(timer);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  };
}, [currentScene]);
```

### 5. Align Animation Delays to Voiceover Beats

When the voiceover mentions something specific, the corresponding animation should appear at that moment. Account for the 400ms audio start delay.

```tsx
// Voice says "and here's the result" at ~3.5s in the audio
// Audio starts 400ms after scene enters
// So animation delay = 3.5 + 0.4 = 3.9s
<motion.div transition={{ delay: 3.9 }}>
  Result appears here
</motion.div>
```

**Sync strategy:**
- First pass: write scenes with approximate delays based on word count
- After generating audio: listen to each MP3, note exact timestamps of key phrases
- Adjust animation delays to match (add comments like `// "now let's look inside" @ 4.2s audio`)
- Adjust `SCENE_DURATIONS` to match actual audio lengths + buffer

### Episode Structure (with audio)
```
ep<N>-<slug>/
├── VideoTemplate.tsx    # Scene orchestrator + SCENE_AUDIO + audio sync effect
├── transcript.txt       # Full voiceover script for ElevenLabs
└── scenes/
    ├── Scene1.tsx
    └── ...
```

## Adding a New Episode

All steps below are done automatically when you ask for a new episode. Voiceover steps (2, 3, 5, 9, 10) are skipped if user says "no voice" / "no voiceover" / "silent" / "no audio".

1. Create `client/src/episodes/ep<N>-<slug>/` with `VideoTemplate.tsx` and `scenes/` folder
2. Write the voiceover transcript (`transcript.txt`) — one paragraph per scene
3. Create the ElevenLabs generation script (`scripts/generate-voiceover-ep<N>.mjs`)
4. Define `SCENE_DURATIONS` in VideoTemplate — estimate from voiceover word count (~2.5 words/sec + 2-3s buffer)
5. Add `SCENE_AUDIO` array and audio sync `useEffect` to VideoTemplate
6. Create each `Scene<N>.tsx` — align animation delays to voiceover timing
7. Register in `client/src/App.tsx` routes and `client/src/pages/Home.tsx` episode list
8. Export from `client/src/episodes/index.ts`
9. **Run the generation script** (`node scripts/generate-voiceover-ep<N>.mjs`) to produce all MP3 files — do NOT skip this step, the audio must exist before the user previews
10. Listen to generated audio, fine-tune `SCENE_DURATIONS` and animation delays
11. Preview: `npm run dev:client` → navigate to `#ep<N>`
12. Record: `node scripts/record.mjs`
