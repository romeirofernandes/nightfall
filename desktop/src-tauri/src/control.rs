//! Local CLI control through a user-private filesystem socket.
#[cfg(unix)]
use std::os::unix::{
    fs::PermissionsExt,
    net::{UnixListener, UnixStream},
};
use std::{
    io::{Read, Write},
    path::PathBuf,
    time::Duration,
};
use tauri::Manager;
#[cfg(windows)]
use uds_windows::{UnixListener, UnixStream};

#[cfg(unix)]
fn path() -> std::io::Result<PathBuf> {
    let home = std::env::var_os("HOME").ok_or_else(|| std::io::Error::other("HOME is required"))?;
    #[cfg(target_os = "macos")]
    let base = PathBuf::from(home).join("Library/Application Support");
    #[cfg(target_os = "linux")]
    let base = std::env::var_os("XDG_CONFIG_HOME")
        .map(PathBuf::from)
        .unwrap_or_else(|| PathBuf::from(home).join(".config"));
    Ok(base.join("app.nightfall.desktop/control.sock"))
}

#[cfg(windows)]
fn path() -> std::io::Result<PathBuf> {
    // Windows AF_UNIX needs a local filesystem path of at most 107 UTF-8 bytes.
    let base = std::env::var_os("LOCALAPPDATA")
        .ok_or_else(|| std::io::Error::other("LOCALAPPDATA is required"))?;
    Ok(PathBuf::from(base).join("Nightfall.sock"))
}

pub fn show_existing() -> bool {
    let Ok(mut stream) = path().and_then(UnixStream::connect) else {
        return false;
    };
    let _ = stream.set_read_timeout(Some(Duration::from_secs(2)));
    let _ = stream.set_write_timeout(Some(Duration::from_secs(2)));
    if stream.write_all(b"show").is_err() {
        return false;
    }
    let _ = stream.shutdown(std::net::Shutdown::Write);
    let mut reply = String::new();
    let _ = stream.take(4096).read_to_string(&mut reply);
    reply.starts_with("Settings opened")
}
pub fn start(app: &tauri::AppHandle) -> std::io::Result<()> {
    let socket = path()?;
    let lock = std::fs::OpenOptions::new()
        .create(true)
        .truncate(false)
        .read(true)
        .write(true)
        .open(socket.with_extension("lock"))?;
    lock.try_lock()
        .map_err(|e| std::io::Error::other(e.to_string()))?;
    let _ = std::fs::remove_file(&socket);
    let listener = UnixListener::bind(&socket)?;
    #[cfg(unix)]
    std::fs::set_permissions(&socket, std::fs::Permissions::from_mode(0o600))?;
    let app = app.clone();
    std::thread::spawn(move || {
        let _lock = lock;
        for mut stream in listener.incoming().flatten() {
            let _ = stream.set_read_timeout(Some(Duration::from_secs(2)));
            let _ = stream.set_write_timeout(Some(Duration::from_secs(2)));
            let mut command = String::new();
            if std::io::Read::by_ref(&mut stream)
                .take(16 * 1024)
                .read_to_string(&mut command)
                .is_err()
            {
                continue;
            }
            let app = app.clone();
            let handle = app.clone();
            let _ = app.run_on_main_thread(move || {
                let state = handle.state::<crate::State>();
                let mut s = state.settings.lock().unwrap().clone();
                let result = if let Some(json) = command.strip_prefix("set ") {
                    serde_json::from_str::<crate::Settings>(json)
                        .map_err(|e| e.to_string())
                        .and_then(|s| crate::save_settings(handle.clone(), s, state))
                        .map(|_| "Saved".to_owned())
                } else {
                    match command.as_str() {
                        "show" => crate::show_settings(&handle).map(|_| "Settings opened\n".into()),
                        "get" => serde_json::to_string(&s).map_err(|e| e.to_string()),
                        "sweep" => {
                            crate::send_plow(state);
                            Ok("Cleanup requested".into())
                        }
                        "enable" | "disable" | "toggle" => {
                            s.enabled = match command.as_str() {
                                "enable" => true,
                                "disable" => false,
                                _ => !s.enabled,
                            };
                            crate::save_settings(handle.clone(), s, state)
                                .map(|_| "Settings updated\n".to_owned())
                        }
                        "status" => Ok(format!(
                            "Nightfall running, snow {}\n",
                            if s.enabled { "enabled" } else { "disabled" }
                        )),
                        "quit" => {
                            let _ = stream.write_all(b"Nightfall stopped\n");
                            handle.exit(0);
                            return;
                        }
                        _ => Err("Unknown command".into()),
                    }
                };
                let reply = result.unwrap_or_else(|e| format!("error: {e}\n"));
                let _ = stream.write_all(reply.as_bytes());
            });
        }
    });
    Ok(())
}
