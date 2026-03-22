import RNHTMLtoPDF from 'react-native-html-to-pdf';

interface PrescriptionItem {
  id: string;
  name: string;
  dosage?: string;
}

export class PdfGeneratorService {
  static async generatePrescription(patientName: string, date: string, items: PrescriptionItem[]): Promise<string> {

    // ABDM Compliance : Mocking a QR Code generation via simple base64 image or placeholder
    const dummyQrCodeUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=ABDM_CERTIFIED_PRESCRIPTION_12345';

    const itemsHtml = items.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.dosage || 'Selon prescription médicale'}</td>
      </tr>
    `).join('');

    const htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: 'Helvetica', sans-serif; padding: 40px; color: #333; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0056b3; padding-bottom: 20px; }
            .clinic-name { font-size: 24px; color: #0056b3; font-weight: bold; margin: 0; }
            .clinic-address { font-size: 14px; color: #666; margin-top: 5px; }
            .qr-code { width: 100px; height: 100px; }
            .patient-info { margin-top: 30px; font-size: 16px; }
            .prescription-table { width: 100%; border-collapse: collapse; margin-top: 30px; }
            .prescription-table th { text-align: left; padding: 10px; background-color: #f4f4f4; color: #333; }
            .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 class="clinic-name">Clinique Résiliente (ABDM)</h1>
              <div class="clinic-address">123 Health Avenue, District<br/>Contact: +1 234 567 890</div>
            </div>
            <img src="${dummyQrCodeUrl}" class="qr-code" alt="ABDM Validation QR" />
          </div>

          <div class="patient-info">
            <p><strong>Patient :</strong> ${patientName}</p>
            <p><strong>Date :</strong> ${date}</p>
          </div>

          <table class="prescription-table">
            <thead>
              <tr>
                <th>Médicament / Traitement</th>
                <th>Posologie (Instructions)</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="footer">
            <p>Ce document est généré électroniquement et certifié par le Système de Santé Résilient V3.0 (Offline-First).</p>
            <p>Signature du Médecin : _______________________</p>
          </div>
        </body>
      </html>
    `;

    try {
      const options = {
        html: htmlContent,
        fileName: `Ordonnance_${patientName.replace(/\s+/g, '_')}_${Date.now()}`,
        directory: 'Documents',
      };

      const file = await RNHTMLtoPDF.convert(options);
      return file.filePath || '';
    } catch (error) {
      console.error('Erreur lors de la génération du PDF', error);
      throw error;
    }
  }
}
