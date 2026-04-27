import { z } from 'zod';
import { Prisma } from '@prisma/client';
export declare const FhirPatientSchema: z.ZodObject<{
    resourceType: z.ZodLiteral<"Patient">;
    id: z.ZodString;
    name: z.ZodArray<z.ZodObject<{
        use: z.ZodString;
        family: z.ZodString;
        given: z.ZodArray<z.ZodString>;
    }, z.core.$strip>>;
    birthDate: z.ZodString;
    gender: z.ZodOptional<z.ZodEnum<{
        unknown: "unknown";
        male: "male";
        female: "female";
        other: "other";
    }>>;
}, z.core.$strip>;
export declare const FhirObservationSchema: z.ZodObject<{
    resourceType: z.ZodLiteral<"Observation">;
    id: z.ZodString;
    status: z.ZodEnum<{
        registered: "registered";
        preliminary: "preliminary";
        final: "final";
        amended: "amended";
    }>;
    subject: z.ZodObject<{
        reference: z.ZodString;
    }, z.core.$strip>;
    effectiveDateTime: z.ZodString;
    code: z.ZodObject<{
        coding: z.ZodArray<z.ZodObject<{
            system: z.ZodString;
            code: z.ZodString;
            display: z.ZodString;
        }, z.core.$strip>>;
    }, z.core.$strip>;
    valueQuantity: z.ZodOptional<z.ZodObject<{
        value: z.ZodNumber;
        unit: z.ZodString;
        system: z.ZodOptional<z.ZodString>;
        code: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    valueString: z.ZodOptional<z.ZodString>;
    component: z.ZodOptional<z.ZodArray<z.ZodObject<{
        code: z.ZodObject<{
            coding: z.ZodArray<z.ZodObject<{
                system: z.ZodString;
                code: z.ZodString;
                display: z.ZodString;
            }, z.core.$strip>>;
        }, z.core.$strip>;
        valueQuantity: z.ZodObject<{
            value: z.ZodNumber;
            unit: z.ZodString;
            system: z.ZodOptional<z.ZodString>;
            code: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>;
    }, z.core.$strip>>>;
}, z.core.$strip>;
export declare const FhirMedicationRequestSchema: z.ZodObject<{
    resourceType: z.ZodLiteral<"MedicationRequest">;
    id: z.ZodString;
    status: z.ZodEnum<{
        completed: "completed";
        active: "active";
        "on-hold": "on-hold";
        cancelled: "cancelled";
    }>;
    intent: z.ZodLiteral<"order">;
    medicationCodeableConcept: z.ZodObject<{
        text: z.ZodString;
    }, z.core.$strip>;
    subject: z.ZodObject<{
        reference: z.ZodString;
    }, z.core.$strip>;
    authoredOn: z.ZodString;
    dosageInstruction: z.ZodArray<z.ZodObject<{
        text: z.ZodString;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const FhirEncounterSchema: z.ZodObject<{
    resourceType: z.ZodLiteral<"Encounter">;
    id: z.ZodString;
    status: z.ZodEnum<{
        cancelled: "cancelled";
        planned: "planned";
        arrived: "arrived";
        triaged: "triaged";
        "in-progress": "in-progress";
        onleave: "onleave";
        finished: "finished";
    }>;
    class: z.ZodObject<{
        system: z.ZodString;
        code: z.ZodString;
        display: z.ZodString;
    }, z.core.$strip>;
    subject: z.ZodObject<{
        reference: z.ZodString;
    }, z.core.$strip>;
    period: z.ZodObject<{
        start: z.ZodString;
        end: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const FhirOperationOutcomeSchema: z.ZodObject<{
    resourceType: z.ZodLiteral<"OperationOutcome">;
    issue: z.ZodArray<z.ZodObject<{
        severity: z.ZodEnum<{
            error: "error";
            warning: "warning";
            fatal: "fatal";
            information: "information";
        }>;
        code: z.ZodEnum<{
            value: "value";
            required: "required";
            invalid: "invalid";
            structure: "structure";
            exception: "exception";
        }>;
        details: z.ZodOptional<z.ZodObject<{
            text: z.ZodString;
        }, z.core.$strip>>;
        diagnostics: z.ZodOptional<z.ZodString>;
        expression: z.ZodOptional<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const FhirBundleSchema: z.ZodObject<{
    resourceType: z.ZodLiteral<"Bundle">;
    type: z.ZodEnum<{
        collection: "collection";
        document: "document";
        searchset: "searchset";
    }>;
    entry: z.ZodArray<z.ZodObject<{
        fullUrl: z.ZodString;
        resource: z.ZodUnion<readonly [z.ZodObject<{
            resourceType: z.ZodLiteral<"Patient">;
            id: z.ZodString;
            name: z.ZodArray<z.ZodObject<{
                use: z.ZodString;
                family: z.ZodString;
                given: z.ZodArray<z.ZodString>;
            }, z.core.$strip>>;
            birthDate: z.ZodString;
            gender: z.ZodOptional<z.ZodEnum<{
                unknown: "unknown";
                male: "male";
                female: "female";
                other: "other";
            }>>;
        }, z.core.$strip>, z.ZodObject<{
            resourceType: z.ZodLiteral<"Observation">;
            id: z.ZodString;
            status: z.ZodEnum<{
                registered: "registered";
                preliminary: "preliminary";
                final: "final";
                amended: "amended";
            }>;
            subject: z.ZodObject<{
                reference: z.ZodString;
            }, z.core.$strip>;
            effectiveDateTime: z.ZodString;
            code: z.ZodObject<{
                coding: z.ZodArray<z.ZodObject<{
                    system: z.ZodString;
                    code: z.ZodString;
                    display: z.ZodString;
                }, z.core.$strip>>;
            }, z.core.$strip>;
            valueQuantity: z.ZodOptional<z.ZodObject<{
                value: z.ZodNumber;
                unit: z.ZodString;
                system: z.ZodOptional<z.ZodString>;
                code: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>>;
            valueString: z.ZodOptional<z.ZodString>;
            component: z.ZodOptional<z.ZodArray<z.ZodObject<{
                code: z.ZodObject<{
                    coding: z.ZodArray<z.ZodObject<{
                        system: z.ZodString;
                        code: z.ZodString;
                        display: z.ZodString;
                    }, z.core.$strip>>;
                }, z.core.$strip>;
                valueQuantity: z.ZodObject<{
                    value: z.ZodNumber;
                    unit: z.ZodString;
                    system: z.ZodOptional<z.ZodString>;
                    code: z.ZodOptional<z.ZodString>;
                }, z.core.$strip>;
            }, z.core.$strip>>>;
        }, z.core.$strip>, z.ZodObject<{
            resourceType: z.ZodLiteral<"MedicationRequest">;
            id: z.ZodString;
            status: z.ZodEnum<{
                completed: "completed";
                active: "active";
                "on-hold": "on-hold";
                cancelled: "cancelled";
            }>;
            intent: z.ZodLiteral<"order">;
            medicationCodeableConcept: z.ZodObject<{
                text: z.ZodString;
            }, z.core.$strip>;
            subject: z.ZodObject<{
                reference: z.ZodString;
            }, z.core.$strip>;
            authoredOn: z.ZodString;
            dosageInstruction: z.ZodArray<z.ZodObject<{
                text: z.ZodString;
            }, z.core.$strip>>;
        }, z.core.$strip>, z.ZodObject<{
            resourceType: z.ZodLiteral<"Encounter">;
            id: z.ZodString;
            status: z.ZodEnum<{
                cancelled: "cancelled";
                planned: "planned";
                arrived: "arrived";
                triaged: "triaged";
                "in-progress": "in-progress";
                onleave: "onleave";
                finished: "finished";
            }>;
            class: z.ZodObject<{
                system: z.ZodString;
                code: z.ZodString;
                display: z.ZodString;
            }, z.core.$strip>;
            subject: z.ZodObject<{
                reference: z.ZodString;
            }, z.core.$strip>;
            period: z.ZodObject<{
                start: z.ZodString;
                end: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>;
        }, z.core.$strip>, z.ZodObject<{
            resourceType: z.ZodLiteral<"OperationOutcome">;
            issue: z.ZodArray<z.ZodObject<{
                severity: z.ZodEnum<{
                    error: "error";
                    warning: "warning";
                    fatal: "fatal";
                    information: "information";
                }>;
                code: z.ZodEnum<{
                    value: "value";
                    required: "required";
                    invalid: "invalid";
                    structure: "structure";
                    exception: "exception";
                }>;
                details: z.ZodOptional<z.ZodObject<{
                    text: z.ZodString;
                }, z.core.$strip>>;
                diagnostics: z.ZodOptional<z.ZodString>;
                expression: z.ZodOptional<z.ZodArray<z.ZodString>>;
            }, z.core.$strip>>;
        }, z.core.$strip>]>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type FhirPatient = z.infer<typeof FhirPatientSchema>;
export type FhirObservation = z.infer<typeof FhirObservationSchema>;
export type FhirMedicationRequest = z.infer<typeof FhirMedicationRequestSchema>;
export type FhirEncounter = z.infer<typeof FhirEncounterSchema>;
export type FhirOperationOutcome = z.infer<typeof FhirOperationOutcomeSchema>;
export type FhirBundle = z.infer<typeof FhirBundleSchema>;
export declare class FhirMapper {
    toFhirPatient(patient: {
        id: string;
        lastName: string;
        firstName: string;
        dateOfBirth: Date | string;
    }): FhirPatient;
    toFhirObservation(vital: {
        id: string;
        patientId: string;
        recordedAt?: Date | null;
        temperature?: number | null;
        heartRate?: number | null;
        bloodPressure?: string | null;
        glucose?: number | null;
    }, type: 'temperature' | 'heartRate' | 'bloodPressure' | 'glucose'): FhirObservation;
    toFhirClinicalRecord(record: {
        _id?: {
            toString: () => string;
        } | unknown;
        specialty: string;
        patientId: string;
        createdAt?: Date | null;
        data?: {
            headCircumference?: number | null;
            lesionType?: string | null;
            location?: string | null;
            diagnosisCode?: string | null;
            diagnosisDisplay?: string | null;
            notes?: string | null;
        };
    }): FhirObservation | null;
    toFhirMedicationRequest(prescription: {
        id: string;
        status: string;
        medicationName: string;
        patientId: string;
        prescribedAt: Date | null;
        dosage: string;
        instructions?: string | null;
    }): FhirMedicationRequest;
    toFhirEncounter(visit: {
        id: string;
        patientId: string;
        date?: Date;
        createdAt: Date;
    }): FhirEncounter;
    fromFhirPatient(fhirPatient: FhirPatient): Prisma.PatientCreateInput;
    fromFhirObservation(fhirObservation: FhirObservation): {
        patientId: string;
        temperature?: number;
        heartRate?: number;
        bloodPressure?: string;
        glucose?: number;
    };
    /**
     * Safely extracts a resource ID from a FHIR Reference string.
     * Handles absolute URLs (e.g., http://server/fhir/Patient/123) and relative ones (e.g., Patient/123).
     */
    extractIdFromReference(reference: string): string;
}
//# sourceMappingURL=fhir.mapper.d.ts.map