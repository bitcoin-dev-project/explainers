# ExplainAgent

Multi-agent pipeline that turns any technical topic into an animated explainer video.

```bash
./scripts/auto-episode.sh "BIP 54 Consensus Cleanup" 11 bip54-cleanup
```

One command in, finished episode out. Researched, storyboarded, animated, and quality-checked by specialized AI agents.

---

## The Pipeline (v3)

Each phase produces `.md` artifacts that the next phase reads:

```
Research (3 parallel) → Merge → Director Review
    → Creative Vision → Storyboard → Director Review + Motion Script
    → Full Build → Visual QA + Hard Gates
    → Critique → Rebuild → Lessons (async)
```

| # | Phase | Who | What it does |
|---|-------|-----|-------------|
| 1 | **Research** (3 parallel) | 3 agents | Technical deep-dive, visual inspiration, narrative angle — all simultaneous |
| 2 | **Director Review** | Planner | Reviews merged research, sets creative direction |
| 3 | **Creative Vision** | Planner | Visual identity — palette, motion personality, signature visual |
| 4 | **Storyboard** | Planner | Scene-by-scene breakdown — content, canvas zones, camera journey |
| 5 | **Director Review + Motion Script** | Planner | Storyboard review + timestamped animation spec (merged, one call) |
| 6 | **Full Build** | Executor | Components + VideoTemplate in one pass |
| 7 | **Visual QA + Hard Gates** | Automated | Playwright position checks + 10 structural grep checks |
| 8 | **Critique** (2-3 parallel, 1 iteration default) | 2-3 agents | Visual designer, tech reviewer, audience proxy score /100 |
| 9 | **Voiceover** (optional) | Executor | ElevenLabs audio generation + duration sync |
| 10 | **Lessons Learned** (async) | Planner | Cross-episode pattern extraction — runs in background |

**Presets:** `--fast` (2 critics, skip lessons), `--thorough` (3 iterations, 3 critics), or default (1 iteration, 3 critics).

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

# Draft mode — see the episode fast, stop before QA/critique
./scripts/auto-episode.sh "Merkle Trees" 7 merkle-trees --draft

# Rebuild — re-render after toolkit/CLAUDE.md changes (uses existing artifacts)
./scripts/auto-episode.sh "Merkle Trees" 7 merkle-trees --rebuild

# Preview in browser (hot reload for local iteration)
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
