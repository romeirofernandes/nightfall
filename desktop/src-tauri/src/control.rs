//! Local CLI control through a user-private filesystem socket.
#[cfg(windows)]
use std::io::{BufRead, BufReader};
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

#[cfg(unix)]
fn read_command(stream: &mut UnixStream) -> std::io::Result<String> {
    let mut command = String::new();
    stream.take(16 * 1024).read_to_string(&mut command)?;
    Ok(command)
}

#[cfg(windows)]
fn read_command(stream: &mut UnixStream) -> std::io::Result<String> {
    let mut command = String::new();
    BufReader::new(stream.take(16 * 1024)).read_line(&mut command)?;
    if command.pop() == Some('\n') {
        Ok(command)
    } else {
        Err(std::io::Error::other("Incomplete control command"))
    }
}

fn send_reply(stream: &mut UnixStream, reply: &str) {
    let mut send = || -> std::io::Result<()> {
        #[cfg(windows)]
        {
            // An explicit line boundary lets the client read without waiting
            // for the Windows socket to close.
            let line = reply.trim_end_matches('\n').replace('\n', " ");
            writeln!(stream, "{line}")?;
            stream.shutdown(std::net::Shutdown::Write)?;
            Ok(())
        }
        #[cfg(unix)]
        stream.write_all(reply.as_bytes())
    };
    if let Err(error) = send() {
        eprintln!("Nightfall could not send a control reply: {error}");
    }
}

pub fn show_existing() -> bool {
    let Ok(mut stream) = path().and_then(UnixStream::connect) else {
        return false;
    };
    let _ = stream.set_read_timeout(Some(Duration::from_secs(2)));
    let _ = stream.set_write_timeout(Some(Duration::from_secs(2)));
    #[cfg(windows)]
    let request = b"show\n";
    #[cfg(unix)]
    let request = b"show";
    if stream.write_all(request).is_err() {
        return false;
    }
    let mut reply = String::new();
    #[cfg(unix)]
    {
        let _ = stream.shutdown(std::net::Shutdown::Write);
        let _ = stream.take(4096).read_to_string(&mut reply);
    }
    #[cfg(windows)]
    let _ = BufReader::new(stream.take(4096)).read_line(&mut reply);
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
            let command = match read_command(&mut stream) {
                Ok(command) => command,
                Err(error) => {
                    eprintln!("Nightfall could not read a control command: {error}");
                    continue;
                }
            };
            let app = app.clone();
            let handle = app.clone();
            if let Err(error) = app.run_on_main_thread(move || {
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
                            send_reply(&mut stream, "Nightfall stopped\n");
                            handle.exit(0);
                            return;
                        }
                        _ => Err("Unknown command".into()),
                    }
                };
                let reply = result.unwrap_or_else(|e| format!("error: {e}\n"));
                send_reply(&mut stream, &reply);
            }) {
                eprintln!("Nightfall could not dispatch a control command: {error}");
            }
        }
    });
    Ok(())
}
