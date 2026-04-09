#!/usr/bin/env bash
#
# auto-episode.sh v4 — Streamlined multi-agent episode generation pipeline
#
# Creates a complete Bitcoin explainer episode from topic to finished code.
# Uses parallel agents, specialized personas, and iterative quality loops.
#
# Architecture:
#   Planner (Director)  — thinks, reviews, steers (CAN'T edit code)
#   Executor (Builder)  — implements, builds, fixes (CAN edit code)
#   Parallel agents     — run simultaneously (research, critique)
#   Handoff files       — each phase writes .md artifacts the next reads
#
# Pipeline flow (default):
#   1. Research (3 parallel: technical + visual + angle) → Merge
#   2. Creative Spec (direction + visual design + storyboard + motion script)
#   3. Build (components + VideoTemplate in one pass)
#   ★  CHECKPOINT — opens browser, you watch episode, approve/redirect
#   4. Visual QA + Structural Hard Gates
#   5. Critique (2-3 parallel critics) → Fix → Rebuild (1 iteration default)
#   6. Transcript (optional, --with-transcript)
#   7. Lessons learned (async, skippable)
#
# Development loops:
#   --draft         Run full pipeline but stop after build checkpoint.
#                   See the episode fast, then decide whether to polish.
#   --rebuild       Skip planning, re-run build only using existing artifacts.
#                   For testing toolkit/CLAUDE.md changes on an existing episode.
#   --from=<phase>  Resume from a specific phase (deletes downstream markers).
#                   Valid phases: research, creative-spec, build-components, visual-qa, critique
#
# Presets:
#   --fast          1 critique iteration, 2 critics, skip lessons
#   --thorough      3 critique iterations, 3 critics
#   (default)       1 critique iteration, 3 critics
#
# Flags:
#   --palette=MODE  grayscale | brand | free (default: free)
#   --with-transcript  Generate voiceover transcript + ElevenLabs script (does NOT call the API)
#   --full-auto     Skip all human checkpoints
#   --max-critique=N  Number of critique→rebuild iterations (default: 1)
#   --critics=N     Number of parallel critics: 2 or 3 (default: 3)
#   --skip-critique Skip critique loop entirely
#   --skip-lessons  Skip cross-episode learning extraction
#   --verbose       Stream Claude output in real-time
#
# Examples:
#   ./scripts/auto-episode.sh "Merkle Trees" 7 merkle-trees
#   ./scripts/auto-episode.sh "Merkle Trees" 7 merkle-trees --draft
#   ./scripts/auto-episode.sh "Merkle Trees" 7 merkle-trees --rebuild
#   ./scripts/auto-episode.sh "Merkle Trees" 7 merkle-trees --from=build-components
#   ./scripts/auto-episode.sh "Merkle Trees" 7 merkle-trees --fast
#   ./scripts/auto-episode.sh "Timewarp Attack" 8 timewarp --thorough --with-transcript
#   ./scripts/auto-episode.sh "SHA-256" 9 sha256 --palette=brand --full-auto
#
# Output:
#   - Episode code in client/src/episodes/ep<N>-<slug>/
#   - Work artifacts in .auto-episode/ep<N>-<slug>/
#   - Pipeline log in .auto-episode/ep<N>-<slug>/pipeline.log
#   - Cumulative lessons in .auto-episode/build-memory.md
#

# No set -e — we handle errors explicitly per phase

# ─── Args ────────────────────────────────────────────────────────────────────

TOPIC="${1:?Usage: auto-episode.sh <topic> <ep_number> <slug> [--draft] [--rebuild] [--from=<phase>] [--fast] [--thorough] [--palette=grayscale|brand|free] [--with-transcript] [--full-auto] [--max-critique=N] [--critics=N] [--skip-critique] [--skip-lessons] [--verbose]}"
EP_NUM="${2:?Missing episode number}"
SLUG="${3:?Missing slug (e.g., merkle-trees)}"

WITH_VOICE=false
FULL_AUTO=false
VERBOSE=false
SKIP_CRITIQUE=false
PALETTE="free"
MAX_CRITIQUE=1          # default 1 critique iteration (increase with --max-critique=N or --thorough)
NUM_CRITICS=3           # default all 3 critics (reduce with --critics=2 or --fast)
SKIP_LESSONS=false
DRAFT_MODE=false        # --draft: stop after build checkpoint
REBUILD_MODE=false      # --rebuild: skip planning, re-run build only
FROM_PHASE=""           # --from=<phase>: resume from a specific phase

# Two-pass parsing: presets first, then explicit flags override.
# This ensures --fast --max-critique=2 gives fast defaults but 2 critique iterations,
# regardless of argument order.

# Pass 1: apply presets (set baseline)
for arg in "${@:4}"; do
  case "$arg" in
    --fast)     MAX_CRITIQUE=1; NUM_CRITICS=2; SKIP_LESSONS=true ;;
    --thorough) MAX_CRITIQUE=3; NUM_CRITICS=3; SKIP_LESSONS=false ;;
    --draft)    DRAFT_MODE=true; SKIP_CRITIQUE=true; SKIP_LESSONS=true ;;
    --rebuild)  REBUILD_MODE=true; SKIP_LESSONS=true ;;
  esac
done

# Pass 2: explicit flags override presets
for arg in "${@:4}"; do
  case "$arg" in
    --with-transcript)  WITH_VOICE=true ;;
    --with-voice)       WITH_VOICE=true ;; # deprecated alias
    --full-auto)        FULL_AUTO=true ;;
    --verbose)          VERBOSE=true ;;
    --skip-critique)    SKIP_CRITIQUE=true ;;
    --skip-lessons)     SKIP_LESSONS=true ;;
    --max-critique=*)   MAX_CRITIQUE="${arg#--max-critique=}" ;;
    --critics=*)        NUM_CRITICS="${arg#--critics=}" ;;
    --from=*)           FROM_PHASE="${arg#--from=}" ;;
    --draft|--rebuild|--fast|--thorough) ;; # already handled in pass 1
    --palette)          echo "Error: --palette requires a value (grayscale|brand|free)"; exit 1 ;;
    --palette=*)        PALETTE="${arg#--palette=}" ;;
    *) echo "Unknown flag: $arg"; exit 1 ;;
  esac
done

# Validate numeric flags
case "$MAX_CRITIQUE" in
  [0-9]|[0-9][0-9]) ;;
  *) echo "Error: --max-critique must be a number (got: $MAX_CRITIQUE)"; exit 1 ;;
esac
case "$NUM_CRITICS" in
  2|3) ;;
  *) echo "Error: --critics must be 2 or 3 (got: $NUM_CRITICS)"; exit 1 ;;
esac

# Validate --from phase name
VALID_PHASES="research creative-spec build-components visual-qa critique"
if [ -n "$FROM_PHASE" ]; then
  phase_valid=false
  for p in $VALID_PHASES; do
    [ "$p" = "$FROM_PHASE" ] && phase_valid=true
  done
  if [ "$phase_valid" = "false" ]; then
    echo "Error: --from=$FROM_PHASE is not a valid phase."
    echo "Valid phases: $VALID_PHASES"
    exit 1
  fi
fi

# --rebuild and --from are mutually exclusive
if [ "$REBUILD_MODE" = "true" ] && [ -n "$FROM_PHASE" ]; then
  echo "Error: --rebuild and --from cannot be used together. Use --from=build-components for the same effect."
  exit 1
fi

# Validate palette mode
case "$PALETTE" in
  grayscale|brand|free) ;;
  *) echo "Error: --palette must be grayscale, brand, or free (got: $PALETTE)"; exit 1 ;;
esac

# ─── Palette instructions (fed into creative vision + critique prompts) ──────

case "$PALETTE" in
  grayscale)
    PALETTE_INSTRUCTION="COLOR MODE: GRAYSCALE. Use ONLY black, white, and shades of gray. You may use ONE single accent color (e.g., red, orange, or blue) sparingly for emphasis — highlights, key data, or the aha moment. Everything else must be monochrome. This creates a stark, data-focused, cinematic look. Define EP_COLORS using grays (#111, #333, #666, #999, #ccc, #eee, etc.) plus your single accent."
    PALETTE_CRITIQUE="PALETTE MODE: grayscale. Verify the episode uses ONLY black/white/grays with at most ONE accent color for emphasis. Flag any use of multiple chromatic colors as MUST FIX."
    ;;
  brand)
    PALETTE_INSTRUCTION="COLOR MODE: BRAND PALETTE. Use colors from the BDP brand guidelines (references/brand-guidelines.md). Primary: BDP Orange #EB5234. Accents: Yellow #EB9B34, Green #0E9158, Blue #396BEB, Pink #F382AD, Purple #7762B9 (and their light variants). Neutrals: #F6F0E6, #EFE9DE, #E1DBD0, #201E1E. Pick 2-3 of these that fit the episode's mood. Background can be any brand neutral or dark text color. Do NOT invent colors outside this palette."
    PALETTE_CRITIQUE="PALETTE MODE: brand. Verify ALL colors come from the BDP brand palette (references/brand-guidelines.md). Flag any off-brand colors as SHOULD FIX."
    ;;
  free)
    PALETTE_INSTRUCTION="COLOR MODE: FREE. Choose whatever colors best serve the episode's mood and topic. No restrictions — go dark, neon, pastel, warm, cold, whatever fits. The only requirement is that you define your choices in EP_COLORS in constants.ts so they're intentional, not random."
    PALETTE_CRITIQUE="PALETTE MODE: free. No color restrictions. Just verify EP_COLORS is defined in constants.ts and the palette feels intentional and harmonious (not random)."
    ;;
esac

# ─── Paths ───────────────────────────────────────────────────────────────────

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
WORK_DIR="$PROJECT_DIR/.auto-episode/ep${EP_NUM}-${SLUG}"
EP_PATH="client/src/episodes/ep${EP_NUM}-${SLUG}"
AUDIO_PATH="client/public/audio/ep${EP_NUM}-${SLUG}"
LOG_FILE="$WORK_DIR/pipeline.log"

# Session files — separate tracks to avoid context bloat
CREATIVE_SPEC_SESSION="$WORK_DIR/session_creative_spec"  # combined creative spec
BUILD_SESSION="$WORK_DIR/session_build"          # build components + template
QA_SESSION="$WORK_DIR/session_qa"               # visual QA + structural fix
# Rebuild sessions are per-iteration: session_rebuild_iter1, session_rebuild_iter2, etc.

# Tool sets — planner physically CAN'T edit code, only think and write guidance
EXECUTOR_TOOLS="Read,Edit,Write,Glob,Grep,Bash,Agent,WebFetch,WebSearch"
PLANNER_TOOLS="Read,Write,Glob,Grep"
RESEARCH_TOOLS="Read,Write,Glob,Grep,Agent,WebFetch,WebSearch"

# ─── Per-Phase Model/Effort Config ─────────────────────────────────────────
# Tune these to balance cost vs quality. Use "" to keep defaults.
# Models: "sonnet" | "opus" | "" (inherit default)
# Effort: "low" | "medium" | "high" | "" (inherit default)
EFFORT_RESEARCH="low"
EFFORT_RESEARCH_MERGE="low"
EFFORT_CREATIVE_SPEC="high"
EFFORT_BUILD=""              # keep strongest for build (default)
EFFORT_VISUAL_QA="low"
EFFORT_CRITIQUE="medium"
EFFORT_CRITIQUE_MERGE="low"
EFFORT_FIX=""                # keep strongest for fix (default)
EFFORT_LESSONS="low"

MODEL_RESEARCH=""
MODEL_CREATIVE_SPEC=""
MODEL_BUILD=""
MODEL_CRITIQUE=""
MODEL_LESSONS=""

