use sysinfo::{System};
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct HardwareStatus {
    total_memory: u64,
    available_memory: u64,
    cpu_cores: usize,
    thermal_printers_found: usize,
    os_version: String,
}

#[tauri::command]
pub fn check_hardware_health() -> Result<HardwareStatus, String> {
    let mut sys = System::new_all();
    sys.refresh_all(); // Met à jour les infos RAM et CPU

    let total_memory = sys.total_memory() / 1024 / 1024; // MB
    let available_memory = sys.available_memory() / 1024 / 1024; // MB
    let cpu_cores = sys.cpus().len();
    let os_version = System::os_version().unwrap_or_else(|| "Unknown OS".to_string());

    // Détection des ports séries disponibles (potentiellement des imprimantes thermiques)
    let thermal_printers_found = match serialport::available_ports() {
        Ok(ports) => ports.len(),
        Err(_) => 0, // Impossible de lire les ports
    };

    Ok(HardwareStatus {
        total_memory,
        available_memory,
        cpu_cores,
        thermal_printers_found,
        os_version,
    })
}
