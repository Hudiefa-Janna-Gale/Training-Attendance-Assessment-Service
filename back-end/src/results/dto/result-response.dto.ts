import { ApiProperty } from '@nestjs/swagger';

export class AttendanceBreakdownDto {
  @ApiProperty({
    example: 2,
    description:
      'Distinct workshop days the participant was `present` for at least one session',
  })
  days_attended: number;
  @ApiProperty({ example: [1, 3], type: [Number] }) days_present: number[];
  @ApiProperty({ example: 3 }) total_days: number;
  @ApiProperty({ example: 2 }) required_days: number;
  @ApiProperty({ example: true }) met: boolean;
}

export class FinalAssessmentBreakdownDto {
  @ApiProperty({ example: 'ASS-001' }) assessment_id: string;
  @ApiProperty({
    example: 82,
    nullable: true,
    description: 'null until the score is submitted',
  })
  score: number | null;
  @ApiProperty({ example: 100 }) total_marks: number;
  @ApiProperty({ example: 60 }) pass_mark: number;
  @ApiProperty({ example: true, nullable: true }) met: boolean | null;
}

export class ResultResponseDto {
  @ApiProperty({ example: 'P-001' }) participant_id: string;
  @ApiProperty({ example: 'WS-2025-001' }) workshop_id: string;
  @ApiProperty({
    enum: ['PASS', 'FAIL', 'PENDING'],
    example: 'PASS',
    description:
      'PASS = attended ≥ 2 of 3 days AND final score ≥ pass mark; FAIL otherwise; PENDING while no final score has been recorded.',
  })
  result: 'PASS' | 'FAIL' | 'PENDING';
  @ApiProperty({ type: AttendanceBreakdownDto })
  attendance: AttendanceBreakdownDto;
  @ApiProperty({
    type: FinalAssessmentBreakdownDto,
    nullable: true,
    description: 'null if the workshop has no final assessment yet',
  })
  final_assessment: FinalAssessmentBreakdownDto | null;
  @ApiProperty() calculated_at: string;
}