# ─── Role-Specific Context Instructions ────────────────────────────────────
# Prepended to prompts to tell agents which CLAUDE-*.md to read
CTX_RESEARCH="IMPORTANT: Read CLAUDE-research.md for your role-specific guidelines. You do NOT need CLAUDE-build.md or CLAUDE-critic.md."
CTX_BUILD="IMPORTANT: Read CLAUDE-build.md for animation toolkit and implementation patterns. This is your primary reference."
CTX_CRITIC="IMPORTANT: Read CLAUDE-critic.md for quality bar, sameness checklist, and episode registry. Focus on output quality, not implementation details."

mkdir -p "$WORK_DIR"

# ─── Cleanup ────────────────────────────────────────────────────────────────
# Stop the dev server on exit (normal or Ctrl+C)

cleanup() {
  if [ -n "$DEV_SERVER_PID" ] && kill -0 "$DEV_SERVER_PID" 2>/dev/null; then
    echo ""
    log "Stopping dev server (PID $DEV_SERVER_PID)..."
    kill "$DEV_SERVER_PID" 2>/dev/null
    wait "$DEV_SERVER_PID" 2>/dev/null
  fi
}
trap cleanup EXIT

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

# ─── Preview Server Helpers ─────────────────────────────────────────────────
# Start/stop the Vite dev server and open the episode in the browser.

DEV_SERVER_PID=""
DEV_PORT=5173

start_preview() {
  local ep_hash="${1:-ep${EP_NUM}}"

  # Check if dev server is already running
  if curl -s "http://localhost:${DEV_PORT}" >/dev/null 2>&1; then
    log "Dev server already running on port ${DEV_PORT}"
  else
    log "Starting dev server on port ${DEV_PORT}..."
    cd "$PROJECT_DIR" && npm run dev:client > "$WORK_DIR/dev-server.log" 2>&1 &
    DEV_SERVER_PID=$!

    # Wait for server to be ready (up to 30s)
    local waited=0
    while ! curl -s "http://localhost:${DEV_PORT}" >/dev/null 2>&1; do
      sleep 1
      waited=$((waited + 1))
      if [ "$waited" -ge 30 ]; then
        log "Dev server failed to start after 30s"
        return 1
      fi
    done
    log "Dev server ready"
  fi

  # Open browser
  local url="http://localhost:${DEV_PORT}/#${ep_hash}"
  log "Opening browser: $url"
  if command -v open >/dev/null 2>&1; then
    open "$url"
  elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$url"
  else
    log "Could not auto-open browser. Visit: $url"
  fi
}

# ─── Visual Checkpoint ─────────────────────────────────────────────────────
# Opens the episode in a browser, lets the user watch it, then asks y/n.
# If the user gives feedback, it's saved to a file for the next phase to read.
#
# Usage: checkpoint <label> <feedback_file> [hash]
# Returns: 0 = continue, 1 = user wants to redo (feedback saved to file)
#
# Skipped when --full-auto is set.

checkpoint() {
  local label="$1"
  local feedback_file="$WORK_DIR/$2"
  local hash="${3:-ep${EP_NUM}}"

  if [ "$FULL_AUTO" = "true" ]; then
    log "Checkpoint '$label' — skipped (--full-auto)"
    return 0
  fi

  start_preview "$hash"

  echo ""
  echo "╔══════════════════════════════════════════════════════════════════════╗"
  echo "║  CHECKPOINT: $label"
  echo "║                                                                    ║"
  echo "║  The episode is playing in your browser.                           ║"
  echo "║  Watch it, then come back here.                                    ║"
  echo "║                                                                    ║"
  echo "║  [y] Looks good — continue building                               ║"
  echo "║  [n] Not right — I'll type what to change                         ║"
  echo "║  [r] Redo this phase from scratch                                  ║"
  echo "╚══════════════════════════════════════════════════════════════════════╝"
  echo ""

  while true; do
    printf "  Your call [y/n/r]: "
    read -r choice
    case "$choice" in
      y|Y)
        log "Checkpoint '$label' — approved"
        return 0
        ;;
      n|N)
        echo ""
        echo "  What needs to change? (one line — this gets fed into the next phase):"
        printf "  > "
        read -r feedback
        echo "$feedback" > "$feedback_file"
        log "Checkpoint '$label' — feedback: $feedback"
        return 0
        ;;
      r|R)
        log "Checkpoint '$label' — redo requested"
        return 1
        ;;
      *)
        echo "  Please type y, n, or r"
        ;;
    esac
  done
}

# Run a claude -p phase. Saves output and session ID.
# Usage: run_phase <name> <prompt> [--new-session] [--session-file <path>] [--tools <list>] [--non-critical]
# By default, a failed phase kills the pipeline. Use --non-critical to allow continuation.
run_phase() {
  local phase_name="$1"
  local prompt="$2"
  shift 2

  local session_file="$BUILD_SESSION"
  local resume_flag=""
  local new_session=false
  local tools="$EXECUTOR_TOOLS"
  local critical=true
  local model_flag=""
  local effort_flag=""

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --new-session)     new_session=true; shift ;;
      --session-file)    session_file="$2"; shift 2 ;;
      --tools)           tools="$2"; shift 2 ;;
      --non-critical)    critical=false; shift ;;
      --model)           model_flag="$2"; shift 2 ;;
      --effort)          effort_flag="$2"; shift 2 ;;
      *) shift ;;
    esac
  done

  # Resume from saved session unless starting fresh
  if [ "$new_session" = "false" ] && [ -f "$session_file" ] && [ -s "$session_file" ]; then
    resume_flag="$(cat "$session_file")"
  fi

  local start_time=$(date +%s)
  local start_timestamp=$(date '+%H:%M:%S')
  log "▶ Phase $phase_name started at $start_timestamp"
  local raw_output="$WORK_DIR/${phase_name}_raw.json"

  local exit_code=0

  if [ "$VERBOSE" = "true" ]; then
    # ── Verbose mode: stream output in real-time ──────────────────────────
    # Use stream-json so we get real-time text AND can extract session/cost
    # from the final "result" message at the end.
    log "▶ Phase $phase_name starting (verbose)..."
    echo ""

    local stream_output="$WORK_DIR/${phase_name}_stream.jsonl"

    # Build extra flags for model/effort
    local extra_flags=""
    [ -n "$model_flag" ] && extra_flags="$extra_flags --model $model_flag"
    [ -n "$effort_flag" ] && extra_flags="$extra_flags --effort $effort_flag"

    if [ -n "$resume_flag" ]; then
      cd "$PROJECT_DIR" && claude -p "$prompt" \
        --resume "$resume_flag" \
        --allowedTools "$tools" $extra_flags \
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
        --allowedTools "$tools" $extra_flags \
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
      echo "$result_line" | jq -r '.result // empty' > "$WORK_DIR/${phase_name}_result.md" 2>/dev/null || true
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

    # Build extra flags for model/effort
    local extra_flags=""
    [ -n "$model_flag" ] && extra_flags="$extra_flags --model $model_flag"
    [ -n "$effort_flag" ] && extra_flags="$extra_flags --effort $effort_flag"

    # Run claude -p
    if [ -n "$resume_flag" ]; then
      cd "$PROJECT_DIR" && claude -p "$prompt" \
        --resume "$resume_flag" \
        --allowedTools "$tools" $extra_flags \
        --output-format json > "$raw_output" 2>&1 || exit_code=$?
    else
      cd "$PROJECT_DIR" && claude -p "$prompt" \
        --allowedTools "$tools" $extra_flags \
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
      log "✗ Phase $phase_name FAILED (exit code $exit_code, ${mins}m ${secs}s)"
      log "  Error details: $raw_output"
      echo "${mins}m ${secs}s" > "$WORK_DIR/.duration_${phase_name}"
      if [ "$critical" = "true" ]; then
        log "FATAL: Critical phase $phase_name failed — stopping pipeline."
        exit 1
      fi
      return 1
    fi

    # Extract session ID and cost from the JSON output
    jq -r '.session_id // empty' "$raw_output" > "$session_file" 2>/dev/null || true
    jq -r '.result // empty' "$raw_output" > "$WORK_DIR/${phase_name}_result.md" 2>/dev/null || true
    local cost=$(jq -r '.total_cost_usd // 0' "$raw_output" 2>/dev/null || echo "?")

    # Clean up raw JSON (can be huge)
    rm -f "$raw_output"
  fi

  local end_time=$(date +%s)
  local duration=$(( end_time - start_time ))
  local mins=$(( duration / 60 ))
  local secs=$(( duration % 60 ))

  if [ $exit_code -ne 0 ]; then
    log "✗ Phase $phase_name FAILED (exit code $exit_code, ${mins}m ${secs}s)"
    echo "${mins}m ${secs}s" > "$WORK_DIR/.duration_${phase_name}"
    if [ "$critical" = "true" ]; then
      log "FATAL: Critical phase $phase_name failed — stopping pipeline."
      exit 1
    fi
    return 1
  fi

  log "✓ Phase $phase_name complete (${mins}m ${secs}s, \$${cost})"

  # Save duration for summary
  echo "${mins}m ${secs}s" > "$WORK_DIR/.duration_${phase_name}"

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
# On success: creates .done_<name> and .cost_<name>
# On failure: creates .failed_<name> (NO .done_ marker)
bg_claude() {
  local name="$1" prompt="$2" tools="${3:-$EXECUTOR_TOOLS}" effort="${4:-}" model="${5:-}"
  local raw="$WORK_DIR/${name}_raw.json"
  log "▶ Phase $name started at $(date '+%H:%M:%S') (background)"
  local bg_start=$(date +%s)
  local extra_flags=""
  [ -n "$model" ] && extra_flags="$extra_flags --model $model"
  [ -n "$effort" ] && extra_flags="$extra_flags --effort $effort"
  (
    cd "$PROJECT_DIR" || exit 1
    local bg_exit=0
    if claude -p "$prompt" --allowedTools "$tools" $extra_flags --output-format json > "$raw" 2>&1; then
      jq -r '.result // empty' "$raw" > "$WORK_DIR/${name}.md" 2>/dev/null
      local cost
      cost=$(jq -r '.total_cost_usd // 0' "$raw" 2>/dev/null || echo "?")
      echo "$cost" > "$WORK_DIR/.cost_${name}"
    else
      bg_exit=$?
    fi
    rm -f "$raw"
    local bg_end=$(date +%s)
    local bg_dur=$(( bg_end - bg_start ))
    local bg_mins=$(( bg_dur / 60 ))
    local bg_secs=$(( bg_dur % 60 ))
    echo "${bg_mins}m ${bg_secs}s" > "$WORK_DIR/.duration_${name}"
    if [ "$bg_exit" -eq 0 ]; then
      touch "$WORK_DIR/.done_${name}"
    else
      touch "$WORK_DIR/.failed_${name}"
      exit 1
    fi
  ) &
}

