#!/usr/bin/env python3
"""Render the preview-builds Markdown table, merging the new build row into any existing block read from CURRENT_BODY."""
from __future__ import annotations

import os
import re
import sys

MARK_START = "<!-- preview-builds:start -->"
MARK_END = "<!-- preview-builds:end -->"
HEADING = "### Preview builds"
HEADER_ROW = "| Built (UTC) | Commit | Android | iOS |"
SEP_ROW = "|---|---|---|---|"
EMPTY_CELL = "—"
SUBJECT_MAX = 80
SHA_IN_BACKTICKS = re.compile(r"`([0-9a-f]{4,40})`")
ESCAPED_PIPE = "\\|"
PIPE_PLACEHOLDER = "\x00ESC_PIPE\x00"


def short_sha(sha: str) -> str:
    return sha[:7]


def sanitize_subject(msg: str) -> str:
    first = (msg or "").splitlines()[0] if msg else ""
    if len(first) > SUBJECT_MAX:
        first = first[: SUBJECT_MAX - 1].rstrip() + "…"
    return first.replace("|", r"\|")


def commit_cell(sha: str, commit_url: str, subject: str) -> str:
    return f"[`{short_sha(sha)}`]({commit_url}) — {sanitize_subject(subject)}"


def platform_cell(ext: str, url: str) -> str:
    return f"[.{ext}]({url})"


def parse_rows(block: str) -> dict[str, dict[str, str]]:
    rows: dict[str, dict[str, str]] = {}
    for raw in block.splitlines():
        line = raw.strip()
        if not line.startswith("|") or line in (HEADER_ROW, SEP_ROW):
            continue
        protected = line.replace(ESCAPED_PIPE, PIPE_PLACEHOLDER)
        cells = [
            c.strip().replace(PIPE_PLACEHOLDER, ESCAPED_PIPE)
            for c in protected.strip("|").split("|")
        ]
        if len(cells) != 4:
            continue
        ts, commit, android, ios = cells
        m = SHA_IN_BACKTICKS.search(commit)
        if not m:
            continue
        rows[m.group(1)] = {"ts": ts, "commit": commit, "android": android, "ios": ios}
    return rows


def render_block(rows: dict[str, dict[str, str]]) -> str:
    lines = [MARK_START, HEADING, "", HEADER_ROW, SEP_ROW]
    for _, r in sorted(rows.items(), key=lambda kv: kv[1]["ts"], reverse=True):
        lines.append(f"| {r['ts']} | {r['commit']} | {r['android']} | {r['ios']} |")
    lines.append(MARK_END)
    return "\n".join(lines)


def main() -> int:
    body = os.environ.get("CURRENT_BODY") or ""
    platform = os.environ["PLATFORM"]
    url = os.environ["URL"]
    ext = os.environ["EXT"]
    sha_full = os.environ["COMMIT_SHA"]
    subject = os.environ.get("COMMIT_MSG", "")
    commit_url = os.environ["COMMIT_URL"]
    ts = os.environ["TIMESTAMP"]

    if platform not in ("android", "ios"):
        print(f"unsupported PLATFORM={platform!r}", file=sys.stderr)
        return 2

    block_re = re.compile(
        re.escape(MARK_START) + r".*?" + re.escape(MARK_END),
        re.DOTALL,
    )
    match = block_re.search(body)
    rows = parse_rows(match.group(0)) if match else {}

    key = short_sha(sha_full)
    row = rows.get(
        key,
        {"ts": ts, "commit": "", "android": EMPTY_CELL, "ios": EMPTY_CELL},
    )
    row["ts"] = ts
    row["commit"] = commit_cell(sha_full, commit_url, subject)
    row[platform] = platform_cell(ext, url)
    rows[key] = row

    new_block = render_block(rows)
    if match:
        new_body = body[: match.start()] + new_block + body[match.end():]
    else:
        new_body = new_block + ("\n\n" + body if body else "")

    sys.stdout.write(new_body)
    return 0


if __name__ == "__main__":
    sys.exit(main())
