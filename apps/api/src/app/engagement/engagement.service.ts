import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class PatientEngagementService {
  private readonly logger = new Logger(PatientEngagementService.name);

  /**
   * Envoi d'un rappel automatique via API tierce (ex: Twilio / WhatsApp Business)
   */
  async sendVaccinationReminder(patientPhone: string, patientName: string, vaccineName: string, date: string) {
    this.logger.log(`[WhatsApp Business] Envoi du rappel de vaccination (${vaccineName}) à ${patientName} (${patientPhone}) pour le ${date}.`);

    const messageTemplate = `Bonjour ${patientName}, c'est le moment de votre vaccin : ${vaccineName}. Nous vous attendons le ${date} à la clinique. 🏥`;

    // Stub de l'API Call WhatsApp (Non exécuté en mode OFFLINE pur, stocké en file d'attente sortante)
    return { status: 'QUEUED_FOR_ONLINE', message: messageTemplate };
  }
}
