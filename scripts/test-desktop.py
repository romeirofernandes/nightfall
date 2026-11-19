#!/usr/bin/env python3
"""Exercise the installed CLI and renderer together on a disposable desktop."""

import ctypes
from ctypes import wintypes
import json
import os
import re
from pathlib import Path
import subprocess
import sys
import tempfile
import time
import zipfile

WINDOWS = sys.platform == "win32"


def wait_for(check, description, timeout=20):
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        if result := check():
            return result
        time.sleep(0.2)
    raise AssertionError(f"Timed out waiting for {description}")


def windows_ui():
    user32 = ctypes.WinDLL("user32", use_last_error=True)
    user32.FindWindowW.argtypes = (wintypes.LPCWSTR, wintypes.LPCWSTR)
    user32.FindWindowW.restype = wintypes.HWND
    user32.IsWindowVisible.argtypes = (wintypes.HWND,)
    user32.IsWindowVisible.restype = wintypes.BOOL
    user32.PostMessageW.argtypes = (
        wintypes.HWND, wintypes.UINT, wintypes.WPARAM, wintypes.LPARAM
    )
    user32.PostMessageW.restype = wintypes.BOOL
    return user32


def window_exists(title):
    if WINDOWS:
        user32 = windows_ui()
        handle = user32.FindWindowW(None, title)
        if not handle or not user32.IsWindowVisible(handle):
            return False
        if title == "Nightfall snow":
            user32.GetWindowLongW.argtypes = (wintypes.HWND, ctypes.c_int)
            user32.GetWindowLongW.restype = ctypes.c_long
            styles = user32.GetWindowLongW(handle, -20)  # GWL_EXSTYLE
            passive_styles = 0x08080020  # NOACTIVATE | LAYERED | TRANSPARENT
            assert styles & passive_styles == passive_styles, f"Overlay style: {styles:#x}"
            assert styles & 0x8 == 0, f"Passive overlay is topmost: {styles:#x}"
        return True
    if os.getenv("SWAYSOCK"):
        result = subprocess.check_output(["swaymsg", "-t", "get_tree"], text=True)
        return f'"name": "{title}"' in result
    return subprocess.run(
        ["xdotool", "search", "--onlyvisible", "--name", f"^{title}$"],
        capture_output=True,
        timeout=5,
    ).returncode == 0


def smoke(cli, config_dir):
    def command(*args, check=True):
        return subprocess.run(
            [cli, *args], check=check, capture_output=True, text=True, timeout=30
        )

    def expect(expected, *args):
        result = command(*args)
        assert expected in result.stdout, f"{args}: {result.stdout!r} {result.stderr!r}"

    try:
        expect("nightfall ", "--version")
        assert command("status", check=False).returncode != 0, "renderer already running"
        expect("Settings updated", "enable")
        expect("snow enabled", "status")
        settings_only = os.getenv("NIGHTFALL_TEST_SETTINGS_ONLY") == "1"
        if not os.getenv("SWAYSOCK") and not settings_only:
            wait_for(lambda: window_exists("Nightfall snow"), "snow overlay window")
        renderer = cli.with_name("nightfall-renderer.exe" if WINDOWS else "nightfall-renderer")
        subprocess.run([renderer], check=True, capture_output=True, timeout=20)
        wait_for(lambda: window_exists("Nightfall"), "settings window")
        if WINDOWS:
            user32 = windows_ui()
            settings_window = user32.FindWindowW(None, "Nightfall")
            if not user32.PostMessageW(settings_window, 0x0010, 0, 0):  # WM_CLOSE
                raise ctypes.WinError(ctypes.get_last_error())
            wait_for(lambda: not window_exists("Nightfall"), "settings window to close")
            expect("snow enabled", "status")
            assert window_exists("Nightfall snow"), "closing settings removed the overlay"
            expect("Settings opened", "settings")
            wait_for(lambda: window_exists("Nightfall"), "settings window to reopen")
        log = config_dir / "renderer.log"
        if settings_only:
            assert not window_exists("Nightfall snow"), "overlay on uncomposited X11"
            assert "Settings remain available" in log.read_text()
        if os.getenv("SWAYSOCK"):
            wait_for(
                lambda: any(
                    "get_layer_surface" in line and '"nightfall"' in line
                    for line in log.read_text(errors="replace").splitlines()
                ),
                "Wayland layer-shell surface",
            )
        expect("Settings updated", "toggle")
        expect("snow disabled", "status")
        settings = config_dir / "settings.json"
        assert json.loads(settings.read_text())["enabled"] is False
        for _ in range(3):
            expect("Settings updated", "toggle")
            expect("snow enabled", "status")
            expect("Settings updated", "toggle")
            expect("snow disabled", "status")
        expect("Settings updated", "disable")
        expect("Nightfall stopped", "quit")
        wait_for(lambda: command("status", check=False).returncode != 0, "renderer exit")
        expect("Settings opened", "settings")
        expect("snow disabled", "status")
        expect("Settings updated", "enable")
        assert json.loads(settings.read_text())["enabled"] is True
        print(f"{sys.platform}: settings, CLI controls, restart, and desktop mode checks passed")
    except subprocess.CalledProcessError as error:
        print(error.stdout, error.stderr, file=sys.stderr)
        raise
    finally:
        command("quit", check=False)
        wait_for(lambda: command("status", check=False).returncode != 0, "renderer cleanup")
        log = config_dir / "renderer.log"
        if log.exists():
            lines = log.read_text(errors="replace").splitlines()
            print("\n".join(line for line in lines if not re.match(r"^\[\d+\.", line)), file=sys.stderr)


def main():
    path = Path(sys.argv[1]).resolve()
    # Keep the temporary Linux UNIX socket below the platform's path limit.
    with tempfile.TemporaryDirectory(prefix="nf-", dir=None if WINDOWS else "/tmp") as directory:
        root = Path(directory)
        if WINDOWS:
            # The runner has a disposable Windows user profile. Tauri locates its
            # roaming directory through the Windows known folder API.
            local = root / "local"
            local.mkdir()
            os.environ["LOCALAPPDATA"] = str(local)
            config_dir = Path(os.environ["APPDATA"]) / "app.nightfall.desktop"
            install = root / "Nightfall Portable"
            with zipfile.ZipFile(path) as archive:
                assert set(archive.namelist()) == {"nightfall.exe", "nightfall-renderer.exe"}
                assert archive.testzip() is None
                archive.extractall(install)
            smoke(install / "nightfall.exe", config_dir)
        else:
            os.environ["XDG_CONFIG_HOME"] = str(root)
            smoke(path, root / "app.nightfall.desktop")


if __name__ == "__main__":
    main()
