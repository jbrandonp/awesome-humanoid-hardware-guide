use mdns_sd::{ServiceDaemon, ServiceEvent};
use std::time::Duration;
use tokio::time::timeout;
use serde::Serialize;
use keyring::Entry;

mod thermal_printer;
mod hardware_diag;

#[derive(Debug, Serialize)]
pub struct DiscoveryResult {
    pub ip: String,
    pub port: u16,
    pub full_url: String,
}

#[derive(Debug, Serialize)]
pub struct DiscoveryError {
    pub message: String,
    pub code: String,
}

#[tauri::command]
fn save_token(token: String) -> Result<(), String> {
    let entry = Entry::new("systeme_sante", "access_token").map_err(|e| e.to_string())?;
    entry.set_password(&token).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn get_token() -> Result<String, String> {
    let entry = Entry::new("systeme_sante", "access_token").map_err(|e| e.to_string())?;
    let password = entry.get_password().map_err(|e| e.to_string())?;
    Ok(password)
}

#[tauri::command]
fn delete_token() -> Result<(), String> {
    let entry = Entry::new("systeme_sante", "access_token").map_err(|e| e.to_string())?;
    entry.delete_password().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn get_os_info() -> Result<String, String> {
    let os_name = std::env::consts::OS;
    let is_windows = cfg!(windows);

    if is_windows {
      return Ok(format!("{} (Fallback checks on Frontend for exact Win7 ver)", os_name));
    }
    Ok(os_name.to_string())
}

#[tauri::command]
async fn discover_medical_api() -> Result<DiscoveryResult, DiscoveryError> {
    let mdns = ServiceDaemon::new().map_err(|e| DiscoveryError {
        message: e.to_string(),
        code: "MDNS_DAEMON_ERROR".to_string(),
    })?;

    // On écoute le même nom de service défini dans `main.ts` par node-dns-sd (_medical-api._tcp.local.)
    let service_type = "_medical-api._tcp.local.";
    let receiver = mdns.browse(service_type).map_err(|e| DiscoveryError {
        message: e.to_string(),
        code: "MDNS_BROWSE_ERROR".to_string(),
    })?;

    let timeout_duration = Duration::from_secs(5);

    let result = timeout(timeout_duration, async {
        while let Ok(event) = receiver.recv_async().await {
            match event {
                ServiceEvent::ServiceResolved(info) => {
                    let ips = info.get_addresses();
                    if let Some(ip) = ips.iter().next() {
                        let port = info.get_port();
                        return Ok(DiscoveryResult {
                            ip: ip.to_string(),
                            port,
                            full_url: format!("http://{}:{}", ip, port),
                        });
                    }
                }
                _ => continue,
            }
        }
        Err(DiscoveryError {
            message: "Aucun service trouvé sur le réseau local.".to_string(),
            code: "MDNS_NOT_FOUND".to_string(),
        })
    })
    .await;

    // cleanup
    let _ = mdns.stop_browse(service_type);

    match result {
        Ok(Ok(discovery)) => Ok(discovery),
        Ok(Err(e)) => Err(e),
        Err(_) => Err(DiscoveryError {
            message: "Timeout de 5 secondes atteint sans découvrir l'API".to_string(),
            code: "MDNS_TIMEOUT".to_string(),
        }),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![
      discover_medical_api,
      get_os_info,
      save_token,
      get_token,
      delete_token,
      thermal_printer::print_thermal_receipt,
      hardware_diag::check_hardware_health
    ])
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
