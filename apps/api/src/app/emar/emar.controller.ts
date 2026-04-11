import { Controller, Post, Body, UseInterceptors, HttpCode, HttpStatus } from '@nestjs/common';
import { EmarsyncListener, type EmarEventPayload } from './emarsync-listener.interceptor';

@Controller('emar')
export class EmarController {
  
  @Post('sync')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(EmarsyncListener)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async syncMedication(@Body() _payload: EmarEventPayload): Promise<{ success: boolean; message: string; timestamp: string }> {
    // The actual inventory logic is handled by the Interceptor
    // We just return a success response if the interceptor didn't throw
    return {
      success: true,
      message: 'Medication administration synced to inventory.',
      timestamp: new Date().toISOString()
    };
  }
}
