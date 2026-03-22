import { Injectable } from '@nestjs/common';

export interface ExtractedVitals {
  bloodPressure?: string;
  heartRate?: number;
  temperature?: number;
  glucose?: number;
  unstructuredText?: string;
}

@Injectable()
export class OcrService {
  /**
   * Simule un module d'OCR intelligent et une logique de NER (Named Entity Recognition)
   * pour extraire des constantes biomédicales d'un texte brut.
   */
  async extractVitalsFromText(ocrText: string): Promise<ExtractedVitals> {
    const extracted: ExtractedVitals = {
       unstructuredText: ocrText
    };

    // Regex pour extraire la tension (ex: "Tension: 120/80", "BP : 13/8", "Tension Arterielle 14/9")
    const bpRegex = /(?:Tension|BP|Blood\s*Pressure)[\s:]*([0-9]{2,3}\s*\/\s*[0-9]{2,3})/i;
    const bpMatch = ocrText.match(bpRegex);
    if (bpMatch && bpMatch[1]) {
      extracted.bloodPressure = bpMatch[1].replace(/\s+/g, ''); // Normalize "120 / 80" -> "120/80"
    }

    // Regex pour extraire le rythme cardiaque (ex: "FC: 85 bpm", "Rythme Cardiaque : 72", "Pulse 90")
    const hrRegex = /(?:FC|Rythme\s*Cardiaque|Pulse|Heart\s*Rate)[\s:]*([0-9]{2,3})/i;
    const hrMatch = ocrText.match(hrRegex);
    if (hrMatch && hrMatch[1]) {
      extracted.heartRate = parseInt(hrMatch[1], 10);
    }

    // Regex pour extraire la température (ex: "Temp: 38.5", "Température : 39°C")
    const tempRegex = /(?:Temp|Température|Temperature)[\s:]*([0-9]{2}(?:[.,][0-9])?)/i;
    const tempMatch = ocrText.match(tempRegex);
    if (tempMatch && tempMatch[1]) {
      extracted.temperature = parseFloat(tempMatch[1].replace(',', '.'));
    }

    // Regex pour le Glucose (ex: "Glucose: 120 mg/dL", "Glycémie: 90")
    const glucoseRegex = /(?:Glucose|Glycémie|Glycemie)[\s:]*([0-9]{2,3})/i;
    const glucoseMatch = ocrText.match(glucoseRegex);
    if (glucoseMatch && glucoseMatch[1]) {
      extracted.glucose = parseInt(glucoseMatch[1], 10);
    }

    return extracted;
  }
}
