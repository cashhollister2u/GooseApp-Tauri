// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

pub mod commands;

fn main() {
  tauri::Builder::default()
      .invoke_handler(tauri::generate_handler![commands::my_rust_function])
      // other configurations
      .run(tauri::generate_context!())
      .expect("error while running tauri application");
}