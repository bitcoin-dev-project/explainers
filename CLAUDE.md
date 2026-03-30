# Bitcoin Error Explainer — Animated Video Series

Animated Bitcoin educational explainers using React, recorded to MP4 via Playwright + FFmpeg.

## Workspace
- `client/src/episodes/` — each episode folder has `VideoTemplate.tsx` + custom components
- `client/src/lib/video/` — shared hooks (`useVideoPlayer`), canvas primitives (`CE`, `morph`, `sceneRange`), `DevControls`, animation presets, diagram components
- `scripts/` — recording (`record.mjs`), voiceover generation (`generate-voiceover.mjs`), auto-episode pipeline (`auto-episode.sh`), **visual QA (`visual-qa.mjs`)**
- `client/public/audio/` — scene voiceover MP3s
- `references/` — brand guidelines, writing style references

## Animation Toolkit

We have multiple animation libraries installed. **Do not default to Framer Motion for everything.** Pick the right tool for each episode's core visual.

| Library | Installed | Best for | Import |
|---|---|---|---|
| **Framer Motion** | Yes | Layout animations, enter/exit, springs, morph | `framer-motion` |
| **GSAP** | Yes | Timeline sequences, complex choreography, stagger, text effects | `gsap` (+ `useSceneGSAP` from `@/lib/video`) |
| **Raw CSS @keyframes** | Built-in | Ambient loops (glows, pulses, rotations), GPU-accelerated transforms | Plain CSS |
| **Canvas 2D / WebGL** | Built-in | Pixel-level effects, generative visuals, data viz, heatmaps | `<canvas>` element |
| **SVG animations** | Built-in | Path morphing, line drawing, organic shapes | Inline SVG + Framer Motion or GSAP |

