#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
INDEX_HTML="$REPO_ROOT/frontend/dist/index.html"
URL="http://127.0.0.1:8000"

if ! command -v uv >/dev/null 2>&1; then
  echo "Required command 'uv' was not found on PATH. Install uv before exam day." >&2
  exit 1
fi

if [[ ! -f "$INDEX_HTML" ]]; then
  echo "Offline frontend build not found at frontend/dist/index.html. This launcher cannot install dependencies or build assets during the exam." >&2
  exit 1
fi

cd "$REPO_ROOT"

echo "Starting offline exam localhost..."
echo "Open $URL in your browser."
echo "Keep this terminal open. Press Ctrl+C to stop."

uv run --no-sync uvicorn app.local_exam:app --app-dir backend --host 127.0.0.1 --port 8000
