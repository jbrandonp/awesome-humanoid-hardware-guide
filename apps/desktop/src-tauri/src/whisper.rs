use std::fs;
use std::path::PathBuf;
use std::process::Stdio;
use std::time::Duration;
use sysinfo::{Pid, System};
use tauri::{AppHandle, Emitter};
use tokio::process::Command;
use tokio::time::sleep;

// HIPAA: Guaranteed cleanup guard for temporary audio files
pub struct AudioCleanupGuard {
    pub path: PathBuf,
}

impl Drop for AudioCleanupGuard {
    fn drop(&mut self) {
        if self.path.exists() {
            // Attempt to securely delete the file
            if let Err(e) = fs::remove_file(&self.path) {
                eprintln!("Failed to securely delete temporary audio file {:?}: {}", self.path, e);
            }
        }
    }
}

#[derive(Clone, serde::Serialize)]
struct ProgressPayload {
    message: String,
}

#[tauri::command]
pub async fn transcribe_audio(app: AppHandle, audio_path: String) -> Result<String, String> {
    let path = PathBuf::from(audio_path);
    if !path.exists() {
        return Err("Audio file not found".to_string());
    }

    // Initialize the cleanup guard
    let _cleanup_guard = AudioCleanupGuard { path: path.clone() };

    app.emit("whisper-progress", ProgressPayload {
        message: "Chargement du modèle".to_string(),
    }).map_err(|e| e.to_string())?;

    let mut child = Command::new("whisper.cpp")
        .arg("--model")
        .arg("ggml-medium.en-q8_0.bin")
        .arg("--file")
        .arg(path.to_str().unwrap())
        .arg("--threads")
        .arg("2") // CPU restriction
        .arg("--no-timestamps") // simplification
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .kill_on_drop(true) // Ensure process terminates to release file locks on timeout
        .spawn()
        .map_err(|e| format!("Failed to spawn whisper.cpp: {}", e))?;

    let child_id = child.id().ok_or_else(|| "Failed to get child process ID".to_string())?;

    app.emit("whisper-progress", ProgressPayload {
        message: "Analyse audio en cours".to_string(),
    }).map_err(|e| e.to_string())?;

    // Circuit Breaker constraints
    let timeout_duration = Duration::from_secs(10);
    let max_ram_bytes: u64 = 2 * 1024 * 1024 * 1024; // 2 GB

    // Wait for process with timeout and monitoring
    let mut sys = System::new_all();

    let monitor_future = async {
        loop {
            if let Some(status) = child.try_wait().map_err(|e| format!("Failed to try_wait: {}", e))? {
                if status.success() {
                    return Ok("Transcription completed".to_string());
                } else {
                    return Err("Whisper failed".to_string());
                }
            }
            
            sys.refresh_all();
            if let Some(process) = sys.processes().get(&Pid::from_u32(child_id)) {
                let mem = process.memory(); // memory in bytes
                if mem > max_ram_bytes {
                    let _ = child.kill().await;
                    return Err("Circuit Breaker: RAM limit exceeded (2GB)".to_string());
                }
            } else {
                // If the process is not found in sysinfo, maybe it exited just now. Wait for try_wait in next iteration.
            }
            
            sleep(Duration::from_millis(500)).await;
        }
    };

    let result = tokio::select! {
        res = monitor_future => res,
        _ = tokio::time::sleep(timeout_duration) => {
            Err("Circuit Breaker: 10s timeout reached".to_string())
        }
    };

    app.emit("whisper-progress", ProgressPayload {
        message: "Transcription terminée".to_string(),
    }).map_err(|e| e.to_string())?;

    result
}
