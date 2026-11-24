package main

import (
	"bufio"
	"encoding/json"
	"fmt"
	"os"
	"os/signal"
	"strings"

	"golang.org/x/term"
)

func tui() error {
	fd := int(os.Stdin.Fd())
	if !term.IsTerminal(fd) || !term.IsTerminal(int(os.Stdout.Fd())) {
		return fmt.Errorf("run nightfall in a terminal, or use nightfall --help")
	}
	if err := ensureRenderer(); err != nil {
		return err
	}
	settings, err := loadSettings()
	if err != nil {
		return err
	}
	old, err := term.MakeRaw(fd)
	if err != nil {
		return err
	}
	defer term.Restore(fd, old)
	restoreOutput, err := enableTerminalOutput()
	if err != nil {
		return err
	}
	defer restoreOutput()
	fmt.Print("\x1b[?1049h\x1b[?25l")
	defer fmt.Print("\x1b[?25h\x1b[?1049l")
	signals := make(chan os.Signal, 2)
	signal.Notify(signals, terminalSignals()...)
	defer signal.Stop(signals)
	keys := make(chan string)
	done := make(chan struct{})
	defer close(done)
	go func() {
		reader := bufio.NewReader(os.Stdin)
		for {
			b, e := reader.ReadByte()
			if e != nil {
				select {
				case keys <- "eof":
				case <-done:
				}
				return
			}
			key := string(b)
			if b == 27 {
				next, e := reader.ReadByte()
				if e != nil {
					return
				}
				if next == '[' || next == 'O' {
					last, e := reader.ReadByte()
					if e != nil {
						return
					}
					key = "arrow" + string(last)
				}
			}
			select {
			case keys <- key:
			case <-done:
				return
			}
		}
	}()
	selected := 0
	message := "Snow keeps running when you close this terminal."
	for {
		width, height, e := term.GetSize(int(os.Stdout.Fd()))
		if e != nil {
			return e
		}
		fmt.Print("\x1b[H\x1b[2J")
		if width < 48 || height < 10 {
			fmt.Print("Resize to 48 x 10. q closes controls.")
		} else {
			fmt.Print("\x1b[38;5;151m  * NIGHTFALL\x1b[0m  /  a little winter\r\n\r\n")
			visible := height - 7
			start := 0
			if selected >= visible {
				start = selected - visible + 1
			}
			for i := start; i < len(controls) && i < start+visible; i++ {
				prefix := "    "
				suffix := ""
				if i == selected {
					prefix = "\x1b[38;5;151m  > "
					suffix = "\x1b[0m"
				}
				fmt.Printf("%s%-22s %s%s\r\n", prefix, controls[i].label, valueText(settings, controls[i]), suffix)
			}
			if len(message) > width-4 {
				message = message[:width-4]
			}
			fmt.Printf("\r\n  arrows select/change   q close   x stop   c sweep\r\n\x1b[2m  %s\x1b[0m", message)
		}
		select {
		case sig := <-signals:
			if !terminalResized(sig) {
				return nil
			}
			continue
		case key := <-keys:
			switch key {
			case "q", "\x03", "eof":
				return nil
			case "x":
				_, err = request("quit")
				return err
			case "arrowA":
				if selected > 0 {
					selected--
				}
				continue
			case "arrowB":
				if selected < len(controls)-1 {
					selected++
				}
				continue
			case "c":
				message, err = request("sweep")
			case "arrowC", "arrowD", " ", "\r":
				// Reload before editing so tray and CLI changes are preserved.
				settings, err = loadSettings()
				if err != nil {
					return err
				}
				direction := 1
				if key == "arrowD" {
					direction = -1
				}
				change(settings, selected, direction)
				data, e := json.Marshal(settings)
				if e != nil {
					return e
				}
				message, err = request("set " + string(data))
			default:
				continue
			}
			if err != nil {
				return err
			}
			message = strings.TrimSpace(message)
		}
	}
}
