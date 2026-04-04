# Critic Agent Guide — Bitcoin Explainer Series

Context for critique-phase agents reviewing built episodes.

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

## Scene Composition — No Single-Element Episodes
- **Different scenes = different visual elements.** A UTXO ledger in scenes 3-8 should NOT still dominate scenes 14-20.
- **Build, climax, clear, rebuild.** Visual "chapter breaks."
- **All content must fit within the 1920×1080 viewport.** No off-screen elements, no oversized canvases.
- **Rule of thumb:** No single component visible for more than ~40% of the episode.
- **Each act gets its own visual centerpiece.** 4 acts = 4 primary visuals, not 1 visual with 4 layouts.

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

## Timing Guidelines
- Scene intro: 0.4-0.6s
- First content: delay 0.3-0.5s
- Stagger: 0.3-0.6s apart
- Rhythm: fast-fast-SLOW
- Hold 1-2s at end of scene

## Episode Registry (what's been done — avoid repeating)

| EP | Topic | Background | Core Visual | Layout | Animation Lib | What NOT to repeat |
|---|---|---|---|---|---|---|
| 1 | Off-by-one error | Beige | Fencepost block grid | Centered | FM CE only | Centered layout, CE fade-in |
| 2 | SegWit addresses | Beige | Bech32 character grid | Centered | FM CE only | Character grid pattern |
| 3 | SHA-256 padding | Beige | Binary block padding | Centered | FM CE only | Binary grid |
| 4 | Garbled circuits | Beige | AND gate truth table | Split-screen | FM CE + table | Split-screen panel |
| 5 | 64-byte TX bug | Dark | Merkle tree SVG | Layered | FM CE + SVG | Tree visualization |
| 6 | Duplicate TXID | Beige | Mirror cards + collision | Bilateral mirror | FM CE + CSS | Mirror layout |

**Patterns ALL old episodes share (flag these):**
- CE with default `{ opacity: 0, y: 15 }` for every element
- `springs.snappy` (400/30) as only motion
- No layout variety, no GSAP, no palette variety, no ambient CSS animation

## Text Rules (for critique)
- **Screen-space captions**: ONE sentence, max ~15 words. Two short elements OK.
- **No paragraphs on screen.** 3+ sentences in one scene = split.
- **Text inside visuals** (labels, formulas, values): encouraged, no limit.

## Engagement Checklist
- Is there a clear **highlight/aha scene** that visually breaks the pattern?
- Is there a **"why is this a big deal?"** beat after teaching the mechanism?
- Does cascading consequence show downstream effects?
- Does it show running state during multi-step transforms?
- **No silent explanatory scenes** — every scene that teaches a concept must have visible teaching anchors (labels, values, captions). If a scene has important animation but no text explaining what the viewer is looking at, flag it. A muted viewer should be able to follow the episode.

## What You Do NOT Need
You don't need animation API docs, Camera props reference, GSAP code examples, or voiceover wiring details. Those are build-phase concerns. Focus on the output quality, not the implementation details.
