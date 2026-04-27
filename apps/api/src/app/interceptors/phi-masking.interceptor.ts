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
  // Roles that are ALLOWED to see full PHI
  private readonly clinicalRoles = ['DOCTOR', 'NURSE', 'ADMIN', 'LAB_TECH', 'PHARMACIST'];

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    // SECURE FIX: Restrictive by default. If role is NOT clinical, apply masking.
    const isClinical = user && this.clinicalRoles.includes(user.role);

    if (!isClinical) {
      return next.handle().pipe(
        map((data: unknown) => this.maskData(data))
      );
    }

    return next.handle();
  }

  private maskData(data: unknown): unknown {
    if (data === null || data === undefined) {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map(item => this.maskData(item));
    }

    if (typeof data === 'object') {
      if (data instanceof Date || Buffer.isBuffer(data)) {
        return data;
      }

      // Safe plain object conversion
      let plainObj: Record<string, unknown> = {};
      if ('toJSON' in data && typeof data.toJSON === 'function') {
        const jsonResult = data.toJSON();
        if (typeof jsonResult === 'object' && jsonResult !== null) {
            plainObj = jsonResult as Record<string, unknown>;
        }
      } else {
        plainObj = data as Record<string, unknown>;
      }

      // STRUCTURAL CHECKS
      const isPatient = 'firstName' in plainObj && 'lastName' in plainObj && 'dateOfBirth' in plainObj;
      const isClinicalRecord = 'patientId' in plainObj && 'specialty' in plainObj && ('data' in plainObj || 'clinicalDetails' in plainObj);

      if (!isPatient && !isClinicalRecord) {
        // Recursively check children but don't apply field-based masking to this object itself
        const result: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(plainObj)) {
          result[key] = this.maskData(value);
        }
        return result;
      }

      const maskedObj: Record<string, unknown> = {};
      
      for (const [key, value] of Object.entries(plainObj)) {
        const lowerKey = key.toLowerCase();
        
        // Field-based masking (Model-agnostic for better security)
        if (lowerKey.includes('phone') || lowerKey.includes('contact')) {
          maskedObj[key] = this.maskPhoneNumber(value);
        } else if (
          lowerKey === 'data' || 
          lowerKey === 'notes' || 
          lowerKey === 'clinicaldetails' || 
          lowerKey === 'viralload' ||
          lowerKey === 'diagnosis' ||
          lowerKey === 'prescription'
        ) {
          maskedObj[key] = '*** MASKED ***';
        } else if (lowerKey === 'email') {
          maskedObj[key] = '***@***';
        } else if (typeof value === 'object') {
          maskedObj[key] = this.maskData(value);
        } else {
          maskedObj[key] = value;
        }
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
