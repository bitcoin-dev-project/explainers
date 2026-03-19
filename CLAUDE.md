# Bitcoin Error Explainer — Animated Video Series

This project creates animated Bitcoin educational video explainers using React + Framer Motion, recorded to MP4 via Playwright + FFmpeg.

## Workspace
- `client/src/episodes/` — each episode is a folder with a `VideoTemplate.tsx` and `scenes/` directory
- `client/src/lib/video/` — shared hooks (`useVideoPlayer`, `useSceneTimer`), animation presets, `DevControls`
- `scripts/` — recording (`record.mjs`) and voiceover generation (`generate-voiceover.mjs`)
- `client/public/audio/` — scene voiceover MP3s
- `references/` — brand guidelines, writing style references

## Episode Format — Single-Canvas Architecture (3B1B Style)

Episodes use a **single persistent canvas** where all visual elements live in ONE component. Instead of mounting/unmounting separate scene components (PowerPoint-style), `currentScene` drives element visibility and animation. Elements morph, appear, and disappear smoothly on the same canvas — like 3Blue1Brown, not slides.

### Episode Structure
```
ep<N>-<slug>/
├── VideoTemplate.tsx    # Single canvas with all elements + scene timing
```
No `scenes/` folder needed. Everything is in one file. For very large episodes, you may split logical sections into helper components imported into VideoTemplate, but they are NOT mounted/unmounted per scene — they receive `scene` as a prop.

### VideoTemplate Pattern
```tsx
import { useVideoPlayer, DevControls, CE, morph } from '@/lib/video';
import { TreeNode, Connector, DiagramBox } from '@/lib/video/diagrams';

const SCENE_DURATIONS = {
  scene1: 6000,   // Title
  scene2: 8000,   // Opening concept
  scene3: 10000,  // Diagram builds
};

export default function VideoTemplate() {
  const player = useVideoPlayer({ durations: SCENE_DURATIONS });
  const s = player.currentScene;

  return (
    <div className="w-full h-screen overflow-hidden relative"
         style={{ backgroundColor: 'var(--color-bg-light)' }}>

      {/* Title — visible only during scene 0 */}
      <CE s={s} enter={0} exit={1} delay={0.3}
          className="absolute inset-0 flex items-center justify-center">
        <h1 className="text-[4vw] font-bold"
            style={{ fontFamily: 'var(--font-display)' }}>
          Episode Title
        </h1>
      </CE>

      {/* Merkle tree — appears at scene 1, stays through scene 5 */}
      <CE s={s} enter={1} exit={6}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="absolute inset-0 flex items-center justify-center">
        <svg width="40vw" height="30vh" viewBox="0 0 600 220" fill="none">
          <TreeNode x={300} y={20} label="Root" delay={0.5} variant="primary" />
          <TreeNode x={160} y={90} label="H(1,2)" delay={0.8} variant="accent" />
        </svg>
      </CE>

      {/* Element that morphs position across scenes */}
      <motion.p {...morph(s, {
        1: { opacity: 1, y: 0 },
        3: { opacity: 1, y: -30 },
        5: { opacity: 0 },
      })}>
        Each parent = SHA256(left ‖ right)
      </motion.p>

      <DevControls player={player} />
    </div>
  );
}
```

### Canvas Primitives (`@/lib/video/canvas`)

#### CE (CanvasElement) — Enter/exit lifecycle
```tsx
// Simple element: enters at scene 2, exits at scene 5, 0.3s delay
<CE s={s} enter={2} exit={5} delay={0.3}>
  <h2>Heading text</h2>
</CE>

// SVG group: use as="g" inside <svg>
<CE s={s} enter={2} exit={5} as="g">
  <TreeNode x={100} y={50} label="Root" />
</CE>

// Container with children that have their own delays:
<CE s={s} enter={1} exit={7} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
  <svg>
    <TreeNode delay={0.5} />
    <TreeNode delay={0.8} />
  </svg>
</CE>

// Custom enter/exit animations:
<CE s={s} enter={3} initial={{ opacity: 0, scale: 0.5 }}
    animate={{ opacity: 1, scale: 1 }} exitStyle={{ opacity: 0, scale: 1.5 }}>
  <DiagramBox label="Hash" variant="primary" />
</CE>
```

