#!/usr/bin/env python3
"""Require the release tag and all packaged version fields to agree."""

import json
import os
import re
import tomllib
from pathlib import Path

tag = os.environ["GITHUB_REF_NAME"]
if os.environ["GITHUB_REF_TYPE"] != "tag" or not re.fullmatch(r"v\d+\.\d+\.\d+", tag):
    raise SystemExit(f"Release requires a vMAJOR.MINOR.PATCH tag, got {tag!r}")

version = tag[1:]
desktop = Path(__file__).resolve().parents[1] / "desktop"
tauri = desktop / "src-tauri"
for path, actual in (
    (desktop / "package.json", json.loads((desktop / "package.json").read_text())["version"]),
    (desktop / "package-lock.json", json.loads((desktop / "package-lock.json").read_text())["version"]),
    (tauri / "tauri.conf.json", json.loads((tauri / "tauri.conf.json").read_text())["version"]),
    (tauri / "Cargo.toml", tomllib.loads((tauri / "Cargo.toml").read_text())["package"]["version"]),
    (tauri / "Cargo.lock", next(
        package["version"]
        for package in tomllib.loads((tauri / "Cargo.lock").read_text())["package"]
        if package["name"] == "nightfall"
    )),
):
    if actual != version:
        raise SystemExit(f"{path.name} has version {actual}, expected {version}")
print(f"Release versions match {tag}")
