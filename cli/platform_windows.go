package main

import (
	"errors"
	"os"
	"os/exec"
	"path/filepath"
	"syscall"

	"golang.org/x/sys/windows"
)

func controlPath() (string, error) {
	base := os.Getenv("LOCALAPPDATA")
	if base == "" {
		return "", errors.New("LOCALAPPDATA is required")
	}
	return filepath.Join(base, "Nightfall.sock"), nil
}

func rendererCandidates(dir string) []string {
	return []string{filepath.Join(dir, "nightfall-renderer.exe")}
}

func detachRenderer(cmd *exec.Cmd) {
	cmd.SysProcAttr = &syscall.SysProcAttr{
		CreationFlags: windows.DETACHED_PROCESS | windows.CREATE_NEW_PROCESS_GROUP,
	}
}

func enableTerminalOutput() (func(), error) {
	handle := windows.Handle(os.Stdout.Fd())
	var mode uint32
	if err := windows.GetConsoleMode(handle, &mode); err != nil {
		return nil, err
	}
	if err := windows.SetConsoleMode(handle, mode|windows.ENABLE_VIRTUAL_TERMINAL_PROCESSING); err != nil {
		return nil, err
	}
	return func() { _ = windows.SetConsoleMode(handle, mode) }, nil
}

func terminalSignals() []os.Signal { return []os.Signal{os.Interrupt, syscall.SIGTERM} }

func terminalResized(os.Signal) bool { return false }
