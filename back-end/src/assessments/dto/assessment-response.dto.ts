import { ApiProperty } from '@nestjs/swagger';
import type { Assessment, Score } from '../../generated/prisma/client.js';
import {
  AssessmentResult,
  AssessmentType,
} from '../../generated/prisma/enums.js';

export class AssessmentResponseDto {
  @ApiProperty({ example: 'ASS-001' }) assessment_id: string;
  @ApiProperty({ example: 'WS-2025-001' }) workshop_id: string;
  @ApiProperty({ example: 'Day 3 Final Assessment' }) title: string;
  @ApiProperty({ example: 3 }) day: number;
  @ApiProperty({ enum: AssessmentType, example: AssessmentType.FINAL })
  type: AssessmentType;
  @ApiProperty({ example: 100 }) total_marks: number;
  @ApiProperty({ example: 60 }) pass_mark: number;
  @ApiProperty() created_at: string;
}

export class ScoreResponseDto {
  @ApiProperty({ example: 'ASS-001' }) assessment_id: string;
  @ApiProperty({ example: 'P-001' }) participant_id: string;
  @ApiProperty({ example: 82 }) score: number;
  @ApiProperty({ enum: AssessmentResult, example: AssessmentResult.PASS })
  result: AssessmentResult;
  @ApiProperty() submitted_at: string;
}

export class ScoreSummaryDto {
  @ApiProperty({ example: 3 }) total: number;
  @ApiProperty({ example: 2 }) passed: number;
  @ApiProperty({ example: 1 }) failed: number;
}

export class ScoreListResponseDto {
  @ApiProperty({ example: 'ASS-001' }) assessment_id: string;
  @ApiProperty({ example: 100 }) total_marks: number;
  @ApiProperty({ example: 60 }) pass_mark: number;
  @ApiProperty({ type: ScoreSummaryDto }) summary: ScoreSummaryDto;
  @ApiProperty({ type: [ScoreResponseDto] }) scores: ScoreResponseDto[];
}

export function toAssessmentResponse(a: Assessment): AssessmentResponseDto {
  return {
    assessment_id: a.assessmentId,
    workshop_id: a.workshopId,
    title: a.title,
    day: a.day,
    type: a.type,
    total_marks: a.totalMarks,
    pass_mark: a.passMark,
    created_at: a.createdAt.toISOString(),
  };
}

export function toScoreResponse(s: Score): ScoreResponseDto {
  return {
    assessment_id: s.assessmentId,
    participant_id: s.participantId,
    score: s.score,
    result: s.result,
    submitted_at: s.submittedAt.toISOString(),
  };
}
