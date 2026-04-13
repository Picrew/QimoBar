export interface Position {
  x: number;
  y: number;
}

export interface AppConfig {
  launch_at_startup: boolean;
  click_through: boolean;
  always_on_top: boolean;
  pet_scale: number;
  pet_opacity: number;
  current_asset_id: string | null;
  pet_position: Position | null;
  pet_visible: boolean;
}

export interface AssetItem {
  id: string;
  name: string;
  source_type: string;
  file_path: string;
  width?: number;
  height?: number;
  file_size?: number;
  created_at: string;
}
