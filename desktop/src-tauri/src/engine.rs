use rand::{rngs::SmallRng, Rng, SeedableRng};
use serde::{Deserialize, Serialize};

#[derive(Clone, Copy, Default, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum LightPattern {
    #[default]
    Steady,
    Twinkle,
    Wave,
    Alternate,
}
#[derive(Clone, Copy, Default, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Theme {
    #[default]
    Dark,
    Light,
    System,
}

#[derive(Clone, Serialize, Deserialize)]
#[serde(default)]
pub struct Settings {
    pub enabled: bool,
    pub intensity: u8,
    pub wind: f64,
    pub accumulation: bool,
    pub icicles: bool,
    pub snowman: bool,
    pub plow: bool,
    pub fps: u8,
    pub cleanup_interval: f64,
    pub snowman_count: u8,
    pub snowman_size: f64,
    pub trees: u8,
    pub gifts: u8,
    pub decoration_size: f64,
    pub lights: bool,
    pub light_pattern: LightPattern,
    pub theme: Theme,
    pub window_inset: f64,
    pub placements: std::collections::BTreeMap<String, [f64; 2]>,
    pub dangling: bool,
    pub interactive: bool,
    #[serde(skip)]
    pub cleanup_request: u64,
}
impl Default for Settings {
    fn default() -> Self {
        Self {
            enabled: true,
            intensity: 1,
            wind: 12.,
            accumulation: true,
            icicles: true,
            snowman: true,
            plow: true,
            fps: 30,
            cleanup_interval: 120.,
            snowman_count: 1,
            snowman_size: 1.,
            trees: 0,
            gifts: 0,
            decoration_size: 1.,
            lights: false,
            light_pattern: LightPattern::Steady,
            theme: Theme::Dark,
            window_inset: 22.,
            placements: Default::default(),
            dangling: false,
            interactive: false,
            cleanup_request: 0,
        }
    }
}
impl Settings {
    pub fn validate(&mut self) {
        self.window_inset = finite(self.window_inset, 22.).clamp(0., 40.);
        self.placements.retain(|key, position| {
            let Some((kind, index)) = key.split_once('-') else {
                return false;
            };
            let Ok(index) = index.parse::<u8>() else {
                return false;
            };
            let count = match kind {
                "snowman" | "tree" => 12,
                "gift" => 20,
                "ornament" => 30,
                _ => return false,
            };
            if index >= count || key != &format!("{kind}-{index}") {
                return false;
            }
            for value in position {
                *value = finite(*value, 0.5).clamp(0., 1.);
            }
            true
        });
        self.cleanup_interval = finite(self.cleanup_interval, 120.).clamp(15., 3600.);
        self.snowman_count = self.snowman_count.min(12);
        self.trees = self.trees.min(12);
        self.gifts = self.gifts.min(20);
        self.snowman_size = finite(self.snowman_size, 1.).clamp(0.4, 2.5);
        self.decoration_size = finite(self.decoration_size, 1.).clamp(0.4, 2.5);
        if !self.enabled {
            self.interactive = false;
        }
        self.intensity = self.intensity.min(2);
        self.wind = if self.wind.is_finite() {
            self.wind.clamp(-80., 80.)
        } else {
            12.
        };
        self.fps = if self.fps == 60 { 60 } else { 30 };
    }
}
fn finite(value: f64, fallback: f64) -> f64 {
    if value.is_finite() {
        value
    } else {
        fallback
    }
}
#[cfg(any(target_os = "macos", test))]
pub fn local_ledge([x, y, span]: [f64; 3], width: f64, height: f64) -> Option<(f64, f64, f64)> {
    let left = x.max(0.);
    let right = (x + span).min(width);
    (y >= 0. && y < height && right > left).then_some((left, y, right - left))
}

