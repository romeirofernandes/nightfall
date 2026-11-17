#!/usr/bin/env bash
# Per-user installer. No sudo and no automatic dependency installation.
set -euo pipefail
repo=romeirofernandes/nightfall
case "$(uname -s):$(uname -m)" in
  Linux:x86_64) platform=linux-x64; suffix=tar.gz ;;
  Linux:aarch64|Linux:arm64) platform=linux-arm64; suffix=tar.gz ;;
  Darwin:arm64) platform=arm64; suffix=zip ;;
  Darwin:x86_64) platform=x64; suffix=zip ;;
  *) echo 'Supported downloads: Linux x86_64/ARM64, macOS Apple Silicon and Intel.' >&2; exit 1 ;;
esac
for tool in curl tar awk; do command -v "$tool" >/dev/null || { echo "Missing $tool" >&2; exit 1; }; done
command -v sha256sum >/dev/null || command -v shasum >/dev/null || { echo "Missing sha256sum or shasum" >&2; exit 1; }
if [[ $platform == linux-* ]]; then
  echo 'Requires GTK 3, WebKitGTK 4.1, gtk-layer-shell and AppIndicator. See distribution/README.md.'
fi
tag=${NIGHTFALL_TAG:-}
if [[ -z $tag ]]; then
  url=$(curl -fsSL -o /dev/null -w '%{url_effective}' "https://github.com/$repo/releases/latest")
  tag=${url##*/}
fi
[[ $tag =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]] || { echo 'Invalid release tag' >&2; exit 1; }
asset=Nightfall-${tag#v}-$platform.$suffix
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
base=https://github.com/$repo/releases/download/$tag
curl -fsSL "$base/$asset" -o "$work/$asset"
curl -fsSL "$base/SHA256SUMS" -o "$work/SHA256SUMS"
expected=$(awk -v name="$asset" '$2 == name {print $1}' "$work/SHA256SUMS")
[[ $expected =~ ^[a-f0-9]{64}$ ]] || { echo 'Missing or ambiguous asset checksum' >&2; exit 1; }
if command -v sha256sum >/dev/null; then actual=$(sha256sum "$work/$asset"); else actual=$(shasum -a 256 "$work/$asset"); fi
[[ ${actual%% *} == "$expected" ]] || { echo 'Checksum mismatch' >&2; exit 1; }
bin=${XDG_BIN_HOME:-$HOME/.local/bin}
mkdir -p "$bin"
if [[ $platform == linux-* ]]; then
  tar -xzf "$work/$asset" -C "$work"
  # Old releases contain one binary; new releases separate terminal controls.
  if [[ -f $work/nightfall-renderer ]]; then
    mkdir -p "$bin/../lib/nightfall"
    install -m755 "$work/nightfall-renderer" "$bin/../lib/nightfall/.nightfall-renderer.$$"
    mv -f "$bin/../lib/nightfall/.nightfall-renderer.$$" "$bin/../lib/nightfall/nightfall-renderer"
  fi
  install -m755 "$work/nightfall" "$bin/.nightfall.$$"
  mv -f "$bin/.nightfall.$$" "$bin/nightfall"
  apps=${XDG_DATA_HOME:-$HOME/.local/share}/applications
  mkdir -p "$apps"
  [[ $bin != *$'\n'* && $bin != *$'\r'* && $bin != *'"'* && $bin != *'%'* && $bin != *'`'* && $bin != *'$'* && $bin != *'\\'* ]] || { echo 'Unsupported launcher path' >&2; exit 1; }
  cat > "$apps/nightfall.desktop" <<DESKTOP
[Desktop Entry]
Type=Application
Name=Nightfall
Comment=A little winter for your desktop
Exec="$bin/nightfall"
Terminal=true
Categories=Utility;
DESKTOP
else
  command -v ditto >/dev/null
  ditto -xk "$work/$asset" "$work"
  codesign --verify --deep --strict "$work/Nightfall.app"
  mkdir -p "$HOME/Applications"
  if [[ -e $HOME/Applications/Nightfall.app ]]; then
    echo 'Quit Nightfall before updating. Replacing the per-user application.'
    "$HOME/Applications/Nightfall.app/Contents/MacOS/nightfall" quit || true
  fi
  rm -rf "$HOME/Applications/Nightfall.app"
  mv "$work/Nightfall.app" "$HOME/Applications/Nightfall.app"
  if [[ -f $work/nightfall ]]; then
    # Replace an old CLI symlink without overwriting its target inside the app.
    rm -f "$bin/nightfall"
    install -m755 "$work/nightfall" "$bin/.nightfall.$$"
  mv -f "$bin/.nightfall.$$" "$bin/nightfall"
  else
    ln -sfn "$HOME/Applications/Nightfall.app/Contents/MacOS/nightfall" "$bin/nightfall"
  fi
fi
printf 'Installed %s. Add %s to PATH.\nRun: nightfall\nDisable snow: nightfall disable\nStop: nightfall quit\n' "$tag" "$bin"
