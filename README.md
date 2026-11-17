<p align="center"><img src="assets/icon.svg" width="64" alt="Nightfall"></p>

# nightfall

a little snow on your desktop. a tiny snowman. a very good excuse to stay in.

Rust + Tauri, with a native GTK overlay on Linux and desktop windows on macOS.

![a snowy desktop with T3 Code](assets/readme/desktop.jpg)

*Generated, sanitized desktop illustration. Fictional T3 Code content.*

### install

Linux x86_64 or ARM64, Apple Silicon Mac, or Intel Mac:

```sh
curl -fsSL https://raw.githubusercontent.com/romeirofernandes/nightfall/main/distribution/install.sh -o /tmp/nightfall-install.sh
bash /tmp/nightfall-install.sh
```

Add `~/.local/bin` to your PATH, then:

```sh
nightfall          # terminal controls
nightfall disable # clear the desktop
nightfall enable  # bring back the snow, or start the app
nightfall status
nightfall quit    # stop the app
```

Use Up/Down to select a setting and Left/Right to change it.
`q` closes the TUI while snow keeps running; `x` stops Nightfall.

Linux needs GTK 3, WebKitGTK 4.1, gtk-layer-shell and AppIndicator.
Hyprland is the primary Linux target, including snow on window ledges.
Other Wayland compositors need the layer-shell protocol; window ledges are
Hyprland-specific. Composited X11 desktops have an experimental borderless
overlay fallback. Native Wayland desktops without layer-shell, including
GNOME and KDE, do not support the overlay.
Reconnect a monitor? Restart Nightfall to create its overlay.

On Mac, open `~/Applications/Nightfall.app` once and approve it in
Privacy & Security if Gatekeeper asks. Downloads are ad-hoc signed, not
Apple-notarized. Keep Gatekeeper enabled.

The [Homebrew install](distribution/HOMEBREW-RECOVERY.md) remains available.
[Platform dependencies, source builds and uninstall](distribution/README.md) ·
[downloads](https://github.com/romeirofernandes/nightfall/releases/latest)