pub fn noise(seed: f64) -> f64 {
    (seed.sin() * 43758.5453).fract().abs()
}
#[derive(Clone, Serialize)]
pub struct Snowball {
    pub x: f64,
    pub y: f64,
    pub vx: f64,
    pub vy: f64,
    pub r: f64,
    pub held: bool,
}
#[derive(Clone, Serialize)]
pub struct Flake {
    pub x: f64,
    pub y: f64,
    pub r: f64,
    pub speed: f64,
    pub phase: f64,
}
#[derive(Clone, Serialize)]
pub struct Ledge {
    pub id: String,
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub age: f64,
    pub bank: Vec<f64>,
}
impl Ledge {
    pub fn new(id: String, x: f64, y: f64, width: f64) -> Self {
        Self {
            id,
            x,
            y,
            width,
            age: 0.,
            bank: vec![0.; (width.max(1.) / 8.).ceil() as usize],
        }
    }
}
#[derive(Serialize)]
pub struct Winter {
    pub width: f64,
    pub height: f64,
    pub flakes: Vec<Flake>,
    pub ledges: Vec<Ledge>,
    pub time: f64,
    #[serde(skip)]
    #[allow(dead_code)]
    pub geometry_time: f64,
    pub plow_x: Option<f64>,
    pub snowballs: Vec<Snowball>,
    pub cleanup_progress: f64,
    #[serde(skip)]
    cleanup_elapsed: f64,
    #[serde(skip)]
    previous_interval: f64,
    #[serde(skip)]
    last_cleanup_request: u64,
    #[serde(skip)]
    rng: SmallRng,
    #[serde(skip)]
    spawn: f64,
    #[serde(skip)]
    next_plow: f64,
}
impl Winter {
    pub fn new(width: f64, height: f64) -> Self {
        Self {
            width,
            height,
            flakes: vec![],
            ledges: vec![Ledge::new("ground".into(), 0., height - 4., width)],
            time: 0.,
            geometry_time: 0.,
            plow_x: None,
            rng: SmallRng::seed_from_u64(2048),
            spawn: 0.,
            next_plow: 120.,
            snowballs: vec![],
            cleanup_progress: 0.,
            cleanup_elapsed: 0.,
            previous_interval: 120.,
            last_cleanup_request: 0,
        }
    }
    pub fn surfaces(&mut self, mut ledges: Vec<Ledge>) {
        ledges.push(Ledge::new(
            "ground".into(),
            0.,
            self.height - 4.,
            self.width,
        ));
        for ledge in &mut ledges {
            if let Some(old) = self.ledges.iter().find(|o| {
                o.id == ledge.id
                    && (o.x - ledge.x).abs() < 2.
                    && (o.y - ledge.y).abs() < 2.
                    && (o.width - ledge.width).abs() < 2.
            }) {
                ledge.bank = old.bank.clone();
                ledge.age = old.age;
            }
        }
        for old in &self.ledges {
            let stable = ledges.iter().any(|l| {
                l.id == old.id
                    && (l.x - old.x).abs() < 2.
                    && (l.y - old.y).abs() < 2.
                    && (l.width - old.width).abs() < 2.
            });
            if !stable {
                for (i, depth) in old.bank.iter().enumerate().step_by(2) {
                    if *depth > 1. && self.flakes.len() < 900 {
                        self.flakes.push(Flake {
                            x: old.x + i as f64 * 8.,
                            y: old.y - depth,
                            r: (depth / 3.).clamp(1., 3.),
                            speed: 70.,
                            phase: self.rng.gen_range(0.0..6.28),
                        });
                    }
                }
            }
        }
        self.ledges = ledges;
    }
    pub fn start_cleanup(&mut self) {
        self.plow_x = Some(-150.);
        self.cleanup_progress = 0.;
        self.cleanup_elapsed = 0.;
    }
    fn spray(&mut self, x: f64, y: f64, count: usize) {
        for _ in 0..count.min(32) {
            if self.flakes.len() >= 900 {
                break;
            }
            self.flakes.push(Flake {
                x: x + self.rng.gen_range(-10.0..10.0),
                y,
                r: self.rng.gen_range(0.8..2.4),
                speed: self.rng.gen_range(45.0..120.0),
                phase: self.rng.gen_range(0.0..6.28),
            });
        }
    }
    pub fn pointer(&mut self, phase: &str, x: f64, y: f64, dt: f64) {
        if !x.is_finite() || !y.is_finite() {
            return;
        }
        if phase == "down" {
            if self.snowballs.len() >= 24 {
                self.snowballs.remove(0);
            }
            if self.snowballs.iter().any(|b| b.held) {
                return;
            }
            let mut mass = 0.;
            for l in &mut self.ledges {
                if (y - l.y).abs() > 30. {
                    continue;
                }
                let n = l.bank.len();
                for (i, h) in l.bank.iter_mut().enumerate() {
                    let bx = l.x + (i as f64 + 0.5) * l.width / n as f64;
                    if (bx - x).abs() < 24. {
                        let take = (*h).min(5.);
                        *h -= take;
                        mass += take * l.width / n as f64;
                    }
                }
            }
            if mass > 8. {
                self.snowballs.push(Snowball {
                    x,
                    y,
                    vx: 0.,
                    vy: 0.,
                    r: (mass / std::f64::consts::PI).sqrt().clamp(2., 22.),
                    held: true,
                });
            }
        } else if let Some(b) = self.snowballs.iter_mut().find(|b| b.held) {
            if phase == "move" {
                let dt = finite(dt, 0.016).clamp(0.008, 0.1);
                b.vx = (0.4 * b.vx + 0.6 * (x - b.x) / dt).clamp(-1600., 1600.);
                b.vy = (0.4 * b.vy + 0.6 * (y - b.y) / dt).clamp(-1600., 1600.);
                b.x = x;
                b.y = y;
            }
            if phase == "up" {
                b.held = false;
            }
        }
    }
    fn step_snowballs(&mut self, dt: f64, s: &Settings) {
        let mut bursts = vec![];
        for b in &mut self.snowballs {
            if b.held {
                if !s.interactive {
                    b.held = false;
                } else {
                    b.vx *= (-dt * 10.).exp();
                    b.vy *= (-dt * 10.).exp();
                    continue;
                }
            }
            // Four substeps plus swept crossings prevent tunnelling through window ledges.
            for _ in 0..4 {
                let step = dt / 4.;
                let old_y = b.y;
                b.vx += (s.wind * 0.15 - b.vx * 0.025) * step;
                b.vy += 680. * step;
                b.x += b.vx * step;
                b.y += b.vy * step;
                if b.x < b.r {
                    b.x = b.r;
                    b.vx = b.vx.abs() * 0.45;
                }
                if b.x > self.width - b.r {
                    b.x = self.width - b.r;
                    b.vx = -b.vx.abs() * 0.45;
                }
                let hit = self
                    .ledges
                    .iter()
                    .filter_map(|l| {
                        if b.x + b.r < l.x || b.x - b.r > l.x + l.width {
                            return None;
                        }
                        let i = (((b.x - l.x) / l.width * l.bank.len() as f64).max(0.) as usize)
                            .min(l.bank.len() - 1);
                        let y = l.y - l.bank[i];
                        if b.vy > 0. && old_y + b.r <= y + 1. && b.y + b.r >= y {
                            Some(y)
                        } else {
                            None
                        }
                    })
                    .min_by(|a, b| a.total_cmp(b));
                if let Some(y) = hit {
                    if b.vy > 470. {
                        bursts.push((b.x, y, (b.r * 1.5) as usize));
                        b.r = 0.;
                        break;
                    }
                    b.y = y - b.r;
                    b.vy = if b.vy < 45. { 0. } else { -b.vy * 0.33 };
                    b.vx *= 0.84;
                }
            }
        }
        self.snowballs
            .retain(|b| b.r > 0. && b.y < self.height + 80.);
        for (x, y, n) in bursts {
            self.spray(x, y, n);
        }
    }