# Wait for background phases with a spinner
# Usage: wait_group <label> <pid1> [pid2] [pid3] ...
# Returns: number of failed background jobs (0 = all succeeded)
wait_group() {
  local label="$1"
  shift
  local pids=("$@")
  local start_time
  start_time=$(date +%s)
  local failures=0

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
    if ! wait "$pid" 2>/dev/null; then
      failures=$((failures + 1))
    fi
  done

  kill $spinner_pid 2>/dev/null
  wait $spinner_pid 2>/dev/null
  printf "\r                                                        \r"

  local end_time
  end_time=$(date +%s)
  local duration=$(( end_time - start_time ))
  local mins=$(( duration / 60 ))
  local secs=$(( duration % 60 ))

  if [ "$failures" -gt 0 ]; then
    log "⚠ $label finished with $failures/$((${#pids[@]})) agent(s) FAILED (${mins}m ${secs}s)"
  else
    log "✓ $label complete (${mins}m ${secs}s, ${#pids[@]} parallel agents)"
  fi
  return "$failures"
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
echo "║       AUTO-EPISODE PIPELINE v3 (Streamlined)                       ║"
echo "║                                                                    ║"
echo "║   Topic:     $TOPIC"
echo "║   Episode:   $EP_NUM ($SLUG)"
echo "║   Mode:      $(if [ "$REBUILD_MODE" = "true" ]; then echo "REBUILD (build only)"; elif [ "$DRAFT_MODE" = "true" ]; then echo "DRAFT (stop after build)"; elif [ -n "$FROM_PHASE" ]; then echo "FROM $FROM_PHASE"; else echo "full pipeline"; fi)"
echo "║   Voice:     $WITH_VOICE"
echo "║   Palette:   $PALETTE"
echo "║   Critique:  $MAX_CRITIQUE iteration(s), $NUM_CRITICS critics"
echo "║   Verbose:   $VERBOSE"
echo "║   Output:    $EP_PATH/"
echo "║                                                                    ║"
echo "║   Presets:                                                         ║"
echo "║     --fast     1 critique iteration, 2 critics, skip lessons        ║"
echo "║     --thorough 3 critique iterations, 3 critics                    ║"
echo "║     (default)  1 critique iteration, 3 critics, async lessons      ║"
echo "║                                                                    ║"
echo "╚══════════════════════════════════════════════════════════════════════╝"
echo ""

PIPELINE_START=$(date +%s)
log "Pipeline started at $(date)"
log "Topic: $TOPIC | Episode: $EP_NUM | Slug: $SLUG | Voice: $WITH_VOICE | Palette: $PALETTE | Critique: ${MAX_CRITIQUE}x${NUM_CRITICS}"

# ─── --rebuild mode: verify artifacts exist, mark planning phases done ────
if [ "$REBUILD_MODE" = "true" ]; then
  log "REBUILD MODE — skipping planning, re-running build only"

  # Check that essential artifacts exist
  MISSING_ARTIFACTS=""
  for artifact in creative-spec.md; do
    if [ ! -f "$WORK_DIR/$artifact" ]; then
      MISSING_ARTIFACTS="${MISSING_ARTIFACTS} $artifact"
    fi
  done

  if [ -n "$MISSING_ARTIFACTS" ]; then
    log "FATAL: --rebuild requires existing artifacts, but these are missing:${MISSING_ARTIFACTS}"
    log "Run the full pipeline first, then use --rebuild to re-run the build."
    exit 1
  fi

  # Mark all planning phases as done so they're skipped
  for phase in research-technical research-visual research-angle research research-merge \
               creative-spec; do
    touch "$WORK_DIR/.done_${phase}"
  done

  # Delete the build marker so it re-runs
  rm -f "$WORK_DIR/.done_build-components"

  log "Planning artifacts found — jumping to build phase"
fi

# ─── --from=<phase> mode: delete markers from that phase onward ───────────
if [ -n "$FROM_PHASE" ]; then
  log "FROM MODE — re-running from phase: $FROM_PHASE"

  # Ordered list of all phases
  ALL_PHASES="research-technical research-visual research-angle research research-merge \
    creative-spec \
    build-components visual-qa structural-fix \
    critique-visual-iter1 critique-tech-iter1 critique-audience-iter1 \
    critique-merge-iter1 fix-plan-iter1 rebuild-iter1 \
    critique-visual-iter2 critique-tech-iter2 critique-audience-iter2 \
    critique-merge-iter2 fix-plan-iter2 rebuild-iter2 \
    critique-visual-iter3 critique-tech-iter3 critique-audience-iter3 \
    critique-merge-iter3 fix-plan-iter3 rebuild-iter3 \
    voiceover lessons"

  # Map --from value to the first phase to delete
  case "$FROM_PHASE" in
    research)          delete_from="research-technical" ;;
    creative-spec)     delete_from="creative-spec" ;;
    build-components)  delete_from="build-components" ;;
    visual-qa)         delete_from="visual-qa" ;;
    critique)          delete_from="critique-visual-iter1" ;;
    *) delete_from="$FROM_PHASE" ;;
  esac

  # Delete .done_ markers from the target phase onward
  found=false
  deleted=0
  for phase in $ALL_PHASES; do
    if [ "$phase" = "$delete_from" ]; then
      found=true
    fi
    if [ "$found" = "true" ] && [ -f "$WORK_DIR/.done_${phase}" ]; then
      rm -f "$WORK_DIR/.done_${phase}"
      deleted=$((deleted + 1))
    fi
  done

  log "Cleared $deleted phase markers from '$FROM_PHASE' onward"
fi

# ═════════════════════════════════════════════════════════════════════════════
# PHASE 1: DEEP RESEARCH  [3 Parallel Agents → Merge]
# ═════════════════════════════════════════════════════════════════════════════

divider "PARALLEL" "DEEP RESEARCH (3 agents)"

if phase_done "research"; then
  log "⏭ research already done — skipping"
else

# ── Agent A: Technical Details ────────────────────────────────────────────
PROMPT_TECH=$(cat <<PROMPT_END
${CTX_RESEARCH}

You are researching the TECHNICAL DETAILS of a Bitcoin/cryptography topic for an animated explainer video. Your job is deep technical accuracy.

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
${CTX_RESEARCH}

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
${CTX_RESEARCH}

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
  bg_claude "research-technical" "$PROMPT_TECH" "$RESEARCH_TOOLS" "$EFFORT_RESEARCH" "$MODEL_RESEARCH"
  PID_TECH=$!
else PID_TECH=""; fi

if ! phase_done "research-visual"; then
  bg_claude "research-visual" "$PROMPT_VISUAL" "$RESEARCH_TOOLS" "$EFFORT_RESEARCH" "$MODEL_RESEARCH"
  PID_VISUAL=$!
else PID_VISUAL=""; fi

if ! phase_done "research-angle"; then
  bg_claude "research-angle" "$PROMPT_ANGLE" "$RESEARCH_TOOLS" "$EFFORT_RESEARCH" "$MODEL_RESEARCH"
  PID_ANGLE=$!
else PID_ANGLE=""; fi

# Wait for all with spinner
RESEARCH_PIDS=()
[ -n "$PID_TECH" ] && RESEARCH_PIDS+=("$PID_TECH")
[ -n "$PID_VISUAL" ] && RESEARCH_PIDS+=("$PID_VISUAL")
[ -n "$PID_ANGLE" ] && RESEARCH_PIDS+=("$PID_ANGLE")

if [ ${#RESEARCH_PIDS[@]} -gt 0 ]; then
  if ! wait_group "Parallel research (${#RESEARCH_PIDS[@]} agents)" "${RESEARCH_PIDS[@]}"; then
    log "FATAL: One or more research agents failed — cannot continue."
    # Show which ones failed
    for name in research-technical research-visual research-angle; do
      [ -f "$WORK_DIR/.failed_${name}" ] && log "  ✗ $name failed"
    done
    exit 1
  fi
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
)" --new-session --session-file "$WORK_DIR/session_research_merge" --tools "$PLANNER_TOOLS" --effort "$EFFORT_RESEARCH_MERGE" --model "$MODEL_RESEARCH"

# Mark overall research as done
touch "$WORK_DIR/.done_research"
fi


# ═════════════════════════════════════════════════════════════════════════════
# PHASE 2: CREATIVE SPEC  [Planner — direction + visual design + storyboard + motion script]
# ═════════════════════════════════════════════════════════════════════════════
# Collapsed from old Phases 2-5 (director-research, creative-vision, storyboard,
# director-storyboard + motion-script). One agent, one pass, one coherent document.
# Uses "stop and think" checkpoints to preserve deliberation quality.

divider "PLANNER" "CREATIVE SPEC"

if phase_done "creative-spec"; then
  log "⏭ creative-spec already done — skipping"
else
run_phase "creative-spec" "$(cat <<PROMPT_END
You are a CREATIVE DIRECTOR and VISUAL ARCHITECT for an animated Bitcoin explainer series.
You don't build code — you THINK, DESIGN, and SPEC. You cannot edit code.
Your job is to produce a complete creative specification that a developer can build from.

Episode ${EP_NUM}: ${TOPIC}

═══════════════════════════════════════════════
STEP 1: READ ALL INPUTS
═══════════════════════════════════════════════

Read these files before proceeding:
- Research: .auto-episode/ep${EP_NUM}-${SLUG}/research.md
- CLAUDE.md — especially the Episode Registry at the bottom
- CLAUDE-build.md — especially Animation Toolkit and "Making Episodes That Don't Look Alike"
- DO NOT read old episode VideoTemplate.tsx files. They use outdated patterns.

═══════════════════════════════════════════════
STEP 2: CREATIVE DIRECTION — decide the narrative foundation
═══════════════════════════════════════════════

Before designing anything visual, DECIDE:

LEARNING PATH (mandatory — write this FIRST):
a) PREREQUISITES — what does the viewer already know? (e.g., "knows what a hash is, knows blocks contain transactions"). Be specific. This is your starting line.
b) WRONG MENTAL MODEL — what do most viewers incorrectly assume about this topic? What's the common misconception you need to displace?
c) LEARNING STEPS — the path from what they know to what they'll learn, as 3-5 concrete steps. Each step builds on the previous. Example: "1. You know blocks have transactions → 2. But how do you prove YOUR transaction is in a block? → 3. You'd need to download the whole block → 4. Merkle trees let you prove it with just a small path → 5. Here's how that path is computed."
d) NO JARGON BEFORE GROUNDING — list any technical terms this episode uses. For each, note the scene where it's first visually grounded. A term like "Merkle proof" or "nonce" CANNOT appear in explanatory scenes until the viewer has first seen the familiar thing it relates to. (Title/topic cards are exempt — they can name the concept.)
e) MOTIVATION BEFORE MECHANISM — for every learning step that introduces a tool, technique, or formula, the PREVIOUS step must establish the problem it solves. The viewer must understand WHY before seeing HOW. Test each step: "would a newcomer who just watched the previous scenes know why we're doing this?" If not, insert a motivation step before it. Example failure: jumping to "compute 7^n mod 15" without first explaining that factoring large numbers is what protects Bitcoin keys. Example fix: "multiplying is easy, un-multiplying is hard → Bitcoin's security relies on this gap → Shor found a shortcut: look for repeating patterns → HERE's the pattern [now show the math]."

CREATIVE DECISIONS:
1. What's the BEST teaching approach for this topic? (analogy-first, problem>failure>fix, definition>deep-dive, specific>general, wrong>less-wrong>right, dialogue-driven)
2. What's the surprising angle — the one thing that makes a viewer say "wait, really?!"
3. What should the emotional arc be? Where does the aha moment land?
4. What's the ONE key takeaway viewers should remember?
5. What NOT to include — what's interesting but would distract from the core story?
6. What real-world values/examples should we use? (actual hashes, addresses, tx data)
7. Per the Episode Registry — what must THIS episode do differently? What animation library should drive the core visual? (GSAP? SVG morph? Canvas 2D?)
8. Should this episode use CHARACTERS (Alice & Bob stick figures)? Characters work best for dialogue-driven teaching — Alice explains, Bob asks questions. They add personality and make abstract topics feel like a conversation. Not every episode needs them. Decide YES or NO and explain why.

DIDACTIC SPINE — for each narrative act, name the dominant teaching role:
  Allowed roles: connect | covary | visualize_structure | visualize_process | symbol_sense | ground_in_reality | generalize
  Example: "Act 1: ground_in_reality → Act 2: visualize_process → Act 3: covary → Act 4: generalize"
  This spine shapes the visual strategy for the whole episode.

Be opinionated. Be decisive. Don't hedge.

Write your answers into Part 1 of the output document (format below).

═══════════════════════════════════════════════
STEP 3: VISUAL DESIGN — design the visual concept
═══════════════════════════════════════════════

Now, serving your narrative decisions from Step 2, design the visual concept.

