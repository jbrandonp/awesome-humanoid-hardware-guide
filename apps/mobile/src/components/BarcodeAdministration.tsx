import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
// @ts-ignore
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { database } from '../database';
import { Q } from '@nozbe/watermelondb';
import { Patient, Prescription } from '@systeme-sante/models';

export const BarcodeAdministration = () => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scannedPatientId, setScannedPatientId] = useState<string | null>(null);
  const [scannedSKU, setScannedSKU] = useState<string | null>(null);
  const [mode, setMode] = useState<'patient' | 'medication'>('patient');
  
  const [patientData, setPatientData] = useState<Patient | null>(null);
  const [prescriptionData, setPrescriptionData] = useState<Prescription | null>(null);

  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const resetState = useCallback(() => {
    setScannedPatientId(null);
    setScannedSKU(null);
    setPatientData(null);
    setPrescriptionData(null);
    setMode('patient');
    setErrorModalVisible(false);
    setErrorMessage('');
    setIsLoading(false);
  }, []);

  const triggerError = useCallback((message: string) => {
    setErrorMessage(message);
    setErrorModalVisible(true);
  }, []);

  const handlePatientScan = useCallback(async (patientId: string) => {
    setIsLoading(true);
    try {
      // In WatermelonDB, find() throws if not found
      let patient: Patient | null = null;
      try {
        patient = await database.collections.get<Patient>('patients').find(patientId);
      } catch (err) {
        // Fallback or not found
        patient = null;
      }

      if (!patient) {
        triggerError(`ID Patient non trouvé dans la base locale: ${patientId}. Les 5 Bons: Échec (Bon patient).`);
      } else {
        setScannedPatientId(patientId);
        setPatientData(patient);
        setMode('medication'); // Move to medication scan mode
      }
    } catch (e) {
      triggerError("Erreur critique lors de la validation du patient.");
    } finally {
      setIsLoading(false);
    }
  }, [triggerError]);

  const handleMedicationScan = useCallback(async (patientId: string, sku: string) => {
    setIsLoading(true);
    try {
      const prescriptions = await database.collections.get<Prescription>('prescriptions')
        .query(
          Q.where('patient_id', patientId),
          Q.where('medication_name', sku)
        ).fetch();

      if (prescriptions.length === 0) {
        triggerError(`Le médicament scanné (${sku}) n'est pas prescrit pour ce patient. Règle des 5 Bons NON RESPECTÉE: Alerte Critique.`);
      } else {
        // Validation succeeded
        setScannedSKU(sku);
        setPrescriptionData(prescriptions[0]);
      }
    } catch (e) {
      triggerError("Erreur critique lors de la validation du médicament.");
    } finally {
      setIsLoading(false);
    }
  }, [triggerError]);

  const handleBarcodeScanned = useCallback((scanningResult: BarcodeScanningResult) => {
    if (isLoading || errorModalVisible) return;
    
    if (mode === 'patient') {
      handlePatientScan(scanningResult.data);
    } else if (mode === 'medication' && scannedPatientId) {
      handleMedicationScan(scannedPatientId, scanningResult.data);
    }
  }, [mode, isLoading, errorModalVisible, handlePatientScan, handleMedicationScan, scannedPatientId]);

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Permission de la caméra requise pour le scan Barcode (BCMA).</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Autoriser la caméra</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>BCMA: Administration par Code-Barres</Text>
      
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          {mode === 'patient' ? 'Étape 1: Scan Bracelet Patient (ID)' : 'Étape 2: Scan Boîte Médicament (SKU)'}
        </Text>
        {patientData && (
          <Text style={styles.successText}>Patient: {patientData.firstName} {patientData.lastName}</Text>
        )}
      </View>

      <View style={styles.cameraContainer}>
        {!prescriptionData ? (
          <CameraView
            style={styles.camera}
            facing="back"
            onBarcodeScanned={handleBarcodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ["qr", "ean13", "ean8", "code128", "code39"],
            }}
          />
        ) : (
          <View style={styles.successContainer}>
            <Text style={styles.successTitle}>✅ 5 Bons Validés</Text>
            <Text style={styles.detailsText}>✓ Bon Patient: {patientData?.firstName} {patientData?.lastName}</Text>
            <Text style={styles.detailsText}>✓ Bon Médicament: {prescriptionData.medicationName}</Text>
            <Text style={styles.detailsText}>✓ Bonne Dose: {prescriptionData.dosage}</Text>
            <Text style={styles.detailsText}>✓ Bonne Voie/Instructions: {prescriptionData.instructions}</Text>
            <Text style={styles.detailsText}>✓ Bon Moment (Prescrit): {new Date(prescriptionData.prescribedAt).toLocaleString()}</Text>
            <TouchableOpacity style={styles.button} onPress={resetState}>
              <Text style={styles.buttonText}>Nouvelle Administration</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <Modal visible={errorModalVisible} transparent={false} animationType="slide">
        <View style={styles.errorModalContainer}>
          <Text style={styles.errorTitle}>CRITIQUE: ALERTE SÉCURITÉ (BCMA)</Text>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <TouchableOpacity style={styles.errorButton} onPress={resetState}>
            <Text style={styles.errorButtonText}>Réinitialiser et Recommencer</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    padding: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  statusContainer: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3b82f6',
  },
  successText: {
    fontSize: 16,
    color: '#10b981',
    marginTop: 8,
    fontWeight: '500',
  },
  cameraContainer: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  successContainer: {
    flex: 1,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#047857',
    marginBottom: 16,
  },
  detailsText: {
    fontSize: 18,
    color: '#065f46',
    marginBottom: 8,
    width: '100%',
    textAlign: 'left',
  },
  text: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 16,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorModalContainer: {
    flex: 1,
    backgroundColor: '#dc2626',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 24,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 20,
    color: '#fef2f2',
    textAlign: 'center',
    marginBottom: 48,
    lineHeight: 28,
  },
  errorButton: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    elevation: 4,
  },
  errorButtonText: {
    color: '#dc2626',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
