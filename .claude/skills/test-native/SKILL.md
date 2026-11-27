---
name: test-native
description: Test a Little World change in the native app on the Android emulator — scripted Maestro flows first, the maestro MCP for anything not scripted — covering acceptance criteria plus regression flows. Use when the user says "/test-native [target]", asks to test/verify a change in the app, or a pipeline calls it for native changes.
argument-hint: '[checkout path | branch | PR url | issue url] [acceptance criteria]'
---

Test target: $ARGUMENTS

App tests: scripted flows in `e2e_simulations/maestro/` driven by `e2e_simulations/tests/_android.py` (e2e submodule, run with its venv), next to web pages from `_flows.py` for a second user. The maestro MCP only for steps no flow covers. Web/API-only changes: the backend repo's `test-changes` skill.

## Resolve

- Checkout: the given path; a branch / PR (`gh pr view <url> --json headRefName`) / issue (`gh issue develop --list <url>`) → its checkout; nothing given → the current directory.
- `frontend` is the shared frontend submodule: make sure it is on the branch's pointer (`git submodule update --init frontend`, or the same-named branch if it has unpushed work).
- Acceptance criteria: given, or derived from the issue/PR. None derivable → ask the user.
- Change touches native code/config (android/, ios/, plugins/, app.config.ts, native deps) → stop: it needs a new dev build, those come from CI only; ask before triggering anything.

## Stack

Read `scenarios/_setup-native.md`: emulator, dev build, Metro (with the integrity bypass token), backend, adb reverse. Another stack already running → ask before stopping anything.

## Plan

Write the plan before running anything: (a) every acceptance criterion, (b) every flow sharing code with the change (callers, shared components, nav paths) for regressions. Find (b) from the diff (`git diff $(git merge-base origin/main HEAD)`) and grepping for usages.

Known steps live in `scenarios/`. Read `scenarios/INDEX.md`, then open only the files whose keywords match the plan.

## Run

- Compose each check from `_android.py` + `_flows.py` helpers into one Python script (example in `_setup-native.md`) and run it in a single call; screenshots/assertions in the script or as Maestro `takeScreenshot`.
- Never use the maestro MCP while a Maestro CLI run is active: both drive the same on-device server and break each other.
- A flow fails → run the sanity check `bash e2e_simulations/run_android.sh`: it fails too → the flow is outdated (report it, fix it under Record); it passes → the change broke something.

Don't edit app code here — on failure capture steps, expected vs actual, screenshot and relevant Metro/backend logs, then continue with the rest of the plan.

Video only when asked: wrap just the steps that show each criterion in `record_app_and_pages(...)`, not setup or login.

## Record

- Worked out an automatable step no flow covers (or fixed an outdated one)? Add a subflow in `maestro/subflows/` (+ a test in `tests/android/test_android_flows.py`), run the sanity check, commit in the e2e submodule and bump its pointer (here and in the backend host branch).
- Non-obvious knowledge a scenario file lacks? Add it to the matching file, or create one (one flow per file, ≤40 lines) and add its line to `INDEX.md`.

## Output

First line exactly `RESULT: PASS` or `RESULT: FAIL`, then the plan with pass/fail per item, failure details, screenshots of key states, and video paths if recorded. Leave Metro/emulator running only if the user wants them.
