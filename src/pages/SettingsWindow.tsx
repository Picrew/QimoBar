import { useEffect, useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { emit } from "@tauri-apps/api/event";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { open } from "@tauri-apps/plugin-dialog";
import type { AppConfig, AppLanguage, AssetItem } from "../types";

const MESSAGES: Record<
  AppLanguage,
  {
    windowTitle: string;
    sectionDisplay: string;
    sectionSystem: string;
    sectionAssets: string;
    labelScale: string;
    labelOpacity: string;
    labelAlwaysOnTop: string;
    labelClickThrough: string;
    labelLanguage: string;
    labelLaunchAtStartup: string;
    buttonResetPosition: string;
    buttonImportGif: string;
    buttonUse: string;
    loading: string;
    noGifImported: string;
    dialogGifImages: string;
    statusSettingsSaved: string;
    statusFailedToSave: string;
    statusGifImported: string;
    statusImportFailed: string;
    statusPetChanged: string;
    statusFailed: string;
    statusAssetDeleted: string;
    statusPositionReset: string;
  }
> = {
  en: {
    windowTitle: "QimoBar Settings",
    sectionDisplay: "Display",
    sectionSystem: "System",
    sectionAssets: "GIF Assets",
    labelScale: "Scale",
    labelOpacity: "Opacity",
    labelAlwaysOnTop: "Always on Top",
    labelClickThrough: "Click Through",
    labelLanguage: "Language",
    labelLaunchAtStartup: "Launch at Startup",
    buttonResetPosition: "Reset Position",
    buttonImportGif: "Import GIF...",
    buttonUse: "Use",
    loading: "Loading...",
    noGifImported: "No GIF imported yet",
    dialogGifImages: "GIF Images",
    statusSettingsSaved: "Settings saved",
    statusFailedToSave: "Failed to save: ",
    statusGifImported: "GIF imported!",
    statusImportFailed: "Import failed: ",
    statusPetChanged: "Pet changed!",
    statusFailed: "Failed: ",
    statusAssetDeleted: "Asset deleted",
    statusPositionReset: "Position reset!",
  },
  "zh-CN": {
    windowTitle: "QimoBar 设置",
    sectionDisplay: "显示",
    sectionSystem: "系统",
    sectionAssets: "GIF 素材",
    labelScale: "缩放",
    labelOpacity: "透明度",
    labelAlwaysOnTop: "始终置顶",
    labelClickThrough: "点击穿透",
    labelLanguage: "语言",
    labelLaunchAtStartup: "开机启动",
    buttonResetPosition: "重置位置",
    buttonImportGif: "导入 GIF...",
    buttonUse: "使用",
    loading: "加载中...",
    noGifImported: "还没有导入 GIF",
    dialogGifImages: "GIF 图片",
    statusSettingsSaved: "设置已保存",
    statusFailedToSave: "保存失败：",
    statusGifImported: "GIF 导入成功！",
    statusImportFailed: "导入失败：",
    statusPetChanged: "桌宠已切换！",
    statusFailed: "失败：",
    statusAssetDeleted: "素材已删除",
    statusPositionReset: "位置已重置！",
  },
};

function normalizeLanguage(language?: string | null): AppLanguage {
  return language === "zh-CN" ? "zh-CN" : "en";
}

function SettingsWindow() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [status, setStatus] = useState("");

  const currentLanguage = normalizeLanguage(config?.language);
  const t = MESSAGES[currentLanguage];

  const showStatus = (msg: string) => {
    setStatus(msg);
    setTimeout(() => setStatus(""), 2000);
  };

  const loadData = useCallback(async () => {
    try {
      const [cfg, assetList] = await Promise.all([
        invoke<AppConfig>("get_config"),
        invoke<AssetItem[]>("get_assets"),
      ]);
      setConfig({
        ...cfg,
        language: normalizeLanguage(cfg.language),
      });
      setAssets(assetList);

      // Load previews for all assets
      const previewMap: Record<string, string> = {};
      for (const asset of assetList) {
        try {
          const data = await invoke<string | null>("get_gif_data", {
            assetId: asset.id,
          });
          if (data) {
            previewMap[asset.id] = data;
          }
        } catch {
          // Skip failed previews
        }
      }
      setPreviews(previewMap);
    } catch (e) {
      console.error("Failed to load settings:", e);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    getCurrentWebviewWindow().setTitle(t.windowTitle).catch(() => {});
  }, [t.windowTitle]);

  const updateConfig = async (updates: Partial<AppConfig>) => {
    if (!config) return;

    const newConfig: AppConfig = {
      ...config,
      ...updates,
      language: normalizeLanguage(updates.language ?? config.language),
    };
    const nextLanguage = normalizeLanguage(newConfig.language);

    try {
      await invoke("update_config", { config: newConfig });
      setConfig(newConfig);
      emit("config-updated", {});
      showStatus(MESSAGES[nextLanguage].statusSettingsSaved);
    } catch (e) {
      showStatus(`${MESSAGES[currentLanguage].statusFailedToSave}${String(e)}`);
    }
  };

  const handleImportGif = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{ name: t.dialogGifImages, extensions: ["gif"] }],
      });
      if (selected) {
        await invoke("import_gif", {
          sourcePath: selected,
          sourceType: "local",
        });
        await loadData();
        emit("asset-changed", {});
        showStatus(MESSAGES[currentLanguage].statusGifImported);
      }
    } catch (e) {
      showStatus(`${MESSAGES[currentLanguage].statusImportFailed}${String(e)}`);
    }
  };

  const handleSelectAsset = async (assetId: string) => {
    try {
      await invoke("set_current_asset", { assetId });
      if (config) {
        setConfig({ ...config, current_asset_id: assetId });
      }
      emit("asset-changed", {});
      showStatus(MESSAGES[currentLanguage].statusPetChanged);
    } catch (e) {
      showStatus(`${MESSAGES[currentLanguage].statusFailed}${String(e)}`);
    }
  };

  const handleDeleteAsset = async (assetId: string) => {
    try {
      await invoke("delete_asset", { assetId });
      await loadData();
      emit("asset-changed", {});
      showStatus(MESSAGES[currentLanguage].statusAssetDeleted);
    } catch (e) {
      showStatus(`${MESSAGES[currentLanguage].statusFailed}${String(e)}`);
    }
  };

  const handleResetPosition = async () => {
    try {
      await invoke("reset_position");
      if (config) {
        setConfig({ ...config, pet_position: null });
      }
      showStatus(MESSAGES[currentLanguage].statusPositionReset);
    } catch (e) {
      showStatus(`${MESSAGES[currentLanguage].statusFailed}${String(e)}`);
    }
  };

  if (!config) {
    return <div className="settings-container">{t.loading}</div>;
  }

  return (
    <div className="settings-container">
      <h2>{t.windowTitle}</h2>

      {status && <div className="status-bar">{status}</div>}

      <section className="settings-section">
        <h3>{t.sectionDisplay}</h3>

        <div className="setting-row">
          <label>{t.labelScale}</label>
          <div className="setting-control">
            <input
              type="range"
              min="0.3"
              max="3"
              step="0.1"
              value={config.pet_scale}
              onChange={(e) =>
                updateConfig({ pet_scale: parseFloat(e.target.value) })
              }
            />
            <span>{config.pet_scale.toFixed(1)}x</span>
          </div>
        </div>

        <div className="setting-row">
          <label>{t.labelOpacity}</label>
          <div className="setting-control">
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.05"
              value={config.pet_opacity}
              onChange={(e) =>
                updateConfig({ pet_opacity: parseFloat(e.target.value) })
              }
            />
            <span>{Math.round(config.pet_opacity * 100)}%</span>
          </div>
        </div>

        <div className="setting-row">
          <label>{t.labelAlwaysOnTop}</label>
          <input
            type="checkbox"
            checked={config.always_on_top}
            onChange={(e) => updateConfig({ always_on_top: e.target.checked })}
          />
        </div>

        <div className="setting-row">
          <label>{t.labelClickThrough}</label>
          <input
            type="checkbox"
            checked={config.click_through}
            onChange={(e) => updateConfig({ click_through: e.target.checked })}
          />
        </div>
      </section>

      <section className="settings-section">
        <h3>{t.sectionSystem}</h3>

        <div className="setting-row">
          <label htmlFor="language-select">{t.labelLanguage}</label>
          <select
            id="language-select"
            className="language-select"
            value={currentLanguage}
            onChange={(e) =>
              updateConfig({ language: normalizeLanguage(e.target.value) })
            }
          >
            <option value="en">English</option>
            <option value="zh-CN">简体中文</option>
          </select>
        </div>

        <div className="setting-row">
          <label>{t.labelLaunchAtStartup}</label>
          <input
            type="checkbox"
            checked={config.launch_at_startup}
            onChange={(e) =>
              updateConfig({ launch_at_startup: e.target.checked })
            }
          />
        </div>

        <div className="setting-row">
          <button className="btn-secondary" onClick={handleResetPosition}>
            {t.buttonResetPosition}
          </button>
        </div>
      </section>

      <section className="settings-section">
        <h3>{t.sectionAssets}</h3>
        <button className="btn-primary" onClick={handleImportGif}>
          {t.buttonImportGif}
        </button>

        <div className="asset-list">
          {assets.length === 0 && <p className="empty-hint">{t.noGifImported}</p>}
          {assets.map((asset) => (
            <div
              key={asset.id}
              className={`asset-item ${
                config.current_asset_id === asset.id ? "active" : ""
              }`}
            >
              {previews[asset.id] ? (
                <img
                  src={previews[asset.id]}
                  alt={asset.name}
                  className="asset-preview"
                />
              ) : (
                <div className="asset-preview" />
              )}
              <div className="asset-info">
                <span className="asset-name">{asset.name}</span>
                <span className="asset-meta">
                  {asset.file_size
                    ? `${(asset.file_size / 1024).toFixed(0)} KB`
                    : ""}
                </span>
              </div>
              <div className="asset-actions">
                {config.current_asset_id !== asset.id && (
                  <button
                    className="btn-small"
                    onClick={() => handleSelectAsset(asset.id)}
                  >
                    {t.buttonUse}
                  </button>
                )}
                <button
                  className="btn-small btn-danger"
                  onClick={() => handleDeleteAsset(asset.id)}
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default SettingsWindow;
