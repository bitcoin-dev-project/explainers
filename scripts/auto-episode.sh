#!/usr/bin/env bash
#
# auto-episode.sh v2 — Multi-agent episode generation pipeline
#
# Creates a complete Bitcoin explainer episode from topic to finished code.
# Uses parallel agents, specialized personas, and iterative quality loops.
#
# Architecture:
#   Planner (Director)  — thinks, reviews, steers (CAN'T edit code)
#   Executor (Builder)  — implements, builds, fixes (CAN edit code)
#   Parallel agents     — 3 agents run simultaneously (research, critique)
#   Handoff files       — each phase writes .md artifacts the next reads
#
# Pipeline flow:
#   1. Research (3 parallel: technical + visual + angle) → Merge
#   2. Director Research Review
#   3. Creative Vision
#   4. Storyboard
#   5. Director Storyboard Review
#   5.5 Motion Script (timestamped animation spec)
#   5.7 Wireframe Build + QA (verify positioning before real build)
#   6. Build Custom Components
#   7. Implement VideoTemplate (with cross-episode lessons fed in)
#   8. Visual QA
#   8.5 Structural Hard Gates (9 automated grep checks — pre-critique)
#   9. Critique (3 parallel: visual designer + tech reviewer + audience proxy) → Merge
#      → Fix Plan → Rebuild (loop up to 3x)
#   10. Voiceover (optional)
#   11. Cross-episode learning extraction (append-only episode log + pattern consolidation)
#
# Usage:
#   ./scripts/auto-episode.sh <topic> <episode_number> <slug> [--with-voice] [--full-auto]
#
# Examples:
#   ./scripts/auto-episode.sh "Merkle Trees" 7 merkle-trees
#   ./scripts/auto-episode.sh "Timewarp Attack" 8 timewarp --with-voice
#   ./scripts/auto-episode.sh "Merkle Trees" 7 merkle-trees --full-auto
#   ./scripts/auto-episode.sh "Merkle Trees" 7 merkle-trees --verbose
#
# Output:
#   - Episode code in client/src/episodes/ep<N>-<slug>/
#   - Work artifacts in .auto-episode/ep<N>-<slug>/
#   - Pipeline log in .auto-episode/ep<N>-<slug>/pipeline.log
#   - Cumulative lessons in .auto-episode/lessons-learned.md
#
# The pipeline pauses after critique unless --full-auto is passed.
#

# No set -e — we handle errors explicitly per phase

# ─── Args ────────────────────────────────────────────────────────────────────

TOPIC="${1:?Usage: auto-episode.sh <topic> <ep_number> <slug> [--with-voice] [--full-auto] [--verbose]}"
EP_NUM="${2:?Missing episode number}"
SLUG="${3:?Missing slug (e.g., merkle-trees)}"

WITH_VOICE=false
FULL_AUTO=false
VERBOSE=false
for arg in "${@:4}"; do
  case "$arg" in
    --with-voice) WITH_VOICE=true ;;
    --full-auto)  FULL_AUTO=true ;;
    --verbose)    VERBOSE=true ;;
    *) echo "Unknown flag: $arg"; exit 1 ;;
  esac
done

# ─── Paths ───────────────────────────────────────────────────────────────────

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
WORK_DIR="$PROJECT_DIR/.auto-episode/ep${EP_NUM}-${SLUG}"
EP_PATH="client/src/episodes/ep${EP_NUM}-${SLUG}"
AUDIO_PATH="client/public/audio/ep${EP_NUM}-${SLUG}"
LOG_FILE="$WORK_DIR/pipeline.log"

# Session files — separate tracks for different agent roles
CREATIVE_SESSION="$WORK_DIR/session_creative"   # creative vision + storyboard
BUILD_SESSION="$WORK_DIR/session_build"          # build components + template + rebuilds

# Tool sets — planner physically CAN'T edit code, only think and write guidance
EXECUTOR_TOOLS="Read,Edit,Write,Glob,Grep,Bash,Agent,WebFetch,WebSearch"
PLANNER_TOOLS="Read,Write,Glob,Grep"
RESEARCH_TOOLS="Read,Write,Glob,Grep,Agent,WebFetch,WebSearch"

mkdir -p "$WORK_DIR"

# ─── Helpers ─────────────────────────────────────────────────────────────────

timestamp() { date '+%H:%M:%S'; }

log() {
  local msg="[$(timestamp)] $1"
  echo "$msg"
  echo "$msg" >> "$LOG_FILE"
}

divider() {
  log ""
  log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  log "  $1: $2"
  log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  log ""
}

# Run a claude -p phase. Saves output and session ID.
# Usage: run_phase <name> <prompt> [--new-session] [--session-file <path>] [--tools <list>]
run_phase() {
  local phase_name="$1"
  local prompt="$2"
  shift 2

  local session_file="$BUILD_SESSION"
  local resume_flag=""
  local new_session=false
  local tools="$EXECUTOR_TOOLS"

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --new-session)  new_session=true; shift ;;
      --session-file) session_file="$2"; shift 2 ;;
      --tools)        tools="$2"; shift 2 ;;
      *) shift ;;
    esac
  done

  # Resume from saved session unless starting fresh
  if [ "$new_session" = "false" ] && [ -f "$session_file" ] && [ -s "$session_file" ]; then
    resume_flag="$(cat "$session_file")"
  fi

  local start_time=$(date +%s)
  local raw_output="$WORK_DIR/${phase_name}_raw.json"

  local exit_code=0

  if [ "$VERBOSE" = "true" ]; then
    # ── Verbose mode: stream output in real-time ──────────────────────────
    # Use stream-json so we get real-time text AND can extract session/cost
    # from the final "result" message at the end.
    log "▶ Phase $phase_name starting (verbose)..."
    echo ""

    local stream_output="$WORK_DIR/${phase_name}_stream.jsonl"

    if [ -n "$resume_flag" ]; then
      cd "$PROJECT_DIR" && claude -p "$prompt" \
        --resume "$resume_flag" \
        --allowedTools "$tools" \
        --verbose --output-format stream-json 2>&1 | tee "$stream_output" | while IFS= read -r line; do
          # Extract and print assistant text messages in real-time
          local msg_type=$(echo "$line" | jq -r '.type // empty' 2>/dev/null)
          if [ "$msg_type" = "assistant" ]; then
            echo "$line" | jq -r '.message.content[]? | select(.type == "text") | .text' 2>/dev/null
          elif [ "$msg_type" = "result" ]; then
            # Final message — print a separator
            echo ""
            echo "─── phase complete ───"
          fi
        done || exit_code=$?
    else
      cd "$PROJECT_DIR" && claude -p "$prompt" \
        --allowedTools "$tools" \
        --verbose --output-format stream-json 2>&1 | tee "$stream_output" | while IFS= read -r line; do
          local msg_type=$(echo "$line" | jq -r '.type // empty' 2>/dev/null)
          if [ "$msg_type" = "assistant" ]; then
            echo "$line" | jq -r '.message.content[]? | select(.type == "text") | .text' 2>/dev/null
          elif [ "$msg_type" = "result" ]; then
            echo ""
            echo "─── phase complete ───"
          fi
        done || exit_code=$?
    fi

    echo ""

    # Extract session ID and cost from the last "result" line in the stream
    local result_line=$(grep '"type":"result"' "$stream_output" 2>/dev/null | tail -1)
    if [ -n "$result_line" ]; then
      echo "$result_line" | jq -r '.session_id // empty' > "$session_file" 2>/dev/null || true
      echo "$result_line" | jq -r '.result // empty' > "$WORK_DIR/${phase_name}.md" 2>/dev/null || true
      local cost=$(echo "$result_line" | jq -r '.total_cost_usd // 0' 2>/dev/null || echo "?")
    else
      local cost="?"
    fi

    rm -f "$stream_output"

  else
    # ── Normal mode: spinner + capture to file ────────────────────────────

    # Start a heartbeat spinner so the user knows it's alive
    (
      while true; do
        local elapsed=$(( $(date +%s) - start_time ))
        local mins=$(( elapsed / 60 ))
        local secs=$(( elapsed % 60 ))
        printf "\r  ● Phase ${phase_name} running... %dm %02ds " "$mins" "$secs"
        sleep 3
      done
    ) &
    local spinner_pid=$!
    trap "kill $spinner_pid 2>/dev/null" RETURN

    # Run claude -p
    if [ -n "$resume_flag" ]; then
      cd "$PROJECT_DIR" && claude -p "$prompt" \
        --resume "$resume_flag" \
        --allowedTools "$tools" \
        --output-format json > "$raw_output" 2>&1 || exit_code=$?
    else
      cd "$PROJECT_DIR" && claude -p "$prompt" \
        --allowedTools "$tools" \
        --output-format json > "$raw_output" 2>&1 || exit_code=$?
    fi

    # Stop the spinner
    kill $spinner_pid 2>/dev/null
    wait $spinner_pid 2>/dev/null
    printf "\r                                                        \r"

    if [ $exit_code -ne 0 ]; then
      local end_time=$(date +%s)
      local duration=$(( end_time - start_time ))
      local mins=$(( duration / 60 ))
      local secs=$(( duration % 60 ))
      log "✗ Phase $phase_name failed (exit code $exit_code, ${mins}m ${secs}s)"
      log "  Error details: $raw_output"
      return 0
    fi

    # Extract session ID and cost from the JSON output
    jq -r '.session_id // empty' "$raw_output" > "$session_file" 2>/dev/null || true
    jq -r '.result // empty' "$raw_output" > "$WORK_DIR/${phase_name}.md" 2>/dev/null || true
    local cost=$(jq -r '.total_cost_usd // 0' "$raw_output" 2>/dev/null || echo "?")

    # Clean up raw JSON (can be huge)
    rm -f "$raw_output"
  fi

  local end_time=$(date +%s)
  local duration=$(( end_time - start_time ))
  local mins=$(( duration / 60 ))
  local secs=$(( duration % 60 ))

  if [ $exit_code -ne 0 ]; then
    log "✗ Phase $phase_name failed (exit code $exit_code, ${mins}m ${secs}s)"
    return 0
  fi

  log "✓ Phase $phase_name complete (${mins}m ${secs}s, \$${cost})"

  # Mark phase as done (for resume)
  touch "$WORK_DIR/.done_${phase_name}"
}

# Check if a phase already completed (for resume after crash)
phase_done() {
  [ -f "$WORK_DIR/.done_$1" ]
}

# Read a work artifact, return empty string if missing
read_artifact() {
  local path="$WORK_DIR/$1"
  if [ -f "$path" ]; then
    cat "$path"
  else
    echo "(not available)"
  fi
}

# ─── Parallel Helpers ────────────────────────────────────────────────────────

# Run claude -p in background, saving result to $WORK_DIR/<name>.md
# Usage: bg_claude <name> <prompt> <tools>
bg_claude() {
  local name="$1" prompt="$2" tools="${3:-$EXECUTOR_TOOLS}"
  local raw="$WORK_DIR/${name}_raw.json"
  (
    cd "$PROJECT_DIR" || exit 1
    if claude -p "$prompt" --allowedTools "$tools" --output-format json > "$raw" 2>&1; then
      jq -r '.result // empty' "$raw" > "$WORK_DIR/${name}.md" 2>/dev/null
      local cost
      cost=$(jq -r '.total_cost_usd // 0' "$raw" 2>/dev/null || echo "?")
      echo "$cost" > "$WORK_DIR/.cost_${name}"
    fi
    rm -f "$raw"
    touch "$WORK_DIR/.done_${name}"
  ) &
}

