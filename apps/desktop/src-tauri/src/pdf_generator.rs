use chrono::Local;
use local_ip_address::local_ip;
use printpdf::*;
use std::fs::File;
use std::io::BufWriter;
use std::path::PathBuf;

#[tauri::command]
pub fn generate_epidemiology_report_pdf(user_id: String, destination_path: String) -> Result<String, String> {
    let (doc, page1, layer1) = PdfDocument::new("Rapport Épidémiologique", Mm(210.0), Mm(297.0), "Layer 1");
    let current_layer = doc.get_page(page1).get_layer(layer1);

    let now = Local::now();
    let date_time_str = now.format("%Y-%m-%d %H:%M:%S").to_string();

    let ip_addr_str = match local_ip() {
        Ok(ip) => ip.to_string(),
        Err(_) => "IP Unknown".to_string(),
    };

    let watermark_text = format!(
        "USER_ID: {} | DATE: {} | IP: {}",
        user_id, date_time_str, ip_addr_str
    );

    let font = doc.add_builtin_font(BuiltinFont::Helvetica).map_err(|e: printpdf::Error| e.to_string())?;

    current_layer.use_text("Rapport Epidemiologique Mensuel", 24.0, Mm(20.0), Mm(270.0), &font);
    current_layer.use_text("Donnees anonymisees...", 12.0, Mm(20.0), Mm(250.0), &font);

    let watermark_font = doc.add_builtin_font(BuiltinFont::HelveticaBold).map_err(|e: printpdf::Error| e.to_string())?;
    current_layer.save_graphics_state();
    current_layer.set_fill_color(Color::Rgb(Rgb::new(0.85, 0.85, 0.85, None)));

    current_layer.begin_text_section();
    current_layer.set_font(&watermark_font, 20.0);

    let mut x = -50.0;
    let mut y = 20.0;

    // Write multiple parallel lines of watermark
    // shifted slightly to simulate a diagonal pattern over the page.
    for _ in 0..15 {
        current_layer.set_text_cursor(Mm(x), Mm(y));
        current_layer.write_text(&watermark_text, &watermark_font);
        x += 15.0;
        y += 20.0;
    }

    current_layer.end_text_section();

    current_layer.restore_graphics_state();

    let path = PathBuf::from(&destination_path);
    let file = File::create(&path).map_err(|e| e.to_string())?;
    let mut writer = BufWriter::new(file);

    doc.save(&mut writer).map_err(|e: printpdf::Error| e.to_string())?;

    Ok(destination_path)
}
