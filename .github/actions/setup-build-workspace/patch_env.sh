#!/usr/bin/env bash
# Patch `key: value,` lines in environment.ts. Shared by the
# setup-build-workspace action and the e2e workflow so patching lives in one place.
#
# Usage: patch_env.sh <env_file> <key> <value> [<key> <value> ...]
# Aborts (exit 1) if a key isn't found, so a missing patch is loud, not silent.
set -euo pipefail

[ $# -ge 3 ] || { echo "usage: $0 <env_file> <key> <value> [<key> <value> ...]" >&2; exit 1; }
ENV_FILE="$1"; shift
[ -f "$ENV_FILE" ] || { echo "env file not found: $ENV_FILE" >&2; exit 1; }

while [ $# -gt 0 ]; do
  key="$1"; value="$2"; shift 2
  grep -qE "${key}: .*,$" "$ENV_FILE" \
    || { echo "Expected '${key}: ...,' in ${ENV_FILE}, not found — patch aborted" >&2; exit 1; }
  sed -i.bak -E "s|${key}: .*,$|${key}: ${value},|" "$ENV_FILE"
  rm -f "$ENV_FILE.bak"
done