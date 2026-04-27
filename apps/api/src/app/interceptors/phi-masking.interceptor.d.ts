import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
export interface UserPayload {
    userId: string;
    role: string;
}
export interface RequestWithUser {
    user?: UserPayload;
}
export interface MaskableObject {
    [key: string]: unknown;
}
export declare class PhiMaskingInterceptor implements NestInterceptor {
    private readonly clinicalRoles;
    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown>;
    private maskData;
    private maskPhoneNumber;
}
//# sourceMappingURL=phi-masking.interceptor.d.ts.map