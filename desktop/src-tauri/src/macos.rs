// Geometry only: no pixels, titles, Accessibility APIs, or input monitoring.
use crate::engine::Ledge;
use core_foundation::{
    base::TCFType, dictionary::CFDictionary, number::CFNumber, string::CFString,
};
use core_graphics::window::{
    create_description_from_array, create_window_list, kCGNullWindowID,
    kCGWindowListExcludeDesktopElements, kCGWindowListOptionOnScreenOnly,
};

fn number(dict: &CFDictionary<CFString, core_foundation::base::CFType>, key: &str) -> Option<f64> {
    dict.find(&CFString::new(key))?
        .downcast::<CFNumber>()?
        .to_f64()
}
pub fn surfaces(ox: f64, oy: f64, width: f64, height: f64) -> Option<Vec<Ledge>> {
    let ids = create_window_list(
        kCGWindowListOptionOnScreenOnly | kCGWindowListExcludeDesktopElements,
        kCGNullWindowID,
    )?;
    let descriptions = create_description_from_array(ids)?;
    let mut ledges = vec![];
    for dict in descriptions.iter() {
        let dock = dict
            .find(&CFString::new("kCGWindowOwnerName"))
            .and_then(|v| v.downcast::<CFString>())
            .map(|v| v.to_string() == "Dock")
            .unwrap_or(false);
        if (!dock && number(&dict, "kCGWindowLayer") != Some(0.))
            || number(&dict, "kCGWindowOwnerPID") == Some(std::process::id() as f64)
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
        if dock && (w < 40. || h < 15. || h > height * 0.4 || y < oy + height * 0.45) {
            continue;
        }
        let left = (x - ox).max(0.);
        let right = (x - ox + w).min(width);
        if right > left && y >= oy && y < oy + height {
            let Some(id) = number(&dict, "kCGWindowNumber") else {
                continue;
            };
            ledges.push(Ledge::new(
                if dock {
                    format!("dock-{id}")
                } else {
                    format!("{id}")
                },
                left,
                y - oy,
                right - left,
            ));
        }
    }
    Some(ledges)
}
