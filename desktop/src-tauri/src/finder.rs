// Finder's scripting interface reports desktop icon centers and the configured icon size.
use crate::engine::{local_ledge, Ledge, Settings};
use std::{
    process::Command,
    sync::{Arc, Mutex},
    thread,
    time::Duration,
};

const FOLDER_GEOMETRY: &str = r#"
with timeout of 2 seconds
    tell application id "com.apple.finder"
        set iconSize to icon size of icon view options of desktop
        set folderPositions to desktop position of every folder of desktop
    end tell
end timeout
set rows to ""
repeat with coords in folderPositions
    if contents of coords is not missing value then
        set rows to rows & (item 1 of coords as text) & tab & (item 2 of coords as text) & tab & (iconSize as text) & linefeed
    end if
end repeat
return rows
"#;

pub type FolderBounds = Arc<Mutex<Vec<[f64; 3]>>>;

pub fn start(settings: Arc<Mutex<Settings>>, bounds: FolderBounds) {
    thread::spawn(move || loop {
        let enabled = {
            let current = settings.lock().unwrap();
            current.desktop_folders && current.enabled && current.accumulation
        };
        if enabled {
            let output = Command::new("/usr/bin/osascript")
                .args(["-e", FOLDER_GEOMETRY])
                .output();
            let geometry = output
                .ok()
                .filter(|result| result.status.success())
                .map(|result| parse_bounds(&String::from_utf8_lossy(&result.stdout)))
                .unwrap_or_default();
            *bounds.lock().unwrap() = geometry;
        } else {
            bounds.lock().unwrap().clear();
        }
        thread::sleep(Duration::from_secs(3));
    });
}

fn parse_bounds(output: &str) -> Vec<[f64; 3]> {
    output
        .lines()
        .filter_map(|line| {
            let mut columns = line.split('\t');
            let x: f64 = columns.next()?.parse().ok()?;
            let y: f64 = columns.next()?.parse().ok()?;
            let size: f64 = columns.next()?.parse().ok()?;
            if !x.is_finite() || !y.is_finite() || !(16. ..=512.).contains(&size) {
                return None;
            }
            Some([x - size / 2., y - size / 2., size])
        })
        .collect()
}

pub fn ledges(
    bounds: &[[f64; 3]],
    ox: f64,
    oy: f64,
    width: f64,
    height: f64,
) -> impl Iterator<Item = Ledge> + '_ {
    bounds.iter().filter_map(move |&[x, y, size]| {
        let (left, top, span) = local_ledge([x - ox, y - oy, size], width, height)?;
        Some(Ledge::new(format!("folder-{x}-{y}"), left, top, span))
    })
}

#[cfg(test)]
mod tests {
    use super::parse_bounds;

    #[test]
    fn finder_centers_become_top_edges() {
        assert_eq!(
            parse_bounds("140\t200\t64\ninvalid\nNaN\t0\t64\n0\t0\t0\n"),
            vec![[108., 168., 64.]]
        );
    }
}