RULES:
- Do NOT repeat any visual approach from the Episode Registry in CLAUDE.md
- Do NOT default to DiagramBox, FlowRow, or other shared library components for the core visual
- The core visual MUST NOT use CE (CanvasElement). Use GSAP timeline, SVG path morphing, CSS @keyframes, Canvas 2D, or morph()
- Use VIEWPORT-FIRST layout — all content fits within 1920x1080 (100vw x 100vh). No oversized canvases, no camera zoom/pan. Animate within the visible frame. Use morph() for persistent visuals that transform between scenes within the viewport.
- Define episode-specific EP_COLORS and EP_SPRINGS in constants.ts
- ${PALETTE_INSTRUCTION}

TECHNIQUE SELECTION — pick the RIGHT tool for the concept:
- **Canvas 2D** — best when the concept has a PHYSICAL or MATHEMATICAL model underneath: particles, heatmaps, fluid/flow, data grids, collision physics, procedural generation. Canvas gives you a render loop (requestAnimationFrame) where you control every pixel every frame. This produces our highest-quality visuals (see EP8 sponge tank, EP9 heatmap). Use Canvas 2D when the visual needs continuous simulation, not just state transitions.
- **GSAP timeline** — best for choreographed multi-element sequences with precise timing: step-by-step processes, cascading reveals, coordinated multi-part animations where element A finishes > element B starts. GSAP excels at orchestration.
- **SVG path morphing** — best for shape transformations: one shape becoming another, line-drawing reveals, organic/curved visuals, circuit diagrams, tree growth.
- **CSS @keyframes** — best for ambient loops that run independently: pulsing glows, rotating elements, gradient shifts, floating particles. Layer these WITH other techniques for depth.
- **Framer Motion morph()** — best for declarative state transitions: element moves from position A to B across scenes. Good for layout changes, not for continuous simulation.
- **Combine techniques.** The best episodes layer multiple: Canvas 2D core + CSS ambient loops + GSAP for supporting element choreography.

THE QUALITY BAR — what makes a signature visual memorable:
1. It has an UNDERLYING MODEL — not just styled divs that animate. A particle simulation, a mathematical curve, a grid with computed values, a physics engine. The model drives the visual, not hardcoded keyframes.
2. It has CONTINUOUS LIFE — something is always moving, even between scene transitions. Brownian motion, ambient shimmer, pulsing glow. The scene feels alive, not frozen between state changes.
3. It has MULTIPLE MODES/STATES — the same visual behaves differently across scenes. A sponge tank that absorbs, permutes, squeezes, bounces attacks. A heatmap that fills linearly, then quadratically, then gets capped. Mode changes create drama.
4. It has LAYERED EFFECTS — not one flat animation but depth: glow underneath + core element + highlight on top. Gradients, shadows, bloom, caustics.
5. VISUAL LEADS, TEXT CLARIFIES — the animated visual demonstrates the mechanism; on-screen text labels/captions clarify what the viewer is seeing. The visual does the heavy lifting. If you removed the animation and kept only the text, the scene should feel broken. If a scene is mostly text panels with entrance animations, the visual isn't leading — it's a slide deck.
Reference: EP8 SpongeCanvas (497 lines, Canvas 2D particle physics, 5 modes) and EP9 HeatmapCanvas (321 lines, Canvas 2D grid, 3 fill modes with heat color ramp) set the quality bar.

Design:
a) THE SIGNATURE VISUAL — the ONE custom animation that makes this episode instantly recognizable. Describe: what rendering technique? What's the underlying model? What modes/states does it have across scenes? What makes it feel alive between transitions? How do visuals + on-screen text together make the concept understandable on mute?
b) COLOR PALETTE — define EP_COLORS following the color mode above
c) LAYOUT PATTERN — NOT centered-stack-with-heading — what serves THIS content?
d) ANIMATION PERSONALITY — spring configs, timing, motion style that matches the topic
e) CUSTOM COMPONENTS NEEDED — what must be built from scratch for this episode. Each act should have its own visual centerpiece. For EACH act, specify the ACT VISUAL GRAMMAR:
   - CENTERPIECE: the component name and what it renders (Canvas 2D, SVG, GSAP timeline — NOT just styled divs)
   - MOTION VERB: the primary transformation (morphs, cascades, propagates, shatters, grows — NOT "fades in")
   - RENDERING MODE: Canvas 2D / SVG path / GSAP choreography / CSS @keyframes — must be more than Framer Motion entrance
   - TRANSFORMS ACROSS SCENES: how the centerpiece changes state between scenes in this act (NOT just mount/unmount)
   A component that is styled divs with GSAP entrance stagger is a data display, not a centerpiece. Each act's centerpiece must have an underlying model, internal choreography beyond entrance, and multiple states.
f) CHARACTER PLAN — if YES to characters: How are Alice & Bob used? Which scenes have dialogue? What's their positioning? What emotions/gestures drive the key moments? If NO characters: skip this.

Also brainstorm 2 alternative concepts (brief, 1 paragraph each) in case the main concept fails in implementation.

Rate your chosen concept:
- Originality vs. past episodes (1-10)
- How naturally it fits the topic (1-10)
- Visual wow factor (1-10)
- Feasibility in React + Framer Motion (1-10)
- Underlying model depth (1-10)
- Teaches without voiceover (1-10)

Write into Part 2 of the output document.

═══════════════════════════════════════════════
STEP 4: SELF-REVIEW — check your own direction before storyboarding
═══════════════════════════════════════════════

STOP. Before storyboarding, critically review what you decided in Steps 2-3:
- Does the visual concept SERVE the teaching approach, or did it drift into decoration?
- Is the signature visual original vs. every episode in the Registry?
- Will this work at 1920x1080 with morph() and GSAP?
- Did you choose characters for the right reason, or out of habit?
- Does the VISUAL lead in each act? If you stripped the text and kept only the animation, would a viewer still roughly follow? Or is this a slide deck with a Canvas component in one corner?
- Does EVERY act have a real visual centerpiece (Canvas/SVG/GSAP choreography), or are some acts just text panels with entrance animations?
- Could any act's centerpiece be replaced by a static infographic? If yes, the visual isn't doing work — redesign it.

If anything is misaligned, REVISE Steps 2-3 BEFORE proceeding.
Note any revisions in a "Self-Review" subsection of Part 2.

═══════════════════════════════════════════════
STEP 5: SCENE-BY-SCENE STORYBOARD
═══════════════════════════════════════════════

Turn your creative vision into a concrete scene-by-scene storyboard.

Follow CLAUDE.md rules strictly:
- ONE idea per scene
- ONE sentence per scene heading (max ~15 words)
- Visual + on-screen text TOGETHER are the teaching channel. Neither alone carries everything. The diagram makes the mechanism click; the text explains what the viewer is seeing. A muted viewer should understand the concept from visuals + text combined.
- Progressive reveal in every scene — staggered delays, never dump everything
- Scene 1 = title, Scene 2 = start from the PREREQUISITES you defined (what the viewer already knows)
- Last scene = CTA
- Explanatory sequences and mechanisms must be grounded with concrete labels and real values where relevant. Don't overload simple bridge scenes, but never leave a mechanism purely abstract.
- NO JARGON BEFORE GROUNDING: a technical term cannot appear in explanatory scenes until the viewer has first seen the familiar thing it relates to. Title/topic cards are exempt.
- MOTIVATION BEFORE MECHANISM: before any scene showing HOW something works (a formula, algorithm step, technique, or mathematical operation), there MUST be a preceding scene that establishes WHY — the problem it solves or the question it answers. A first-time viewer watching "7^1 mod 15 = 7" must already understand why modular exponentiation matters. If a scene shows a mechanism without prior motivation, that's a structural failure — split it: motivation scene first, then mechanism scene. The question "why are we doing this?" should never cross the viewer's mind.

For EACH scene, write:
1. SCENE NUMBER and NAME
2. DURATION (simple: 6-7s, diagram: 8-10s, complex: 10-12s)
3. ON-SCREEN CAPTION (short heading — max ~15 words, orients the viewer)
4. TEXT INSIDE VISUAL (labels, values, formulas, field names INSIDE the diagram — no word limit. These explain what the viewer is seeing. Think 3Blue1Brown: equations next to geometry, labels pointing at things, real values inside blocks. The text must make the visual self-explanatory.)
5. TEACHING ANCHORS — the exact on-screen text (labels, values, captions) that a MUTED viewer needs to understand what they're looking at and what changed. Visual leads, text clarifies. Every explanatory scene MUST have at least one. Title cards and mood beats are exempt.
   TEXT ZONES — assign each text element to a non-overlapping zone: TOP (0-12vh), MAIN-LABEL (inside visual parent), BOTTOM (85-100vh), LEFT/RIGHT MARGIN. No two text elements may share the same zone unless they're inside the same visual component. This prevents text-on-text overlap.
6. ON SCREEN — list EVERY visual element visible in this scene. Max 2-3 visual systems (one dominant + supporting text/labels). A small persistent element like a timeline bar counts toward this budget. If you need more than 3, split into multiple scenes. Mark which element is the **FOCAL OBJECT** — the one thing the eye tracks.
7. CLEARED — list what was removed or hidden since the previous scene. When starting a new narrative act, clear the previous act's visuals entirely. Write "none" if nothing was removed.
8. VISUAL DESCRIPTION (what the viewer sees — the diagram/animation that makes the concept click visually). Name the primary **ANIMATION TECHNIQUE** from this vocabulary: copy-move, morph, trace, rule-based-move, scale-vary, rearrange, decompose, highlight-morph, sweep, linked-vary.
9. ANIMATION DETAILS (what enters, exits, morphs, specific delays). State the **DIDACTIC ROLE** (one of: connect, covary, visualize_structure, visualize_process, symbol_sense, ground_in_reality, generalize) and a one-line **WHY DYNAMIC** — what motion teaches that a still image would not.
10. CHARACTERS (if this scene uses Alice/Bob — otherwise omit):
   alice: emotion=<emotion>, gesture=<gesture>, lookAt=<dir>, says="<speech>"
   bob: emotion=<emotion>, gesture=<gesture>, lookAt=<dir>, says="<speech>"
   Available emotions: neutral, happy, excited, curious, confused, thinking, surprised, worried, annoyed, explaining, laughing
   Available gestures: none, wave, point, shrug, present
   Available lookAt: center, left, right, up, down
11. LEARNING STEP — what does the viewer know at this point? What ONE new thing does this scene add? How does it connect to the next? (Not just "teaches X" — state the progression: "viewer now understands A, this scene shows how A leads to B")
12. REPRESENTATION BRIDGE (optional — required when the didactic role is connect or covary). Name the two forms being linked, e.g. "raw bytes → TXID", "nonce → hash output", "block height → uniqueness rule".

Mark the HIGHLIGHT SCENE (aha moment) with [HIGHLIGHT].
Mark scenes using the SIGNATURE VISUAL with [SIGNATURE].

Use AS MANY SCENES as the topic needs. 15-25 scenes is typical.

SCENE COMPOSITION RULES:
- **Element budget:** max 2-3 visual systems per scene. ONE dominant visual + supporting text. If a scene feels crowded, it's trying to do too much — split it.
- **Act transitions:** when moving to a new narrative act (new concept, new visual), clear the previous act's elements. Don't accumulate visuals across the whole episode.
- **Persistent elements:** morph() should only span the scenes where the element is actively relevant. A UTXO grid relevant in scenes 3-7 should unmount before scene 8 introduces a new visual. Exception: a small persistent element (e.g., timeline bar) can span the whole episode if compact.

