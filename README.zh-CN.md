<div align="center">

<img src="docs/app-icon.png" alt="QimoBar" width="120" />

# QimoBar - 桌面萌宠

**一个轻量、跨平台的桌面 GIF 挂件应用**

[![Platform](https://img.shields.io/badge/平台-macOS%20%7C%20Windows-blue)](#)
[![Built with](https://img.shields.io/badge/技术栈-Tauri%202%20%2B%20React%20%2B%20TypeScript%20%2B%20Rust-orange)](#)
[![License](https://img.shields.io/badge/协议-MIT-green)](#license)

[English](./README.md) | **中文**

</div>

---

## 它是什么？

QimoBar 是一个**桌面萌宠**应用 —— 你可以导入任意 GIF 动图，让它以透明无边框的方式常驻在你的桌面上，像一个小小的桌面伙伴。

它的设计哲学是：**轻量、流畅、常驻、低打扰**。

<div align="center">

| 桌宠窗口 | 系统托盘 | 设置面板 |
|:---:|:---:|:---:|
| 透明无边框<br>可拖拽 / 可缩放 | 菜单栏常驻<br>右键快捷操作 | 缩放 / 透明度<br>点击穿透 / 开机启动 |

</div>

## 功能特性

### 核心体验
- **系统托盘 / 菜单栏常驻** — macOS 菜单栏图标，Windows 系统托盘图标
- **透明无边框窗口** — 桌宠漂浮在桌面上，不遮挡工作
- **拖拽移动** — 鼠标拖拽桌宠到任意位置
- **GIF 导入** — 通过文件选择器导入本地 GIF 动图
- **位置记忆** — 记住桌宠上次的位置，重启后恢复

### 可定制项
- **缩放** — 0.3x ~ 3x 自由缩放
- **透明度** — 10% ~ 100% 透明度调节
- **点击穿透** — 开启后鼠标事件穿透桌宠窗口
- **始终置顶** — 桌宠始终显示在最上层
- **开机自启动** — 系统启动时自动运行

### 系统能力
- **多显示器适配** — 自动检测显示器边界，防止桌宠跑到不可见区域
- **单实例运行** — 不会重复启动多个进程
- **位置重置** — 一键将桌宠移回屏幕中央
- **多素材管理** — 可导入多个 GIF，随时切换

## 快速开始

### 环境要求

| 依赖 | 版本 | 备注 |
|---|---|---|
| [Node.js](https://nodejs.org/) | >= 18 | 前端构建 |
| [Rust](https://rustup.rs/) | >= 1.70 | 后端编译 |
| Xcode CLI Tools | - | 仅 macOS: `xcode-select --install` |
| C++ Build Tools | - | 仅 Windows: [下载](https://visualstudio.microsoft.com/visual-cpp-build-tools/) |

### 安装与运行

```bash
# 1. 克隆项目
git clone https://github.com/Picrew/QimoBar.git
cd QimoBar

# 2. 安装依赖
npm install

# 3. 开发模式运行（支持热更新）
npm run tauri dev

# 4. 构建生产版本
npm run tauri build
```

### 构建产物

构建完成后：
- **macOS**: `src-tauri/target/release/bundle/macos/QimoBar.app` 和 `.dmg`
- **Windows**: `src-tauri/target/release/bundle/msi/` 和 `nsis/`

## 使用说明

### 基本操作

1. **启动应用** → 系统托盘 / 菜单栏出现图标，桌面出现桌宠窗口
2. **导入 GIF** → 右键托盘图标 → "Import GIF..." → 选择 GIF 文件
3. **移动桌宠** → 鼠标左键按住桌宠拖拽
4. **打开设置** → 右键托盘图标 → "Settings..."
5. **显示/隐藏** → 右键托盘图标 → "Show/Hide Pet"
6. **退出** → 右键托盘图标 → "Quit QimoBar"

### 设置项说明

| 设置 | 说明 |
|---|---|
| Scale (缩放) | 调整桌宠显示大小，范围 0.3x ~ 3x |
| Opacity (透明度) | 调整桌宠透明度，范围 10% ~ 100% |
| Always on Top (始终置顶) | 桌宠窗口是否始终在最上层 |
| Click Through (点击穿透) | 开启后鼠标事件穿透桌宠窗口，无法拖拽 |
| Launch at Startup (开机启动) | 系统启动时自动运行 QimoBar |
| Reset Position (重置位置) | 将桌宠移回屏幕中央 |

## 项目结构

```
QimoBar/
├── src/                          # React 前端
│   ├── pages/
│   │   ├── PetWindow.tsx         # 桌宠窗口：GIF 显示、拖拽、导入
│   │   └── SettingsWindow.tsx    # 设置面板：所有可配置项
│   ├── types/index.ts            # TypeScript 类型定义
│   ├── App.tsx                   # 路由：根据 URL 渲染不同页面
│   ├── main.tsx                  # React 入口
│   └── styles.css                # 全局样式（桌宠 + 设置面板 + 暗色模式）
├── src-tauri/                    # Rust 后端
│   ├── src/
│   │   ├── lib.rs                # 应用入口：插件注册、命令注册、状态管理
│   │   ├── main.rs               # 二进制入口
│   │   ├── tray.rs               # 系统托盘 / 菜单栏
│   │   ├── window.rs             # 桌宠窗口创建 + 多显示器安全检测
│   │   ├── config.rs             # 配置与素材持久化（JSON 文件）
│   │   └── commands.rs           # IPC 命令（10 个）
│   ├── icons/                    # 应用图标
│   ├── Cargo.toml                # Rust 依赖
│   └── tauri.conf.json           # Tauri 配置
├── docs/                         # 文档资源
│   └── app-icon.png              # 应用图标
├── index.html                    # HTML 入口
├── package.json                  # Node 依赖
├── vite.config.ts                # Vite 配置
├── README.md                     # English README
└── README.zh-CN.md               # 中文 README
```

## 技术架构

```
┌─────────────────────────────────────────────┐
│                  用户界面                      │
│  ┌──────────────┐  ┌───────────────────────┐ │
│  │  桌宠窗口      │  │   设置面板              │ │
│  │  PetWindow   │  │   SettingsWindow      │ │
│  │  (透明/无边框) │  │   (标准窗口)           │ │
│  └──────┬───────┘  └──────────┬────────────┘ │
│         │    React + TypeScript│              │
├─────────┼─────────────────────┼──────────────┤
│         │     Tauri IPC       │              │
├─────────┼─────────────────────┼──────────────┤
│         ▼                     ▼              │
│  ┌─────────────────────────────────────────┐ │
│  │              Rust 后端                    │ │
│  │  ┌────────┐ ┌────────┐ ┌─────────────┐  │ │
│  │  │ tray   │ │ window │ │  commands   │  │ │
│  │  │ 托盘    │ │ 窗口    │ │  IPC 命令   │  │ │
│  │  └────────┘ └────────┘ └─────────────┘  │ │
│  │  ┌────────────────┐ ┌────────────────┐  │ │
│  │  │    config      │ │   Tauri 插件    │  │ │
│  │  │  配置持久化      │ │ dialog/fs/     │  │ │
│  │  │  (JSON 文件)    │ │ autostart/...  │  │ │
│  │  └────────────────┘ └────────────────┘  │ │
│  └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

## 配置文件

配置文件存放路径：
- **macOS**: `~/Library/Application Support/QimoBar/`
- **Windows**: `%APPDATA%/QimoBar/`

| 文件 | 用途 |
|---|---|
| `config.json` | 应用设置（缩放、透明度、位置、开机启动等） |
| `assets.json` | 已导入的 GIF 素材注册表 |
| `assets/` | 已导入的 GIF 文件副本 |

### 配置示例

```json
{
  "launch_at_startup": false,
  "click_through": false,
  "always_on_top": true,
  "pet_scale": 1.0,
  "pet_opacity": 1.0,
  "current_asset_id": "uuid-of-current-gif",
  "pet_position": { "x": 1510.0, "y": 802.0 },
  "pet_visible": true
}
```

## 已实现功能

- [x] 系统托盘 / 菜单栏常驻 + 右键菜单
- [x] 显示 / 隐藏桌宠
- [x] 文件选择器导入 GIF
- [x] 设置面板（缩放、透明度、点击穿透、始终置顶、开机启动）
- [x] 从托盘退出
- [x] 透明无边框桌宠窗口
- [x] 鼠标拖拽移动
- [x] 位置持久化与恢复
- [x] 缩放控制（0.3x ~ 3x）
- [x] 透明度控制（10% ~ 100%）
- [x] 点击穿透开关
- [x] 始终置顶开关
- [x] 开机自启动
- [x] 多显示器边界检测（超出范围自动回到中心）
- [x] 位置重置
- [x] 多素材管理（导入、切换、删除）
- [x] 单实例运行
- [x] GIF 合法性校验（magic bytes + 50MB 大小限制）
- [x] 配置持久化（JSON）
- [x] 可见性状态持久化
- [x] 暗色模式支持（设置面板）

## 待实现功能

- [ ] 拖拽导入 GIF（拖文件到桌宠窗口）
- [ ] 剪贴板导入 GIF
- [ ] 微信来源导入
- [ ] 云端素材库
- [ ] 多桌宠实例
- [ ] 自动游走 / 轨迹动画
- [ ] 音效
- [ ] 自动更新
- [ ] 自定义托盘图标

## 已知问题

1. macOS 的透明窗口需要开启 `macos-private-api`，可能影响 App Store 审核
2. 桌宠窗口固定 200x200px，超大 GIF 会被缩放适配
3. 位置以物理像素保存，切换显示器缩放比例时可能有微小偏移
4. 点击穿透开启后无法拖拽桌宠，需通过托盘菜单或设置面板关闭

## 开发指南

```bash
# TypeScript 类型检查
npx tsc --noEmit

# Rust 代码检查
cd src-tauri && cargo check

# 构建调试版本
npm run tauri build -- --debug
```

## License

[MIT](./LICENSE)

---

<div align="center">

**QimoBar** — 你桌面上的小伙伴

</div>
