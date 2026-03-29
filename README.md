# ExplainAgent

Multi-agent pipeline that turns any technical topic into an animated explainer video.

```bash
./scripts/auto-episode.sh "BIP 54 Consensus Cleanup" 11 bip54-cleanup
```

One command in, finished episode out. Researched, storyboarded, animated, and quality-checked by specialized AI agents.

---

## How It Works

Two agent roles with **separated permissions** prevent any single agent from drifting off-course:

- **Planner**: reads code and artifacts, writes guidance. Cannot edit code.
- **Executor**: builds what the Planner specifies. Cannot make creative decisions alone.

The pipeline runs in four stages:

### 1. Research (3 parallel agents)
Three agents research the topic simultaneously: one for technical depth, one for visual inspiration, one for narrative angle. Results merge into a single document.

### 2. Design (Planner + Executor alternate)
The Planner sets creative direction (teaching approach, hook, story arc). The Executor translates that into a visual concept and scene-by-scene storyboard. The Planner reviews the storyboard and writes a timestamped motion script before any code is written.

### 3. Build (Executor)
A wireframe is built first: colored rectangles at exact positions to verify camera math. Once positioning is confirmed, real components replace the placeholders. Screenshots are captured and verified after the build.

### 4. Critique Loop (3 parallel agents, up to 3 iterations)
Three critics score the episode independently:

| Critic | Evaluates | Weight |
|---|---|---|
| Visual Designer | Aesthetics, motion variety, camera usage | /50 |
| Technical Reviewer | Accuracy, code quality, positioning math | /30 |
| Audience Proxy | Hook, teaching flow, emotional arc | /20 |

Scores merge to a total out of 100. Below **75** triggers a fix cycle: the Planner writes a bounded fix plan (3-5 priorities, not a rewrite), the Executor implements it, and the critics score again.

---

## Agent Communication

Agents don't share memory. They communicate through markdown artifacts. Each phase writes a file that the next phase reads:

```
.auto-episode/ep11-bip54-cleanup/
  research-technical.md      3 parallel research reports
  research-visual.md              ↓
  research-angle.md               ↓
  research.md                merged research
  director-research.md       Planner's creative direction
  creative-brief.md          visual concept + signature animation
  storyboard.md              scene-by-scene plan
  director-storyboard.md     Planner's build guidance
  motion-script.md           timestamped animation spec
  wireframe-qa.md            positioning verification
  critique-iter1.md          merged critique + score
  fix-plan-iter1.md          Planner's fix priorities
  screenshots-iter1/         visual captures per scene
  pipeline.log               timestamps + costs
```

---

## Tech Stack

| | |
|---|---|
| Animation | React + Framer Motion + GSAP |
| Recording | Playwright + FFmpeg (browser to MP4) |
| Voiceover | ElevenLabs (optional) |
| Orchestration | Claude Code CLI with role-restricted tool sets |

---

## Usage

```bash
# Generate an episode (pauses after critique for review)
./scripts/auto-episode.sh "BIP 54 Consensus Cleanup" 11 bip54-cleanup

# Full auto, no pauses
./scripts/auto-episode.sh "BIP 54 Consensus Cleanup" 11 bip54-cleanup --full-auto

# With voiceover
./scripts/auto-episode.sh "BIP 54 Consensus Cleanup" 11 bip54-cleanup --with-voice

# Preview
npm run dev:client  # navigate to #ep11

# Record to MP4
node scripts/record.mjs
```

Resumable: re-run the same command after a crash and it picks up from the last completed phase.

## Requirements

- Node.js 18+
- Claude Code CLI (`claude`)
- FFmpeg (for recording)
- ElevenLabs API key (optional, for voiceover)
