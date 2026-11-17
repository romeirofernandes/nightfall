# Install and control

The shared `install.sh` downloads the current release and verifies the exact
asset against SHA256SUMS before installing per user. Override the release with
`NIGHTFALL_TAG=v0.4.0 bash distribution/install.sh`. Checksums detect damaged
downloads; they are served from the same GitHub release, not a separate signature.
It never installs system packages or enables autostart.

Linux x86_64 / ARM64 dependencies:

```sh
# Arch
sudo pacman -S --needed webkit2gtk-4.1 gtk3 gtk-layer-shell librsvg libappindicator-gtk3
# Ubuntu 22.04 / Debian with WebKitGTK 4.1 available
sudo apt install libwebkit2gtk-4.1-0 libgtk-3-0 libgtk-layer-shell0 librsvg2-2 libayatana-appindicator3-1
# Fedora
sudo dnf install webkit2gtk4.1 gtk3 gtk-layer-shell librsvg2 libappindicator-gtk3
```

Linux x86_64 is built on Ubuntu 22.04; ARM64 on Ubuntu 24.04.
Older glibc systems and musl distributions such as Alpine are not supported
by these downloads. Building from source requires the listed native libraries.
Hyprland is tested on the owner's laptop. Other layer-shell compositors are
protocol-compatible but not independently tested. Composited X11 has an
experimental overlay fallback that has not been runtime-tested. Native GNOME
and KDE Wayland sessions lack layer-shell; settings can still open there.
Monitor additions require restart.
Window ledges use `hyprctl`; other compositors show desktop snow only.

`nightfall disable` clears snow and releases pointer capture. `nightfall enable`
re-enables it, starting the app when stopped. `nightfall toggle`, `status`, and
`quit` control the current user's app through a private local Unix socket.
Commands against a stopped app return a nonzero status, except `enable`, which starts it.
Run `nightfall` for terminal controls. Use arrows to select/change settings,
`q` to close controls while snow continues, and `x` to stop Nightfall.
The desktop launcher opens a terminal; the tray toggles snow or quits.

Linux installs `~/.local/bin/nightfall` and a desktop launcher. macOS installs
`~/Applications/Nightfall.app` and a CLI symlink in `~/.local/bin`.
`XDG_BIN_HOME` overrides the CLI directory. Existing settings are preserved.
No autostart entry is created. To uninstall, quit and remove those installed
files. Settings remain in `$XDG_CONFIG_HOME/app.nightfall.desktop` on Linux
or `~/Library/Application Support/app.nightfall.desktop` on macOS.

## Homebrew on macOS

```sh
brew tap --custom-remote romeirofernandes/nightfall https://github.com/romeirofernandes/nightfall
brew install --cask romeirofernandes/nightfall/nightfall
```

The cask installs the app and the `nightfall` CLI. Existing tap history conflict?
See [Homebrew recovery](HOMEBREW-RECOVERY.md).

## Build from source

Install Rust, Node 22 and native development dependencies. On Arch use
`scripts/install-arch.sh`; on macOS use `scripts/install-macos.sh`.
For Debian/Ubuntu install `libwebkit2gtk-4.1-dev libgtk-3-dev
libgtk-layer-shell-dev librsvg2-dev libayatana-appindicator3-dev patchelf`
plus a C compiler, then run:

```sh
npm ci
cargo test --manifest-path src-tauri/Cargo.toml --locked
npm run build -- --no-bundle
src-tauri/target/release/nightfall
```

## Release

Push a matching `vMAJOR.MINOR.PATCH` tag. The release workflow tests and builds
Linux x64 plus Apple Silicon and Intel Mac apps, verifies Mac signatures,
and publishes all three archives with SHA256SUMS only after every build passes.
The separate macOS dispatch workflow supports optional Developer ID signing.
Ad-hoc releases require app-specific Gatekeeper approval; never disable it.
The Homebrew cask is updated only after published asset hashes are available.
