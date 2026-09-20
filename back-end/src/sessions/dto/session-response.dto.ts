import { ApiProperty } from '@nestjs/swagger';
import { formatDateOnly } from '../../common/dates.js';
import type { Session } from '../../generated/prisma/client.js';

export class SessionResponseDto {
  @ApiProperty({ example: 'SES-001' }) session_id: string;
  @ApiProperty({ example: 'WS-2025-001' }) workshop_id: string;
  @ApiProperty({ example: 1 }) day: number;
  @ApiProperty({ example: '2025-09-01' }) date: string;
  @ApiProperty({ example: 'FAC-001' }) facilitator_id: string;
  @ApiProperty({ example: 'TOP-001' }) topic_id: string;
  @ApiProperty({ example: '08:00–09:30' }) time_slot: string;
  @ApiProperty() created_at: string;
}

export function toSessionResponse(s: Session): SessionResponseDto {
  return {
    session_id: s.sessionId,
    workshop_id: s.workshopId,
    day: s.day,
    date: formatDateOnly(s.date),
    facilitator_id: s.facilitatorId,
    topic_id: s.topicId,
    time_slot: s.timeSlot,
    created_at: s.createdAt.toISOString(),
  };
}
