#!/bin/bash
# Export Apple Reminders lists to JSON for the swipe-app.
# Usage: ./scripts/sync-lists.sh
# Writes one file per list into public/lists/.
# Re-run whenever you want fresh data, then `git push` to deploy.

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
OUT_DIR="$SCRIPT_DIR/../public/lists"
mkdir -p "$OUT_DIR"

# (Apple list name | output slug) pairs.
LISTS=(
  "Wedding|wedding"
  "This Week|this-week"
  "Triage|triage"
  "Basic Needs|basic-needs"
)

fetched_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

for pair in "${LISTS[@]}"; do
  list_name="${pair%|*}"
  slug="${pair#*|}"
  out_file="$OUT_DIR/$slug.json"

  echo "→ Exporting \"$list_name\" → $out_file"

  # osascript returns names joined by ASCII RS (0x1E) — safe vs commas/quotes
  # in reminder names. Use bulk `get name of (every reminder...)` — one round-
  # trip, vs the per-item loop which is O(N) Apple Events and minutes-slow.
  raw=$(osascript \
    -e 'set sep to (ASCII character 30)' \
    -e "set AppleScript's text item delimiters to sep" \
    -e 'tell application "Reminders"' \
    -e "  set output to (name of (every reminder of list \"$list_name\" whose completed is false))" \
    -e 'end tell' \
    -e 'return output as string')

  # Pipe raw via stdin to python so reminder text never gets eval'd as code.
  printf '%s' "$raw" | python3 -c '
import json, sys
list_name, slug, fetched_at = sys.argv[1], sys.argv[2], sys.argv[3]
raw = sys.stdin.read()
items = [s.strip() for s in raw.split(chr(30)) if s.strip()]
cards = [{"label": s, "list": list_name, "description": ""} for s in items]
payload = {"name": list_name, "slug": slug, "fetchedAt": fetched_at, "cards": cards}
print(json.dumps(payload, ensure_ascii=False, indent=2))
' "$list_name" "$slug" "$fetched_at" > "$out_file"

  count="$(python3 -c 'import json,sys; print(len(json.load(open(sys.argv[1]))["cards"]))' "$out_file")"
  echo "  ✓ $count cards"
done

echo
echo "Done. Commit + push to deploy:"
echo "  cd \"$(cd "$SCRIPT_DIR/.." && pwd)\""
echo "  git add public/lists && git commit -m 'sync lists' && git push"
