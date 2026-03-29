# Bitcoin Error Explainer

Animated Bitcoin educational videos generated end-to-end by an autonomous multi-agent pipeline. One command, one topic — out comes a fully animated explainer episode with custom visuals, camera choreography, and voiceover.

```
./scripts/auto-episode.sh "Merkle Trees" 7 merkle-trees
```

https://github.com/user-attachments/assets/placeholder

---

## How the Pipeline Works

The pipeline orchestrates **multiple specialized AI agents** that research, design, build, and critique each episode. Agents are separated by role — some can only think and write guidance, others can only write code — so no single agent controls the full process.

```
                          TOPIC
                            |
            +---------------+---------------+
            |               |               |
     Technical         Visual          Narrative
     Research         Research          Angle
            |               |               |
            +-------+-------+
                    |
              Merged Research
                    |
         +---------+---------+
         |                   |
    Director              (can't
    Review              edit code)
         |
   Creative Vision
         |
     Storyboard
         |
    Director Review
         |
    Motion Script -------- timestamped animation spec
         |
      Wireframe ---------- skeleton layout + camera math
         |
    Wireframe QA
         |
   Build Components ------ custom visual code
         |
   Build Template --------- full VideoTemplate.tsx
         |
     Visual QA ------------ screenshot verification
         |
         +---->  CRITIQUE LOOP (up to 3x)
         |       +----------+-----------+
         |       |          |           |
         |    Visual     Technical   Audience
         |   Designer    Reviewer     Proxy
         |       |          |           |
         |       +----+-----+
         |            |
         |      Merged Critique --- score/100
         |            |
         |       Fix Plan (Planner)
         |            |
         |       Rebuild (Executor)
         |            |
         +----<  score >= 75? done : loop
                      |
              Voiceover (optional)
                      |
           Cross-Episode Learning
                      |
                   EPISODE
```

---

## The Agents

### Planner (Director)
**Can:** read code, read artifacts, write guidance documents
**Cannot:** edit code, run builds, touch the filesystem

The Planner reviews research, sets creative direction, reviews storyboards, writes fix plans, and extracts lessons. It steers without building — like a director who never touches the camera.

### Executor (Builder)
**Can:** read/write/edit code, run builds, use all tools
**Cannot:** make creative decisions without Planner guidance

The Executor builds what the Planner specifies. It creates components, assembles the VideoTemplate, fixes bugs, and iterates on critique feedback. It follows the fix plan in priority order.

### Parallel Research Agents (3x)
Three independent agents research the topic simultaneously:
- **Technical** — finds the BIP, mailing list posts, protocol-level details, real values
- **Visual** — searches for existing explanations, visual metaphors, animation techniques
- **Narrative** — finds the surprising angle, common misconceptions, the emotional arc

Results are merged into a single research document.

### Parallel Critique Agents (3x)
Three independent agents review the built episode simultaneously:
- **Visual Designer** — scores aesthetics, motion design, animation variety, camera usage (out of 50)
- **Technical Reviewer** — scores accuracy, code quality, positioning math correctness (out of 30)
- **Audience Proxy** — walks through as a first-time viewer, scores hook, teaching flow, emotional arc (out of 20)

Combined score out of 100. Below 75 triggers another critique-plan-rebuild loop.

---

## Pipeline Phases in Detail

### Phase 1: Parallel Research
Three agents run simultaneously. Each searches the web, reads source material, and writes a focused report. A merge step synthesizes them into one document, resolving conflicts (technical agent wins on facts, narrative agent wins on story decisions, visual agent wins on presentation).

### Phase 2: Director Research Review
The Planner reads the merged research and writes creative direction: teaching approach, hook, story arc, aha moment placement, what to skip, visual differentiation from past episodes. Opinionated and decisive — not "could be X or Y."

### Phase 3: Creative Vision
The Executor designs the episode's visual identity: signature animation, color palette, layout pattern, motion personality, custom components needed. Rates the concept on originality, topic fit, wow factor, and feasibility. Also brainstorms 2 alternatives.

### Phase 4: Storyboard
Scene-by-scene breakdown with: duration, on-screen text (max ~15 words), visual description, animation details, and a canvas zone plan with camera math for every shot.

### Phase 5: Director Storyboard Review
The Planner verifies alignment between research direction and storyboard. Checks text length, progressive reveal, scene pacing. Writes build priorities and flags risk areas. Last review before code.

### Phase 5.5: Motion Script
Timestamped animation spec — every element gets an exact time (`0.0s`, `0.4s`, `1.2s`...) and technique (morph, GSAP timeline, CE enter, CSS keyframes). Eliminates timing guesswork during the build.

