#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
command -v cargo >/dev/null || { echo "Install Rust first: https://rustup.rs"; exit 1; }
command -v npm >/dev/null || { echo "Install Node.js first: https://nodejs.org"; exit 1; }
npm ci
npm run build -- --bundles app
open src-tauri/target/release/bundle/macos/Nightfall.app
