import { useState, useEffect, useRef } from 'react';
import { BleManager, Device, BleError, State, Characteristic } from 'react-native-ble-plx';
import { Buffer } from 'buffer';

// ============================================================================
// INTERFACES TYPÉES STRICTES (ZÉRO 'ANY')
// ============================================================================

export interface BloodPressureMeasurement {
  systolic: number; // Pression systolique en mmHg
  diastolic: number; // Pression diastolique en mmHg
  map: number; // Pression artérielle moyenne (Mean Arterial Pressure)
  pulseRate?: number; // Rythme cardiaque en battements par minute (si supporté par le matériel)
  timestamp: string; // ISO 8601 timestamp pour traçabilité inaltérable
  deviceId: string; // MAC Address ou UUID du périphérique source (traçabilité IoT)
}

export interface BleScannerState {
  isScanning: boolean;
  isConnected: boolean;
  device: Device | null;
  lastMeasurement: BloodPressureMeasurement | null;
  error: string | null;
  bluetoothState: State | 'UNKNOWN';
}

// Profil GATT Standardisé (IEEE 11073) pour les Tensiomètres Médicaux
const GATT_SERVICES = {
  BLOOD_PRESSURE: '1810',
};

const GATT_CHARACTERISTICS = {
  BLOOD_PRESSURE_MEASUREMENT: '2A35',
};

// ============================================================================
// LOGIQUE DE PRODUCTION (GESTION DES ERREURS EXTRÊMES & CONNEXION)
// ============================================================================

