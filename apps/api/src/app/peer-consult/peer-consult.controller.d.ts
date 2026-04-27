import { PeerConsultService } from './peer-consult.service';
export declare class PeerConsultController {
    private readonly peerConsultService;
    constructor(peerConsultService: PeerConsultService);
    broadcastCase(doctorId: string, patientId: string, specialtyTarget: string, message: string, recordId: string): Promise<unknown>;
}
//# sourceMappingURL=peer-consult.controller.d.ts.map