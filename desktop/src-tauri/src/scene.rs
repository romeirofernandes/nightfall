//! Small shared vector scene: identical artwork in Cairo and the macOS canvas.
use crate::engine::{noise, Ledge, LightPattern, Settings, Winter};
use serde::Serialize;
#[derive(Serialize)]
pub struct Shape {
    pub points: Vec<[f64; 2]>,
    pub color: [f64; 4],
    pub stroke: bool,
    pub width: f64,
}
pub type Scene = Vec<Shape>;
const SNOW: [f64; 4] = [0.94, 0.97, 1., 0.97];
const DARK: [f64; 4] = [0.08, 0.20, 0.19, 1.];
const RED: [f64; 4] = [0.78, 0.16, 0.22, 1.];
const GOLD: [f64; 4] = [0.95, 0.68, 0.27, 1.];
fn poly(v: &mut Scene, p: Vec<[f64; 2]>, color: [f64; 4]) {
    v.push(Shape {
        points: p,
        color,
        stroke: false,
        width: 1.,
    });
}
fn line(v: &mut Scene, p: Vec<[f64; 2]>, color: [f64; 4], width: f64) {
    v.push(Shape {
        points: p,
        color,
        stroke: true,
        width,
    });
}
fn ellipse(v: &mut Scene, x: f64, y: f64, rx: f64, ry: f64, color: [f64; 4]) {
    poly(
        v,
        (0..24)
            .map(|i| {
                let a = i as f64 * std::f64::consts::TAU / 24.;
                [x + rx * a.cos(), y + ry * a.sin()]
            })
            .collect(),
        color,
    );
}
fn rect(v: &mut Scene, x: f64, y: f64, w: f64, h: f64, c: [f64; 4]) {
    poly(v, vec![[x, y], [x + w, y], [x + w, y + h], [x, y + h]], c);
}
fn star(v: &mut Scene, x: f64, y: f64, r: f64, c: [f64; 4]) {
    poly(
        v,
        (0..10)
            .map(|i| {
                let a = i as f64 * std::f64::consts::PI / 5. - std::f64::consts::FRAC_PI_2;
                let r = if i % 2 == 0 { r } else { r * 0.42 };
                [x + a.cos() * r, y + a.sin() * r]
            })
            .collect(),
        c,
    );
}
pub fn height(l: &Ledge, u: f64) -> f64 {
    let p = u.clamp(0., 1.) * (l.bank.len().saturating_sub(1)) as f64;
    let i = p.floor() as usize;
    let f = p - i as f64;
    let f = f * f * (3. - 2. * f);
    let h = l.bank[i] * (1. - f) + l.bank[(i + 1).min(l.bank.len() - 1)] * f;
    let edge = (u * l.width / 18.)
        .min((1. - u) * l.width / 18.)
        .clamp(0., 1.);
    h * edge
}
fn bulb_brightness(pattern: LightPattern, time: f64, i: usize, seed: f64) -> f64 {
    let i = i as f64;
    match pattern {
        LightPattern::Steady => 1.,
        LightPattern::Twinkle => {
            0.34 + 0.66
                * (0.5 + 0.5 * (time * (1.2 + noise(seed + i) * 2.) + i * 2.4).sin()).powi(3)
        }
        LightPattern::Wave => 0.27 + 0.73 * (0.5 + 0.5 * (time * 2.7 - i * 0.66).sin()).powi(2),
        LightPattern::Alternate => {
            0.33 + 0.67 * (0.5 + 0.5 * (time * 2.6 + i * std::f64::consts::PI).cos())
        }
    }
}

fn placement(s: &Settings, kind: &str, i: u8, count: u8) -> [f64; 2] {
    if let Some(position) = s.placements.get(&format!("{kind}-{i}")) {
        return *position;
    }
    let f = (i as f64 + 0.5) / count.max(1) as f64;
    let offset = (i as f64 * 2.39).sin() * 0.22 / count.max(1) as f64;
    match kind {
        "snowman" if count == 1 => [0.94, 1.],
        "snowman" => [1. - f * 0.83 - offset, 1.],
        "tree" => [f * 0.72 + offset, 1.],
        "gift" => [0.15 + f * 0.79 + offset, 1.],
        _ => [
            f + offset,
            0.18 + ((i as f64 + 1.) * 1.23).sin().abs() * 0.71,
        ],
    }
}

