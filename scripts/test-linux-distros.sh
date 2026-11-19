#!/usr/bin/env bash
# Run the same distributable binaries with each distro's runtime libraries.
set -euo pipefail
cd "$(dirname "$0")/.."
binary_dir="$(realpath "${1:-desktop/src-tauri/target/release}")"
check() {
  local image=$1 install=$2
  printf '\nTesting %s\n' "$image"
  docker run --rm --shm-size=256m \
    -v "$binary_dir:/nightfall:ro" -v "$PWD/scripts:/source/scripts:ro" -v "$PWD/distribution:/source/distribution:ro" \
    "$image" bash -euo pipefail -c '
      bash -euc "$1"
      ldd /nightfall/nightfall-renderer | tee /tmp/nightfall-libraries
      if grep -q "not found" /tmp/nightfall-libraries; then exit 1; fi
      python3 /source/scripts/test-installer.py
      # The isolated test container does not permit nested sandbox namespaces.
      export WEBKIT_DISABLE_SANDBOX_THIS_IS_DANGEROUS=1
      export LIBGL_ALWAYS_SOFTWARE=1
      bash /source/scripts/test-linux-desktop.sh x11 /nightfall/nightfall
    ' bash "$install"
}
failed=0
check debian:13-slim 'apt-get update && apt-get install -y --no-install-recommends python3 ca-certificates libwebkit2gtk-4.1-0 libgtk-3-0 libgtk-layer-shell0 librsvg2-2 libayatana-appindicator3-1 xvfb xauth xdotool xcompmgr dbus-x11 fonts-dejavu-core' || failed=1
check fedora:44 'dnf install -y --setopt=install_weak_deps=False python3 webkit2gtk4.1 gtk3 gtk-layer-shell librsvg2 libappindicator-gtk3 xorg-x11-server-Xvfb xorg-x11-xauth xdotool xcompmgr dbus-daemon dejavu-sans-fonts' || failed=1
check archlinux:latest 'pacman -Syu --noconfirm --needed python webkit2gtk-4.1 gtk3 gtk-layer-shell librsvg libappindicator-gtk3 xorg-server-xvfb xorg-xauth xdotool xcompmgr dbus ttf-dejavu' || failed=1
exit "$failed"
