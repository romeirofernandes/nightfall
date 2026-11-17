# Install and control

The shared `install.sh` downloads the current release and verifies the exact
asset against SHA256SUMS before installing per user. Override the release with
`NIGHTFALL_TAG=v0.4.0 bash distribution/install.sh`. Checksums detect damaged
downloads; they are served from the same GitHub release, not a separate signature.
It never installs system packages or enables autostart.

Linux x86_64 dependencies:

```sh
# Arch
sudo pacman -S --needed webkit2gtk-4.1 gtk3 gtk-layer-shell librsvg libappindicator-gtk3
# Ubuntu 22.04 / Debian with WebKitGTK 4.1 available
sudo apt install libwebkit2gtk-4.1-0 libgtk-3-0 libgtk-layer-shell0 librsvg2-2 libayatana-appindicator3-1
# Fedora
sudo dnf install webkit2gtk4.1 gtk3 gtk-layer-shell librsvg2 libappindicator-gtk3
```

The Linux archive is built on Ubuntu 22.04. Older glibc systems are not supported.
Hyprland is tested on the owner's laptop. Other layer-shell compositors are
protocol-compatible but not independently tested. GNOME, KDE and X11 have no
overlay support; settings can still open. Monitor additions require restart.
Window ledges use `hyprctl`; other compositors show desktop snow only.

`nightfall disable` clears snow and releases pointer capture. `nightfall enable`
re-enables it, starting the app when stopped. `nightfall toggle`, `status`, and
`quit` control the current user's app through a private local Unix socket.
Commands against a stopped app return a nonzero status, except `enable`, which starts it.
Closing settings hides them; use Quit or `nightfall quit` to exit.

Linux installs `~/.local/bin/nightfall` and a desktop launcher. macOS installs
`~/Applications/Nightfall.app` and a CLI symlink in `~/.local/bin`.
`XDG_BIN_HOME` overrides the CLI directory. Existing settings are preserved.
No autostart entry is created. To uninstall, quit and remove those installed
files. Settings remain in `$XDG_CONFIG_HOME/app.nightfall.desktop` on Linux
or `~/Library/Application Support/app.nightfall.desktop` on macOS.

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
