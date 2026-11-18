use crate::engine::{Ledge, Settings, Winter};
use gtk::{cairo, gdk, glib, prelude::*};
use gtk_layer_shell::{Edge, Layer, LayerShell};
use std::{
    sync::{Arc, Mutex},
    time::{Duration, Instant},
};
pub fn start(
    settings: Arc<Mutex<Settings>>,
    ornament_slots: Arc<Mutex<std::collections::HashMap<String, u8>>>,
) {
    let display = gdk::Display::default().expect("Graphical display required");
    let layer_shell = gtk_layer_shell::is_supported();
    let x11 = display.type_().name() == "GdkX11Display";
    if !layer_shell && !x11 {
        eprintln!("Nightfall: desktop overlay requires a Wayland layer-shell compositor. Settings remain available.");
        return;
    }
    for index in 0..display.n_monitors() {
        let monitor = display.monitor(index).unwrap();
        let geo = monitor.geometry();
        let win = gtk::Window::new(gtk::WindowType::Toplevel);
        win.set_title("Nightfall snow");
        win.set_app_paintable(true);
        win.set_accept_focus(false);
        if let Some(v) = gtk::prelude::WidgetExt::screen(&win).and_then(|s| s.rgba_visual()) {
            win.set_visual(Some(&v));
        }
        if layer_shell {
            win.init_layer_shell();
            win.set_namespace("nightfall");
            win.set_monitor(&monitor);
            win.set_layer(Layer::Overlay);
            win.set_keyboard_mode(gtk_layer_shell::KeyboardMode::None);
            win.set_exclusive_zone(-1);
            for e in [Edge::Top, Edge::Bottom, Edge::Left, Edge::Right] {
                win.set_anchor(e, true)
            }
        } else {
            // Composited X11 desktops use a borderless, sticky overlay window.
            win.set_decorated(false);
            win.set_keep_above(true);
            win.set_skip_taskbar_hint(true);
            win.set_skip_pager_hint(true);
            win.stick();
            win.move_(geo.x(), geo.y());
            win.set_default_size(geo.width(), geo.height());
        }
        win.connect_realize(|w| {
            if let Some(window) = w.window() {
                window.input_shape_combine_region(&cairo::Region::create(), 0, 0);
            }
        });
        let area = gtk::DrawingArea::new();
        win.add(&area);
        area.set_can_focus(true);
        let winter = std::rc::Rc::new(std::cell::RefCell::new(Winter::new(
            geo.width() as f64,
            geo.height() as f64,
        )));
        let model = winter.clone();
        let config = settings.clone();
        area.connect_draw(move |widget, cr| {
            cr.set_operator(cairo::Operator::Source);
            cr.set_source_rgba(0., 0., 0., 0.);
            let _ = cr.paint();
            cr.set_operator(cairo::Operator::Over);
            let mut m = model.borrow_mut();
            m.width = widget.allocated_width() as f64;
            m.height = widget.allocated_height() as f64;
            let s = config.lock().unwrap();
            if !s.enabled {
                return glib::Propagation::Proceed;
            }
            cr.set_source_rgba(0.96, 0.98, 1., 0.9);
            for f in &m.flakes {
                cr.arc(f.x, f.y, f.r, 0., std::f64::consts::TAU);
                let _ = cr.fill();
            }
            for shape in crate::scene::scene(&m,&s) {
                if shape.points.is_empty(){continue;}
                cr.set_source_rgba(shape.color[0],shape.color[1],shape.color[2],shape.color[3]);
                cr.move_to(shape.points[0][0],shape.points[0][1]);
                for p in &shape.points[1..]{cr.line_to(p[0],p[1]);}
                if shape.stroke {cr.set_line_width(shape.width);let _=cr.stroke();}
                else {cr.close_path();let _=cr.fill();}
            }
            if s.interactive {
                cr.set_source_rgba(0.07,0.17,0.15,0.96);cr.rectangle(16.,16.,500.,40.);let _=cr.fill();
                cr.set_source_rgb(0.95,0.97,0.92);cr.set_font_size(13.);cr.move_to(28.,41.);
                let _=cr.show_text("Snowball mode: drag snow from a ledge, flick to throw. Esc / click here to exit");
            }
            glib::Propagation::Proceed
        });
        area.add_events(
            gdk::EventMask::BUTTON_PRESS_MASK
                | gdk::EventMask::BUTTON_RELEASE_MASK
                | gdk::EventMask::POINTER_MOTION_MASK,
        );
        let model = winter.clone();
        let config = settings.clone();
        area.connect_button_press_event(move |widget, e| {
            let (x, y) = e.position();
            let mut s = config.lock().unwrap();
            if s.interactive {
                widget.grab_focus();
                if y < 60. && x < 520. {
                    s.interactive = false;
                } else {
                    model.borrow_mut().pointer("down", x, y, 0.016);
                }
            }
            glib::Propagation::Stop
        });
        let model = winter.clone();
        let config = settings.clone();
        let previous = std::rc::Rc::new(std::cell::Cell::new(Instant::now()));
        area.connect_motion_notify_event(move |_, e| {
            let now = Instant::now();
            let dt = now.duration_since(previous.replace(now)).as_secs_f64();
            if config.lock().unwrap().interactive {
                let (x, y) = e.position();
                model.borrow_mut().pointer("move", x, y, dt);
            }
            glib::Propagation::Stop
        });
        let model = winter.clone();
        area.connect_button_release_event(move |_, e| {
            let (x, y) = e.position();
            model.borrow_mut().pointer("up", x, y, 0.016);
            glib::Propagation::Stop
        });
        let config = settings.clone();
        win.connect_key_press_event(move |_, e| {
            if e.keyval() == gdk::keys::constants::Escape {
                config.lock().unwrap().interactive = false;
            }
            glib::Propagation::Proceed
        });
        win.show_all();
        let mut last = Instant::now();
        let mut frames = 0;
        let config = settings.clone();
        // Geometry discovery runs off the GTK thread. Bounded channel prevents query backlogs.
        let (tx, rx) = std::sync::mpsc::sync_channel(1);
        std::thread::spawn(move || loop {
            if let Some(surfaces) = surfaces(geo.x(), geo.y(), geo.width(), geo.height()) {
                match tx.try_send(surfaces) {
                    Err(std::sync::mpsc::TrySendError::Disconnected(_)) => break,
                    _ => {}
                }
            }
            std::thread::sleep(Duration::from_millis(500));
        });
        let slots = ornament_slots.clone();
        let display_key = index.to_string();
        glib::timeout_add_local(Duration::from_millis(16), move || {
            frames += 1;
            let s = config.lock().unwrap().clone();
            if s.fps == 30 && frames % 2 != 0 {
                return glib::ControlFlow::Continue;
            }
            let now = Instant::now();
            let dt = now.duration_since(last).as_secs_f64();
            last = now;
            let mut m = winter.borrow_mut();
            if let Ok(surfaces) = rx.try_recv() {
                m.surfaces(surfaces);
                slots.lock().unwrap().insert(
                    display_key.clone(),
                    crate::scene::visible_ornament_slots(&m.ledges),
                );
            }
            // GTK input regions stay empty except during explicit snowball mode.
            if let Some(window) = win.window() {
                let region = if s.interactive && s.enabled {
                    cairo::Region::create_rectangle(&cairo::RectangleInt::new(
                        0,
                        0,
                        area.allocated_width(),
                        area.allocated_height(),
                    ))
                } else {
                    cairo::Region::create()
                };
                window.input_shape_combine_region(&region, 0, 0);
                if let Some(child) = area.window() {
                    child.input_shape_combine_region(&region, 0, 0);
                }
            }
            win.set_accept_focus(s.interactive && s.enabled);
            if layer_shell {
                win.set_keyboard_mode(if s.interactive && s.enabled {
                    gtk_layer_shell::KeyboardMode::OnDemand
                } else {
                    gtk_layer_shell::KeyboardMode::None
                });
            }
            m.step(dt, &s);
            drop(m);
            area.queue_draw();
            glib::ControlFlow::Continue
        });
    }
}
fn surfaces(ox: i32, oy: i32, width: i32, height: i32) -> Option<Vec<Ledge>> {
    // hyprctl reads are isolated from rendering; no shell and no window contents.
    let read = |arg: &str| -> Option<serde_json::Value> {
        let out = std::process::Command::new("hyprctl")
            .args(["-j", arg])
            .output()
            .ok()?;
        if !out.status.success() {
            return None;
        }
        serde_json::from_slice(&out.stdout).ok()
    };
    let clients = read("clients")?;
    let monitors = read("monitors")?;
    let mut result = vec![];
    for c in clients.as_array()? {
        if c["hidden"].as_bool() == Some(true) || c["mapped"].as_bool() == Some(false) {
            continue;
        }
        let monitor = monitors
            .as_array()?
            .iter()
            .find(|m| m["id"] == c["monitor"]);
        if c["pinned"].as_bool() != Some(true)
            && monitor.map(|m| &m["activeWorkspace"]["id"]) != Some(&c["workspace"]["id"])
        {
            continue;
        }
        let x = c["at"][0].as_f64()? - ox as f64;
        let y = c["at"][1].as_f64()? - oy as f64;
        let w = c["size"][0].as_f64()?;
        let left = x.max(0.);
        let right = (x + w).min(width as f64);
        if y >= 0. && y < height as f64 && right > left {
            result.push(Ledge::new(
                c["address"].as_str()?.into(),
                left,
                y,
                right - left,
            ));
        }
    }
    if let Some(layers) = read("layers") {
        if let Some(monitors) = layers.as_object() {
            for monitor in monitors.values() {
                if let Some(levels) = monitor["levels"].as_object() {
                    for list in levels.values() {
                        if let Some(entries) = list.as_array() {
                            for layer in entries {
                                let ns = layer["namespace"].as_str().unwrap_or("");
                                if ns == "nightfall"
                                    || !(ns.contains("dock")
                                        || ns.contains("waybar")
                                        || ns.contains("panel"))
                                {
                                    continue;
                                }
                                if let (Some(x), Some(y), Some(w)) = (
                                    layer["x"].as_f64(),
                                    layer["y"].as_f64(),
                                    layer["w"].as_f64(),
                                ) {
                                    let x = x - ox as f64;
                                    let y = y - oy as f64;
                                    let left = x.max(0.);
                                    let right = (x + w).min(width as f64);
                                    if y >= 0. && y < height as f64 && right > left {
                                        result.push(Ledge::new(
                                            format!("panel-{}", layer["address"]),
                                            left,
                                            y,
                                            right - left,
                                        ));
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    Some(result)
}
