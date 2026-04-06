#!/usr/bin/env bash
# Archive a finished episode: move code + audio out of the working tree.
#
# Usage:
#   ./scripts/archive-episode.sh ep<N>-<slug>
#
# Example:
#   ./scripts/archive-episode.sh ep17-timelocks
#
# What it does:
#   1. Moves client/src/episodes/<slug>/ → archive/<slug>/
#   2. Moves client/public/audio/<slug>/ → archive/<slug>/audio/ (if exists)
#   3. Removes the episode's import + route from App.tsx
#   4. Removes the episode's export from episodes/index.ts
#   5. Removes the episode's entry from Home.tsx

set -euo pipefail

SLUG="${1:?Usage: archive-episode.sh ep<N>-<slug>}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

EP_DIR="$ROOT/client/src/episodes/$SLUG"
AUDIO_DIR="$ROOT/client/public/audio/$SLUG"
ARCHIVE_DIR="$ROOT/archive/$SLUG"
APP_TSX="$ROOT/client/src/App.tsx"
INDEX_TS="$ROOT/client/src/episodes/index.ts"
HOME_TSX="$ROOT/client/src/pages/Home.tsx"

# --- Checks ---
if [ ! -d "$EP_DIR" ]; then
  echo "❌ Episode not found: $EP_DIR"
  exit 1
fi

if [ -d "$ARCHIVE_DIR" ]; then
  echo "❌ Archive already exists: $ARCHIVE_DIR"
  exit 1
fi

# --- Move episode code ---
mkdir -p "$ROOT/archive"
mv "$EP_DIR" "$ARCHIVE_DIR"
echo "✅ Moved episode code → archive/$SLUG/"

# --- Move audio (if exists) ---
if [ -d "$AUDIO_DIR" ]; then
  mv "$AUDIO_DIR" "$ARCHIVE_DIR/audio/"
  echo "✅ Moved audio → archive/$SLUG/audio/"
else
  echo "ℹ️  No audio directory found for $SLUG (skipping)"
fi

# --- Clean App.tsx: remove import and route lines referencing the slug ---
if grep -q "$SLUG" "$APP_TSX" 2>/dev/null; then
  # Remove import line(s) referencing this episode
  sed -i '' "/@\/episodes\/$SLUG\//d" "$APP_TSX"
  # Remove route line(s) — matches lines containing the imported component name from this episode
  # We remove any ROUTES entry whose arrow function references a component imported from this slug
  # Since we already removed the import, just remove any remaining references
  sed -i '' "/$SLUG/d" "$APP_TSX"
  echo "✅ Cleaned App.tsx"
else
  echo "ℹ️  No references to $SLUG in App.tsx (skipping)"
fi

# --- Clean episodes/index.ts ---
if grep -q "$SLUG" "$INDEX_TS" 2>/dev/null; then
  sed -i '' "/$SLUG/d" "$INDEX_TS"
  echo "✅ Cleaned episodes/index.ts"
else
  echo "ℹ️  No references to $SLUG in index.ts (skipping)"
fi

# --- Clean Home.tsx: remove the episode's EPISODES array entry ---
# The entry is a multi-line object block containing the episode's id.
# We use sed to delete from the line containing "id: '<slug-prefix>'" back to the opening '{' and forward to the closing '},'.
EP_ID=$(echo "$SLUG" | sed 's/^\(ep[0-9]*\).*/\1/')
if grep -q "id: '$EP_ID'" "$HOME_TSX" 2>/dev/null; then
  # Remove the block: from '  {' to '  },' that contains this episode id
  sed -i '' "/$EP_ID/,/^  },/d" "$HOME_TSX"
  # Also remove any orphaned opening brace line left behind
  echo "✅ Cleaned Home.tsx"
else
  echo "ℹ️  No references to $EP_ID in Home.tsx (skipping)"
fi

echo ""
echo "🎬 Episode $SLUG archived. Working tree is clean for the next episode."
