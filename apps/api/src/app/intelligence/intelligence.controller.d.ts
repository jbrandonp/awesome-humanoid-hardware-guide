import { IntelligenceService } from './intelligence.service';
import type { DrugInteractionRequest } from './intelligence.service';
export declare class IntelligenceController {
    private readonly intelligenceService;
    constructor(intelligenceService: IntelligenceService);
    checkInteractions(request: DrugInteractionRequest): Promise<unknown>;
}
//# sourceMappingURL=intelligence.controller.d.ts.map