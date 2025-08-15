#!/bin/bash
# replace_use_dom.sh
# Usage:
#   ./replace_use_dom.sh [ -r ] [PATH]
#     -r = recurse into subfolders
#   PATH defaults to current directory

RECURSIVE=0
if [[ "${1:-}" == "-r" ]]; then
  RECURSIVE=1
  shift
fi

TARGET_DIR="${1:-.}"

# Replacement content
NEW_CONTENT='"use dom";

import LittleWorldWebLazy from "@/src/components/blocks/LittleWorldWebLazy";
import { Suspense } from "react";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LittleWorldWebLazy />
    </Suspense>
  );
}'

process_file() {
  local file="$1"

  # Only process TypeScript/React files
  if [[ ! "$file" =~ \.(tsx?|jsx?)$ ]]; then
    return
  fi

  # Check if file contains "use dom" (case insensitive, with quotes)
  if grep -qi '"use dom"' "$file" 2>/dev/null; then
    printf '%s\n' "$NEW_CONTENT" > "$file"
    echo "Replaced: $file"
  fi
}

if [[ $RECURSIVE -eq 1 ]]; then
  # Recursive (portable across GNU/BSD find)
  find "$TARGET_DIR" -type f \( -name "*.tsx" -o -name "*.ts" -o -name "*.jsx" -o -name "*.js" \) ! -name '.*' -print0 | while IFS= read -r -d '' f; do
    process_file "$f"
  done
else
  # Top-level only
  for f in "$TARGET_DIR"/*; do
    [[ -f "$f" ]] || continue
    process_file "$f"
  done
fi