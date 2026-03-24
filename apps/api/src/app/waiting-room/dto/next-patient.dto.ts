import { IsString, IsNotEmpty } from 'class-validator';

export class NextPatientDto {
  @IsString()
  @IsNotEmpty()
  ticketNumber!: string;

  @IsString()
  @IsNotEmpty()
  targetRoom!: string;

  @IsString()
  @IsNotEmpty()
  departmentId!: string;
}
