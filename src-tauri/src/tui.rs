//! Terminal controls stay independent of the compositor and renderer.
use crate::{control, engine::Settings};
use crossterm::{cursor, event::{self, Event, KeyCode, KeyModifiers}, execute, terminal::{self, ClearType}};
use std::os::unix::process::CommandExt;
use std::{io::{self, IsTerminal, Write}, time::Duration};
struct Terminal;
impl Drop for Terminal {
    fn drop(&mut self) {
        let _ = terminal::disable_raw_mode();
        let _ = execute!(io::stdout(), cursor::Show, terminal::LeaveAlternateScreen);
    }
}
pub fn ensure_renderer() -> io::Result<()> {
    if control::request("get").is_err() {
        let mut daemon = std::process::Command::new(std::env::current_exe()?);
        daemon.arg("--daemon").stdin(std::process::Stdio::null())
            .stdout(std::process::Stdio::null()).stderr(std::process::Stdio::null());
        // Detach the renderer so closing the terminal cannot send it SIGHUP.
        unsafe { daemon.pre_exec(|| {
            if libc::setsid() == -1 { return Err(io::Error::last_os_error()); }
            Ok(())
        }); }
        daemon.spawn()?;
        for _ in 0..100 {
            if control::request("get").is_ok() { break; }
            std::thread::sleep(Duration::from_millis(50));
        }
    }
    control::request("get").map(|_| ())
}
pub fn run() -> io::Result<()> {
    if !io::stdin().is_terminal() || !io::stdout().is_terminal() {
        return Err(io::Error::other("Run nightfall in a terminal, or use nightfall --help"));
    }
    ensure_renderer()?;
    let mut settings: Settings = serde_json::from_str(&control::request("get")?)?;
    terminal::enable_raw_mode()?;
    let _guard = Terminal;
    execute!(io::stdout(), terminal::EnterAlternateScreen, cursor::Hide)?;
    let mut selected = 0usize;
    let mut message = String::new();
    loop {
        let rows = vec![
            format!("Snow              {}", settings.enabled),
            format!("Intensity         {}", ["Flurry", "Snow day", "Blizzard"][settings.intensity as usize]),
            format!("Wind              {}", settings.wind),
            format!("Snow on ledges    {}", settings.accumulation),
            format!("Icicles           {}", settings.icicles),
            format!("Snowman           {}", settings.snowman),
            format!("Snowman count     {}", settings.snowman_count),
            format!("Snowman size      {:.1}", settings.snowman_size),
            format!("Trees             {}", settings.trees),
            format!("Gifts             {}", settings.gifts),
            format!("Decoration size   {:.1}", settings.decoration_size),
            format!("Lights            {}", settings.lights),
            format!("Dangling lights   {}", settings.dangling),
            format!("Santa cleanup     {}", settings.plow),
            format!("Cleanup seconds   {}", settings.cleanup_interval),
            format!("Frame rate        {}", settings.fps),
        ];
        let (width, height) = terminal::size()?;
        execute!(io::stdout(), cursor::MoveTo(0,0), terminal::Clear(ClearType::All))?;
        if width < 44 || height < 8 {
            write!(io::stdout(), "Resize terminal to 44 x 8. q closes.")?;
        } else {
            write!(io::stdout(), "NIGHTFALL  /  desktop winter\r\n\r\n")?;
            let visible = (height as usize).saturating_sub(6);
            let start = selected.saturating_sub(visible.saturating_sub(1));
            for (i, row) in rows.iter().enumerate().skip(start).take(visible) {
                write!(io::stdout(), "{} {}\r\n", if i == selected { ">" } else { " " }, row)?;
            }
            write!(io::stdout(), "\r\nUp/Down select  Left/Right change\r\nq close  x stop snow  c sweep\r\n{}", message.chars().take(width as usize).collect::<String>())?;
        }
        io::stdout().flush()?;
        while !event::poll(Duration::from_millis(250))? {}
        let Event::Key(key) = event::read()? else { continue; };
        if key.code == KeyCode::Char('q') || key.code == KeyCode::Esc || (key.code == KeyCode::Char('c') && key.modifiers.contains(KeyModifiers::CONTROL)) { break; }
        match key.code {
            KeyCode::Up => { selected = selected.saturating_sub(1); continue; }
            KeyCode::Down => { selected = (selected + 1).min(rows.len()-1); continue; }
            KeyCode::Char('x') => { control::request("quit")?; break; }
            KeyCode::Char('c') => { message = control::request("sweep")?; continue; }
            KeyCode::Left | KeyCode::Right | KeyCode::Enter | KeyCode::Char(' ') => {}
            _ => continue,
        }
        let delta: f64 = if key.code == KeyCode::Left { -1. } else { 1. };
        let count = |n: u8| (n as i16 + delta as i16).clamp(0, 20) as u8;
        match selected {
            0 => settings.enabled = !settings.enabled,
            1 => settings.intensity = (settings.intensity as i16 + delta as i16).rem_euclid(3) as u8,
            2 => settings.wind += delta * 4.,
            3 => settings.accumulation = !settings.accumulation,
            4 => settings.icicles = !settings.icicles,
            5 => settings.snowman = !settings.snowman,
            6 => settings.snowman_count = count(settings.snowman_count),
            7 => settings.snowman_size += delta * 0.1,
            8 => settings.trees = count(settings.trees),
            9 => settings.gifts = count(settings.gifts),
            10 => settings.decoration_size += delta * 0.1,
            11 => settings.lights = !settings.lights,
            12 => settings.dangling = !settings.dangling,
            13 => settings.plow = !settings.plow,
            14 => settings.cleanup_interval += delta * 15.,
            15 => settings.fps = if settings.fps == 30 { 60 } else { 30 },
            _ => {}
        }
        settings.validate();
        message = control::request(&format!("set {}", serde_json::to_string(&settings)?))?;
    }
    Ok(())
}
