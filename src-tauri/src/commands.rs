use crate::config::{self, AppConfig, AssetItem, Position};
use std::fs;
use std::path::Path;
use tauri::{AppHandle, Manager, State};
use tauri_plugin_autostart::AutoLaunchManager;
use uuid::Uuid;

#[tauri::command]
pub fn get_config(state: State<'_, config::AppState>) -> Result<AppConfig, String> {
    let config = state.config.lock().map_err(|e| e.to_string())?;
    Ok(config.clone())
}

#[tauri::command]
pub fn update_config(
    app: AppHandle,
    state: State<'_, config::AppState>,
    config: AppConfig,
) -> Result<(), String> {
    let mut current = state.config.lock().map_err(|e| e.to_string())?;

    // Handle autostart toggle
    if config.launch_at_startup != current.launch_at_startup {
        let autostart = app.state::<AutoLaunchManager>();
        if config.launch_at_startup {
            autostart.enable().map_err(|e| e.to_string())?;
        } else {
            autostart.disable().map_err(|e| e.to_string())?;
        }
    }

    *current = config.clone();
    config::save_config(&config)?;
    Ok(())
}

#[tauri::command]
pub fn save_position(state: State<'_, config::AppState>, x: f64, y: f64) -> Result<(), String> {
    let mut config = state.config.lock().map_err(|e| e.to_string())?;
    config.pet_position = Some(Position { x, y });
    config::save_config(&config)?;
    Ok(())
}

#[tauri::command]
pub fn get_assets(state: State<'_, config::AppState>) -> Result<Vec<AssetItem>, String> {
    let assets = state.assets.lock().map_err(|e| e.to_string())?;
    Ok(assets.assets.clone())
}

#[tauri::command]
pub fn import_gif(
    state: State<'_, config::AppState>,
    source_path: String,
    source_type: String,
) -> Result<AssetItem, String> {
    let src = Path::new(&source_path);
    if !src.exists() {
        return Err("File does not exist".to_string());
    }

    // Validate it's a GIF by checking magic bytes
    let data = fs::read(src).map_err(|e| format!("Failed to read file: {}", e))?;
    if data.len() < 6 || (&data[0..4] != b"GIF8") {
        return Err("File is not a valid GIF".to_string());
    }

    // Limit file size to 50MB
    if data.len() > 50 * 1024 * 1024 {
        return Err("GIF file is too large (max 50MB)".to_string());
    }

    let id = Uuid::new_v4().to_string();
    let file_name = src
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_else(|| format!("{}.gif", id));

    let dest_dir = config::get_assets_dir();
    let dest_path = dest_dir.join(&format!("{}_{}", id, file_name));
    fs::copy(src, &dest_path).map_err(|e| format!("Failed to copy file: {}", e))?;

    let asset = AssetItem {
        id: id.clone(),
        name: file_name,
        source_type,
        file_path: dest_path.to_string_lossy().to_string(),
        width: None,
        height: None,
        file_size: Some(data.len() as u64),
        created_at: chrono_now(),
    };

    // Add to asset list
    let mut assets = state.assets.lock().map_err(|e| e.to_string())?;
    assets.assets.push(asset.clone());
    config::save_assets(&assets)?;

    // Set as current asset
    let mut cfg = state.config.lock().map_err(|e| e.to_string())?;
    cfg.current_asset_id = Some(id);
    config::save_config(&cfg)?;

    Ok(asset)
}

#[tauri::command]
pub fn delete_asset(state: State<'_, config::AppState>, asset_id: String) -> Result<(), String> {
    let mut assets = state.assets.lock().map_err(|e| e.to_string())?;
    if let Some(pos) = assets.assets.iter().position(|a| a.id == asset_id) {
        let asset = assets.assets.remove(pos);
        // Try to delete the file
        fs::remove_file(&asset.file_path).ok();
        config::save_assets(&assets)?;
    }

    // If current asset was deleted, clear it
    let mut cfg = state.config.lock().map_err(|e| e.to_string())?;
    if cfg.current_asset_id.as_deref() == Some(&asset_id) {
        cfg.current_asset_id = assets.assets.first().map(|a| a.id.clone());
        config::save_config(&cfg)?;
    }

    Ok(())
}

#[tauri::command]
pub fn set_current_asset(
    state: State<'_, config::AppState>,
    asset_id: String,
) -> Result<(), String> {
    let mut cfg = state.config.lock().map_err(|e| e.to_string())?;
    cfg.current_asset_id = Some(asset_id);
    config::save_config(&cfg)?;
    Ok(())
}

#[tauri::command]
pub fn get_current_gif_path(state: State<'_, config::AppState>) -> Result<Option<String>, String> {
    let cfg = state.config.lock().map_err(|e| e.to_string())?;
    let assets = state.assets.lock().map_err(|e| e.to_string())?;

    if let Some(ref id) = cfg.current_asset_id {
        if let Some(asset) = assets.assets.iter().find(|a| &a.id == id) {
            return Ok(Some(asset.file_path.clone()));
        }
    }
    Ok(None)
}

#[tauri::command]
pub fn get_gif_data(state: State<'_, config::AppState>, asset_id: Option<String>) -> Result<Option<String>, String> {
    let cfg = state.config.lock().map_err(|e| e.to_string())?;
    let assets = state.assets.lock().map_err(|e| e.to_string())?;

    let target_id = asset_id.or_else(|| cfg.current_asset_id.clone());

    if let Some(ref id) = target_id {
        if let Some(asset) = assets.assets.iter().find(|a| &a.id == id) {
            let data = fs::read(&asset.file_path)
                .map_err(|e| format!("Failed to read GIF: {}", e))?;
            let encoded = base64_encode(&data);
            let b64 = format!("data:image/gif;base64,{}", encoded);
            return Ok(Some(b64));
        }
    }
    Ok(None)
}

fn base64_encode(data: &[u8]) -> String {
    const CHARS: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let mut result = String::with_capacity((data.len() + 2) / 3 * 4);
    for chunk in data.chunks(3) {
        let b0 = chunk[0] as u32;
        let b1 = if chunk.len() > 1 { chunk[1] as u32 } else { 0 };
        let b2 = if chunk.len() > 2 { chunk[2] as u32 } else { 0 };
        let n = (b0 << 16) | (b1 << 8) | b2;
        result.push(CHARS[((n >> 18) & 63) as usize] as char);
        result.push(CHARS[((n >> 12) & 63) as usize] as char);
        if chunk.len() > 1 {
            result.push(CHARS[((n >> 6) & 63) as usize] as char);
        } else {
            result.push('=');
        }
        if chunk.len() > 2 {
            result.push(CHARS[(n & 63) as usize] as char);
        } else {
            result.push('=');
        }
    }
    result
}

#[tauri::command]
pub fn reset_position(app: AppHandle, state: State<'_, config::AppState>) -> Result<(), String> {
    let mut cfg = state.config.lock().map_err(|e| e.to_string())?;
    cfg.pet_position = None;
    config::save_config(&cfg)?;

    // Center the pet window
    if let Some(window) = app.get_webview_window("pet") {
        window.center().map_err(|e| e.to_string())?;
    }
    Ok(())
}

fn chrono_now() -> String {
    // Simple ISO timestamp without chrono dependency
    use std::time::{SystemTime, UNIX_EPOCH};
    let dur = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default();
    format!("{}", dur.as_secs())
}
