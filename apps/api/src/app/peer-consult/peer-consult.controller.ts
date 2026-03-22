import { Controller, Post, Body, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { PeerConsultService } from './peer-consult.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('peer-consult')
@UseGuards(AuthGuard('jwt'))
export class PeerConsultController {
  constructor(private readonly peerConsultService: PeerConsultService) {}

  @Post('broadcast')
  async broadcastCase(
    @Body('doctorId') doctorId: string,
    @Body('patientId') patientId: string,
    @Body('specialtyTarget') specialtyTarget: string,
    @Body('message') message: string,
    @Body('recordId') recordId: string,
  ) {
    if (!doctorId || !patientId || !recordId || !specialtyTarget) {
      throw new HttpException('Données manquantes', HttpStatus.BAD_REQUEST);
    }
    return this.peerConsultService.broadcastCase(doctorId, patientId, specialtyTarget, message, recordId);
  }
}
