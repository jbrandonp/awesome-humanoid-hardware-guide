import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
export declare const FHIR_SCOPES_KEY = "fhir_scopes";
export declare const FhirScopes: (...scopes: string[]) => MethodDecorator & ClassDecorator;
export declare class SmartOnFhirGuard implements CanActivate {
    private reflector;
    constructor(reflector: Reflector);
    canActivate(context: ExecutionContext): boolean;
}
//# sourceMappingURL=smart-on-fhir.guard.d.ts.map