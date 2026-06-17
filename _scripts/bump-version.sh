#!/usr/bin/env bash
#
# Bump app version across app.config.ts and package.json.
#
# Usage: bump-version.sh <patch|minor|major>
#
# Source of truth for the current version is app.config.ts (`version`).
# On bump:
#   - app.config.ts `version`     -> new semver
#   - app.config.ts `buildNumber` -> new semver (kept in sync with version)
#   - app.config.ts `versionCode` -> current + 1
#   - package.json  `version`     -> new semver
#
set -euo pipefail

BUMP_TYPE="${1:-}"
case "$BUMP_TYPE" in
  patch|minor|major) ;;
  *)
    echo "Usage: $0 <patch|minor|major>" >&2
    exit 1
    ;;
esac

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PKG="$ROOT/package.json"
CONFIG="$ROOT/app.config.ts"

[[ -f "$PKG"    ]] || { echo "missing $PKG" >&2; exit 1; }
[[ -f "$CONFIG" ]] || { echo "missing $CONFIG" >&2; exit 1; }

CURRENT_VERSION=$(grep -E '^[[:space:]]*version:[[:space:]]*"[0-9]+\.[0-9]+\.[0-9]+"' "$CONFIG" \
  | head -1 \
  | sed -E 's/.*"([0-9]+\.[0-9]+\.[0-9]+)".*/\1/')

CURRENT_VERSION_CODE=$(grep -E '^[[:space:]]*versionCode:[[:space:]]*[0-9]+' "$CONFIG" \
  | head -1 \
  | sed -E 's/.*versionCode:[[:space:]]*([0-9]+).*/\1/')

if [[ -z "$CURRENT_VERSION" || -z "$CURRENT_VERSION_CODE" ]]; then
  echo "could not parse current version or versionCode from $CONFIG" >&2
  exit 1
fi

IFS=. read -r MAJOR MINOR PATCH <<<"$CURRENT_VERSION"

case "$BUMP_TYPE" in
  major) MAJOR=$((MAJOR + 1)); MINOR=0; PATCH=0 ;;
  minor) MINOR=$((MINOR + 1)); PATCH=0 ;;
  patch) PATCH=$((PATCH + 1)) ;;
esac

NEW_VERSION="${MAJOR}.${MINOR}.${PATCH}"
NEW_VERSION_CODE=$((CURRENT_VERSION_CODE + 1))

# sed -i differs between BSD (macOS) and GNU (Linux). Use -i.bak for portability.
sed -i.bak -E "s/(^[[:space:]]*version:[[:space:]]*)\"[0-9]+\.[0-9]+\.[0-9]+\"/\1\"${NEW_VERSION}\"/" "$CONFIG"
sed -i.bak -E "s/(^[[:space:]]*buildNumber:[[:space:]]*)\"[0-9]+\.[0-9]+\.[0-9]+\"/\1\"${NEW_VERSION}\"/" "$CONFIG"
sed -i.bak -E "s/(^[[:space:]]*versionCode:[[:space:]]*)[0-9]+/\1${NEW_VERSION_CODE}/" "$CONFIG"
rm -f "$CONFIG.bak"

node -e "
const fs = require('fs');
const path = '$PKG';
const pkg = JSON.parse(fs.readFileSync(path, 'utf8'));
pkg.version = '$NEW_VERSION';
fs.writeFileSync(path, JSON.stringify(pkg, null, 2) + '\n');
"

echo "bumped ${BUMP_TYPE}: ${CURRENT_VERSION} -> ${NEW_VERSION} (versionCode ${CURRENT_VERSION_CODE} -> ${NEW_VERSION_CODE})"
