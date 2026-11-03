#!/usr/bin/env bash
set -euo pipefail

watchman watch-del $PWD || true
watchman watch-project $PWD