import argparse
import sys

def main():
    parser = argparse.ArgumentParser(description="Nightfall — native desktop winter")
    parser.add_argument("--preview", action="store_true", help="Interactive window instead of desktop overlay")
    parser.add_argument("--intensity", choices=["light","normal","blizzard"], default="normal")
    parser.add_argument("--fps",type=int,choices=[15,30,60],default=30)
    parser.add_argument("--no-snowman",action="store_true")
    parser.add_argument("--no-icicles",action="store_true")
    parser.add_argument("--no-plow",action="store_true")
    options = parser.parse_args()
    def apply(model):
        model.intensity = options.intensity
        model.snowman = not options.no_snowman
        model.icicles = not options.no_icicles
        model.plows = not options.no_plow
    options.apply = apply
    try:
        if sys.platform == "darwin":
            from .macos import run
        elif sys.platform.startswith("linux"):
            from .linux import run
        else:
            parser.error("Supported platforms: macOS and Linux/Hyprland")
        run(options)
    except (ImportError, ValueError, RuntimeError) as exc:
        parser.exit(1, f"Nightfall: {exc}\nSee README.md for platform dependencies.\n")

if __name__ == "__main__":
    main()
