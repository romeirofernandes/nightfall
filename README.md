# nightfall

i wanted snow on my desktop without paying for it, so we made Nightfall. it's a free alternative to [Snowfall for Mac](https://snowfallmac.com/) for macOS, Linux, and Windows.

![Nightfall in blizzard mode on macOS, with snow on the settings window, Christmas lights, and Santa flying past](assets/readme/desktop.png)

### get it on your Mac

```sh
brew tap --custom-remote romeirofernandes/nightfall https://github.com/romeirofernandes/nightfall
brew install --cask romeirofernandes/nightfall/nightfall
```

### get it on Linux

```sh
curl -fsSL https://raw.githubusercontent.com/romeirofernandes/nightfall/main/distribution/install.sh -o /tmp/nightfall-install.sh
bash /tmp/nightfall-install.sh
```

Snow works on Hyprland, other Wayland compositors with layer-shell, and composited X11. See the [Linux dependencies](distribution/README.md#linux).

### download Nightfall for Windows (x64)

Open [GitHub Releases](https://github.com/romeirofernandes/nightfall/releases/latest) and look under **Assets** once a tagged Windows release is available.

- **Installer:** Download `Nightfall-<version>-windows-x64-setup.exe`, double-click it, then open **Nightfall** from the Start menu.
- **Portable:** Download and extract `Nightfall-<version>-windows-x64.zip`, then double-click `nightfall-renderer.exe`.

To download the portable ZIP from a shell, save [download-windows.ps1](distribution/download-windows.ps1) and run the command for your shell from the folder where you saved it. The script verifies the checksum and extracts Nightfall to a versioned folder under Downloads.

| Shell | Download the portable ZIP | Open terminal controls from the app folder |
| --- | --- | --- |
| PowerShell | `.\download-windows.ps1` | `.\nightfall.exe` |
| Command Prompt | `powershell.exe -NoProfile -File .\download-windows.ps1` | `nightfall.exe` |
| Git Bash | `powershell.exe -NoProfile -File ./download-windows.ps1` | `winpty ./nightfall.exe` |

See the [Windows setup details](distribution/README.md#windows) for the WebView2 requirement.

open **Nightfall** and pick your weather. hit **Arrange** to move the snowmen, trees, and gifts around. if the snowballs get out of hand, press **Esc**.

rather stay in the terminal? run `nightfall`. [downloads](https://github.com/romeirofernandes/nightfall/releases/latest)

enjoy the snow, mate. ❄
