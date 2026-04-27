import { Controller, Post, Body, HttpStatus, HttpException, Logger, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IotMedicalService, BleBloodPressurePayloadSchema, SmartPenInkPayloadSchema } from './iot.service';
import { z } from 'zod';

@Controller('iot')
@UseGuards(AuthGuard('jwt'))
export class IotController {
  private readonly logger = new Logger(IotController.name);

  constructor(private readonly iotService: IotMedicalService) {}

  /**
   * Endpoint pour recevoir les données de pression artérielle des dispositifs BLE
   * Authentification requise via JWT (à implémenter avec un guard)
   */
  @Post('ble/blood-pressure')
  async receiveBleBloodPressure(@Body() body: unknown): Promise<{ success: boolean; message: string; data?: unknown }> {
    try {
      // Validation stricte avec Zod
      const validatedPayload = BleBloodPressurePayloadSchema.parse(body);
      
      this.logger.log(`[IoT BLE] Données de pression artérielle reçues pour le patient: ${validatedPayload.patientId}`);
      
      // Traitement via le service IoT
      const result = await this.iotService.processBleGattData(validatedPayload);
      
      return {
        success: true,
        message: 'Données de pression artérielle traitées avec succès',
        data: result
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        this.logger.warn(`[IoT BLE] Validation échouée: ${JSON.stringify(error.issues)}`);
        throw new HttpException(
          { message: 'Validation failed', errors: error.issues },
          HttpStatus.BAD_REQUEST
        );
      }
      
      this.logger.error(`[IoT BLE] Erreur de traitement: ${error instanceof Error ? error.message : String(error)}`);
      throw new HttpException(
        'Erreur serveur lors du traitement des données IoT',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Endpoint pour recevoir les données d'encre des stylos intelligents
   * Utilisé pour la saisie de prescriptions manuscrites numérisées
   */
  @Post('smart-pen/ink')
  async receiveSmartPenInk(@Body() body: unknown): Promise<{ success: boolean; message: string; data?: unknown }> {
    try {
      // Validation stricte avec Zod
      const validatedPayload = SmartPenInkPayloadSchema.parse(body);
      
      this.logger.log(`[IoT SmartPen] Données d'encre reçues pour le patient: ${validatedPayload.patientId}`);
      
      // Traitement via le service IoT
      const result = await this.iotService.processSmartPenInk(validatedPayload);
      
      return {
        success: true,
        message: 'Données de stylo intelligent traitées avec succès',
        data: result
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        this.logger.warn(`[IoT SmartPen] Validation échouée: ${JSON.stringify(error.issues)}`);
        throw new HttpException(
          { message: 'Validation failed', errors: error.issues },
          HttpStatus.BAD_REQUEST
        );
      }
      
      this.logger.error(`[IoT SmartPen] Erreur de traitement: ${error instanceof Error ? error.message : String(error)}`);
      throw new HttpException(
        'Erreur serveur lors du traitement des données du stylo intelligent',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Endpoint de santé pour les dispositifs IoT
   * Permet aux dispositifs de vérifier la connectivité et d'obtenir leur configuration
   */
  @Post('device/heartbeat')
  async deviceHeartbeat(@Body() body: unknown): Promise<{ status: string; timestamp: string; configuration?: unknown }> {
    try {
      const DeviceHeartbeatSchema = z.object({
        deviceId: z.string().min(1),
        firmwareVersion: z.string().optional(),
        batteryLevel: z.number().min(0).max(100).optional(),
      });
      
      const validated = DeviceHeartbeatSchema.parse(body);
      
      this.logger.log(`[IoT Heartbeat] Dispositif ${validated.deviceId} - Batterie: ${validated.batteryLevel ?? 'N/A'}%`);
      
      // Ici on pourrait récupérer la configuration spécifique au dispositif
      // Pour l'instant, on retourne une réponse simple
      return {
        status: 'OK',
        timestamp: new Date().toISOString(),
        configuration: {
          syncInterval: 300, // secondes
          maxRetries: 3,
          encryptionRequired: true
        }
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new HttpException(
          { message: 'Validation failed', errors: error.issues },
          HttpStatus.BAD_REQUEST
        );
      }
      throw new HttpException(
        'Erreur serveur',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}