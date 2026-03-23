use tauri::command;
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::fs::File;
use sha2::{Sha256, Digest};
use rsa::{RsaPublicKey, pkcs8::DecodePublicKey};
use rsa::pkcs1v15::VerifyingKey;
use rsa::signature::Verifier;
use base64::{engine::general_purpose::STANDARD as BASE64, Engine as _};
#[cfg(target_os = "windows")]
use tokio::process::Command;

const PUBLIC_KEY_PEM: &str = r#"-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAuLd/Wf0o5zT8D+M2I6b7
qB8g2zB/Jj3t6gR+YnL/v5yQz2/v+Yq+T8xLzK8/1jL8Y5Q4D2b5X5v7gG9T2/W/
xT4z1Z3U+D/B5D7qK3y6g8rG7fQzY+v2s+Q/1W/v1A1d9L0vT9p8n9r2V7H4V3/6
vW7uB/2Z1L3D7oK4Qz5L2V6Z3K1m2D9T2a7xV4Z8Y7D/R1X/3/0Y8/Qz/X/A7g5w
L6n0s+g6gD3n9K9xYyZ+J/6vA8w5B/T/uT3e7l5t/r2s0L9K/1qZ3P7k7r8bZ5
g7L1z8K/Y4qR/K0D8L3vK1xQ7R/W/Y+W8D9q/yqH3n2G+u9e8J/2/y+wIDAQAB
-----END PUBLIC KEY-----"#;

#[command]
pub async fn check_and_install_update(server_url: String) -> Result<String, String> {
    let base_url = server_url.trim_end_matches('/');

    // Attempt to download the manifest to determine the binary name and extension
    // If not using a manifest, we would probe for .exe or .msi or pass the name as an argument.
    // For this example, we'll try fetching a simple JSON manifest, or we can check headers.
    // Given the previous setup, we'll assume the server hosts app-update.exe or app-update.msi.

    let possible_urls = vec![
        format!("{}/update/app-update.exe", base_url),
        format!("{}/update/app-update.msi", base_url)
    ];

    let mut binary_url = String::new();
    let mut binary_resp = None;

    for url in possible_urls {
        if let Ok(resp) = reqwest::get(&url).await {
            if resp.status().is_success() {
                binary_url = url;
                binary_resp = Some(resp);
                break;
            }
        }
    }

    let mut binary_resp = match binary_resp {
        Some(resp) => resp,
        None => return Err("No update executable (.exe or .msi) found on server".to_string()),
    };

    let is_msi = binary_url.ends_with(".msi");
    let ext = if is_msi { ".msi" } else { ".exe" };

    let sig_url = format!("{}/update/app-update.sig", base_url);
    let sha_url = format!("{}/update/app-update.sha256", base_url);

    let sig_resp = reqwest::get(&sig_url).await.map_err(|e| e.to_string())?;
    if !sig_resp.status().is_success() {
        return Err("No update available or signature missing".to_string());
    }
    let rsa_signature_b64 = sig_resp.text().await.map_err(|e| e.to_string())?.trim().to_string();

    let sha_resp = reqwest::get(&sha_url).await.map_err(|e| e.to_string())?;
    if !sha_resp.status().is_success() {
         return Err("Failed to fetch SHA256".to_string());
    }
    let expected_sha256_hex = sha_resp.text().await.map_err(|e| e.to_string())?.trim().to_string();

    let temp_dir = std::env::temp_dir();
    let temp_file_path = temp_dir.join(format!("systeme_sante_update_{}{}", uuid::Uuid::new_v4(), ext));

    let mut temp_file = File::create(&temp_file_path).await.map_err(|e| format!("Failed to create temporary file: {}", e))?;

    while let Some(chunk) = binary_resp.chunk().await.map_err(|e| format!("Error reading chunk: {}", e))? {
        temp_file.write_all(&chunk).await.map_err(|e| format!("Error writing chunk: {}", e))?;
    }

    temp_file.flush().await.map_err(|e| format!("Error flushing temp file: {}", e))?;

    // Ensure the file handle is dropped so we can read it, hash it, and execute it without locking issues
    drop(temp_file);

    // 1. SHA-256 Check
    let mut file = File::open(&temp_file_path).await.map_err(|e| e.to_string())?;
    let mut hasher = Sha256::new();
    let mut buffer = [0; 8192];
    loop {
        let n = file.read(&mut buffer).await.map_err(|e| e.to_string())?;
        if n == 0 { break; }
        hasher.update(&buffer[..n]);
    }
    let hash_result = hasher.finalize();
    let actual_sha256_hex = hex::encode(hash_result);

    if actual_sha256_hex != expected_sha256_hex {
        let _ = tokio::fs::remove_file(&temp_file_path).await; // cleanup
        return Err("SHA256 hash mismatch. File might be corrupted.".to_string());
    }

    // 2. RSA Signature Check
    let signature_bytes = BASE64.decode(&rsa_signature_b64).map_err(|e| e.to_string())?;
    let public_key = RsaPublicKey::from_public_key_pem(PUBLIC_KEY_PEM).map_err(|e| e.to_string())?;
    let verifying_key: VerifyingKey<Sha256> = VerifyingKey::new(public_key);

    // Re-open to read all bytes into memory for verification.
    // In a real scenario with huge files, chunking the hashing for signature verification is needed,
    // but pkcs1v15::Signature verifying API usually expects the whole message to hash internally.
    let mut file_rewound = File::open(&temp_file_path).await.map_err(|e| e.to_string())?;
    let mut full_file_bytes = Vec::new();
    file_rewound.read_to_end(&mut full_file_bytes).await.map_err(|e| e.to_string())?;

    let signature = rsa::pkcs1v15::Signature::try_from(signature_bytes.as_slice()).map_err(|e| e.to_string())?;

    if verifying_key.verify(&full_file_bytes, &signature).is_err() {
        let _ = tokio::fs::remove_file(&temp_file_path).await; // cleanup
        return Err("Invalid RSA signature. Update file is not authentic.".to_string());
    }

    let path_str = temp_file_path.to_string_lossy().to_string();

    // 3. Silent Installation
    #[cfg(target_os = "windows")]
    {
        if is_msi {
            Command::new("msiexec")
                .arg("/i")
                .arg(&path_str)
                .arg("/qn") // Silent mode
                .spawn()
                .map_err(|e| format!("Failed to launch MSI installer: {}", e))?;
        } else {
            Command::new(&path_str)
                .arg("/SILENT") // Or /S depending on the installer builder
                .spawn()
                .map_err(|e| format!("Failed to launch EXE installer: {}", e))?;
        }

        Ok("Installation started silently.".to_string())
    }

    #[cfg(not(target_os = "windows"))]
    {
        let _ = path_str; // avoid unused warning
        // Fallback for non-windows (though .exe implies Windows)
        return Err("Silent installation is only supported on Windows for .exe/.msi".to_string());
    }
}
