#!/usr/bin/env python3
"""Create the portable Windows release archive from the two built executables."""

import json
from pathlib import Path
import sys
import zipfile

ROOT = Path(__file__).resolve().parents[1]


def main():
    cli, renderer, output = map(Path, sys.argv[1:])
    version = json.loads((ROOT / "desktop/package.json").read_text())["version"]
    output.mkdir(parents=True, exist_ok=True)
    archive = output / f"Nightfall-{version}-windows-x64.zip"
    with zipfile.ZipFile(archive, "w", zipfile.ZIP_DEFLATED) as bundle:
        bundle.write(cli, "nightfall.exe")
        bundle.write(renderer, "nightfall-renderer.exe")
    print(archive)


if __name__ == "__main__":
    main()
