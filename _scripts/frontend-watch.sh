#!/bin/bash
set -euo pipefail

METRO_PORT=${METRO_PORT:-9000}

cd frontend

pnpm run build:bundle -- --watch 2>&1 | while IFS= read -r line; do
  echo "$line"
  if echo "$line" | grep -qE "created dist/|rebuilt in [0-9]"; then
    echo "[frontend-watch] Reloading Metro on port $METRO_PORT..."
    curl -s -X POST "http://localhost:${METRO_PORT}/reload" > /dev/null 2>&1 || true
  fi
done
