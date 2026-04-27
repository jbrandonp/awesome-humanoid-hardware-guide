fn main() {
    println!("cargo:rustc-env=WEBVIEW2_BROWSER_EXECUTABLE_FOLDER=webview2_109");
    tauri_build::build();
}
