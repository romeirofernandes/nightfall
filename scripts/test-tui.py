#!/usr/bin/env python3
"""Live TUI integration check. Requires a graphical session; uses isolated settings.

Usage: python3 scripts/test-tui.py /path/to/nightfall
"""
import fcntl
import os
import pty
import select
import struct
import subprocess
import sys
import tempfile
import termios
import time

binary = os.path.abspath(sys.argv[1])
with tempfile.TemporaryDirectory(prefix='nightfall-tui-') as config:
    env = dict(os.environ, XDG_CONFIG_HOME=config)
    def cli(command):
        return subprocess.run([binary, command], env=env, capture_output=True, text=True, timeout=10)
    def launch():
        master, slave = pty.openpty()
        fcntl.ioctl(slave, termios.TIOCSWINSZ, struct.pack('HHHH', 24, 80, 0, 0))
        process = subprocess.Popen([binary], env=env, stdin=slave, stdout=slave, stderr=slave)
        os.close(slave)
        return process, master
    def expect(fd, needle):
        data = b''
        deadline = time.monotonic() + 10
        while time.monotonic() < deadline:
            ready, _, _ = select.select([fd], [], [], 0.2)
            if ready:
                data += os.read(fd, 65536)
                if needle in data:
                    return
        raise AssertionError(f'Terminal never showed {needle!r}: {data[-500:]!r}')
    process = None
    try:
        process, fd = launch()
        expect(fd, b'NIGHTFALL')
        os.write(fd, b' ')
        expect(fd, b'Saved')
        assert 'disabled' in cli('status').stdout
        os.write(fd, b' ')
        expect(fd, b'Saved')
        assert 'enabled' in cli('status').stdout
        os.write(fd, b'q')
        assert process.wait(timeout=5) == 0
        os.close(fd)
        assert 'enabled' in cli('status').stdout, 'Closing TUI stopped renderer'
        process, fd = launch()
        expect(fd, b'NIGHTFALL')
        os.write(fd, b'x')
        assert process.wait(timeout=5) == 0
        os.close(fd)
        deadline = time.monotonic() + 5
        while time.monotonic() < deadline and cli('status').returncode == 0:
            time.sleep(0.05)
        stopped = cli('status')
        assert stopped.returncode != 0
        assert 'stopped' in stopped.stdout + stopped.stderr
        print('PASS: TUI toggle, close without stopping snow, reopen and quit')
    finally:
        cli('quit')
        if process and process.poll() is None:
            process.terminate()
            process.wait(timeout=5)
