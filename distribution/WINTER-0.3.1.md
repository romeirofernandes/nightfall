# Winter update 0.3.1

## Controls

- Snow on ledges: tapered drifts retain local height differences and shed excess
  snow. Icicles use stable irregular spacing, width, length and lean.
- Visible bottom macOS Dock windows can now be snow surfaces. Hyprland layer
  namespaces containing dock, waybar or panel can receive snow too. Bounds are
  refreshed twice a second; moved surfaces release their snow.
- Santa's schedule: enable automatic visits, choose 15 seconds to one hour, or
  send Santa now. A nine-second sleigh/reindeer sweep clears every snow surface.
- Snowmen & decorations: 0–12 snowmen, 0–12 trees, 0–20 gifts; shared snowman
  scale and shared tree/gift scale from 0.4x to 2.5x; window lights and hangings.
- Make a snowball: explicitly enter play mode, grab actual accumulated snow near
  a ledge or ground, drag and flick. Exit with Escape or the overlay Exit bar.
  Mouse capture is active only in this mode. Starting the app always disables it.

## Physics and limits

The bounded 2D model removes snow from the sampled bank to form a ball. Flick
velocity is smoothed and bounded; held momentum decays if you stop moving.
Balls use gravity, light wind/drag, four integration substeps, swept ledge
crossings, wall/ledge restitution, rolling friction and hard-impact breakup.
They continue moving when play mode ends. This is not a 3D rigid-body simulator.
There are at most 900 flakes and 24 snowballs per display. Vector artwork is
shared between native Cairo and the macOS system webview; no raster pack or
additional browser runtime was added. Mac downloads are about 1.6–1.7 MB.

## Verification and provenance

- Ten Rust regressions pass, including old-settings migration, drift taper and
  shedding, cleanup timing/manual visits, snow collection, momentum, bounce,
  breakup and finite/bounded scene geometry.
- Linux/macOS desktop CI and both Mac release architectures passed. The Mac
  workflow verifies signatures; archive plists and zip integrity were checked.
- Native layer-shell rendering ran in nested Sway with deterministic hyprctl
  geometry fixtures for a window and dock. A real virtual-pointer client proved
  ordinary click-through, native Settings expansion, play-mode entry, pickup and
  flick/throw, and overlay exit. Virtual keyboard checks exercised Escape both
  with Settings focused and after throwing from the overlay.
- Settings controls and persistence were also exercised in the browser preview.
- 0.3.1 adds Settings-side Escape handling, supplementing the overlay handler.
  GTK child input regions are emptied outside play mode.
- Public archives and casks have SHA-256 checksums. The Homebrew workflow checks
  install/signature/version/uninstall on Apple Silicon and Intel, including
  recovery from the old unrelated tap history.

Real Mac Dock detection and real Hyprland hardware input still need on-device
confirmation. Geometry fixtures are not represented as hardware testing. The
Mac release remains ad-hoc signed, not notarized; a new build may need app-specific
Open Anyway approval. No battery, frame-time or memory benchmark is claimed.
