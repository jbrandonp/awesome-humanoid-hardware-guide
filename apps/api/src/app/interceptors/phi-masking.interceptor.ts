import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface UserPayload {
  userId: string;
  role: string;
}

export interface RequestWithUser {
  user?: UserPayload;
}

// We define basic structural checks to guess if an object is a Patient or ClinicalRecord
// Based on schema.prisma and clinical-record.schema.ts

export interface MaskableObject {
  [key: string]: unknown;
}

@Injectable()
export class PhiMaskingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    // Apply masking only if the user has the RECEPTIONIST role
    if (user && user.role === 'RECEPTIONIST') {
      return next.handle().pipe(
        map((data: unknown) => this.maskData(data))
      );
    }

    return next.handle();
  }

  private isPatient(obj: MaskableObject): boolean {
    // schema.prisma Patient has: firstName, lastName, dateOfBirth
    return 'firstName' in obj && 'lastName' in obj && 'dateOfBirth' in obj;
  }

  private isClinicalRecord(obj: MaskableObject): boolean {
    // clinical-record.schema.ts has: patientId, specialty, data
    return 'patientId' in obj && 'specialty' in obj && 'data' in obj;
  }

  private maskData(data: unknown): unknown {
    if (data === null || data === undefined) {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map(item => this.maskData(item));
    }

    if (typeof data === 'object') {
      if (data instanceof Date) {
        return data;
      }
      if (Buffer.isBuffer(data)) {
        return data;
      }

      // Handle Mongoose Documents or similar objects with toJSON safely without 'any'
      let plainObj: Record<string, unknown> = {};
      if ('toJSON' in data && typeof data.toJSON === 'function') {
        const jsonResult = data.toJSON();
        if (typeof jsonResult === 'object' && jsonResult !== null) {
            plainObj = jsonResult as Record<string, unknown>;
        }
      } else {
        plainObj = data as Record<string, unknown>;
      }

      const maskedObj: Record<string, unknown> = {};
      
      const isPat = this.isPatient(plainObj);
      const isClin = this.isClinicalRecord(plainObj);

      for (const [key, value] of Object.entries(plainObj)) {
        // Mask phone number if it's a Patient (or just any phone number to be safe, but we restrict it to Patient here if needed, 
        // actually phone might be on Patient or just returned. Let's mask phone if isPat is true)
        if (isPat && (key === 'phone' || key === 'phoneNumber')) {
          maskedObj[key] = this.maskPhoneNumber(value);
        } else if (isClin && (key === 'data' || key === 'notes' || key === 'clinicalDetails' || key === 'viralLoad')) {
          // Masquer les détails cliniques pour un ClinicalRecord
          maskedObj[key] = '*** MASKED ***';
        } else {
          // Keep other properties visible (like appointment time)
          maskedObj[key] = this.maskData(value);
        }
      }
      
      // Re-apply the original prototype (useful for Prisma or other custom classes) if it's not a plain object
      if (!('toJSON' in data && typeof data.toJSON === 'function')) {
        Object.setPrototypeOf(maskedObj, Object.getPrototypeOf(data));
      }

      return maskedObj;
    }

    return data;
  }

  private maskPhoneNumber(value: unknown): unknown {
    if (typeof value === 'string') {
      if (value.length > 6) {
        // Masquer les 6 derniers caractères pour correspondre à (ex: +91 98765 ***)
        return value.slice(0, -6) + '***';
      }
      return '***';
    }
    return value;
  }
}