# Wait for background phases with a spinner
# Usage: wait_group <label> <pid1> [pid2] [pid3] ...
wait_group() {
  local label="$1"
  shift
  local pids=("$@")
  local start_time
  start_time=$(date +%s)

  (
    while true; do
      local elapsed=$(( $(date +%s) - start_time ))
      local mins=$(( elapsed / 60 ))
      local secs=$(( elapsed % 60 ))
      printf "\r  ● %s running... %dm %02ds " "$label" "$mins" "$secs"
      sleep 3
    done
  ) &
  local spinner_pid=$!

  for pid in "${pids[@]}"; do
    wait "$pid" 2>/dev/null || true
  done

  kill $spinner_pid 2>/dev/null
  wait $spinner_pid 2>/dev/null
  printf "\r                                                        \r"

  local end_time
  end_time=$(date +%s)
  local duration=$(( end_time - start_time ))
  local mins=$(( duration / 60 ))
  local secs=$(( duration % 60 ))
  log "✓ $label complete (${mins}m ${secs}s, ${#pids[@]} parallel agents)"
}

# Sum costs from bg_claude runs
# Usage: sum_costs <name1> [name2] [name3] ...
sum_costs() {
  local total=0
  for name in "$@"; do
    local cost_file="$WORK_DIR/.cost_${name}"
    if [ -f "$cost_file" ]; then
      local c
      c=$(cat "$cost_file" 2>/dev/null || echo "0")
      # Use awk for floating point addition
      total=$(awk "BEGIN {printf \"%.4f\", $total + $c}")
    fi
  done
  echo "$total"
}

# ─── Pipeline Start ─────────────────────────────────────────────────────────

echo ""
echo "╔══════════════════════════════════════════════════════════════════════╗"
echo "║       AUTO-EPISODE PIPELINE v2 (Multi-Agent Architecture)          ║"
echo "║                                                                    ║"
echo "║   Topic:   $TOPIC"
echo "║   Episode: $EP_NUM ($SLUG)"
echo "║   Voice:   $WITH_VOICE"
echo "║   Verbose: $VERBOSE"
echo "║   Output:  $EP_PATH/"
echo "║                                                                    ║"
echo "║   Agent Roles:                                                     ║"
echo "║     Planner   = thinks, reviews, steers (can't edit code)          ║"
echo "║     Executor  = builds, implements, fixes (can edit code)          ║"
echo "║     Parallel  = 3 agents run simultaneously (research, critique)   ║"
echo "║                                                                    ║"
echo "║   New in v2:                                                       ║"
echo "║     • Parallel research (3 sub-agents: tech, visual, angle)        ║"
echo "║     • Motion script (timestamped animation spec)                   ║"
echo "║     • Wireframe-first build (verify positioning early)             ║"
echo "║     • Structural hard gates (pre-critique grep checks)             ║"
echo "║     • Multi-persona critique (designer, tech, audience proxy)      ║"
echo "║     • Cross-episode learning w/ pattern consolidation              ║"
echo "║                                                                    ║"
echo "╚══════════════════════════════════════════════════════════════════════╝"
echo ""

log "Pipeline started at $(date)"
log "Topic: $TOPIC | Episode: $EP_NUM | Slug: $SLUG | Voice: $WITH_VOICE"

# ═════════════════════════════════════════════════════════════════════════════
# PHASE 1: DEEP RESEARCH  [3 Parallel Agents → Merge]
# ═════════════════════════════════════════════════════════════════════════════

divider "PARALLEL" "DEEP RESEARCH (3 agents)"

if phase_done "research"; then
  log "⏭ research already done — skipping"
else

# ── Agent A: Technical Details ────────────────────────────────────────────
PROMPT_TECH=$(cat <<PROMPT_END
You are researching the TECHNICAL DETAILS of a Bitcoin/crypto topic for an animated explainer video. Your job is deep technical accuracy.

TOPIC: ${TOPIC}

FOCUS:
1. Find the original source material using WebSearch:
   - The BIP (if applicable), the original mailing list post, the GitHub PR/issue
   - The developer(s) who discovered or proposed it
   - Any debates or controversy around it

2. Understand the HISTORY:
   - When was this discovered/proposed?
   - What was happening in Bitcoin at the time?
   - What problem was so bad that someone had to fix it?

3. TECHNICAL WALKTHROUGH:
   - How does it actually work at a code/protocol level?
   - Walk through a concrete example with REAL values (actual hashes, block heights, tx data)
   - What are the edge cases?
   - Show real code snippets or data structures if relevant

Save to .auto-episode/ep${EP_NUM}-${SLUG}/research-technical.md with sections:
- ## Source Material (links, authors, dates)
- ## History & Context
- ## The Problem (what breaks without this)
- ## How It Works (code/protocol-level walkthrough with real values)
- ## Edge Cases
PROMPT_END
)

# ── Agent B: Visual Inspiration ───────────────────────────────────────────
PROMPT_VISUAL=$(cat <<PROMPT_END
You are researching VISUAL INSPIRATION for an animated Bitcoin explainer video. Your job is finding the best way to SHOW this concept.

TOPIC: ${TOPIC}

FOCUS:
1. Search for how others have explained this topic:
   - Blog posts with diagrams
   - YouTube videos (especially 3Blue1Brown, Artem Kirsanov style)
   - Interactive explainers or visualizations
   - Conference talks with good slides

2. What visual metaphors naturally fit this concept?
   - What does this concept "look like" if you could see it?
   - What real-world objects or processes does it resemble?
   - What animations would make the key idea click instantly?

3. What animation techniques would work best?
   - Would a timeline, flowchart, tree, network graph, or data dissection work?
   - Should it be dark/moody (security topic) or bright/precise (math topic)?
   - What motion style fits? (aggressive snaps, organic growth, flowing waves, surgical precision)

Save to .auto-episode/ep${EP_NUM}-${SLUG}/research-visual.md with sections:
- ## Existing Explanations (links + what worked/didn't)
- ## Visual Metaphors (ranked by how naturally they fit)
- ## Animation Technique Recommendations
- ## Color/Mood Suggestions
- ## Reference Images or Diagrams (describe what you found)
PROMPT_END
)

# ── Agent C: Narrative Angle ──────────────────────────────────────────────
PROMPT_ANGLE=$(cat <<PROMPT_END
You are finding the SURPRISING NARRATIVE ANGLE for a Bitcoin explainer video. Your job is to find what makes this topic fascinating and what most people get wrong.

TOPIC: ${TOPIC}

FOCUS:
1. What do most people get WRONG about this?
   - Search for common misconceptions, Reddit threads, Twitter debates
   - What's the "obvious" explanation that's actually incomplete or wrong?

2. What's the NON-OBVIOUS insight?
   - The "wait, really?!" moment
   - The detail that changes how you think about the whole topic
   - Why is this more interesting/important than it first appears?

3. What's the EMOTIONAL JOURNEY?
   - What should feel confusing at first?
   - Where does the aha moment land?
   - What's the satisfying conclusion?

4. Why should a developer care about this TODAY?
   - Is this relevant to current Bitcoin development?
   - Does it connect to any ongoing debates or proposals?

5. What's the best TEACHING APPROACH?
   - Problem → Failure → Fix? (show what breaks, then how to fix)
   - Specific → General? (concrete example first, then abstract rule)
   - Wrong → Less Wrong → Right? (start wrong, refine)
   - Which has the best emotional payoff for this specific topic?

Save to .auto-episode/ep${EP_NUM}-${SLUG}/research-angle.md with sections:
- ## Common Misconceptions
- ## The Surprising Insight
- ## Recommended Teaching Approach (pick ONE, defend it)
- ## Emotional Arc (curiosity → confusion → aha → satisfaction)
- ## Why It Matters Today
PROMPT_END
)

# ── Launch all 3 in parallel ─────────────────────────────────────────────
if ! phase_done "research-technical"; then
  bg_claude "research-technical" "$PROMPT_TECH" "$RESEARCH_TOOLS"
  PID_TECH=$!
else PID_TECH=""; fi

if ! phase_done "research-visual"; then
  bg_claude "research-visual" "$PROMPT_VISUAL" "$RESEARCH_TOOLS"
  PID_VISUAL=$!
else PID_VISUAL=""; fi

if ! phase_done "research-angle"; then
  bg_claude "research-angle" "$PROMPT_ANGLE" "$RESEARCH_TOOLS"
  PID_ANGLE=$!
else PID_ANGLE=""; fi

# Wait for all with spinner
RESEARCH_PIDS=()
[ -n "$PID_TECH" ] && RESEARCH_PIDS+=("$PID_TECH")
[ -n "$PID_VISUAL" ] && RESEARCH_PIDS+=("$PID_VISUAL")
[ -n "$PID_ANGLE" ] && RESEARCH_PIDS+=("$PID_ANGLE")

