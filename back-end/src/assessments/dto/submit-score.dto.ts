import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';
import { IsBusinessId } from '../../common/external-id.decorator.js';

export class SubmitScoreDto {
  @ApiProperty({ example: 'P-001', description: 'Participant (Group 2)' })
  @IsBusinessId()
  participant_id: string;

  @ApiProperty({
    example: 82,
    minimum: 0,
    description: "Between 0 and the assessment's total_marks",
  })
  @IsInt()
  @Min(0)
  score: number;
}
