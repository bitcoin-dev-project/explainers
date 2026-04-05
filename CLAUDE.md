# Bitcoin Error Explainer — Animated Video Series

Animated Bitcoin educational explainers using React. Recorded to MP4 via Playwright + FFmpeg, with automated visual QA.

## Workspace
- `client/src/episodes/` — each episode folder has `VideoTemplate.tsx` + custom components
- `client/src/lib/video/` — shared hooks (`useVideoPlayer`), canvas primitives (`CE`, `morph`, `sceneRange`), `DevControls`, animation presets, diagram components
- `scripts/` — auto-episode pipeline (`auto-episode.sh`), **visual QA (`visual-qa.mjs`)**, scene screenshots (`screenshot-scenes.mjs`)
- `client/public/audio/` — scene voiceover MP3s
- `references/` — brand guidelines, writing style references

## Role-Specific Guides

This project splits context by agent role to reduce token cost and keep each agent focused:

- **`CLAUDE-build.md`** — Animation toolkit, GSAP utilities, VideoTemplate patterns, episode architecture. For build-phase agents only.
- **`CLAUDE-critic.md`** — Quality bar, sameness checklist, visual distinction rules, episode registry. For critique-phase agents only.
- **`CLAUDE-research.md`** — Teaching approaches, content checklist, tone/voice. For research-phase agents only.

Build agents: read `CLAUDE-build.md`. Critics: read `CLAUDE-critic.md`. Research agents: read `CLAUDE-research.md`. All agents should read this core file.

## Automated Visual QA (`scripts/visual-qa.mjs`)

**Run after building any episode.** Opens the episode in Playwright at 1920×1080, steps through every scene, checks element positions with `getBoundingClientRect()`.

```bash
node scripts/visual-qa.mjs ep11 ./visual-qa-output
```

Reports: **FAIL** (off-screen near-miss), **WARN** (clipped >40% or far off-screen elements). Generates screenshots + markdown report.

**Do NOT write manual POSITION AUDIT comments** — the automated tool replaces manual math audits.

## Scene Rules
- **One idea per scene.** One concept, one step, one point.
- **Scene 1 = Title.** Scene 2 = start from familiar ground — don't open with jargon. A cold open on "Merkle proofs" loses people instantly. Instead: "A block bundles transactions" → "How do you prove yours is inside?" The hook emerges from the progression, not from forcing a dramatic opener. Only use a punchy hook-first opening when the topic is already familiar to the audience.
- **Last scene = CTA** ("Follow @bitcoin_devs") + optional series teaser for next episode.
- **Scene duration = content density.** Simple text reveal: 6-7s. Diagram building: 8-10s. Complex multi-step animation: 10-12s. Never exceed 12s unless the scene has a running transformation that needs time to breathe.
- **Use as many scenes as needed.** More scenes with less content each > fewer dense scenes.

## Text Rules
Text and visuals work TOGETHER. The best scenes have **text integrated into the visual** — labels on diagrams, values inside blocks, formulas next to the thing they describe. Think 3Blue1Brown: equations animate alongside the geometry, labels point to the thing they name.

1. **Text inside visuals** (labels, values, formulas, block numbers, field names) — ENCOURAGED. No word limit.
2. **Screen-space captions** (headings, one-liners floating above the visual) — ONE sentence, max ~15 words.

Rules:
- **No silent explanatory scenes.** Every scene that teaches a concept must have at least one **teaching anchor** — a label, value, formula inside the visual, OR a short caption. A muted viewer must be able to tell *what they're looking at* and *what changed*. Pure unlabeled animation is only OK for title cards, mood beats, or very short transitions.
- **No paragraphs on screen.** 3+ sentences = split across scenes.
- **Use real values.** "bitcoin" → `01100010...` beats "the input gets converted to binary."
- **Progressive reveal.** Each scene adds ONE piece. Like a conversation, not a lecture.
- **Breathing room.** Whitespace is content. Let animations breathe.
- **Questions and quizzes are powerful.** Use when the concept has a non-obvious answer.

