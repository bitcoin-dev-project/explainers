# Commands & Workflows

Quick reference for all scripts and workflows. For pipeline architecture details, see [README.md](README.md). For animation toolkit and episode design rules, see [CLAUDE.md](CLAUDE.md).

---

## Generate a New Episode

```bash
./scripts/auto-episode.sh <topic> <ep_number> <slug> [flags]
```

### Development Loops

| Flag | What it does | When to use |
|---|---|---|
| `--draft` | Run full pipeline, stop after build checkpoint | See the episode fast before investing in QA/critique |
| `--rebuild` | Skip planning, re-run build with existing artifacts | Testing toolkit/CLAUDE.md changes on an existing episode |
| `--from=<phase>` | Resume from a specific phase | Re-run from any point (e.g. `--from=build-components`) |

Valid phases for `--from`: `research`, `director-research`, `creative-vision`, `storyboard`, `director-storyboard`, `build-components`, `visual-qa`, `critique`

### Quality Flags

| Flag | Default | Description |
|---|---|---|
| `--fast` | — | Preset: 1 critique iteration, 2 critics, skip lessons |
| `--thorough` | — | Preset: 3 critique iterations, 3 critics |
| `--max-critique=N` | `1` | Number of critique→rebuild iterations |
| `--critics=N` | `3` | Number of parallel critics (2 or 3) |
| `--skip-critique` | off | Skip the critique scoring loop entirely |
| `--skip-lessons` | off | Skip cross-episode learning extraction |

### Other Flags

| Flag | Default | Description |
|---|---|---|
| `--palette=grayscale\|brand\|free` | `free` | Color constraints for the episode |
| `--with-voice` | off | Generate ElevenLabs voiceover after build |
| `--full-auto` | off | Skip interactive checkpoints (no browser preview pauses) |
| `--verbose` | off | Stream Claude output in real-time |

Explicit flags override presets: `--fast --max-critique=2` gives fast defaults but 2 critique iterations.

### Examples

```bash
# Default run (1 critique iteration, 3 critics)
./scripts/auto-episode.sh "Merkle Trees" 7 merkle-trees

# Draft mode — see the episode fast, stop before QA/critique
./scripts/auto-episode.sh "Merkle Trees" 7 merkle-trees --draft

# Rebuild — re-render with existing storyboard after toolkit changes
./scripts/auto-episode.sh "Merkle Trees" 7 merkle-trees --rebuild

# Resume from build (skip research + planning)
./scripts/auto-episode.sh "Merkle Trees" 7 merkle-trees --from=build-components

# Fast mode — fewer critics, skip lessons
./scripts/auto-episode.sh "Timewarp Attack" 8 timewarp --fast

# Thorough mode — 3 critique iterations
./scripts/auto-episode.sh "SHA-256 Compression" 9 sha256 --thorough --with-voice

# Grayscale palette, fully autonomous
./scripts/auto-episode.sh "UTXO Model" 10 utxo --palette=grayscale --full-auto
```

### Palette Modes

| Mode | What it means |
|---|---|
| `grayscale` | Black, white, grays only. One accent color allowed for emphasis. |
| `brand` | BDP brand palette only (orange, blue, green, pink, purple + neutrals). |
| `free` | No restrictions — AI picks whatever fits the mood. |

### Interactive Checkpoints

Unless `--full-auto` is passed, the pipeline pauses to open the episode in your browser:

- **Checkpoint** (after build) — the actual episode with real components

At each checkpoint: `[y]` continue, `[n]` type feedback (injected into next phase), `[r]` redo the phase.

### Output

```
client/src/episodes/ep<N>-<slug>/     # Episode code (VideoTemplate.tsx, components, constants.ts)
.auto-episode/ep<N>-<slug>/           # Work artifacts (storyboard, research, critique, screenshots)
.auto-episode/ep<N>-<slug>/pipeline.log   # Timestamped log
.auto-episode/lessons-learned.md      # Cross-episode pattern log (append-only)
```

### Resuming

Re-run the same command after a crash — the pipeline picks up from the last completed phase.

---

## Dev Preview

```bash
npm run dev:client
```

Then open `http://localhost:5173/#ep<N>` (e.g., `#ep7`). The episode player has DevControls at the bottom for stepping through scenes.

---

## Visual QA

Automated positioning checks — opens the episode in headless Playwright at 1920x1080, steps through every scene, verifies elements are on-screen using `getBoundingClientRect()`.

```bash
node scripts/visual-qa.mjs <episode_hash> [output_dir]
```

```bash
# Quick check (prints report to terminal)
node scripts/visual-qa.mjs ep11

# Save screenshots + markdown report
node scripts/visual-qa.mjs ep11 ./visual-qa-output
```

**Exit codes:** `0` = no failures, `1` = FAILs found (off-screen content), `2` = script error.

**Severity levels:** `FAIL` (off-screen near-miss), `WARN` (clipped >40%), `INFO` (far-off zones, expected during camera pans).

---

## Screenshot All Scenes

Captures a PNG screenshot of every scene at 1920x1080. Useful for storyboard review or sharing.

```bash
node scripts/screenshot-scenes.mjs <episode_hash> <scene_count> <output_dir>
```

```bash
node scripts/screenshot-scenes.mjs ep7 18 ./screenshots
node scripts/screenshot-scenes.mjs ep11 22 .auto-episode/ep11-bip54/screenshots
```

---

## Record to MP4

Records an episode to video via Playwright + FFmpeg. Each recorder is episode-specific (hardcoded scene durations and audio paths):

```bash
node scripts/record.mjs        # ep2 (SegWit)
node scripts/record-ep1.mjs    # ep1
node scripts/record-ep4.mjs    # ep4
node scripts/record-ep5.mjs    # ep5
```

---

## Generate Voiceover

Generates scene-by-scene MP3s using ElevenLabs. Requires `ELEVENLABS_API_KEY` in `.env`.

Each voiceover script is episode-specific (hardcoded scene text and output path):

```bash
node scripts/generate-voiceover.mjs       # ep2 (SegWit)
node scripts/generate-voiceover-ep1.mjs   # ep1
node scripts/generate-voiceover-ep4.mjs   # ep4
node scripts/generate-voiceover-ep5.mjs   # ep5
node scripts/generate-voiceover-ep6.mjs   # ep6
```

Output goes to `client/public/audio/ep<N>-<slug>/`.

---

## Quick Reference

| Task | Command |
|---|---|
| Generate episode | `./scripts/auto-episode.sh "Topic" N slug` |
| Generate (fast) | `./scripts/auto-episode.sh "Topic" N slug --fast` |
| Generate (thorough) | `./scripts/auto-episode.sh "Topic" N slug --thorough` |
| Generate (no pauses) | `./scripts/auto-episode.sh "Topic" N slug --full-auto` |
| Generate with voiceover | `./scripts/auto-episode.sh "Topic" N slug --with-voice` |
| Preview in browser | `npm run dev:client` then `/#epN` |
| Visual QA | `node scripts/visual-qa.mjs epN` |
| Screenshot scenes | `node scripts/screenshot-scenes.mjs epN count dir` |
| Record to MP4 (ep2) | `node scripts/record.mjs` |
| Generate voiceover (ep2) | `node scripts/generate-voiceover.mjs` |

---

## Requirements

- Node.js 20+
- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code) (`claude`) — orchestrates the multi-agent pipeline
- FFmpeg — for MP4 recording
- Playwright — for browser automation (recording, screenshots, visual QA)
- ElevenLabs API key — optional, only for voiceover (`ELEVENLABS_API_KEY` in `.env`)
