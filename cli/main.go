// Nightfall's terminal controls. The renderer is a separate native process.
package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"syscall"
	"time"
)

var version = "dev"

func configDir() (string, error) {
	base, err := os.UserConfigDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(base, "app.nightfall.desktop"), nil
}
func request(command string) (string, error) {
	dir, err := configDir()
	if err != nil {
		return "", err
	}
	conn, err := net.DialTimeout("unix", filepath.Join(dir, "control.sock"), time.Second)
	if err != nil {
		return "", fmt.Errorf("Nightfall is stopped: %w", err)
	}
	defer conn.Close()
	if err = conn.SetDeadline(time.Now().Add(5 * time.Second)); err != nil {
		return "", err
	}
	if _, err = io.WriteString(conn, command); err != nil {
		return "", err
	}
	if err = conn.(*net.UnixConn).CloseWrite(); err != nil {
		return "", err
	}
	reply, err := io.ReadAll(io.LimitReader(conn, 65536))
	if err != nil {
		return "", err
	}
	if strings.HasPrefix(string(reply), "error:") {
		return "", errors.New(strings.TrimSpace(string(reply)))
	}
	return string(reply), nil
}
func rendererPath() (string, error) {
	if override := os.Getenv("NIGHTFALL_RENDERER"); override != "" {
		return override, nil
	}
	executable, err := os.Executable()
	if err != nil {
		return "", err
	}
	executable, err = filepath.EvalSymlinks(executable)
	if err != nil {
		return "", err
	}
	home, _ := os.UserHomeDir()
	for _, p := range []string{
		filepath.Join(filepath.Dir(executable), "nightfall-renderer"),
		filepath.Join(filepath.Dir(executable), "../lib/nightfall/nightfall-renderer"),
		filepath.Join(home, "Applications/Nightfall.app/Contents/MacOS/nightfall-renderer"),
		"/Applications/Nightfall.app/Contents/MacOS/nightfall-renderer",
	} {
		if info, err := os.Stat(p); err == nil && !info.IsDir() {
			return p, nil
		}
	}
	return "", errors.New("renderer missing; reinstall Nightfall or set NIGHTFALL_RENDERER")
}
func ensureRenderer() error {
	if _, err := request("get"); err == nil {
		return nil
	}
	renderer, err := rendererPath()
	if err != nil {
		return err
	}
	dir, err := configDir()
	if err != nil {
		return err
	}
	if err = os.MkdirAll(dir, 0700); err != nil {
		return err
	}
	log, err := os.OpenFile(filepath.Join(dir, "renderer.log"), os.O_CREATE|os.O_APPEND|os.O_WRONLY, 0600)
	if err != nil {
		return err
	}
	defer log.Close()
	cmd := exec.Command(renderer, "--daemon")
	cmd.Stdout = log
	cmd.Stderr = log
	cmd.SysProcAttr = &syscall.SysProcAttr{Setsid: true}
	if err = cmd.Start(); err != nil {
		return err
	}
	_ = cmd.Process.Release()
	deadline := time.Now().Add(10 * time.Second)
	for time.Now().Before(deadline) {
		if _, err = request("get"); err == nil {
			return nil
		}
		time.Sleep(50 * time.Millisecond)
	}
	return fmt.Errorf("renderer did not start; see %s", filepath.Join(dir, "renderer.log"))
}
func loadSettings() (map[string]any, error) {
	reply, err := request("get")
	if err != nil {
		return nil, err
	}
	var settings map[string]any
	err = json.Unmarshal([]byte(reply), &settings)
	return settings, err
}
func run(args []string) error {
	command := "tui"
	if len(args) > 0 {
		command = args[0]
	}
	if len(args) > 1 {
		return errors.New("too many arguments; use nightfall --help")
	}
	switch command {
	case "--version", "version":
		fmt.Println("nightfall", version)
		return nil
	case "--help", "-h", "help":
		fmt.Println("nightfall [tui|enable|disable|toggle|status|quit]\n\nNo arguments opens terminal controls.\nArrows select/change; q closes controls; x stops snow; c sweeps.\nThe desktop overlay keeps running after you close the terminal.")
		return nil
	case "tui":
		return tui()
	case "enable":
		if err := ensureRenderer(); err != nil {
			return err
		}
	case "disable", "toggle", "status", "quit":
	default:
		return fmt.Errorf("unknown command %q; use nightfall --help", command)
	}
	reply, err := request(command)
	if err == nil {
		fmt.Print(reply)
	}
	return err
}
func main() {
	if runtime.GOOS != "linux" && runtime.GOOS != "darwin" {
		fmt.Fprintln(os.Stderr, "Nightfall supports Linux and macOS")
		os.Exit(1)
	}
	if err := run(os.Args[1:]); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}
