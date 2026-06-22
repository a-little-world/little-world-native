#!/usr/bin/env bash
# Fail when version-bearing files diverge from BASE, unless the PR is from release-please.
#
# Inputs (env vars):
#   BASE       — git ref to diff against (e.g. "origin/main" or "main" in tests). Required.
#   PR_AUTHOR  — GitHub login of the PR author. Optional.
#   HEAD_REF   — head branch name. Optional.
#
# Exit codes: 0 = ok / skipped, 1 = manual version change detected.

set -euo pipefail

: "${BASE:?BASE env var required}"
: "${PR_AUTHOR:=}"
: "${HEAD_REF:=}"

if [[ "$PR_AUTHOR" == "github-actions[bot]" ]] || [[ "$HEAD_REF" == release-please* ]]; then
  echo "Release-please PR ($PR_AUTHOR / $HEAD_REF) — skipping version guard."
  exit 0
fi

fail=0

diff_field() {
  local file="$1" jq_path="$2"
  if ! git cat-file -e "$BASE:$file" 2>/dev/null; then
    return 0
  fi
  local base head
  base=$(git show "$BASE:$file" | jq -r "$jq_path // empty")
  head=$(jq -r "$jq_path // empty" "$file")
  if [ "$base" != "$head" ]; then
    echo "::error file=$file::Version changed manually ($base → $head). Only release-please may bump versions."
    fail=1
  fi
}

diff_field package.json '.version'
diff_field .release-please-manifest.json '."."'

# app.config.ts: APP_VERSION constant + derived assignments
if git cat-file -e "$BASE:app.config.ts" 2>/dev/null; then
  patterns=(
    'x-release-please-version'
    'version: APP_VERSION'
    'buildNumber: APP_VERSION'
    'versionCode: ANDROID_VERSION_CODE'
  )
  for pat in "${patterns[@]}"; do
    base_line=$(git show "$BASE:app.config.ts" | grep "$pat" || true)
    head_line=$(grep "$pat" app.config.ts || true)
    if [ "$base_line" != "$head_line" ]; then
      echo "::error file=app.config.ts::Line containing '$pat' changed manually. Only release-please may bump versions."
      fail=1
    fi
  done
fi

# CHANGELOG.md: managed by release-please, no manual edits
if git diff --name-only "$BASE"...HEAD | grep -q '^CHANGELOG\.md$'; then
  echo "::error file=CHANGELOG.md::CHANGELOG.md is managed by release-please and must not be edited manually."
  fail=1
fi

exit "$fail"