pub fn scene(m: &Winter, s: &Settings) -> Scene {
    let mut v = vec![];
    if !s.enabled {
        return v;
    }
    for l in &m.ledges {
        if s.accumulation && l.bank.iter().any(|h| *h > 0.05) {
            let n = (l.width / 8.).ceil().clamp(2., 1500.) as usize;
            let mut p = vec![[l.x, l.y]];
            for i in 0..=n {
                let u = i as f64 / n as f64;
                p.push([l.x + u * l.width, l.y - height(l, u)]);
            }
            p.push([l.x + l.width, l.y]);
            poly(&mut v, p, SNOW);
        }
        if l.id == "ground" {
            continue;
        }
        let seed =
            l.id.bytes()
                .fold(0u32, |h, b| h.wrapping_mul(31).wrapping_add(b as u32)) as f64;
        if s.icicles && s.accumulation {
            let mut x = 12. + noise(seed + 1.) * 28.;
            let mut i = 0.;
            while x < l.width - 12. {
                let u = x / l.width;
                let h = height(l, u);
                let n = noise(seed + i * 7. + 3.);
                if h > 1. && n > 0.28 {
                    let len = (l.age / (8. + n * 12.)).min(7. + n * n * 32.) * (h / 9.).min(1.);
                    let base = 1. + n * 3.;
                    let lean = (noise(seed + i + 8.) - 0.5) * 4.;
                    poly(
                        &mut v,
                        vec![
                            [l.x + x - base, l.y - 0.8],
                            [l.x + x + base, l.y - 0.4],
                            [l.x + x + lean + 0.4, l.y + len],
                            [l.x + x + lean - 0.4, l.y + len * 0.8],
                        ],
                        [0.72, 0.87, 0.94, 0.62],
                    );
                    line(
                        &mut v,
                        vec![[l.x + x, l.y], [l.x + x + lean, l.y + len * 0.7]],
                        [0.95, 0.99, 1., 0.5],
                        0.7,
                    );
                }
                x += 17. + noise(seed + i * 11. + 5.) * 54.;
                i += 1.;
            }
        }
        if l.width < 32. {
            continue;
        }
        let inset = 10.;
        let span = l.width - 2. * inset;
        let left = l.x + inset;
        if s.lights {
            let n = (span / 44.).round().clamp(1., 80.) as usize;
            let cable_y =
                |u: f64| l.y + 1. + (u * std::f64::consts::PI * n as f64).sin().abs() * 8.;
            let rope = (0..=n * 8)
                .map(|i| {
                    let u = i as f64 / (n * 8) as f64;
                    [left + u * span, cable_y(u)]
                })
                .collect();
            line(&mut v, rope, [0.06, 0.16, 0.12, 0.9], 2.);
            let colors = [RED, GOLD, [0.27, 0.73, 0.46, 1.], [0.96, 0.88, 0.61, 1.]];
            for i in 0..n {
                let u = (i as f64 + 0.5) / n as f64;
                let x = left + u * span;
                let y = cable_y(u);
                let c = colors[i % colors.len()];
                let brightness = bulb_brightness(s.light_pattern, m.time, i, seed);
                rect(&mut v, x - 1.6, y, 3.2, 4., DARK);
                ellipse(
                    &mut v,
                    x,
                    y + 6.,
                    5.6,
                    7.,
                    [c[0], c[1], c[2], 0.19 * brightness],
                );
                ellipse(&mut v, x, y + 6., 2.6, 4., [c[0], c[1], c[2], brightness]);
            }
        }
        if s.dangling {
            let n = (span / 145.).round().clamp(1., 30.) as u8;
            for i in 0..n {
                let [u, drop] = placement(s, "ornament", i, n);
                let x = left + u * span;
                let y = l.y + 14. + drop * 52.;
                line(&mut v, vec![[x, l.y + 1.], [x, y]], GOLD, 0.9);
                if i % 2 == 0 {
                    star(&mut v, x, y + 6., 6., GOLD);
                } else {
                    ellipse(&mut v, x, y + 5., 5., 6., RED);
                }
            }
        }
    }
    for (kind, count, scale) in [
        (
            "snowman",
            if s.snowman { s.snowman_count } else { 0 },
            s.snowman_size,
        ),
        ("tree", s.trees, s.decoration_size),
        ("gift", s.gifts, s.decoration_size),
    ] {
        for i in 0..count {
            let [u, w] = placement(s, kind, i, count);
            let margin = (34. * scale).min(m.width * 0.5);
            let top = (if kind == "gift" { 40. } else { 114. } * scale).min(m.height - 5.);
            let x = margin + u * (m.width - 2. * margin);
            let y = top + w * (m.height - 5. - top);
            match kind {
                "snowman" => snowman(&mut v, x, y, scale, i),
                "tree" => tree(&mut v, x, y, scale),
                _ => gift(&mut v, x, y, scale, i),
            }
        }
    }
    if let Some(x) = m.plow_x {
        santa(&mut v, x, 90. + (m.time * 0.9).sin() * 12., m.time);
    }
    for b in &m.snowballs {
        ellipse(
            &mut v,
            b.x + 1.,
            b.y + 2.,
            b.r,
            b.r,
            [0.65, 0.79, 0.86, 0.8],
        );
        ellipse(&mut v, b.x, b.y, b.r * 0.94, b.r * 0.94, SNOW);
        ellipse(
            &mut v,
            b.x - b.r * 0.25,
            b.y - b.r * 0.3,
            b.r * 0.3,
            b.r * 0.23,
            [1., 1., 1., 0.8],
        );
    }
    v
}
fn snowman(v: &mut Scene, x: f64, y: f64, z: f64, i: u8) {
    for (cy, r) in [(18., 18.), (43., 14.), (64., 10.)] {
        ellipse(v, x, y - cy * z, r * z, r * z, SNOW);
    }
    let scarf = if i % 2 == 0 {
        RED
    } else {
        [0.18, 0.49, 0.42, 1.]
    };
    rect(v, x - 14. * z, y - 55. * z, 28. * z, 5. * z, scarf);
    rect(v, x + 7. * z, y - 52. * z, 5. * z, 15. * z, scarf);
    rect(v, x - 14. * z, y - 75. * z, 28. * z, 4. * z, DARK);
    rect(v, x - 9. * z, y - 87. * z, 18. * z, 14. * z, DARK);
    for dx in [-4., 4.] {
        ellipse(v, x + dx * z, y - 66. * z, 1.4 * z, 1.4 * z, DARK);
    }
    for dy in [38., 45., 52.] {
        ellipse(v, x, y - dy * z, 1.5 * z, 1.5 * z, DARK);
    }
    poly(
        v,
        vec![
            [x, y - 63. * z],
            [x + 12. * z, y - 61. * z],
            [x, y - 59. * z],
        ],
        [0.94, 0.46, 0.16, 1.],
    );
    line(
        v,
        vec![
            [x - 12. * z, y - 42. * z],
            [x - 29. * z, y - 52. * z],
            [x - 33. * z, y - 58. * z],
        ],
        DARK,
        2. * z,
    );
    line(
        v,
        vec![[x + 12. * z, y - 42. * z], [x + 29. * z, y - 51. * z]],
        DARK,
        2. * z,
    );
}
fn tree(v: &mut Scene, x: f64, y: f64, z: f64) {
    rect(
        v,
        x - 4. * z,
        y - 20. * z,
        8. * z,
        20. * z,
        [0.36, 0.22, 0.14, 1.],
    );
    for i in 0..3 {
        let h = 32. + i as f64 * 19.;
        let w = 30. - i as f64 * 7.;
        poly(
            v,
            vec![
                [x - w * z, y - (9. + i as f64 * 18.) * z],
                [x, y - (h + 32.) * z],
                [x + w * z, y - (9. + i as f64 * 18.) * z],
            ],
            [0.09, 0.33 + i as f64 * 0.04, 0.24, 1.],
        );
    }
    star(v, x, y - 105. * z, 7. * z, GOLD);
    for i in 0..7 {
        let yy = 25. + i as f64 * 9.;
        let xx = (if i % 2 == 0 { -1. } else { 1. }) * (19. - i as f64 * 2.);
        ellipse(
            v,
            x + xx * z,
            y - yy * z,
            2.5 * z,
            2.5 * z,
            if i % 2 == 0 { RED } else { GOLD },
        );
    }
}
fn gift(v: &mut Scene, x: f64, y: f64, z: f64, i: u8) {
    let c = if i % 2 == 0 {
        RED
    } else {
        [0.14, 0.46, 0.37, 1.]
    };
    rect(v, x - 14. * z, y - 25. * z, 28. * z, 25. * z, c);
    rect(v, x - 16. * z, y - 28. * z, 32. * z, 6. * z, c);
    rect(v, x - 2. * z, y - 28. * z, 4. * z, 28. * z, GOLD);
    rect(v, x - 14. * z, y - 16. * z, 28. * z, 3. * z, GOLD);
    line(
        v,
        vec![
            [x, y - 28. * z],
            [x - 9. * z, y - 38. * z],
            [x - 12. * z, y - 32. * z],
            [x, y - 28. * z],
            [x + 9. * z, y - 38. * z],
            [x + 12. * z, y - 32. * z],
            [x, y - 28. * z],
        ],
        GOLD,
        2. * z,
    );
}
fn santa(v: &mut Scene, x: f64, y: f64, t: f64) {
    // Curved gold runners, red sleigh, presents, Santa's coat, beard and hat.
    line(
        v,
        vec![
            [x - 39., y + 28.],
            [x - 25., y + 34.],
            [x + 28., y + 34.],
            [x + 43., y + 23.],
        ],
        GOLD,
        3.,
    );
    poly(
        v,
        vec![
            [x - 35., y + 2.],
            [x - 24., y + 23.],
            [x + 26., y + 23.],
            [x + 38., y - 6.],
            [x + 24., y + 7.],
        ],
        RED,
    );
    gift(v, x - 22., y + 4., 0.65, 1);
    ellipse(v, x + 8., y - 6., 13., 17., RED);
    ellipse(v, x + 13., y - 24., 9., 9., [0.97, 0.77, 0.62, 1.]);
    poly(
        v,
        vec![[x + 6., y - 23.], [x + 23., y - 20.], [x + 13., y - 7.]],
        SNOW,
    );
    poly(
        v,
        vec![
            [x + 4., y - 29.],
            [x + 21., y - 30.],
            [x + 8., y - 46.],
            [x - 1., y - 39.],
        ],
        RED,
    );
    ellipse(v, x - 1., y - 39., 3., 3., SNOW);
    line(v, vec![[x + 4., y - 29.], [x + 22., y - 29.]], SNOW, 3.);
    line(
        v,
        vec![[x + 22., y - 5.], [x + 180., y - 17.]],
        [0.67, 0.47, 0.25, 0.9],
        1.,
    );
    for i in 0..3 {
        let dx = x + 70. + i as f64 * 49.;
        let dy = y - 10. - i as f64 * 3. + (t * 5. + i as f64).sin() * 3.;
        let brown = [0.56, 0.34, 0.19, 1.];
        ellipse(v, dx, dy, 17., 8., brown);
        line(v, vec![[dx + 11., dy], [dx + 20., dy - 19.]], brown, 7.);
        ellipse(v, dx + 23., dy - 20., 8., 5., brown);
        ellipse(
            v,
            dx + 30.,
            dy - 20.,
            2.,
            2.,
            if i == 2 { RED } else { DARK },
        );
        for side in [-1., 1.] {
            let swing = (t * 7. + i as f64 + side).sin() * 7.;
            line(
                v,
                vec![
                    [dx + side * 10., dy + 3.],
                    [dx + side * 13. + swing, dy + 14.],
                    [dx + side * 19. + swing, dy + 17.],
                ],
                brown,
                2.5,
            );
        }
        for a in [0., 6.] {
            line(
                v,
                vec![
                    [dx + 20. + a, dy - 24.],
                    [dx + 17. + a, dy - 37.],
                    [dx + 11. + a, dy - 40.],
                ],
                GOLD,
                1.5,
            );
            line(
                v,
                vec![[dx + 18. + a, dy - 32.], [dx + 23. + a, dy - 38.]],
                GOLD,
                1.4,
            );
        }
    }
    for i in 0..14 {
        let a = noise(i as f64 + 4.);
        star(
            v,
            x - 45. - i as f64 * 7.,
            y + 8. + (t * 3. + i as f64).sin() * 15.,
            1. + a * 3.,
            [0.98, 0.83, 0.46, 0.6],
        );
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn decoration_positions_and_light_patterns() {
        let mut s = Settings::default();
        s.placements.insert("tree-0".into(), [1.2, -0.1]);
        s.placements.insert("gift-22".into(), [0.4, 0.8]);
        s.validate();
        assert_eq!(placement(&s, "tree", 0, 1), [1., 0.]);
        assert!(!s.placements.contains_key("gift-22"));
        assert_eq!(bulb_brightness(LightPattern::Steady, 1., 2, 0.), 1.);
        for pattern in [
            LightPattern::Twinkle,
            LightPattern::Wave,
            LightPattern::Alternate,
        ] {
            let initial = bulb_brightness(pattern, 0., 2, 42.);
            let later = bulb_brightness(pattern, 0.5, 2, 42.);
            assert!((0.25..=1.).contains(&initial));
            assert!((0.25..=1.).contains(&later));
            assert!((initial - later).abs() > 0.01);
        }
    }

    #[test]
    fn lights_and_ornaments_attach_at_the_window_edge() {
        let mut s = Settings::default();
        s.lights = true;
        s.dangling = true;
        s.snowman = false;
        let mut world = Winter::new(800., 600.);
        let mut ledge = Ledge::new("window".into(), 100., 200., 400.);
        ledge.bank.fill(6.);
        world.surfaces(vec![ledge]);
        let shapes = scene(&world, &s);
        assert!(shapes
            .iter()
            .any(|shape| shape.stroke && shape.points[0] == [110., 201.]));
        assert!(shapes
            .iter()
            .any(|shape| shape.stroke && shape.color == GOLD && shape.points[0][1] == 201.));
        assert_eq!(
            crate::engine::local_ledge([-20., 200., 400.], 800., 600.),
            Some((0., 200., 380.))
        );
    }
}
