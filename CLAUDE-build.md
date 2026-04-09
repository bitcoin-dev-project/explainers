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
5. **Muted comprehension — visual leads, text clarifies.** A muted viewer should understand the core concept because the **visual demonstrates the mechanism** and text labels/captions clarify what they're seeing. The visual must do the heavy lifting — if you removed the animation and kept only the text, the scene should feel broken. If you removed the text and kept only the animation, the viewer should still roughly follow. Text supports the visual, not the other way around.

Reference implementations: EP8 `SpongeCanvas.tsx` (497 lines, Canvas 2D particle physics with 5 modes) and EP9 `HeatmapCanvas.tsx` (321 lines, Canvas 2D grid with 3 fill modes and heat color ramp).

### What Counts as a Custom Visual Component

A `.tsx` file only counts as a custom visual if it has **all three**:
1. **Underlying model or internal choreography** — Canvas 2D render loop, SVG path animation, GSAP timeline with multi-step within-scene motion, or a state machine driving visual changes. Entrance stagger alone (opacity + y + stagger) does NOT count.
2. **Multiple states across scenes** — the component behaves differently when `scene` changes (not just mounts/unmounts). It should morph, reconfigure, or change mode.
3. **Visual weight** — it occupies meaningful screen space and the eye is drawn to it. A row of labeled fields in bordered divs is a data display, not a visual centerpiece.

**Not custom visuals:** comparison tables, field lists, card layouts, text panels, badge grids — even if they're in their own `.tsx` file and use GSAP for entrance animations. These are supporting elements, not act centerpieces.

### Act-Level Visual Coverage

Each narrative act (3-5 scenes) needs its own **real visual centerpiece** — a component that passes the three criteria above. The signature visual should own at least one full act and return in a payoff scene, covering roughly a quarter to a third of all scenes. The remaining acts need their own distinct centerpieces (can be simpler but must still pass the three criteria).

### Canvas 2D — Required Patterns

When using Canvas 2D (`<canvas>` + `requestAnimationFrame`), follow these rules:

1. **Use `window.devicePixelRatio` for sharp rendering.** Never hardcode `dpr = 1`. The canvas must render at the screen's native resolution:
   ```ts
   const dpr = window.devicePixelRatio || 1;
   canvas.width = rect.width * dpr;
   canvas.height = rect.height * dpr;
   ctx.scale(dpr, dpr);
   // Use rect.width / rect.height as logical dimensions, not canvas.width / canvas.height
   ```
2. **Scale all sizes relative to the canvas dimensions.** Never hardcode pixel sizes like `font = '12px ...'` or `slotH = 36`. Instead, derive sizes from the canvas:
   ```ts
   const W = rect.width;  // logical width (CSS pixels)
   const H = rect.height;
   const fontSize = W * 0.018;       // ~1.8% of width → ~35px on 1920w
   const slotH = H * 0.06;           // ~6% of height → ~65px on 1080h
   ctx.font = `${fontSize}px JetBrains Mono, monospace`;
   ```
   This ensures the visual looks correct at any viewport size and renders crisply at 1920×1080 for recording.

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
- **sceneRange()** — `sceneRange(s, 2, 8)` — boolean helper for conditional rendering. **Exit is exclusive:** `sceneRange(s, 2, 8)` means visible when `s >= 2 && s < 8`. For a single scene, use `sceneRange(s, 5, 6)` NOT `sceneRange(s, 5, 5)` — the latter renders nothing.

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
- **Elements persist within an act, clear between acts.** Within a narrative act (3-5 scenes about the same concept), elements should persist and build on each other. But when the episode moves to a different act (new concept, new visual), unmount the previous act's components. Use `sceneRange()` to scope components to their relevant scenes — don't mount a component for the whole episode when it's only relevant for one act.
- **Use `morph()` for elements that change position/style across scenes.** But scope morph to the scenes where the element is actively teaching. A UTXO grid relevant in scenes 3-7 should unmount before scene 8 introduces a new visual.
- **Element budget per scene.** Each scene should have ONE dominant visual + supporting text/labels. Maximum 2-3 visual systems on screen at once. If a scene needs more, it's trying to do too much — split it into multiple scenes. A small persistent element (like a timeline bar) counts toward this budget.
- **Layout with `absolute` positioning + zone reservation.** Since everything is on one canvas, use `absolute` + flexbox for positioning. **Text overlap is the #1 visual bug — prevent it with zones:**
  - **TOP STRIP** (0-12vh): scene heading or caption — ONE text element only
  - **MAIN AREA** (12-85vh): visual + labels inside it — labels positioned relative to their visual parent, not viewport-absolute
  - **BOTTOM STRIP** (85-100vh): footnote, status, or CTA — ONE text element only
  - Never position two text elements at overlapping absolute coordinates. If a heading is at `top: 6vh` and a subtitle is at `top: 8vh`, they WILL overlap.
  - For text inside visuals (labels on diagrams): position relative to the parent component, not viewport-absolute. This prevents collisions with scene-level captions.
  - Before writing a scene: list every text element and its zone. Two elements in the same zone = reposition one.
  - Visual layers (glows, backgrounds, diagrams) can overlap freely, but text is always readable on top.
