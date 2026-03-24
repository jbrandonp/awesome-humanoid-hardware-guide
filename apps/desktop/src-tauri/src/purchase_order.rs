use std::fs::{self, File};
use std::io::BufWriter;
use std::path::PathBuf;
use chrono::Local;
use printpdf::*;
use qrcode::QrCode;
use sha2::{Sha256, Digest};
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize, Serialize)]
pub struct PurchaseOrderItem {
    pub quantity: i32,
    #[serde(rename = "unitPriceCents")]
    pub unit_price_cents: i32,
    #[serde(rename = "inventoryItem")]
    pub inventory_item: InventoryItem,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct InventoryItem {
    pub name: String,
    pub category: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct Supplier {
    pub name: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct PurchaseOrder {
    pub id: String,
    #[serde(rename = "totalCents")]
    pub total_cents: i32,
    pub status: String,
    pub items: Vec<PurchaseOrderItem>,
    pub supplier: Supplier,
}

#[tauri::command]
pub async fn generate_purchase_order_pdf(order_json: String) -> Result<String, String> {
    // Deserialize input
    let order: PurchaseOrder = serde_json::from_str(&order_json).map_err(|e| format!("Invalid order JSON: {}", e))?;

    // Create a new PDF document (A4: 210mm x 297mm)
    let (doc, page1, layer1) = PdfDocument::new("Purchase Order", Mm(210.0), Mm(297.0), "Layer 1");
    let current_layer = doc.get_page(page1).get_layer(layer1);

    // Default font (Helvetica)
    let font = doc.add_builtin_font(BuiltinFont::Helvetica).map_err(|e| format!("Font error: {:?}", e))?;
    let font_bold = doc.add_builtin_font(BuiltinFont::HelveticaBold).map_err(|e| format!("Font error: {:?}", e))?;

    // Draw Clinic Header
    current_layer.use_text("CLINIQUE SAINT-JOSEPH - ACHATS", 24.0, Mm(20.0), Mm(270.0), &font_bold);
    current_layer.use_text("BON DE COMMANDE OFFICIEL (PROCURE-TO-PAY)", 12.0, Mm(20.0), Mm(260.0), &font);

    // Order Info
    let order_date = Local::now().format("%Y-%m-%d %H:%M:%S").to_string();
    current_layer.use_text(format!("N° Commande : {}", order.id), 10.0, Mm(20.0), Mm(240.0), &font);
    current_layer.use_text(format!("Date : {}", order_date), 10.0, Mm(20.0), Mm(235.0), &font);
    current_layer.use_text(format!("Fournisseur : {}", order.supplier.name), 10.0, Mm(20.0), Mm(230.0), &font);

    // Table Header
    current_layer.use_text("Désignation", 12.0, Mm(20.0), Mm(210.0), &font_bold);
    current_layer.use_text("Catégorie", 12.0, Mm(100.0), Mm(210.0), &font_bold);
    current_layer.use_text("Qté", 12.0, Mm(140.0), Mm(210.0), &font_bold);
    current_layer.use_text("Prix Unitaire", 12.0, Mm(160.0), Mm(210.0), &font_bold);

    // Table Rows
    let mut y_pos = 200.0;
    for item in &order.items {
        current_layer.use_text(item.inventory_item.name.clone(), 10.0, Mm(20.0), Mm(y_pos), &font);
        current_layer.use_text(item.inventory_item.category.clone(), 10.0, Mm(100.0), Mm(y_pos), &font);
        current_layer.use_text(item.quantity.to_string(), 10.0, Mm(140.0), Mm(y_pos), &font);

        let price_fmt = format!("{:.2} INR", (item.unit_price_cents as f64) / 100.0);
        current_layer.use_text(price_fmt, 10.0, Mm(160.0), Mm(y_pos), &font);

        y_pos -= 10.0;
    }

    // Total
    y_pos -= 10.0;
    let total_fmt = format!("TOTAL : {:.2} INR", (order.total_cents as f64) / 100.0);
    current_layer.use_text(total_fmt, 14.0, Mm(140.0), Mm(y_pos), &font_bold);

    // Generate QR Code containing the Order ID
    let code = QrCode::new(order.id.as_bytes()).map_err(|e| format!("QR Code error: {}", e))?;
    // image::Luma is used inside qrcode render builder, or we can use dark_color / light_color to generate raw pixels
    // Using string output is easiest for qr code, or manual rendering
    let render_qr = code.render::<char>().quiet_zone(false).module_dimensions(1, 1).build();

    // A quick manual pixel expansion to RGB for printpdf ImageXObject
    let qr_size = code.width();
    let img_width = qr_size;
    let img_height = qr_size;

    let mut rgb_pixels = Vec::with_capacity(img_width * img_height * 3);
    for line in render_qr.lines() {
        for c in line.chars() {
            // qrcode renders block characters, or if we use string we can parse it, let's just use boolean array
            let color = if c == '#' { 0 } else { 255 }; // black or white
            rgb_pixels.push(color);
            rgb_pixels.push(color);
            rgb_pixels.push(color);
        }
    }

    let image_file = ImageXObject {
        width: Px(img_width as usize),
        height: Px(img_height as usize),
        color_space: ColorSpace::Rgb,
        bits_per_component: ColorBits::Bit8,
        interpolate: true,
        image_data: rgb_pixels,
        image_filter: None,
        clipping_bbox: None,
    };
    let pdf_image = Image::from(image_file);

    // Add QR Code at bottom left
    pdf_image.add_to_layer(current_layer.clone(), ImageTransform {
        translate_x: Some(Mm(20.0)),
        translate_y: Some(Mm(40.0)),
        rotate: None,
        scale_x: Some(0.3),
        scale_y: Some(0.3),
        dpi: None,
    });

    current_layer.use_text("Code de réception rapide", 8.0, Mm(20.0), Mm(35.0), &font);

    // Generate cryptographic hash of the JSON content for integrity validation
    let mut hasher = Sha256::new();
    hasher.update(order_json.as_bytes());
    let result_hash = hasher.finalize();
    let hash_str = format!("SHA-256 Auth: {:x}", result_hash);

    current_layer.use_text(hash_str, 6.0, Mm(20.0), Mm(20.0), &font);
    current_layer.use_text("Ce document numérique fait foi. Toute rature l'invalide.", 8.0, Mm(20.0), Mm(15.0), &font);

    // Ensure directory exists
    let month_dir = Local::now().format("%Y-%m").to_string();
    let root_path = PathBuf::from("C:/MedicalApp/Orders").join(&month_dir);
    // Use an OS-agnostic path fallback if C:/ doesn't exist (like on Linux sandbox)
    let actual_dir = if cfg!(windows) {
        root_path
    } else {
        std::env::temp_dir().join("MedicalApp").join("Orders").join(&month_dir)
    };

    fs::create_dir_all(&actual_dir).map_err(|e| format!("Failed to create directory {:?}: {}", actual_dir, e))?;

    let file_name = format!("PO_{}_{}.pdf", order.id, Local::now().format("%Y%m%d%H%M%S"));
    let file_path = actual_dir.join(&file_name);

    let file = File::create(&file_path).map_err(|e| format!("Failed to create PDF file {:?}: {}", file_path, e))?;
    let mut writer = BufWriter::new(file);

    doc.save(&mut writer).map_err(|e| format!("Failed to save PDF: {}", e))?;

    Ok(file_path.to_string_lossy().to_string())
}
