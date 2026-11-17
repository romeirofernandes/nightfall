package main

import "testing"

func TestChangesStayWithinSupportedSettings(t *testing.T) {
	settings := map[string]any{"snowman_count": float64(12), "wind": float64(-80), "enabled": true}
	change(settings, 6, 1)
	if settings["snowman_count"] != float64(12) {
		t.Fatal("snowman count exceeded renderer limit")
	}
	change(settings, 2, -1)
	if settings["wind"] != float64(-80) {
		t.Fatal("wind exceeded renderer limit")
	}
	change(settings, 0, 1)
	if settings["enabled"] != false {
		t.Fatal("snow toggle did not disable")
	}
}
func TestUnknownCommandsFail(t *testing.T) {
	if run([]string{"missing-command"}) == nil {
		t.Fatal("unknown command accepted")
	}
	if run([]string{"status", "extra"}) == nil {
		t.Fatal("extra argument accepted")
	}
}
