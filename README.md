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

### get it on Windows

Once a Windows x64 build is published, paste these commands into **PowerShell** or a **PowerShell profile in Windows Terminal**. You can run them from any folder.

```powershell
& {
  $script = Join-Path $env:TEMP 'nightfall-download-windows.ps1'
  Invoke-WebRequest -UseBasicParsing -Uri 'https://raw.githubusercontent.com/romeirofernandes/nightfall/main/distribution/download-windows.ps1' -OutFile $script -ErrorAction Stop
  & $script
}
```

The downloader verifies the ZIP and extracts Nightfall into a versioned folder in Downloads. Open `nightfall-renderer.exe` from that folder. See the [Windows setup details](distribution/README.md#windows).

open **Nightfall** and pick your weather. hit **Arrange** to move the snowmen, trees, and gifts around. if the snowballs get out of hand, press **Esc**.

rather stay in the terminal? run `nightfall`. [downloads](https://github.com/romeirofernandes/nightfall/releases/latest)

enjoy the snow, mate. ❄
