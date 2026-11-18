# Install and control

The shared `install.sh` downloads the current release and verifies the exact
asset against SHA256SUMS before installing per user. Override the release with
`NIGHTFALL_TAG=v0.4.0 bash distribution/install.sh`. Checksums detect damaged
downloads; they are served from the same GitHub release, not a separate signature.
It never installs system packages or enables autostart.

## Linux

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
The overlay runs on Wayland compositors with layer-shell and on composited X11.
The automated checks exercise headless Sway and X11. On uncomposited X11 and
Wayland sessions without layer-shell, Nightfall opens settings without an overlay.
Monitor additions require restart.
On Hyprland, `hyprctl` supplies the window and panel ledges. Other compositors show ground snow.

`nightfall disable` clears snow and releases pointer capture. `nightfall enable`
re-enables it, starting the app when stopped. `nightfall toggle`, `status`, and
`quit` control the current user's app through a private local socket.
Commands against a stopped app return a nonzero status, except `enable`, which starts it.
Run `nightfall` for terminal controls. Use arrows to select/change settings,
`q` to close controls while snow continues, and `x` to stop Nightfall.
The desktop launcher opens a terminal; the tray toggles snow or quits.

Linux installs `~/.local/bin/nightfall` and a desktop launcher. macOS installs
`~/Applications/Nightfall.app` and a CLI symlink in `~/.local/bin`.
`XDG_BIN_HOME` overrides the CLI directory. Existing settings are preserved.
The Go CLI lives in `~/.local/bin`; the Linux renderer lives in
`~/.local/lib/nightfall`. No autostart entry is created. To uninstall, quit and remove those installed
files. Settings remain in `$XDG_CONFIG_HOME/app.nightfall.desktop` on Linux
or `~/Library/Application Support/app.nightfall.desktop` on macOS.

## Windows

The portable x64 ZIP targets Windows 10 (1809 or later) and Windows 11 with
[Microsoft Edge WebView2 Runtime](https://developer.microsoft.com/microsoft-edge/webview2/).
Extract both executables into the same folder. Open `nightfall-renderer.exe` for
the tray app and settings. In PowerShell, use `.\nightfall.exe` for terminal
controls or `.\nightfall.exe status` to check the running app.

The snow fits each monitor's work area so the taskbar stays usable. Snow
accumulates on the ground. Restart Nightfall after changing the monitor layout.
Settings live in `%APPDATA%\app.nightfall.desktop`. The CLI uses a private
socket at `%LOCALAPPDATA%\Nightfall.sock` on a local NTFS volume. Windows
limits that socket path to 107 UTF-8 bytes. To remove Nightfall, quit from the
tray and delete the extracted folder. Settings stay in AppData.

The ZIP contains unsigned executables. Windows may show a SmartScreen prompt.

## Homebrew on macOS

```sh
brew tap --custom-remote romeirofernandes/nightfall https://github.com/romeirofernandes/nightfall
brew install --cask romeirofernandes/nightfall/nightfall
```

The cask installs the app and the `nightfall` CLI. Existing tap history conflict?
See [Homebrew recovery](HOMEBREW-RECOVERY.md).

## Build from source

Install Go (the version in `cli/go.mod`), Rust, Node 22 and native development dependencies. On Arch use
`scripts/install-arch.sh`; on macOS use `scripts/install-macos.sh`.
For Debian/Ubuntu install `libwebkit2gtk-4.1-dev libgtk-3-dev
libgtk-layer-shell-dev librsvg2-dev libayatana-appindicator3-dev patchelf`
plus a C compiler, then run:

```sh
npm --prefix desktop ci
cargo test --manifest-path desktop/src-tauri/Cargo.toml --locked
npm --prefix desktop run build -- --no-bundle
cd cli
NIGHTFALL_RENDERER="$PWD/../desktop/src-tauri/target/release/nightfall-renderer" go run .
```

## Release

A push of a matching `vMAJOR.MINOR.PATCH` tag triggers publication. The release
workflow builds Linux x64 and ARM64, Apple Silicon and Intel Mac, and Windows x64.
It verifies Mac signatures, smoke-tests the Windows ZIP, and publishes all five
archives with SHA256SUMS after every release job passes. Branch and PR runs build
and test without uploading release archives.

The separate macOS workflow supports optional Developer ID signing on a
matching tag. It uploads its bundles to Actions for that tag.
Ad-hoc releases require app-specific Gatekeeper approval; never disable it.
The Homebrew cask is updated only after published asset hashes are available.

## Source layout

- `cli/`: Go terminal controls and local socket client. Builds without GTK or cgo.
- `desktop/`: Rust/Tauri renderer, native platform integration, and overlay assets.
- `website/`: marketing site.
- `distribution/`: installers, release notes, and platform details.
- `docs/screenshots/`: development reference captures.

The terminal binary is portable across Linux distributions of the same CPU
architecture, including musl. The renderer still requires the documented native
libraries and a supported graphical compositor. It does not support every distro.