## Timing Guidelines
- Scene intro transition: 0.4-0.6s
- First content element: delay 0.3-0.5s after scene enters
- Subsequent elements: stagger 0.3-0.6s apart
- Final emphasis element: use `springs.bouncy` or `springs.poppy`
- Leave 1-2s of "hold" time at end of scene before auto-advancing
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
export const EP_COLORS = {
  bg: '#0F172A',          // dark slate — security/attack mood
  bgAlt: '#1E293B',
  accent: '#EF4444',      // danger red
  accentAlt: '#F97316',   // warning orange
  highlight: '#FDE68A',   // gold for key reveals
  muted: '#64748B',
  text: '#F1F5F9',
};
```

**Each episode defines its own motion personality** in `constants.ts`:
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

| Topic Category | Natural Visuals | Motion Style | Accent Colors |
|---|---|---|---|
| **Hash functions** | Bit grids, data funnel, avalanche cascades | Sharp, fast transforms | Blues, cyans |
| **Trees (Merkle, etc.)** | Growing trees, leaves → root | Organic growth, bottom-up reveals | Greens, earth tones |
| **Security/attacks** | Red zones, broken chains, split-screen | Aggressive, sudden breaks | Reds, dark slates |
| **Cryptography** | Lock/unlock, sender→receiver channels | Mathematical precision, smooth morphs | Purples, teals |
| **Consensus/mining** | Competing chains, block races | Parallel synchronized motion | Golds, deep blues |
| **Network/P2P** | Node graphs, signal propagation | Radiating outward, wave-like | Greens, cyans |
| **Encoding** | Byte dissection, color-coded segments | Surgical reveals, zoom-in | Warm neutrals, highlights |
| **Transactions** | Flow of value, UTXO boxes | Flowing, directional | Greens (value), oranges (fees) |
| **Timelocks** | Timelines, conditional branches | Time-based reveals, countdown | Amber, slate |

## Engagement Techniques

### Key Insight "Highlight Scene"
One scene per episode should visually break the pattern to signal the core takeaway. Different background color, larger text, dramatic animation. Mark with `{/* HIGHLIGHT SCENE */}`.

### "Why Is This a Big Deal?" Beat
After teaching the mechanism, dedicate a scene to frame the significance.

### Cascade / Domino Consequence
Animate downstream breakage in sequence when a system has dependencies.

### Show Running State
During multi-step transformations, show full data with current step highlighted/boxed.

### Scale Comparison — Make Big Numbers Real
Decompose incomprehensible numbers into tangible comparisons.

## Teaching Approaches (pick one per episode)
1. **Problem > Failure > Fix Loop** — build naive system, show how it breaks, fix. Best for protocol design.
2. **Specific > General** — concrete example first, then abstract rule.
3. **Analogy-First** — only when analogy fits naturally.
4. **Definition-Deep-Dive** — define, then layer complexity scene by scene.
5. **Wrong > Less Wrong > Right** — start wrong, refine toward correct.
6. **Dialogue-Driven** — Alice & Bob discuss conversationally. Use `Character` component.

### Emotional Arc
Curiosity > Confusion > Partial clarity > **Aha moment** > Satisfaction.

## Scene Composition — No Single-Element Episodes
- **Different scenes = different visual elements.**
- **Build, climax, clear, rebuild.** Visual "chapter breaks."
- **All content fits within the 1920×1080 viewport.** No off-screen elements.
- **Rule of thumb:** No single component visible for more than ~40% of the episode.
- **Each act gets its own visual centerpiece.**

## Content Checklist
- Pick a topic people have heard of but don't really understand
- **Define the episode's visual concept** — ONE signature visual? What accent colors? What layout within the viewport?
- **Build at least one custom component** for the episode's core visual
- Target the emotional arc: Curiosity > Confusion > Partial clarity > Aha > Satisfaction
- Find a natural analogy (or skip it if none fits)
- Open from what the viewer already knows
- **One sentence per scene heading, max ~15 words**
- **Every scene should have animated visuals** — text captions the animation, not the other way around
- Use a real worked example with actual values when possible
- Progressive reveal — staggered delays, never dump everything at once
- **Vary motion style** — don't use identical spring configs for every episode
- End with CTA on last scene
- Use as many scenes as needed

## Episode Registry (DO NOT read old episode code)

When building a new episode, **do NOT read existing episode VideoTemplate.tsx files**. Old episodes use outdated patterns.

| EP | Topic | Background | Core Visual | Layout | Animation Lib | What NOT to repeat |
|---|---|---|---|---|---|---|
| 1 | Off-by-one error | Beige | Fencepost block grid | Centered | FM CE only | Centered layout, CE fade-in |
| 2 | SegWit addresses | Beige | Bech32 character grid | Centered | FM CE only | Character grid pattern |
| 3 | SHA-256 padding | Beige | Binary block padding | Centered | FM CE only | Binary grid |
| 4 | Garbled circuits | Beige | AND gate truth table | Split-screen | FM CE + table | Split-screen panel |
| 5 | 64-byte TX bug | Dark (#201E1E) | Merkle tree SVG | Layered | FM CE + SVG | Tree visualization |
| 6 | Duplicate TXID | Beige | Mirror cards + collision | Bilateral mirror | FM CE + CSS | Mirror layout |

**What a new episode MUST do differently:**
- Use `createThemedCE(ceThemes.xxx)` — NEVER bare CE with default fade-up
- **Viewport-first layout** — all content within 1920×1080, no oversized canvases or camera zoom/pan
- Use `useSceneGSAP` for at least one choreographed sequence
- Define custom EP_COLORS and EP_SPRINGS in constants.ts
- Core visual must NOT use CE — use morph(), GSAP, SVG morph, or canvas
- Background must follow the `--palette` mode
- **Multiple distinct visual compositions** — build, climax, clear, rebuild

## Autonomous Pipeline

`./scripts/auto-episode.sh <topic> <ep_number> <slug> [--with-voice] [--full-auto]`

Planner (can't edit code) reviews and steers. Executor (can edit code) builds. Handoff via `.auto-episode/ep<N>-<slug>/` artifacts. Pipeline: Research → Creative Vision → Storyboard → Build → Critique Loop → Voiceover. See `scripts/auto-episode.sh` for full details.

## Build Memory

Reusable lessons from past episodes live in `.auto-episode/build-memory.md`. This is a short, curated file — NOT a growing log. Stable patterns get promoted into this CLAUDE.md or the role-specific guides. The append-only episode history lives separately in `.auto-episode/episode-history.md`.
