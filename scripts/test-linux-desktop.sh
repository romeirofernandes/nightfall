#!/usr/bin/env bash
set -euo pipefail
script_dir="$(cd "$(dirname "$0")" && pwd)"
cli="$(realpath "$2")"
case "$1" in
  x11)
    export GDK_BACKEND=x11
    exec dbus-run-session -- xvfb-run -a -s '-screen 0 1280x800x24' bash -euc '
      xcompmgr &
      trap "kill $!" EXIT
      sleep 0.5
      python3 "$1" "$2"
    ' bash "$script_dir/test-desktop.py" "$cli"
    ;;
  wayland)
    exec dbus-run-session -- bash -euc '
      unset DISPLAY WAYLAND_DISPLAY SWAYSOCK
      export XDG_RUNTIME_DIR="$(mktemp -d /tmp/nf-wayland.XXXXXX)"
      export WLR_BACKENDS=headless WLR_RENDERER=pixman WLR_LIBINPUT_NO_DEVICES=1
      printf "xwayland disable\n" >"$XDG_RUNTIME_DIR/sway.conf"
      sway -c "$XDG_RUNTIME_DIR/sway.conf" >"$XDG_RUNTIME_DIR/sway.log" 2>&1 &
      compositor=$!
      cleanup() {
        kill "$compositor" 2>/dev/null || true
        wait "$compositor" 2>/dev/null || true
        cat "$XDG_RUNTIME_DIR/sway.log"
        rm -r "$XDG_RUNTIME_DIR"
      }
      trap cleanup EXIT
      for _ in {1..100}; do
        socket=$(find "$XDG_RUNTIME_DIR" -name "sway-ipc.*.sock" -print -quit)
        display=$(find "$XDG_RUNTIME_DIR" -name "wayland-*" -type s -print -quit)
        if [[ -n $socket && -n $display ]]; then break; fi
        kill -0 "$compositor"
        sleep 0.1
      done
      test -S "$socket" && test -S "$display"
      export SWAYSOCK="$socket" WAYLAND_DISPLAY="${display##*/}"
      GDK_BACKEND=wayland WAYLAND_DEBUG=client python3 "$1" "$2"
    ' bash "$script_dir/test-desktop.py" "$cli"
    ;;
  settings-only)
    export GDK_BACKEND=x11 NIGHTFALL_TEST_SETTINGS_ONLY=1
    exec dbus-run-session -- xvfb-run -a -s '-screen 0 1280x800x24' python3 "$script_dir/test-desktop.py" "$cli"
    ;;
  *)
    printf 'Usage: %s {x11|wayland|settings-only} CLI\n' "$0" >&2
    exit 2
    ;;
esac
