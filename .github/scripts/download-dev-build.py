"""Download the newest Android dev client whose commit is in the current branch.

Candidates: `*-development-android.apk` release assets (production-release workflow) and
`*-development-android` artifacts of successful Build Application runs (e.g. a manual run
for native changes). Needs `gh` (GH_TOKEN) and full git history.

Usage: python3 download-dev-build.py <output-dir>  -> prints the APK path
"""

import json
import subprocess
import sys
from pathlib import Path

SUFFIX = "-development-android"


def gh(*args: str):
    return json.loads(subprocess.run(["gh", *args], check=True, capture_output=True, text=True).stdout)


def in_current_branch(sha: str) -> bool:
    ancestor = subprocess.run(["git", "merge-base", "--is-ancestor", sha, "HEAD"], check=False, capture_output=True)
    return ancestor.returncode == 0


def commit_time(sha: str) -> int:
    return int(
        subprocess.run(["git", "log", "-1", "--format=%ct", sha], check=True, capture_output=True, text=True).stdout
    )


def release_candidates():
    for release in gh("api", "repos/{owner}/{repo}/releases?per_page=30"):
        asset = next((a for a in release["assets"] if a["name"].endswith(f"{SUFFIX}.apk")), None)
        if asset:
            sha = gh("api", f"repos/{{owner}}/{{repo}}/commits/{release['tag_name']}")["sha"]
            yield sha, ("release", release["tag_name"], asset["name"])


def artifact_candidates():
    runs = gh("api", "repos/{owner}/{repo}/actions/workflows/build-application.yml/runs?status=success&per_page=50")
    for run in runs["workflow_runs"]:
        artifacts = gh("api", f"repos/{{owner}}/{{repo}}/actions/runs/{run['id']}/artifacts")["artifacts"]
        artifact = next((a for a in artifacts if a["name"].endswith(SUFFIX) and not a["expired"]), None)
        if artifact:
            yield run["head_sha"], ("artifact", str(run["id"]), artifact["name"])


def main(out_dir: Path) -> None:
    candidates = [
        (sha, source) for sha, source in [*release_candidates(), *artifact_candidates()] if in_current_branch(sha)
    ]
    if not candidates:
        sys.exit(f"no {SUFFIX} build whose commit is in this branch")
    sha, (kind, ref, name) = max(candidates, key=lambda candidate: commit_time(candidate[0]))
    print(f"using {kind} {ref} ({name}, commit {sha[:8]})", file=sys.stderr)
    out_dir.mkdir(parents=True, exist_ok=True)
    if kind == "release":
        subprocess.run(["gh", "release", "download", ref, "-p", name, "-D", str(out_dir), "--clobber"], check=True)
    else:
        subprocess.run(["gh", "run", "download", ref, "-n", name, "-D", str(out_dir)], check=True)
    print(next(out_dir.glob("*.apk")))


if __name__ == "__main__":
    main(Path(sys.argv[1]))