Props: `s` (current scene), `enter`, `exit?`, `delay?`, `initial?`, `animate?`, `exitStyle?`, `transition?`, `as?` ('div'|'span'|'p'|'g'), `className?`, `style?`

#### morph() — Scene-driven animation states
```tsx
<motion.g {...morph(s, {
  2: { x: 100, y: 200, opacity: 1 },
  4: { x: 300, y: 100, scale: 0.8 },
  6: { opacity: 0 },
})}>
  <TreeNode label="Root" />
</motion.g>
```
Returns `{ animate, transition }` — spread onto any `motion.*` component.

#### sceneRange() — Boolean visibility helper
```tsx
const showTree = sceneRange(s, 2, 8);  // true when scene is in [2, 8)
```

### Key Principles
- **No AnimatePresence on scenes.** Individual `CE` elements handle their own enter/exit.
- **Elements persist across scenes.** A Merkle tree built in scene 3 stays visible in scene 5 without rebuilding.
- **Use `morph()` for elements that change position/style across scenes.** Much more dynamic than fade-between-slides.
- **Use `CE` for elements with simple enter/exit lifecycle.** Most elements fit this pattern.
- **Layout with `absolute` positioning.** Since everything is on one canvas, use `absolute` + flexbox for positioning. Elements can overlap naturally.
- **Children can have their own delays.** `CE` controls when the container mounts; `TreeNode`, `Connector` etc. handle their own staggered reveals inside.

### Scene Structure (within single canvas)
- Use viewport-relative units (`vw`, `vh`) for responsive 1920×1080 capture
- Import from `@/lib/video`: `CE`, `morph`, `sceneRange`, `springs`, diagram components
- Each "scene" is a time window — elements declare which scenes they're visible during via `enter`/`exit`
- Elements can span multiple scenes (e.g., a diagram that stays while text changes around it)

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

### Scene Transitions (Single Canvas)
No page-level transitions. Instead, elements transition individually:
- **Enter:** Elements fade/slide in via `CE` with staggered delays
- **Exit:** Elements fade out when their `exit` scene arrives
- **Morph:** Elements change position/style via `morph()` — the viewer sees continuous transformation
- **Overlap:** New elements can start entering before old ones finish exiting — creates a flowing feel
- **Background changes:** Use `morph()` on the background container for gradual color shifts between sections

### Element Animation Patterns
- **Flow diagrams**: Input → [Box] → Output pattern with arrows drawing in via `pathLength`
- **Tables/grids**: Rows stagger in one by one, cells highlight on the active step
- **Labels and badges**: `popIn` or `fadeUp` with springs for emphasis
- **Running state**: Show the full data in every scene with the current step's portion highlighted/boxed — viewer always sees where they are in the process
- **SVG line drawing**: Use `pathLength: 0 → 1` for arrows, connections, circuit diagrams

### Diagram Components (`@/lib/video/diagrams`)
Reusable animated primitives available as a **starting point**. Use them for common patterns (flow diagrams, tables, badges), but **create custom topic-specific components when the concept deserves unique visual treatment**. A hash function episode should look different from a Merkle tree episode — let the topic drive the visuals, not the component library.

**When to use the library:** Generic boxes, arrows, tables, badges — structural elements that don't need to be unique.
**When to build custom:** The episode's core visual concept — the ONE thing that makes this topic's animation memorable. A custom bit-grid for SHA-256, a custom network graph for P2P, a custom elliptic curve for ECDSA. These should be built fresh, not forced into DiagramBox.

Import: `import { DiagramBox, Arrow, FlowRow, Connector, TreeNode, TableGrid, Badge, DataCell, Brace, HighlightBox } from '@/lib/video/diagrams';`

#### DiagramBox — Labeled box with variants
```tsx
<DiagramBox label="Input" sublabel="256 bits" delay={0.5} variant="primary" size="md" mono />
```
Variants: `default`, `primary`, `accent`, `success`, `danger`, `muted`. Sizes: `sm`, `md`, `lg`. Supports `dark` prop for dark-background scenes.

