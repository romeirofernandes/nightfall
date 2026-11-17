#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
#[cfg(any(target_os = "linux", target_os = "macos"))]
mod control;
mod engine;
#[cfg(target_os = "linux")]
mod linux;
#[cfg(target_os = "macos")]
mod macos;
mod scene;
use engine::{Settings, Winter};
use std::{
    collections::HashMap,
    fs,
    sync::{Arc, Mutex},
};
use tauri::Manager;
struct State {
    settings: Arc<Mutex<Settings>>,
    worlds: Mutex<HashMap<String, Winter>>,
    path: std::path::PathBuf,
}
#[tauri::command]
fn get_settings(state: tauri::State<State>) -> Settings {
    state.settings.lock().unwrap().clone()
}
#[tauri::command]
fn save_settings(
    app: tauri::AppHandle,
    mut settings: Settings,
    state: tauri::State<State>,
) -> Result<(), String> {
    settings.validate();
    settings.cleanup_request = state.settings.lock().unwrap().cleanup_request;
    let json = serde_json::to_vec_pretty(&settings).map_err(|e| e.to_string())?;
    fs::write(state.path.with_extension("tmp"), json).map_err(|e| e.to_string())?;
    fs::rename(state.path.with_extension("tmp"), &state.path).map_err(|e| e.to_string())?;
    let capture = settings.interactive && settings.enabled;
    *state.settings.lock().unwrap() = settings;
    #[cfg(target_os = "macos")]
    for (label, w) in app.webview_windows() {
        if label.starts_with("snow-") {
            w.set_ignore_cursor_events(!capture)
                .map_err(|e| e.to_string())?;
            if capture {
                let _ = w.set_focus();
            }
        }
    }
    #[cfg(not(target_os = "macos"))]
    let _ = (app, capture);
    Ok(())
}
#[tauri::command]
fn frame(
    window: tauri::WebviewWindow,
    state: tauri::State<State>,
    width: f64,
    height: f64,
    dt: f64,
) -> Result<serde_json::Value, String> {
    if !window.label().starts_with("snow-") {
        return Err("Overlay only".into());
    }
    if !width.is_finite() || !height.is_finite() || !dt.is_finite() {
        return Err("Invalid frame".into());
    }
    let mut worlds = state.worlds.lock().unwrap();
    let world = worlds
        .entry(window.label().into())
        .or_insert_with(|| Winter::new(width.clamp(1., 16000.), height.clamp(1., 16000.)));
    #[cfg(target_os = "macos")]
    if world.time - world.geometry_time >= 0.5 {
        world.geometry_time = world.time;
        let scale = window.scale_factor().map_err(|e| e.to_string())?;
        let pos = window.outer_position().map_err(|e| e.to_string())?;
        if let Some(surfaces) = macos::surfaces(
            pos.x as f64 / scale,
            pos.y as f64 / scale,
            world.width,
            world.height,
        ) {
            world.surfaces(surfaces);
        }
    }
    world.step(dt, &state.settings.lock().unwrap());
    let settings = state.settings.lock().unwrap();
    Ok(
        serde_json::json!({"scene":scene::scene(world, &settings),"flakes":world.flakes,"time":world.time}),
    )
}
#[tauri::command]
fn send_plow(state: tauri::State<State>) {
    let mut s = state.settings.lock().unwrap();
    s.cleanup_request = s.cleanup_request.wrapping_add(1);
}
#[tauri::command]
fn snow_pointer(
    window: tauri::WebviewWindow,
    state: tauri::State<State>,
    phase: String,
    x: f64,
    y: f64,
    dt: f64,
) {
    let s = state.settings.lock().unwrap();
    if !s.interactive || !s.enabled || !window.label().starts_with("snow-") {
        return;
    }
    drop(s);
    if let Some(w) = state.worlds.lock().unwrap().get_mut(window.label()) {
        w.pointer(&phase, x, y, dt);
    }
}
#[tauri::command]
fn end_interaction(app: tauri::AppHandle, state: tauri::State<State>) -> Result<(), String> {
    let mut s = state.settings.lock().unwrap().clone();
    s.interactive = false;
    save_settings(app, s, state)
}
#[tauri::command]
fn quit(app: tauri::AppHandle) {
    app.exit(0);
}
fn main() {
    #[cfg(any(target_os = "linux", target_os = "macos"))]
    control::client();
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            get_settings,
            save_settings,
            frame,
            send_plow,
            snow_pointer,
            end_interaction,
            quit
        ])
        .setup(|app| {
            let dir = app.path().app_config_dir()?;
            fs::create_dir_all(&dir)?;
            let path = dir.join("settings.json");
            let mut settings: Settings = fs::read(&path)
                .ok()
                .and_then(|b| serde_json::from_slice(&b).ok())
                .unwrap_or_default();
            settings.validate();
            settings.interactive = false;
            if std::env::args().nth(1).as_deref() == Some("enable") {
                settings.enabled = true;
            }
            let settings = Arc::new(Mutex::new(settings));
            app.manage(State {
                settings: settings.clone(),
                worlds: Mutex::new(HashMap::new()),
                path,
            });
            #[cfg(any(target_os = "linux", target_os = "macos"))]
            control::start(app.handle())?;
            #[cfg(target_os = "linux")]
            linux::start(settings);
            #[cfg(target_os = "macos")]
            for (i, monitor) in app.available_monitors()?.iter().enumerate() {
                let scale = monitor.scale_factor();
                let size = monitor.size();
                let pos = monitor.position();
                let win = tauri::WebviewWindowBuilder::new(
                    app,
                    format!("snow-{i}"),
                    tauri::WebviewUrl::App("overlay.html".into()),
                )
                .title("Nightfall snow")
                .transparent(true)
                .decorations(false)
                .shadow(false)
                .always_on_top(true)
                .skip_taskbar(true)
                .visible_on_all_workspaces(true)
                .focused(false)
                .position(pos.x as f64 / scale, pos.y as f64 / scale)
                .inner_size(size.width as f64 / scale, size.height as f64 / scale)
                .build()?;
                win.set_ignore_cursor_events(true)?;
            }
            use tauri::{
                menu::{Menu, MenuItem},
                tray::TrayIconBuilder,
            };
            let show = MenuItem::with_id(app, "show", "Nightfall settings", true, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "Quit Nightfall", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show, &quit])?;
            TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => {
                        if let Some(w) = app.get_webview_window("main") {
                            let _ = w.show();
                            let _ = w.set_focus();
                        }
                    }
                    "quit" => app.exit(0),
                    _ => {}
                })
                .build(app)?;
            Ok(())
        })
        .on_window_event(|window, event| {
            if window.label() == "main" {
                if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                    api.prevent_close();
                    let _ = window.hide();
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("Nightfall failed to start");
}
