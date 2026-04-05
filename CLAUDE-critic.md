# Critic Agent Guide — Bitcoin Explainer Series

Context for critique-phase agents reviewing built episodes.

**Read CLAUDE.md first** — it has the shared rules you must follow (Scene Rules, Text Rules, Timing Guidelines, Scene Composition, Episode Registry). This file only covers critic-specific guidance.

## Quality Bar — Signature Visual
The core visual component must have:
1. **An underlying model** — physics simulation, math computation, data-driven grid, or state machine. Not just styled divs with transitions.
2. **Continuous life** — ambient motion between scene changes (Brownian drift, shimmer, `requestAnimationFrame` loop, CSS @keyframes).
3. **Multiple modes/states** — behavior changes across scenes (idle → active → climax → resolution), not just visibility on/off.
4. **Layered rendering** — glow + core + highlight, gradients, shadows, bloom. Depth, not flat.
5. **Teaches without voiceover** — viewer on mute should understand the core concept from animation alone. If visual is decoration while text teaches, it fails.

Reference implementations: EP8 `SpongeCanvas.tsx` (Canvas 2D particle physics, 5 modes), EP9 `HeatmapCanvas.tsx` (Canvas 2D grid, 3 fill modes).

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
- **No silent explanatory scenes** — every scene that teaches a concept must have visible teaching anchors (labels, values, captions). If a scene has important animation but no text explaining what the viewer is looking at, flag it. A muted viewer should be able to follow the episode.

## Patterns ALL Old Episodes Share (flag these)
- CE with default `{ opacity: 0, y: 15 }` for every element
- `springs.snappy` (400/30) as only motion
- No layout variety, no GSAP, no palette variety, no ambient CSS animation

## What You Do NOT Need
You don't need animation API docs, Camera props reference, GSAP code examples, or voiceover wiring details. Those are build-phase concerns. Focus on the output quality, not the implementation details.
