import { ApiProperty } from '@nestjs/swagger';
import { AssessmentResult } from '../../generated/prisma/enums.js';

export class ResultResponseDto {
  @ApiProperty({ example: 'P-001' }) participant_id: string;
  @ApiProperty({ example: 'WS-2025-001' }) workshop_id: string;
  @ApiProperty({
    enum: AssessmentResult,
    example: AssessmentResult.PASS,
    description:
      "PASS = attended at least 2 days (every day, for a workshop with fewer than 2) AND scored at or above the final assessment's pass mark; FAIL otherwise.",
  })
  result: AssessmentResult;
  @ApiProperty({
    example: 3,
    description:
      'Distinct workshop days the participant was `present` for at least one session',
  })
  days_attended: number;
  @ApiProperty({
    example: 82,
    nullable: true,
    description:
      'Score on the final assessment; null if none has been recorded',
  })
  final_score: number | null;
}
