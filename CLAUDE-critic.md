# Critic Agent Guide — Bitcoin Explainer Series

Context for critique-phase agents reviewing built episodes.

**Read CLAUDE.md first** — it has the shared rules you must follow (Scene Rules, Text Rules, Timing Guidelines, Scene Composition, Episode Registry). This file only covers critic-specific guidance.

## Quality Bar — Signature Visual
The core visual component must have:
1. **An underlying model** — physics simulation, math computation, data-driven grid, or state machine. Not just styled divs with transitions.
2. **Continuous life** — ambient motion between scene changes (Brownian drift, shimmer, `requestAnimationFrame` loop, CSS @keyframes).
3. **Multiple modes/states** — behavior changes across scenes (idle → active → climax → resolution), not just visibility on/off.
4. **Layered rendering** — glow + core + highlight, gradients, shadows, bloom. Depth, not flat.
5. **Muted comprehension** — viewer on mute should understand the core concept from visuals + on-screen text together. Neither alone carries everything. The diagram makes the mechanism click; the text explains what the viewer is seeing. If visual is pure decoration or text is pure decoration, it fails.

Reference implementations: EP8 `SpongeCanvas.tsx` (Canvas 2D particle physics, 5 modes), EP9 `HeatmapCanvas.tsx` (Canvas 2D grid, 3 fill modes).

## Structural Failures (always MUST FIX)
These are not cosmetic issues — they mean the episode fundamentally fails at its job. Always flag as MUST FIX, never downgrade:
1. **Opens with jargon before grounding** — a technical term appears in explanatory scenes before the viewer has seen the familiar thing it relates to. Title/topic cards are exempt.
2. **Beautiful visual but unclear mechanism** — the animation looks great but you can't tell what concept it's showing or how the mechanism works.
3. **Narration-dependent teaching** — a scene where the concept is only understandable if you imagine voiceover narration. The visuals + on-screen text must carry the lesson together.
4. **Text overlapping text** — any two text elements (labels, captions, values) overlapping or so crowded they're hard to read.
5. **Multiple new ideas in one scene** — a scene that introduces more than one new concept, forcing the viewer to absorb too much at once.
6. **No learning progression** — scenes that don't build on each other; the viewer can't follow a path from what they knew to what they learned.
7. **Visual clutter / overcrowded scenes** — more than 3 distinct visual systems on screen simultaneously (e.g., a grid + a diagram + a timeline + a detail panel all at once). Each scene should have ONE dominant visual + supporting text. If a screenshot looks busy or overwhelming, the scene is doing too much.
8. **Stale visuals from previous acts** — a component mounted for scenes where it's no longer relevant. When the episode moves to a new narrative act, previous act's visuals should be cleared. A UTXO grid still visible during a scene about nLockTime means the build didn't scope its components properly.

## The Sameness Checklist (if 3+ are true, redesign)
- [ ] Beige background with orange accents
- [ ] CE using default fade-up (`opacity: 0, y: 15`) — should use `createThemedCE()` with custom theme
- [ ] Centered layout: heading top, diagram middle, label bottom
- [ ] Same `springs.snappy` for all animations — should define EP_SPRINGS
- [ ] No layout variety — every scene uses the same static composition instead of varied layouts (split-screen, full-bleed, asymmetric, morph between positions)
- [ ] No GSAP used — should use `useSceneGSAP` for choreographed sequences
- [ ] Core visual built from DiagramBox/FlowRow
- [ ] **One element visible the entire video** — each act needs its own visual centerpiece
- [ ] Content overflows or clips outside the 1920×1080 viewport

## What Creates Visual Distinction
1. **Signature motion verb** — Security: shatter/glitch. Hashing: cascade/crunch. Trees: grow/branch. Network: propagate/ripple. Encoding: slot/snap.
2. **Layout variety across scenes** — split-screen, full-bleed, asymmetric, morph between positions. Static same-layout = slides.
3. **Continuous transformation** — morph() over enter/exit. Shapes become other shapes.
4. **Mixed rendering** — Three.js + SVG + Framer Motion. Layers create depth.
5. **Ambient motion** — CSS @keyframes for background life (floating particles, pulsing glows).

## Viewport Requirements
- **All content fits within 1920×1080** — nothing important off-screen or clipped
- **Persistent visuals morph in place** when content spans scenes — use morph() to transform position/size/style within the viewport
- **Visual variety comes from composition changes**, not camera pans over a giant canvas

## Engagement Checklist
- Is there a clear **highlight/aha scene** that visually breaks the pattern?
- Is there a **"why is this a big deal?"** beat after teaching the mechanism?
- Does cascading consequence show downstream effects?
- Does it show running state during multi-step transforms?
- **No silent explanatory scenes** — every scene that teaches a concept must have visible teaching anchors (labels, values, captions). The visual + text together carry the lesson. If a scene has important animation but no text explaining what the viewer is seeing, flag it as a structural failure.
- **Scene 2 starts from familiar ground** — the viewer must recognize what they're looking at before new concepts are introduced.
- **No text-on-text overlap** — if screenshots show text overlapping other text, flag immediately as MUST FIX.

## Dynamic Necessity

Every scene's motion should pass this test: "What does the animation teach that a still image with labels would not?" If the answer is "nothing" or "it just looks nicer," flag it.

### Critique Criteria
- **Didactic role clarity** — Can you identify the scene's teaching job from the visual alone? Each scene should serve one role: connect, covary, visualize_structure, visualize_process, symbol_sense, ground_in_reality, or generalize.
- **Dynamic necessity** — Does the motion teach something a still would not? The technique (morph, copy-move, trace, linked-vary, sweep, etc.) should make the relationship clearer than a static diagram could.
- **Representation bridge visibility** — For connect/covary scenes: can a muted viewer see what two things are being linked?
- **Focal dominance** — Is there one clear thing to look at, or are multiple systems competing for attention?
- **Intermediate-state honesty** — Do any mid-animation frames look meaningful but represent nothing real in the protocol?

### Severity
- Fake intermediate state → **MUST FIX**
- Multiple competing visual systems blocking comprehension → **MUST FIX**
- Decorative motion (removing it changes nothing) → **SHOULD FIX** (unless purely transitional < 1s)
- No dominant focal object → **SHOULD FIX**

## Patterns ALL Old Episodes Share (flag these)
- CE with default `{ opacity: 0, y: 15 }` for every element
- `springs.snappy` (400/30) as only motion
- No layout variety, no GSAP, no palette variety, no ambient CSS animation

## What You Do NOT Need
You don't need animation API docs, Camera props reference, GSAP code examples, or voiceover wiring details. Those are build-phase concerns. Focus on the output quality, not the implementation details.
