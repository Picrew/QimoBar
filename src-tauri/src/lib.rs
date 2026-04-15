mod commands;
mod config;
mod tray;
mod window;

use config::AppState;
use std::sync::Mutex;
use tauri::Manager;
use tauri_plugin_autostart::MacosLauncher;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app_config = config::load_config();
    let app_assets = config::load_assets();
    let has_current_asset = app_config
        .current_asset_id
        .as_ref()
        .map(|id| app_assets.assets.iter().any(|asset| &asset.id == id))
        .unwrap_or(false);
    let should_open_import_on_start = !has_current_asset || !app_config.pet_visible;

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            Some(vec![]),
        ))
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            // If another instance tries to launch, show the pet window
            if let Some(window) = app.get_webview_window("pet") {
                window.show().ok();
                window.set_focus().ok();
            }
        }))
        .manage(AppState {
            config: Mutex::new(app_config),
            assets: Mutex::new(app_assets),
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_config,
            commands::update_config,
            commands::save_position,
            commands::get_assets,
            commands::import_gif,
            commands::delete_asset,
            commands::set_current_asset,
            commands::get_current_gif_path,
            commands::get_gif_data,
            commands::reset_position,
        ])
        .setup(move |app| {
            let handle = app.handle().clone();

            #[cfg(target_os = "macos")]
            tray::create_app_menu(&handle).expect("Failed to create app menu");

            // Create tray
            tray::create_tray(&handle).expect("Failed to create tray");

            // Create pet window
            window::create_pet_window(&handle).expect("Failed to create pet window");

            // If no valid current asset exists, open settings so users immediately see import entry.
            if should_open_import_on_start {
                if let Some(window) = handle.get_webview_window("pet") {
                    window.show().ok();
                }
                tray::open_settings_window(&handle);
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