Add via `npm install` if an episode genuinely needs them (don't add speculatively):
- `@react-three/fiber` + `@react-three/drei` + `three` — 3D scenes, particle systems, shaders
- `@react-spring/web` — alternative physics-based springs
- `d3-force` — force-directed network layouts
- `flubber` — SVG shape morphing (interpolate between paths)

**Rule: the episode's core visual should NOT use CE.** CE is fine for supporting text and labels. The thing that makes the episode memorable should use a different technique — GSAP timeline, Three.js scene, React Spring physics, SVG morph, CSS keyframes, or raw canvas.

### Technique Selection Guide — Pick the Right Tool

- **Canvas 2D** — when the concept has a physical or mathematical model: particles, heatmaps, fluid/flow, data grids, collision physics, procedural generation. Canvas gives you `requestAnimationFrame` with per-pixel control every frame. This produces our highest-quality visuals (EP8 SpongeCanvas, EP9 HeatmapCanvas).
- **GSAP timeline** — for choreographed multi-element sequences with precise timing: step-by-step processes, cascading reveals, coordinated animations where element A finishes → element B starts.
- **SVG path morphing** — for shape transformations: one shape becoming another, line-drawing reveals, organic/curved visuals, tree growth.
- **CSS @keyframes** — for ambient loops that run independently: pulsing glows, rotating elements, floating particles. Layer these WITH other techniques for depth.
- **Framer Motion morph()** — for declarative state transitions: element moves from position A to B across scenes. Good for layout changes, not for continuous simulation.
- **Combine techniques.** The best episodes layer multiple: Canvas 2D core + CSS ambient loops + GSAP for supporting choreography.

### Signature Visual Quality Bar

**The #1 priority is teaching clarity.** The visual exists to make the concept click — not to impress with complexity. Sometimes a clean, minimal GSAP sequence teaches better than a 400-line Canvas simulation. Let the concept dictate the complexity, not the other way around.

That said, a visual that's *too* simple (just divs fading in) won't be memorable or engaging. The sweet spot: **as simple as the concept allows, but with enough craft to feel alive and purposeful.** Use these as quality signals, not rigid rules:

1. **An underlying model** — the visual should represent something real (a data structure, a process, a computation), not just decorative shapes. The model can be simple — a Merkle tree growing nodes is a model. A UTXO set with insertions is a model.
2. **Continuous life** — something should feel alive between scene transitions. This can be subtle — a gentle CSS pulse, a slow gradient shift — not everything needs a 60fps particle system.
3. **Multiple modes/states** — the visual should evolve across scenes, not stay static the whole episode. But "evolve" can mean a clean GSAP choreography adding elements step by step — it doesn't have to mean physics mode switches.
4. **Layered rendering** — some depth (subtle glow, shadow, gradient) goes a long way. But clean and minimal beats cluttered and overproduced.
5. **Complexity should match the concept** — a simple concept (fencepost error) needs a simple visual. A complex concept (sponge construction) justifies a complex simulation. Don't force 500 lines when 150 lines teaches it better.

Reference: EP8 `SpongeCanvas.tsx` (497 lines, Canvas 2D — justified by the concept's physical metaphor) and EP9 `HeatmapCanvas.tsx` (321 lines, Canvas 2D — justified by needing to show O(n²) blowup visually). These are the high end. Not every episode needs this level — but no episode should be just CE fade-ins on styled divs.

## Episode Architecture — Single Canvas

All visual elements live in ONE component. `currentScene` drives what's visible. Elements transform and morph — they don't mount/unmount like slides.

```
ep<N>-<slug>/
├── VideoTemplate.tsx    # Single canvas with all elements + scene timing
├── <CustomVisual>.tsx   # The episode's signature animation component
├── constants.ts         # Episode colors, spring configs, data
```

### Core Primitives (`@/lib/video/canvas`)

- **CE** (CanvasElement) — `<CE s={s} enter={2} exit={5}>` — enter/exit lifecycle. **Use for text, labels, captions — NOT for the core visual.**
- **ceThemes** — starter transition presets for CE: `blurIn`, `scalePop`, `slideLeft`, `slideRight`, `clipCircle`, `wipeRight`, `flip`, `rotateIn`, `morphExpand`, `glitch`, `elasticDrop`, `typewriter`. These are examples, not limits. **Every episode should create its own custom CETheme in constants.ts** that matches the episode's mood. Any CSS property Framer Motion can animate works (opacity, scale, x, y, rotate, skew, filter, clipPath, borderRadius, etc).
- **createThemedCE()** — factory for episode-scoped CE with custom transitions:
  ```tsx
  // In your episode — define once, use everywhere:
  const ECE = createThemedCE(ceThemes.blurIn);
  // or custom:
  const ECE = createThemedCE({
    initial: { opacity: 0, scale: 0.3, filter: 'blur(12px)' },
    animate: { opacity: 1, scale: 1, filter: 'blur(0px)' },
    exit: { opacity: 0, x: -50 },
    transition: { type: 'spring', stiffness: 200, damping: 25 },
  });
  // Then: <ECE s={s} enter={2} exit={5}>text</ECE>
  ```
- **morph()** — `<motion.div {...morph(s, { 2: { x: 100 }, 4: { x: 300 } })}>` — scene-driven state transitions. **This should be your primary tool.** Elements stay mounted and transform between states.
- **sceneRange()** — `sceneRange(s, 2, 8)` — boolean helper for conditional rendering.

### The Enter/Exit Trap

CE's default `{ opacity: 0, y: 15 } → { opacity: 1, y: 0 }` is the #1 reason episodes look identical. When everything fades up the same way, the viewer's eye follows the same path in every episode.

**Instead of CE for core elements, try:**
- `morph()` — element stays on screen, transforms between scene states (position, scale, color, rotation)
- GSAP `gsap.timeline()` — choreograph multi-element sequences with precise timing
- React Spring `useSpring` / `useSprings` — chain physics-based animations
- Three.js `useFrame` — continuous per-frame animation for 3D or particle effects
- SVG `pathLength` + `d` attribute morphing — shapes that transform into other shapes
- CSS `@keyframes` — ambient animations that run independently of scene changes
- Framer Motion `useAnimationControls` — imperative control when declarative CE isn't enough

### Key Principles
- **No AnimatePresence on scenes.** Individual `CE` elements handle their own enter/exit.
- **Elements persist across scenes.** A Merkle tree built in scene 3 stays visible in scene 5 without rebuilding.
- **Use `morph()` for elements that change position/style across scenes.** Much more dynamic than fade-between-slides.
- **Layout with `absolute` positioning.** Since everything is on one canvas, use `absolute` + flexbox for positioning. Elements can overlap naturally.
- **Children can have their own delays.** `CE` controls when the container mounts; children handle their own staggered reveals inside.

### VideoTemplate Pattern
```tsx
const SCENE_DURATIONS = { scene1: 6000, scene2: 8000, scene3: 10000 };

export default function VideoTemplate() {
  const player = useVideoPlayer({ durations: SCENE_DURATIONS });
  const s = player.currentScene;
  return (
    <div className="w-full h-screen overflow-hidden relative" style={{ backgroundColor: EP_COLORS.bg }}>
      {/* Core visual — uses morph, GSAP, Three.js, etc. NOT just CE */}
      <motion.div {...morph(s, { 0: { scale: 0.5 }, 3: { scale: 1, x: -200 }, 6: { x: 0 } })}>
        <SignatureVisual scene={s} />
      </motion.div>

      {/* Supporting text — CE is fine here */}
      <CE s={s} enter={1} exit={3} delay={0.3}>
        <h2>Short caption</h2>
      </CE>

      <DevControls player={player} />
    </div>
  );
}
```

## Camera System — Cinematic Pan/Zoom (`@/lib/video/camera`) ⭐ PRIMARY

**Use Camera for all new episodes.** Content lives on a large canvas (size it to fit — 300vw×200vh, 500vw×300vh, whatever you need). Camera pans and zooms freely between zones, creating dynamic, cinematic movement. A **dev minimap** (bottom-right in dev mode) shows the viewport position on the canvas and catches off-screen content.

```tsx
import { Camera, focus, fitRect } from '@/lib/video';

const ZONES = [
  { label: 'A', x: 0, y: 0, w: 90, h: 80, color: '#3b82f6' },
  { label: 'B', x: 120, y: 0, w: 80, h: 80, color: '#ef4444' },  // 30vw gap from A
  { label: 'C', x: 120, y: 110, w: 80, h: 70, color: '#22c55e' }, // 30vh gap from B
];

const SHOTS = {
  0: { x: 0, y: 0, scale: 1 },       // Zone A wide
  2: focus(45, 30, 2.0),               // Zoom into Zone A detail
  4: { x: 0, y: 0, scale: 1 },        // Pull back
  5: focus(160, 40, 1.2),              // Pan to Zone B
  7: focus(160, 145, 1.5),             // Pan DOWN to Zone C + zoom
  9: focus(160, 40, 1.0),              // BACKTRACK to Zone B
  11: fitRect(0, 0, 210, 190),         // FINAL: reveal entire canvas
};

<Camera scene={s} shots={SHOTS} width="250vw" height="200vh" zones={ZONES}>
  {/* All content stays mounted — no sceneRange! Needed for backtracking + final reveal */}
  <TitleVisual style={{ position: 'absolute', left: '5vw', top: '5vh' }} scene={s} />
  <CoreVisual style={{ position: 'absolute', left: '125vw', top: '5vh' }} scene={s} />
  <DetailVisual style={{ position: 'absolute', left: '125vw', top: '115vh' }} scene={s} />
</Camera>

{/* Text captions — OUTSIDE Camera, in screen space (always visible) */}
<ECE s={s} enter={0} exit={2}>Title text</ECE>
```

### How It Works
- Content placed at **absolute positions** on a large canvas (vw/vh units)
- Camera **pans and zooms** per scene — free-form x, y, scale, rotate
- `focus(cx, cy, scale)` — centers a canvas point on screen (replaces manual math)
- `fitRect(x, y, w, h)` — auto-fits a canvas region in the viewport with padding
- **Dev minimap** shows viewport position — green = good, red = past canvas edge
- `zones` prop marks content regions on the minimap for visual verification

### Shot Helpers — Use These Instead of Manual Math
```tsx
// Center canvas point (45vw, 30vh) on screen at 2x zoom:
focus(45, 30, 2.0)
// → { x: '-40vw', y: '-10vh', scale: 2 }

// Place canvas point at a specific screen position:
focus(45, 30, { scale: 1.5, screenX: 30, screenY: 25 })

// Auto-fit a rect with 10% padding (guaranteed visible):
fitRect(100, 10, 80, 60)

// Check if a rect is visible in a shot (0-1):
visibility({ x: 100, y: 10, w: 80, h: 60 }, currentShot)
```

### The Final Reveal Pattern ⭐ REQUIRED

**Every episode's LAST SCENE must zoom out to show the entire canvas.** This is the visual payoff — the viewer sees all the pieces they learned about as one connected picture.

```tsx
// Final scene: reveal everything
const SHOTS = {
  // ... earlier shots zoom in/out of zones ...
  [lastScene]: fitRect(0, 0, canvasW, canvasH, { pad: 5 }),  // show it all
};
```

The reveal works because you've been building a mural the whole time but only showing one piece at a time. The zoom-out is the "aha" — everything connects.

### What Makes Camera Movement Dynamic (NOT a slideshow)
1. **Backtrack** — revisit earlier zones (scene 10 goes back to Zone B after Zone C)
2. **Vertical pans** — don't just go left-right, pan up/down between zones
3. **Varied scales** — range from `0.3` (way out) to `2.5+` (tight detail). NOT just 1.0→1.3→1.0
4. **Non-linear journey** — the sequence of positions should NOT be monotonically increasing
5. **Pull-back moments** — periodically zoom out to show context before diving into the next detail

### Canvas Zone Planning
Arrange zones on the canvas to support the narrative:
- **Horizontal strip** — left-to-right timeline (blocks, history)
- **Vertical stack** — layers of a protocol stack
- **2×2 grid** — comparing 4 concepts (bugs, approaches)
- **Radial** — center concept with satellite zones around it
- **L-shape / scattered** — creates unpredictable camera paths

Leave **20-30vw gaps** between zones. This prevents neighboring zone content from bleeding into the viewport edges when the camera is focused on a zone. Bigger gaps = cleaner framing, zero cost to animation (spring physics doesn't depend on distance).

### Zoom Tightness Rule
When the camera focuses on a zone, **zoom tight enough that neighboring zones are fully off-screen.** If you can see the edge of another zone, the viewer is distracted by content that doesn't belong to the current moment. Use `focus()` with a high enough scale, or `fitRect()` to fit exactly the zone you want to show. Check the minimap — if the green viewport rect overlaps a neighboring zone marker, zoom tighter.

### Content Stays Mounted — No sceneRange() on Visuals
**Do NOT wrap visual components in `sceneRange()`.** All content stays on the canvas at all times. This is required for:
- **Backtracking** — camera can revisit any zone at any time
- **Final reveal** — the last scene zooms out to show the ENTIRE canvas with all visuals visible

Content that isn't in the current viewport is simply off-screen — the camera controls what's visible, not mounting/unmounting. Use `sceneRange()` ONLY for text captions in screen space (outside Camera), not for visual components inside Camera.

### Dev Minimap
Shows automatically in dev mode (bottom-right, above DevControls):
- Proportional canvas rectangle with zone markers
- Green viewport rect = fully within canvas
- Red viewport rect = extends past canvas edge (content may be off-screen)
- Zone labels dim when out of frame, brighten when visible
- Shot info: scene index, x/y offset, zoom level

### Camera Props
```tsx
<Camera
  scene={s}                    // current scene from useVideoPlayer
  shots={SHOTS}                // scene-indexed camera positions
  width="300vw"                // canvas width (size to fit content)
  height="200vh"               // canvas height
  transition={{                // spring config for camera movement
    type: 'spring',
    stiffness: 50,
    damping: 22,
    mass: 1.8,
  }}
  zones={ZONES}                // named zones for dev minimap
  minimap={true}               // force minimap on/off (default: auto in dev)
>
```

### VideoTemplate Pattern with Camera
```tsx
export default function VideoTemplate() {
  const player = useVideoPlayer({ durations: SCENE_DURATIONS });
  const s = player.currentScene;

  return (
    <div style={{ backgroundColor: EP_COLORS.bg }} data-video="ep7">
      {/* Camera wraps visual content on the canvas */}
      <Camera scene={s} shots={CAMERA_SHOTS} width="300vw" height="200vh"
        zones={ZONES} transition={EP_SPRINGS.camera}>

        {/* All visuals stay mounted — camera controls what's visible */}
        {/* Zone A: Introduction */}
        <BlockStrip scene={s} style={{ position: 'absolute', left: '5vw', top: '10vh' }} />

        {/* Zone B: Core concept (camera visits in scenes 5-9 AND backtracks in 16) */}
        <UTXOHashmap scene={s} style={{ position: 'absolute', left: '130vw', top: '10vh' }} />

        {/* Zone C: Resolution */}
        <HexRibbon scene={s} style={{ position: 'absolute', left: '260vw', top: '10vh' }} />
      </Camera>

      {/* Text captions in screen space (outside Camera) */}
      <ECE s={s} enter={0} exit={1} style={{ position: 'absolute', top: '30vh', left: '50vw' }}>
        <h1>Episode Title</h1>
      </ECE>

      <DevControls player={player} />
    </div>
  );
}
```

## Automated Visual QA (`scripts/visual-qa.mjs`)

**Run after building any episode.** Opens the episode in Playwright at 1920×1080, steps through every scene, checks element positions with `getBoundingClientRect()`.

```bash
node scripts/visual-qa.mjs ep11 ./visual-qa-output
```

Reports: **FAIL** (off-screen near-miss), **WARN** (clipped >40%), **INFO** (far-off zones). Generates screenshots + markdown report.

**Do NOT write manual POSITION AUDIT comments** — the automated tool replaces manual math audits.

## Scene Composition — No Single-Element Episodes
**The #1 quality killer is one visual element staying on screen for the entire video** with only camera moves and text changes around it. This makes the episode feel like a tech demo, not an explainer. Each act should have its own distinct visual composition:

- **Different scenes = different visual elements.** A UTXO ledger visible in scenes 3-8 should NOT still be the main element in scenes 14-20. Introduce new visuals for each act.
- **Build, climax, clear, rebuild.** Show a concept → dramatic moment → clear the canvas → introduce the next concept with fresh visuals. The viewer needs visual "chapter breaks."
- **Camera movement supplements, it doesn't substitute.** Zooming and panning around one static layout is NOT the same as having distinct scene compositions. Camera enhances — it doesn't replace scene design.
- **Rule of thumb:** No single custom component should be visible for more than ~40% of the episode. If it is, the episode needs more visual variety.
- **Each act gets its own visual centerpiece.** If the episode has 4 acts, that's 4 different primary visuals, not 1 visual with 4 camera angles.

## Scene Rules
- **One idea per scene.** One concept, one step, one point.
- **Scene 1 = Title.** Scene 2 = start from familiar ground — don't open with jargon. A cold open on "Merkle proofs" loses people instantly. Instead: "A block bundles transactions" → "How do you prove yours is inside?" The hook emerges from the progression, not from forcing a dramatic opener. Only use a punchy hook-first opening when the topic is already familiar to the audience.
- **Last scene = CTA** ("Follow @bitcoin_devs") + optional series teaser for next episode.
- **Scene duration = content density.** Simple text reveal: 6-7s. Diagram building: 8-10s. Complex multi-step animation: 10-12s. Never exceed 12s unless the scene has a running transformation that needs time to breathe.
- **Use as many scenes as needed.** More scenes with less content each > fewer dense scenes.

## Text Rules
The animation teaches. Text captions it. The SHA-256 explainer (best performer) averaged **6-10 words per text element**. These are non-negotiable:
- **ONE sentence per scene heading.** Max ~15 words.
- **Two short text elements are OK** — a heading + a subtitle. Keep both short (6-10 words each).
- **No paragraphs on screen.** 3+ sentences = split across scenes.
- **Use real values.** "bitcoin" → `01100010...` beats "the input gets converted to binary."
- **Progressive reveal.** Each scene adds ONE piece. Like a conversation, not a lecture.
- **Breathing room.** Whitespace is content. Let animations breathe.

Bad (too much text in one scene):
> "Bitcoin adjusts mining difficulty every 2016 blocks (~2 weeks). Too fast? Difficulty goes UP. Too slow? Difficulty goes DOWN."

Good (one sentence + animated visual):
> Text: "Bitcoin retargets every 2016 blocks"
> Animation: timeline of blocks building up, clock counting ~2 weeks, UP/DOWN arrows animating in

## Timing Guidelines
- Scene intro transition: 0.4-0.6s
- First content element: delay 0.3-0.5s after scene enters
- Subsequent elements: stagger 0.3-0.6s apart
- Final emphasis element: use `springs.bouncy` or `springs.poppy`
- Leave 1-2s of "hold" time at end of scene before auto-advancing (viewer needs time to absorb)
- **Rhythm: fast-fast-SLOW** — quick setup moves, then slow down on the key insight

## Tone & Voice
- Casual-educational, peer-to-peer. ELI5 ethos on deep topics.
- Direct address: "Let's see...", "Now let's look inside..."
- Conversational pacing. Never academic or stiff.
- **Never force analogies.** Only when they map naturally and illuminate the concept.
- Hooks and headers use Jack Butcher style (compression, contrast pairs, reframes — see `references/jackbutcher.md`). Teaching scenes stay plain and clear.

## Visual Identity

### Brand Constants (the thread between episodes)
- Primary accent: BDP Orange `#EB5234`
- Fonts: Montserrat Bold (`--font-display`), Quicksand (`--font-body`), JetBrains Mono (`--font-mono`)
- Hedgehog characters (Alice, Bob, Carol) when characters appear
- `useVideoPlayer` + `DevControls` for playback

### Color Palette Modes (`--palette` flag)

The `--palette` flag on `auto-episode.sh` controls color constraints:
- **`grayscale`** — black, white, grays only. One accent color allowed for emphasis. Stark, data-focused look.
- **`brand`** — BDP brand palette only (see `references/brand-guidelines.md`). Orange, blue, green, pink, purple + neutrals.
- **`free`** (default) — no restrictions. Pick whatever serves the mood.

Every episode defines its palette in `EP_COLORS` in `constants.ts`. The `--palette` flag guides what goes in it.

### Everything Else Must Vary Per Episode

**Each episode defines its own palette** in `constants.ts`:
```ts
// ep7 constants.ts — example
export const EP_COLORS = {
  bg: '#0F172A',          // dark slate — security/attack mood
  bgAlt: '#1E293B',       // slightly lighter for sections
  accent: '#EF4444',      // danger red
  accentAlt: '#F97316',   // warning orange
  highlight: '#FDE68A',   // gold for key reveals
  muted: '#64748B',       // de-emphasized text
  text: '#F1F5F9',        // light text on dark bg
};
```

**Each episode defines its own motion personality** in `constants.ts`. Don't use the same spring config for every episode — match the animation feel to the topic:
```ts
export const EP_SPRINGS = {
  enter: { type: 'spring', stiffness: 600, damping: 18 },  // aggressive snap-in
  morph: { type: 'spring', stiffness: 80, damping: 30 },   // slow deliberate morph
  impact: { duration: 0.1, ease: 'easeOut' },              // instant for collisions
};
```

### Motion Personality Per Episode
- **Aggressive/security topics:** `stiffness: 500+`, `damping: 15-20` — snappy, sudden, tense
- **Mathematical/crypto topics:** `stiffness: 100-150`, `damping: 25-30` — slow, precise, deliberate
- **Network/distributed topics:** `stiffness: 200-300`, `damping: 20` — flowing, wave-like, organic
- **Step-by-step processes:** mix fast setup moves (`stiffness: 400`) with slow key reveals (`stiffness: 80`)

### Visual Diversity by Topic

Every episode should feel designed for its topic, not stamped from a template.

| Topic Category | Natural Visuals | Motion Style | Accent Colors |
|---|---|---|---|
| **Hash functions** | Bit grids, data funnel, avalanche cascades | Sharp, fast transforms; data "crunching" | Blues, cyans |
| **Trees (Merkle, etc.)** | Growing trees, leaves → root, branch highlighting | Organic growth, bottom-up reveals | Greens, earth tones |
| **Security/attacks** | Red zones, broken chains, attacker vs victim split-screen | Aggressive, sudden breaks; tension | Reds, dark slates |
| **Cryptography (signatures, keys)** | Lock/unlock metaphors, sender→receiver channels | Mathematical precision, smooth morphs | Purples, teals |
| **Consensus/mining** | Competing chains, difficulty targets, block races | Parallel synchronized motion, race dynamics | Golds, deep blues |
| **Network/P2P** | Node graphs, signal propagation, broadcast rings | Radiating outward, wave-like spreads | Greens, cyans |
| **Encoding/serialization** | Byte dissection, format anatomy, color-coded segments | Precise, surgical reveals; zoom-in on data | Warm neutrals, highlights per segment |
| **Transactions** | Flow of value, UTXO boxes connecting, fee visualization | Flowing, directional (left→right value movement) | Greens (value), oranges (fees) |
| **Timelocks/scripting** | Timelines, conditional branches, clock animations | Time-based reveals, countdown feel | Amber, slate |

## GSAP Utilities (`@/lib/video/gsap-utils`)

GSAP is the imperative counterpart to Framer Motion. Use it when you need choreographed sequences, precise timing, or effects FM can't do.

### useSceneGSAP — scene-driven GSAP timelines (RECOMMENDED)
```tsx
import { useSceneGSAP } from '@/lib/video';

const container = useRef<HTMLDivElement>(null);
useSceneGSAP(container, scene, {
  0: (tl) => {
    tl.from('.title', { opacity: 0, scale: 0.5, duration: 1, ease: 'power3.out' })
      .from('.subtitle', { opacity: 0, y: 30 }, '-=0.5');
  },
  2: (tl) => {
    tl.to('.title', { y: -100, opacity: 0, duration: 0.6 })
      .from('.diagram', { scale: 0, rotation: -10, ease: 'back.out(2)' }, '-=0.3')
      .from('.label', { opacity: 0, x: -20, stagger: 0.15 });
  },
  5: (tl) => {
    tl.to('.diagram', { scale: 1.5, x: -200, duration: 0.8 })
      .from('.detail', { opacity: 0, scale: 0.8 }, '-=0.4');
  },
});

return <div ref={container}>...</div>;
```

### useGSAP — raw GSAP with auto-cleanup
```tsx
const container = useRef<HTMLDivElement>(null);
useGSAP(container, () => {
  gsap.from('.block', { opacity: 0, y: 50, stagger: 0.2, duration: 0.8 });
}, [scene]);
```

### gsapPresets — reusable animation patterns
```tsx
import { gsapPresets } from '@/lib/video';

// In a timeline:
tl.from(gsapPresets.cascade('.bit-cell').targets, gsapPresets.cascade('.bit-cell').vars);
tl.from(gsapPresets.staggerIn('.node').targets, gsapPresets.staggerIn('.node').vars);
tl.to(gsapPresets.shatter('.block-fragment').targets, gsapPresets.shatter('.block-fragment').vars);
tl.from(gsapPresets.assemble('.piece').targets, gsapPresets.assemble('.piece').vars);
tl.from(gsapPresets.propagate('.network-node').targets, gsapPresets.propagate('.network-node').vars);
```

**Presets:** `staggerIn` (fade+slide children), `cascade` (rapid data reveal), `shatter` (scatter outward for attacks), `assemble` (fragments come together), `propagate` (radial reveal for networks).

### When to use GSAP vs Framer Motion
- **GSAP:** complex multi-step sequences, overlapping animations, stagger with custom distribution, anything where timing precision matters
- **Framer Motion (morph/CE):** simple state transitions, layout animations, spring physics, single-element enter/exit

## Diagram Components (`@/lib/video/diagrams`)
Generic structural primitives: `DiagramBox`, `Arrow`, `FlowRow`, `Connector`, `TreeNode`, `TableGrid`, `Badge`, `DataCell`, `Brace`, `HighlightBox`. Read `client/src/lib/video/diagrams.tsx` for full API.

**These are for supporting elements only.** Use them for labels, flow arrows, data display. The episode's core visual must be a custom component.

## Animation Presets (`@/lib/video/animations`)
The shared library has scene transitions (`sceneTransitions.*`), element animations (`elementAnimations.*`), springs, easings, stagger configs, and character animation variants. Most of these are **unused** — episodes default to CE's fade-in. Use them:
- `sceneTransitions.clipCircle` — iris wipe reveal
- `sceneTransitions.perspectiveFlip` — 3D card flip
- `sceneTransitions.morphExpand` — shape morphs from circle to rectangle
- `sceneTransitions.wipe` — left-to-right reveal
- `elementAnimations.blurIn` — blur-to-sharp focus pull
- `elementAnimations.perspectiveRotateIn` — 3D rotate entrance
- `elementAnimations.elasticScale` — bouncy scale-up
- `charVariants` — per-character kinetic typography

## Making Episodes That Don't Look Alike

### The Sameness Checklist (if you're doing 3+ of these, redesign)
- [ ] Beige background with orange accents
- [ ] CE using default fade-up (`opacity: 0, y: 15`) — use `createThemedCE()` with a different theme
- [ ] Centered layout: heading top, diagram middle, label bottom
- [ ] Same `springs.snappy` for all animations — define EP_SPRINGS
- [ ] No camera/viewport movement — use `<Camera>` with zones and varied shots (zoom, backtrack, vertical pans)
- [ ] No GSAP used — use `useSceneGSAP` for choreographed sequences
- [ ] Core visual built from DiagramBox/FlowRow
- [ ] **One element visible the entire video** — each act needs its own visual centerpiece

### What Actually Creates Visual Distinction
It's not components or colors — it's **how things move and how the viewer's eye travels.**

1. **Signature motion verb** — each episode's elements should enter/move/transform in a way unique to that episode:
   - Security: elements **shatter** in, **glitch** out
   - Hashing: data **cascades** through, pixels **crunch**
   - Trees: elements **grow** from a point, children **branch** off
   - Network: signals **propagate**, nodes **ripple**
   - Encoding: bytes **slot** into place, segments **snap** together

2. **Camera/viewport movement** — zoom into detail, pan across landscape, pull back to show context. Static rectangle = slides.

3. **Continuous transformation** — elements morph into each other instead of entering and exiting. A formula becomes a graph. A block stretches open to reveal transactions. `morph()` exists for this — use it as the primary pattern, not CE.

4. **Mixed rendering** — combine techniques within one episode. A Three.js particle background + SVG diagram + Framer Motion text. Layers create depth and richness that pure-CE episodes can't match.

5. **Ambient motion** — CSS `@keyframes` for gentle background movement (floating particles, pulsing glows, subtle gradients). The scene should feel alive even when nothing is actively animating.

### Before Building: The Visual Brief
Answer these before writing any code:

1. **What's the signature visual?** Not a DiagramBox. What custom animation makes this episode instantly recognizable?
2. **What animation library drives it?** GSAP timeline? Three.js scene? React Spring physics? SVG path morphing?
3. **What's the background?** Determined by the `--palette` flag. What mood does your palette choice enable?
4. **What's the canvas layout?** How big is the canvas? Where are the zones? What's the camera journey — does it backtrack, pan vertically, zoom from 0.3 to 2.5? Does the final scene reveal everything?
5. **What's the motion verb?** How do elements enter/move/exit? (Not "fade in from below")

### Encouraged Custom Techniques
Don't limit yourself to the diagram library. Each episode can introduce:
- **Custom SVG animations** — hand-craft an SVG specific to the concept (elliptic curve, circuit diagram, blockchain fork)
- **CSS animations** — `@keyframes` for effects that don't need JS control (pulsing glows, rotating elements, gradient shifts)
- **Canvas/WebGL** — for particle effects, generative backgrounds, data visualizations
- **Inline computed visuals** — generate diagram data from real values (actual SHA-256 output, real Bitcoin addresses, computed Merkle paths) instead of hardcoded placeholders
- **Custom layout components** — a `NetworkGraph`, `ByteDissector`, `TimelineScrubber` that lives in the episode folder, not the shared lib
- **Step-based state machines** — `useState` + `useEffect` with timed transitions for multi-step animations within a single scene
- **Third-party libraries** — `d3-force` for network layouts, `react-spring` for physics, `flubber` for SVG morphing. Don't force Framer Motion to do everything.

### Layout Variety
Don't default to "heading top, diagram center, label bottom" every time:
- Split-screen for comparisons (attack vs defense)
- Full-bleed diagram with floating labels for complex visuals
- Centered single element for dramatic reveals
- Persistent sidebar + main content for multi-step processes (see EP4)
- Diagonal/asymmetric layouts for energy and dynamism
- Communication channel: Sender → [Channel] → Receiver for protocol topics

## Engagement Techniques

### Key Insight "Highlight Scene"
One scene per episode should visually break the pattern to signal the core takeaway. Different background color, larger text, dramatic animation. This is the ONE thing you want people to remember. Mark with `{/* HIGHLIGHT SCENE */}`.

### "Why Is This a Big Deal?" Beat
After teaching the mechanism, dedicate a scene to frame the significance. Don't assume the viewer connects the dots. Tell them why they should care.

### Cascade / Domino Consequence
When a system has dependencies, show what happens when one piece changes by animating downstream breakage in sequence. Change one transaction → that block's hash changes → next block breaks → all subsequent blocks break, one by one.

### Show Running State
When doing a multi-step transformation, show the full data in every scene with the current step's portion highlighted/boxed. The viewer always sees where they are in the process.

### Scale Comparison — Make Big Numbers Real
When a topic involves incomprehensibly large numbers (2^256), don't just write the number — decompose it into tangible comparisons with progressive zoom-out or rescaling.

## Adding a New Episode

### Step 0: Visual Concept (BEFORE writing any code)
Answer the Visual Brief questions (see above), then:
1. **What custom components does this episode need?** Build topic-specific visuals (tree nodes, network graphs, byte grids, circuit diagrams). They live in the episode folder, not the shared lib.
2. **What layout pattern fits this content?** Don't default to centered-stack. Consider split-screen, persistent sidebar, full-bleed diagram, communication channel, timeline.

### Steps 1-8: Implementation
1. Create `client/src/episodes/ep<N>-<slug>/` with `VideoTemplate.tsx`, `constants.ts`, and custom component(s)
2. **Build the signature visual first** — the core animation that defines the episode's look
3. Define `SCENE_DURATIONS` based on content density
4. Assemble VideoTemplate around the signature visual
5. Register in `client/src/App.tsx` routes and `client/src/pages/Home.tsx`
6. Export from `client/src/episodes/index.ts`
7. Preview: `npm run dev:client` → navigate to `#ep<N>`
8. Record: `node scripts/record.mjs`

Episodes ep1-ep10 use older patterns. Ignore them — only follow the rules in this file.

## Voiceover (Opt-In)

Only generate voiceover when explicitly asked ("with voice", "add voiceover", "generate audio").

### 1. Write the Transcript
Create `transcript.txt` in the episode folder. One paragraph per scene. Conversational tone, complements (doesn't repeat) on-screen text. ~2.5 words/second. Mark timing cues when specific phrases must align with animation beats.

### 2. Generate Audio
`scripts/generate-voiceover-ep<N>.mjs`. ElevenLabs voice `InRyolULHTXjegISsXuJ`, model `eleven_multilingual_v2`, settings `{ stability: 0.6, similarity_boost: 0.8, style: 0.3 }`.

### 3. Sync Animation Durations to Audio
**Duration formula:** `SCENE_DURATION = audio_length + 2500ms buffer`

```tsx
const SCENE_DURATIONS = {
  scene1: 13000,    // audio 10.6s — Title
  scene2: 19000,    // audio 16.2s — Opening concept
};
```

### 4. Wire Up Audio Playback
Add `SCENE_AUDIO` array and audio sync effect to VideoTemplate:

```tsx
const SCENE_AUDIO = [
  '/audio/ep<N>-<slug>/scene1.mp3',
  '/audio/ep<N>-<slug>/scene2.mp3',
];

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

### 5. Voiceover-Synced Reveals (CRITICAL)
When an episode has voiceover, animation reveals MUST sync with what the narrator is saying. Elements appear WHEN the narrator mentions them — not all at once when the scene loads.

**The rule:** Don't show it until the narrator says it.

Audio starts 400ms after scene enters. If narrator says "and here's the root" at ~3.5s in the audio, the animation delay = 3.5 + 0.4 = 3.9s. Add timing comments:

```tsx
{/* "bundles hundreds of transactions" @ ~2s audio → 2.4s scene */}
<motion.div transition={{ delay: 2.4 }}>
  <TxBox />
</motion.div>
```

**Visual reinforcement:** When the narrator describes a relationship, show it visually — an arrow, a highlight, a connection line. The animation illustrates what the voice is explaining.

## Autonomous Pipeline

`./scripts/auto-episode.sh <topic> <ep_number> <slug> [--with-voice] [--full-auto]`

Planner (can't edit code) reviews and steers. Executor (can edit code) builds. Handoff via `.auto-episode/ep<N>-<slug>/` artifacts. Pipeline: Research → Creative Vision → Storyboard → Build → Critique Loop → Voiceover. See `scripts/auto-episode.sh` for full details.

## Teaching Approaches (pick one per episode)
1. **Problem > Failure > Fix Loop** — build naive system, show how it breaks, fix, repeat. Each failure motivates the next layer. Best for protocol design, system architecture.
2. **Specific > General** — concrete example with real values first, then abstract rule. A worked SHA-256 round is more engaging than the algorithm definition.
3. **Analogy-First** — only when analogy fits naturally
4. **Definition-Deep-Dive** — define, then layer complexity scene by scene
5. **Wrong > Less Wrong > Right** — start wrong, refine toward correct
6. **Dialogue-Driven** — Alice & Bob stick figures discuss the topic conversationally. Alice explains, Bob asks questions. Use the `Character` component from `@/lib/video`. Best for topics where a Q&A format naturally builds understanding. Mix dialogue scenes with pure visual scenes — don't make the entire episode just two characters talking.

### Emotional Arc
Curiosity > Confusion > Partial clarity > **Aha moment** > Satisfaction. The aha lands in a Highlight Scene — visually break the pattern (different background, larger text, dramatic animation). Mark with `{/* HIGHLIGHT SCENE */}`.

## Characters — Stick Figure System (`@/lib/video/characters`)

Expressive animated stick figure characters for dialogue-driven teaching. Import from `@/lib/video`:

```tsx
import { Character } from '@/lib/video';
import type { CharacterProps, Emotion, Gesture, LookDirection } from '@/lib/video';
```

### Available Characters
| Name | Color | Default Facing | Role |
|------|-------|---------------|------|
| `alice` | `#396BEB` (blue) | right | Explainer, teacher |
| `bob` | `#EB5234` (orange) | left | Questioner, learner |

### Props (`CharacterProps`)
```tsx
<Character
  name="alice"              // 'alice' | 'bob'
  emotion="explaining"      // see Emotions below
  lookAt="right"           // 'center' | 'left' | 'right' | 'up' | 'down'
  gesture="point"          // 'none' | 'wave' | 'point' | 'shrug' | 'present'
  says="This is the hash"  // speech bubble text (omit = no bubble)
  facing="right"           // override default facing: 'left' | 'right'
  position={{ x: '25%', y: '85%' }}  // absolute positioning
  size="10vw"              // character size (default '10vw')
/>
```

### Emotions (11 total)
| Emotion | Face | Best for |
|---------|------|----------|
| `neutral` | Relaxed smile, normal eyes | Default state, listening |
| `happy` | Squinted eyes, big smile, blush | Agreement, success |
| `excited` | Wide eyes, open mouth, blush | Discovery, breakthrough |
| `curious` | One brow raised, head tilted | Asking questions |
| `confused` | Both brows furrowed, wavy mouth | Not understanding |
| `thinking` | Eyes looking up-left, tilted head | Processing, considering |
| `surprised` | Very wide eyes, open mouth | Unexpected reveal |
| `worried` | Raised inner brows, frown | Concern about a bug/attack |
| `annoyed` | Lowered brows, flat mouth | Frustration, skepticism |
| `explaining` | Engaged eyes, open smile, slight lean | Teaching a concept |
| `laughing` | Squinted eyes, wide open mouth, blush | Humor, relief |

### Gestures (5 total)
- `none` — arms relaxed at sides (with natural curve)
- `wave` — right arm raised in greeting
- `point` — right arm extended pointing outward
- `shrug` — both arms raised outward ("I dunno")
- `present` — right arm raised presenting something

### Character Positioning Rules — CRITICAL

**Characters MUST move between scenes.** Do NOT place characters at one fixed position for the whole episode — this makes them feel like static decorations instead of participants.

**The `position` and `size` props are animated with springs.** When you change `position` or `size` based on the current scene, the character smoothly glides to the new spot. Use scene-driven expressions:

```tsx
{sceneRange(s, 3, 14) && (
  <>
    <Character
      name="alice"
      emotion={s <= 9 ? 'explaining' : 'worried'}
      gesture={s <= 6 ? 'present' : 'point'}
      lookAt={s >= 12 ? 'down' : 'right'}
      says={s === 3 ? 'Every block starts with a coinbase...' : s === 7 ? 'It overwrites the first.' : undefined}
      position={{
        x: '8%',
        y: s >= 12 ? '30%' : '75%',  // glides up when timeline is below
      }}
      size={s >= 12 ? '5vw' : '6vw'}
    />
    <Character
      name="bob"
      emotion={s === 7 ? 'confused' : s >= 12 ? 'surprised' : 'curious'}
      lookAt={s >= 12 ? 'down' : 'left'}
      says={s === 7 ? 'Where did my 50 BTC go?' : undefined}
      position={{
        x: '92%',
        y: s >= 12 ? '30%' : '75%',
      }}
      size={s >= 12 ? '5vw' : '6vw'}
    />
  </>
)}
```

**Position characters relative to each scene's content:**
- Content fills the top? → Characters at bottom (`y: '75-85%'`)
- Content fills the bottom (timeline, chart)? → Characters at top (`y: '25-35%'`)
- Zoomed-in scene with no room? → **Hide characters entirely** for that scene
- Content centered? → Characters flank it at edges (`x: '8%'` / `x: '92%'`)

**Hide characters during full-screen content.** If a scene zooms to 1.5x+ and content fills the viewport, do not render characters — they will overlap. Exclude those scenes from the `sceneRange`.

### When to Use Characters
- **Dialogue-Driven teaching** — Alice and Bob discuss the topic conversationally
- **Reaction shots** — character reacts to a visual (surprised at a collision, worried about an attack)
- **Intro/outro** — characters wave hello or present the topic
- **NOT every episode needs characters** — use them when the topic benefits from a conversational explanation, not as decoration

### Storyboard Character Notation
When storyboarding scenes with characters, note position changes:
```
CHARACTERS (scenes 3-13):
  alice: default position=(8%, 75%), size=6vw
    scene 3: emotion=explaining, gesture=present, says="Short speech"
    scene 7: emotion=worried, gesture=point
    scene 12+: position=(8%, 30%), size=5vw, lookAt=down  ← moves up for timeline
  bob: default position=(92%, 75%), size=6vw
    scene 7: emotion=confused, says="Question?"
    scene 12+: position=(92%, 30%), size=5vw, lookAt=down
  HIDDEN: scenes 5-6 (zoomed in, no room)
```

## Content Checklist
- Pick a topic people have heard of but don't really understand
- **Define the episode's visual concept** — what's the ONE signature visual? What accent colors? What layout?
- **Build at least one custom component** for the episode's core visual — don't default to DiagramBox for everything
- Target the emotional arc: Curiosity > Confusion > Partial clarity > Aha > Satisfaction
- Find a natural analogy (or skip it if none fits)
- Open from what the viewer already knows, then build toward the technical concept
- **One sentence per scene heading, max ~15 words** — if you're writing more, split it
- **Most scenes should have animated visuals** — text captions the animation, not the other way around. A deliberate text-only moment for emphasis or contrast is a valid design choice; defaulting to text-only because it's easier is not.
- Use a real worked example with actual values when possible
- Progressive reveal in every scene — staggered delays, never dump everything at once
- **Vary motion style to match the topic's mood** — don't use identical spring configs for every episode
- End with CTA on last scene
- Use as many scenes as needed

## Episode Registry (DO NOT read old episode code)

When building a new episode, **do NOT read existing episode VideoTemplate.tsx files**. Old episodes use outdated patterns (CE-only, beige-only, springs.snappy for everything) that you will unconsciously copy. Instead, use this registry to know what's been done so you can avoid repeating it:

| EP | Topic | Background | Core Visual | Layout | Animation Lib | What NOT to repeat |
|---|---|---|---|---|---|---|
| 1 | Off-by-one error | Beige | Fencepost block grid | Full-screen centered | Framer Motion CE only | Centered layout, CE fade-in for everything |
| 2 | SegWit addresses | Beige | Bech32 character grid | Full-screen centered | Framer Motion CE only | Centered layout, character grid pattern |
| 3 | SHA-256 padding | Beige | Binary block padding | Full-screen centered | Framer Motion CE only | Centered layout, binary grid |
| 4 | Garbled circuits | Beige | AND gate truth table | Split-screen (70/30) | Framer Motion CE + table state | Split-screen persistent panel |
| 5 | 64-byte TX bug | Dark (#201E1E) | Merkle tree SVG | Layered (tree top, content bottom) | Framer Motion CE + SVG pathLength | Tree visualization, layered layout |
| 6 | Duplicate TXID | Beige | Mirror cards + collision | Bilateral mirror layout | Framer Motion CE + CSS @keyframes | Mirror/bilateral layout, collision effect |

**Patterns that ALL old episodes share (avoid these):**
- CE with default `{ opacity: 0, y: 15 }` for every element
- `springs.snappy` (400/30) as the only motion
- No camera/viewport movement
- No GSAP usage (it's installed but never imported)
- No palette variety — background must follow the `--palette` flag
- No ambient CSS animation (glows, pulses, gradients)
- No Three.js, no Canvas 2D, no SVG path morphing

**What a new episode MUST do differently:**
- Use `createThemedCE(ceThemes.xxx)` — pick a transition theme that fits the topic (blurIn, clipCircle, glitch, etc.). NEVER use bare CE with the default fade-up.
- Use Camera system for layout — place content in zones on a large canvas, use focus()/fitRect() for shots, pass zones for dev minimap. Final scene = full canvas reveal.
- Use `useSceneGSAP` for at least one choreographed sequence
- Define custom EP_COLORS and EP_SPRINGS in constants.ts
- Core visual must NOT use CE — use morph(), GSAP timeline, SVG morph, or canvas
- Background must follow the `--palette` mode (grayscale/brand/free) — always define in EP_COLORS
- **Multiple distinct visual compositions** — each act/section gets its own centerpiece visual. No single element stays on screen the whole video. Build, climax, clear, rebuild.