- **Children can have their own delays.** `CE` controls when the container mounts; children handle their own staggered reveals inside.
- **Every explanatory scene needs teaching anchors — but the visual leads.** The animated visual demonstrates the mechanism; labels/values/captions clarify what the viewer is seeing. If a scene is mostly text panels with entrance animations, the visual isn't leading — it's a slide. At minimum: a real animated visual + a label/value/caption. Title cards and mood beats are exempt.
- **Ground mechanisms with concrete values.** Explanatory sequences and mechanisms should use real labels and values where relevant (actual hex values, real block heights, etc.), not abstract placeholders. Simple bridge scenes are exempt — don't overload them.
- **Process scenes show change over time; concept scenes stabilize and label a structure.** Don't mix both in one scene without justification in the creative spec.

### Motion Must Teach

Every animated element must have a didactic job stated in the creative spec. The spec assigns each scene a **role** (the teaching purpose) and a **technique** (the animation method). These are strictly separate vocabularies:

**Roles** (the *why* — what the scene teaches):
`connect` | `covary` | `visualize_structure` | `visualize_process` | `symbol_sense` | `ground_in_reality` | `generalize`

**Techniques** (the *how* — what the animation does):
`copy-move` | `morph` | `trace` | `rule-based-move` | `scale-vary` | `rearrange` | `decompose` | `highlight-morph` | `sweep` | `linked-vary`

If the role is `covary`, two things must animate in tandem (technique: `linked-vary`). If the technique is `morph`, one representation must physically transform into another. If motion can't make the relationship clearer, simplify the scene to a labeled still with one animated reveal.

#### Preferred Technique Patterns

| Technique | When to use | Bitcoin example |
|---|---|---|
| **copy-move** | Show that two things in different contexts are the same or collide | Copy a TXID from block A, move it next to block B's TXID to show collision |
| **morph** | Show input→output or before→after correspondence | Transaction fields morph into serialized bytes |
| **linked-vary** | Show dependency between two quantities changing in tandem | Vary nonce slider, hash output changes simultaneously |
| **trace** | Show a path or trajectory through a structure | Highlight Merkle proof path from leaf to root |
| **rule-based-move** | Simulate a real process with physics/math rules | Block propagation across network nodes |
| **rearrange** | Reveal structural similarity between expressions | Move opcodes/fields to align with another structure |
| **sweep** | Show a concept works for all cases, not just one | Slide highlighted tx through Merkle tree leaves |
| **scale-vary** | Emphasize magnitude differences | Grow a block to show 2^256 search space |
| **decompose** | Break a complex object into labeled parts | Transaction split into version, inputs, outputs, locktime |
| **highlight-morph** | Draw attention by changing shape/color of emphasis markers | Color-code matching terms in two expressions |

#### Anti-Patterns
- **Decorative motion** — spinning, pulsing, or floating that doesn't teach. If removing the animation changes nothing about comprehension, remove it.
- **Fake intermediate state** — a mid-morph frame that looks meaningful but represents nothing in the protocol. Hash functions don't have a "halfway hashed" state.
- **Parallel panel overload** — showing 3+ examples simultaneously when sweeping through them sequentially (technique: `sweep`) would teach better.
- **Symbol without grounding** — a formula appears before the viewer has seen what it describes visually.
- **Panel fallback / slide-deck scene** — a scene whose primary visual is rows, cards, or bordered rectangles with text inside, animated only with entrance stagger (opacity + y-translate). This is a slide, not an animation. If the scene stripped away its GSAP entrance and just appeared instantly, would it look like a static infographic? Then the visual isn't doing work. Each explanatory scene needs a visual element that **transforms, morphs, or simulates** — not just enters.

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
