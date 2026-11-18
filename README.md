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

When the [release downloads](https://github.com/romeirofernandes/nightfall/releases/latest) include a `windows-x64.zip`, extract it and open `nightfall-renderer.exe`. Keep both executables together if you want the terminal controls. See the [Windows setup details](distribution/README.md#windows).

open **Nightfall** and pick your weather. hit **Arrange** to move the snowmen, trees, and gifts around. if the snowballs get out of hand, press **Esc**.

rather stay in the terminal? run `nightfall`. [downloads](https://github.com/romeirofernandes/nightfall/releases/latest)

enjoy the snow, mate. ❄
