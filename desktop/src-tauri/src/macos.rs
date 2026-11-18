// Read WindowServer geometry without capturing screen contents.
use crate::engine::Ledge;
use core_foundation::{
    base::TCFType, dictionary::CFDictionary, number::CFNumber, string::CFString,
};
use core_graphics::window::{
    create_description_from_array, create_window_list, kCGNullWindowID,
    kCGWindowListOptionOnScreenOnly,
};

fn number(dict: &CFDictionary<CFString, core_foundation::base::CFType>, key: &str) -> Option<f64> {
    dict.find(&CFString::new(key))?
        .downcast::<CFNumber>()?
        .to_f64()
}
pub fn surfaces(
    ox: f64,
    oy: f64,
    width: f64,
    height: f64,
    shadow_inset: f64,
) -> Option<Vec<Ledge>> {
    let ids = create_window_list(kCGWindowListOptionOnScreenOnly, kCGNullWindowID)?;
    let descriptions = create_description_from_array(ids)?;
    let mut ledges = vec![];
    let mut dock_ledge: Option<Ledge> = None;
    for dict in descriptions.iter() {
        let owner = dict
            .find(&CFString::new("kCGWindowOwnerName"))
            .and_then(|value| value.downcast::<CFString>())
            .map(|value| value.to_string())
            .unwrap_or_default();
        let Some(layer) = number(&dict, "kCGWindowLayer") else {
            continue;
        };
        let dock = owner == "Dock";
        let widget = matches!(
            owner.as_str(),
            "WindowManager" | "NotificationCenter" | "WidgetRenderer"
        ) || owner.ends_with("WidgetExtension");
        if (!dock && !widget && layer != 0.)
            || number(&dict, "kCGWindowOwnerPID") == Some(std::process::id() as f64)
            || number(&dict, "kCGWindowAlpha") == Some(0.)
        {
            continue;
        }
        let bounds_key = CFString::new("kCGWindowBounds");
        let Some(value) = dict.find(&bounds_key) else {
            continue;
        };
        let Some(untyped) = value.downcast::<CFDictionary>() else {
            continue;
        };
        // Quartz documents the bounds dictionary as string keys and number values.
        // Retain via the get rule; this typed wrapper owns its own reference.
        let bounds: CFDictionary<CFString, core_foundation::base::CFType> =
            unsafe { CFDictionary::wrap_under_get_rule(untyped.as_concrete_TypeRef()) };
        let Some(x) = number(&bounds, "X") else {
            continue;
        };
        let Some(y) = number(&bounds, "Y") else {
            continue;
        };
        let Some(w) = number(&bounds, "Width") else {
            continue;
        };
        let h = number(&bounds, "Height").unwrap_or(0.);
        if dock && !dock_bar([x - ox, y - oy, w, h], width, height) {
            continue;
        }
        // Keep desktop widget-sized surfaces and skip shell backdrops and panels.
        if widget && (layer >= 0. || !(64. ..=640.).contains(&w) || !(64. ..=640.).contains(&h)) {
            continue;
        }
        // Regular Quartz bounds can include the transparent window shadow.
        // Dock and edge-to-edge windows are kept at their reported bounds.
        let fullscreen =
            x <= ox + 1. && y <= oy + 1. && x + w >= ox + width - 1. && y + h >= oy + height - 1.;
        let inset = if dock || widget || fullscreen {
            0.
        } else {
            shadow_inset.min(w * 0.15).min(h * 0.15)
        };
        if let Some((left, top, span)) = crate::engine::local_ledge(
            [x + inset - ox, y + inset - oy, w - 2. * inset],
            width,
            height,
        ) {
            let Some(id) = number(&dict, "kCGWindowNumber") else {
                continue;
            };
            let ledge = Ledge::new(
                if dock { "dock".into() } else { format!("{id}") },
                left,
                top,
                span,
            );
            if dock {
                if dock_ledge
                    .as_ref()
                    .is_none_or(|previous| previous.width < span)
                {
                    dock_ledge = Some(ledge);
                }
            } else {
                ledges.push(ledge);
            }
        }
    }
    ledges.extend(dock_ledge);
    Some(ledges)
}

fn dock_bar([x, y, width, height]: [f64; 4], screen_width: f64, screen_height: f64) -> bool {
    let near_bottom = (screen_height - y - height).abs() <= 48.;
    let near_side = x.abs() <= 32. || (screen_width - x - width).abs() <= 32.;
    let horizontal = near_bottom && width >= 48. && (12. ..=180.).contains(&height);
    let vertical = near_side && height >= 48. && (12. ..=180.).contains(&width);
    y >= 0. && (horizontal || vertical)
}

#[cfg(test)]
mod tests {
    use super::dock_bar;

    #[test]
    fn selects_dock_bars_and_skips_activation_strips() {
        assert!(dock_bar([300., 720., 800., 70.], 1440., 800.));
        assert!(dock_bar([0., 160., 75., 500.], 1440., 800.));
        assert!(dock_bar([1364., 160., 75., 500.], 1440., 800.));
        assert!(!dock_bar([0., 798., 1440., 2.], 1440., 800.));
        assert!(!dock_bar([100., 100., 1200., 600.], 1440., 800.));
    }
}
