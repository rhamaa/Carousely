use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct DesktopContext {
  os: String,
  arch: String,
  profile: String,
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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![desktop_context])
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
