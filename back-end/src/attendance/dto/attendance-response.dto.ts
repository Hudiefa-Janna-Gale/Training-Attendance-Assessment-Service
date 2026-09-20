import { ApiProperty } from '@nestjs/swagger';
import type { AttendanceRecord } from '../../generated/prisma/client.js';
import { AttendanceStatus } from '../../generated/prisma/enums.js';

export class AttendanceRecordResponseDto {
  @ApiProperty({ example: 'P-001' }) participant_id: string;
  @ApiProperty({ enum: AttendanceStatus, example: AttendanceStatus.present })
  status: AttendanceStatus;
  @ApiProperty() recorded_at: string;
}

export class AttendanceSummaryDto {
  @ApiProperty({ example: 2 }) present: number;
  @ApiProperty({ example: 1 }) absent: number;
  @ApiProperty({ example: 0 }) excused: number;
  @ApiProperty({ example: 3 }) total: number;
}

export class AttendanceResponseDto {
  @ApiProperty({ example: 'SES-001' }) session_id: string;
  @ApiProperty({ type: AttendanceSummaryDto }) summary: AttendanceSummaryDto;
  @ApiProperty({ type: [AttendanceRecordResponseDto] })
  records: AttendanceRecordResponseDto[];
}

export function toAttendanceResponse(
  sessionId: string,
  rows: AttendanceRecord[],
): AttendanceResponseDto {
  const summary: AttendanceSummaryDto = {
    present: 0,
    absent: 0,
    excused: 0,
    total: rows.length,
  };
  for (const row of rows) summary[row.status] += 1;

  return {
    session_id: sessionId,
    summary,
    records: rows.map((r) => ({
      participant_id: r.participantId,
      status: r.status,
      recorded_at: r.recordedAt.toISOString(),
    })),
  };
}
