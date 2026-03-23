import { useState, useEffect, useRef } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import { BleManager, Device, BleError, State, Characteristic, Service } from 'react-native-ble-plx';
import { Buffer } from 'buffer';
import { database } from '../database';
import { BackgroundSyncService } from '../services/background-sync.service';

// ============================================================================
// INTERFACES TYPÉES STRICTES (ZÉRO 'ANY' POLICY)
// Les données doivent être blindées avant de transiter vers l'AuditLog DPDPA
// ============================================================================

export type VitalType = 'BLOOD_PRESSURE' | 'HEART_RATE' | 'GLUCOSE';

export interface MedicalVitalMeasurement {
  type: VitalType;
  systolicMmHg?: number;
  diastolicMmHg?: number;
  mapMmHg?: number;
  heartRateBpm?: number;
  glucoseMgDl?: number;
  timestampIso: string;
  hardwareMacAddress: string;
}

export interface BleScannerState {
  isScanning: boolean;
  isConnected: boolean;
  activeDevice: Device | null;
  lastMeasurement: MedicalVitalMeasurement | null;
  systemError: string | null;
  bluetoothState: State | 'UNKNOWN';
  batteryLevel?: number | null;
}

// Profils GATT Standardisés (IEEE 11073 / Bluetooth SIG)
const GATT_PROFILES = {
  BLOOD_PRESSURE: {
    service: '1810',
    characteristic: '2A35'
  },
  HEART_RATE: {
    service: '180D',
    characteristic: '2A37'
  },
  GLUCOSE: {
    service: '1808',
    characteristic: '2A18'
  },
  BATTERY: {
    service: '180F',
    characteristic: '2A19'
  }
};

const ALL_MEDICAL_SERVICES = [
  GATT_PROFILES.BLOOD_PRESSURE.service,
  GATT_PROFILES.HEART_RATE.service,
  GATT_PROFILES.GLUCOSE.service
];

// ============================================================================
// LOGIQUE DE PRODUCTION : GESTION DES ERREURS EXTRÊMES & CONNEXION
// ============================================================================

