import { CustomDecorator } from '@nestjs/common';
import { Role } from '@prisma/client';
export declare const ROLES_KEY = "roles";
export declare const Roles: (...roles: Role[]) => CustomDecorator<string>;
//# sourceMappingURL=roles.decorator.d.ts.map