#### Arrow — SVG arrow with pathLength draw-in
```tsx
<Arrow delay={0.8} direction="right" length="4vw" color="var(--color-secondary)" label="hash output" dashed={false} curved={false} />
```
Directions: `right`, `left`, `down`, `up`. Supports labels, dashed style, curved paths.

#### FlowRow — Automatic Input → Process → Output flow
```tsx
<FlowRow
  steps={[
    { label: 'Input', sublabel: 'data', variant: 'primary' },
    { label: 'Hash', variant: 'accent' },
    { label: 'Output', variant: 'success' },
  ]}
  baseDelay={0.5} stagger={0.5} arrowLength="3.5vw"
/>
```
Auto-staggers delays. Best for linear pipelines. One-liner for common patterns.

#### Connector — SVG bezier curve for tree/graph edges
```tsx
<Connector from={[100, 50]} to={[200, 150]} delay={0.5} color="var(--color-secondary)" curvature={0.5} showArrow={true} />
```
Use inside `<svg>`. Pair with `TreeNode` for trees. `curvature` 0 = straight, higher = more curve.

#### TreeNode — SVG node for Merkle/binary trees
```tsx
<TreeNode x={150} y={50} label="Root" delay={0.5} variant="primary" width={60} height={26} />
```
Use inside `<svg>`. Pair with `Connector` for parent-child edges. Supports all variants + `dark` prop.

**Merkle tree pattern:**
```tsx
<svg width="40vw" height="30vh" viewBox="0 0 600 220" fill="none">
  {/* Leaves */}
  <TreeNode x={90}  y={170} label="Tx₁" delay={0.8} variant="default" width={55} height={26} />
  <TreeNode x={230} y={170} label="Tx₂" delay={1.0} variant="default" width={55} height={26} />
  {/* Connectors draw up */}
  <Connector from={[90, 170]} to={[160, 116]} delay={2.0} color="var(--color-secondary)" curvature={0.3} />
  <Connector from={[230, 170]} to={[160, 116]} delay={2.2} color="var(--color-secondary)" curvature={0.3} />
  {/* Parent appears after connectors */}
  <TreeNode x={160} y={90} label="H(1,2)" delay={2.5} variant="accent" width={60} height={26} />
</svg>
```

#### TableGrid — Animated table with row stagger
```tsx
<TableGrid
  columns={[{ header: 'Input', width: '6vw', mono: true }, { header: 'Output', width: '8vw' }]}
  rows={[
    { cells: ['0', 'Hash(0)'], highlight: false },
    { cells: ['1', 'Hash(1)'], highlight: true, highlightColor: 'var(--color-primary)' },
  ]}
  baseDelay={0.5} rowStagger={0.3}
/>
```
Rows fade in with left-slide. Highlight adds left accent bar.

#### Badge — Pill-shaped label
```tsx
<Badge delay={0.5} variant="primary" size="md">Step 1</Badge>
```

#### DataCell — Monospace data display
```tsx
<DataCell delay={0.3} highlight color="var(--color-secondary)">a1b2c3d4e5f6</DataCell>
```

#### Brace — Animated curly brace with label
```tsx
<Brace width="40vw" delay={0.5} direction="down" label="Merkle root" color="var(--color-secondary)" />
```

#### HighlightBox — Subtle glow wrapper
```tsx
<HighlightBox delay={1.0} color="var(--color-primary)" padding="1.5vh 1.5vw">
  <p>Key concept</p>
</HighlightBox>
```

### Voiceover-Synced Reveals (CRITICAL when audio exists)
When an episode has voiceover, animation reveals MUST sync with what the narrator is saying. Elements appear WHEN the narrator mentions them — not all at once when the scene loads. The screen should start mostly empty and build up as the narrator explains.

**The rule:** Don't show it until the narrator says it.

**How to sync:** Audio starts 400ms after scene enters. So if the narrator says "and here's the root" at ~3.5s in the audio, the animation delay = 3.5 + 0.4 = 3.9s. Add timing comments to every animated element:

