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

Valid phases for `--from`: `research`, `creative-spec`, `build-components`, `visual-qa`, `critique`

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

# Rebuild — re-render with existing creative spec after toolkit changes
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
.auto-episode/ep<N>-<slug>/           # Work artifacts (creative-spec, research, critique, screenshots)
.auto-episode/ep<N>-<slug>/pipeline.log   # Timestamped log
.auto-episode/build-memory.md         # Curated reusable lessons for future builds
.auto-episode/episode-history.md     # Append-only episode log
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

Export any episode to MP4 video. Two modes: draft (fast, for review) and final (high quality, for YouTube).

```bash
node scripts/record.mjs <episode_hash> [flags]
```

### Modes

| Flag | Resolution | Encode | Use case |
|---|---|---|---|
| (default) | 1920x1080 @ 60fps | `-crf 18 -preset medium` | YouTube upload |
| `--draft` | 1920x1080 @ 30fps | `-crf 28 -preset ultrafast` | Quick review |

### Flags

| Flag | Description |
|---|---|
| `--draft` | Fast encode for quick review |
| `--scenes <from>-<to>` | Only export a range of scenes (e.g. `--scenes 5-10`) |
| `--with-audio` | Mux voiceover MP3s into the video |
| `--fps <N>` | Custom framerate (default: 30 draft, 60 final) |

### Examples

```bash
# Final quality — for YouTube
node scripts/record.mjs ep7

# Quick draft — see how it looks
node scripts/record.mjs ep7 --draft

# Draft of just scenes 5-10
node scripts/record.mjs ep7 --draft --scenes 5-10

# Final with voiceover audio
node scripts/record.mjs ep7 --with-audio
```

Output: `./ep7-final.mp4` or `./ep7-draft.mp4`

---

## Generate Voiceover

Voiceover scripts are generated per-episode by the pipeline when using `--with-voice`. They call the ElevenLabs API to produce scene-by-scene MP3s.

```bash
# Generated by the pipeline into scripts/generate-voiceover-ep<N>.mjs
node scripts/generate-voiceover-ep<N>.mjs
```

Requires `ELEVENLABS_API_KEY` in `.env`. Output goes to `client/public/audio/ep<N>-<slug>/`.

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
| Record to MP4 (final) | `node scripts/record.mjs epN` |
| Record to MP4 (draft) | `node scripts/record.mjs epN --draft` |
| Generate voiceover | `node scripts/generate-voiceover-ep<N>.mjs` |

---

## Requirements

- Node.js 20+
- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code) (`claude`) — orchestrates the multi-agent pipeline
- Playwright — for browser automation (recording, screenshots, visual QA)
- FFmpeg — for MP4 export
- ElevenLabs API key — optional, only for voiceover (`ELEVENLABS_API_KEY` in `.env`)
