import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsEnum,
  ValidateNested,
} from 'class-validator';
import { IsBusinessId } from '../../common/external-id.decorator.js';
import { AttendanceStatus } from '../../generated/prisma/enums.js';

export class AttendanceEntryDto {
  @ApiProperty({ example: 'P-001', description: 'Participant (Group 2)' })
  @IsBusinessId()
  participant_id: string;

  @ApiProperty({ enum: AttendanceStatus, example: AttendanceStatus.present })
  @IsEnum(AttendanceStatus, {
    message: 'status must be one of: present, absent, excused',
  })
  status: AttendanceStatus;
}

export class RecordAttendanceDto {
  @ApiProperty({
    type: [AttendanceEntryDto],
    description:
      'One entry per participant. Re-sending a participant updates their status (one record per participant per session).',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @ArrayUnique((entry: AttendanceEntryDto) => entry.participant_id, {
    message: 'records must not contain the same participant_id twice',
  })
  @ValidateNested({ each: true })
  @Type(() => AttendanceEntryDto)
  records: AttendanceEntryDto[];
}