```tsx
{/* "bundles hundreds of transactions" @ ~2s audio → 2.4s scene */}
<motion.div transition={{ delay: 2.4 }}>
  <TxBox />
</motion.div>

{/* "how do you prove yours is inside?" @ ~4s audio → 4.4s scene */}
<motion.p transition={{ delay: 4.4 }}>
  But how do you prove yours is inside?
</motion.p>
```

**Visual reinforcement:** When the narrator describes a relationship (e.g., "the root goes into the block header"), show it visually — an arrow, a highlight, a connection line. The animation should illustrate what the voice is explaining, not just display text.

### Timing Guidelines
- Scene intro transition: 0.4-0.6s
- First content element: delay 0.3-0.5s after scene enters
- Subsequent elements: stagger 0.3-0.6s apart
- Final emphasis element: use `springs.bouncy` or `springs.poppy`
- Leave 1-2s of "hold" time at end of scene before auto-advancing (viewer needs time to absorb)

### Motion Personality Per Episode
Don't use the same spring config for every episode. Match the animation feel to the topic:
- **Aggressive/security topics:** `stiffness: 500+`, `damping: 15-20` — snappy, sudden, tense
- **Mathematical/crypto topics:** `stiffness: 100-150`, `damping: 25-30` — slow, precise, deliberate
- **Network/distributed topics:** `stiffness: 200-300`, `damping: 20` — flowing, wave-like, organic
- **Step-by-step processes:** mix fast setup moves (`stiffness: 400`) with slow key reveals (`stiffness: 80`)
- Define episode-local spring configs when the shared `springs` presets don't fit the mood

## Visual Style

