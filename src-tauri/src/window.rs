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
        let mx = pos.x as f64;
        let my = pos.y as f64;
        let mw = size.width as f64;
        let mh = size.height as f64;

        // Check if the point is within this monitor's bounds (with 50px margin)
        if x >= mx - 50.0 && x < mx + mw + 50.0 && y >= my - 50.0 && y < my + mh + 50.0 {
            return true;
        }
    }

    false
}