VIEWPORT-FIRST SCENE COMPOSITION:
After the scene list, include a "Scene Layout" section:
1. All content fits within 1920x1080 viewport. No oversized canvases.
2. For EACH scene, describe the VIEWPORT COMPOSITION — what is visible and where.
3. Use LAYOUT VARIETY across scenes — split-screen, full-bleed, asymmetric, centered.
4. Persistent visuals via morph() should be scoped to their relevant act, not the whole episode.
5. Use sceneRange() or CE enter/exit to swap content between acts.
6. Every element must be VISIBLE on screen. No off-screen content.

Write into Part 3 of the output document.

═══════════════════════════════════════════════
STEP 6: STORYBOARD SELF-REVIEW
═══════════════════════════════════════════════

STOP. Review your storyboard as a strict creative director:

PEDAGOGY CHECK (most important):
1. Does scene 2 clearly start from the PREREQUISITES — something the viewer already knows?
2. Walk through as a BEGINNER: read only the captions + text-inside-visual for each scene. Can you follow the concept without imagining narration? Where would you get lost?
3. Does each explanatory scene teach exactly ONE new step that builds on the previous?
4. Does any scene use jargon that hasn't been visually grounded yet? (Title cards exempt)
5. Could a muted viewer understand the mechanism from visuals + on-screen text together?
6. MOTIVATION TEST: For each scene that shows a mechanism, formula, or algorithm step — is there a PRECEDING scene that explains WHY? Walk through as a complete newcomer: at every scene, can you answer "why are we doing this?" If not, a motivation scene is missing before it. This is the #1 cause of "this doesn't explain anything" feedback. A mechanism without motivation is just math on screen.

QUALITY CHECK:
7. Does it follow your direction from Step 2? Or did it drift?
7. Is the aha moment clearly placed and properly set up by preceding scenes?
8. Is text short enough? (Check EVERY scene — max ~15 words per heading)
9. Does every scene have an animated visual, or are some text-only slides?
10. Progressive reveal or info dump?
11. Pacing: too fast? Too slow? Scenes to cut or merge?
12. Is the signature visual original?
13. Real values used where relevant?
14. If characters: distinct roles? Varied emotions? Short speech bubbles (max ~12 words)?

