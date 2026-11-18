//go:build linux || darwin

package main

import (
	"os"
	"os/exec"
	"path/filepath"
	"syscall"
)

func controlPath() (string, error) {
	dir, err := configDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(dir, "control.sock"), nil
}

func rendererCandidates(dir string) []string {
	home, _ := os.UserHomeDir()
	return []string{
		filepath.Join(dir, "nightfall-renderer"),
		filepath.Join(dir, "../lib/nightfall/nightfall-renderer"),
		filepath.Join(home, "Applications/Nightfall.app/Contents/MacOS/nightfall-renderer"),
		"/Applications/Nightfall.app/Contents/MacOS/nightfall-renderer",
	}
}

func detachRenderer(cmd *exec.Cmd) {
	cmd.SysProcAttr = &syscall.SysProcAttr{Setsid: true}
}

func enableTerminalOutput() (func(), error) { return func() {}, nil }

func terminalSignals() []os.Signal {
	return []os.Signal{syscall.SIGWINCH, os.Interrupt, syscall.SIGTERM}
}

func terminalResized(sig os.Signal) bool { return sig == syscall.SIGWINCH }
