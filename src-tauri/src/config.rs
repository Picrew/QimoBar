use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Position {
    pub x: f64,
    pub y: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AssetItem {
    pub id: String,
    pub name: String,
    pub source_type: String,
    pub file_path: String,
    pub width: Option<u32>,
    pub height: Option<u32>,
    pub file_size: Option<u64>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(default)]
pub struct AppConfig {
    pub launch_at_startup: bool,
    pub click_through: bool,
    pub always_on_top: bool,
    pub pet_scale: f64,
    pub pet_opacity: f64,
    pub language: String,
    pub current_asset_id: Option<String>,
    pub pet_position: Option<Position>,
    pub pet_visible: bool,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            launch_at_startup: false,
            click_through: false,
            always_on_top: true,
            pet_scale: 1.0,
            pet_opacity: 1.0,
            language: "en".to_string(),
            current_asset_id: None,
            pet_position: None,
            pet_visible: true,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AssetList {
    pub assets: Vec<AssetItem>,
}

impl Default for AssetList {
    fn default() -> Self {
        Self { assets: vec![] }
    }
}

pub struct AppState {
    pub config: Mutex<AppConfig>,
    pub assets: Mutex<AssetList>,
}

pub fn get_config_dir() -> PathBuf {
    let dir = dirs::config_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("QimoBar");
    fs::create_dir_all(&dir).ok();
    dir
}

pub fn get_assets_dir() -> PathBuf {
    let dir = get_config_dir().join("assets");
    fs::create_dir_all(&dir).ok();
    dir
}

fn config_path() -> PathBuf {
    get_config_dir().join("config.json")
}

fn assets_path() -> PathBuf {
    get_config_dir().join("assets.json")
}

pub fn load_config() -> AppConfig {
    let path = config_path();
    if path.exists() {
        match fs::read_to_string(&path) {
            Ok(content) => serde_json::from_str(&content).unwrap_or_default(),
            Err(_) => AppConfig::default(),
        }
    } else {
        AppConfig::default()
    }
}

pub fn save_config(config: &AppConfig) -> Result<(), String> {
    let path = config_path();
    let content = serde_json::to_string_pretty(config).map_err(|e| e.to_string())?;
    fs::write(path, content).map_err(|e| e.to_string())?;
    Ok(())
}

pub fn load_assets() -> AssetList {
    let path = assets_path();
    if path.exists() {
        match fs::read_to_string(&path) {
            Ok(content) => serde_json::from_str(&content).unwrap_or_default(),
            Err(_) => AssetList::default(),
        }
    } else {
        AssetList::default()
    }
}

pub fn save_assets(assets: &AssetList) -> Result<(), String> {
    let path = assets_path();
    let content = serde_json::to_string_pretty(assets).map_err(|e| e.to_string())?;
    fs::write(path, content).map_err(|e| e.to_string())?;
    Ok(())
}
