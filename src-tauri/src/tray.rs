use crate::config;
use tauri::{
    image::Image,
    menu::{MenuBuilder, MenuItemBuilder},
    tray::TrayIconBuilder,
    AppHandle, Emitter, Manager,
};

pub fn create_tray(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let show_hide = MenuItemBuilder::with_id("show_hide", "Show/Hide Pet").build(app)?;
    let import_gif = MenuItemBuilder::with_id("import_gif", "Import GIF...").build(app)?;
    let settings = MenuItemBuilder::with_id("settings", "Settings...").build(app)?;
    let quit = MenuItemBuilder::with_id("quit", "Quit QimoBar").build(app)?;

    let menu = MenuBuilder::new(app)
        .item(&show_hide)
        .separator()
        .item(&import_gif)
        .item(&settings)
        .separator()
        .item(&quit)
        .build()?;

    let icon = Image::from_bytes(include_bytes!("../icons/32x32.png"))?;

    TrayIconBuilder::new()
        .icon(icon)
        .menu(&menu)
        .tooltip("QimoBar - Desktop Pet")
        .on_menu_event(move |app, event| match event.id().as_ref() {
            "show_hide" => {
                if let Some(window) = app.get_webview_window("pet") {
                    let visible = window.is_visible().unwrap_or(false);
                    if visible {
                        window.hide().ok();
                    } else {
                        window.show().ok();
                    }
                    // Save visibility state
                    if let Some(state) = app.try_state::<config::AppState>() {
                        if let Ok(mut cfg) = state.config.lock() {
                            cfg.pet_visible = !visible;
                            config::save_config(&cfg).ok();
                        }
                    }
                }
            }
            "import_gif" => {
                // Make sure the pet is visible before opening the import flow.
                if let Some(window) = app.get_webview_window("pet") {
                    window.show().ok();
                    window.set_focus().ok();
                }

                if let Some(state) = app.try_state::<config::AppState>() {
                    if let Ok(mut cfg) = state.config.lock() {
                        cfg.pet_visible = true;
                        config::save_config(&cfg).ok();
                    }
                }

                app.emit("tray-import-gif", ()).ok();
            }
            "settings" => {
                open_settings_window(app);
            }
            "quit" => {
                app.exit(0);
            }
            _ => {}
        })
        .build(app)?;

    Ok(())
}

pub fn open_settings_window(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("settings") {
        window.show().ok();
        window.set_focus().ok();
        return;
    }

    let _window = tauri::WebviewWindowBuilder::new(
        app,
        "settings",
        tauri::WebviewUrl::App("/settings".into()),
    )
    .title("QimoBar Settings")
    .inner_size(480.0, 520.0)
    .resizable(false)
    .center()
    .build()
    .ok();
}
