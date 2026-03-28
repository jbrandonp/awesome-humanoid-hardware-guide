import { TriageInput } from './triage.schema';

/**
 * Pure function to calculate ESI score based on the official algorithm
 * ESI 1: Immediate life-saving intervention required
 * ESI 2: High risk situation, confused/lethargic/disoriented, severe pain/distress
 * ESI 3, 4, 5: Based on number of resources needed, but ESI 3 can be upgraded to 2 if vitals are in danger zone.
 */
export function calculateTriageScore(input: TriageInput): number {
  // Step 1: Does this patient require immediate life-saving intervention? (ESI 1)
  // For the sake of this algorithmic representation, we'll use extreme vital signs as proxies for "immediate life-saving intervention"
  // e.g. SpO2 < 90%, extreme bradycardia/tachycardia, unrecordable BP
  if (
    input.spO2 < 90 ||
    input.heartRate < 30 || // Extreme bradycardia
    input.systolicBP < 70 // Shock
  ) {
    return 1;
  }

  // Step 2: Is this a high-risk situation, or is the patient confused/lethargic/disoriented, or in severe pain/distress? (ESI 2)
  if (
    input.painScale >= 7 || // Severe pain is often an automatic ESI 2 criterion depending on hospital policy
    input.chiefComplaint.toLowerCase().includes('chest pain') ||
    input.chiefComplaint.toLowerCase().includes('stroke') ||
    input.chiefComplaint.toLowerCase().includes('suicidal') ||
    input.temperature >= 40 // Extreme fever
  ) {
    return 2;
  }

  // Step 3: How many different resources are needed? (ESI 3, 4, 5)
  let initialScore = 5;
  if (input.estimatedResources === 0) {
    initialScore = 5;
  } else if (input.estimatedResources === 1) {
    initialScore = 4;
  } else if (input.estimatedResources > 1) {
    initialScore = 3;
  }

  // Step 4: Before assigning ESI 3/4/5, check if vital signs are in the danger zone for age. 
  // If yes, the patient MUST be upgraded to ESI 2 for safety.
  if (initialScore > 2 && isDangerZoneVitals(input)) {
    return 2; // Upgraded due to danger zone vitals
  }

  return initialScore;
}

/**
 * Danger zone criteria based on age.
 */
function isDangerZoneVitals(input: TriageInput): boolean {
  // Pediatric danger zones (simplified for ESI algorithm)
  if (input.age < 1) {
    // < 1 year
    if (input.heartRate > 160) return true;
  } else if (input.age >= 1 && input.age <= 3) {
    // 1-3 years
    if (input.heartRate > 140) return true;
  } else if (input.age > 3 && input.age <= 8) {
    // 3-8 years
    if (input.heartRate > 140) return true;
  } else {
    // > 8 years / Adult
    if (input.heartRate > 100) return true;
    if (input.spO2 < 92) return true; // Adult SpO2 danger zone
  }

  return false;
}
