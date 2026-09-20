import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { AssessmentsService } from './assessments.service.js';
import {
  AssessmentResponseDto,
  ScoreListResponseDto,
  ScoreResponseDto,
} from './dto/assessment-response.dto.js';
import { CreateAssessmentDto } from './dto/create-assessment.dto.js';
import { SubmitScoreDto } from './dto/submit-score.dto.js';

@ApiTags('Assessments')
@Controller('assessments')
export class AssessmentsController {
  constructor(private readonly assessments: AssessmentsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create an assessment (the final, or an optional daily quiz)',
  })
  @ApiCreatedResponse({ type: AssessmentResponseDto })
  @ApiBadRequestResponse({
    description:
      'Validation failed (e.g. pass_mark > total_marks, final not on day 3)',
  })
  @ApiConflictResponse({
    description:
      'assessment_id exists, or the workshop already has a final assessment',
  })
  create(@Body() dto: CreateAssessmentDto): Promise<AssessmentResponseDto> {
    return this.assessments.create(dto);
  }

  @Post(':id/scores')
  @ApiOperation({
    summary: "Submit a participant's score",
    description:
      "The PASS/FAIL result of the score is computed from the assessment's pass_mark.",
  })
  @ApiParam({ name: 'id', example: 'ASS-001', description: 'assessment_id' })
  @ApiCreatedResponse({ type: ScoreResponseDto })
  @ApiBadRequestResponse({
    description: 'Validation failed (e.g. score > total_marks)',
  })
  @ApiNotFoundResponse({ description: 'Assessment not found' })
  @ApiConflictResponse({
    description: 'This participant already has a score for the assessment',
  })
  submitScore(
    @Param('id') id: string,
    @Body() dto: SubmitScoreDto,
  ): Promise<ScoreResponseDto> {
    return this.assessments.submitScore(id, dto);
  }

  @Get(':id/scores')
  @ApiOperation({ summary: 'Get all scores for an assessment' })
  @ApiParam({ name: 'id', example: 'ASS-001', description: 'assessment_id' })
  @ApiOkResponse({ type: ScoreListResponseDto })
  @ApiNotFoundResponse({ description: 'Assessment not found' })
  listScores(@Param('id') id: string): Promise<ScoreListResponseDto> {
    return this.assessments.listScores(id);
  }
}
