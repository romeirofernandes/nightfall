package main

import (
	"io"
	"net"
	"os"
	"path/filepath"
	"runtime"
	"testing"
)

func TestControlReplyAndRendererErrors(t *testing.T) {
	if runtime.GOOS != "linux" {
		t.Skip("isolated config path uses XDG_CONFIG_HOME")
	}
	t.Setenv("XDG_CONFIG_HOME", t.TempDir())
	dir, err := configDir()
	if err != nil {
		t.Fatal(err)
	}
	if len(dir) > 95 {
		t.Skip("temporary socket path too long")
	}
	if err = os.MkdirAll(dir, 0700); err != nil {
		t.Fatal(err)
	}
	listener, err := net.Listen("unix", filepath.Join(dir, "control.sock"))
	if err != nil {
		t.Fatal(err)
	}
	defer listener.Close()
	go func() {
		for _, reply := range []string{"Nightfall running, snow enabled\n", "error: cannot save settings\n"} {
			conn, e := listener.Accept()
			if e != nil {
				return
			}
			_, _ = io.ReadAll(conn)
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
}
