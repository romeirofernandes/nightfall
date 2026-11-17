<img src="assets/icon.svg" width="64" height="64" alt="Nightfall">

# Nightfall

A little winter for your desktop. A native **Rust + Tauri 2** application with
a warm, rounded settings UI and a festive interactive landing page.

## Get started

Requires Rust stable, Node.js 20+, and npm. macOS also needs Xcode Command Line
Tools (`xcode-select --install`).

```sh
git clone https://github.com/romeirofernandes/nightfall.git
cd nightfall
```

**Arch Linux + Hyprland**

```sh
./scripts/install-arch.sh
~/.local/bin/nightfall
```

Or install the dependencies and build manually:

```sh
sudo pacman -S --needed rust nodejs npm base-devel \
  webkit2gtk-4.1 gtk3 gtk-layer-shell librsvg \
  libappindicator-gtk3 patchelf
npm ci
npm run build -- --no-bundle
./src-tauri/target/release/nightfall
```

Run from a Wayland Hyprland session, without sudo. On X11 or unsupported
compositors, the settings window still works and logs why the overlay is
unavailable.

**macOS**

```sh
./scripts/install-macos.sh
```

Or `npm ci && npm run build -- --bundles app`, then open
`src-tauri/target/release/bundle/macos/Nightfall.app`.
Local builds are unsigned. Signed/notarized distribution isn't configured.

## Use

Choose Flurry, Snow day, or Blizzard; adjust the breeze; toggle snowbanks,
icicles, snowman, and periodic plow. Settings save locally and atomically.
The tray menu reopens settings and quits the app. Closing settings hides the
window; choose **Quit** to stop all snow.

Hyprland autostart: add
`exec-once = /home/YOU/.local/bin/nightfall`
to your Hyprland config. macOS users can add their locally built app to Login
Items manually.

## Development

```sh
npm ci
npm run dev
cargo test --manifest-path src-tauri/Cargo.toml --locked
cargo fmt --manifest-path src-tauri/Cargo.toml --check
```

Landing page: `npm run web` → http://localhost:5173.
Buildless files are in `website/dist/`; the font is bundled locally.
The landing page detects the platform, offers a manual OS switch, and copies
the corresponding source-build commands. The live mountain desktop is an
illustrative browser demo, not a recording of the native overlay.

## Architecture and performance

- **Rust simulation:** at most 900 flakes per monitor; bounded 20 px banks,
  smooth drift, settling, icicle growth, periodic snowplow.
- **Linux:** native GTK3 + Cairo surfaces through Wayland layer shell; empty
  input regions and no keyboard focus. Read-only Hyprland window geometry is
  queried on worker threads every 500 ms. No full-screen browser on Linux.
- **macOS:** transparent click-through Tauri windows, one per monitor; Rust
  simulation rendered to canvas through sequential IPC, with no overlapping
  frame requests.
- **Settings:** one small system webview. No bundled Chromium, frontend
  framework, remote fonts, analytics, account, or background network requests.
- **Release:** size optimization, thin dependency surface, LTO, one codegen
  unit, stripped symbols, panic abort. Default 30 fps, optional 60 fps.
  Actual release binary size is measured separately; no unmeasured memory or
  battery claims.

## Verification and limitations

Rust tests cover pause, long-storm bounds, moved-window bank resets, and input
validation. Linux compilation and native Tauri startup have been verified on
the development VM. Landing-page desktop/mobile layout and OS switching have
been checked in a browser.

**macOS and a real Hyprland session still need runtime verification.**
macOS reads Quartz window geometry at 500 ms intervals; privacy settings may
limit the returned window list. No screen images or window titles are read. Icon/Dock discovery,
global shoveling, window occlusion, snowball fights, animated snowman, display
hotplug, and automatic login registration are not implemented. Fullscreen,
screen-lock, scaled multi-monitor behavior and tray availability need target
desktop testing. The app uses a frame timer; it does not claim zero idle CPU.
The settings preview intentionally animates independently of the native
overlay and honors reduced-motion preferences.

Python prototype history remains available before commit b3f0854; the current
app has no Python runtime dependency.

The public feature brief came from https://snowfallmac.com/. No original code,
assets, executable, or license mechanism was copied or modified. REA was set up
and its skill consulted; no binary analysis was performed.

### Latest local build

The optimized Linux executable is **4,877,576 bytes (4.65 MiB)**, excluding
system libraries. This is executable size, not resident memory. Four Rust tests
pass. The native settings UI was exercised to save Blizzard intensity, quit,
and relaunch with that preference restored. A macOS CI compilation and release
build passed; actual macOS overlay behavior remains unverified.