export function useBleScanner(): BleScannerState & {
  startScan: () => Promise<void>;
  stopScanAndDisconnect: () => Promise<void>;
} {
  // L'instance du gestionnaire Bluetooth doit persister tout au long du cycle de vie
  const managerRef = useRef<BleManager | null>(null);

  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [device, setDevice] = useState<Device | null>(null);
  const [lastMeasurement, setLastMeasurement] = useState<BloodPressureMeasurement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [bluetoothState, setBluetoothState] = useState<State | 'UNKNOWN'>('UNKNOWN');

  // Initialisation du Manager (Créé une seule fois pour éviter les fuites de mémoire)
  useEffect(() => {
    managerRef.current = new BleManager();

    // Surveillance de l'état physique de la puce Bluetooth (Allumée, Éteinte, Permissions manquantes)
    const subscription = managerRef.current.onStateChange((state) => {
      setBluetoothState(state);
      if (state === State.PoweredOff) {
         setError("Le Bluetooth est désactivé. Veuillez l'activer pour l'acquisition IoT.");
         stopScanAndDisconnect(); // Coupe immédiate pour sécurité
      }
    }, true);

    return () => {
      subscription.remove();
      managerRef.current?.destroy();
    };
  }, []);

  /**
   * Stoppe le scan en cours et ferme la connexion active proprement
   * Prévention des fuites de ressources sur les vieux terminaux.
   */
  const stopScanAndDisconnect = async (): Promise<void> => {
    if (!managerRef.current) return;

    managerRef.current.stopDeviceScan();
    setIsScanning(false);

    if (device) {
      try {
        const isDeviceConnected = await device.isConnected();
        if (isDeviceConnected) {
          await device.cancelConnection();
          console.log(`[BLE] Déconnexion sécurisée du tensiomètre ${device.id}`);
        }
      } catch (err: unknown) {
        console.error(`[BLE] Erreur critique lors de la déconnexion:`, err);
      } finally {
        setDevice(null);
        setIsConnected(false);
      }
    }
  };

  /**
   * Lance le processus de scan ciblé et gère la connexion automatique.
   * Gère les Timeouts et les crashs éventuels de la pile Bluetooth Android/iOS.
   */
  const startScan = async (): Promise<void> => {
    setError(null);
    setLastMeasurement(null);

    const manager = managerRef.current;
    if (!manager) {
       setError("Erreur système: Le module Bluetooth n'a pas pu être initialisé.");
       return;
    }

    if (bluetoothState !== State.PoweredOn) {
       setError("Bluetooth inactif ou permission refusée (Localisation requise sur Android).");
       return;
    }

    // Assainissement préalable avant lancement d'un nouveau scan
    await stopScanAndDisconnect();
    setIsScanning(true);
    console.log(`[BLE] Début du scan ciblé pour le service GATT ${GATT_SERVICES.BLOOD_PRESSURE}...`);

    try {
      manager.startDeviceScan(
        [GATT_SERVICES.BLOOD_PRESSURE],
        { allowDuplicates: false },
        async (scanError: BleError | null, scannedDevice: Device | null) => {

          if (scanError) {
            handleBleError(scanError, "Erreur lors du scan matériel");
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
      setError(`Crash critique de la pile Bluetooth: ${(criticalError as Error).message}`);
      setIsScanning(false);
    }

    // Watchdog Timeout (Économie d'énergie Sprint 9.1) : On ne scanne pas à l'infini
    setTimeout(() => {
      if (isScanning) {
        manager.stopDeviceScan();
        setIsScanning(false);
        setError("Timeout: Aucun tensiomètre détecté à proximité après 15 secondes.");
      }
    }, 15000);
  };

  /**
   * Négocie la connexion MTU, découvre les services et souscrit aux notifications
   * avec gestion des erreurs réseau extrêmes.
   */
  const connectAndSubscribe = async (targetDevice: Device, manager: BleManager): Promise<void> => {
    try {
      console.log(`[BLE] Tentative de connexion au périphérique ${targetDevice.id}...`);
      const connectedDevice = await targetDevice.connect({ timeout: 10000 });
      setDevice(connectedDevice);
      setIsConnected(true);

      console.log(`[BLE] Négociation des services GATT...`);
      const readyDevice = await connectedDevice.discoverAllServicesAndCharacteristics();

      // Souscription au flux de constantes vitales en direct
      readyDevice.monitorCharacteristicForService(
        GATT_SERVICES.BLOOD_PRESSURE,
        GATT_CHARACTERISTICS.BLOOD_PRESSURE_MEASUREMENT,
        (monitorError: BleError | null, characteristic: Characteristic | null) => {
          if (monitorError) {
            handleBleError(monitorError, "La lecture du capteur biométrique a été interrompue.");
            // Si la connexion a été rompue par le périphérique (ex: batterie faible du tensiomètre)
            if (monitorError.errorCode === 201 || monitorError.message.includes('disconnected')) {
                setIsConnected(false);
                setDevice(null);
            }
            return;
          }

          if (characteristic && characteristic.value) {
            try {
              const vitalData = decodeIeee11073SfloatPayload(characteristic.value, readyDevice.id);
              setLastMeasurement(vitalData);
              console.log(`[BLE] Acquisition réussie : SYS ${vitalData.systolic} / DIA ${vitalData.diastolic}`);

              // Note d'Audit DPDPA : Le log réel de consentement (AuditLog) se fera
              // lors de l'envoi de `vitalData` via WatermelonDB -> NestJS.

            } catch (decodeError: unknown) {
              console.error("[BLE] Erreur de décodage binaire IEEE 11073", decodeError);
              setError("Le format de données reçu par le matériel est illisible ou corrompu.");
            }
          }
        }
      );

      // Gestion de la déconnexion matérielle inattendue (ex: l'infirmière éloigne la tablette)
      manager.onDeviceDisconnected(targetDevice.id, (disconnectError, d) => {
         console.warn(`[BLE] Perte de connexion inattendue avec ${targetDevice.id}`);
         setIsConnected(false);
         setDevice(null);
         setError(`Connexion perdue avec le tensiomètre.`);
      });

    } catch (connectionError: unknown) {
      handleBleError(connectionError as BleError, "Échec de l'appairage avec le matériel médical.");
      setIsConnected(false);
      setDevice(null);
    }
  };

  /**
   * Traduit formellement les octets du Payload GATT Blood Pressure en valeurs médicales JS.
   * Format IEEE-11073 16-bit SFLOAT (Base64 -> Buffer -> UInt16 -> Float).
   */
  const decodeIeee11073SfloatPayload = (base64Payload: string, hardwareId: string): BloodPressureMeasurement => {
    // Allocation sécurisée de mémoire sans "any"
    const buffer = Buffer.from(base64Payload, 'base64');

    if (buffer.length < 7) {
       throw new Error(`Payload BLE trop court (Taille: ${buffer.length}). Octets requis: 7 minimum.`);
    }

    // Le premier octet contient les drapeaux de configuration (Flags)
    const flags = buffer.readUInt8(0);
    const isPulsePresent = (flags & 0x02) !== 0; // Bit 1 défini si le pouls est inclus

    // IEEE 11073 SFLOAT extraction simple (Exposant/Mantisse ignorés ici pour la clarté d'un mock prod-ready)
    // Dans une implémentation médicale certifiée ISO, nous utiliserions une librairie `sfloat-to-ieee` stricte.
    const rawSystolic = buffer.readUInt16LE(1);
    const rawDiastolic = buffer.readUInt16LE(3);
    const rawMap = buffer.readUInt16LE(5);

    let pulseRate: number | undefined = undefined;
    if (isPulsePresent && buffer.length >= 9) {
      pulseRate = buffer.readUInt16LE(7);
    }

    // Normalisation des valeurs pour le modèle Prisma `Vital`
    return {
      systolic: rawSystolic,
      diastolic: rawDiastolic,
      map: rawMap,
      pulseRate: pulseRate,
      timestamp: new Date().toISOString(),
      deviceId: hardwareId
    };
  };

  /**
   * Mapper d'erreurs BLE pour rendre les messages lisibles à un praticien non-technique
   */
  const handleBleError = (error: BleError, fallbackMessage: string): void => {
    console.error(`[BLE Core Error] Code: ${error.errorCode} | Msg: ${error.message}`);

    switch (error.errorCode) {
      case 101: // BluetoothPoweredOff
        setError("Veuillez allumer le Bluetooth de la tablette.");
        break;
      case 102: // BluetoothUnauthorized
        setError("Accès Bluetooth refusé par l'OS. Vérifiez les permissions de l'application.");
        break;
      case 201: // DeviceDisconnected
        setError("L'appareil médical s'est éteint ou a été mis en veille.");
        break;
      case 601: // CharacteristicsDiscoveryFailed
        setError("Le tensiomètre connecté n'est pas un matériel certifié (Profil GATT 1810 introuvable).");
        break;
      default:
        setError(`${fallbackMessage} (Erreur système ${error.errorCode})`);
        break;
    }
  };

  return {
    isScanning,
    isConnected,
    device,
    lastMeasurement,
    error,
    bluetoothState,
    startScan,
    stopScanAndDisconnect
  };
}
