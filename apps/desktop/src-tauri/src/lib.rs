use mdns_sd::{ServiceDaemon, ServiceEvent};
use std::time::Duration;
use tokio::time::timeout;

#[tauri::command]
async fn discover_medical_api() -> Result<String, String> {
    let mdns = ServiceDaemon::new().map_err(|e| e.to_string())?;
    let service_type = "_medical-api._tcp.local.";
    let receiver = mdns.browse(service_type).map_err(|e| e.to_string())?;

    let timeout_duration = Duration::from_secs(5);

    let result = timeout(timeout_duration, async {
        while let Ok(event) = receiver.recv_async().await {
            match event {
                ServiceEvent::ServiceResolved(info) => {
                    let ips = info.get_addresses();
                    if let Some(ip) = ips.iter().next() {
                        let port = info.get_port();
                        return Ok(format!("http://{}:{}", ip, port));
                    }
                }
                _ => continue,
            }
        }
        Err("No service found".to_string())
    })
    .await;

    // cleanup
    let _ = mdns.stop_browse(service_type);

    match result {
        Ok(Ok(url)) => Ok(url),
        Ok(Err(e)) => Err(e),
        Err(_) => Err("Timeout reached without discovering API".to_string()),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![discover_medical_api])
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
