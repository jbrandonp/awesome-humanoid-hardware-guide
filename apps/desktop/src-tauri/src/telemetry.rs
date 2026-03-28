use std::io::Write;
use std::path::{Path, PathBuf};
use regex::Regex;
use tracing_appender::rolling::RollingFileAppender;
use tracing_subscriber::{EnvFilter, prelude::*};
use tracing_appender::non_blocking::WorkerGuard;
use tauri::{AppHandle, Manager};

pub struct PhiMaskingWriter {
    inner: RollingFileAppender,
    uuid_regex: Regex,
    name_regex: Regex,
}

impl PhiMaskingWriter {
    pub fn new(inner: RollingFileAppender) -> Self {
        Self {
            inner,
            uuid_regex: Regex::new(r"[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}").unwrap(),
            name_regex: Regex::new(r#"(?i)("patient_name"|"nom"|"prenom"|"patient")\s*:\s*"[^"]+""#).unwrap(),
        }
    }
}

impl Write for PhiMaskingWriter {
    fn write(&mut self, buf: &[u8]) -> std::io::Result<usize> {
        let s = String::from_utf8_lossy(buf);
        let masked_uuid = self.uuid_regex.replace_all(&s, "***PHI_UUID***");
        let final_str = self.name_regex.replace_all(&masked_uuid, r#"$1:"***MASKED_PHI***""#);
        self.inner.write_all(final_str.as_bytes())?;
        Ok(buf.len())
    }

    fn flush(&mut self) -> std::io::Result<()> {
        self.inner.flush()
    }
}

pub fn rotate_logs_to_max_size(log_dir: &Path, max_bytes: u64) {
    if let Ok(entries) = std::fs::read_dir(log_dir) {
        let mut files: Vec<(PathBuf, std::time::SystemTime, u64)> = entries
            .filter_map(|e| e.ok())
            .filter(|e| {
                let path = e.path();
                path.is_file() && path.file_name().map_or(false, |name| name.to_string_lossy().starts_with("app.log"))
            })
            .filter_map(|e| {
                let metadata = e.metadata().ok()?;
                Some((e.path(), metadata.modified().unwrap_or(std::time::SystemTime::UNIX_EPOCH), metadata.len()))
            })
            .collect();

        // Sort by newest first
        files.sort_by(|a, b| b.1.cmp(&a.1));

        let mut current_size = 0;
        for (path, _, size) in files {
            current_size += size;
            if current_size > max_bytes {
                let _ = std::fs::remove_file(path);
            }
        }
    }
}

pub fn init_telemetry(app_handle: &AppHandle) -> Result<WorkerGuard, String> {
    let log_dir = app_handle.path().app_log_dir().map_err(|e| e.to_string())?;
    std::fs::create_dir_all(&log_dir).map_err(|e| e.to_string())?;

    rotate_logs_to_max_size(&log_dir, 50 * 1024 * 1024);

    let appender = tracing_appender::rolling::daily(&log_dir, "app.log");
    let masking_writer = PhiMaskingWriter::new(appender);
    let (non_blocking, guard) = tracing_appender::non_blocking(masking_writer);

    let format = tracing_subscriber::fmt::format().json();
    tracing_subscriber::registry()
        .with(EnvFilter::from_default_env().add_directive(tracing::Level::INFO.into()))
        .with(tracing_subscriber::fmt::layer().event_format(format).with_writer(non_blocking))
        .try_init()
        .map_err(|e| e.to_string())?;

    let log_dir_clone = log_dir.clone();
    tokio::spawn(async move {
        let mut interval = tokio::time::interval(std::time::Duration::from_secs(3600));
        loop {
            interval.tick().await;
            rotate_logs_to_max_size(&log_dir_clone, 50 * 1024 * 1024);
        }
    });

    Ok(guard)
}