    pub fn step(&mut self, dt: f64, s: &Settings) {
        if !s.enabled {
            return;
        }
        let dt = dt.clamp(0., 0.05);
        self.time += dt;
        if s.cleanup_request != self.last_cleanup_request {
            self.start_cleanup();
            self.last_cleanup_request = s.cleanup_request;
        }
        self.spawn += dt * [14., 38., 95.][s.intensity.min(2) as usize];
        for _ in 0..self.spawn as usize {
            if self.flakes.len() < 900 {
                self.flakes.push(Flake {
                    x: self.rng.gen_range(0.0..self.width.max(1.)),
                    y: -8.,
                    r: self.rng.gen_range(0.7..2.7),
                    speed: self.rng.gen_range(20.0..60.0),
                    phase: self.rng.gen_range(0.0..6.28),
                });
            }
        }
        self.spawn = self.spawn.fract();
        for ledge in &mut self.ledges {
            ledge.age += dt;
        }
        let t = self.time;
        let width = self.width;
        self.flakes.retain_mut(|f| {
            let before = f.y;
            f.x = (f.x + (s.wind + (t * 0.7 + f.phase).sin() * 14.) * dt).rem_euclid(width.max(1.));
            f.y += f.speed * dt;
            if s.accumulation {
                // Choose the first crossed surface, independent of discovery order.
                let hit = self
                    .ledges
                    .iter()
                    .enumerate()
                    .filter_map(|(n, l)| {
                        if f.x < l.x || f.x >= l.x + l.width {
                            return None;
                        }
                        let i = (((f.x - l.x) / 8.) as usize).min(l.bank.len() - 1);
                        let y = l.y - l.bank[i];
                        if before <= y && f.y >= y {
                            Some((n, i, y))
                        } else {
                            None
                        }
                    })
                    .min_by(|a, b| a.2.total_cmp(&b.2));
                if let Some((n, i, _)) = hit {
                    let l = &mut self.ledges[n];
                    let u = (i as f64 + 0.5) / l.bank.len() as f64;
                    let taper = (std::f64::consts::PI * u).sin().powf(0.65);
                    l.bank[i] = (l.bank[i] + 0.65 * taper).min(20.);
                    return false;
                }
            }
            f.y < self.height + 10.
        });
        let mut shedding = vec![];
        for l in &mut self.ledges {
            let old = l.bank.clone();
            let n = old.len();
            for (i, h) in l.bank.iter_mut().enumerate() {
                let u = (i as f64 + 0.5) / n as f64;
                let taper = (std::f64::consts::PI * u).sin().powf(0.6);
                let limit = (3. + 17. * taper) * (0.83 + 0.17 * (u * 19. + l.x * 0.01).sin());
                let avg = (old[i.saturating_sub(1)] + old[(i + 1).min(n - 1)]) / 2.;
                *h = (*h + (avg - *h) * dt * 0.4 - dt * 0.006).max(0.);
                if *h > limit || (*h > 6. && self.rng.gen::<f64>() < dt * 0.003) {
                    let lost = (*h - limit).max(*h * 0.15).min(6.);
                    *h -= lost;
                    shedding.push((l.x + i as f64 * l.width / n as f64, l.y + 3., lost));
                }
                if !s.accumulation {
                    *h = 0.;
                }
            }
        }
        for (x, y, depth) in shedding {
            self.spray(x, y, depth as usize + 2);
        }
        if (s.cleanup_interval - self.previous_interval).abs() > 0.1 {
            self.next_plow = self.time + s.cleanup_interval;
            self.previous_interval = s.cleanup_interval;
        }
        if s.plow && self.time >= self.next_plow && self.plow_x.is_none() {
            self.start_cleanup();
        }
        if self.plow_x.is_some() {
            let previous = self.cleanup_progress * (self.width + 300.) - 150.;
            self.cleanup_elapsed += dt;
            self.cleanup_progress = (self.cleanup_elapsed / 9.).min(1.);
            let x = self.cleanup_progress * (self.width + 300.) - 150.;
            self.plow_x = Some(x);
            // The sleigh's sweep clears every surface under its path, not just the floor.
            for l in &mut self.ledges {
                let n = l.bank.len();
                for (i, h) in l.bank.iter_mut().enumerate() {
                    let bx = l.x + (i as f64 + 0.5) * l.width / n as f64;
                    if bx >= previous - 35. && bx <= x + 35. {
                        *h *= 0.05;
                    }
                }
            }
            if self.cleanup_progress >= 1. {
                self.plow_x = None;
                self.next_plow = self.time + s.cleanup_interval;
            }
        }
        self.step_snowballs(dt, s);
    }
}
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn old_preferences_migrate() {
        let s: Settings = serde_json::from_str(r#"{"intensity":2,"snowman":false}"#).unwrap();
        assert_eq!(s.intensity, 2);
        assert!(!s.snowman);
        assert_eq!(s.snowman_count, 1);
        assert_eq!(s.cleanup_interval, 120.);
        assert!(!s.interactive);
    }
    #[test]
    fn drift_edges_shed() {
        let mut w = Winter::new(800., 600.);
        let mut l = Ledge::new("test".into(), 50., 200., 400.);
        l.bank.fill(20.);
        w.ledges = vec![l];
        let mut s = Settings::default();
        s.plow = false;
        w.step(0.05, &s);
        assert!(w.ledges[0].bank[0] < w.ledges[0].bank[25]);
        assert!(w.flakes.iter().any(|f| f.y > 200.));
        assert_eq!(crate::scene::height(&w.ledges[0], 0.), 0.);
        assert_eq!(crate::scene::height(&w.ledges[0], 1.), 0.);
    }
    #[test]
    fn santa_interval_manual_and_sweep() {
        let mut w = Winter::new(500., 400.);
        let mut s = Settings::default();
        s.cleanup_interval = 15.;
        w.surfaces(vec![Ledge::new("a".into(), 100., 160., 200.)]);
        for l in &mut w.ledges {
            l.bank.fill(8.);
        }
        for _ in 0..305 {
            w.step(0.05, &s);
        }
        assert!(w.plow_x.is_some());
        for _ in 0..190 {
            w.step(0.05, &s);
        }
        assert!(w.plow_x.is_none());
        assert!(w.ledges[0].bank.iter().sum::<f64>() / (w.ledges[0].bank.len() as f64) < 2.);
        s.plow = false;
        s.cleanup_request = 1;
        w.step(0.05, &s);
        assert!(w.plow_x.is_some());
    }
    #[test]
    fn snowball_collects_and_throws() {
        let mut w = Winter::new(800., 600.);
        w.pointer("down", 200., 200., 0.016);
        assert!(w.snowballs.is_empty());
        w.surfaces(vec![Ledge::new("a".into(), 0., 200., 400.)]);
        w.ledges[0].bank.fill(10.);
        let before: f64 = w.ledges[0].bank.iter().sum();
        w.pointer("down", 200., 190., 0.016);
        assert_eq!(w.snowballs.len(), 1);
        assert!(w.ledges[0].bank.iter().sum::<f64>() < before);
        w.pointer("move", 210., 170., 0.02);
        w.pointer("up", 210., 170., 0.02);
        let mut s = Settings::default();
        s.interactive = true;
        w.step(0.02, &s);
        assert!(w.snowballs[0].x > 210.);
        assert!(w.snowballs[0].y < 170.);
        assert!(!w.snowballs[0].held);
    }
    #[test]
    fn impacts_bounce_or_shatter() {
        let mut w = Winter::new(800., 600.);
        w.surfaces(vec![Ledge::new("a".into(), 0., 200., 400.)]);
        w.snowballs.push(Snowball {
            x: 100.,
            y: 170.,
            vx: 0.,
            vy: 900.,
            r: 8.,
            held: false,
        });
        w.step(0.05, &Settings::default());
        assert!(w.snowballs.is_empty());
        assert!(w.flakes.len() > 4);
        w.snowballs.push(Snowball {
            x: 100.,
            y: 190.,
            vx: 30.,
            vy: 100.,
            r: 8.,
            held: false,
        });
        w.step(0.04, &Settings::default());
        assert_eq!(w.snowballs.len(), 1);
        assert!(w.snowballs[0].vy < 0.);
    }
    #[test]
    fn scene_bounded() {
        let mut w = Winter::new(800., 600.);
        let mut s = Settings::default();
        s.trees = 3;
        s.gifts = 4;
        s.snowman_count = 3;
        s.lights = true;
        s.dangling = true;
        w.surfaces(vec![Ledge::new("dock".into(), 100., 500., 400.)]);
        w.ledges[0].bank.fill(10.);
        w.start_cleanup();
        let shapes = crate::scene::scene(&w, &s);
        assert!(shapes.len() > 100);
        assert!(shapes.len() < 1500);
        assert!(shapes
            .iter()
            .all(|s| s.points.iter().flatten().all(|v| v.is_finite())));
    }
    #[test]
    fn pause() {
        let mut w = Winter::new(800., 600.);
        let mut s = Settings::default();
        s.enabled = false;
        w.step(1., &s);
        assert_eq!(w.time, 0.);
    }
    #[test]
    fn storm_bounds() {
        let mut w = Winter::new(400., 300.);
        let mut s = Settings::default();
        s.intensity = 2;
        for _ in 0..6000 {
            w.step(1. / 30., &s)
        }
        assert!(w.flakes.len() <= 900);
        assert!(w
            .ledges
            .iter()
            .flat_map(|l| &l.bank)
            .all(|h| h.is_finite() && *h <= 20.));
    }
    #[test]
    fn moved_window_clears_bank() {
        let mut w = Winter::new(800., 600.);
        w.surfaces(vec![Ledge::new("a".into(), 10., 50., 100.)]);
        w.ledges[0].bank[0] = 10.;
        w.surfaces(vec![Ledge::new("a".into(), 20., 50., 100.)]);
        assert_eq!(w.ledges[0].bank[0], 0.);
        assert!(!w.flakes.is_empty());
    }
    #[test]
    fn settings_bounds() {
        let mut s = Settings::default();
        s.intensity = 255;
        s.wind = f64::NAN;
        s.fps = 1;
        s.validate();
        assert_eq!(s.intensity, 2);
        assert!(s.wind.is_finite());
        assert_eq!(s.fps, 30);
    }
}