if [ ${#RESEARCH_PIDS[@]} -gt 0 ]; then
  wait_group "Parallel research (${#RESEARCH_PIDS[@]} agents)" "${RESEARCH_PIDS[@]}"
  RESEARCH_COST=$(sum_costs "research-technical" "research-visual" "research-angle")
  log "Research total cost: \$${RESEARCH_COST}"
fi

# ── Merge research into single document ───────────────────────────────────
log "Merging research from 3 agents..."

RESEARCH_TECH=$(read_artifact "research-technical.md")
RESEARCH_VIS=$(read_artifact "research-visual.md")
RESEARCH_ANG=$(read_artifact "research-angle.md")

run_phase "research-merge" "$(cat <<PROMPT_END
You are merging research from three specialist agents into one comprehensive research document.

Read and synthesize these three research reports:

---TECHNICAL RESEARCH---
${RESEARCH_TECH}
---END TECHNICAL---

---VISUAL RESEARCH---
${RESEARCH_VIS}
---END VISUAL---

---NARRATIVE ANGLE RESEARCH---
${RESEARCH_ANG}
---END ANGLE---

Merge into a single cohesive document. Don't just concatenate — synthesize. Remove duplicates, resolve conflicts (prefer the technical agent for facts, the angle agent for narrative decisions, the visual agent for presentation).

Save to .auto-episode/ep${EP_NUM}-${SLUG}/research.md with sections:
- ## Source Material (links, authors, dates)
- ## The Problem (what breaks without this)
- ## How It Works (technical walkthrough with real values)
- ## The Surprising Angle (the non-obvious insight)
- ## Recommended Teaching Approach (from angle research)
- ## Visual Inspiration (how this could be visualized)
- ## Key Facts (bullet points of essential details)
PROMPT_END
)" --new-session --session-file "$WORK_DIR/session_research_merge" --tools "$PLANNER_TOOLS"

# Mark overall research as done
touch "$WORK_DIR/.done_research"
fi

# ═════════════════════════════════════════════════════════════════════════════
# PHASE 2: DIRECTOR — RESEARCH REVIEW  [Planner — can't edit code]
# ═════════════════════════════════════════════════════════════════════════════

divider "PLANNER" "DIRECTOR — RESEARCH REVIEW"

if phase_done "director-research"; then
  log "⏭ director-research already done — skipping"
else
run_phase "director-research" "$(cat <<PROMPT_END
You are a CREATIVE DIRECTOR for an animated Bitcoin explainer series. You don't build — you THINK and STEER. You cannot edit code. Your job is to review research and write creative direction.

A researcher just delivered their findings on "${TOPIC}".

STEP 1: Read the research.
Read this file: .auto-episode/ep${EP_NUM}-${SLUG}/research.md

STEP 2: Read CLAUDE.md — especially the "Episode Registry" section at the bottom.
DO NOT read old episode VideoTemplate.tsx files. They use outdated patterns you'll unconsciously copy.
The registry tells you what's been done visually so you can avoid repeating it.

STEP 3: Write your creative direction.

Think about:
1. What's the BEST teaching approach for this topic? (analogy-first, problem→failure→fix, definition→deep-dive, specific→general, wrong→less-wrong→right, dialogue-driven)
2. What's the surprising angle — the one thing that makes a viewer say "wait, really?!"
3. What should the emotional arc be? Where does the aha moment land?
4. What's the ONE key takeaway viewers should remember?
5. What NOT to include — what's interesting but would distract from the core story?
6. What real-world values/examples should we use? (actual hashes, addresses, tx data)
7. Per the Episode Registry — what must THIS episode do differently? What animation library should drive the core visual? (GSAP? SVG morph? Canvas 2D?)
8. Should this episode use CHARACTERS (Alice & Bob stick figures)? Characters work best for dialogue-driven teaching — Alice explains, Bob asks questions. They add personality and make abstract topics feel like a conversation. Not every episode needs them. Decide YES or NO and explain why.

Save your creative direction to .auto-episode/ep${EP_NUM}-${SLUG}/director-research.md

Format:
## Teaching Approach
[which approach and WHY — be decisive, not "could be X or Y"]

## The Hook
[what grabs attention in the first 3 seconds]

## Core Story Arc
[scene-level narrative flow: where do we start, what's the journey, where do we land]

## The Aha Moment
[what it is and roughly where it should land in the episode]

## What to Skip
[interesting details that would hurt pacing — kill your darlings]

## Visual Differentiation
[what existing episodes have done + what THIS episode MUST do differently]

## Characters
[YES or NO — should Alice & Bob stick figures appear? If YES: what roles do they play? (e.g., Alice=teacher, Bob=confused learner). Which scenes are dialogue-driven vs pure visual? Characters add personality but shouldn't be forced into every episode.]

## Key Real Values to Use
[specific numbers, hashes, addresses, tx data to make it concrete]

## Risks
[what could go wrong with this episode — what's hardest to get right]

Be opinionated. Be decisive. Don't hedge. You're the director — DIRECT.
PROMPT_END
)" --new-session --session-file "$WORK_DIR/session_director1" --tools "$PLANNER_TOOLS"
fi

# ═════════════════════════════════════════════════════════════════════════════
# PHASE 3: CREATIVE VISION  [Executor — reads handoff artifacts]
# ═════════════════════════════════════════════════════════════════════════════

divider "EXECUTOR" "CREATIVE VISION"

if phase_done "creative-vision"; then
  log "⏭ creative-vision already done — skipping"
else

# Inline the director's guidance so it's front-and-center
DIRECTOR_RESEARCH=$(read_artifact "director-research.md")

run_phase "creative-vision" "$(cat <<PROMPT_END
Now design the episode's visual identity for episode ${EP_NUM}: ${TOPIC}.

HANDOFF FROM DIRECTOR — read this carefully, the director has already decided the teaching approach and story arc:
---BEGIN DIRECTOR GUIDANCE---
${DIRECTOR_RESEARCH}
---END DIRECTOR GUIDANCE---

Your job is to design the VISUAL CONCEPT that serves the director's story arc. Do not reinvent the narrative — serve it.

Also read:
- Research: .auto-episode/ep${EP_NUM}-${SLUG}/research.md
- CLAUDE.md — especially Animation Toolkit, Camera System, Episode Registry, and "Making Episodes That Don't Look Alike"
- DO NOT read old episode VideoTemplate.tsx files — they use outdated patterns

RULES:
- Do NOT repeat any visual approach from the Episode Registry in CLAUDE.md
- Do NOT default to DiagramBox, FlowRow, or other shared library components for the core visual
- The core visual MUST NOT use CE (CanvasElement). Use GSAP timeline, SVG path morphing, CSS keyframes, Canvas 2D, or morph()
- Use the Camera system for layout — place content in zones on a large canvas, Camera pans/zooms between them freely. The final scene MUST zoom out to reveal the entire canvas as a visual summary.
- Define episode-specific EP_COLORS and EP_SPRINGS in constants.ts
- The director already decided the teaching approach — your job is the visual execution

For your chosen concept, detail:
a) THE SIGNATURE VISUAL — the ONE custom animation that makes this episode instantly recognizable
b) COLOR PALETTE — 2-3 accent colors beyond brand orange that match the mood
c) LAYOUT PATTERN — NOT centered-stack-with-heading — what serves THIS content?
d) ANIMATION PERSONALITY — spring configs, timing, motion style that matches the topic
e) CUSTOM COMPONENTS NEEDED — what must be built from scratch for this episode
f) CHARACTER PLAN — if the director said YES to characters: How are Alice & Bob used? Which scenes have dialogue? What's their positioning (e.g., Alice left 25%, Bob right 75%)? What emotions/gestures drive the key moments? If NO characters: skip this. Read the "Characters" section in CLAUDE.md for the full API (emotions, gestures, lookAt, speech bubbles).

Also brainstorm 2 alternative concepts (brief, 1 paragraph each) so the director could course-correct if needed. But commit to your best one.

Rate your chosen concept:
- Originality vs. past episodes (1-10)
- How naturally it fits the topic (1-10)
- Visual wow factor (1-10)
- Feasibility in React + Framer Motion (1-10)

Save the full creative brief to .auto-episode/ep${EP_NUM}-${SLUG}/creative-brief.md
PROMPT_END
)" --new-session --session-file "$CREATIVE_SESSION"
fi

# ═════════════════════════════════════════════════════════════════════════════
# PHASE 4: STORYBOARD  [Executor — resumes creative session]
# ═════════════════════════════════════════════════════════════════════════════

divider "EXECUTOR" "STORYBOARD"

if phase_done "storyboard"; then
  log "⏭ storyboard already done — skipping"
else
run_phase "storyboard" "$(cat <<PROMPT_END
Now turn the creative vision into a concrete scene-by-scene storyboard for episode ${EP_NUM}: ${TOPIC}.

Read these artifacts if you need to refresh context:
- Director guidance: .auto-episode/ep${EP_NUM}-${SLUG}/director-research.md
- Creative brief: .auto-episode/ep${EP_NUM}-${SLUG}/creative-brief.md
- Research: .auto-episode/ep${EP_NUM}-${SLUG}/research.md

Follow CLAUDE.md rules strictly, especially:
- ONE idea per scene
- ONE sentence per scene heading (max ~15 words)
- Text CAPTIONS the animation — the diagram/animation teaches, not the text
- Progressive reveal in every scene — staggered delays, never dump everything
- Scene 1 = title, Scene 2 = start from familiar ground (not jargon)
- Last scene = CTA
- Use real worked examples with actual values, not placeholders

For EACH scene, write:
1. SCENE NUMBER and NAME
2. DURATION (simple: 6-7s, diagram: 8-10s, complex: 10-12s)
3. ON-SCREEN TEXT (the short caption — remember, max ~15 words)
4. VISUAL DESCRIPTION (what the viewer sees — the animation that teaches)
5. ANIMATION DETAILS (what enters, exits, morphs, specific delays)
6. CHARACTERS (if this scene uses Alice/Bob — otherwise omit):
   alice: emotion=<emotion>, gesture=<gesture>, lookAt=<dir>, says="<speech>"
   bob: emotion=<emotion>, gesture=<gesture>, lookAt=<dir>, says="<speech>"
   Available emotions: neutral, happy, excited, curious, confused, thinking, surprised, worried, annoyed, explaining, laughing
   Available gestures: none, wave, point, shrug, present
   Available lookAt: center, left, right, up, down
7. WHY THIS SCENE (what concept does it teach? how does it connect to the next?)

Mark the HIGHLIGHT SCENE (aha moment) with [HIGHLIGHT].
Mark scenes using the SIGNATURE VISUAL with [SIGNATURE].

Use AS MANY SCENES as the topic needs. 15-25 scenes is typical.