### Brand Constants (always keep)
- Beige/cream background (`var(--color-bg-light)`: #E6D3B3) as default canvas
- Orange accent (`var(--color-primary)`: #E77F32) for highlights, step numbers, key values
- Dark text (`var(--color-text-primary)`: #1C1C1C)
- Font: DM Sans for display/body, JetBrains Mono for code/technical data
- Hedgehog characters as mascots (Alice, Bob, Carol — distinct outfit colors)

### Per-Episode Visual Identity
Each episode should have its own visual personality driven by its topic. The brand constants above are the thread that ties episodes together — everything else can (and should) vary.

**Episode accent colors** — beyond the brand orange, each episode may introduce 1-2 topic-specific accent colors. Examples:
- Security/attack episodes: red (#E74C3C) + dark slate for danger/tension
- Cryptography episodes: purple (#8B5CF6) + teal for mathematical elegance
- Network/P2P episodes: green (#10B981) + cyan for connectivity
- Consensus episodes: gold (#F59E0B) + deep blue for authority/trust

**Episode visual motif** — each episode should have ONE signature visual idea that makes it instantly recognizable. Not reused across episodes:
- SHA-256: bit grid with colored rows
- Merkle trees: growing tree with animated connectors
- Mining: difficulty target as a shrinking zone
- Signatures: sender→channel→receiver persistent layout
- Timelocks: animated clock/timeline

**Layout variety** — don't default to "heading top, diagram center, label bottom" every time. Let the content dictate layout:
- Split-screen for comparisons (attack vs defense)
- Full-bleed diagram with floating labels for complex visuals
- Centered single element for dramatic reveals
- Persistent sidebar + main content for multi-step processes
- Diagonal/asymmetric layouts for energy and dynamism

### General Visual Guidelines
- Hand-drawn feel: arrows, labeled boxes, simple diagrams
- Bold headers, numbered steps ("Step 1:", "Step 2:")
- Checkmarks and cross marks for comparisons
- Color-coded elements (orange for labels, accent colors for key value highlights)

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
2. **Problem > Failure > Fix Loop** — build a naive system, show how it breaks, fix it, show how it breaks again, fix again. Each failure motivates the next layer. (Ledger → forgery problem → digital signatures → centralization problem → proof of work → blockchain.) Best for: protocol design, system architecture, cryptography — any topic where the "why" of each component only makes sense after seeing the failure it prevents.
3. **Definition-Deep-Dive** — define concept, layer complexity scene by scene, show internals step by step with progressive animations
4. **Dialogue-Driven** — characters ask questions, get answers. Natural Q&A flow. Works great for protocol/system explainers.
5. **Specific > General** — concrete example with real values first, then generalize to the abstract rule. A worked SHA-256 round is more engaging than the algorithm definition.
6. **Wrong > Less Wrong > Right** — start with the naive/wrong approach, show why it fails, refine. Each iteration gets closer to the real solution. Good for approximations, security models, consensus mechanisms.

### Emotional Arc
Target this arc across the episode: **Curiosity > Confusion > Partial clarity > Aha moment > Satisfaction.** The "aha moment" should land in the Highlight Scene. Everything before it builds tension; everything after it pays off.

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

### Cascade / Domino Consequence
When a system has dependencies, show what happens when one piece changes by animating downstream breakage in sequence. Change one transaction → that block's hash changes → next block's "previous hash" mismatches → all subsequent blocks break, one by one. The viewer sees cause-and-effect propagating. Powerful for:
- Tamper-resistance (blockchain, Merkle trees, checksums)
- Error propagation (hash chains, signature verification)
- Why immutability matters

```tsx
{/* Animate blocks breaking one by one with staggered delays */}
{blocks.map((block, i) => (
  <motion.div
    key={i}
    animate={tampered && i >= tamperedIndex ? { borderColor: '#E74C3C', scale: [1, 1.05, 1] } : {}}
    transition={{ delay: (i - tamperedIndex) * 0.4 }}
  />
))}
```

### Scale Comparison — Make Big Numbers Real
When a topic involves incomprehensibly large numbers (2^256 hash space, mining difficulty, key space), don't just write the number — decompose it into tangible comparisons. Start with one comprehensible quantity → multiply by another → repeat until the viewer *feels* the impossibility. Use progressive zoom-out or rescaling to map number growth to spatial growth.

Example: 2^256 → (2^32)^8 → "4 billion" × "4 billion" × ... until the scale becomes absurd. Each factor maps to something physical (people on Earth, grains of sand, atoms in the universe).

### Bit Grid Visualization
For topics involving binary data (hashes, keys, addresses, signatures), render actual bits as a visual grid — rows of colored 1s and 0s. Use 8 rows × 32 columns for SHA-256 (= 256 bits). Highlight subsets by color to show structure (leading zeros for PoW, key prefix bytes, checksum portions).

```tsx
{/* Render real SHA-256 output as a visual bit grid */}
<div style={{ display: 'grid', gridTemplateColumns: 'repeat(32, 1fr)', gap: '2px', fontFamily: 'JetBrains Mono' }}>
  {bits.map((bit, i) => (
    <motion.span
      key={i}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: i * 0.01 }}
      style={{ color: i < leadingZeros ? 'var(--color-primary)' : 'var(--color-text-primary)' }}
    >
      {bit}
    </motion.span>
  ))}
</div>
```

### Communication Channel Layout
For protocol explanations (signatures, encryption, verification), use a persistent Sender → [Channel] → Receiver layout. Sender on the left, receiver on the right, data flows through the channel between them. Keep this layout stable across multiple scenes so the viewer tracks the spatial relationship.

### Network / Broadcast Visualization
When explaining distributed systems or propagation (P2P gossip, block propagation, mempool), show a network of nodes with animated connections. Signals radiate outward from a source node using expanding rings or sequential edge highlights with staggered delays.

## Visual Diversity by Topic Context

**Every episode should feel like it was designed specifically for its topic, not stamped out of a template.** The shared infrastructure (`CE`, `morph`, `useVideoPlayer`, `DevControls`, `springs`) stays consistent — that's what makes development fast. But the visual layer (diagrams, layouts, colors, motion style, custom components) should be driven by what the topic naturally looks like.

### Topic → Visual Language Map
Use this as inspiration, not prescription. The best visual approach is the one that makes the concept click.

| Topic Category | Natural Visuals | Motion Style | Accent Colors |
|---|---|---|---|
| **Hash functions** | Bit grids, data flowing through a funnel, avalanche cascades | Sharp, fast transforms; data "crunching" feel | Blues, cyans |
| **Trees (Merkle, etc.)** | Growing trees, leaves → root animation, branch highlighting | Organic growth, bottom-up reveals | Greens, earth tones |
| **Security/attacks** | Red zones, broken chains, attacker vs victim split-screen | Aggressive, sudden breaks; tension-building | Reds, dark slates |
| **Cryptography (signatures, keys)** | Lock/unlock metaphors, sender→receiver channels, key pairs | Mathematical precision, smooth morphs | Purples, teals |
| **Consensus/mining** | Competing chains, difficulty targets, block races | Parallel synchronized motion, race dynamics | Golds, deep blues |
| **Network/P2P** | Node graphs, signal propagation, broadcast rings | Radiating outward, wave-like spreads | Greens, cyans |
| **Encoding/serialization** | Byte dissection, format anatomy, color-coded segments | Precise, surgical reveals; zoom-in on data | Warm neutrals, highlights per segment |
| **Transactions** | Flow of value, UTXO boxes connecting, fee visualization | Flowing, directional (left→right value movement) | Greens (value), oranges (fees) |
| **Timelocks/scripting** | Timelines, conditional branches, clock animations | Time-based reveals, countdown feel | Amber, slate |

### Encouraged Custom Techniques
Don't limit yourself to the diagram library. Each episode can introduce:
- **Custom SVG animations** — hand-craft an SVG specific to the concept (e.g., an elliptic curve, a circuit diagram, a blockchain fork visualization)
- **CSS animations** — `@keyframes` for effects that don't need JS control (pulsing glows, rotating elements, gradient shifts)
- **Canvas/WebGL** — for particle effects, generative backgrounds, or data visualizations that benefit from GPU rendering
- **Inline computed visuals** — generate diagram data from real values (actual SHA-256 output, real Bitcoin addresses, computed Merkle paths) instead of hardcoded placeholder text
- **Custom layout components** — a `NetworkGraph`, `ByteDissector`, `TimelineScrubber` that lives in the episode folder, not the shared lib
- **Step-based state machines** — `useState` + `useEffect` with timed transitions for multi-step animations within a single scene (build a tree level by level, process data byte by byte)
- **Third-party libraries** — if a topic genuinely benefits from a specialized library (e.g., `d3-force` for network layouts, `react-spring` for specific physics), use it. Don't force Framer Motion to do everything.

### What Stays Consistent Across Episodes (Brand Thread)
- Beige/cream base background
- Orange as primary brand accent
- DM Sans + JetBrains Mono fonts
- `CE` / `morph` / `springs` infrastructure
- Progressive reveal principle (staggered delays, never dump content)
- Text rules (short captions, animation teaches)
- Hedgehog characters when characters appear
- DevControls + useVideoPlayer for playback

Everything else is **fair game for creative variation**.

## What Makes Top Performers Work
1. Timeliness — first to explain a hot/new concept visually
2. **Visual novelty — each episode looks and feels different from the last**
3. Depth-to-accessibility ratio — go deep but stay approachable
4. The "aha moment" — make something people heard of but don't understand click
5. Real examples — actual values, real tool names, real scenarios
6. Smooth animations — progressive reveal feels like magic, keeps viewers watching
7. **Topic-specific visual identity** — the animation style matches the concept being taught

## Content Checklist
- Pick a topic people have heard of but don't really understand
- **Define the episode's visual concept** — what's the ONE signature visual? What accent colors? What layout? (See "Step 0" in Adding a New Episode)
- **Build at least one custom component** for the episode's core visual — don't default to DiagramBox for everything
- Target the emotional arc: Curiosity > Confusion > Partial clarity > Aha > Satisfaction
- Find a natural analogy (or skip it if none fits)
- Open from what the viewer already knows, then build toward the technical concept
- **One sentence per scene heading, max ~15 words** — if you're writing more, split it
- **Every scene should have animated visuals** — text captions the animation, not the other way around
- Use a real worked example with actual values when possible
- Progressive reveal in every scene — staggered delays, never dump everything at once
- **Vary motion style to match the topic's mood** — don't use identical spring configs for every episode
- End with CTA on last scene
- Use as many scenes as needed — no limit on count, just stay under 2 minutes total

## Voiceover Script & Audio Sync

**Voiceover is opt-in.** By default, generate episodes WITHOUT voiceover — just scenes and VideoTemplate. Only produce voiceover deliverables (transcript, ElevenLabs script, audio sync, MP3 generation) when the user explicitly asks for it (e.g., **"with voice"**, **"add voiceover"**, **"generate audio"**).

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

## Manim Animations (Optional — Use Your Judgment)

**Default to React + Framer Motion for all scenes.** However, if you genuinely think a scene would benefit from Manim (e.g., tree structures growing level-by-level, hash round animations, byte-level dissections, elliptic curve math, smooth morphing transforms), go ahead and use it. The bar is: "Would this look significantly better animated in Manim than in Framer Motion?" If yes, use Manim. If it's just boxes and text appearing, stick with React.

When using Manim:
- Use the base class from `manim/base.py` (provides `BitcoinScene` with brand colors)
- Render clips to `client/public/video/ep<N>-<slug>/` via `node scripts/render-manim.mjs ep<N>-<slug>`
- Embed in React scenes as `<motion.video src="/video/ep<N>-<slug>/clip.mp4" autoPlay muted playsInline />`
- Keep clips short (3-8s), use brand colors only, resolution 1920×1080
- Render: `source .venv/bin/activate && manim -qh manim/ep<N>_clip.py SceneName`
- Preview (low quality): `manim -pql manim/ep<N>_clip.py SceneName`

### Manim API Quick Reference (ManimCE)

We use **ManimCE (Community Edition)**: `from manim import *`

#### Key Animations
```python
# Appearing
self.play(Write(tex))                  # Handwriting style (equations)
self.play(Create(line))                # Draw path/shape progressively
self.play(FadeIn(mob, shift=UP))       # Fade in from direction
self.play(GrowArrow(arrow))            # Arrow grows from start
self.play(DrawBorderThenFill(mob))     # Outline then fill

# Transforming — ALWAYS prefer transforms over FadeOut/FadeIn pairs
self.play(TransformMatchingShapes(source, target))  # Morph matching parts
self.play(ReplacementTransform(source, target))     # Replace one with another
self.play(TransformFromCopy(source, target))        # Transform a copy (source stays)
self.play(mob.animate.shift(RIGHT).set_color(RED))  # Chained property animation

# Staggered reveals (very common, natural feel)
self.play(LaggedStartMap(FadeIn, group, lag_ratio=0.1))

# Highlighting
rect = SurroundingRectangle(mob, buff=0.2, color=YELLOW)
self.play(Create(rect))
self.play(Indicate(mob))               # Brief scale+color flash
self.play(Flash(point, color=YELLOW))  # Radial flash
```

#### Rate Functions (Easing)
```python
smooth        # Default — good general purpose
linear        # Constant speed
ease_in_expo  # Dramatic entrance
ease_out_bounce  # Playful landing
there_and_back   # Emphasis pulse (scale up then back)
rush_into     # Quick start, slow end
```

#### Updaters & ValueTrackers
```python
# Dynamic following
label.add_updater(lambda m: m.next_to(dot, UP))

# Animated parameter
tracker = ValueTracker(0)
dot.add_updater(lambda m: m.move_to(axes.c2p(tracker.get_value(), f(tracker.get_value()))))
self.play(tracker.animate.set_value(5), run_time=3)

# Auto-rebuilding mobject
line = always_redraw(lambda: Line(start.get_center(), end.get_center()))
```

#### Bitcoin-Relevant Patterns
```python
# Cascade/domino — blocks breaking one by one
for i, block in enumerate(blocks[changed_index:]):
    self.play(block.animate.set_color(RED), Flash(block.get_center(), color=RED), run_time=0.5)
    self.wait(0.3)

# Bit grid — render real hash output
def get_bit_grid(bit_string, n_cols=32):
    bits = VGroup(*[Text(b, font="Courier New").scale(0.3) for b in bit_string])
    bits.arrange_in_grid(rows=len(bit_string) // n_cols, cols=n_cols, buff=0.05)
    return bits

# Network broadcast — signal propagating through nodes
for target in connected_nodes:
    edge = Line(source.get_center(), target.get_center(), color=YELLOW)
    self.play(Create(edge), run_time=0.3)
    self.play(Flash(target.get_center(), color=YELLOW), run_time=0.3)

# Communication channel — Alice → [network] → Bob
sender = VGroup(Dot(color=BLUE), Text("Alice", color=BLUE).scale(0.4)).arrange(DOWN)
receiver = VGroup(Dot(color=GREEN), Text("Bob", color=GREEN).scale(0.4)).arrange(DOWN)
sender.move_to(LEFT * 5); receiver.move_to(RIGHT * 5)
channel = DashedLine(sender.get_right(), receiver.get_left(), color=GREY)
```

#### Manim Best Practices
- **Transform, don't replace** — `TransformMatchingShapes(a, b)` over `FadeOut(a)` then `FadeIn(b)`. The viewer sees the connection.
- **LaggedStart** — keep `lag_ratio` between 0.05-0.2 for natural feel
- **Progressive disclosure** — build equations term by term, never flash full formulas
- **`self.wait()`** generously — let visuals breathe, especially after key reveals
- **Rhythm: fast-fast-SLOW** — quick setup moves, then slow down on the key insight
- Use `VGroup` for grouping, `.copy()` when reusing mobjects
- Use `BackgroundRectangle(text, fill_opacity=0.8)` for readability over busy visuals

## Adding a New Episode

All steps below are done automatically when you ask for a new episode. Voiceover steps are ONLY done when the user explicitly asks for voiceover.

### Step 0: Visual Concept (BEFORE writing any code)
Before touching code, answer these three questions for the episode:

1. **What's the ONE signature visual?** — The unique animation/diagram that makes this episode visually distinct. Not a DiagramBox. Something custom that fits THIS topic. Examples: a cascade of breaking blocks, an elliptic curve with a bouncing point, a binary tree growing from leaves, a network of nodes propagating signals.

2. **What's the episode accent palette?** — Pick 1-2 colors beyond brand orange that reinforce the topic's mood. Security = reds. Crypto math = purples. Networking = greens. Define these as local CSS variables or inline styles in VideoTemplate.

3. **What layout pattern fits this content?** — Don't default to centered-stack. Consider: split-screen, persistent sidebar, full-bleed diagram, communication channel, timeline, or something entirely new.

4. **What custom components does this episode need?** — If the topic has a natural visual language (tree nodes, network graphs, byte grids, circuit diagrams, timelines), build a small custom component for it. It lives in the episode folder, not in the shared library. Keep shared `CE`/`morph`/`springs` for infrastructure, but let the visual layer be fresh.

5. **What animation style fits the mood?** — Not every episode should move the same way. A security attack episode might use sharp, aggressive transitions. A cryptography deep-dive might use slow, mathematical morphs. A consensus episode might use synchronized parallel animations. Pick spring configs and timing that match the emotional register.

### Steps 1-8: Implementation

1. Create `client/src/episodes/ep<N>-<slug>/VideoTemplate.tsx` — single-canvas component using `CE`, `morph`, and **custom topic-specific components**
2. Define `SCENE_DURATIONS` — estimate from content density (simple: 6-7s, diagram: 8-10s, complex: 10-12s)
3. Build the signature visual first — the core custom animation that defines the episode's look. Then build supporting scenes around it.
4. **(Only if user asks for voiceover)** Write transcript, generate audio, sync delays
5. Register in `client/src/App.tsx` routes and `client/src/pages/Home.tsx` episode list
6. Export from `client/src/episodes/index.ts`
7. Preview: `npm run dev:client` → navigate to `#ep<N>`
8. Record: `node scripts/record.mjs`

**Legacy episodes** (ep1–ep6) use the old slide-based pattern with `scenes/` folders and `AnimatePresence mode="wait"`. Do not convert them — they work fine. New episodes use the single-canvas pattern.
