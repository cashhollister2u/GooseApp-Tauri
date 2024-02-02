// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

pub mod commands;

fn main() {
  tauri::Builder::default()
      .invoke_handler(tauri::generate_handler![commands::pull_messages_encrypted, commands::pull_message_to_encrypt])
      // other configurations
      .run(tauri::generate_context!())
      .expect("error while running tauri application");
}