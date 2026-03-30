# ExplainAgent

Multi-agent pipeline that turns any technical topic into an animated explainer video.

```bash
./scripts/auto-episode.sh "BIP 54 Consensus Cleanup" 11 bip54-cleanup
```

One command in, finished episode out. Researched, storyboarded, animated, and quality-checked by specialized AI agents.

---

## The Pipeline (what each phase does)

Here's the full pipeline, **11 phases**, each producing a `.md` artifact that the next phase reads:

Research → Director → Creative Vision → Storyboard → Director → Motion Script → Wireframe
    → BUILD (expensive) → Visual QA → Hard Gates → CRITIQUE LOOP (very expensive) → Lessons

| # | Phase | Who | What it does | Output |
|---|-------|-----|-------------|--------|
| 1 | **Research** (3 parallel) | 3 agents | Technical deep-dive, visual inspiration, narrative angle — all run simultaneously | `research-technical.md`, `research-visual.md`, `research-angle.md` |
| 1b | **Research Merge** | Planner | Synthesizes the 3 reports into one document | `research-merged.md` |
| 2 | **Director Research Review** | Planner | Reviews merged research, flags gaps, approves or requests more | review notes |
| 3 | **Creative Vision** | Planner | Defines the episode's visual identity — palette, motion personality, signature visual, what makes it unique | `creative-vision.md` |
| 4 | **Storyboard** | Planner | Scene-by-scene breakdown — what's on screen, what text, canvas zones, camera journey | `storyboard.md` |
| 5 | **Director Storyboard Review** | Planner | Reviews storyboard against CLAUDE.md rules (text length, scene density, visual variety) | review notes |
| 5.5 | **Motion Script** | Planner | Timestamped animation spec — exact delays, enter/exit times, spring configs per element | `motion-script.md` |
| 5.7 | **Wireframe** | Executor | Builds a skeleton VideoTemplate with colored placeholder `<div>`s instead of real visuals. Camera zones + shots are real, but components are fake. 3s scene durations for fast clicking-through. | `VideoTemplate.tsx` (temporary) |
| 5.7b | **Wireframe QA** | Executor | Runs Playwright screenshots + `visual-qa.mjs` on the wireframe to verify camera positions, zone visibility, nothing off-screen. Fixes issues before real build. | `visual-qa-wireframe/` |
| 6 | **Build Components** | Executor | Builds the real custom visual components (the signature animations) | `*.tsx` component files |
| 7 | **Build Template** | Executor | Replaces wireframe placeholders with real components, sets real scene durations | Final `VideoTemplate.tsx` |
| 8 | **Visual QA** | Executor | Playwright screenshots of every scene at 1920x1080, automated position checks | `visual-qa-output/report.md` |
| 8.5 | **Structural Hard Gates** | Automated | 9 grep-based checks (has Camera? has GSAP? has custom ECE theme? no bare CE? etc.) — must pass before critique | pass/fail |
| 9 | **Critique** (3 parallel) | 3 agents | Visual designer, tech reviewer, audience proxy — each scores /100 | `critique-merged.md` |
| 9b | **Score >= 75?** | Automated | If no → generate fix plan → rebuild → re-critique (up to 3 loops) | loop or proceed |
| 10 | **Voiceover** (optional) | Executor | Generate transcript, ElevenLabs audio, sync durations | audio files + updated durations |
| 11 | **Lessons Learned** | Planner | Extracts patterns/mistakes into a cross-episode log so future episodes avoid the same issues | `lessons-learned.md` |

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
