//! Local, per-user CLI control. The socket lives in Tauri's private config directory.
use std::{
    io::{Read, Write},
    os::unix::{
        fs::PermissionsExt,
        net::{UnixListener, UnixStream},
    },
    path::PathBuf,
    time::Duration,
};
use tauri::Manager;
fn path() -> PathBuf {
    let home = std::env::var_os("HOME").expect("HOME is required");
    #[cfg(target_os = "macos")]
    let base = PathBuf::from(home).join("Library/Application Support");
    #[cfg(target_os = "linux")]
    let base = std::env::var_os("XDG_CONFIG_HOME")
        .map(PathBuf::from)
        .unwrap_or_else(|| PathBuf::from(home).join(".config"));
    base.join("app.nightfall.desktop/control.sock")
}
pub fn client() {
    let command = std::env::args().nth(1);
    if matches!(command.as_deref(), Some("--help" | "-h")) {
        println!("nightfall [enable|disable|toggle|status|quit]\nRun without arguments to open settings. enable starts the app if stopped.");
        std::process::exit(0);
    }
    if let Some(c) = &command {
        if !["enable", "disable", "toggle", "status", "quit"].contains(&c.as_str()) {
            eprintln!("Unknown command: {c}. See nightfall --help");
            std::process::exit(2);
        }
    }
    match UnixStream::connect(path()) {
        Ok(mut stream) => {
            let _ = stream.set_read_timeout(Some(Duration::from_secs(5)));
            stream
                .write_all(command.as_deref().unwrap_or("show").as_bytes())
                .unwrap();
            let _ = stream.shutdown(std::net::Shutdown::Write);
            let mut reply = String::new();
            stream
                .read_to_string(&mut reply)
                .expect("Control response timed out");
            print!("{reply}");
            std::process::exit(if reply.starts_with("error:") { 1 } else { 0 });
        }
        Err(_) if command.as_deref().is_some_and(|c| c != "enable") => {
            println!("Nightfall is stopped");
            std::process::exit(1);
        }
        Err(_) => {}
    }
}
pub fn start(app: &tauri::AppHandle) -> std::io::Result<()> {
    let socket = path();
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
    std::fs::set_permissions(&socket, std::fs::Permissions::from_mode(0o600))?;
    let app = app.clone();
    std::thread::spawn(move || {
        let _lock = lock;
        for mut stream in listener.incoming().flatten() {
            let _ = stream.set_read_timeout(Some(Duration::from_secs(2)));
            let mut command = String::new();
            if std::io::Read::by_ref(&mut stream)
                .take(64)
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
                let result = match command.as_str() {
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
                    "show" => {
                        if let Some(w) = handle.get_webview_window("main") {
                            let _ = w.show();
                            let _ = w.set_focus();
                        }
                        Ok("Settings opened\n".into())
                    }
                    "quit" => {
                        let _ = stream.write_all(b"Nightfall stopped\n");
                        handle.exit(0);
                        return;
                    }
                    _ => Err("Unknown command".into()),
                };
                let reply = result.unwrap_or_else(|e| format!("error: {e}\n"));
                let _ = stream.write_all(reply.as_bytes());
            });
        }
    });
    Ok(())
}
