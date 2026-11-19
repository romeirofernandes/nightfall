use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder};
use windows_sys::Win32::{
    Foundation::{HWND, RECT},
    Graphics::Dwm::{DwmGetWindowAttribute, DWMWA_CLOAKED, DWMWA_EXTENDED_FRAME_BOUNDS},
    UI::WindowsAndMessaging::{
        GetTopWindow, GetWindow, GetWindowLongW, IsIconic, IsWindowVisible, GWL_EXSTYLE, GWL_STYLE,
        GW_HWNDNEXT, WS_CAPTION, WS_EX_APPWINDOW, WS_EX_TOOLWINDOW, WS_THICKFRAME,
    },
};

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
    let cursor = if capture {
        app.cursor_position().ok()
    } else {
        None
    };
    let mut focus: Option<tauri::WebviewWindow> = None;
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
            let under_cursor = cursor.is_some_and(|cursor| {
                let (Ok(pos), Ok(size)) = (window.inner_position(), window.inner_size()) else {
                    return false;
                };
                let (left, top) = (f64::from(pos.x), f64::from(pos.y));
                cursor.x >= left
                    && cursor.x < left + f64::from(size.width)
                    && cursor.y >= top
                    && cursor.y < top + f64::from(size.height)
            });
            if under_cursor || focus.is_none() {
                focus = Some(window);
            }
        }
    }
    if let Some(window) = focus {
        let _ = window.set_focus();
    }
    Ok(())
}

/// Read visible window geometry without reading titles or capturing screen contents.
pub fn surfaces(
    origin: [f64; 2],
    scale: f64,
    width: f64,
    height: f64,
) -> Vec<crate::engine::Ledge> {
    let mut windows = Vec::new();
    // Walk the z-order so foreground windows can cover the ledges behind them.
    // Bound the walk in case a window is destroyed or reordered during the scan.
    unsafe {
        let mut window = GetTopWindow(std::ptr::null_mut());
        for _ in 0..2048 {
            if window.is_null() {
                break;
            }
            if let Some(bounds) = window_bounds(window) {
                windows.push((window as usize, bounds));
            }
            window = GetWindow(window, GW_HWNDNEXT);
        }
    }
    crate::window_ledges::visible_ledges(&windows, origin, scale, width, height)
}

fn window_bounds(window: HWND) -> Option<[f64; 4]> {
    let mut cloaked: u32 = 0;
    let mut bounds = RECT::default();
    unsafe {
        if IsWindowVisible(window) == 0 || IsIconic(window) != 0 {
            return None;
        }
        let style = GetWindowLongW(window, GWL_STYLE) as u32;
        let extended = GetWindowLongW(window, GWL_EXSTYLE) as u32;
        // Exclude the snow overlays, desktop shell surfaces and tool palettes.
        let app_frame = style & WS_CAPTION == WS_CAPTION
            || style & WS_THICKFRAME != 0
            || extended & WS_EX_APPWINDOW != 0;
        if extended & WS_EX_TOOLWINDOW != 0 || !app_frame {
            return None;
        }
        if DwmGetWindowAttribute(
            window,
            DWMWA_CLOAKED as u32,
            (&mut cloaked as *mut u32).cast(),
            std::mem::size_of::<u32>() as u32,
        ) < 0
            || cloaked != 0
        {
            return None;
        }
        if DwmGetWindowAttribute(
            window,
            DWMWA_EXTENDED_FRAME_BOUNDS as u32,
            (&mut bounds as *mut RECT).cast(),
            std::mem::size_of::<RECT>() as u32,
        ) < 0
            || bounds.right <= bounds.left
            || bounds.bottom <= bounds.top
        {
            return None;
        }
    }
    Some([bounds.left, bounds.top, bounds.right, bounds.bottom].map(f64::from))
}

#[cfg(test)]
mod tests {
    use super::*;
    use windows_sys::Win32::{
        Graphics::Dwm::DwmFlush,
        UI::WindowsAndMessaging::{
            CreateWindowExW, DestroyWindow, ShowWindow, SW_HIDE, WS_OVERLAPPEDWINDOW, WS_VISIBLE,
        },
    };

    #[test]
    fn reads_a_real_window_frame_and_excludes_it_after_hide() {
        let class: Vec<_> = "STATIC\0".encode_utf16().collect();
        let window = unsafe {
            CreateWindowExW(
                0,
                class.as_ptr(),
                class.as_ptr(),
                WS_OVERLAPPEDWINDOW | WS_VISIBLE,
                80,
                80,
                320,
                200,
                std::ptr::null_mut(),
                std::ptr::null_mut(),
                std::ptr::null_mut(),
                std::ptr::null(),
            )
        };
        assert!(!window.is_null(), "could not create the test window");
        unsafe { DwmFlush() };
        let visible = window_bounds(window);
        unsafe { ShowWindow(window, SW_HIDE) };
        let hidden = window_bounds(window);
        unsafe { DestroyWindow(window) };
        assert!(visible.is_some());
        assert!(hidden.is_none());
    }
}
