use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder};

pub fn start(app: &AppHandle) -> tauri::Result<()> {
    for (index, monitor) in app.available_monitors()?.iter().enumerate() {
        let area = monitor.work_area();
        let window = WebviewWindowBuilder::new(
            app,
            format!("snow-{index}"),
            WebviewUrl::App("overlay.html".into()),
        )
        .title("Nightfall snow")
        .transparent(true)
        .decorations(false)
        .shadow(false)
        .resizable(false)
        .skip_taskbar(true)
        .focusable(false)
        .focused(false)
        .visible(false)
        .build()?;

        // Use physical coordinates so monitors with mixed DPI or negative
        // virtual-desktop offsets retain the correct position.
        window.set_position(area.position)?;
        window.set_size(area.size)?;
        window.set_ignore_cursor_events(true)?;
        window.show()?;
        window.set_always_on_bottom(true)?;
    }
    Ok(())
}

pub fn set_interaction(app: &AppHandle, capture: bool) -> Result<(), String> {
    for (label, window) in app.webview_windows() {
        if !label.starts_with("snow-") {
            continue;
        }
        window
            .set_focusable(capture)
            .and_then(|_| window.set_ignore_cursor_events(!capture))
            .and_then(|_| {
                if capture {
                    window.set_always_on_bottom(false)?;
                    window.set_always_on_top(true)
                } else {
                    window.set_always_on_top(false)?;
                    window.set_always_on_bottom(true)
                }
            })
            .map_err(|error| error.to_string())?;
        if capture {
            let _ = window.set_focus();
        }
    }
    Ok(())
}
