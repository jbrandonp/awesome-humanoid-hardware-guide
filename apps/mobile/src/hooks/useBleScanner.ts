import { useState, useEffect } from 'react';
import { BleManager, Device, BleError } from 'react-native-ble-plx';
import { Buffer } from 'buffer'; // Need a standard buffer in React Native

const bleManager = new BleManager();

// Standard GATT profile for Blood Pressure (Tensiomètre)
const BLOOD_PRESSURE_SERVICE_UUID = '1810';
const BLOOD_PRESSURE_MEASUREMENT_CHARACTERISTIC_UUID = '2A35';

export interface BloodPressureMeasurement {
  systolic: number;
  diastolic: number;
  map: number; // Mean Arterial Pressure
  pulse?: number;
  timestamp?: Date;
}

export function useBleScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [measurement, setMeasurement] = useState<BloodPressureMeasurement | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Demander les permissions locales (Android 12+ / iOS) via expo-permissions en prod
    return () => {
      bleManager.destroy(); // Cleanup
    };
  }, []);

  const startScanAndConnect = async () => {
    setIsScanning(true);
    setError(null);

    bleManager.startDeviceScan([BLOOD_PRESSURE_SERVICE_UUID], null, async (error, device) => {
      if (error) {
        setError(error.message);
        setIsScanning(false);
        return;
      }

      if (device && device.name) {
        console.log(`📡 Tensiomètre détecté: ${device.name}`);
        bleManager.stopDeviceScan();
        setIsScanning(false);

        try {
          const connected = await device.connect();
          await connected.discoverAllServicesAndCharacteristics();
          setConnectedDevice(connected);

          // Abonnement au flux de données du tensiomètre
          connected.monitorCharacteristicForService(
            BLOOD_PRESSURE_SERVICE_UUID,
            BLOOD_PRESSURE_MEASUREMENT_CHARACTERISTIC_UUID,
            (err: BleError | null, characteristic: any) => {
              if (err) {
                console.error("BLE Monitor Error:", err);
                return;
              }
              if (characteristic?.value) {
                const parsedData = decodeBloodPressureMeasurement(characteristic.value);
                setMeasurement(parsedData);
              }
            }
          );
        } catch (e) {
          setError("Erreur de connexion Bluetooth");
        }
      }
    });

    // Timeout après 15 secondes
    setTimeout(() => {
      bleManager.stopDeviceScan();
      setIsScanning(false);
    }, 15000);
  };

  /**
   * Extrait la valeur hexadécimale Base64 d'un tensiomètre réel IEEE 11073
   */
  const decodeBloodPressureMeasurement = (base64Value: string): BloodPressureMeasurement => {
    const buffer = Buffer.from(base64Value, 'base64');

    // Simplification de la spécification GATT Blood Pressure Measurement (0x2A35)
    // Le premier octet (Flags) définit l'unité (mmHg ou kPa) et la présence du pouls.
    // Bytes 1-2: Systolic (SFLOAT)
    // Bytes 3-4: Diastolic (SFLOAT)
    // Bytes 5-6: Mean Arterial Pressure (SFLOAT)

    const systolic = buffer.readUInt16LE(1);
    const diastolic = buffer.readUInt16LE(3);
    const map = buffer.readUInt16LE(5);

    // Si on extrapole la lecture SFLOAT (IEEE 11073 16-bit float) de façon triviale pour le mock
    return {
      systolic: systolic, // Valeur brute (A convertir selon mantisse/exposant en prod)
      diastolic: diastolic,
      map: map,
      timestamp: new Date()
    };
  };

  return {
    isScanning,
    connectedDevice,
    measurement,
    error,
    startScanAndConnect
  };
}
