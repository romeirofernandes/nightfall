#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
sudo pacman -S --needed python python-gobject python-cairo gtk3 gtk-layer-shell
python -m venv --system-site-packages .venv
.venv/bin/python -m pip install --no-deps .
echo "Ready: .venv/bin/nightfall"
