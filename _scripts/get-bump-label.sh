#!/usr/bin/env bash
#
# Read PR labels from $LABELS_JSON and extract the single bump label
# (patch|minor|major). Fails if zero or more than one bump label is set.
#
# Usage:
#   LABELS_JSON='[{"name":"patch"}, ...]' get-bump-label.sh
#
# On success: prints the matched label to stdout (e.g. "patch").
# On failure: writes a ::error:: annotation to stderr and exits 1.
#
set -euo pipefail

: "${LABELS_JSON:?LABELS_JSON must be set to the PR labels JSON}"

MATCHED=$(echo "$LABELS_JSON" \
  | jq -r '[.[].name] | map(select(. == "patch" or . == "minor" or . == "major")) | .[]')
COUNT=$(echo -n "$MATCHED" | grep -c . || true)
MATCHED_DISPLAY=$(echo "$MATCHED" | paste -sd ',' -)

echo "matched labels: ${MATCHED_DISPLAY:-<none>}" >&2

if [[ "$COUNT" -ne 1 ]]; then
  echo "::error::PR must have exactly one of the labels: patch, minor, major (found: ${MATCHED_DISPLAY:-<none>})" >&2
  exit 1
fi

echo "$MATCHED"
