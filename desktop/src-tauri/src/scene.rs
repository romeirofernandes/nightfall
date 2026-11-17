//! Small shared vector scene: identical artwork in Cairo and the macOS canvas.
use crate::engine::{noise, Ledge, Settings, Winter};
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
        if s.lights {
            let n = (l.width / 38.).floor().max(1.) as usize;
            let rope: Vec<_> = (0..=n * 6)
                .map(|i| {
                    let u = i as f64 / (n * 6) as f64;
                    [
                        l.x + u * l.width,
                        l.y + 5. + (u * std::f64::consts::PI * n as f64).sin().abs() * 7.,
                    ]
                })
                .collect();
            line(&mut v, rope, DARK, 1.4);
            let colors = [RED, GOLD, [0.2, 0.78, 0.54, 1.], [0.35, 0.65, 1., 1.]];
            for i in 0..n {
                let x = l.x + (i as f64 + 0.5) * l.width / n as f64;
                let c = colors[i % 4];
                ellipse(&mut v, x, l.y + 17., 5., 7., [c[0], c[1], c[2], 0.12]);
                ellipse(&mut v, x, l.y + 17., 2.4, 3.8, c);
            }
        }
        if s.dangling {
            let n = (l.width / 150.).floor() as usize;
            for i in 0..n.min(30) {
                let x = l.x + (i as f64 + 0.5) * l.width / n as f64;
                let y = l.y + 23. + noise(seed + i as f64) * 23.;
                line(&mut v, vec![[x, l.y + 1.], [x, y]], GOLD, 0.7);
                if i % 2 == 0 {
                    star(&mut v, x, y + 6., 6., GOLD);
                } else {
                    ellipse(&mut v, x, y + 5., 5., 6., RED);
                }
            }
        }
    }
    let floor = m.height - 5.;
    if s.snowman {
        for i in 0..s.snowman_count {
            let margin = 40. * s.snowman_size;
            let x = m.width
                - margin
                - i as f64 * (m.width - 2. * margin).max(1.)
                    / (s.snowman_count.saturating_sub(1).max(1)) as f64;
            snowman(&mut v, x, floor, s.snowman_size, i);
        }
    }
    for i in 0..s.trees {
        let x = 35. * s.decoration_size
            + i as f64 * (m.width * 0.55 - 70. * s.decoration_size).max(1.)
                / s.trees.saturating_sub(1).max(1) as f64;
        tree(&mut v, x, floor, s.decoration_size);
    }
    for i in 0..s.gifts {
        let x = 65. * s.decoration_size
            + i as f64 * (m.width * 0.7 - 100. * s.decoration_size).max(1.)
                / s.gifts.saturating_sub(1).max(1) as f64;
        gift(&mut v, x, floor, s.decoration_size, i);
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
