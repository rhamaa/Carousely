use base64::{engine::general_purpose, Engine as _};
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};

#[derive(Debug, Serialize)]
pub struct DesktopContext {
  os: String,
  arch: String,
  profile: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportSlidePayload {
  filename: String,
  data_url: String,
}

fn decode_data_url(data_url: &str) -> Result<Vec<u8>, String> {
  let (metadata, encoded) = data_url
    .split_once(',')
    .ok_or_else(|| "Data URL tidak valid.".to_string())?;

  if !metadata.contains(";base64") {
    return Err("Data URL harus dalam format base64.".into());
  }

  general_purpose::STANDARD
    .decode(encoded)
    .map_err(|_| "Gagal decode data URL gambar.".to_string())
}

#[tauri::command]
fn desktop_context() -> DesktopContext {
  DesktopContext {
    os: std::env::consts::OS.into(),
    arch: std::env::consts::ARCH.into(),
    profile: if cfg!(debug_assertions) {
      "development"
    } else {
      "production"
    }
    .into(),
  }
}

#[tauri::command]
fn save_project_file(path: String, content: String) -> Result<(), String> {
  let target_path = PathBuf::from(path);
  if let Some(parent) = target_path.parent() {
    std::fs::create_dir_all(parent).map_err(|err| err.to_string())?;
  }

  std::fs::write(target_path, content).map_err(|err| err.to_string())
}

#[tauri::command]
fn open_project_file(path: String) -> Result<String, String> {
  std::fs::read_to_string(path).map_err(|err| err.to_string())
}

#[tauri::command]
fn export_png_folder(folder_path: String, slides: Vec<ExportSlidePayload>) -> Result<usize, String> {
  let target_dir = PathBuf::from(folder_path);
  std::fs::create_dir_all(&target_dir).map_err(|err| err.to_string())?;

  let mut exported = 0usize;
  for slide in slides {
    let safe_filename = Path::new(&slide.filename)
      .file_name()
      .and_then(|filename| filename.to_str())
      .ok_or_else(|| "Nama file slide tidak valid.".to_string())?;

    let bytes = decode_data_url(&slide.data_url)?;
    let output_path = target_dir.join(safe_filename);
    std::fs::write(output_path, bytes).map_err(|err| err.to_string())?;
    exported += 1;
  }

  Ok(exported)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_dialog::init())
    .invoke_handler(tauri::generate_handler![
      desktop_context,
      save_project_file,
      open_project_file,
      export_png_folder
    ])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