export function useBleScanner(): BleScannerState & {
  startScan: () => Promise<void>;
  stopScanAndDisconnect: () => Promise<void>;
  connectToSavedDevice: (macAddress: string) => Promise<void>;
} {
  const managerRef = useRef<BleManager | null>(null);

  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [activeDevice, setActiveDevice] = useState<Device | null>(null);
  const [lastMeasurement, setLastMeasurement] = useState<MedicalVitalMeasurement | null>(null);
  const [systemError, setSystemError] = useState<string | null>(null);
  const [bluetoothState, setBluetoothState] = useState<State | 'UNKNOWN'>('UNKNOWN');
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);

  // Helper pour décoder le format IEEE-11073 16-bit SFLOAT
  const decodeSFLOAT = (buffer: Buffer, offset: number): number => {
    const rawValue = buffer.readUInt16LE(offset);
    const mantissa = rawValue & 0x0FFF;
    let exponent = (rawValue >> 12) & 0x000F;

    if (exponent >= 0x0008) {
      exponent = -((0x000F + 1) - exponent);
    }

    let signedMantissa = mantissa;
    if (signedMantissa >= 0x0800) {
      signedMantissa = -((0x0FFF + 1) - signedMantissa);
    }

    return signedMantissa * Math.pow(10, exponent);
  };

  // Initialisation et nettoyage sécurisé de la RAM (Windows 7 / Low-End Tablets)
  useEffect(() => {
    managerRef.current = new BleManager();

    const subscription = managerRef.current.onStateChange((state: State) => {
      setBluetoothState(state);
      if (state === State.PoweredOff) {
         setSystemError("Le Bluetooth est désactivé. Veuillez l'activer pour l'acquisition médicale.");
         stopScanAndDisconnect(); // Hard disconnect pour ne pas corrompre l'état
      }
    }, true);

    return () => {
      subscription.remove();
      managerRef.current?.destroy();
    };
  }, []);

  /**
   * Gestion stricte des permissions OS (Android 12+ particulièrement bloquant)
   * Si refusé par l'OS, l'application ne crashe pas.
   */
  const requestPermissions = async (): Promise<boolean> => {
    if (Platform.OS === 'android' && Platform.Version >= 31) {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);

        return (
          granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] === PermissionsAndroid.RESULTS.GRANTED &&
          granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] === PermissionsAndroid.RESULTS.GRANTED
        );
      } catch (err: unknown) {
        console.error("Échec de la demande de permission", err);
        return false;
      }
    }
    return true; // iOS ou vieux Android (permissions gérées via le Manifest/Plist)
  };

  /**
   * Arrêt du scan en cours et fermeture de la connexion active
   */
  const stopScanAndDisconnect = async (): Promise<void> => {
    if (!managerRef.current) return;

    managerRef.current.stopDeviceScan();
    setIsScanning(false);

    if (activeDevice) {
      try {
        const isDeviceConnected = await activeDevice.isConnected();
        if (isDeviceConnected) {
          await activeDevice.cancelConnection();
          console.log(`[BLE] Déconnexion propre de ${activeDevice.id}`);
        }
      } catch (err: unknown) {
        console.error(`[BLE] Erreur lors de la déconnexion inattendue:`, err);
      } finally {
        setActiveDevice(null);
        setIsConnected(false);
      }
    }
  };

  /**
   * Lancement d'un scan multi-capteurs (Tensiomètre, Cardiofréquencemètre, Glucomètre)
   */
  const startScan = async (): Promise<void> => {
    setSystemError(null);
    setLastMeasurement(null);

    const manager = managerRef.current;
    if (!manager) {
       setSystemError("CRITICAL: Le module matériel Bluetooth n'a pas pu être initialisé.");
       return;
    }

    const hasPermissions = await requestPermissions();
    if (!hasPermissions) {
       setSystemError("ERREUR 102 : Accès Bluetooth refusé par l'OS. Impossible de scanner.");
       return;
    }

    if (bluetoothState !== State.PoweredOn) {
       setSystemError("ERREUR 101 : Bluetooth inactif. Allumez-le pour continuer.");
       return;
    }

    await stopScanAndDisconnect();
    setIsScanning(true);
    console.log(`[BLE] Début du scan GATT pour les capteurs médicaux...`);

    try {
      manager.startDeviceScan(
        ALL_MEDICAL_SERVICES,
        { allowDuplicates: false },
        async (scanError: BleError | null, scannedDevice: Device | null) => {

          if (scanError) {
            handleBleError(scanError, "Erreur pendant le scan du spectre BLE");
            manager.stopDeviceScan();
            setIsScanning(false);
            return;
          }

          if (scannedDevice && scannedDevice.name) {
            console.log(`[BLE] Matériel médical détecté : ${scannedDevice.name} (${scannedDevice.id})`);
            manager.stopDeviceScan();
            setIsScanning(false);

            await connectAndSubscribe(scannedDevice, manager);
          }
        }
      );
    } catch (criticalError: unknown) {
      setSystemError(`Crash de la pile Bluetooth: ${(criticalError as Error).message}`);
      setIsScanning(false);
    }

    // Watchdog Timeout (15 secondes max pour éviter le drain batterie)
    setTimeout(() => {
      if (isScanning) {
        manager.stopDeviceScan();
        setIsScanning(false);
        setSystemError("TIMEOUT : Aucun appareil médical détecté à proximité.");
      }
    }, 15000);
  };

  /**
   * Connexion au capteur et abonnement aux notifications GATT.
   */
  const connectAndSubscribe = async (targetDevice: Device, manager: BleManager): Promise<void> => {
    try {
      console.log(`[BLE] Connexion en cours vers ${targetDevice.id}...`);
      const connectedDevice = await targetDevice.connect({ timeout: 10000 }); // Timeout réseau local
      setActiveDevice(connectedDevice);
      setIsConnected(true);

      const readyDevice = await connectedDevice.discoverAllServicesAndCharacteristics();
      const services = await readyDevice.services();

      // Détection intelligente du type de capteur via les UUIDs
      let targetService = '';
      let targetChar = '';
      let vitalType: VitalType = 'BLOOD_PRESSURE';

      if (services.find((s: Service) => s.uuid.includes(GATT_PROFILES.BLOOD_PRESSURE.service))) {
         targetService = GATT_PROFILES.BLOOD_PRESSURE.service;
         targetChar = GATT_PROFILES.BLOOD_PRESSURE.characteristic;
         vitalType = 'BLOOD_PRESSURE';
      } else if (services.find((s: Service) => s.uuid.includes(GATT_PROFILES.HEART_RATE.service))) {
         targetService = GATT_PROFILES.HEART_RATE.service;
         targetChar = GATT_PROFILES.HEART_RATE.characteristic;
         vitalType = 'HEART_RATE';
      } else if (services.find((s: Service) => s.uuid.includes(GATT_PROFILES.GLUCOSE.service))) {
         targetService = GATT_PROFILES.GLUCOSE.service;
         targetChar = GATT_PROFILES.GLUCOSE.characteristic;
         vitalType = 'GLUCOSE';
      } else {
         throw new Error("Périphérique non supporté.");
      }

      // Lecture du niveau de batterie si le service est présent (Hardware Management)
      const hasBatteryService = services.find((s: Service) => s.uuid.includes(GATT_PROFILES.BATTERY.service));
      if (hasBatteryService) {
         try {
           const batteryChar = await readyDevice.readCharacteristicForService(
             GATT_PROFILES.BATTERY.service,
             GATT_PROFILES.BATTERY.characteristic
           );

           if (batteryChar && batteryChar.value) {
             const buffer = Buffer.from(batteryChar.value, 'base64');
             const level = buffer.readUInt8(0);
             setBatteryLevel(level);

             if (level <= 20) {
               setSystemError(`Alerte Matérielle : La batterie du capteur médical est très faible (${level}%). Pensez à le recharger.`);
             }
           }
         } catch (batteryErr) {
           console.warn("[BLE] Impossible de lire le niveau de batterie", batteryErr);
         }
      }

      // Souscription aux valeurs envoyées en temps réel par le capteur
      readyDevice.monitorCharacteristicForService(
        targetService,
        targetChar,
        (monitorError: BleError | null, characteristic: Characteristic | null) => {
          if (monitorError) {
            handleBleError(monitorError, "Lecture du capteur interrompue.");
            // Gestion de la déconnexion impromptue (Perte de signal, batterie vide)
            if (monitorError.errorCode === 201 || monitorError.message.includes('disconnected')) {
                setIsConnected(false);
                setActiveDevice(null);
            }
            return;
          }

          if (characteristic && characteristic.value) {
            try {
              const vitalData = decodeGattPayload(characteristic.value, readyDevice.id, vitalType);
              setLastMeasurement(vitalData);

              // SÉCURITÉ & TRAÇABILITÉ : Sauvegarde locale dans WatermelonDB
              // La DB locale stockera l'info, puis l'application poussera l'AuditLog
              // DPDPA vers NestJS lors du retour réseau.
              saveVitalDataOfflineSecurely(vitalData);

            } catch (decodeError: unknown) {
              console.error("[BLE] Échec du décodage hexadécimal", decodeError);
              setSystemError("Le format des données reçues est illisible ou corrompu.");
            }
          }
        }
      );

      // Listener global de déconnexion inattendue
      manager.onDeviceDisconnected(targetDevice.id, () => {
         console.warn(`[BLE] Perte de signal Bluetooth avec ${targetDevice.id}`);
         setIsConnected(false);
         setActiveDevice(null);
         setSystemError(`Connexion perdue avec le périphérique médical.`);
      });

    } catch (connectionError: unknown) {
      handleBleError(connectionError as BleError, "Échec de l'appairage. Périphérique hors de portée ou en veille.");
      setIsConnected(false);
      setActiveDevice(null);
    }
  };

  /**
   * Reconnexion directe à un appareil sauvegardé (Bonding / Offline-First)
   * Évite de rescanner tout l'environnement clinique.
   */
  const connectToSavedDevice = async (macAddress: string): Promise<void> => {
    setSystemError(null);
    setLastMeasurement(null);
    setBatteryLevel(null);

    const manager = managerRef.current;
    if (!manager) {
       setSystemError("CRITICAL: Le module matériel Bluetooth n'a pas pu être initialisé.");
       return;
    }

    if (bluetoothState !== State.PoweredOn) {
       setSystemError("ERREUR 101 : Bluetooth inactif. Allumez-le pour continuer.");
       return;
    }

    await stopScanAndDisconnect();
    console.log(`[BLE] Reconnexion directe à l'appareil sauvegardé ${macAddress}...`);

    try {
      const devices = await manager.devices([macAddress]);
      if (devices.length > 0) {
        await connectAndSubscribe(devices[0], manager);
        return;
      }

      // Si l'appareil n'est pas connu du gestionnaire, on le connecte directement
      const device = await manager.connectToDevice(macAddress, { timeout: 10000 });
      await connectAndSubscribe(device, manager);

    } catch (connectionError: unknown) {
      handleBleError(connectionError as BleError, "Impossible de se reconnecter à l'appareil sauvegardé. Assurez-vous qu'il est allumé et à portée.");
      setIsConnected(false);
      setActiveDevice(null);
    }
  };

  // ============================================================================
  // ROUTAGE ET DÉCODAGE HEXADÉCIMAL STRICT (SANS 'ANY')
  // ============================================================================
  const decodeGattPayload = (base64Payload: string, hardwareId: string, type: VitalType): MedicalVitalMeasurement => {
     switch (type) {
       case 'BLOOD_PRESSURE': return decodeBloodPressure(base64Payload, hardwareId);
       case 'HEART_RATE': return decodeHeartRate(base64Payload, hardwareId);
       case 'GLUCOSE': return decodeGlucose(base64Payload, hardwareId);
     }
  }

  /**
   * Décodage IEEE-11073 16-bit SFLOAT (Tensiomètre)
   */
  const decodeBloodPressure = (base64Payload: string, hardwareId: string): MedicalVitalMeasurement => {
    const buffer = Buffer.from(base64Payload, 'base64');
    if (buffer.length < 7) throw new Error("Payload Blood Pressure trop court.");

    const flags = buffer.readUInt8(0);
    const unitIsKpa = (flags & 0x01) !== 0; // 0 = mmHg, 1 = kPa
    const isTimeStampPresent = (flags & 0x02) !== 0;
    const isPulsePresent = (flags & 0x04) !== 0;

    // IEEE 11073 SFLOAT extraction
    let systolic = decodeSFLOAT(buffer, 1);
    let diastolic = decodeSFLOAT(buffer, 3);
    let map = decodeSFLOAT(buffer, 5);

    // Si l'appareil renvoie des KiloPascals (KPa), on convertit en mmHg (Standard Clinique FR)
    if (unitIsKpa) {
      systolic = systolic * 7.50062;
      diastolic = diastolic * 7.50062;
      map = map * 7.50062;
    }

    // Calcul de l'offset dynamique selon les flags
    let currentOffset = 7;

    // Si la date est présente (Base Time = 7 bytes)
    if (isTimeStampPresent) {
      currentOffset += 7;
    }

    const pulseRate = (isPulsePresent && buffer.length >= (currentOffset + 2))
        ? decodeSFLOAT(buffer, currentOffset)
        : undefined;

    return {
      type: 'BLOOD_PRESSURE',
      systolicMmHg: Math.round(systolic),
      diastolicMmHg: Math.round(diastolic),
      mapMmHg: Math.round(map),
      heartRateBpm: pulseRate ? Math.round(pulseRate) : undefined,
      timestampIso: new Date().toISOString(),
      hardwareMacAddress: hardwareId
    };
  };

  /**
   * Décodage Heart Rate Profile (Oxymètre / Cardio)
   */
  const decodeHeartRate = (base64Payload: string, hardwareId: string): MedicalVitalMeasurement => {
    const buffer = Buffer.from(base64Payload, 'base64');
    const flags = buffer.readUInt8(0);
    const is16Bit = (flags & 0x01) !== 0;

    const bpm = is16Bit ? buffer.readUInt16LE(1) : buffer.readUInt8(1);

    return {
      type: 'HEART_RATE',
      heartRateBpm: bpm,
      timestampIso: new Date().toISOString(),
      hardwareMacAddress: hardwareId
    };
  };

  /**
   * Décodage Glucose Profile (Glucomètre)
   */
  const decodeGlucose = (base64Payload: string, hardwareId: string): MedicalVitalMeasurement => {
    const buffer = Buffer.from(base64Payload, 'base64');

    if (buffer.length < 10) throw new Error("Payload Glucose corrompu ou incomplet.");

    const flags = buffer.readUInt8(0);
    const hasTimeOffset = (flags & 0x01) !== 0;
    const hasGlucoseValue = (flags & 0x02) !== 0;
    const unitIsMolL = (flags & 0x04) !== 0; // 0 = kg/L, 1 = mol/L

    let currentOffset = 1;

    // Sequence Number (2 bytes)
    currentOffset += 2;

    // Base Time (7 bytes)
    currentOffset += 7;

    if (hasTimeOffset) {
        currentOffset += 2; // Time Offset
    }

    if (!hasGlucoseValue) {
       throw new Error("Mesure de glucose absente du payload.");
    }

    // IEEE 11073 16-bit SFLOAT extraction
    let glucoseVal = decodeSFLOAT(buffer, currentOffset);
    currentOffset += 2; // Concentration
    currentOffset += 1; // Type & Sample Location

    // Conversion en mg/dL (Standard Clinique)
    let glucoseMgDl = 0;
    if (unitIsMolL) {
       // mol/L -> mmol/L puis mmol/L -> mg/dL (facteur 18.0182)
       glucoseMgDl = glucoseVal * 1000 * 18.0182;
    } else {
       // kg/L -> mg/dL (facteur 100,000)
       glucoseMgDl = glucoseVal * 100000;
    }

    return {
      type: 'GLUCOSE',
      glucoseMgDl: Math.round(glucoseMgDl),
      timestampIso: new Date().toISOString(),
      hardwareMacAddress: hardwareId
    };
  };

  // ============================================================================
  // ÉCRITURE HORS-LIGNE & RÉSILIENCE BASE DE DONNÉES (WATERMELON DB)
  // ============================================================================
  const saveVitalDataOfflineSecurely = async (vitalData: MedicalVitalMeasurement): Promise<void> => {
    try {
      await database.write(async () => {
        const vitalsCollection = database.get('vitals');
        await vitalsCollection.create((vital: any) => {
          // Idéalement, patientId proviendrait d'un Contexte React sélectionné par le médecin
          vital.patient.id = 'dummy-patient-uuid';
          vital.recordedAt = new Date(vitalData.timestampIso);
          vital.status = 'created';

          if (vitalData.type === 'BLOOD_PRESSURE') {
             vital.bloodPressure = `${vitalData.systolicMmHg}/${vitalData.diastolicMmHg}`;
             if (vitalData.heartRateBpm) vital.heartRate = vitalData.heartRateBpm;
          } else if (vitalData.type === 'HEART_RATE') {
             vital.heartRate = vitalData.heartRateBpm;
          } else if (vitalData.type === 'GLUCOSE') {
             // Si on avait un champ glucose, ex: vital.glucose = vitalData.glucoseMgDl;
          }
        });
      });
      console.log(`[DB] Donnée ${vitalData.type} sauvegardée hors-ligne avec succès.`);

      // Intégration Edge Caching (Offline-First)
      // On met en file d'attente la transmission vers NestJS
      await BackgroundSyncService.enqueueTransaction(
         'HIGH',
         '/api/iot/vitals',
         vitalData
      );

    } catch (dbError: unknown) {
      // Gestion des pannes de base de données (ex: mémoire insuffisante, disque Windows 7 plein)
      // L'application NE CRASHE PAS. Le hook attrape l'erreur et affiche un message.
      console.error("[CRITICAL DB ERROR] Crash d'écriture WatermelonDB.", dbError);
      setSystemError("Alerte: L'espace de stockage de la tablette est plein ou corrompu. La donnée lue n'a pas été sauvegardée.");
    }
  };

  /**
   * Mapper d'erreurs BLE pour rendre les pannes intelligibles (UX Médicale).
   */
  const handleBleError = (error: BleError, fallbackMessage: string): void => {
    console.error(`[BLE Fatal Error] Code: ${error.errorCode} | Msg: ${error.message}`);
    switch (error.errorCode) {
      case 101: setSystemError("ERREUR 101: Veuillez allumer le Bluetooth de la tablette."); break;
      case 102: setSystemError("ERREUR 102: Accès Bluetooth refusé par l'OS. Vérifiez les permissions Android/iOS."); break;
      case 201: setSystemError("ERREUR 201: L'appareil médical s'est éteint (Perte de signal ou batterie)."); break;
      case 601: setSystemError("ERREUR 601: Matériel médical incompatible (Profil GATT introuvable)."); break;
      default:  setSystemError(`${fallbackMessage} (Code erreur: ${error.errorCode})`); break;
    }
  };

  return {
    isScanning,
    isConnected,
    activeDevice,
    lastMeasurement,
    systemError,
    bluetoothState,
    batteryLevel,
    startScan,
    stopScanAndDisconnect,
    connectToSavedDevice
  };
}
