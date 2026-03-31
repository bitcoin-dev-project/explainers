# ExplainAgent

Multi-agent pipeline that turns any technical topic into an animated explainer video.

```bash
./scripts/auto-episode.sh "BIP 54 Consensus Cleanup" 11 bip54-cleanup
```

One command in, finished episode out. Researched, storyboarded, animated, and quality-checked by specialized AI agents.

---

## The Pipeline

**11 phases**, each producing a `.md` artifact that the next phase reads:

```
Research → Director → Creative Vision → Storyboard → Director → Motion Script → Wireframe
    → BUILD → Visual QA → Hard Gates → CRITIQUE LOOP → Lessons
```

| # | Phase | Who | What it does |
|---|-------|-----|-------------|
| 1 | **Research** (3 parallel) | 3 agents | Technical deep-dive, visual inspiration, narrative angle — all run simultaneously |
| 2 | **Director Review** | Planner | Reviews merged research, flags gaps, sets creative direction |
| 3 | **Creative Vision** | Planner | Visual identity — palette, motion personality, signature visual |
| 4 | **Storyboard** | Planner | Scene-by-scene breakdown — content, canvas zones, camera journey |
| 5 | **Motion Script** | Planner | Timestamped animation spec — delays, enter/exit times, spring configs |
| 6 | **Wireframe + QA** | Executor | Placeholder layout verified by Playwright before real build |
| 7 | **Build** | Executor | Real components replace wireframe, custom visuals implemented |
| 8 | **Visual QA + Hard Gates** | Automated | Playwright position checks + 9 structural grep checks |
| 9 | **Critique Loop** (3 parallel, up to 3x) | 3 agents | Visual designer, tech reviewer, audience proxy score /100. Below 75 triggers fixes. |
| 10 | **Voiceover** (optional) | Executor | ElevenLabs audio generation + duration sync |
| 11 | **Lessons Learned** | Planner | Cross-episode pattern extraction |

Two agent roles with **separated permissions**: the **Planner** reads and writes guidance (can't edit code), the **Executor** builds what the Planner specifies (can't make creative decisions alone). They communicate through markdown artifacts in `.auto-episode/`.

---

## Tech Stack

| | |
|---|---|
| Animation | React + Framer Motion + GSAP |
| Recording | Playwright + FFmpeg (browser to MP4) |
| Voiceover | ElevenLabs (optional) |
| Orchestration | Claude Code CLI with role-restricted tool sets |

---

## Quick Start

```bash
# Generate an episode
./scripts/auto-episode.sh "Merkle Trees" 7 merkle-trees

# Preview in browser
npm run dev:client  # → http://localhost:5173/#ep7

# Record to MP4 (episode-specific, e.g. ep2)
node scripts/record.mjs
```

Resumable: re-run the same command after a crash and it picks up from the last completed phase.

> **All flags, all scripts, all workflows:** [USAGE.md](USAGE.md)
> **Animation toolkit & episode design rules:** [CLAUDE.md](CLAUDE.md)

## Requirements

- Node.js 20+
- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code) (`claude`)
- FFmpeg (for recording)
- ElevenLabs API key (optional, for voiceover)
