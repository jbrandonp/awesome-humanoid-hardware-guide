use serde_json::Value;
use serialport::SerialPort;
use std::io::{Read, Write};
use std::time::Duration;

fn format_receipt(receipt_data: &Value) -> Vec<u8> {
    let mut bytes = Vec::new();

    // ESC @: Initialize printer
    bytes.extend_from_slice(&[0x1B, 0x40]);

    // Simple formatting: iterate over the JSON fields and print them
    if let Value::Object(map) = receipt_data {
        for (key, value) in map {
            let text = match value {
                Value::String(s) => format!("{}: {}\n", key, s),
                Value::Number(n) => format!("{}: {}\n", key, n),
                Value::Bool(b) => format!("{}: {}\n", key, b),
                _ => format!("{}: {:?}\n", key, value),
            };
            bytes.extend_from_slice(text.as_bytes());
        }
    } else {
        bytes.extend_from_slice("Invalid receipt data format.\n".as_bytes());
    }

    // LF: Line feed (a few times to push paper past the cutter)
    bytes.extend_from_slice(&[0x0A, 0x0A, 0x0A, 0x0A]);

    // GS V 0: Full cut
    bytes.extend_from_slice(&[0x1D, 0x56, 0x00]);

    bytes
}

fn get_printer_status(port: &mut Box<dyn SerialPort>) -> Result<(), String> {
    // Command: DLE EOT 1 (Transmit printer status)
    let status_cmd_1 = [0x10, 0x04, 0x01];
    port.write_all(&status_cmd_1).map_err(|e| format!("Erreur écriture DLE EOT 1: {}", e))?;

    let mut buf1 = [0u8; 1];
    // Wait for the response
    std::thread::sleep(Duration::from_millis(100));
    port.read_exact(&mut buf1).map_err(|e| format!("Erreur lecture statut imprimante: {}", e))?;
    let status1 = buf1[0];

    // Command: DLE EOT 4 (Transmit paper sensor status)
    let status_cmd_4 = [0x10, 0x04, 0x04];
    port.write_all(&status_cmd_4).map_err(|e| format!("Erreur écriture DLE EOT 4: {}", e))?;

    let mut buf4 = [0u8; 1];
    std::thread::sleep(Duration::from_millis(100));
    port.read_exact(&mut buf4).map_err(|e| format!("Erreur lecture capteur papier: {}", e))?;
    let status4 = buf4[0];

    // Command: DLE EOT 3 (Transmit offline status)
    let status_cmd_3 = [0x10, 0x04, 0x03];
    port.write_all(&status_cmd_3).map_err(|e| format!("Erreur écriture DLE EOT 3: {}", e))?;

    let mut buf3 = [0u8; 1];
    std::thread::sleep(Duration::from_millis(100));
    port.read_exact(&mut buf3).map_err(|e| format!("Erreur lecture statut hors ligne: {}", e))?;
    let status3 = buf3[0];

    // Decode status bytes
    // Status 4 (Paper sensor)
    // Bit 5, 6: Roll paper end sensor (11 means paper out)
    if (status4 & 0x60) == 0x60 {
        return Err("Plus de papier".to_string());
    }

    // Status 3 (Offline status)
    // Bit 2: Cover status (1 means cover is open)
    if (status3 & 0x04) == 0x04 {
        return Err("Capot ouvert".to_string());
    }

    // Bit 6: Error due to print head overheating / auto-recovery error
    if (status3 & 0x40) == 0x40 {
        return Err("Surchauffe de la tête d'impression".to_string());
    }

    // You could also check for general offline state or other errors if needed.
    // DLE EOT 1 Bit 3: Offline status (1 = offline)
    if (status1 & 0x08) == 0x08 && (status3 & 0x04) == 0 {
        // Only trigger generic offline if it's not cover open
        // return Err("Imprimante hors ligne".to_string());
    }

    Ok(())
}

#[tauri::command]
pub fn print_thermal_receipt(port_name: String, receipt_data: Value) -> Result<(), String> {
    let mut port = serialport::new(port_name.clone(), 9600)
        .timeout(Duration::from_millis(2000)) // give it time to reply to DLE EOT
        .open()
        .map_err(|e| format!("Erreur d'ouverture du port {}: {}", port_name, e))?;

    // Check status before printing
    get_printer_status(&mut port)?;

    // Format and print receipt
    let receipt_bytes = format_receipt(&receipt_data);

    port.write_all(&receipt_bytes)
        .map_err(|e| format!("Erreur d'envoi des données à l'imprimante: {}", e))?;

    Ok(())
}
