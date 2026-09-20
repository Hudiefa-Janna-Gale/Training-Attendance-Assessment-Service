import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { IsBusinessId } from '../../common/external-id.decorator.js';
import { AssessmentType } from '../../generated/prisma/enums.js';

export class CreateAssessmentDto {
  @ApiPropertyOptional({
    example: 'ASS-001',
    description: 'Generated (ASS-001, ASS-002, …) when omitted.',
  })
  @IsOptional()
  @IsBusinessId()
  assessment_id?: string;

  @ApiProperty({ example: 'WS-2025-001', description: 'Workshop (Group 1)' })
  @IsBusinessId()
  workshop_id: string;

  @ApiProperty({ example: 'Day 3 Final Assessment' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiProperty({ example: 3, minimum: 1, maximum: 3 })
  @IsInt()
  @Min(1)
  @Max(3)
  day: number;

  @ApiPropertyOptional({
    enum: AssessmentType,
    description:
      "FINAL = the workshop's one final assessment (must be day 3); QUIZ = optional daily quiz. Defaults to FINAL on day 3, QUIZ otherwise.",
  })
  @IsOptional()
  @IsEnum(AssessmentType, { message: 'type must be FINAL or QUIZ' })
  type?: AssessmentType;

  @ApiPropertyOptional({ example: 100, default: 100 })
  @IsOptional()
  @IsInt()
  @Min(1)
  total_marks?: number;

  @ApiPropertyOptional({
    example: 60,
    default: 60,
    description: 'Must not exceed total_marks',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  pass_mark?: number;
}
