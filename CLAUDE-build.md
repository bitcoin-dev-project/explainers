# Build Agent Guide — Animation Toolkit & Implementation

Full implementation reference for build-phase agents. This contains animation APIs, GSAP utilities, and code patterns.

## Animation Toolkit

Multiple animation libraries installed. **Do not default to Framer Motion for everything.** Pick the right tool for each episode's core visual.

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

The core visual component must have:
1. **An underlying model** — physics simulation, math computation, data-driven grid, or state machine. Not just styled divs with transitions.
2. **Continuous life** — ambient motion between scene changes (Brownian drift, shimmer, `requestAnimationFrame` loop, CSS @keyframes). The scene feels alive, not frozen.
3. **Multiple modes/states** — behavior changes across scenes (e.g., idle → active → climax → resolution), not just visibility on/off.
4. **Layered rendering** — glow + core + highlight, gradients, shadows, bloom. Depth, not flat single-layer elements.
5. **The visual must teach without voiceover** — a viewer watching on mute should understand the core concept from the animation alone. If the visual is just decoration while text does the teaching, it fails this bar. The animation IS the explanation.

Reference implementations: EP8 `SpongeCanvas.tsx` (497 lines, Canvas 2D particle physics with 5 modes) and EP9 `HeatmapCanvas.tsx` (321 lines, Canvas 2D grid with 3 fill modes and heat color ramp).

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
- **Every explanatory scene needs teaching anchors.** At minimum: a label/value/formula inside the visual, or a short caption. Animation without any text context leaves viewers guessing. Title cards and mood beats are exempt.

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

## Viewport-First Layout

**All scene content must fit within the 1920×1080 viewport (100vw × 100vh).** No oversized canvases. No zoom/pan over giant worlds. Animate within the visible frame.

### Rules
- The root `<div>` is `w-full h-screen overflow-hidden relative` — that IS your stage
- Position elements with absolute + vw/vh units within the viewport
- Use `morph()` for persistent visuals that transform between scene states — elements can stay mounted across scenes and morph in place within the viewport
- Use `sceneRange()` or CE enter/exit to swap content between scenes when appropriate
- Both persistent (morph) and swapping (sceneRange) patterns are valid — pick what serves the content
- Every element the viewer needs to see must be on-screen. No "other zone" excuses

### What This Replaces
The Camera system (`camera.tsx`) is still available in `@/lib/video` for backward compatibility with existing episodes (ep1-ep10). **New episodes should NOT use Camera.** Instead, compose each scene's content directly within the viewport.

### Layout Variety (within the viewport)
- Split-screen for comparisons (attack vs defense)
- Full-bleed diagram with floating labels
- Centered single element for dramatic reveals
- Persistent sidebar + main content
- Diagonal/asymmetric layouts
- Elements that morph position/size between scenes using `morph()`