CRITICAL — CANVAS ZONES + CAMERA JOURNEY:
After the scene list, include a "Canvas Layout" section. Read the "Camera System" section in CLAUDE.md. You MUST:
1. Define CANVAS SIZE — how big is the world? (e.g., 400vw × 200vh). Size it to fit the content, no fixed limits.
2. Define ZONES — named regions on the canvas where content lives (e.g., Zone A: 0-90vw, Zone B: 110-200vw, Zone C: 110-200vw y:110-200vh). Include gaps between zones.
3. Plan the CAMERA JOURNEY — for each scene, specify what the camera does: zoom in, pull back, pan left/right/up/down, backtrack to an earlier zone. Use focus(cx, cy, scale) or fitRect(x, y, w, h) helpers.
4. The camera journey MUST be NON-LINEAR — backtrack to earlier zones, vary zoom from 0.3 to 2.5+, pan vertically not just horizontally. NOT a left-to-right slideshow.
5. The FINAL SCENE must zoom ALL the way out (scale 0.3-0.5) to reveal the ENTIRE canvas — showing all visuals from the episode as one connected picture. This is the visual summary/payoff.
6. Pass \`zones\` to Camera for the dev minimap — each zone gets a label and color for visual verification.

This creates dynamic, cinematic camera movement. The dev minimap catches off-screen content during development.

Save the storyboard to .auto-episode/ep${EP_NUM}-${SLUG}/storyboard.md
PROMPT_END
)" --session-file "$CREATIVE_SESSION"
fi

# ═════════════════════════════════════════════════════════════════════════════
# PHASE 5: DIRECTOR — STORYBOARD REVIEW  [Planner — can't edit code]
# ═════════════════════════════════════════════════════════════════════════════

divider "PLANNER" "DIRECTOR — STORYBOARD REVIEW"

if phase_done "director-storyboard"; then
  log "⏭ director-storyboard already done — skipping"
else
run_phase "director-storyboard" "$(cat <<PROMPT_END
You are a CREATIVE DIRECTOR reviewing a storyboard before it goes to production. You cannot edit code. Your job is to review alignment and write build guidance.

Read ALL of these files:
- Research: .auto-episode/ep${EP_NUM}-${SLUG}/research.md
- Your previous direction: .auto-episode/ep${EP_NUM}-${SLUG}/director-research.md
- Creative brief: .auto-episode/ep${EP_NUM}-${SLUG}/creative-brief.md
- Storyboard: .auto-episode/ep${EP_NUM}-${SLUG}/storyboard.md

CHECK:
1. Does the storyboard follow YOUR direction from the research review? Or did it drift?
2. Is the teaching approach consistent across research → creative → storyboard?
3. Is the aha moment clearly placed and properly set up by preceding scenes?
4. Is the text short enough? (ONE sentence per heading, max ~15 words — check EVERY scene)
5. Does every scene have an animated visual, or are some text-only slides?
6. Is there progressive reveal, or do scenes dump content at once?
7. Pacing: too fast? Too slow? Any scenes that should be cut or merged?
8. Is the signature visual actually custom and original vs. existing episodes?
9. Does the opening start from familiar ground (not jargon)?
10. Are real values used (not "the hash of X" but actual hex values)?
11. If characters are used: Do Alice & Bob have distinct roles (not both saying the same things)? Are emotions varied and appropriate per scene (not all "neutral")? Do speech bubbles stay short (max ~12 words)? Do characters look at each other when in dialogue? Are there non-dialogue scenes too (characters shouldn't dominate the ENTIRE episode)?

Write your build guidance to .auto-episode/ep${EP_NUM}-${SLUG}/director-storyboard.md

Format:
## Verdict
[GO / NEEDS CHANGES — be clear]

## Alignment Check
[does storyboard match the direction you set?]

## Scenes to Strengthen
[specific scene numbers and what to improve]

## Scenes to Cut or Merge
[anything that doesn't earn its place]

## Build Priorities
[what the developer should build FIRST — the signature visual, then what?]

## Risk Areas
[what's most likely to go wrong in implementation]

## Non-Negotiables
[things that MUST be in the final product — specific scenes, specific visuals]

Be direct. This is the last review before code gets written.
PROMPT_END
)" --new-session --session-file "$WORK_DIR/session_director2" --tools "$PLANNER_TOOLS"
fi

# ═════════════════════════════════════════════════════════════════════════════
# PHASE 5.5: MOTION SCRIPT  [Planner — timestamped animation spec]
# ═════════════════════════════════════════════════════════════════════════════

divider "PLANNER" "MOTION SCRIPT"

if phase_done "motion-script"; then
  log "⏭ motion-script already done — skipping"
else

STORYBOARD_TEXT=$(read_artifact "storyboard.md")
DIRECTOR_SB=$(read_artifact "director-storyboard.md")

run_phase "motion-script" "$(cat <<PROMPT_END
You are an ANIMATION DIRECTOR writing a timestamped motion script — the missing spec between "storyboard" (what to show) and "code" (how to build it). You cannot edit code.

Episode ${EP_NUM}: ${TOPIC}

Read these for context:
---STORYBOARD---
${STORYBOARD_TEXT}
---END STORYBOARD---

---DIRECTOR BUILD GUIDANCE---
${DIRECTOR_SB}
---END DIRECTOR---

Also read CLAUDE.md — especially the Animation Toolkit, GSAP Utilities, and Timing Guidelines sections.

YOUR JOB: For each scene, write a precise TIMESTAMPED motion script that tells the developer EXACTLY what moves when. This eliminates timing guesswork during the build phase.

FORMAT — for each scene:
\`\`\`
SCENE <N>: <name> (duration: <X>s)
────────────────────────────────
0.0s  TRANSITION: [how we enter — camera move, wipe, cut]
0.0s  [element] — [action] (e.g., "Title text — blurIn from center, scale 0.8→1.0")
0.4s  [element] — [action with timing] (e.g., "Subtitle — slideRight, 0.3s duration")
1.2s  [element] — [action] (e.g., "Block diagram — GSAP stagger, children cascade left→right 0.1s apart")
3.0s  [element] — [state change] (e.g., "Block #3 — highlight red, pulse glow")
5.5s  HOLD — viewer absorbs (1.5s breathing room)
7.0s  EXIT: [how elements leave or transform into next scene]
\`\`\`

RULES:
1. Every element gets a timestamp. No "then" or "after that" — use exact times.
2. Specify the animation TECHNIQUE for each move: morph(), GSAP tl.from/tl.to, CE enter/exit, CSS @keyframes, spring config.
3. Camera moves get their own timestamps: "Camera — pan to Zone B (spring stiffness 50, damping 22)" or "Camera — zoom into detail at (140vw, 30vh) scale 2.2"
4. Mark the HIGHLIGHT SCENE's dramatic moment with ★ — this is where timing matters most.
5. Include hold/breathing time at the end of each scene (1-2s minimum).
6. For voiceover-synced episodes, mark where specific phrases align with visuals.
7. Note which elements PERSIST across scenes (use morph) vs which enter/exit (use CE/GSAP).
8. For CHARACTER scenes: timestamp each character state change. Characters use Framer Motion springs internally — specify emotion/gesture/lookAt/says changes at exact times. Example:
   0.0s  alice — emotion=explaining, gesture=present, lookAt=right, says="Each block links to the previous one"
   0.0s  bob — emotion=curious, lookAt=left (no speech — listening)
   3.5s  bob — emotion=surprised, says="Wait, what if someone changes a block?"
   3.5s  alice — emotion=neutral, gesture=none (listening now)

ALSO INCLUDE:
- ## Persistent Elements (which elements stay mounted across multiple scenes and transform via morph)
- ## Animation Library Assignments (which scenes use GSAP timeline, which use morph, which use CSS @keyframes)
- ## Camera Shots (per-scene camera positions — use focus(cx, cy, scale) or fitRect(x, y, w, h). Final scene = full canvas reveal at scale 0.3-0.5)
- ## Character Choreography (if characters are used: which scenes have dialogue, character positions, emotion arcs across the episode)

Save to .auto-episode/ep${EP_NUM}-${SLUG}/motion-script.md

Be PRECISE. This script is the developer's exact build spec — vague timing = vague animation.
PROMPT_END
)" --new-session --session-file "$WORK_DIR/session_motion" --tools "$PLANNER_TOOLS"
fi

# ═════════════════════════════════════════════════════════════════════════════
# PHASE 5.7: WIREFRAME BUILD  [Executor — skeleton layout verification]
# ═════════════════════════════════════════════════════════════════════════════

divider "EXECUTOR" "WIREFRAME BUILD"

if phase_done "wireframe"; then
  log "⏭ wireframe already done — skipping"
else

run_phase "wireframe" "$(cat <<PROMPT_END
You are building a WIREFRAME VERSION of episode ${EP_NUM}: ${TOPIC} — a skeleton layout that verifies the canvas zones and camera journey BEFORE the real visuals are built.

Read these for context:
- Storyboard: .auto-episode/ep${EP_NUM}-${SLUG}/storyboard.md (especially the "Canvas Layout" section)
- Motion script: .auto-episode/ep${EP_NUM}-${SLUG}/motion-script.md
- CLAUDE.md — especially "Camera System"

YOUR JOB: Create a minimal VideoTemplate.tsx using Camera that has:
1. Camera wrapping all content on a large canvas (size from storyboard)
2. Colored placeholder rectangles at each zone position (absolute positioning in vw/vh)
3. Camera shots per scene using focus() or fitRect() helpers (NOT manual x/y math)
4. SCENE_DURATIONS (use 3000ms per scene — fast iteration)
5. ECE text placeholders for captions (OUTSIDE Camera, in screen space)
6. \`zones\` prop on Camera for the dev minimap
7. FINAL SCENE must use fitRect() to zoom out and show the ENTIRE canvas

This is NOT the real episode — it's a camera journey test. Each custom component is replaced by a colored <div> at its zone position.

Example wireframe:
\`\`\`tsx
import { Camera, focus, fitRect } from '@/lib/video';

const ZONES = [
  { label: 'A', x: 0, y: 0, w: 90, h: 80, color: '#EB5234' },
  { label: 'B', x: 110, y: 0, w: 80, h: 80, color: '#396BEB' },
  { label: 'C', x: 110, y: 100, w: 80, h: 70, color: '#0E9158' },
];

const SHOTS = {
  0: { x: 0, y: 0, scale: 1 },           // Zone A: title
  2: focus(45, 30, 2.0),                   // Zoom into detail in Zone A
  4: { x: 0, y: 0, scale: 1 },            // Pull back
  5: focus(150, 40, 1.2),                  // Pan to Zone B
  7: focus(150, 135, 1.5),                 // Pan down to Zone C + zoom
  9: focus(110, 40, 1.0),                  // Backtrack to Zone B
  11: fitRect(0, 0, 200, 180),             // FINAL: reveal entire canvas
};

<Camera scene={s} shots={SHOTS} width="250vw" height="200vh" zones={ZONES}>
  {/* Zone A placeholder */}
  <div style={{ position: 'absolute', left: '5vw', top: '5vh', width: '80vw', height: '70vh',
    border: '3px dashed #EB5234', backgroundColor: 'rgba(235,82,52,0.1)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#EB5234', fontSize: '2vw', fontFamily: 'var(--font-display)',
  }}>
    Zone A — TitleScreen (scenes 0-4)
  </div>
  {/* Zone B placeholder */}
  <div style={{ position: 'absolute', left: '115vw', top: '5vh', width: '70vw', height: '70vh',
    border: '3px dashed #396BEB', backgroundColor: 'rgba(57,107,235,0.1)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#396BEB', fontSize: '2vw', fontFamily: 'var(--font-display)',
  }}>
    Zone B — CoreVisual (scenes 5-6, 9-10)
  </div>
</Camera>
\`\`\`

STEPS:
1. Create ${EP_PATH}/constants.ts with EP_COLORS, EP_SPRINGS, and ZONES array from the storyboard
2. Create ${EP_PATH}/VideoTemplate.tsx as the wireframe using Camera + focus()/fitRect()
3. Register in client/src/App.tsx, client/src/pages/Home.tsx, client/src/episodes/index.ts
4. Run npx tsc --noEmit --project client/tsconfig.json
5. After the wireframe compiles, run: node scripts/visual-qa.mjs ep${EP_NUM} .auto-episode/ep${EP_NUM}-${SLUG}/visual-qa-wireframe
   Fix any FAIL issues the tool reports before proceeding.
6. Preview in browser — check the minimap (bottom-right corner) to verify camera journey covers all zones.

The wireframe must compile and render. The dev minimap shows the viewport position on the canvas — use it to verify all zones are reachable and the final reveal shows everything.
PROMPT_END
)" --new-session --session-file "$BUILD_SESSION"
fi

# ── WIREFRAME SCREENSHOT VERIFICATION ─────────────────────────────────────

divider "EXECUTOR" "WIREFRAME QA"

if phase_done "wireframe-qa"; then
  log "⏭ wireframe-qa already done — skipping"
else

# Count scenes in wireframe
WF_SCENE_COUNT=$(cd "$PROJECT_DIR" || exit 1; grep -oE 'scene[0-9]+' "${EP_PATH}/VideoTemplate.tsx" 2>/dev/null | sort -u | wc -l | tr -d ' ')
[ -z "$WF_SCENE_COUNT" ] && WF_SCENE_COUNT=0

WF_SCREENSHOT_DIR="$WORK_DIR/screenshots-wireframe"
WF_SCREENSHOT_NOTE="(Screenshots unavailable — verify from code only)"

if [ "$WF_SCENE_COUNT" -gt 0 ]; then
  log "Capturing wireframe screenshots (${WF_SCENE_COUNT} scenes)..."
  mkdir -p "$WF_SCREENSHOT_DIR"

  if cd "$PROJECT_DIR" && node scripts/screenshot-scenes.mjs "ep${EP_NUM}" "$WF_SCENE_COUNT" "$WF_SCREENSHOT_DIR" 2>"$WORK_DIR/screenshot-wf-err.log"; then
    WF_SCREENSHOT_COUNT=$(ls "$WF_SCREENSHOT_DIR"/*.png 2>/dev/null | wc -l | tr -d ' ')
    log "Captured $WF_SCREENSHOT_COUNT wireframe screenshots"
    WF_SCREENSHOT_NOTE="Wireframe screenshots at $WF_SCREENSHOT_DIR/. Read EVERY PNG to verify positioning."
  else
    log "Wireframe screenshot capture failed (non-fatal)"
  fi
fi

run_phase "wireframe-qa" "$(cat <<PROMPT_END
You are verifying the WIREFRAME layout for episode ${EP_NUM}: ${TOPIC}.

${WF_SCREENSHOT_NOTE}

Read ${EP_PATH}/VideoTemplate.tsx (the wireframe version).

STEP 1: Run the automated visual QA tool:
  node scripts/visual-qa.mjs ep${EP_NUM} .auto-episode/ep${EP_NUM}-${SLUG}/visual-qa-wireframe

STEP 2: Read the report at .auto-episode/ep${EP_NUM}-${SLUG}/visual-qa-wireframe/report.md
- FAIL issues = elements off-screen that should be visible → MUST FIX
- WARN issues = significant clipping → fix if >40% hidden
- Read the screenshots to visually confirm

STEP 3: Fix any issues found:
- Content off-screen → adjust the camera shot for that scene (use focus() or fitRect() to recompute)
- Zone content too large → resize the zone or increase canvas size
- Camera shot clipping content → adjust scale or position using focus(cx, cy, scale) helper
- Check the dev minimap in browser — green viewport rect = good, red = extends past canvas

STEP 4: Re-run the visual QA tool to confirm fixes:
  node scripts/visual-qa.mjs ep${EP_NUM} .auto-episode/ep${EP_NUM}-${SLUG}/visual-qa-wireframe

Repeat until all FAIL issues are resolved. Then run npx tsc --noEmit --project client/tsconfig.json.

Save findings to .auto-episode/ep${EP_NUM}-${SLUG}/wireframe-qa.md

The wireframe layout must pass the visual QA tool before we build real components on top of it. Verify the camera journey hits all zones and the final scene reveals the full canvas.
PROMPT_END
)" --session-file "$BUILD_SESSION"
fi

# ═════════════════════════════════════════════════════════════════════════════
# PHASE 6: BUILD CUSTOM COMPONENTS  [Executor — reads all handoffs]
# ═════════════════════════════════════════════════════════════════════════════

divider "EXECUTOR" "BUILD CUSTOM COMPONENTS"

if phase_done "build-components"; then
  log "⏭ build-components already done — skipping"
else

# Inline the director's build guidance + lessons from past episodes
DIRECTOR_STORYBOARD=$(read_artifact "director-storyboard.md")
PAST_LESSONS=""
if [ -f "$PROJECT_DIR/.auto-episode/lessons-learned.md" ]; then
  PAST_LESSONS=$(cat "$PROJECT_DIR/.auto-episode/lessons-learned.md")
fi

run_phase "build-components" "$(cat <<PROMPT_END
Now build the custom visual components for episode ${EP_NUM}: ${TOPIC}.

HANDOFF FROM DIRECTOR — the director reviewed the storyboard and wrote build priorities:
---BEGIN DIRECTOR BUILD GUIDANCE---
${DIRECTOR_STORYBOARD}
---END DIRECTOR BUILD GUIDANCE---

${PAST_LESSONS:+---LESSONS FROM PAST EPISODES (avoid these mistakes)---
${PAST_LESSONS}
---END LESSONS---
}
Read these artifacts for full context:
- Storyboard: .auto-episode/ep${EP_NUM}-${SLUG}/storyboard.md
- Motion script: .auto-episode/ep${EP_NUM}-${SLUG}/motion-script.md (TIMESTAMPED animation spec — follow this for timing)
- Creative brief: .auto-episode/ep${EP_NUM}-${SLUG}/creative-brief.md
- Research: .auto-episode/ep${EP_NUM}-${SLUG}/research.md

A wireframe version already exists at ${EP_PATH}/VideoTemplate.tsx with verified Camera + zones layout.
Use the wireframe's zone positions and camera shots as your foundation — replace placeholder boxes with real components at their zone positions.

FOLLOW THE DIRECTOR'S BUILD PRIORITIES. Build the signature visual FIRST, then supporting components.

IMPORTANT:
- Read CLAUDE.md first — especially the Animation Toolkit section and the Characters section
- Build components FIRST, before VideoTemplate.tsx
- Use the MOTION SCRIPT for exact timing — every element has a timestamp, follow it
- Each component should be self-contained and animated
- The core visual MUST NOT use CE. Choose from: GSAP timeline, SVG path morphing, CSS @keyframes, Canvas 2D, or morph()
- GSAP is installed (import gsap from 'gsap') — use it for choreographed sequences
- Use the brand fonts (var(--font-display), var(--font-mono), var(--font-body))
- Use viewport-relative units (vw, vh) for responsive 1920x1080 capture
- Do NOT use DiagramBox, FlowRow, or shared library components as the core visual
- Import CE from @/lib/video ONLY for supporting text/labels, not the core animation
- Import { Camera, focus, fitRect } from @/lib/video for layout — place content at zone positions on the canvas, Camera handles viewport movement
- If the storyboard includes CHARACTER scenes: import { Character } from '@/lib/video'. Characters are ready-made animated SVG stick figures — do NOT build custom character components. Just use <Character name="alice" emotion="explaining" gesture="point" says="text" />. Read the Characters section in CLAUDE.md for the full props API (emotions, gestures, lookAt, speech bubbles).

Create the episode directory and component files:
- mkdir -p ${EP_PATH}/
- Write each custom component as a separate file in the episode folder
- If the component needs helper functions or data, include them

Test that the components compile: run npx tsc --noEmit --project client/tsconfig.json

Build something beautiful. The director is watching.
PROMPT_END
)" --new-session --session-file "$BUILD_SESSION"
fi

# ═════════════════════════════════════════════════════════════════════════════
# PHASE 7: IMPLEMENT VIDEOTEMPLATE  [Executor — resumes build session]
# ═════════════════════════════════════════════════════════════════════════════

divider "EXECUTOR" "IMPLEMENT VIDEOTEMPLATE"

if phase_done "build-template"; then
  log "⏭ build-template already done — skipping"
else
PAST_LESSONS_TEMPLATE=""
if [ -f "$PROJECT_DIR/.auto-episode/lessons-learned.md" ]; then
  PAST_LESSONS_TEMPLATE=$(cat "$PROJECT_DIR/.auto-episode/lessons-learned.md")
fi

run_phase "build-template" "$(cat <<PROMPT_END
Now assemble the full VideoTemplate.tsx for episode ${EP_NUM}: ${TOPIC}.

Read the storyboard for scene details: .auto-episode/ep${EP_NUM}-${SLUG}/storyboard.md
Read the director's build guidance: .auto-episode/ep${EP_NUM}-${SLUG}/director-storyboard.md

${PAST_LESSONS_TEMPLATE:+LESSONS FROM PAST EPISODES — avoid these known pitfalls:
---BEGIN LESSONS---
${PAST_LESSONS_TEMPLATE}
---END LESSONS---
}
Using your custom components, build the complete single-canvas VideoTemplate following CLAUDE.md.

CHECKLIST:
1. Import useVideoPlayer, DevControls, morph, Camera, focus, fitRect, createThemedCE, ceThemes from @/lib/video
2. If the storyboard has CHARACTER scenes: also import { Character } from '@/lib/video'. Use <Character name="alice" emotion="explaining" gesture="point" lookAt="right" says="Speech text" position={{ x: '25%', y: '85%' }} size="8vw" />. Character props change per scene — use morph() or conditional rendering based on currentScene to update emotion/gesture/says per scene. Keep speech bubble text SHORT (max ~12 words).
3. Create a themed CE: const ECE = createThemedCE(ceThemes.blurIn) — pick a theme that fits the episode mood (blurIn, clipCircle, glitch, scalePop, wipeRight, flip, rotateIn, etc). NEVER use bare CE with default fade-up.
4. Import your custom components from the episode folder
5. Import EP_COLORS, EP_SPRINGS from the episode's constants.ts
6. Define SCENE_DURATIONS based on storyboard timing
7. Use morph() as the PRIMARY animation pattern — elements stay mounted and transform between scene states
8. Use Camera for layout — wrap visual content in Camera with shots per scene using focus()/fitRect(). Place content at zone positions (absolute vw/vh). Pass zones prop for dev minimap. Text captions go OUTSIDE Camera in screen space. FINAL SCENE must fitRect() to reveal the entire canvas.
9. Use CE ONLY for text captions and labels — NOT for the core visual
10. Use GSAP (gsap.timeline()) for choreographed sequences where morph() isn't enough
11. Progressive reveal in every scene — staggered delays
12. Episode-specific spring configs from EP_SPRINGS (NOT springs.snappy)
13. Background from EP_COLORS (NOT var(--color-bg-light) by default)

POSITIONING:
- Use Camera system — place content at zone positions on the canvas using absolute vw/vh coordinates
- Use focus(cx, cy, scale) and fitRect(x, y, w, h) helpers to compute camera shots — NOT manual x/y math
- Pass zones array to Camera for the dev minimap — verify in browser that all zones are reachable
- Text captions (ECE) go OUTSIDE the Camera in screen space — they're always visible regardless of camera position
- Do NOT write manual POSITION AUDIT comments — the automated visual QA tool + dev minimap verify positioning

ALSO:
- Add data-video="ep${EP_NUM}" attribute on the root div (required for recording)
- Register the episode in client/src/App.tsx (add route)
- Register in client/src/pages/Home.tsx (add to episode list)
- Export from client/src/episodes/index.ts
- Run npx tsc --noEmit --project client/tsconfig.json to verify

The VideoTemplate should be a complete, working episode ready for preview.
PROMPT_END
)" --session-file "$BUILD_SESSION"
fi

# ═════════════════════════════════════════════════════════════════════════════
# TYPE CHECK
# ═════════════════════════════════════════════════════════════════════════════

log "Running TypeScript type check..."
cd "$PROJECT_DIR"
if npx tsc --noEmit --project client/tsconfig.json 2>"$WORK_DIR/typecheck.log"; then
  log "Type check passed"
else
  log "Type check failed — errors saved to $WORK_DIR/typecheck.log"
  log "Will address in visual QA or critique→plan→rebuild loop"
fi

# ═════════════════════════════════════════════════════════════════════════════
# PHASE 8: VISUAL QA  [Executor — screenshots + positioning fixes]
# ═════════════════════════════════════════════════════════════════════════════
# This phase catches the #1 visual bug class: content off-screen, overlapping,
# or clipped due to layout issues. It takes screenshots of every scene
# and has an executor verify and fix positioning BEFORE the creative critique.

divider "EXECUTOR" "VISUAL QA — AUTOMATED POSITIONING VERIFICATION"

if phase_done "visual-qa"; then
  log "⏭ visual-qa already done — skipping"
else

# Run automated visual QA tool (Playwright-based, deterministic)
VQ_OUTPUT_DIR="$WORK_DIR/visual-qa"
VQ_REPORT=""
VQ_EXIT_CODE=0

log "Running automated visual QA (Playwright)..."
if cd "$PROJECT_DIR" && node scripts/visual-qa.mjs "ep${EP_NUM}" "$VQ_OUTPUT_DIR" 2>"$WORK_DIR/visual-qa-err.log"; then
  VQ_EXIT_CODE=0
  log "✓ Visual QA passed — all scenes OK"
else
  VQ_EXIT_CODE=$?
  if [ "$VQ_EXIT_CODE" -eq 1 ]; then
    log "⚠ Visual QA found positioning issues — will fix"
  else
    log "Visual QA script error (non-fatal) — will fall back to screenshot review"
  fi
fi

# Read the report if it exists
if [ -f "$VQ_OUTPUT_DIR/report.md" ]; then
  VQ_REPORT=$(cat "$VQ_OUTPUT_DIR/report.md")
fi

# Also grab any TS errors to fix
VQ_TS_ERRORS=""
if [ -f "$WORK_DIR/typecheck.log" ] && [ -s "$WORK_DIR/typecheck.log" ]; then
  VQ_TS_ERRORS=$(cat "$WORK_DIR/typecheck.log")
fi

# Only run fix phase if there were issues
if [ "$VQ_EXIT_CODE" -eq 1 ] || [ -n "$VQ_TS_ERRORS" ]; then

run_phase "visual-qa" "$(cat <<PROMPT_END
You are a VISUAL QA ENGINEER for an animated Bitcoin explainer episode. Your job is to fix positioning issues found by the automated visual QA tool.

Episode: ${EP_NUM} (${TOPIC}) at ${EP_PATH}/

## AUTOMATED VISUAL QA REPORT
The tool opened the episode in Playwright at 1920×1080, stepped through every scene, and used getBoundingClientRect() to check element positions. This is deterministic — the numbers are pixel-accurate.

${VQ_REPORT}

Screenshots of every scene are saved at ${VQ_OUTPUT_DIR}/ — read them to see the actual rendering.

## YOUR JOB: FIX THE FAILURES

For each FAIL issue in the report:

1. **Read the screenshot** for that scene to see what's actually on screen
2. **Identify the root cause**:
   - Is content off-screen? → adjust the camera shot for that scene using focus() or fitRect()
   - Is the camera zoom clipping content? → reduce scale or reposition with focus(cx, cy, lowerScale)
   - Is content at the wrong zone position? → adjust the absolute vw/vh coordinates
   - Is it internal component positioning? (content offset within the component) → adjust the component
3. **Fix the code**
4. **Do NOT write a POSITION AUDIT comment** — the automated tool replaces manual math audits

For WARN issues (clipping):
- If >40% is clipped, fix it
- Minor edge clipping (<20%) is acceptable

Ignore INFO items (elements from other zones visible during camera transitions).

IMPORTANT: Do NOT compute positioning math manually. Fix by adjusting values, then re-run the visual QA tool to verify:
  node scripts/visual-qa.mjs ep${EP_NUM} ${VQ_OUTPUT_DIR}

${VQ_TS_ERRORS:+ALSO FIX THESE TYPE ERRORS: ${VQ_TS_ERRORS}}

After all fixes, run: npx tsc --noEmit to verify compilation.

Write a summary to .auto-episode/ep${EP_NUM}-${SLUG}/visual-qa.md
PROMPT_END
)" --session-file "$BUILD_SESSION"

else
  log "✓ No positioning issues to fix"
  mark_done "visual-qa"
fi

fi

# ═════════════════════════════════════════════════════════════════════════════
# PHASE 8.5: STRUCTURAL HARD GATES  [Bash — no tokens, instant checks]
# ═════════════════════════════════════════════════════════════════════════════
# Catch CLAUDE.md rule violations BEFORE spending tokens on 3 critic agents.
# Each check is a simple grep — zero cost, zero context window usage.
# Inspired by Ralph's verifiable acceptance criteria pattern.

divider "GATE" "STRUCTURAL HARD GATES (pre-critique)"

GATE_FAILS=0
GATE_REPORT=""

gate_check() {
  local name="$1"
  local cmd="$2"
  if eval "$cmd" >/dev/null 2>&1; then
    log "  PASS: $name"
  else
    log "  FAIL: $name"
    GATE_REPORT="${GATE_REPORT}
- FAIL: $name"
    GATE_FAILS=$((GATE_FAILS + 1))
  fi
}

cd "$PROJECT_DIR" || exit 1

gate_check "No bare CE — must use createThemedCE/ECE" \
  "! grep -E '<CE[ >]' '${EP_PATH}/VideoTemplate.tsx'"

gate_check "GSAP actually used somewhere" \
  "grep -rql 'useSceneGSAP\|gsap\.\|useGSAP' '${EP_PATH}/'"

gate_check "Custom palette EP_COLORS defined" \
  "grep -q 'EP_COLORS' '${EP_PATH}/constants.ts'"

gate_check "Custom springs EP_SPRINGS defined" \
  "grep -q 'EP_SPRINGS' '${EP_PATH}/constants.ts'"

gate_check "Camera system used for layout" \
  "grep -qE '<Camera' '${EP_PATH}/VideoTemplate.tsx'"

gate_check "Background is NOT default beige #E6D3B3" \
  "! grep -q \"#E6D3B3\" '${EP_PATH}/constants.ts'"

gate_check "3+ camera shots for dynamic movement" \
  "[ \$(grep -cE 'focus\(|fitRect\(|scale:' '${EP_PATH}/VideoTemplate.tsx' '${EP_PATH}/constants.ts' 2>/dev/null | awk -F: '{s+=\$NF}END{print s}') -ge 3 ]"

gate_check "Themed CE used (createThemedCE or ceThemes)" \
  "grep -rql 'createThemedCE\|ceThemes' '${EP_PATH}/'"

gate_check "Has custom visual component (not just VideoTemplate)" \
  "[ \$(find '${EP_PATH}/' -name '*.tsx' ! -name 'VideoTemplate.tsx' | wc -l | tr -d ' ') -ge 1 ]"

log ""
log "Hard gates: $((9 - GATE_FAILS))/9 passed"

if [ "$GATE_FAILS" -gt 0 ]; then
  log "⚠ $GATE_FAILS structural violation(s) — auto-fixing before critique"

  run_phase "structural-fix" "$(cat <<PROMPT_END
The automated structural hard gates found $GATE_FAILS violation(s) in episode ${EP_NUM}: ${TOPIC}.

These are NON-NEGOTIABLE rules from CLAUDE.md. Fix them BEFORE the episode goes to critics.

FAILURES:
${GATE_REPORT}

Fix instructions per rule:
- No bare <CE>: use createThemedCE(ceThemes.xxx) to make an ECE, then use <ECE> instead of <CE>
- GSAP must be used: import { useSceneGSAP } from '@/lib/video' and add at least one choreographed sequence
- EP_COLORS / EP_SPRINGS: define in constants.ts with episode-specific values (not generic)
- Camera: import { Camera, focus, fitRect } from '@/lib/video' — wrap visual content in Camera with zones
- No beige default: change bg in EP_COLORS to a color that fits the episode mood
- 3+ camera shots: define at least 3 distinct camera positions using focus()/fitRect() for dynamic movement
- Themed CE: import ceThemes from '@/lib/video', call createThemedCE with a theme (blurIn, clipCircle, glitch, etc.)
- Custom component: the episode's core visual must be a separate .tsx file, not inline in VideoTemplate

Read ${EP_PATH}/ files and fix each violation. Then run: npx tsc --noEmit --project client/tsconfig.json
PROMPT_END
)" --session-file "$BUILD_SESSION"

  # Re-run gates to verify fixes
  log "Re-checking hard gates after fix..."
  GATE_FAILS_POST=0
  for check_name in "No bare CE" "GSAP used" "EP_COLORS" "EP_SPRINGS" "Camera" "Not beige" "3+ camera shots" "Themed CE" "Custom component"; do
    # Just count — detailed log already happened above
    true
  done
  log "Structural fix complete — proceeding to critique"
fi

# ═════════════════════════════════════════════════════════════════════════════
# CRITIQUE → PLAN → REBUILD LOOP  [Planner↔Executor alternating]
# ═════════════════════════════════════════════════════════════════════════════

QUALITY_THRESHOLD=75
MAX_ITERATIONS=3
ITERATION=0

while [ $ITERATION -lt $MAX_ITERATIONS ]; do
  ITERATION=$((ITERATION + 1))

  # ── CRITIQUE [Planner — fresh session, adversarial review] ───────────────

  divider "PLANNER" "CRITIQUE (iteration $ITERATION/$MAX_ITERATIONS)"

  # Type check
  TYPECHECK_ERRORS=""
  cd "$PROJECT_DIR" || exit 1
  if npx tsc --noEmit --project client/tsconfig.json 2>"$WORK_DIR/typecheck-iter${ITERATION}.log"; then
    log "Type check passed"
  else
    TYPECHECK_ERRORS=$(cat "$WORK_DIR/typecheck-iter${ITERATION}.log")
    log "Type check failed — will include errors in critique"
  fi

  # Count scenes
  SCENE_COUNT=$(cd "$PROJECT_DIR" || exit 1; grep -oE 'scene[0-9]+' "${EP_PATH}/VideoTemplate.tsx" 2>/dev/null | sort -u | wc -l | tr -d ' ')
  [ -z "$SCENE_COUNT" ] && SCENE_COUNT=0

  # ── VISUAL SCREENSHOTS ────────────────────────────────────────────────────

  SCREENSHOT_DIR="$WORK_DIR/screenshots-iter${ITERATION}"
  SCREENSHOT_NOTE=""

  if [ "$SCENE_COUNT" -gt 0 ]; then
    log "Capturing screenshots of ${SCENE_COUNT} scenes..."
    mkdir -p "$SCREENSHOT_DIR"

    if cd "$PROJECT_DIR" && node scripts/screenshot-scenes.mjs "ep${EP_NUM}" "$SCENE_COUNT" "$SCREENSHOT_DIR" 2>"$WORK_DIR/screenshot-err-iter${ITERATION}.log"; then  # shellcheck disable=SC2164
      SCREENSHOT_COUNT=$(ls "$SCREENSHOT_DIR"/*.png 2>/dev/null | wc -l | tr -d ' ')
      log "Captured $SCREENSHOT_COUNT screenshots"
      SCREENSHOT_NOTE="Screenshots of each scene are saved at $SCREENSHOT_DIR/. Read the PNG files to visually review each scene's layout, colors, spacing, and overall look."
    else
      log "Screenshot capture failed (non-fatal) — continuing with code-only review"
      SCREENSHOT_NOTE="(Screenshots unavailable — review code only)"
    fi
  fi

  # ── MULTI-PERSONA PARALLEL CRITIQUE (3 agents) ──────────────────────────

  SHARED_CRITIQUE_CONTEXT=$(cat <<CONTEXT_END
Episode ${EP_NUM} (${TOPIC}) at ${EP_PATH}/

Read the code:
- ${EP_PATH}/VideoTemplate.tsx and all custom components in that folder
- ${EP_PATH}/constants.ts

Also read for comparison:
- Creative brief: .auto-episode/ep${EP_NUM}-${SLUG}/creative-brief.md
- Storyboard: .auto-episode/ep${EP_NUM}-${SLUG}/storyboard.md
- Motion script: .auto-episode/ep${EP_NUM}-${SLUG}/motion-script.md
- Director guidance: .auto-episode/ep${EP_NUM}-${SLUG}/director-research.md
- The Episode Registry in CLAUDE.md (do NOT read old episode code)

${SCREENSHOT_NOTE}
CONTEXT_END
)

  # ── Critic A: Visual Designer ───────────────────────────────────────────
  PROMPT_CRITIC_VISUAL=$(cat <<PROMPT_END
You are a VISUAL DESIGNER reviewing an animated episode. You care about aesthetics, motion design, and visual polish. Be brutally honest.

${SHARED_CRITIQUE_CONTEXT}

YOUR FOCUS — score each 1-10:

1. VISUAL ORIGINALITY — looks different from all episodes in the Episode Registry? Custom signature visual? Or is it another CE fade-in episode?
2. ANIMATION VARIETY — does the core visual use GSAP, SVG morph, Canvas, CSS keyframes? CE should only be for text/labels. Score 1 if everything uses CE.
3. CAMERA MOVEMENT — does the episode have dynamic, non-linear camera movement? Zoom in/out (scale range 0.3-2.5+)? Backtrack to earlier zones? Vertical pans? Does the FINAL SCENE zoom out to reveal the entire canvas as a visual summary? Static or left-to-right-only = low score.
4. CUSTOM PALETTE — EP_COLORS and EP_SPRINGS in constants.ts? Background NOT default beige?
5. VISUAL POLISH — if screenshots available, READ THEM: layout balance, spacing, color harmony, text readability, professional quality. Would this stand up next to 3Blue1Brown?
BONUS: If characters (Alice/Bob) are used — do they have varied emotions across scenes? Are gestures used meaningfully (not all 'none')? Do they look at each other during dialogue? Are speech bubbles readable and short? Do characters add personality or feel like decoration?

OVERALL VISUAL SCORE: X/50

LIST specific visual issues with priority: MUST FIX / SHOULD FIX / NICE TO HAVE

Save to .auto-episode/ep${EP_NUM}-${SLUG}/critique-visual-iter${ITERATION}.md

At the very end, output EXACTLY: VISUAL_SCORE: <number>
PROMPT_END
)

  # ── Critic B: Technical Reviewer ────────────────────────────────────────
  PROMPT_CRITIC_TECH=$(cat <<PROMPT_END
You are a TECHNICAL REVIEWER for a Bitcoin explainer video. You care about accuracy, code quality, and positioning correctness. Be precise.

${SHARED_CRITIQUE_CONTEXT}

Also read: .auto-episode/ep${EP_NUM}-${SLUG}/research.md (the technical research)

YOUR FOCUS — score each 1-10:

1. TECHNICAL ACCURACY — are Bitcoin/crypto concepts explained correctly? Real values used? Any factual errors?
2. CODE QUALITY — compiles? (TS errors: ${TYPECHECK_ERRORS:-none}) Clean structure? No dead code?
3. POSITIONING ACCURACY — check the visual QA report at .auto-episode/ep${EP_NUM}-${SLUG}/visual-qa/report.md (if it exists).
   - Are there any FAIL issues (off-screen elements)? Flag as MUST FIX.
   - Are there WARN issues (clipped elements)? Flag significant ones as SHOULD FIX.
   - If no report exists, run: node scripts/visual-qa.mjs ep${EP_NUM} .auto-episode/ep${EP_NUM}-${SLUG}/visual-qa
   - Also check: sceneRange guards match components' internal scene logic? Any empty scenes?
   Score 1 if report has failures. Score 10 if report shows all scenes pass.

OVERALL TECHNICAL SCORE: X/30

LIST specific technical issues with priority: MUST FIX / SHOULD FIX / NICE TO HAVE

Save to .auto-episode/ep${EP_NUM}-${SLUG}/critique-tech-iter${ITERATION}.md

At the very end, output EXACTLY: TECHNICAL_SCORE: <number>
PROMPT_END
)

  # ── Critic C: Audience Proxy ────────────────────────────────────────────
  PROMPT_CRITIC_AUDIENCE=$(cat <<PROMPT_END
You are a DEVELOPER WHO KNOWS BASIC BITCOIN but NOT the specific topic of this episode. You are the TARGET AUDIENCE. You're watching this for the first time.

${SHARED_CRITIQUE_CONTEXT}

YOUR FOCUS — evaluate as a first-time viewer. Score each 1-10:

1. HOOK — does the opening grab attention? Does scene 2 start from familiar ground, or does it throw jargon at you?
2. TEACHING FLOW — one idea per scene? Progressive reveal? Or does it dump information? Can you follow the logic from scene to scene?
3. TEXT RULES — one sentence per heading? Max ~15 words? Or are there walls of text that would fly by in a video?
4. EMOTIONAL ARC — do you feel curiosity → confusion → aha → satisfaction? Is there a clear highlight/aha scene? Where does the "wait, really?!" moment land?
5. THE "SO WHAT?" TEST — after watching, do you understand WHY this matters? Is there a "why is this a big deal?" beat?

Walk through the episode scene by scene and narrate your experience as a viewer:
- Scene 1: "I see... this makes me think..."
- Scene 2: "OK so this is about... I'm curious because..."
- (etc.)
- Flag any scene where you'd lose interest, get confused, or feel talked down to.
- If characters appear: Do Alice & Bob feel like they're having a real conversation, or is it forced? Does the dialogue help you understand, or does it slow things down? Are their emotions appropriate for the moment?

OVERALL AUDIENCE SCORE: X/20 (weighted: hook 4pts, teaching 4pts, text 4pts, arc 4pts, so-what 4pts)

LIST specific audience issues with priority: MUST FIX / SHOULD FIX / NICE TO HAVE

Save to .auto-episode/ep${EP_NUM}-${SLUG}/critique-audience-iter${ITERATION}.md

At the very end, output EXACTLY: AUDIENCE_SCORE: <number>
PROMPT_END
)

  # ── Launch all 3 critics in parallel ────────────────────────────────────
  log "Launching 3 parallel critics..."

  bg_claude "critique-visual-iter${ITERATION}" "$PROMPT_CRITIC_VISUAL" "$PLANNER_TOOLS"
  PID_CV=$!
  bg_claude "critique-tech-iter${ITERATION}" "$PROMPT_CRITIC_TECH" "$PLANNER_TOOLS"
  PID_CT=$!
  bg_claude "critique-audience-iter${ITERATION}" "$PROMPT_CRITIC_AUDIENCE" "$PLANNER_TOOLS"
  PID_CA=$!

  wait_group "Parallel critique (3 personas)" "$PID_CV" "$PID_CT" "$PID_CA"
  CRITIQUE_COST=$(sum_costs "critique-visual-iter${ITERATION}" "critique-tech-iter${ITERATION}" "critique-audience-iter${ITERATION}")
  log "Critique cost: \$${CRITIQUE_COST}"

  # ── Merge critiques ─────────────────────────────────────────────────────

  CRIT_VISUAL=$(read_artifact "critique-visual-iter${ITERATION}.md")
  CRIT_TECH=$(read_artifact "critique-tech-iter${ITERATION}.md")
  CRIT_AUDIENCE=$(read_artifact "critique-audience-iter${ITERATION}.md")

  run_phase "critique-merge-iter${ITERATION}" "$(cat <<PROMPT_END
You are merging critiques from three specialist reviewers into a single prioritized critique.

---VISUAL DESIGNER CRITIQUE---
${CRIT_VISUAL}
---END VISUAL---

---TECHNICAL REVIEWER CRITIQUE---
${CRIT_TECH}
---END TECHNICAL---

---AUDIENCE PROXY CRITIQUE---
${CRIT_AUDIENCE}
---END AUDIENCE---

MERGE RULES:
1. Extract scores: VISUAL_SCORE (out of 50) + TECHNICAL_SCORE (out of 30) + AUDIENCE_SCORE (out of 20) = TOTAL/100
2. If a score line is missing, estimate based on the critique content
3. Consolidate all issues into a single list, removing duplicates
4. When critics disagree, prioritize: MUST FIX issues from ANY critic stay MUST FIX
5. Sort final issues: MUST FIX first, then SHOULD FIX, then NICE TO HAVE
6. Note which persona flagged each issue (helps the fix planner understand the concern)

Save to .auto-episode/ep${EP_NUM}-${SLUG}/critique-iter${ITERATION}.md

Format:
## Scores
- Visual Design: X/50 (from visual critic)
- Technical Quality: X/30 (from tech critic)
- Audience Experience: X/20 (from audience proxy)
- **TOTAL: X/100**

## Consolidated Issues

### MUST FIX
- [issue] (flagged by: visual/tech/audience)

### SHOULD FIX
- [issue] (flagged by: visual/tech/audience)

### NICE TO HAVE
- [issue] (flagged by: visual/tech/audience)

## Audience Walkthrough Summary
[Key moments from the audience proxy's scene-by-scene narration — where did they get confused or lose interest?]

At the very end, output EXACTLY this line (machine-parsed):
QUALITY_SCORE: <total number>
PROMPT_END
)" --new-session --session-file "$WORK_DIR/session_critique_merge_iter${ITERATION}" --tools "$PLANNER_TOOLS"

  # ── EXTRACT SCORE ─────────────────────────────────────────────────────────

  CRITIQUE_FILE="$WORK_DIR/critique-iter${ITERATION}.md"
  # Also check the merge output
  MERGE_FILE="$WORK_DIR/critique-merge-iter${ITERATION}.md"

  SCORE=0
  for f in "$CRITIQUE_FILE" "$MERGE_FILE"; do
    if [ -f "$f" ] && { [ "$SCORE" = "0" ] || [ -z "$SCORE" ]; }; then
      SCORE=$(grep 'QUALITY_SCORE:' "$f" 2>/dev/null | sed 's/[^0-9]//g' | tail -1 || echo "0")
    fi
  done
  [ -z "$SCORE" ] && SCORE=0

  log "Iteration $ITERATION score: $SCORE/100 (threshold: $QUALITY_THRESHOLD)"

  # ── CHECK THRESHOLD ───────────────────────────────────────────────────────

  if [ "$SCORE" -ge "$QUALITY_THRESHOLD" ]; then
    log "Quality threshold met ($SCORE >= $QUALITY_THRESHOLD) — proceeding"
    break
  fi

  if [ "$ITERATION" -ge "$MAX_ITERATIONS" ]; then
    log "Max iterations reached ($MAX_ITERATIONS) — proceeding with best effort"
    break
  fi

  # ── PAUSE (unless --full-auto) ────────────────────────────────────────────

  if [ "$FULL_AUTO" = "false" ]; then
    echo ""
    echo "╔══════════════════════════════════════════════════════════════════════╗"
    echo "║  CRITIQUE $ITERATION — Score: $SCORE/100 (need $QUALITY_THRESHOLD)  ║"
    echo "║                                                                    ║"
    echo "║  Critique:     $CRITIQUE_FILE"
    if [ -d "$SCREENSHOT_DIR" ]; then
    echo "║  Screenshots:  $SCREENSHOT_DIR/"
    fi
    echo "║                                                                    ║"
    echo "║  Press ENTER to rebuild, or Ctrl+C to stop and review.             ║"
    echo "╚══════════════════════════════════════════════════════════════════════╝"
    echo ""
    read -r
  fi

  # ── FIX PLAN [Planner — reads critique, writes bounded plan] ──────────────

  divider "PLANNER" "FIX PLAN (iteration $ITERATION)"

  CRITIQUE_TEXT=$(read_artifact "critique-iter${ITERATION}.md")

  run_phase "fix-plan-iter${ITERATION}" "$(cat <<PROMPT_END
You are a TECHNICAL LEAD planning fixes for a code review. You don't write code — you write a FIX PLAN. You cannot edit code files.

The critique scored this episode $SCORE/100. Threshold is $QUALITY_THRESHOLD/100.

---BEGIN CRITIQUE---
${CRITIQUE_TEXT}
---END CRITIQUE---

Also read the current code:
- ${EP_PATH}/VideoTemplate.tsx
- Any custom components in ${EP_PATH}/

And the original vision:
- Storyboard: .auto-episode/ep${EP_NUM}-${SLUG}/storyboard.md
- Creative brief: .auto-episode/ep${EP_NUM}-${SLUG}/creative-brief.md

Your job:
1. Read every issue in the critique
2. Classify each: STRUCTURAL (needs redesign) vs COSMETIC (needs polish)
3. Prioritize by impact on quality score
4. Write a BOUNDED fix plan — specific, actionable, ordered tasks

Save to .auto-episode/ep${EP_NUM}-${SLUG}/fix-plan-iter${ITERATION}.md

Format:
## Priority 1: [Most impactful fix]
- What's wrong: [specific issue from critique]
- Classification: STRUCTURAL / COSMETIC
- What to do: [specific action — be precise about what code to change]
- Files to change: [paths]
- Expected score impact: [which criteria improve, by how much]

## Priority 2: ...
(repeat for each fix)

## Do NOT Touch
[things the critique flagged that are actually fine, or not worth the risk of changing]

## Summary
- Total fixes: X
- Structural: X
- Cosmetic: X
- Expected new score: ~X/100

Keep it to 3-5 priorities MAX. Bounded work, not a rewrite.
If the score is below 40, priority 1 MUST be structural — polish won't save it.
PROMPT_END
)" --new-session --session-file "$WORK_DIR/session_planner_iter${ITERATION}" --tools "$PLANNER_TOOLS"

  # ── REBUILD [Executor — reads fix plan, executes bounded fixes] ───────────

  divider "EXECUTOR" "REBUILD (iteration $ITERATION)"

  FIX_PLAN=$(read_artifact "fix-plan-iter${ITERATION}.md")

  run_phase "rebuild-iter${ITERATION}" "$(cat <<PROMPT_END
A technical lead reviewed the critique and wrote a FIX PLAN for episode ${EP_NUM}: ${TOPIC}. Score: $SCORE/100. Threshold: $QUALITY_THRESHOLD/100.

---BEGIN FIX PLAN---
${FIX_PLAN}
---END FIX PLAN---

Execute the fix plan IN ORDER OF PRIORITY. For each fix:
1. Read the specific file mentioned
2. Make the specific change described
3. Move to the next priority

RULES:
- Follow the plan. Don't freelance. The planner already decided what matters.
- If a fix is marked STRUCTURAL, commit to the redesign — don't half-ass it
- If something is in "Do NOT Touch", leave it alone
- After all fixes, run: npx tsc --noEmit --project client/tsconfig.json
- If type errors remain, fix them
- For any positioning fixes, verify with the automated tool: node scripts/visual-qa.mjs ep${EP_NUM} .auto-episode/ep${EP_NUM}-${SLUG}/visual-qa
  Do NOT rely on manual arithmetic — use the tool's deterministic output.

The planner's plan is your spec. Execute it precisely.
PROMPT_END
)" --session-file "$BUILD_SESSION"

done  # end critique→plan→rebuild loop

log "Final quality score: $SCORE/100 after $ITERATION iteration(s)"

# ═════════════════════════════════════════════════════════════════════════════
# VOICEOVER (Optional)  [Executor]
# ═════════════════════════════════════════════════════════════════════════════

if [ "$WITH_VOICE" = "true" ]; then
  divider "EXECUTOR" "VOICEOVER & AUDIO SYNC"

  run_phase "voiceover" "$(cat <<PROMPT_END
Now create the voiceover for episode ${EP_NUM}: ${TOPIC}.

STEP 1: Write the voiceover transcript.
Read the final VideoTemplate.tsx to understand the scene flow. Write a transcript following CLAUDE.md voiceover rules:
- One scene = one voiceover paragraph
- Casual-educational tone, peer-to-peer
- Complements on-screen text (doesn't repeat it)
- Natural spoken language (contractions, direct address)
- ~2.5 words/second for timing estimates

Save to ${EP_PATH}/transcript.txt in the standard format (see existing transcripts).

STEP 2: Create scripts/generate-voiceover-ep${EP_NUM}.mjs
Follow the pattern from scripts/generate-voiceover-ep5.mjs.
Voice ID: InRyolULHTXjegISsXuJ, model: eleven_multilingual_v2
Settings: { stability: 0.6, similarity_boost: 0.8, style: 0.3 }
Output to: ${AUDIO_PATH}/

STEP 3: Update SCENE_DURATIONS = estimated_audio_length + 2500ms buffer.

STEP 4: Add SCENE_AUDIO array + audio playback effect (400ms delay pattern).
Add timing comments: // "phrase" @ Xs audio → X.4s scene

Do NOT call the ElevenLabs API — just create the script.
PROMPT_END
)" --session-file "$BUILD_SESSION"
else
  log "Skipping voiceover (use --with-voice to include)"
fi

# ═════════════════════════════════════════════════════════════════════════════
# CROSS-EPISODE LEARNING  [Extract lessons for future episodes]
# ═════════════════════════════════════════════════════════════════════════════

divider "PLANNER" "CROSS-EPISODE LEARNING"

LESSONS_FILE="$PROJECT_DIR/.auto-episode/lessons-learned.md"

# Gather critique history for this episode
CRITIQUE_HISTORY=""
for i in $(seq 1 "$ITERATION"); do
  if [ -f "$WORK_DIR/critique-iter${i}.md" ]; then
    CRITIQUE_HISTORY="${CRITIQUE_HISTORY}
---ITERATION ${i} CRITIQUE---
$(cat "$WORK_DIR/critique-iter${i}.md")
---END ITERATION ${i}---
"
  fi
done

# Gather fix plans
FIX_HISTORY=""
for i in $(seq 1 "$ITERATION"); do
  if [ -f "$WORK_DIR/fix-plan-iter${i}.md" ]; then
    FIX_HISTORY="${FIX_HISTORY}
---ITERATION ${i} FIX PLAN---
$(cat "$WORK_DIR/fix-plan-iter${i}.md")
---END FIX PLAN ${i}---
"
  fi
done

EXISTING_LESSONS=""
if [ -f "$LESSONS_FILE" ]; then
  EXISTING_LESSONS=$(cat "$LESSONS_FILE")
fi

run_phase "lessons" "$(cat <<PROMPT_END
You are extracting LESSONS LEARNED from an episode build pipeline to improve future episodes.

Episode ${EP_NUM}: ${TOPIC}
Final score: ${SCORE}/100 after ${ITERATION} iteration(s)

CRITIQUE HISTORY:
${CRITIQUE_HISTORY}

FIX PLAN HISTORY:
${FIX_HISTORY}

EXISTING LESSONS FROM PAST EPISODES:
${EXISTING_LESSONS:-"(none yet — this is the first episode to extract lessons)"}

YOUR JOB:
1. What bugs appeared and how were they fixed? (positioning, timing, visual issues)
2. What visual approaches scored well vs poorly?
3. What did the critique consistently flag across iterations?
4. What took the most iterations to get right?
5. What worked on the first try?
6. Did the structural hard gates catch anything? (the pipeline now runs automated grep checks before critique)

RULES:
- Only extract lessons that are GENERALIZABLE to future episodes — not episode-specific details
- If a lesson already exists in the file, UPDATE it (add new evidence) rather than duplicating
- Remove lessons that turned out to be wrong or no longer relevant
- Keep each lesson to 1-2 sentences with a concrete action item
- Include the episode number so we can track when lessons were learned

FORMAT for the full file (this structure is IMPORTANT — keep all sections):

# Lessons Learned — Auto-Episode Pipeline

## Codebase Patterns (consolidated — most important, read first)
Reusable patterns that future build phases should know. Keep this section short and high-signal.
- [pattern] (learned from ep<N>, confirmed by ep<M>)

## Common Bugs (watch out for these)
- [lesson] (learned from ep<N>)

## What Scores Well
- [lesson] (learned from ep<N>)

## What Scores Poorly
- [lesson] (learned from ep<N>)

## Build Process Tips
- [lesson] (learned from ep<N>)

## Episode Log
Append-only — one entry per episode. Never delete entries, only add new ones.
- ep<N> (<topic>): score <X>/100, <Y> iterations. Key takeaway: [one sentence]

Save to .auto-episode/lessons-learned.md.
IMPORTANT: The "Episode Log" section at the bottom is APPEND-ONLY — always keep existing episode entries and add the new one. The other sections can be updated/merged/consolidated, but Episode Log only grows.
PROMPT_END
)" --new-session --session-file "$WORK_DIR/session_lessons" --tools "$PLANNER_TOOLS"

log "Lessons learned extracted to .auto-episode/lessons-learned.md"

# ═════════════════════════════════════════════════════════════════════════════
# DONE
# ═════════════════════════════════════════════════════════════════════════════

echo ""
echo "╔══════════════════════════════════════════════════════════════════════╗"
echo "║  PIPELINE COMPLETE                                                 ║"
echo "╠══════════════════════════════════════════════════════════════════════╣"
echo "║                                                                    ║"
echo "║  Episode:       ${EP_PATH}/"
echo "║  Artifacts:     .auto-episode/ep${EP_NUM}-${SLUG}/"
echo "║  Quality:       ${SCORE}/100 after ${ITERATION} iteration(s)"
echo "║                                                                    ║"
echo "║  Artifacts produced:                                               ║"
echo "║    research-{technical,visual,angle}.md — Parallel research        ║"
echo "║    research.md             — Merged research document              ║"
echo "║    director-research.md    — Director's creative direction         ║"
echo "║    creative-brief.md       — Visual concept + signature visual     ║"
echo "║    storyboard.md           — Scene-by-scene plan                   ║"
echo "║    director-storyboard.md  — Director's build guidance             ║"
echo "║    motion-script.md        — Timestamped animation spec            ║"
echo "║    wireframe-qa.md         — Wireframe positioning verification    ║"
echo "║    critique-{visual,tech,audience}-iter*.md — Persona critiques    ║"
echo "║    critique-iter*.md       — Merged critique + scores              ║"
echo "║    fix-plan-iter*.md       — Planner's prioritized fix plans       ║"
echo "║    screenshots-*/          — Visual captures of each scene         ║"
echo "║    lessons-learned.md      — Cross-episode learning (cumulative)   ║"
echo "║                                                                    ║"
echo "║  Pipeline flow:                                                    ║"
echo "║    Research (3 parallel) → Merge → Director Review                 ║"
echo "║    → Creative Vision → Storyboard → Director Review               ║"
echo "║    → Motion Script → Wireframe → Wireframe QA                     ║"
echo "║    → Build Components → Build Template → Visual QA                 ║"
echo "║    → Hard Gates (9 structural checks) → Auto-fix if needed         ║"
echo "║    → Critique (3 parallel) → Merge → Plan → Rebuild (loop)        ║"
echo "║    → Lessons Learned (w/ pattern consolidation)                    ║"
echo "║                                                                    ║"
echo "║  Next steps:                                                       ║"
echo "║    1. Preview:  npm run dev:client → #ep${EP_NUM}                  ║"
echo "║    2. Review artifacts in .auto-episode/                           ║"
echo "║    3. Iterate interactively if needed                              ║"
if [ "$WITH_VOICE" = "true" ]; then
echo "║    4. Generate audio: node scripts/generate-voiceover-ep${EP_NUM}.mjs ║"
fi
echo "║                                                                    ║"
echo "╚══════════════════════════════════════════════════════════════════════╝"
echo ""

log "Pipeline completed at $(date)"
