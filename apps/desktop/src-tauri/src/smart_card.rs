use pcsc::{Context, Protocols, Scope, ShareMode};
use serde::Serialize;
use tauri::command;

#[derive(Debug, Serialize)]
pub struct SmartCardData {
    pub reader_name: String,
    pub atr_hex: String,
}

#[derive(Debug, Serialize)]
pub struct SmartCardError {
    pub message: String,
    pub code: String,
}

#[command]
pub async fn read_smart_card() -> Result<SmartCardData, SmartCardError> {
    // Établir le contexte PC/SC
    let ctx = Context::establish(Scope::User).map_err(|e| SmartCardError {
        message: format!("Failed to establish PC/SC context: {}", e),
        code: "PCSC_CONTEXT_ERROR".to_string(),
    })?;

    // Allouer un buffer pour les noms des lecteurs
    let mut readers_buf = [0; 2048];
    let mut readers = match ctx.list_readers(&mut readers_buf) {
        Ok(readers) => readers,
        Err(err) => {
            return Err(SmartCardError {
                message: format!("Failed to list readers: {}", err),
                code: "PCSC_LIST_READERS_ERROR".to_string(),
            });
        }
    };

    // Filtrer pour un lecteur médical
    let mut medical_reader = None;
    for reader in readers {
        let name = reader.to_string_lossy().into_owned();
        if name.to_lowercase().contains("omni") || name.to_lowercase().contains("gemalto") || name.to_lowercase().contains("medical") || name.to_lowercase().contains("smart") {
            medical_reader = Some(reader);
            break;
        }
    }

    let reader = medical_reader.ok_or(SmartCardError { message: "No medical smart card readers found".to_string(), code: "NO_MEDICAL_READERS".to_string() })?;
    let reader_name = reader.to_string_lossy().into_owned();

    // Se connecter à la carte dans le lecteur
    let card = match ctx.connect(reader, ShareMode::Shared, Protocols::ANY) {
        Ok(card) => card,
        Err(err) => {
            return Err(SmartCardError {
                message: format!("Failed to connect to card: {}", err),
                code: "PCSC_CONNECT_ERROR".to_string(),
            });
        }
    };

    // Récupérer l'ATR (Answer To Reset) de la carte
    let mut names_buf = [0; 2048];
    let mut atr_buf = [0; 2048];
    let atr = match card.status2(&mut names_buf, &mut atr_buf) {
        Ok(status) => status.atr().to_vec(),
        Err(err) => {
            return Err(SmartCardError {
                message: format!("Failed to get card status/ATR: {}", err),
                code: "PCSC_STATUS_ERROR".to_string(),
            });
        }
    };

    // Convertir l'ATR en chaîne hexadécimale
    let atr_hex = atr.iter().map(|b| format!("{:02X}", b)).collect::<Vec<String>>().join("");

    Ok(SmartCardData {
        reader_name,
        atr_hex,
    })
}
