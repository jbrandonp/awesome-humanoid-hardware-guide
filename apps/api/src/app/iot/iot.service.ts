import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class IotMedicalService {
  private readonly logger = new Logger(IotMedicalService.name);

  /**
   * Stub de réception des données d'un équipement BLE (GATT)
   * ex: Tensiomètre Omron, Thermomètre connectés.
   * La donnée hex est transformée en tension ou bpm.
   */
  processBleGattData(deviceId: string, hexPayload: string) {
     this.logger.log(`Réception de données Bluetooth Low Energy depuis ${deviceId}: ${hexPayload}`);

     // Mock du décodage du profil GATT "Blood Pressure" (0x1810)
     const decodedVitals = {
        systolic: 120,
        diastolic: 80,
        bpm: 72
     };

     return decodedVitals;
  }

  /**
   * Stub d'intégration d'un Smart Pen (WONDRx ou similaire)
   * Numérisation de l'encre physique.
   */
  processSmartPenInk(patientId: string, svgInkData: string) {
     this.logger.log(`Numérisation de l'ordonnance manuscrite (Smart Pen) pour le patient ${patientId}`);
     // L'encre vectorielle peut être sauvegardée dans la BDD (Mongoose) pour l'historique visuel
     return { status: 'SAVED', format: 'SVG' };
  }
}
