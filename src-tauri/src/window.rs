use crate::config;
use tauri::{AppHandle, WebviewUrl, WebviewWindowBuilder};

pub fn create_pet_window(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let cfg = config::load_config();

    let mut builder = WebviewWindowBuilder::new(app, "pet", WebviewUrl::App("/pet".into()))
        .title("QimoBar Pet")
        .inner_size(200.0, 200.0)
        .decorations(false)
        .transparent(true)
        .always_on_top(cfg.always_on_top)
        .skip_taskbar(true)
        .resizable(false);

    // Restore position if saved, with monitor boundary check
    let mut use_saved_pos = false;
    if let Some(ref pos) = cfg.pet_position {
        if is_position_visible(app, pos.x, pos.y) {
            builder = builder.position(pos.x, pos.y);
            use_saved_pos = true;
        } else if let Some((legacy_x, legacy_y)) = try_convert_legacy_physical_position(app, pos.x, pos.y) {
            // Compatibility path for older versions that persisted physical pixels.
            builder = builder.position(legacy_x, legacy_y);
            use_saved_pos = true;
        }
    }

    if !use_saved_pos {
        builder = builder.center();
    }

    let window = builder.build()?;

    if cfg.pet_visible {
        window.show()?;
    } else {
        window.hide()?;
    }

    if cfg.click_through {
        window.set_ignore_cursor_events(true).ok();
    }

    Ok(())
}

/// Check if a position is visible on any connected monitor
fn is_position_visible(app: &AppHandle, x: f64, y: f64) -> bool {
    let monitors = match app.available_monitors() {
        Ok(m) => m,
        Err(_) => return true, // If we can't check, assume it's fine
    };

    if monitors.is_empty() {
        return true;
    }

    for monitor in &monitors {
        let pos = monitor.position();
        let size = monitor.size();
        // Convert to logical coordinates to match WebviewWindowBuilder::position.
        let scale = monitor.scale_factor();
        let mx = pos.x as f64 / scale;
        let my = pos.y as f64 / scale;
        let mw = size.width as f64 / scale;
        let mh = size.height as f64 / scale;

        // Check if the point is within this monitor's bounds (with 50px margin)
        if x >= mx - 50.0 && x < mx + mw + 50.0 && y >= my - 50.0 && y < my + mh + 50.0 {
            return true;
        }
    }

    false
}

fn try_convert_legacy_physical_position(app: &AppHandle, x: f64, y: f64) -> Option<(f64, f64)> {
    let scale = app
        .primary_monitor()
        .ok()
        .flatten()
        .map(|m| m.scale_factor())
        .unwrap_or(1.0);

    if scale <= 1.0 {
        return None;
    }

    let logical_x = x / scale;
    let logical_y = y / scale;
    if is_position_visible(app, logical_x, logical_y) {
        Some((logical_x, logical_y))
    } else {
        None
    }
}
