use tauri::{generate_context, generate_handler, Builder};

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Bienvenido a {}, la suite local de análisis periodístico.", name)
}

pub fn run() {
    Builder::default()
        .invoke_handler(generate_handler![greet])
        .run(generate_context!())
        .expect("error while running InPressign");
}