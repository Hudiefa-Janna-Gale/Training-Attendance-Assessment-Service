import { Controller, Get, Param } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ResultResponseDto } from './dto/result-response.dto.js';
import { ResultsService } from './results.service.js';

@ApiTags('Results')
@Controller('participants/:id/results')
export class ResultsController {
  constructor(private readonly results: ResultsService) {}

  @Get(':workshop_id')
  @ApiOperation({
    summary: 'Get the final PASS/FAIL result of a participant for a workshop',
    description:
      "Consumed by the Feedback, Certificate & Notification Service. PASS requires attending at least 2 days (every day, for a workshop with fewer than 2) AND scoring at or above the final assessment's pass mark.",
  })
  @ApiParam({ name: 'id', example: 'P-001', description: 'participant_id' })
  @ApiParam({ name: 'workshop_id', example: 'WS-2025-001' })
  @ApiOkResponse({ type: ResultResponseDto })
  @ApiNotFoundResponse({
    description: 'The workshop has no sessions or assessments in this service',
  })
  getResult(
    @Param('id') participantId: string,
    @Param('workshop_id') workshopId: string,
  ): Promise<ResultResponseDto> {
    return this.results.getResult(participantId, workshopId);
  }
}
