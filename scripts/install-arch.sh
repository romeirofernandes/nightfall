#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
sudo pacman -S --needed rust nodejs npm base-devel webkit2gtk-4.1 gtk3 gtk-layer-shell librsvg libappindicator-gtk3 patchelf
npm ci
npm run build -- --no-bundle
install -Dm755 src-tauri/target/release/nightfall "${XDG_BIN_HOME:-$HOME/.local/bin}/nightfall"
echo "Installed. Run: $HOME/.local/bin/nightfall"