### Phase 5.7: Wireframe Build + QA
A skeleton VideoTemplate with colored rectangles at exact canvas positions. Camera shots are wired up. Screenshots are captured and verified. Positioning must be perfect before real components are built on top.

### Phase 6-7: Build Components + Template
Custom visual components are built first (the signature animation), then assembled into the full VideoTemplate. The wireframe's verified positions are preserved — placeholder boxes get replaced with real visuals.

### Phase 8: Visual QA
Screenshots of every scene. An agent verifies positioning math (`screen = canvas x scale + camera`), checks for off-screen content, overlapping elements, empty scenes. Fixes issues and updates the position audit.

### Phase 9: Critique Loop
Three parallel critics score the episode. Scores merge to a total out of 100. Below 75: a Planner writes a bounded fix plan (3-5 priorities max, not a rewrite), then an Executor implements it. Loop runs up to 3 times.

### Phase 10: Voiceover (optional)
Writes a transcript, creates an ElevenLabs generation script, updates scene durations (`audio_length + 2500ms buffer`), and adds audio sync with timing comments.

### Phase 11: Cross-Episode Learning
Extracts generalizable lessons from the critique history. What bugs appeared? What scored well? What took multiple iterations? Saves to a cumulative `lessons-learned.md` that future episodes read during the build phase.

---

## Handoff Architecture

Agents communicate through markdown artifacts, not shared memory. Each phase writes a `.md` file that the next phase reads:

```
.auto-episode/ep7-merkle-trees/
  research-technical.md     -- from parallel agent A
  research-visual.md        -- from parallel agent B
  research-angle.md         -- from parallel agent C
  research.md               -- merged
  director-research.md      -- Planner creative direction
  creative-brief.md         -- Executor visual design
  storyboard.md             -- scene-by-scene plan
  director-storyboard.md    -- Planner build guidance
  motion-script.md          -- timestamped animation spec
  wireframe-qa.md           -- positioning verification
  visual-qa.md              -- screenshot verification
  critique-visual-iter1.md  -- Visual Designer critique
  critique-tech-iter1.md    -- Technical Reviewer critique
  critique-audience-iter1.md -- Audience Proxy critique
  critique-iter1.md         -- merged critique + score
  fix-plan-iter1.md         -- Planner's fix priorities
  screenshots-wireframe/    -- wireframe captures
  screenshots-iter1/        -- post-build captures
  lessons-learned.md        -- cumulative cross-episode learning
  pipeline.log              -- full run log with timestamps + costs
```

The Planner physically cannot edit code (its tool set is restricted). The Executor cannot make creative decisions without a handoff document. This separation prevents a single agent from drifting off-course without review.

---

## Tech Stack

| Layer | Tool |
|---|---|
| Animation | React + Framer Motion + GSAP (per-episode choice) |
| Rendering | Single-canvas architecture, viewport-relative units |
| Camera | Oversized canvas + transform for pan/zoom |
| Recording | Playwright + FFmpeg (browser to MP4) |
| Voiceover | ElevenLabs API |
| Agent orchestration | Claude Code CLI (`claude -p`) with role-restricted tool sets |

---

## Episodes

| # | Topic | Core Visual |
|---|---|---|
| 1 | Off-by-one error | Fencepost block grid |
| 2 | SegWit addresses | Bech32 character grid |
| 3 | SHA-256 padding | Binary block padding |
| 4 | Garbled circuits | AND gate truth table |
| 5 | 64-byte TX bug | Merkle tree SVG |
| 6 | Duplicate TXID | Mirror cards + collision |
| 7 | Duplicate TX (BIP 54) | — |
| 8 | Keccak vs SHA-3 | — |
| 9 | Worst-case block | — |
| 10 | BIP 54 overview | — |

---

## Usage

```bash
# Generate an episode (pauses after critique for review)
./scripts/auto-episode.sh "Merkle Trees" 11 merkle-trees

# Full auto — no pauses, runs critique loop unattended
./scripts/auto-episode.sh "Timewarp Attack" 12 timewarp --full-auto

# With voiceover generation
./scripts/auto-episode.sh "Merkle Trees" 11 merkle-trees --with-voice

# Verbose — stream agent output in real-time
./scripts/auto-episode.sh "Merkle Trees" 11 merkle-trees --verbose

# Preview the result
npm run dev:client  # → navigate to #ep11

# Record to MP4
node scripts/record.mjs
```

The pipeline is resumable — if it crashes or you Ctrl+C, re-run the same command and it picks up from the last completed phase.

---

## Requirements

- Node.js 18+
- Claude Code CLI (`claude`)
- FFmpeg (for recording)
- ElevenLabs API key (for voiceover, optional)
