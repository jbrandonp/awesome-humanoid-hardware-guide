import { TriageInput } from './triage.schema';
/**
 * Pure function to calculate ESI score based on the official algorithm
 * ESI 1: Immediate life-saving intervention required
 * ESI 2: High risk situation, confused/lethargic/disoriented, severe pain/distress
 * ESI 3, 4, 5: Based on number of resources needed, but ESI 3 can be upgraded to 2 if vitals are in danger zone.
 */
export declare function calculateTriageScore(input: TriageInput): number;
//# sourceMappingURL=triage.algorithm.d.ts.map