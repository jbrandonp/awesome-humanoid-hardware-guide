import { Controller, Post, Body, HttpStatus, HttpException, Logger, Get } from '@nestjs/common';
import { Hl7MllpService } from './hl7-mllp.service';
import { Hl7ParserService } from './hl7-parser.service';

@Controller('hl7')
export class Hl7MllpController {
  private readonly logger = new Logger(Hl7MllpController.name);

  constructor(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    // @ts-expect-error - Service injected but may appear unused; required for dependency graph
    private readonly _hl7MllpService: Hl7MllpService,
    private readonly hl7ParserService: Hl7ParserService,
  ) {}

  /**
   * Endpoint HTTP pour envoyer des messages HL7 v2.x
   * Alternative à MLLP pour les systèmes qui ne supportent pas les sockets
   */
  @Post('send')
  async sendHl7Message(@Body() body: { message: string; messageType?: string }): Promise<{
    success: boolean;
    message: string;
    ack?: string;
    parsed?: unknown;
  }> {
    try {
      const { message, messageType } = body;
      
      if (!message || typeof message !== 'string') {
        throw new HttpException('Message HL7 requis', HttpStatus.BAD_REQUEST);
      }

      this.logger.log(`[HL7 HTTP] Réception d'un message HL7${messageType ? ` de type ${messageType}` : ''}`);
      
      // Valider le format HL7 basique
      if (!message.includes('MSH|')) {
        throw new HttpException('Message HL7 invalide: segment MSH manquant', HttpStatus.BAD_REQUEST);
      }

      // Parser le message HL7
      let parsedMessage;
      try {
        parsedMessage = this.hl7ParserService.parseOruR01(message);
        this.logger.debug(`[HL7 HTTP] Message parsé: ${JSON.stringify(parsedMessage).substring(0, 200)}...`);
      } catch (parseError) {
        this.logger.warn(`[HL7 HTTP] Échec du parsing HL7: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
        // On continue même si le parsing échoue, le message peut être traité par d'autres systèmes
      }

      // Simuler l'envoi via MLLP (dans une vraie implémentation, on enverrait via le service MLLP)
      // Pour l'instant, on retourne un accusé de réception simulé
      const simulatedAck = this.generateAckMessage(message);
      
      // Log pour audit
      this.logger.log(`[HL7 HTTP] Message traité avec succès, longueur: ${message.length} caractères`);

      return {
        success: true,
        message: 'Message HL7 reçu et traité',
        ack: simulatedAck,
        parsed: parsedMessage
      };

    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      this.logger.error(`[HL7 HTTP] Erreur serveur: ${error instanceof Error ? error.message : String(error)}`);
      throw new HttpException(
        'Erreur serveur lors du traitement du message HL7',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

   /**
    * Endpoint pour parser un message HL7 sans l'envoyer
    */
   @Post('parse')
   async parseHl7Message(@Body() body: { message: string }): Promise<unknown> {
     try {
       const { message } = body;
       
       if (!message || typeof message !== 'string') {
         throw new HttpException('Message HL7 requis', HttpStatus.BAD_REQUEST);
       }

       this.logger.log(`[HL7 PARSE] Parsing d'un message HL7`);
       
       // Parser le message HL7
       const parsedMessage = this.hl7ParserService.parseOruR01(message);
       this.logger.debug(`[HL7 PARSE] Message parsé: ${JSON.stringify(parsedMessage).substring(0, 200)}...`);
       
       return parsedMessage;
     } catch (error) {
       if (error instanceof HttpException) {
         throw error;
       }
       
       this.logger.error(`[HL7 PARSE] Erreur de parsing: ${error instanceof Error ? error.message : String(error)}`);
       throw new HttpException(
         'Erreur lors du parsing du message HL7',
         HttpStatus.INTERNAL_SERVER_ERROR
       );
     }
   }

   /**
    * Endpoint pour vérifier le statut du serveur MLLP
    */
   @Get('status')
   getHl7Status(): {
     mllpEnabled: boolean;
     mllpPort: number;
     httpEndpoint: boolean;
     supportedMessageTypes: string[];
   } {
    const mllpPort = parseInt(process.env.HL7_PORT || '2575', 10);
    
    return {
      mllpEnabled: true,
      mllpPort,
      httpEndpoint: true,
      supportedMessageTypes: [
        'ADT^A01', 'ADT^A04', 'ADT^A08', 'ADT^A40',
        'ORM^O01', 'ORU^R01', 'MDM^T02',
        'SIU^S12', 'SIU^S13', 'SIU^S14'
      ]
    };
  }

  /**
   * Endpoint pour recevoir les accusés de réception HL7
   * (webhook pour les systèmes externes)
   */
  @Post('ack')
  receiveHl7Ack(@Body() body: { originalMessageId: string; ackMessage: string; status: string }): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { originalMessageId, ackMessage: _ackMessage, status } = body;
      
      this.logger.log(`[HL7 ACK] Réception d'un accusé pour le message ${originalMessageId}, statut: ${status}`);
      
      // Ici, on mettrait à jour la base de données avec le statut de l'accusé
      // Pour l'instant, on log seulement
      
      return Promise.resolve({
        success: true,
        message: 'Accusé de réception HL7 enregistré'
      });
    } catch (error) {
      this.logger.error(`[HL7 ACK] Erreur: ${error instanceof Error ? error.message : String(error)}`);
      throw new HttpException(
        'Erreur lors du traitement de l\'accusé HL7',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Génère un message d'accusé de réception HL7 simulé
   */
  private generateAckMessage(originalMessage: string): string {
    // Extraire le contrôle ID du message original
    let controlId = 'UNKNOWN';
    const mshSegment = originalMessage.split('\n').find(line => line.startsWith('MSH|'));
    if (mshSegment) {
      const fields = mshSegment.split('|');
      if (fields.length > 9) {
        controlId = fields[9];
      }
    }

    const now = new Date();
    const timestamp = now.toISOString().replace(/[-:]/g, '').split('.')[0];
    
    // Construire l'ACK HL7 minimal
    return `MSH|^~\\&|RESILIENT_API|HOSPITAL|LAB_SYSTEM|HOSPITAL|${timestamp}||ACK^R01|${controlId}|P|2.5\r`
         + `MSA|AA|${controlId}|Message accepted`;
  }
}