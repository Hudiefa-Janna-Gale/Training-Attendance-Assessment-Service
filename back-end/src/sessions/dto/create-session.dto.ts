import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { IsBusinessId } from '../../common/external-id.decorator.js';

export class CreateSessionDto {
  @ApiPropertyOptional({
    example: 'SES-001',
    description: 'Generated (SES-001, SES-002, …) when omitted.',
  })
  @IsOptional()
  @IsBusinessId()
  session_id?: string;

  @ApiProperty({ example: 'WS-2025-001', description: 'Workshop (Group 1)' })
  @IsBusinessId()
  workshop_id: string;

  @ApiProperty({ example: 'FAC-001', description: 'Facilitator (Group 4)' })
  @IsBusinessId()
  facilitator_id: string;

  @ApiProperty({ example: 'TOP-001', description: 'Topic (Group 5)' })
  @IsBusinessId()
  topic_id: string;

  @ApiProperty({
    example: 1,
    minimum: 1,
    maximum: 3,
    description: 'Workshop day (1–3)',
  })
  @IsInt()
  @Min(1)
  @Max(3)
  day: number;

  @ApiProperty({ example: '2025-09-01', description: 'YYYY-MM-DD' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'date must be in YYYY-MM-DD format',
  })
  @IsISO8601({ strict: true }, { message: 'date must be a real calendar date' })
  date: string;

  @ApiProperty({ example: '08:00–09:30', description: '24-hour HH:MM–HH:MM' })
  @IsString()
  @IsNotEmpty()
  time_slot: string;
}
