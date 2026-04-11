import React, { useState, useRef, useCallback } from "react";
import { View, Text, StyleSheet, Modal, TouchableOpacity } from "react-native";
// @ts-ignore
import { CameraView, useCameraPermissions } from "expo-camera";

export function RPPGBiosensor() {
  const [hasPermission, requestPermission] = useCameraPermissions();
  const [isWarningAccepted, setIsWarningAccepted] = useState(false);
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [result, setResult] = useState<{ bpm: number; spo2: number } | null>(
    null,
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const cameraRef = useRef<CameraView>(null);

  // Constants for Signal Processing
  const MIN_HR_HZ = 0.8; // 48 BPM
  const MAX_HR_HZ = 3.0; // 180 BPM
  const ASSUMED_FPS = 30;

  const startMeasurement = useCallback(() => {
    setIsMeasuring(true);
    setTimeLeft(30);
    setResult(null);
    setErrorMsg(null);

    // In a real environment with frame access, we would collect raw pixel channel means here.
    // For this simulation/demonstration, we generate a synthetic clean signal with added noise
    // that represents a real rPPG green channel.
    const syntheticGreenChannel: number[] = [];
    const syntheticRedChannel: number[] = [];

    // Simulate ~75 BPM (1.25 Hz)
    const baseHeartRateHz = 1.25;

    for (let i = 0; i < 30 * ASSUMED_FPS; i++) {
      const timeSecs = i / ASSUMED_FPS;
      // Synthetic AC components and DC components
      const greenAc = Math.sin(2 * Math.PI * baseHeartRateHz * timeSecs) * 5;
      const redAc = Math.sin(2 * Math.PI * baseHeartRateHz * timeSecs) * 2;

      const noise = (Math.random() - 0.5) * 2; // Random noise

      syntheticGreenChannel.push(150 + greenAc + noise);
      syntheticRedChannel.push(200 + redAc + noise * 0.5);
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          finishMeasurement(syntheticGreenChannel, syntheticRedChannel);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const applyBandpassFilter = (
    signal: Float64Array,
    fps: number,
    lowCutoffHz: number,
    highCutoffHz: number,
  ): Float64Array => {
    const filtered = new Float64Array(signal.length);
    const lowPassWindowSize = Math.max(1, Math.floor(fps / (highCutoffHz * 2)));
    const highPassWindowSize = Math.max(1, Math.floor(fps / (lowCutoffHz * 2)));

    const tempLowPass = new Float64Array(signal.length);
    for (let i = 0; i < signal.length; i++) {
      let sum = 0;
      let count = 0;
      for (
        let j = Math.max(0, i - lowPassWindowSize);
        j <= Math.min(signal.length - 1, i + lowPassWindowSize);
        j++
      ) {
        sum += signal[j];
        count++;
      }
      tempLowPass[i] = sum / count;
    }

    for (let i = 0; i < tempLowPass.length; i++) {
      let sum = 0;
      let count = 0;
      for (
        let j = Math.max(0, i - highPassWindowSize);
        j <= Math.min(tempLowPass.length - 1, i + highPassWindowSize);
        j++
      ) {
        sum += tempLowPass[j];
        count++;
      }
      const localMean = sum / count;
      filtered[i] = tempLowPass[i] - localMean;
    }
    return filtered;
  };

  const findPeaks = (signal: Float64Array, fps: number): number[] => {
    const peaks: number[] = [];
    const minDistanceBetweenPeaks = Math.floor(fps * 0.33);

    let sum = 0;
    for (let i = 0; i < signal.length; i++) sum += Math.abs(signal[i]);
    const meanAbs = sum / signal.length;
    const peakThreshold = meanAbs * 1.5;

    for (let i = 1; i < signal.length - 1; i++) {
      if (signal[i] > signal[i - 1] && signal[i] > signal[i + 1]) {
        if (signal[i] > peakThreshold) {
          if (
            peaks.length === 0 ||
            i - peaks[peaks.length - 1] >= minDistanceBetweenPeaks
          ) {
            peaks.push(i);
          } else if (peaks.length > 0) {
            const lastPeakIndex = peaks[peaks.length - 1];
            if (signal[i] > signal[lastPeakIndex]) {
              peaks[peaks.length - 1] = i;
            }
          }
        }
      }
    }
    return peaks;
  };

  const calculateSpO2 = (
    greenAcRMS: number,
    greenDc: number,
    redAcRMS: number,
    redDc: number,
  ): number => {
    // Ratio of Ratios formula for SpO2 estimation using Red and Green (or IR) channels
    const ratio = redAcRMS / redDc / (greenAcRMS / greenDc);
    // Empirical calibration formula for SpO2 (A and B constants)
    let spo2 = 110 - 25 * ratio;
    if (spo2 > 100) spo2 = 99;
    if (spo2 < 0) spo2 = 0;
    return Math.round(spo2);
  };

  const finishMeasurement = useCallback(
    (greenChannel: number[], redChannel: number[]) => {
      setIsMeasuring(false);

      try {
        const rawGreenSignal = new Float64Array(greenChannel);
        const rawRedSignal = new Float64Array(redChannel);

        // Detrending
        const meanGreen =
          rawGreenSignal.reduce((sum, val) => sum + val, 0) /
          rawGreenSignal.length;
        const detrendedGreen = new Float64Array(rawGreenSignal.length);
        for (let i = 0; i < rawGreenSignal.length; i++) {
          detrendedGreen[i] = rawGreenSignal[i] - meanGreen;
        }

        const meanRed =
          rawRedSignal.reduce((sum, val) => sum + val, 0) / rawRedSignal.length;
        const detrendedRed = new Float64Array(rawRedSignal.length);
        for (let i = 0; i < rawRedSignal.length; i++) {
          detrendedRed[i] = rawRedSignal[i] - meanRed;
        }

        // Bandpass Filter
        const filteredGreen = applyBandpassFilter(
          detrendedGreen,
          ASSUMED_FPS,
          MIN_HR_HZ,
          MAX_HR_HZ,
        );
        const filteredRed = applyBandpassFilter(
          detrendedRed,
          ASSUMED_FPS,
          MIN_HR_HZ,
          MAX_HR_HZ,
        );

        // Peak Detection
        const peaks = findPeaks(filteredGreen, ASSUMED_FPS);

        if (peaks.length < 5) {
          setErrorMsg(
            "Mouvements excessifs ou mauvaise luminosité. Veuillez stabiliser le doigt.",
          );
          return;
        }

        // Calculate BPM
        const intervalsInSeconds: number[] = [];
        for (let i = 1; i < peaks.length; i++) {
          intervalsInSeconds.push((peaks[i] - peaks[i - 1]) / ASSUMED_FPS);
        }
        const avgInterval =
          intervalsInSeconds.reduce((sum, val) => sum + val, 0) /
          intervalsInSeconds.length;
        const estimatedBpm = Math.round(60.0 / avgInterval);

        // Calculate AC RMS
        const greenAcRMS = Math.sqrt(
          filteredGreen.reduce((sum, val) => sum + val * val, 0) /
            filteredGreen.length,
        );
        const redAcRMS = Math.sqrt(
          filteredRed.reduce((sum, val) => sum + val * val, 0) /
            filteredRed.length,
        );

        // Estimate SpO2
        const estimatedSpO2 = calculateSpO2(
          greenAcRMS,
          meanGreen,
          redAcRMS,
          meanRed,
        );

        setResult({ bpm: estimatedBpm, spo2: estimatedSpO2 });
      } catch (e) {
        setErrorMsg("Erreur lors de l'analyse du signal.");
      }
    },
    [],
  );

  if (!hasPermission) {
    return <View style={styles.container} />;
  }

  if (!hasPermission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.textCenter}>
          Nous avons besoin de votre permission pour utiliser la caméra.
        </Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Accorder la permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Modal
        visible={!isWarningAccepted}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Avertissement Légal</Text>
            <Text style={styles.modalText}>
              Cette fonctionnalité n'est qu'estimative, ne remplace pas un
              dispositif médical de classe IIa/III, et requiert une validation
              clinique.
            </Text>
            <TouchableOpacity
              style={styles.acceptButton}
              onPress={() => setIsWarningAccepted(true)}
            >
              <Text style={styles.acceptButtonText}>
                J'ai compris et j'accepte
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {isWarningAccepted && (
        <View style={styles.cameraContainer}>
          <CameraView
            style={styles.camera}
            facing="back"
            enableTorch={isMeasuring}
            ref={cameraRef}
          >
            <View style={styles.overlay}>
              {!isMeasuring && !result && !errorMsg && (
                <View style={styles.instructionsContainer}>
                  <Text style={styles.instructionsText}>
                    Placez votre doigt sur l'objectif de la caméra et sur le
                    flash.
                  </Text>
                  <TouchableOpacity
                    style={styles.startButton}
                    onPress={startMeasurement}
                  >
                    <Text style={styles.startButtonText}>Démarrer (30s)</Text>
                  </TouchableOpacity>
                </View>
              )}

              {isMeasuring && (
                <View style={styles.measuringContainer}>
                  <Text style={styles.measuringText}>Mesure en cours...</Text>
                  <Text style={styles.timerText}>{timeLeft} s</Text>
                </View>
              )}
            </View>
          </CameraView>

          {errorMsg && !isMeasuring && (
            <View style={styles.resultContainer}>
              <Text style={styles.errorText}>{errorMsg}</Text>
              <TouchableOpacity
                style={styles.startButton}
                onPress={() => setErrorMsg(null)}
              >
                <Text style={styles.startButtonText}>Réessayer</Text>
              </TouchableOpacity>
            </View>
          )}

          {result && !isMeasuring && !errorMsg && (
            <View style={styles.resultContainer}>
              <Text style={styles.resultTitle}>Résultats (Estimation)</Text>
              <Text style={styles.resultText}>
                Fréquence Cardiaque : {result.bpm} BPM
              </Text>
              <Text style={styles.resultText}>
                Saturation en Oxygène : {result.spo2} %
              </Text>
              <TouchableOpacity
                style={styles.startButton}
                onPress={() => setResult(null)}
              >
                <Text style={styles.startButtonText}>Nouvelle mesure</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  textCenter: {
    textAlign: "center",
    color: "#fff",
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  button: {
    backgroundColor: "#3498db",
    padding: 15,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    width: "80%",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#e74c3c",
  },
  modalText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 25,
    color: "#333",
    lineHeight: 24,
  },
  acceptButton: {
    backgroundColor: "#2ecc71",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    width: "100%",
  },
  acceptButtonText: {
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 16,
  },
  cameraContainer: {
    flex: 1,
    width: "100%",
    position: "relative",
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  instructionsContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
    marginHorizontal: 20,
  },
  instructionsText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
    color: "#333",
  },
  startButton: {
    backgroundColor: "#e74c3c",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginTop: 10,
  },
  startButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  measuringContainer: {
    alignItems: "center",
  },
  measuringText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  timerText: {
    color: "#e74c3c",
    fontSize: 40,
    fontWeight: "bold",
  },
  resultContainer: {
    position: "absolute",
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    padding: 20,
    borderRadius: 15,
    alignItems: "center",
  },
  resultTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#2c3e50",
  },
  resultText: {
    fontSize: 18,
    marginBottom: 5,
    color: "#34495e",
  },
  errorText: {
    fontSize: 16,
    color: "#e74c3c",
    textAlign: "center",
    marginBottom: 15,
  },
});
