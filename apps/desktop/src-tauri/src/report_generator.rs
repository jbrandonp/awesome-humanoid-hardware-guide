use tauri_plugin_dialog::DialogExt;
use tauri::AppHandle;
use serde::Deserialize;
use printpdf::*;
use std::fs::File;
use ::image::GenericImageView;

#[derive(Deserialize, Debug)]
pub struct EpidemiologicalData {
    pub icd10_code: String,
    pub description: String,
    pub cases: u32,
}

#[derive(Deserialize, Debug)]
pub struct ReportData {
    pub title: String,
    pub data: Vec<EpidemiologicalData>,
}

#[tauri::command]
pub fn generate_official_pdf_report(app: AppHandle, report_data: ReportData) -> Result<String, String> {
    let file_path = app.dialog().file().add_filter("PDF", &["pdf"]).blocking_save_file();
    
    let path = match file_path {
        Some(p) => p,
        None => return Err("User cancelled the save dialog".to_string()),
    };
    let path_str = path.to_string();

    let (doc, page1, layer1) = PdfDocument::new("Official Report", Mm(210.0), Mm(297.0), "Layer 1");
    let mut current_page = page1;
    let mut current_layer = doc.get_page(current_page).get_layer(layer1);
    
    let font_bold = doc.add_builtin_font(BuiltinFont::HelveticaBold).map_err(|e| e.to_string())?;
    let font_regular = doc.add_builtin_font(BuiltinFont::Helvetica).map_err(|e| e.to_string())?;

    let logo_bytes = include_bytes!("../icons/icon.png");
    if let Ok(dynamic_image) = ::image::load_from_memory_with_format(logo_bytes, ::image::ImageFormat::Png) {
        let (width, height) = dynamic_image.dimensions();
        let mut pixels = Vec::new();
        
        let rgb_image = dynamic_image.to_rgb8();
        for pixel in rgb_image.pixels() {
            pixels.push(pixel[0]);
            pixels.push(pixel[1]);
            pixels.push(pixel[2]);
        }

        let raw_image = printpdf::image_crate::ImageBuffer::from_raw(width, height, pixels).unwrap();
        let dyn_img = printpdf::image_crate::DynamicImage::ImageRgb8(raw_image);
        let image = Image::from_dynamic_image(&dyn_img);

        image.add_to_layer(current_layer.clone(), ImageTransform {
            translate_x: Some(Mm(180.0)),
            translate_y: Some(Mm(270.0)),
            rotate: None,
            scale_x: Some(0.1),
            scale_y: Some(0.1),
            dpi: Some(300.0),
        });
    }

    // Header Title
    current_layer.use_text(report_data.title.clone(), 24.0, Mm(20.0), Mm(275.0), &font_bold);

    let mut current_y = 250.0f32;

    let draw_table_headers = |layer: &PdfLayerReference, y: f32| {
        layer.use_text("ICD-10 Code", 12.0, Mm(20.0), Mm(y), &font_bold);
        layer.use_text("Description", 12.0, Mm(60.0), Mm(y), &font_bold);
        layer.use_text("Cases", 12.0, Mm(160.0), Mm(y), &font_bold);
    };

    draw_table_headers(&current_layer, current_y);

    current_y -= 10.0;

    for item in report_data.data {
        if current_y < 30.0 {
            let (new_page, new_layer) = doc.add_page(Mm(210.0), Mm(297.0), "Layer 1");
            current_page = new_page;
            current_layer = doc.get_page(current_page).get_layer(new_layer);

            current_y = 270.0;
            draw_table_headers(&current_layer, current_y);
            current_y -= 10.0;
        }
        
        current_layer.use_text(item.icd10_code.clone(), 10.0, Mm(20.0), Mm(current_y), &font_regular);

        let desc = if item.description.chars().count() > 50 {
            let truncated: String = item.description.chars().take(47).collect();
            format!("{}...", truncated)
        } else {
            item.description.clone()
        };
        current_layer.use_text(desc, 10.0, Mm(60.0), Mm(current_y), &font_regular);
        current_layer.use_text(item.cases.to_string(), 10.0, Mm(160.0), Mm(current_y), &font_regular);
        
        current_y -= 8.0;
    }

    let std_path = path.into_path().map_err(|_| "Invalid path".to_string())?;
    let mut file = File::create(std_path).map_err(|e| e.to_string())?;
    
    let mut buf = std::io::BufWriter::new(&mut file);
    doc.save(&mut buf).map_err(|e| e.to_string())?;

    Ok(path_str)
}
