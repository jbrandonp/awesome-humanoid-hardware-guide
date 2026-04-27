import { WhisperService, WhisperTask } from './whisper.service';
type SubmitTranscriptionResponse = {
    error: string;
} | {
    message: string;
    taskId: string;
};
type TranscriptionStatusResponse = {
    error: string;
} | WhisperTask;
export declare class WhisperController {
    private readonly whisperService;
    constructor(whisperService: WhisperService);
    submitAudioForTranscription(filePath: string): Promise<SubmitTranscriptionResponse>;
    getTranscriptionStatus(taskId: string): Promise<TranscriptionStatusResponse>;
}
export {};
//# sourceMappingURL=whisper.controller.d.ts.map