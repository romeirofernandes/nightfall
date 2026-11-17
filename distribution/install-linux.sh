#!/bin/sh
# Install the checksum-verified Nightfall binary on Arch Linux x64.
set -eu
[ "$(uname -s)" = Linux ] || { echo "This installer is for Linux."; exit 1; }
[ "$(uname -m)" = x86_64 ] || { echo "This release supports Linux x64."; exit 1; }
command -v pacman >/dev/null || { echo "Install on Arch Linux with pacman."; exit 1; }
sudo pacman -S --needed webkit2gtk-4.1 gtk3 gtk-layer-shell librsvg libappindicator-gtk3
nf_tmp=$(mktemp -d)
trap 'rm -rf "$nf_tmp"' 0
cd "$nf_tmp"
nf_base=https://github.com/romeirofernandes/nightfall/releases/download/v0.3.0
curl -fLO "$nf_base/Nightfall-0.3.0-linux-x64.tar.gz"
curl -fLO "$nf_base/SHA256SUMS"
sha256sum --ignore-missing -c SHA256SUMS
tar -xzf Nightfall-0.3.0-linux-x64.tar.gz
install -Dm755 nightfall "$HOME/.local/bin/nightfall"
printf '%s\n' "Installed Nightfall. Run ~/.local/bin/nightfall inside Hyprland."
