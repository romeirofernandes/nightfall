#!/usr/bin/env python3
"""Exercise installation and checksum failures without changing the real HOME."""
import hashlib
import os
from pathlib import Path
import subprocess
import tarfile
import tempfile
import unittest

INSTALLER = Path(__file__).resolve().parents[1] / 'distribution/install.sh'


class Installer(unittest.TestCase):
    def test_x64_install_and_reject_bad_downloads(self):
        self.check_install('x86_64', 'linux-x64')

    def test_arm64_install_and_reject_bad_downloads(self):
        self.check_install('aarch64', 'linux-arm64')

    def check_install(self, arch, platform):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            home = root / 'home with spaces'
            home.mkdir()
            tools = root / 'tools'
            tools.mkdir()
            binary = root / 'nightfall'
            binary.write_text('#!/bin/sh\necho fixture\n')
            binary.chmod(0o755)
            asset = root / f'Nightfall-0.4.0-{platform}.tar.gz'
            with tarfile.open(asset, 'w:gz') as archive:
                archive.add(binary, arcname='nightfall')
            sums = root / 'SHA256SUMS'
            sums.write_text(f'{hashlib.sha256(asset.read_bytes()).hexdigest()}  {asset.name}\n')
            (tools / 'uname').write_text(f'#!/bin/sh\ncase "$1" in -s) echo Linux;; -m) echo {arch};; esac\n')
            (tools / 'curl').write_text('#!/bin/bash\nset -eu\ncp "$FIXTURE/${2##*/}" "$4"\n')
            for tool in tools.iterdir():
                tool.chmod(0o755)
            env = {**os.environ, 'HOME': str(home), 'XDG_BIN_HOME': str(home / '.local/bin'),
                   'XDG_DATA_HOME': str(home / '.local/share'), 'PATH': f'{tools}:{os.environ["PATH"]}',
                   'NIGHTFALL_TAG': 'v0.4.0', 'FIXTURE': str(root)}
            def run():
                return subprocess.run(['bash', str(INSTALLER)], env=env, capture_output=True, text=True)
            result = run()
            self.assertEqual(result.returncode, 0, result.stderr)
            installed = home / '.local/bin/nightfall'
            self.assertEqual(subprocess.check_output([installed], text=True), 'fixture\n')
            launcher = home / '.local/share/applications/nightfall.desktop'
            self.assertIn(f'Exec="{installed}"', launcher.read_text())
            self.assertFalse((home / '.config/autostart/nightfall.desktop').exists())
            installed.write_text('existing user binary')
            sums.write_text(f'{"0" * 64}  {asset.name}\n')
            self.assertNotEqual(run().returncode, 0)
            self.assertEqual(installed.read_text(), 'existing user binary')
            sums.write_text(f'{"0" * 64}  another-asset\n')
            self.assertNotEqual(run().returncode, 0)
            self.assertEqual(installed.read_text(), 'existing user binary')


if __name__ == '__main__':
    unittest.main()
