package main

import (
	"bufio"
	"io"
	"net"
	"os"
	"path/filepath"
	"runtime"
	"testing"
)

func TestControlReplyAndRendererErrors(t *testing.T) {
	temp := os.TempDir()
	if runtime.GOOS != "windows" {
		temp = "/tmp" // Keep the socket within the OS pathname limit.
	}
	base, err := os.MkdirTemp(temp, "nf-")
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = os.RemoveAll(base) })
	switch runtime.GOOS {
	case "windows":
		t.Setenv("LOCALAPPDATA", base)
	case "darwin":
		t.Setenv("HOME", base)
	default:
		t.Setenv("XDG_CONFIG_HOME", base)
	}
	path, err := controlPath()
	if err != nil {
		t.Fatal(err)
	}
	if err = os.MkdirAll(filepath.Dir(path), 0700); err != nil {
		t.Fatal(err)
	}
	listener, err := net.Listen("unix", path)
	if err != nil {
		t.Fatal(err)
	}
	defer listener.Close()
	go func() {
		for _, reply := range []string{"Nightfall running, snow enabled\n", "error: cannot save settings\n", ""} {
			conn, e := listener.Accept()
			if e != nil {
				return
			}
			if runtime.GOOS == "windows" {
				_, _ = bufio.NewReader(conn).ReadString('\n')
			} else {
				_, _ = io.ReadAll(conn)
			}
			_, _ = io.WriteString(conn, reply)
			_ = conn.Close()
		}
	}()
	reply, err := request("status")
	if err != nil || reply != "Nightfall running, snow enabled\n" {
		t.Fatalf("status: %q %v", reply, err)
	}
	if _, err = request("disable"); err == nil {
		t.Fatal("renderer failure was reported as success")
	}
	if _, err = request("status"); err == nil {
		t.Fatal("a connection closed without a reply was reported as success")
	}
}
