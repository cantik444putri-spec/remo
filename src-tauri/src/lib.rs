// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

mod keystore;

#[tauri::command]
fn app_version() -> &'static str {
    env!("CARGO_PKG_VERSION")
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            app_version,
            keystore::keystore_set,
            keystore::keystore_get,
            keystore::keystore_delete,
            keystore::keystore_has,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