DYNAMIC NECESSITY CHECK:
15. Is every scene's motion teaching a real relationship, or just decorating a static idea? Flag any scene where removing the animation would change nothing about comprehension.
16. Does any scene introduce a fake intermediate state — a mid-animation frame that looks meaningful but represents nothing in the protocol? (Hash functions don't have a "halfway hashed" state.)
17. Could any scene become clearer by replacing simultaneous examples with one evolving example (generalization through sweep)?

Write a brief verdict. If the pedagogy check fails on ANY point, GO BACK AND REVISE Part 3 before proceeding. Pedagogy failures are not cosmetic — they mean the episode doesn't teach.

Write into Part 4 of the output document.

═══════════════════════════════════════════════
STEP 7: TIMESTAMPED MOTION SCRIPT
═══════════════════════════════════════════════

Write a precise timestamped motion script — the build spec between storyboard and code.

FORMAT — for each scene:
\`\`\`
SCENE <N>: <name> (duration: <X>s)
---
0.0s  TRANSITION: [how we enter — wipe, cut, morph, layout change]
0.0s  [element] — [action] (e.g., "Title text — blurIn from center, scale 0.8>1.0")
0.4s  [element] — [action with timing] (e.g., "Subtitle — slideRight, 0.3s duration")
1.2s  [element] — [action] (e.g., "Block diagram — GSAP stagger, children cascade left>right 0.1s apart")
3.0s  [element] — [state change] (e.g., "Block #3 — highlight red, pulse glow")
5.5s  HOLD — viewer absorbs (1.5s breathing room)
7.0s  EXIT: [how elements leave or transform into next scene]
\`\`\`

RULES:
1. Every element gets a timestamp. No "then" or "after that" — use exact times.
2. Specify the animation TECHNIQUE for each move: morph(), GSAP tl.from/tl.to, CE enter/exit, CSS @keyframes, spring config.
3. Layout/composition changes get their own timestamps.
4. Mark the HIGHLIGHT SCENE's dramatic moment with a star.
5. Include hold/breathing time at the end of each scene (1-2s minimum).
6. Note which elements PERSIST across scenes (use morph) vs which enter/exit (use CE/GSAP).
7. For CHARACTER scenes: timestamp each character state change (emotion, gesture, lookAt, says).
8. Teaching anchors get timestamps too. Labels, values, captions must have explicit entry times.

ALSO INCLUDE at the end:
- ## Persistent Elements
- ## Animation Library Assignments
- ## Scene Layouts (per-scene viewport compositions)
- ## Character Choreography (if applicable)

Write into Part 5 of the output document.

═══════════════════════════════════════════════
STEP 8: BUILD PRIORITIES SUMMARY
═══════════════════════════════════════════════

Write a concise build handoff summary:
## Didactic Spine (one line per act: dominant teaching role + primary technique)
## Visual Lifetimes (which persistent components must unmount at each act break)
## Build Priorities (what to build FIRST — signature visual, then what?)
## Non-Negotiables (things the builder must not deviate from)
## Risk Areas (what's hardest to get right)
## Scenes to Strengthen (if any from your review)

This summary gets inlined directly into the build prompt, so keep it focused and actionable.

═══════════════════════════════════════════════
OUTPUT: Save TWO files
═══════════════════════════════════════════════

FILE 1: .auto-episode/ep${EP_NUM}-${SLUG}/creative-spec.md
Full document with all parts:
- Part 1: Creative Direction (LEARNING PATH: prerequisites, wrong mental model, learning steps, jargon grounding map; CREATIVE DECISIONS: teaching approach, hook, story arc, aha moment, what to skip, visual differentiation, characters, key real values, risks)
- Part 2: Visual Design (signature visual, EP_COLORS, EP_SPRINGS, layout, animation personality, custom components, character plan, self-review)
- Part 3: Storyboard (scene-by-scene with all 12 fields per scene including ON SCREEN with focal object, VISUAL DESCRIPTION with technique, ANIMATION DETAILS with didactic role, REPRESENTATION BRIDGE, CLEARED, LEARNING STEP, scene layouts)
- Part 4: Storyboard Review (pedagogy check + quality check, verdict)
- Part 5: Motion Script (timestamped per-scene, persistent elements, animation assignments, scene layouts, character choreography)

FILE 2: .auto-episode/ep${EP_NUM}-${SLUG}/creative-spec-summary.md
Build priorities summary from Step 8: Didactic Spine, Visual Lifetimes, Build Priorities, Non-Negotiables, Risk Areas, Scenes to Strengthen. Short and actionable.

Be PRECISE. Both documents are the developer's build spec — vague guidance = vague episode.
PROMPT_END
)" --new-session --session-file "$CREATIVE_SPEC_SESSION" --tools "$PLANNER_TOOLS" --effort "$EFFORT_CREATIVE_SPEC" --model "$MODEL_CREATIVE_SPEC"
fi

# ── Verify creative-spec artifacts exist before building ────────────────────
if [ ! -f "$WORK_DIR/creative-spec.md" ]; then
  log "FATAL: creative-spec.md not found — the creative spec phase did not save its output."
  log "Re-run with --from=creative-spec"
  exit 1
fi
if [ ! -f "$WORK_DIR/creative-spec-summary.md" ]; then
  log "⚠ creative-spec-summary.md not found — build will proceed without summary handoff."
  log "  The build agent will read the full creative-spec.md instead."
fi

# ═════════════════════════════════════════════════════════════════════════════
# PHASE 3: BUILD CUSTOM COMPONENTS  [Executor — reads all handoffs]
# ═════════════════════════════════════════════════════════════════════════════

divider "EXECUTOR" "BUILD CUSTOM COMPONENTS"

if phase_done "build-components"; then
  log "⏭ build-components already done — skipping"
else

# Inline the creative spec summary + build memory (curated lessons)
CREATIVE_SPEC_SUMMARY=$(read_artifact "creative-spec-summary.md")
BUILD_MEMORY=""
if [ -f "$PROJECT_DIR/.auto-episode/build-memory.md" ]; then
  BUILD_MEMORY=$(cat "$PROJECT_DIR/.auto-episode/build-memory.md")
fi

run_phase "build-components" "$(cat <<PROMPT_END
${CTX_BUILD}

Now build the custom visual components for episode ${EP_NUM}: ${TOPIC}.

HANDOFF FROM CREATIVE SPEC — build priorities and key decisions:
---BEGIN BUILD GUIDANCE---
${CREATIVE_SPEC_SUMMARY}
---END BUILD GUIDANCE---

${BUILD_MEMORY:+---BUILD MEMORY (curated lessons from past episodes)---
${BUILD_MEMORY}
---END BUILD MEMORY---
}
Read these artifacts for full context:
- Creative spec (FULL document — storyboard, motion script, visual design, everything): .auto-episode/ep${EP_NUM}-${SLUG}/creative-spec.md
- Research: .auto-episode/ep${EP_NUM}-${SLUG}/research.md

Build the episode from scratch using the creative spec's scene layout section for viewport compositions.

FOLLOW THE BUILD PRIORITIES from the creative spec summary. Build the signature visual FIRST, then supporting components.

IMPORTANT:
- Read CLAUDE-build.md first — especially the Animation Toolkit section and the Characters section
- Build components FIRST, before VideoTemplate.tsx
- Use the MOTION SCRIPT for exact timing — every element has a timestamp, follow it
- Each component should be self-contained and animated
- The core visual MUST NOT use CE. Choose from: GSAP timeline, SVG path morphing, CSS @keyframes, Canvas 2D, or morph()
- GSAP is installed (import gsap from 'gsap') — use it for choreographed sequences
- Use the brand fonts (var(--font-display), var(--font-mono), var(--font-body))
- Use viewport-relative units (vw, vh) for responsive 1920x1080 capture
- Do NOT use DiagramBox, FlowRow, or shared library components as the core visual
- Import CE from @/lib/video ONLY for supporting text/labels, not the core animation

SIGNATURE VISUAL QUALITY FLOOR — the core visual component must have:
- An UNDERLYING MODEL that drives the animation (physics sim, math curve, data grid, state machine) — not just hardcoded CSS transforms on styled divs
- CONTINUOUS LIFE — ambient motion even between scene changes (Brownian drift, shimmer, pulse). Use requestAnimationFrame for Canvas 2D, or CSS @keyframes for ambient loops
- MULTIPLE MODES — the visual should behave differently across scenes (e.g., idle → active → climax → resolution), not just appear/disappear
- LAYERED RENDERING — depth through glow + core + highlight layers, gradients, shadows. Flat single-layer elements look cheap
- MUTED COMPREHENSION — a viewer watching on mute should understand the core concept from visuals + on-screen text together. The diagram makes the mechanism click; the text explains what the viewer is seeing. Neither alone carries everything. If the visual is just decoration, it fails.
Reference: EP8's SpongeCanvas.tsx (497 lines, Canvas 2D particle physics, 5 modes) and EP9's HeatmapCanvas.tsx (321 lines, Canvas 2D grid, 3 fill modes with heat color ramp) set the quality bar.
- Use VIEWPORT-FIRST layout — all content fits within 1920×1080 (100vw × 100vh). No oversized canvases, no Camera zoom/pan.
- Prefer persistent visuals with morph() when content spans multiple scenes — elements stay mounted and transform within the viewport. Use sceneRange() or CE enter/exit to swap content when appropriate.
- If the storyboard includes CHARACTER scenes: import { Character } from '@/lib/video'. Characters are ready-made animated SVG stick figures — do NOT build custom character components. Just use <Character name="alice" emotion="explaining" gesture="point" says="text" />. Read the Characters section in CLAUDE-build.md for the full props API (emotions, gestures, lookAt, speech bubbles).

TEXT POSITIONING RULES — TEXT OVERLAP IS THE #1 BUG. PREVENT IT:
- ZONE SYSTEM: divide the viewport into non-overlapping zones. Before placing ANY text, assign it a zone:
  TOP STRIP: 0-12vh (scene heading/caption — ONE element only)
  MAIN AREA: 12-85vh (visual + labels inside it — labels positioned relative to their visual parent, not absolute)
  BOTTOM STRIP: 85-100vh (footnote, status, CTA — ONE element only)
  LEFT MARGIN: 0-15vw, RIGHT MARGIN: 85-100vw (side labels if needed)
- NEVER position two text elements with overlapping absolute coordinates. If a heading is at top:6vh and a subtitle is at top:8vh, they WILL overlap — use flexbox or explicit spacing.
- NEVER layer text on top of other text using z-index. Visual layers (glows, backgrounds) can sit behind text, but text-on-text is always a bug.
- For text INSIDE visuals (labels on diagrams): position labels relative to their parent component, not with viewport-absolute coordinates. This prevents collisions with scene-level text.
- BEFORE writing a scene: list every text element and its zone. If two elements share a zone, reposition one.
- When persistent text carries across scenes (morph), verify it doesn't collide with new text entering in the next scene.

PHASE A — BUILD CUSTOM COMPONENTS:
1. Create the episode directory: mkdir -p ${EP_PATH}/
2. Write constants.ts with EP_COLORS, EP_SPRINGS, and SCENE_DURATIONS
3. Build the signature visual FIRST as a separate .tsx file
4. Build supporting custom components as separate .tsx files
5. Verify components compile: npx tsc --noEmit --project tsconfig.json

PHASE B — ASSEMBLE VIDEOTEMPLATE:
Using your custom components, build the complete single-canvas VideoTemplate following CLAUDE.md.

CHECKLIST:
1. Import useVideoPlayer, DevControls, morph, createThemedCE, ceThemes from @/lib/video
2. If the storyboard has CHARACTER scenes: also import { Character } from '@/lib/video'. Use <Character name="alice" emotion="explaining" gesture="point" lookAt="right" says="Speech text" position={{ x: '25%', y: '85%' }} size="8vw" />. Character props change per scene — use morph() or conditional rendering based on currentScene to update emotion/gesture/says per scene. Keep speech bubble text SHORT (max ~12 words).
3. Create a themed CE: const ECE = createThemedCE(ceThemes.blurIn) — pick a theme that fits the episode mood (blurIn, clipCircle, glitch, scalePop, wipeRight, flip, rotateIn, etc). NEVER use bare CE with default fade-up.
4. Import your custom components from the episode folder
5. Import EP_COLORS, EP_SPRINGS from the episode's constants.ts
6. Use morph() as the PRIMARY animation pattern — elements stay mounted and transform between scene states
7. Use VIEWPORT-FIRST layout — all content within 1920×1080 viewport. Position elements with absolute + vw/vh units. Use layout variety across scenes (split-screen, full-bleed, asymmetric, centered).
8. Prefer persistent visuals with morph() when content spans scenes — elements stay mounted and transform within the viewport. Use sceneRange() or CE enter/exit to swap content when appropriate.
9. Use CE ONLY for text captions and labels — NOT for the core visual
10. Use GSAP (gsap.timeline()) for choreographed sequences where morph() isn't enough
11. Progressive reveal in every scene — staggered delays
12. Episode-specific spring configs from EP_SPRINGS (NOT springs.snappy)
13. Background from EP_COLORS (NOT var(--color-bg-light) by default)

POSITIONING:
- Use VIEWPORT-FIRST layout — position all content within the 1920×1080 viewport using absolute vw/vh coordinates
- Use varied layouts across scenes — split-screen, full-bleed, asymmetric, centered
- All elements must be visible on screen — no off-screen content

PHASE C — REGISTER AND VERIFY:
- Add data-video="ep${EP_NUM}" attribute on the root div (required for recording)
- Register the episode in client/src/App.tsx (add route)
- Register in client/src/pages/Home.tsx (add to episode list)
- Export from client/src/episodes/index.ts
- Run npx tsc --noEmit --project tsconfig.json to verify

Build all components AND the VideoTemplate in this single pass. The episode should be complete and ready for preview.
PROMPT_END
)" --new-session --session-file "$BUILD_SESSION" --effort "$EFFORT_BUILD" --model "$MODEL_BUILD"
fi

# (build-template merged into build-components above — single build phase)

# ═════════════════════════════════════════════════════════════════════════════
# TYPE CHECK
# ═════════════════════════════════════════════════════════════════════════════

log "Running TypeScript type check..."
cd "$PROJECT_DIR"
if npx tsc --noEmit --project tsconfig.json 2>"$WORK_DIR/typecheck.log"; then
  log "Type check passed"
else
  log "Type check failed — errors saved to $WORK_DIR/typecheck.log"
  log "Will address in visual QA or critique→plan→rebuild loop"
fi

# ── CHECKPOINT 2: FULL BUILD VISUAL REVIEW ───────────────────────────────────
# The real episode is built. Let the user WATCH it before we spend tokens
# on the expensive Visual QA + Hard Gates + 3-critic loop.

if ! checkpoint "FULL BUILD — Watch the real episode" "feedback-build.txt"; then
  # User chose 'r' (redo) — delete build artifacts and re-run
  log "Redoing build phase..."
  rm -f "$WORK_DIR/.done_build-components"
  exec "$0" "$TOPIC" "$EP_NUM" "$SLUG" "${@:4}"
fi

# ── DRAFT MODE: stop here ────────────────────────────────────────────────────
if [ "$DRAFT_MODE" = "true" ] || [ "$REBUILD_MODE" = "true" ]; then
  PIPELINE_END=$(date +%s)
  PIPELINE_DUR=$(( PIPELINE_END - PIPELINE_START ))
  PIPELINE_MINS=$(( PIPELINE_DUR / 60 ))
  PIPELINE_SECS=$(( PIPELINE_DUR % 60 ))

  echo ""
  echo "╔══════════════════════════════════════════════════════════════════════╗"
  echo "║  $([ "$DRAFT_MODE" = "true" ] && echo "DRAFT" || echo "REBUILD") COMPLETE                                                ║"
  echo "║                                                                    ║"
  echo "║  Episode:  ${EP_PATH}/"
  echo "║  Time:     ${PIPELINE_MINS}m ${PIPELINE_SECS}s"
  echo "║                                                                    ║"
  echo "║  Preview:  npm run dev:client → #ep${EP_NUM}                       ║"
  echo "║                                                                    ║"
  echo "║  Next steps:                                                       ║"
  echo "║    • Iterate locally: edit code + hot reload                       ║"
  echo "║    • Polish: re-run without --draft to add QA + critique           ║"
  echo "║    • Rebuild: --rebuild after toolkit changes                      ║"
  echo "║                                                                    ║"
  echo "╚══════════════════════════════════════════════════════════════════════╝"
  echo ""
  log "$([ "$DRAFT_MODE" = "true" ] && echo "Draft" || echo "Rebuild") completed at $(date) (${PIPELINE_MINS}m ${PIPELINE_SECS}s)"
  exit 0
fi

# If user gave feedback, inject it into visual QA + critique phases
BUILD_FEEDBACK=""
if [ -f "$WORK_DIR/feedback-build.txt" ]; then
  BUILD_FEEDBACK=$(cat "$WORK_DIR/feedback-build.txt")
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

# Only run fix phase if there were issues OR user gave feedback
if [ "$VQ_EXIT_CODE" -eq 1 ] || [ -n "$VQ_TS_ERRORS" ] || [ -n "$BUILD_FEEDBACK" ]; then

run_phase "visual-qa" "$(cat <<PROMPT_END
You are a VISUAL QA ENGINEER for an animated Bitcoin explainer episode. Your job is to fix positioning issues found by the automated visual QA tool.

Episode: ${EP_NUM} (${TOPIC}) at ${EP_PATH}/

${BUILD_FEEDBACK:+## HUMAN FEEDBACK (address FIRST — highest priority)
The creator watched the episode and said: "${BUILD_FEEDBACK}"
Fix this before addressing automated QA issues.

}## AUTOMATED VISUAL QA REPORT
The tool opened the episode in Playwright at 1920×1080, stepped through every scene, and used getBoundingClientRect() to check element positions. This is deterministic — the numbers are pixel-accurate.

${VQ_REPORT}

Screenshots of every scene are saved at ${VQ_OUTPUT_DIR}/ — read them to see the actual rendering.

## YOUR JOB: FIX THE FAILURES

For each FAIL issue in the report:

1. **Read the screenshot** for that scene to see what's actually on screen
2. **Identify the root cause**:
   - Is content off-screen? → adjust the absolute vw/vh coordinates to bring it within the 1920×1080 viewport
   - Is content clipped at the edge? → reposition or resize to fit within the viewport
   - Is it internal component positioning? (content offset within the component) → adjust the component
   - Is it TEXT OVERLAP? → two text elements are on top of each other. Move one of them to a different position so both are readable. Give each text element its own reserved space.
   - Is it TEXT CROWDED? → two text elements are too close together (< 8px gap). Increase spacing between them so both are clearly readable.
3. **Fix the code**
4. **Do NOT write a POSITION AUDIT comment** — the automated tool replaces manual math audits

For WARN issues (clipping):
- If >40% is clipped, fix it
- Minor edge clipping (<20%) is acceptable

For WARN items with far off-screen elements: these indicate content outside the 1920×1080 viewport — reposition within the visible frame.

For WARN items with TEXT CROWDED: increase spacing between the text elements so they're clearly separate and readable.

IMPORTANT: Do NOT compute positioning math manually. Fix by adjusting values, then re-run the visual QA tool to verify:
  node scripts/visual-qa.mjs ep${EP_NUM} ${VQ_OUTPUT_DIR}

${VQ_TS_ERRORS:+ALSO FIX THESE TYPE ERRORS: ${VQ_TS_ERRORS}}

After all fixes, run: npx tsc --noEmit to verify compilation.

Write a summary to .auto-episode/ep${EP_NUM}-${SLUG}/visual-qa.md
PROMPT_END
)" --new-session --session-file "$QA_SESSION" --effort "$EFFORT_VISUAL_QA"

else
  log "✓ No positioning issues to fix"
  touch "$WORK_DIR/.done_visual-qa"
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

gate_check "Themed CE used (createThemedCE or ceThemes)" \
  "grep -rql 'createThemedCE\|ceThemes' '${EP_PATH}/'"

gate_check "Has custom visual component (not just VideoTemplate)" \
  "[ \$(find '${EP_PATH}/' -name '*.tsx' ! -name 'VideoTemplate.tsx' | wc -l | tr -d ' ') -ge 1 ]"

gate_check "Signature visual has substantial complexity (150+ lines)" \
  "[ \$(find '${EP_PATH}/' -name '*.tsx' ! -name 'VideoTemplate.tsx' ! -name 'constants.ts' -exec wc -l {} + 2>/dev/null | tail -1 | awk '{print \$1}') -ge 150 ]"

gate_check "2+ custom visual components (multi-act variety)" \
  "[ \$(find '${EP_PATH}/' -name '*.tsx' ! -name 'VideoTemplate.tsx' ! -name 'constants.ts' | wc -l | tr -d ' ') -ge 2 ]"

log ""
log "Hard gates: $((8 - GATE_FAILS))/8 passed"

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
- Themed CE: import ceThemes from '@/lib/video', call createThemedCE with a theme (blurIn, clipCircle, glitch, etc.)
- Custom component: the episode's core visual must be a separate .tsx file, not inline in VideoTemplate
- 150+ lines: the custom visual components (excluding VideoTemplate.tsx and constants.ts) must total at least 150 lines. If under 150, the visual is too thin — add more animation states, more scene-driven behavior, more visual depth. Reference: EP8 SpongeCanvas (497 lines), EP9 HeatmapCanvas (321 lines).
- 2+ custom components: each act needs its own visual centerpiece — one component for the whole episode means no visual variety. Build distinct visuals for different narrative acts. A custom visual must have: (1) an underlying model or internal choreography beyond entrance stagger, (2) multiple states across scenes, (3) meaningful visual weight. Styled divs with GSAP entrance animations do NOT count — those are data displays, not visual centerpieces.

Read ${EP_PATH}/ files and fix each violation. Then run: npx tsc --noEmit --project tsconfig.json
PROMPT_END
)" --session-file "$QA_SESSION"

  # Re-run gates to verify fixes actually landed
  log "Re-checking hard gates after fix..."
  GATE_FAILS_POST=0
  GATE_REPORT_POST=""

  gate_recheck() {
    local name="$1" cmd="$2"
    if eval "$cmd" >/dev/null 2>&1; then
      log "  PASS: $name"
    else
      log "  STILL FAILING: $name"
      GATE_FAILS_POST=$((GATE_FAILS_POST + 1))
      GATE_REPORT_POST="${GATE_REPORT_POST}\n- $name"
    fi
  }

  gate_recheck "No bare CE" "! grep -E '<CE[ >]' '${EP_PATH}/VideoTemplate.tsx'"
  gate_recheck "GSAP used" "grep -rql 'useSceneGSAP\|gsap\.\|useGSAP' '${EP_PATH}/'"
  gate_recheck "EP_COLORS" "grep -q 'EP_COLORS' '${EP_PATH}/constants.ts'"
  gate_recheck "EP_SPRINGS" "grep -q 'EP_SPRINGS' '${EP_PATH}/constants.ts'"
  gate_recheck "Themed CE" "grep -rql 'createThemedCE\|ceThemes' '${EP_PATH}/'"
  gate_recheck "Custom component" "[ \$(find '${EP_PATH}/' -name '*.tsx' ! -name 'VideoTemplate.tsx' | wc -l | tr -d ' ') -ge 1 ]"

  if [ "$GATE_FAILS_POST" -gt 0 ]; then
    log "⚠ $GATE_FAILS_POST gate(s) still failing after auto-fix — critique will catch these"
  else
    log "✓ All gates pass after fix"
  fi
fi

# ═════════════════════════════════════════════════════════════════════════════
# CRITIQUE → PLAN → REBUILD LOOP  [Planner↔Executor alternating]
# ═════════════════════════════════════════════════════════════════════════════

QUALITY_THRESHOLD=75
MAX_ITERATIONS=$MAX_CRITIQUE
ITERATION=0

if [ "$SKIP_CRITIQUE" = "true" ]; then
  log "Skipping critique loop (--skip-critique). Review the episode manually."
  SCORE="(skipped)"
else

while [ $ITERATION -lt $MAX_ITERATIONS ]; do
  ITERATION=$((ITERATION + 1))

  # ── CRITIQUE [Planner — fresh session, adversarial review] ───────────────

  divider "PLANNER" "CRITIQUE (iteration $ITERATION/$MAX_ITERATIONS)"

  # Type check
  TYPECHECK_ERRORS=""
  cd "$PROJECT_DIR" || exit 1
  if npx tsc --noEmit --project tsconfig.json 2>"$WORK_DIR/typecheck-iter${ITERATION}.log"; then
    log "Type check passed"
  else
    TYPECHECK_ERRORS=$(cat "$WORK_DIR/typecheck-iter${ITERATION}.log")
    log "Type check failed — will include errors in critique"
  fi

  # Count scenes — check both VideoTemplate.tsx and constants.ts (newer episodes
  # define SCENE_DURATIONS in constants.ts)
  SCENE_COUNT=$(cd "$PROJECT_DIR" || exit 1; grep -oE 'scene[0-9]+' "${EP_PATH}/VideoTemplate.tsx" "${EP_PATH}/constants.ts" 2>/dev/null | grep -oE 'scene[0-9]+' | sort -u | wc -l | tr -d ' ')
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
${CTX_CRITIC}

Episode ${EP_NUM} (${TOPIC}) at ${EP_PATH}/

${BUILD_FEEDBACK:+HUMAN FEEDBACK (the creator watched and said): "${BUILD_FEEDBACK}"
Pay extra attention to whether this feedback has been addressed.

}Read the code:
- ${EP_PATH}/VideoTemplate.tsx and all custom components in that folder
- ${EP_PATH}/constants.ts

Also read for comparison:
- Creative spec: .auto-episode/ep${EP_NUM}-${SLUG}/creative-spec.md
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
3. LAYOUT VARIETY — does the episode use different viewport compositions across scenes (split-screen, full-bleed, asymmetric, centered)? Do elements morph between positions? All content visible within 1920×1080? Same static layout every scene = low score.
4. CUSTOM PALETTE — EP_COLORS and EP_SPRINGS in constants.ts? ${PALETTE_CRITIQUE}
5. VISUAL POLISH — if screenshots available, READ THEM: layout balance, spacing, color harmony, text readability, professional quality. Would this stand up next to 3Blue1Brown?
6. SIGNATURE VISUAL CRAFT — READ the core visual component code and evaluate:
   a) Does the visual TEACH the concept? Does looking at the visual + its on-screen text help you understand the idea, or is it just decorative? A viewer on mute should understand from visuals + text together. Score 1-3 if the visual doesn't help understanding, 7-10 if it makes the concept click.
   b) Does it represent something REAL (a data structure, a process, a computation)? Or is it just styled divs with transitions? Score 1-3 if purely decorative, 4-6 if basic representation, 7-10 if it genuinely models the concept.
   c) Does it feel ALIVE between scene transitions (ambient motion, pulse, shimmer — even subtle)? -1 if completely static between scenes.
   d) Does it EVOLVE across scenes (not just appear/disappear)? -1 if single state throughout.
   e) Is the complexity APPROPRIATE for the concept? A simple concept with a 500-line overbuilt visual is just as bad as a complex concept with a 50-line underbuilt one. Score based on whether the visual's complexity matches what the concept needs.
7. TEXT READABILITY — if screenshots available, CHECK CAREFULLY:
   - Does any text overlap other text? (two labels stacked, caption over a value, etc.) This is a MUST FIX — overlapping text is never acceptable.
   - Is text crowded (too many text elements in one area)? Flag if hard to read.
   - Are teaching labels/values clearly visible against the background?
   Score 1-3 if text overlaps exist, 7-10 if all text is clean and readable.

8. SCENE DENSITY & DYNAMIC NECESSITY — if screenshots available, CHECK EACH SCENE:
   - How many distinct visual systems are on screen? (a grid, a diagram, a timeline, a detail panel each count as one). Max 2-3 per scene.
   - Are there stale visuals from a previous act that should have been cleared? (e.g., a UTXO grid still visible during a scene about nLockTime)
   - Does the scene feel clean and focused, or busy and overwhelming?
   - DYNAMIC NECESSITY: does each scene's motion teach something a still image would not? Flag decorative motion (spinning, pulsing, floating that doesn't teach). Flag fake intermediate states (mid-animation frames that look meaningful but represent nothing in the protocol).
   - Is there one clear FOCAL OBJECT per scene, or are multiple systems competing for attention?
   Score 1-3 if scenes are overcrowded (4+ visual systems) or motion is purely decorative, 4-6 if some clutter or unnecessary motion, 7-10 if each scene is clean with one dominant visual and purposeful motion.
   OVERCROWDED SCENES (4+ visual systems) and FAKE INTERMEDIATE STATES are MUST FIX. Decorative motion and missing focal object are SHOULD FIX.
   PANEL FALLBACK: if 2+ consecutive explanatory scenes are mostly text panels/cards/rectangles with only entrance animations — flag as MUST FIX. Each act needs a real visual centerpiece that transforms/morphs/simulates, not a slide deck.
   ACT WITHOUT CENTERPIECE: if any narrative act (3+ scenes on the same concept) has no component with an underlying model, internal choreography, or multiple states — flag as MUST FIX.

BONUS: If characters (Alice/Bob) are used — do they have varied emotions across scenes? Are gestures used meaningfully (not all 'none')? Do they look at each other during dialogue? Are speech bubbles readable and short? Do characters add personality or feel like decoration?

OVERALL VISUAL SCORE: X/80

LIST specific visual issues with priority: MUST FIX / SHOULD FIX / NICE TO HAVE
TEXT OVERLAP and OVERCROWDED SCENES are always MUST FIX — never downgrade.

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
   - All content must fit within the 1920×1080 viewport. Any empty scenes?
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

1. HOOK — does the opening grab attention? Does scene 2 start from something you ALREADY KNOW, or does it throw jargon at you? If a technical term appears before you've seen what it refers to, that's a MUST FIX.
2. TEACHING FLOW — one idea per scene? Progressive reveal? Does each scene build on what you just learned? Or does it dump information or skip steps? Can you follow the logic from scene to scene WITHOUT imagining narration?
3. MUTED COMPREHENSION — read only the on-screen text (captions, labels, values) and look at the visuals. Can you follow the full lesson without audio? The visual + text together must carry the teaching. Flag any scene where you'd need narration to understand what's happening. This is the most important criterion.
4. EMOTIONAL ARC — do you feel curiosity > confusion > aha > satisfaction? Is there a clear highlight/aha scene? Where does the "wait, really?!" moment land?
5. THE "SO WHAT?" TEST — after watching, do you understand WHY this matters? Is there a "why is this a big deal?" beat?

STRUCTURAL FAILURES (auto-MUST FIX — these are not cosmetic):
- Opens with jargon before grounding the concept visually
- Beautiful visual but you can't tell what mechanism it's showing
- A scene where the concept is only carried by imagined narration, not visible on screen
- More than one new idea crammed into a single scene
- A mechanism, formula, or algorithm step appears before the viewer understands WHY it's needed (HOW before WHY — the viewer thinks "why are we doing this?")
- Text overlapping other text, making it unreadable

Walk through the episode scene by scene and narrate your experience as a viewer:
- Scene 1: "I see... this makes me think..."
- Scene 2: "OK so this is about... I already know X, so this connects to..."
- (etc.)
- For each scene, state: what you LEARNED (one thing), and what you ALREADY KNEW going in
- Flag any scene where you'd lose interest, get confused, or feel talked down to
- Flag any scene where you need to imagine narration to understand what's happening
- Which scene's motion most HELPED your understanding? Which felt ornamental or decorative?
- Could any lesson have been shown with fewer simultaneous objects on screen?
- If characters appear: Do Alice & Bob feel like they're having a real conversation, or is it forced?

OVERALL AUDIENCE SCORE: X/20 (weighted: hook 4pts, teaching 4pts, muted-comprehension 4pts, arc 4pts, so-what 4pts)

LIST specific audience issues with priority: MUST FIX / SHOULD FIX / NICE TO HAVE

Save to .auto-episode/ep${EP_NUM}-${SLUG}/critique-audience-iter${ITERATION}.md

At the very end, output EXACTLY: AUDIENCE_SCORE: <number>
PROMPT_END
)

  # ── Launch critics in parallel ───────────────────────────────────────────
  log "Launching $NUM_CRITICS parallel critics..."

  CRITIQUE_PIDS=()
  bg_claude "critique-visual-iter${ITERATION}" "$PROMPT_CRITIC_VISUAL" "$PLANNER_TOOLS" "$EFFORT_CRITIQUE" "$MODEL_CRITIQUE"
  PID_CV=$!
  CRITIQUE_PIDS+=("$PID_CV")

  bg_claude "critique-tech-iter${ITERATION}" "$PROMPT_CRITIC_TECH" "$PLANNER_TOOLS" "$EFFORT_CRITIQUE" "$MODEL_CRITIQUE"
  PID_CT=$!
  CRITIQUE_PIDS+=("$PID_CT")

  if [ "$NUM_CRITICS" -ge 3 ]; then
    bg_claude "critique-audience-iter${ITERATION}" "$PROMPT_CRITIC_AUDIENCE" "$PLANNER_TOOLS" "$EFFORT_CRITIQUE" "$MODEL_CRITIQUE"
    PID_CA=$!
    CRITIQUE_PIDS+=("$PID_CA")
  else
    log "Skipping audience critic (--critics=$NUM_CRITICS)"
  fi

  CRITIQUE_FAILURES=0
  wait_group "Parallel critique ($NUM_CRITICS personas)" "${CRITIQUE_PIDS[@]}" || CRITIQUE_FAILURES=$?
  if [ "$CRITIQUE_FAILURES" -gt 0 ]; then
    log "⚠ $CRITIQUE_FAILURES critic(s) failed — continuing with available critiques"
    for name in "critique-visual-iter${ITERATION}" "critique-tech-iter${ITERATION}" "critique-audience-iter${ITERATION}"; do
      [ -f "$WORK_DIR/.failed_${name}" ] && log "  ✗ $name failed"
    done
  fi
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
1. Extract scores: VISUAL_SCORE (out of 80) + TECHNICAL_SCORE (out of 30) + AUDIENCE_SCORE (out of 20) = RAW TOTAL/130. Then normalize: TOTAL = round(RAW * 100 / 130) to get a score out of 100.
2. If a score line is missing, estimate based on the critique content
3. Consolidate all issues into a single list, removing duplicates
4. When critics disagree, prioritize: MUST FIX issues from ANY critic stay MUST FIX
5. Sort final issues: MUST FIX first, then SHOULD FIX, then NICE TO HAVE
6. Note which persona flagged each issue (helps the fix planner understand the concern)

Save to .auto-episode/ep${EP_NUM}-${SLUG}/critique-iter${ITERATION}.md

Format:
## Scores
- Visual Design: X/80 (from visual critic — includes signature visual depth, text readability, scene density)
- Technical Quality: X/30 (from tech critic)
- Audience Experience: X/20 (from audience proxy)
- **TOTAL: X/100** (normalized from raw X/130)

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

  # Early exit: if score is very low, the visual approach is fundamentally wrong.
  # Polishing won't save it — flag for human review instead of wasting tokens.
  if [ "$SCORE" -lt 40 ] && [ "$ITERATION" -ge 1 ]; then
    log "⚠ Score $SCORE is below 40 — visual approach may be fundamentally wrong."
    log "  Stopping critique loop. Review the episode manually and consider rebuilding"
    log "  with a different creative vision (different visual approach, layout, or mood)."
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
- Creative spec: .auto-episode/ep${EP_NUM}-${SLUG}/creative-spec.md

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
)" --new-session --session-file "$WORK_DIR/session_planner_iter${ITERATION}" --tools "$PLANNER_TOOLS" --effort "$EFFORT_CRITIQUE_MERGE"

  # ── REBUILD [Executor — reads fix plan, executes bounded fixes] ───────────

  divider "EXECUTOR" "REBUILD (iteration $ITERATION)"

  FIX_PLAN=$(read_artifact "fix-plan-iter${ITERATION}.md")

  run_phase "rebuild-iter${ITERATION}" "$(cat <<PROMPT_END
${CTX_BUILD}

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
- After all fixes, run: npx tsc --noEmit --project tsconfig.json
- If type errors remain, fix them
- For any positioning fixes, verify with the automated tool: node scripts/visual-qa.mjs ep${EP_NUM} .auto-episode/ep${EP_NUM}-${SLUG}/visual-qa
  Do NOT rely on manual arithmetic — use the tool's deterministic output.

The planner's plan is your spec. Execute it precisely.
PROMPT_END
)" --new-session --session-file "$WORK_DIR/session_rebuild_iter${ITERATION}" --effort "$EFFORT_FIX" --model "$MODEL_BUILD"

done  # end critique→plan→rebuild loop

log "Final quality score: $SCORE/100 after $ITERATION iteration(s)"

fi  # end skip-critique check

# ═════════════════════════════════════════════════════════════════════════════
# TRANSCRIPT + AUDIO SCRIPT (Optional)  [Executor]
# Generates transcript.txt and a Node.js script for ElevenLabs.
# Does NOT call the API — you run the generated script manually afterward.
# ═════════════════════════════════════════════════════════════════════════════

if [ "$WITH_VOICE" = "true" ]; then
  divider "EXECUTOR" "TRANSCRIPT & AUDIO SCRIPT"

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
Create a standalone Node.js script that:
- Reads ELEVENLABS_API_KEY from .env
- Uses Voice ID: InRyolULHTXjegISsXuJ, model: eleven_multilingual_v2
- Settings: { stability: 0.6, similarity_boost: 0.8, style: 0.3 }
- Takes the transcript scenes and generates MP3s to: ${AUDIO_PATH}/
Output to: ${AUDIO_PATH}/

STEP 3: Update SCENE_DURATIONS = estimated_audio_length + 2500ms buffer.

STEP 4: Add SCENE_AUDIO array + audio playback effect (400ms delay pattern).
Add timing comments: // "phrase" @ Xs audio → X.4s scene

Do NOT call the ElevenLabs API — just create the script.
PROMPT_END
)" --new-session --session-file "$WORK_DIR/session_voiceover"
else
  log "Skipping transcript (use --with-transcript to include)"
fi

# ═════════════════════════════════════════════════════════════════════════════
# CROSS-EPISODE LEARNING  [Extract lessons for future episodes]
# ═════════════════════════════════════════════════════════════════════════════

if [ "$SKIP_LESSONS" = "true" ]; then
  log "Skipping lessons extraction (--skip-lessons or --fast)"
else

divider "PLANNER" "CROSS-EPISODE LEARNING"

BUILD_MEMORY_FILE="$PROJECT_DIR/.auto-episode/build-memory.md"
EPISODE_HISTORY_FILE="$PROJECT_DIR/.auto-episode/episode-history.md"

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

EXISTING_BUILD_MEMORY=""
if [ -f "$BUILD_MEMORY_FILE" ]; then
  EXISTING_BUILD_MEMORY=$(cat "$BUILD_MEMORY_FILE")
fi

EXISTING_HISTORY=""
if [ -f "$EPISODE_HISTORY_FILE" ]; then
  EXISTING_HISTORY=$(cat "$EPISODE_HISTORY_FILE")
fi

LESSONS_PROMPT="$(cat <<PROMPT_END
You are extracting lessons from an episode build to maintain TWO separate files.

Episode ${EP_NUM}: ${TOPIC}
Final score: ${SCORE}/100 after ${ITERATION} iteration(s)

CRITIQUE HISTORY:
${CRITIQUE_HISTORY}

FIX PLAN HISTORY:
${FIX_HISTORY}

EXISTING BUILD MEMORY:
${EXISTING_BUILD_MEMORY:-"(none yet)"}

EXISTING EPISODE HISTORY:
${EXISTING_HISTORY:-"(none yet)"}

YOUR JOB — write TWO files:

FILE 1: .auto-episode/build-memory.md
This is a SHORT, CURATED file of reusable lessons injected into future build prompts.
Rules:
- Only GENERALIZABLE lessons — not episode-specific details
- If a lesson already exists, UPDATE it (add evidence) rather than duplicating
- Remove lessons that are wrong, outdated, or already documented in CLAUDE.md / CLAUDE-build.md / CLAUDE-critic.md
- Do NOT store code patterns, file paths, or architecture (derivable from code)
- Keep each lesson to 1-2 sentences with a concrete action item
- Max ~30 lessons total — if over, merge or drop the least useful
- Include episode number for provenance

FORMAT:
# Build Memory — Reusable Lessons

## Codebase Patterns
- [pattern] (ep<N>, confirmed ep<M>)

## Common Bugs
- [lesson] (ep<N>)

## What Scores Well
- [lesson] (ep<N>)

## What Scores Poorly
- [lesson] (ep<N>)

## Build Process Tips
- [lesson] (ep<N>)

FILE 2: .auto-episode/episode-history.md
Append-only log. NEVER delete existing entries. Just add the new one.

FORMAT:
# Episode History — Append-Only Log

## Episodes
[keep all existing entries]
- ep${EP_NUM} (${TOPIC}): score ${SCORE}/100, ${ITERATION} iteration(s). Key takeaway: [one sentence]

Save both files.
PROMPT_END
)"

# Run lessons in background — non-blocking
bg_claude "lessons" "$LESSONS_PROMPT" "$PLANNER_TOOLS" "$EFFORT_LESSONS" "$MODEL_LESSONS"
LESSONS_PID=$!
log "Lessons extraction running in background (PID $LESSONS_PID) — pipeline continues"

fi  # end skip-lessons check

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
echo "║    creative-spec.md        — Full creative spec (vision+storyboard+motion)║"
echo "║    creative-spec-summary.md — Build priorities extract             ║"
echo "║    critique-{visual,tech,audience}-iter*.md — Persona critiques    ║"
echo "║    critique-iter*.md       — Merged critique + scores              ║"
echo "║    fix-plan-iter*.md       — Planner's prioritized fix plans       ║"
echo "║    screenshots-*/          — Visual captures of each scene         ║"
echo "║    build-memory.md         — Curated reusable lessons (compact)    ║"
echo "║    episode-history.md      — Append-only episode log              ║"
echo "║                                                                    ║"
echo "║  Pipeline flow (v4):                                                ║"
echo "║    Research (3 parallel) → Merge → Creative Spec                   ║"
echo "║    → Full Build (components + template) → Type Check               ║"
echo "║    → ★ CHECKPOINT → Visual QA → Hard Gates                        ║"
echo "║    → Critique ($NUM_CRITICS critics) → Rebuild ($MAX_CRITIQUE iter)║"
echo "║    → Lessons (async)                                               ║"
echo "║                                                                    ║"
echo "║  Next steps:                                                       ║"
echo "║    1. Preview:  npm run dev:client → #ep${EP_NUM}                  ║"
echo "║    2. Review artifacts in .auto-episode/                           ║"
echo "║    3. Iterate interactively if needed                              ║"
if [ "$WITH_VOICE" = "true" ]; then
echo "║    4. Generate audio: node scripts/generate-voiceover-ep${EP_NUM}.mjs ║"
fi
echo "║                                                                    ║"
echo "║  When done:                                                        ║"
echo "║    ./scripts/archive-episode.sh ep${EP_NUM}-${SLUG}               ║"
echo "║                                                                    ║"
echo "╚══════════════════════════════════════════════════════════════════════╝"
echo ""

# ── Phase Duration Summary ──────────────────────────────────────────────────
PIPELINE_END=$(date +%s)
PIPELINE_DUR=$(( PIPELINE_END - PIPELINE_START ))
PIPELINE_MINS=$(( PIPELINE_DUR / 60 ))
PIPELINE_SECS=$(( PIPELINE_DUR % 60 ))

echo ""
echo "┌──────────────────────────────────────────────────────────────────────┐"
echo "│  PHASE DURATION SUMMARY                                            │"
echo "├──────────────────────────────────────────────────────────────────────┤"
for dur_file in "$WORK_DIR"/.duration_*; do
  [ -f "$dur_file" ] || continue
  phase_label=$(basename "$dur_file" | sed 's/^\.duration_//')
  phase_dur=$(cat "$dur_file")
  printf "│  %-40s %10s          │\n" "$phase_label" "$phase_dur"
done
echo "├──────────────────────────────────────────────────────────────────────┤"
printf "│  %-40s %10s          │\n" "TOTAL PIPELINE" "${PIPELINE_MINS}m ${PIPELINE_SECS}s"
echo "└──────────────────────────────────────────────────────────────────────┘"
echo ""

log "Pipeline completed at $(date) (total: ${PIPELINE_MINS}m ${PIPELINE_SECS}s)"
