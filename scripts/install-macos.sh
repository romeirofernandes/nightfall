#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
command -v cargo >/dev/null || { echo "Install Rust first: https://rustup.rs"; exit 1; }
command -v npm >/dev/null || { echo "Install Node.js first: https://nodejs.org"; exit 1; }
npm --prefix desktop ci
npm --prefix desktop run build -- --bundles app
mkdir -p "$HOME/.local/bin" "$HOME/Applications"
(cd cli && CGO_ENABLED=0 go build -trimpath -o "$HOME/.local/bin/nightfall" .)
codesign --force --sign - "$HOME/.local/bin/nightfall"
cp -R desktop/src-tauri/target/release/bundle/macos/Nightfall.app "$HOME/Applications/"
echo 'Installed. Run ~/.local/bin/nightfall in a terminal.'
