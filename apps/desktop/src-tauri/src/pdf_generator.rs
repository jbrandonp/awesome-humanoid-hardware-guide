use serde::{Deserialize, Serialize};
use qrcode::QrCode;
use ::image::Luma;
use uuid::Uuid;
use printpdf::*;
use rand::RngCore;

#[derive(Debug, Deserialize, Serialize)]
pub struct Medication {
    pub name: String,
    pub dosage: String,
    pub instructions: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct PrescriptionData {
    pub clinic_name: String,
    pub clinic_address: String,
    pub patient_name: String,
    pub medications: Vec<Medication>,
}

pub fn generate_qr_code() -> Result<(String, printpdf::image_crate::DynamicImage), String> {
    let uuid = Uuid::new_v4().to_string();
    let code = QrCode::new(uuid.as_bytes()).map_err(|e| e.to_string())?;

    // Render the QR code into an image buffer
    let image = code.render::<Luma<u8>>().build();

    // Create the image using printpdf's embedded image crate version to avoid trait bound errors
    let img_buffer = printpdf::image_crate::ImageBuffer::from_raw(image.width(), image.height(), image.into_raw()).ok_or("Failed to create image buffer")?;
    let dyn_img = printpdf::image_crate::DynamicImage::ImageLuma8(img_buffer);

    Ok((uuid, dyn_img))
}

pub fn generate_pdf_document(data: &PrescriptionData, qr_code_img: &printpdf::image_crate::DynamicImage, uuid: &str) -> Result<Vec<u8>, String> {
    let (doc, page1, layer1) = PdfDocument::new("Ordonnance", Mm(210.0), Mm(297.0), "Layer 1");
    let current_layer = doc.get_page(page1).get_layer(layer1);

    // Font setup
    let font = doc.add_builtin_font(BuiltinFont::Helvetica).map_err(|e| e.to_string())?;
    let font_bold = doc.add_builtin_font(BuiltinFont::HelveticaBold).map_err(|e| e.to_string())?;

    // Clinic Header
    current_layer.use_text(&data.clinic_name, 24.0, Mm(20.0), Mm(270.0), &font_bold);
    current_layer.use_text(&data.clinic_address, 12.0, Mm(20.0), Mm(260.0), &font);

    // Patient Name
    current_layer.use_text(format!("Patient: {}", data.patient_name), 14.0, Mm(20.0), Mm(240.0), &font_bold);

    // Medications
    let mut current_y = 220.0;
    current_layer.use_text("Prescription:", 14.0, Mm(20.0), Mm(current_y), &font_bold);
    current_y -= 10.0;

    for med in &data.medications {
        let text = format!("- {} ({}) : {}", med.name, med.dosage, med.instructions);
        current_layer.use_text(text, 12.0, Mm(25.0), Mm(current_y), &font);
        current_y -= 10.0;
    }

    // Embed QR Code
    let image2 = Image::from_dynamic_image(qr_code_img);

    // Place QR code at the bottom right
    image2.add_to_layer(current_layer.clone(), ImageTransform {
        translate_x: Some(Mm(150.0)),
        translate_y: Some(Mm(20.0)),
        rotate: None,
        scale_x: Some(0.5),
        scale_y: Some(0.5),
        dpi: Some(300.0),
    });

    current_layer.use_text(format!("ID: {}", uuid), 8.0, Mm(150.0), Mm(15.0), &font);

    let mut pdf_bytes = Vec::new();
    {
        let mut buf = std::io::BufWriter::new(&mut pdf_bytes);
        doc.save(&mut buf).map_err(|e| e.to_string())?;
    }

    Ok(pdf_bytes)
}

use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Nonce
};
use std::io::Write;

pub fn encrypt_and_save(pdf_bytes: &[u8]) -> Result<(String, String), String> {
    let mut key_bytes = [0u8; 32];
    rand::rng().fill_bytes(&mut key_bytes);
    let key = aes_gcm::Key::<Aes256Gcm>::from_slice(&key_bytes);

    let cipher = Aes256Gcm::new(key);

    let mut nonce_bytes = [0u8; 12];
    rand::rng().fill_bytes(&mut nonce_bytes);
    let nonce = Nonce::from_slice(&nonce_bytes);

    let encrypted_bytes = cipher.encrypt(nonce, pdf_bytes).map_err(|e| e.to_string())?;

    let mut file = tempfile::NamedTempFile::new().map_err(|e| e.to_string())?;

    // Prepend nonce to the encrypted file for decryption later if needed
    file.write_all(&nonce_bytes).map_err(|e| e.to_string())?;
    file.write_all(&encrypted_bytes).map_err(|e| e.to_string())?;

    let path = file.into_temp_path();
    let path_str = path.to_str().unwrap_or("").to_string();

    // Keep the file from being deleted immediately
    path.keep().map_err(|e| e.to_string())?;

    // Return both the path and the hex-encoded encryption key
    let key_hex = hex::encode(key_bytes);

    Ok((path_str, key_hex))
}

#[derive(Serialize)]
pub struct PrescriptionResult {
    pub file_path: String,
    pub encryption_key: String,
}

#[tauri::command]
pub async fn generate_pdf_prescription(data: PrescriptionData) -> Result<PrescriptionResult, String> {
    let (uuid, qr_code_img) = generate_qr_code()?;
    let pdf_bytes = generate_pdf_document(&data, &qr_code_img, &uuid)?;

    let (file_path, encryption_key) = encrypt_and_save(&pdf_bytes)?;

    Ok(PrescriptionResult {
        file_path,
        encryption_key,
    })
}
