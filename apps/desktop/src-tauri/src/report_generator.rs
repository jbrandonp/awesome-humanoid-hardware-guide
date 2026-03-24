use tauri_plugin_dialog::DialogExt;
use tauri::AppHandle;
use serde::Deserialize;
use printpdf::*;
use std::fs::File;
use std::io::Write;
use image::GenericImageView;

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

    let mut doc = PdfDocument::new("Official Report");

    let font_bold = PdfFontHandle::Builtin(BuiltinFont::HelveticaBold);
    let font_regular = PdfFontHandle::Builtin(BuiltinFont::Helvetica);

    let logo_bytes = include_bytes!("../icons/icon.png");
    let image_data = image::load_from_memory_with_format(logo_bytes, image::ImageFormat::Png);
    let mut image_xobject_id = None;
    if let Ok(dynamic_image) = image_data {
        let (width, height) = dynamic_image.dimensions();
        let mut pixels = Vec::new();

        let rgb_image = dynamic_image.to_rgb8();
        for pixel in rgb_image.pixels() {
            pixels.push(pixel[0]);
            pixels.push(pixel[1]);
            pixels.push(pixel[2]);
        }

        let raw_image = RawImage {
            pixels: RawImageData::U8(pixels),
            width: width as usize,
            height: height as usize,
            data_format: RawImageFormat::RGB8,
            tag: Vec::new(),
        };

        image_xobject_id = Some(doc.add_image(&raw_image));
    }

    let mut pages = Vec::new();
    let mut ops = Vec::new();

    ops.push(Op::SaveGraphicsState);

    // Draw Logo if exists
    if let Some(img_id) = image_xobject_id.clone() {
        ops.push(Op::UseXobject {
            id: img_id,
            transform: XObjectTransform {
                translate_x: Some(Mm(180.0).into()),
                translate_y: Some(Mm(270.0).into()),
                rotate: None,
                scale_x: Some(20.0), // Scale to 20x20
                scale_y: Some(20.0),
                dpi: None,
            }
        });
    }

    // Header Title
    ops.push(Op::StartTextSection);
    ops.push(Op::SetTextMatrix {
        matrix: TextMatrix::Raw([1.0, 0.0, 0.0, 1.0, Mm(20.0).into_pt().0, Mm(275.0).into_pt().0])
    });
    ops.push(Op::SetFont { font: font_bold.clone(), size: Pt(24.0) });
    ops.push(Op::ShowText { items: vec![TextItem::Text(report_data.title.clone())] });
    ops.push(Op::EndTextSection);

    let draw_table_headers = |ops: &mut Vec<Op>, y: Mm| {
        ops.push(Op::StartTextSection);
        ops.push(Op::SetFont { font: font_bold.clone(), size: Pt(12.0) });

        ops.push(Op::SetTextMatrix {
            matrix: TextMatrix::Raw([1.0, 0.0, 0.0, 1.0, Mm(20.0).into_pt().0, y.into_pt().0])
        });
        ops.push(Op::ShowText { items: vec![TextItem::Text("ICD-10 Code".to_string())] });

        ops.push(Op::SetTextMatrix {
            matrix: TextMatrix::Raw([1.0, 0.0, 0.0, 1.0, Mm(60.0).into_pt().0, y.into_pt().0])
        });
        ops.push(Op::ShowText { items: vec![TextItem::Text("Description".to_string())] });

        ops.push(Op::SetTextMatrix {
            matrix: TextMatrix::Raw([1.0, 0.0, 0.0, 1.0, Mm(160.0).into_pt().0, y.into_pt().0])
        });
        ops.push(Op::ShowText { items: vec![TextItem::Text("Cases".to_string())] });
        ops.push(Op::EndTextSection);
    };

    let mut current_y = Mm(250.0);
    draw_table_headers(&mut ops, current_y);

    current_y -= Mm(10.0);

    for item in report_data.data {
        if current_y.0 < 30.0 {
            // New page
            ops.push(Op::RestoreGraphicsState);
            pages.push(PdfPage::new(Mm(210.0), Mm(297.0), std::mem::take(&mut ops)));
            current_y = Mm(270.0);
            ops.push(Op::SaveGraphicsState);
            draw_table_headers(&mut ops, current_y);
            current_y -= Mm(10.0);
        }

        ops.push(Op::StartTextSection);
        ops.push(Op::SetFont { font: font_regular.clone(), size: Pt(10.0) });

        ops.push(Op::SetTextMatrix {
            matrix: TextMatrix::Raw([1.0, 0.0, 0.0, 1.0, Mm(20.0).into_pt().0, current_y.into_pt().0])
        });
        ops.push(Op::ShowText { items: vec![TextItem::Text(item.icd10_code.clone())] });

        let desc = if item.description.chars().count() > 50 {
            let truncated: String = item.description.chars().take(47).collect();
            format!("{}...", truncated)
        } else {
            item.description.clone()
        };
        ops.push(Op::SetTextMatrix {
            matrix: TextMatrix::Raw([1.0, 0.0, 0.0, 1.0, Mm(60.0).into_pt().0, current_y.into_pt().0])
        });
        ops.push(Op::ShowText { items: vec![TextItem::Text(desc)] });

        ops.push(Op::SetTextMatrix {
            matrix: TextMatrix::Raw([1.0, 0.0, 0.0, 1.0, Mm(160.0).into_pt().0, current_y.into_pt().0])
        });
        ops.push(Op::ShowText { items: vec![TextItem::Text(item.cases.to_string())] });

        ops.push(Op::EndTextSection);
        current_y -= Mm(8.0);
    }

    ops.push(Op::RestoreGraphicsState);
    pages.push(PdfPage::new(Mm(210.0), Mm(297.0), ops));

    let total_pages = pages.len();
    for (i, page) in pages.iter_mut().enumerate() {
        let page_text = format!("Page {} of {}", i + 1, total_pages);
        page.ops.push(Op::StartTextSection);
        page.ops.push(Op::SetFont { font: font_regular.clone(), size: Pt(10.0) });
        page.ops.push(Op::SetTextMatrix {
            matrix: TextMatrix::Raw([1.0, 0.0, 0.0, 1.0, Mm(100.0).into_pt().0, Mm(15.0).into_pt().0])
        });
        page.ops.push(Op::ShowText { items: vec![TextItem::Text(page_text)] });
        page.ops.push(Op::EndTextSection);
    }

    doc.pages = pages;

    let std_path = path.into_path().map_err(|_| "Invalid path".to_string())?;
    let mut file = File::create(std_path).map_err(|e| e.to_string())?;

    let options = PdfSaveOptions::default();
    let mut warnings = Vec::new();
    let bytes = doc.save(&options, &mut warnings);

    file.write_all(&bytes).map_err(|e| e.to_string())?;

    Ok(path_str)
}
