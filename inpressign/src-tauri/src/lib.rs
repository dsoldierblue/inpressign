use tauri::{generate_context, generate_handler, Builder};
use std::fs;
use std::io::Write;
use std::path::PathBuf;
use std::process::Command;
use base64::engine::general_purpose::STANDARD as BASE64;
use base64::Engine;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Bienvenido a {}, la suite local de análisis periodístico.", name)
}

// Stub command to "extract" text from a file path.
// Currently returns a placeholder string. Replace with a PDF/text extractor (poppler, pdfium, etc.)
#[tauri::command]
fn extract_text(file_path: &str) -> Result<String, String> {
    // Safe attempt to read the file as UTF-8; if it fails, return a placeholder message.
    match fs::read_to_string(file_path) {
        Ok(content) => Ok(content),
        Err(_) => Ok(format!("[extracted-text-placeholder] file: {}", file_path)),
    }
}

// Save a base64-encoded file to a temp directory and attempt to extract text.
// - Decodes base64 and writes to temp file.
// - If the file looks like a PDF (extension .pdf), attempts to run `pdftotext <file> -`
//   and return stdout. If pdftotext is not available or fails, falls back to
//   returning a placeholder message.
#[tauri::command]
fn save_and_extract(base64_data: &str, filename: &str) -> Result<String, String> {
    // Decode base64
    let bytes = match BASE64.decode(base64_data) {
        Ok(b) => b,
        Err(e) => return Err(format!("base64 decode error: {}", e)),
    };

    // Choose a temp path
    let mut out_path: PathBuf = std::env::temp_dir();
    // sanitize filename slightly
    let safe_name = filename.replace('/', "_").replace('\\', "_");
    out_path.push(format!("inpressign_upload_{}", safe_name));

    // Write bytes
    match std::fs::File::create(&out_path) {
        Ok(mut f) => {
            if let Err(e) = f.write_all(&bytes) {
                return Err(format!("failed writing file: {}", e));
            }
        }
        Err(e) => return Err(format!("failed creating file: {}", e)),
    }

    // If filename ends with .pdf, try pdftotext
    if safe_name.to_lowercase().ends_with(".pdf") {
        let output = Command::new("pdftotext")
            .arg(&out_path)
            .arg("-")
            .output();

        match output {
            Ok(o) => {
                if o.status.success() {
                    let txt = String::from_utf8_lossy(&o.stdout).to_string();
                    return Ok(txt);
                } else {
                    // pdftotext failed; include stderr in message for debugging
                    let stderr = String::from_utf8_lossy(&o.stderr);
                    return Ok(format!(
                        "[pdftotext-failed] stderr: {}\nFallback placeholder for file: {}",
                        stderr, filename
                    ));
                }
            }
            Err(e) => {
                return Ok(format!(
                    "[pdftotext-not-found-or-error] {}. Fallback placeholder for file: {}",
                    e, filename
                ));
            }
        }
    }

    // Non-PDF: try to read as UTF-8 text
    match fs::read_to_string(&out_path) {
        Ok(s) => Ok(s),
        Err(_) => Ok(format!("[extracted-text-placeholder] file: {}", filename)),
    }
}

pub fn run() {
    Builder::default()
        .invoke_handler(generate_handler![greet, extract_text, save_and_extract])
        .run(generate_context!())
        .expect("error while running InPressign");
}