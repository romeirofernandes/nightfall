#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
sudo pacman -S --needed go rust nodejs npm base-devel webkit2gtk-4.1 gtk3 gtk-layer-shell librsvg libappindicator-gtk3 patchelf
npm --prefix desktop ci
npm --prefix desktop run build -- --no-bundle
bin=${XDG_BIN_HOME:-$HOME/.local/bin}
mkdir -p "$bin/../lib/nightfall"
install -m755 desktop/src-tauri/target/release/nightfall-renderer "$bin/../lib/nightfall/nightfall-renderer"
(cd cli && CGO_ENABLED=0 go build -trimpath -o "$bin/nightfall" .)
echo "Installed. Run: $HOME/.local/bin/nightfall"
