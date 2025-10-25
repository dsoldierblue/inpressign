// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// Punto de entrada de la aplicación Tauri
// Aquí simplemente delegamos toda la lógica al módulo inpressign_lib,
// donde se definen los comandos, el builder y la configuración general.

fn main() {
    // Llama a la función principal definida en src-tauri/src/lib.rs
    // Allí se configura el backend, los comandos y la ventana principal.
    inpressign_lib::run();
}