## GSAP Utilities (`@/lib/video/gsap-utils`)

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
});
return <div ref={container}>...</div>;
```

### useGSAP — raw GSAP with auto-cleanup
```tsx
useGSAP(container, () => {
  gsap.from('.block', { opacity: 0, y: 50, stagger: 0.2, duration: 0.8 });
}, [scene]);
```

### gsapPresets — reusable animation patterns
`staggerIn` (fade+slide), `cascade` (rapid data reveal), `shatter` (scatter for attacks), `assemble` (fragments come together), `propagate` (radial for networks).

### When to use GSAP vs Framer Motion
- **GSAP:** complex multi-step sequences, overlapping animations, stagger, timing precision
- **Framer Motion (morph/CE):** simple state transitions, layout animations, spring physics, single-element enter/exit

## Diagram Components (`@/lib/video/diagrams`)
Generic structural primitives: `DiagramBox`, `Arrow`, `FlowRow`, `Connector`, `TreeNode`, `TableGrid`, `Badge`, `DataCell`, `Brace`, `HighlightBox`. **Supporting elements only.** Episode's core visual must be a custom component.

## Animation Presets (`@/lib/video/animations`)
- `sceneTransitions.fadeBlur` — blur in/out
- `sceneTransitions.scaleFade` — scale + fade
- `sceneTransitions.slideLeft` — slide from right
- `sceneTransitions.crossDissolve` — simple opacity crossfade
- `elementAnimations.blurIn` — blur-to-sharp focus pull
- `elementAnimations.perspectiveRotateIn` — 3D rotate entrance
- `elementAnimations.elasticScale` — bouncy scale-up
- `charVariants` — per-character kinetic typography

## Making Episodes That Don't Look Alike

### Before Building: The Visual Brief
1. **What's the signature visual?** Not a DiagramBox. What custom animation makes this episode instantly recognizable?
2. **What animation library drives it?** GSAP? Three.js? React Spring? SVG morphing?
3. **What's the background?** Determined by `--palette` flag.
4. **What's the layout?** How is the 1920×1080 viewport used? Split-screen? Full-bleed? Asymmetric? What morphs between scenes?
5. **What's the motion verb?** How do elements enter/move/exit? (Not "fade in from below")

### Encouraged Custom Techniques
- **Custom SVG animations** — hand-craft SVG specific to concept
- **CSS animations** — `@keyframes` for effects not needing JS control
- **Canvas/WebGL** — particle effects, generative backgrounds, data viz
- **Inline computed visuals** — generate from real values (actual SHA-256 output, real Bitcoin addresses)
- **Custom layout components** — `NetworkGraph`, `ByteDissector`, `TimelineScrubber` in episode folder
- **Step-based state machines** — `useState` + `useEffect` with timed transitions
- **Third-party libraries** — `d3-force`, `react-spring`, `flubber`. Don't force Framer Motion for everything.

### Layout Variety
- Split-screen for comparisons (attack vs defense)
- Full-bleed diagram with floating labels
- Centered single element for dramatic reveals
- Persistent sidebar + main content (see EP4)
- Diagonal/asymmetric layouts
- Communication channel: Sender → [Channel] → Receiver

## Adding a New Episode

### Step 0: Visual Concept (BEFORE writing any code)
Answer the Visual Brief, then:
1. What custom components does this episode need?
2. What layout pattern fits this content?

### Steps 1-8: Implementation
1. Create `client/src/episodes/ep<N>-<slug>/` with `VideoTemplate.tsx`, `constants.ts`, custom component(s)
2. **Build the signature visual first**
3. Define `SCENE_DURATIONS` based on content density
4. Assemble VideoTemplate around the signature visual
5. Register in `client/src/App.tsx` routes and `client/src/pages/Home.tsx`
6. Export from `client/src/episodes/index.ts`
7. Preview: `npm run dev:client` → navigate to `#ep<N>`
8. Visual QA: `node scripts/visual-qa.mjs ep<N>`

Episodes ep1-ep10 use older patterns. Ignore them — only follow rules in this file.

## Voiceover (Opt-In)

Only generate when explicitly asked.

### 1. Write the Transcript
`transcript.txt` in episode folder. One paragraph per scene. ~2.5 words/second. Mark timing cues.

### 2. Generate Audio
`scripts/generate-voiceover-ep<N>.mjs`. ElevenLabs voice `InRyolULHTXjegISsXuJ`, model `eleven_multilingual_v2`, settings `{ stability: 0.6, similarity_boost: 0.8, style: 0.3 }`.

### 3. Sync Durations
`SCENE_DURATION = audio_length + 2500ms buffer`

### 4. Wire Audio Playback
```tsx
const SCENE_AUDIO = ['/audio/ep<N>-<slug>/scene1.mp3', ...];
const audioRef = useRef<HTMLAudioElement | null>(null);
useEffect(() => {
  if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
  const timer = setTimeout(() => {
    const audio = new Audio(SCENE_AUDIO[currentScene]);
    audio.play().catch(() => {});
    audioRef.current = audio;
  }, 400);
  return () => { clearTimeout(timer); if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; } };
}, [currentScene]);
```

### 5. Voiceover-Synced Reveals
Elements appear WHEN narrator mentions them. Audio starts 400ms after scene. Add timing comments:
```tsx
{/* "bundles hundreds of transactions" @ ~2s audio → 2.4s scene */}
<motion.div transition={{ delay: 2.4 }}><TxBox /></motion.div>
```

## Characters — Stick Figure System (`@/lib/video/characters`)

### Available Characters
| Name | Color | Default Facing | Role |
|------|-------|---------------|------|
| `alice` | `#396BEB` (blue) | right | Explainer, teacher |
| `bob` | `#EB5234` (orange) | left | Questioner, learner |

### Props
```tsx
<Character name="alice" emotion="explaining" lookAt="right" gesture="point"
  says="This is the hash" position={{ x: '25%', y: '85%' }} size="10vw" />
```

### Emotions (11): neutral, happy, excited, curious, confused, thinking, surprised, worried, annoyed, explaining, laughing

### Gestures (5): none, wave, point, shrug, present

### Positioning Rules — CRITICAL
- **Characters MUST move between scenes.** Use scene-driven position/size expressions.
- Position relative to content. Content top → characters bottom. Content bottom → characters top.
- **Hide during full-screen content** (zoom 1.5x+).
- `position` and `size` props are animated with springs.
