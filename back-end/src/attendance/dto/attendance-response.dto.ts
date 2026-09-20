import { ApiProperty } from '@nestjs/swagger';
import type { AttendanceRecord } from '../../generated/prisma/client.js';
import { AttendanceStatus } from '../../generated/prisma/enums.js';

export class AttendanceRecordResponseDto {
  @ApiProperty({ example: 'P-001' }) participant_id: string;
  @ApiProperty({ enum: AttendanceStatus, example: AttendanceStatus.present })
  status: AttendanceStatus;
}

export class AttendanceResponseDto {
  @ApiProperty({ example: 'SES-001' }) session_id: string;
  @ApiProperty({ type: [AttendanceRecordResponseDto] })
  records: AttendanceRecordResponseDto[];
}

export function toAttendanceResponse(
  sessionId: string,
  rows: AttendanceRecord[],
): AttendanceResponseDto {
  return {
    session_id: sessionId,
    records: rows.map((r) => ({
      participant_id: r.participantId,
      status: r.status,
    })),
  };
}
