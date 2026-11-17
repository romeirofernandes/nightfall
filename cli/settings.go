package main

import "fmt"

type setting struct {
	key, label     string
	min, max, step float64
}

var controls = []setting{
	{"enabled", "Snow", 0, 0, 0}, {"intensity", "Intensity", 0, 2, 1}, {"wind", "Wind", -80, 80, 4},
	{"accumulation", "Snow on ledges", 0, 0, 0}, {"icicles", "Icicles", 0, 0, 0}, {"snowman", "Snowman", 0, 0, 0},
	{"snowman_count", "Snowmen", 0, 12, 1}, {"snowman_size", "Snowman size", 0.4, 2.5, 0.1},
	{"trees", "Trees", 0, 12, 1}, {"gifts", "Gifts", 0, 20, 1}, {"decoration_size", "Decoration size", 0.4, 2.5, 0.1},
	{"lights", "Lights", 0, 0, 0}, {"dangling", "Dangling lights", 0, 0, 0}, {"plow", "Santa cleanup", 0, 0, 0},
	{"cleanup_interval", "Cleanup seconds", 15, 3600, 15}, {"fps", "Frame rate", 30, 60, 30},
}

func change(settings map[string]any, index, direction int) {
	c := controls[index]
	if value, ok := settings[c.key].(bool); ok {
		settings[c.key] = !value
		return
	}
	value, _ := settings[c.key].(float64)
	value += float64(direction) * c.step
	if value < c.min {
		value = c.min
	}
	if value > c.max {
		value = c.max
	}
	settings[c.key] = value
}
func valueText(settings map[string]any, c setting) string {
	value := settings[c.key]
	if b, ok := value.(bool); ok {
		if b {
			return "on"
		}
		return "off"
	}
	n, _ := value.(float64)
	if c.key == "intensity" {
		names := []string{"flurry", "snow day", "blizzard"}
		if int(n) >= 0 && int(n) < len(names) {
			return names[int(n)]
		}
	}
	if c.step == 0.1 {
		return fmt.Sprintf("%.1f", n)
	}
	return fmt.Sprintf("%.0f", n)
}
