import { useEffect, useState, useRef, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { open } from "@tauri-apps/plugin-dialog";
import type { AppConfig } from "../types";

function PetWindow() {
  const [gifSrc, setGifSrc] = useState<string | null>(null);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const isDragging = useRef(false);
  const language = config?.language === "zh-CN" ? "zh-CN" : "en";
  const emptyHint =
    language === "zh-CN" ? "双击导入 GIF" : "Double-click to add GIF";
  const gifFilterName = language === "zh-CN" ? "GIF 图片" : "GIF Images";
  const petAlt = language === "zh-CN" ? "桌面萌宠" : "Desktop Pet";

  const loadGif = useCallback(async () => {
    try {
      const data = await invoke<string | null>("get_gif_data", { assetId: null });
      setGifSrc(data);
    } catch (e) {
      console.error("Failed to load GIF:", e);
    }
  }, []);

  const loadConfig = useCallback(async () => {
    try {
      const cfg = await invoke<AppConfig>("get_config");
      setConfig(cfg);

      // Apply click-through
      const window = getCurrentWebviewWindow();
      window.setIgnoreCursorEvents(cfg.click_through).catch(() => {});
      window.setAlwaysOnTop(cfg.always_on_top).catch(() => {});
    } catch (e) {
      console.error("Failed to load config:", e);
    }
  }, []);

  useEffect(() => {
    loadGif();
    loadConfig();

    const unlisten1 = listen("tray-import-gif", () => {
      handleImportGif();
    });

    const unlisten2 = listen("config-updated", () => {
      loadConfig();
      loadGif();
    });

    const unlisten3 = listen("asset-changed", () => {
      loadGif();
    });

    return () => {
      unlisten1.then((f) => f());
      unlisten2.then((f) => f());
      unlisten3.then((f) => f());
    };
  }, [loadGif, loadConfig]);

  const handleImportGif = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{ name: gifFilterName, extensions: ["gif"] }],
      });
      if (selected) {
        await invoke("import_gif", {
          sourcePath: selected,
          sourceType: "local",
        });
        await loadGif();
      }
    } catch (e) {
      console.error("Failed to import GIF:", e);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && !config?.click_through) {
      isDragging.current = true;
      getCurrentWebviewWindow().startDragging();
    }
  };

  const handleMouseUp = async () => {
    if (isDragging.current) {
      isDragging.current = false;
      try {
        const window = getCurrentWebviewWindow();
        const pos = await window.outerPosition();
        await invoke("save_position", {
          x: pos.x,
          y: pos.y,
        });
      } catch (e) {
        console.error("Failed to save position:", e);
      }
    }
  };

  const scale = config?.pet_scale ?? 1.0;
  const opacity = config?.pet_opacity ?? 1.0;

  return (
    <div
      className="pet-container"
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onContextMenu={(e) => e.preventDefault()}
      style={{ opacity }}
    >
      {gifSrc ? (
        <img
          src={gifSrc}
          alt={petAlt}
          className="pet-gif"
          style={{ transform: `scale(${scale})` }}
          draggable={false}
        />
      ) : (
        <div className="pet-placeholder" onDoubleClick={handleImportGif}>
          <span>🐾</span>
          <small>{emptyHint}</small>
        </div>
      )}
    </div>
  );
}

export default PetWindow;
