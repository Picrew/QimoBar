<div align="center">

<img src="docs/app-icon.png" alt="QimoBar" width="120" />

# QimoBar - Desktop Pet / GIF Widget

**A lightweight, cross-platform desktop GIF companion app**

[![Platform](https://img.shields.io/badge/Platform-macOS%20%7C%20Windows-blue)](#)
[![Built with](https://img.shields.io/badge/Stack-Tauri%202%20%2B%20React%20%2B%20TypeScript%20%2B%20Rust-orange)](#)
[![License](https://img.shields.io/badge/License-MIT-green)](#license)

**English** | [简体中文](./README.zh-CN.md)

</div>

Built with **Tauri 2 + React + TypeScript + Rust**.

## Features

- **System tray / menu bar** integration (macOS menu bar, Windows system tray)
- **Transparent, borderless** pet window that floats on your desktop
- **Drag to move** the pet anywhere on screen
- **Import GIF** from local files via file dialog
- **Position memory** - pet remembers where you left it
- **Scale and opacity** controls
- **Click-through mode** - let clicks pass through the pet window
- **Always on top** toggle
- **Launch at startup** support
- **Multi-monitor** awareness - pet stays visible when monitors change
- **Single instance** enforcement
- **Settings panel** with real-time preview
- **Multiple GIF assets** - import and switch between different pets

## Prerequisites

- [Node.js](https://nodejs.org/) >= 18
- [Rust](https://rustup.rs/) >= 1.70
- Platform-specific:
  - **macOS**: Xcode Command Line Tools (`xcode-select --install`)
  - **Windows**: [Microsoft C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/), WebView2

## Quick Start

```bash
# Install dependencies
npm install

# Run in development mode (hot reload)
npm run tauri dev

# Build for production
npm run tauri build
```

## Build Output

After `npm run tauri build`:
- **macOS**: `src-tauri/target/release/bundle/macos/QimoBar.app` and `.dmg`
- **Windows**: `src-tauri/target/release/bundle/msi/` and `nsis/`

## Project Structure

```
QimoBar/
├── src/                      # React frontend
│   ├── pages/
│   │   ├── PetWindow.tsx     # Pet display + drag + GIF rendering
│   │   └── SettingsWindow.tsx # Settings UI panel
│   ├── types/index.ts        # TypeScript type definitions
│   ├── App.tsx               # Route-based page selector
│   ├── main.tsx              # React entry point
│   └── styles.css            # All styles
├── src-tauri/                # Rust backend
│   ├── src/
│   │   ├── lib.rs            # App setup, plugins, command registration
│   │   ├── main.rs           # Binary entry point
│   │   ├── tray.rs           # System tray / menu bar
│   │   ├── window.rs         # Pet window creation + monitor safety
│   │   ├── config.rs         # Config & asset persistence (JSON)
│   │   └── commands.rs       # IPC commands
│   ├── Cargo.toml
│   └── tauri.conf.json
├── docs/
│   └── app-icon.png          # App icon used in docs
├── index.html
├── package.json
└── vite.config.ts
```

## Configuration

Config stored at:
- **macOS**: `~/Library/Application Support/QimoBar/`
- **Windows**: `%APPDATA%/QimoBar/`

Files:
- `config.json` - App settings (scale, opacity, position, etc.)
- `assets.json` - Imported GIF asset registry
- `assets/` - Copied GIF files

## Implemented Features (MVP)

- [x] System tray / menu bar with right-click menu
- [x] Show/Hide pet toggle
- [x] Import GIF via file dialog
- [x] Settings panel (scale, opacity, click-through, always-on-top, autostart)
- [x] Quit from tray
- [x] Transparent, borderless pet window
- [x] Drag to move
- [x] Position persistence & restore
- [x] Scale control (0.3x - 3x)
- [x] Opacity control (10% - 100%)
- [x] Click-through toggle
- [x] Always on top toggle
- [x] Launch at startup
- [x] Multi-monitor boundary check (falls back to center)
- [x] Position reset
- [x] Multiple GIF asset management (import, switch, delete)
- [x] Single instance enforcement
- [x] GIF validation (magic bytes + 50MB size limit)
- [x] Config persistence (JSON)
- [x] Visibility state persistence

## Not Yet Implemented

- [ ] Drag-and-drop GIF import onto pet window
- [ ] Clipboard GIF import
- [ ] WeChat source import
- [ ] Cloud asset library
- [ ] Multiple pet instances
- [ ] Auto-wander / path animation
- [ ] Sound effects
- [ ] Auto-update

## Known Issues

1. macOS transparent windows require `macos-private-api` flag
2. Pet window is fixed at 200x200px; large GIFs are scaled to fit
3. Position saved in physical pixels; display scaling changes may cause slight drift
4. When click-through is enabled, you must use the tray menu or settings to disable it

## License

MIT
