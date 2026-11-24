use crate::engine::Ledge;

/// Window bounds in physical desktop pixels, ordered from front to back.
pub fn visible_ledges(
    windows: &[(usize, [f64; 4])],
    origin: [f64; 2],
    scale: f64,
    width: f64,
    height: f64,
) -> Vec<Ledge> {
    let mut ledges = Vec::new();
    for (index, &(id, [left, top, right, _])) in windows.iter().enumerate() {
        let y = (top - origin[1]) / scale;
        let start = ((left - origin[0]) / scale).max(0.);
        let end = ((right - origin[0]) / scale).min(width);
        if y <= 0. || y >= height || start >= end {
            continue;
        }

        let mut spans = vec![(start, end)];
        for &(_, [left, upper, right, lower]) in &windows[..index] {
            if upper > top || lower <= top {
                continue;
            }
            let cover_left = (left - origin[0]) / scale;
            let cover_right = (right - origin[0]) / scale;
            spans = spans
                .into_iter()
                .flat_map(|(start, end)| {
                    if cover_left >= end || cover_right <= start {
                        return [Some((start, end)), None].into_iter().flatten();
                    }
                    [
                        (cover_left > start).then_some((start, cover_left)),
                        (cover_right < end).then_some((cover_right, end)),
                    ]
                    .into_iter()
                    .flatten()
                })
                .collect();
            if spans.is_empty() {
                break;
            }
        }
        for (part, (start, end)) in spans.into_iter().enumerate() {
            ledges.push(Ledge::new(
                format!("window-{id}-{part}"),
                start,
                y,
                end - start,
            ));
        }
    }
    ledges
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn clips_window_edges_to_the_work_area_on_a_scaled_monitor() {
        let ledges = visible_ledges(
            &[
                (1, [-1700., 90., -1450., 500.]),
                (2, [-1600., -10., -900., 60.]),
            ],
            [-1600., 0.],
            1.5,
            900.,
            600.,
        );
        assert_eq!(ledges.len(), 1);
        assert_eq!((ledges[0].x, ledges[0].y, ledges[0].width), (0., 60., 100.));
    }

    #[test]
    fn only_keeps_the_exposed_parts_of_a_covered_window_edge() {
        let ledges = visible_ledges(
            &[
                (1, [30., 20., 70., 80.]),
                (2, [10., 50., 90., 100.]),
                (3, [40., 60., 60., 110.]),
            ],
            [0., 0.],
            1.,
            100.,
            100.,
        );
        let geometry: Vec<_> = ledges
            .iter()
            .map(|ledge| (ledge.x, ledge.y, ledge.width))
            .collect();
        assert_eq!(
            geometry,
            [(30., 20., 40.), (10., 50., 20.), (70., 50., 20.)]
        );
    }
}
