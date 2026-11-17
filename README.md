<img src="assets/icon.svg" width="64" height="64" alt="">

# Nightfall

An independent desktop snow app for macOS and Arch Linux / Hyprland.
Native transparent overlays, falling flakes, soft snow banks, window ledges,
icicles, a small snowman, and a snowplow. No license server, network requests,
copied commercial code, or commercial assets.

## Run

Requires Python 3.11+. On Arch, from this directory:

```sh
./scripts/install-arch.sh
.venv/bin/nightfall
```

Run inside your Hyprland session (not with sudo). GTK layer shell uses the
overlay layer, an empty input region, no exclusive zone, and no keyboard focus.
Window positions come from read-only `hyprctl -j` queries. Each connected
monitor gets an overlay using logical coordinates.

On macOS, with Python 3 installed:

```sh
./scripts/install-macos.sh
.venv/bin/nightfall
```

The snowflake menu offers pause/resume, intensity, plow, and quit. AppKit
overlays join Spaces and ignore mouse input. Quartz supplies on-screen window
geometry. Depending on macOS privacy settings, window discovery may require
Screen Recording permission for the terminal/Python launcher; falling snow
still works without window geometry. No screen pixels or window text are read.

## Interactive simulation

```sh
python3 -m nightfall --preview --intensity blizzard
```

Linux preview requires GTK3, PyGObject, and Pycairo but no Wayland compositor.
It shows sample ledges and supports clicking/dragging through snow. Its header
has intensity, pause, and plow controls. Desktop overlays always pass clicks
through. Stop with Ctrl+C from the terminal (or Quit in the Mac menu).

Options: `--intensity light|normal|blizzard`, `--fps 15|30|60`,
`--no-snowman`, `--no-icicles`, `--no-plow`.

On Linux, send SIGUSR1 to the process to toggle pause and SIGUSR2 to send the
plow. For example, `pkill -USR1 -f '^/absolute/path/to/.venv/bin/python.*nightfall'`.
Use the exact process PID with `kill` if several instances are running.

## Start at login

Hyprland: add `exec-once = /absolute/path/to/nightfall/.venv/bin/nightfall`
to your Hyprland configuration. Remove the line to disable.

macOS: add a launcher for the installed command through your preferred login
launcher. An app bundle and automatic Login Items registration are not provided.

## Verification and current limits

```sh
python3 -m unittest discover -s tests -v
python3 -m compileall -q nightfall
```

The simulation is tested for landing, moved-window clearing, pause, plowing,
shoveling, finite output, and bounded particles/accumulation through a long
blizzard. Linux GTK preview has been run on the development VM.

This is an early implementation, **not a verified 1:1 replacement**. Native
macOS and Hyprland overlays need testing on the actual target desktops.
Unimplemented: desktop icon and Dock discovery, snowball fights, snowman
animation, global mouse shoveling, persistent preferences, automatic login
setup, and packaged installers. The plow currently clears the screen bottom.
Overlapping window edges are not occlusion-filtered. Display hotplug requires
restart. The simulation uses a fixed frame timer; it does not claim zero idle
CPU or measured battery performance. Fullscreen/lock-screen behavior needs
target-system validation.

## Implementation evidence

The feature brief came from the public description at
https://snowfallmac.com/ on 2026-11-17. No original executable was downloaded,
decompiled, or run. The native adapters are original implementations using
AppKit/Quartz and GTK layer shell. REA setup was run with Node 24 and the REA
skill installed for Codex; no native analysis provider is configured. Public
marketing claims are not evidence of runtime equivalence.
