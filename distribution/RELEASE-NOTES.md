Terminal controls are now written in Go. Run `nightfall` to open them, use the
arrows to change settings, `q` to close controls, and `x` to stop the snow.
The snow keeps falling over application windows after the terminal closes.

- A separate native renderer handles the desktop overlay and bottom-edge snowman.
- Linux archives contain the static Go CLI and native renderer, for x64 and ARM64.
- Mac archives contain the Go CLI and Nightfall.app, for Apple Silicon and Intel.
- Installers verify SHA256SUMS and preserve existing settings.
- Source code is grouped under cli/, desktop/, and website/.

Verified on the owner's Arch Linux / Hyprland laptop. Native GNOME/KDE Wayland
and musl renderer builds remain unsupported; the Go CLI itself is static.
Mac apps are ad-hoc signed and not notarized by Apple.
