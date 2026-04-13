import { useEffect, useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { emit } from "@tauri-apps/api/event";
import { open } from "@tauri-apps/plugin-dialog";
import type { AppConfig, AssetItem } from "../types";

function SettingsWindow() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [status, setStatus] = useState("");

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
      setConfig(cfg);
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

  const updateConfig = async (updates: Partial<AppConfig>) => {
    if (!config) return;
    const newConfig = { ...config, ...updates };
    try {
      await invoke("update_config", { config: newConfig });
      setConfig(newConfig);
      emit("config-updated", {});
      showStatus("Settings saved");
    } catch (e) {
      showStatus("Failed to save: " + String(e));
    }
  };

  const handleImportGif = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{ name: "GIF Images", extensions: ["gif"] }],
      });
      if (selected) {
        await invoke("import_gif", {
          sourcePath: selected,
          sourceType: "local",
        });
        await loadData();
        emit("asset-changed", {});
        showStatus("GIF imported!");
      }
    } catch (e) {
      showStatus("Import failed: " + String(e));
    }
  };

  const handleSelectAsset = async (assetId: string) => {
    try {
      await invoke("set_current_asset", { assetId });
      if (config) {
        setConfig({ ...config, current_asset_id: assetId });
      }
      emit("asset-changed", {});
      showStatus("Pet changed!");
    } catch (e) {
      showStatus("Failed: " + String(e));
    }
  };

  const handleDeleteAsset = async (assetId: string) => {
    try {
      await invoke("delete_asset", { assetId });
      await loadData();
      emit("asset-changed", {});
      showStatus("Asset deleted");
    } catch (e) {
      showStatus("Failed: " + String(e));
    }
  };

  const handleResetPosition = async () => {
    try {
      await invoke("reset_position");
      if (config) {
        setConfig({ ...config, pet_position: null });
      }
      showStatus("Position reset!");
    } catch (e) {
      showStatus("Failed: " + String(e));
    }
  };

  if (!config) {
    return <div className="settings-container">Loading...</div>;
  }

  return (
    <div className="settings-container">
      <h2>QimoBar Settings</h2>

      {status && <div className="status-bar">{status}</div>}

      <section className="settings-section">
        <h3>Display</h3>

        <div className="setting-row">
          <label>Scale</label>
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
          <label>Opacity</label>
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
          <label>Always on Top</label>
          <input
            type="checkbox"
            checked={config.always_on_top}
            onChange={(e) =>
              updateConfig({ always_on_top: e.target.checked })
            }
          />
        </div>

        <div className="setting-row">
          <label>Click Through</label>
          <input
            type="checkbox"
            checked={config.click_through}
            onChange={(e) =>
              updateConfig({ click_through: e.target.checked })
            }
          />
        </div>
      </section>

      <section className="settings-section">
        <h3>System</h3>
        <div className="setting-row">
          <label>Launch at Startup</label>
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
            Reset Position
          </button>
        </div>
      </section>

      <section className="settings-section">
        <h3>GIF Assets</h3>
        <button className="btn-primary" onClick={handleImportGif}>
          Import GIF...
        </button>

        <div className="asset-list">
          {assets.length === 0 && (
            <p className="empty-hint">No GIF imported yet</p>
          )}
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
                    Use
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
