// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

mod keystore;
mod render;

#[tauri::command]
fn app_version() -> &'static str {
    env!("CARGO_PKG_VERSION")
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .manage(render::init_state())
        .invoke_handler(tauri::generate_handler![
            app_version,
            keystore::keystore_set,
            keystore::keystore_get,
            keystore::keystore_delete,
            keystore::keystore_has,
            render::render_start,
            render::render_cancel,
            render::render_list,
            render::render_open_folder,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
