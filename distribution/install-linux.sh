#!/usr/bin/env bash
# Compatibility entry point for the shared Linux/macOS installer.
set -euo pipefail
[[ $(uname -s) == Linux ]] || { echo 'Use install.sh on macOS.' >&2; exit 1; }
script=$(mktemp)
trap 'rm -f "$script"' EXIT
curl -fsSL https://raw.githubusercontent.com/romeirofernandes/nightfall/main/distribution/install.sh -o "$script"
bash "$script"
