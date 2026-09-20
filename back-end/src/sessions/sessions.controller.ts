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
import { CreateSessionDto } from './dto/create-session.dto.js';
import { SessionResponseDto } from './dto/session-response.dto.js';
import { SessionsService } from './sessions.service.js';

@ApiTags('Sessions')
@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessions: SessionsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a training session (assigns facilitator and topic)',
  })
  @ApiCreatedResponse({ type: SessionResponseDto })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @ApiConflictResponse({
    description:
      'session_id already exists, or the workshop already has that day/time slot',
  })
  create(@Body() dto: CreateSessionDto): Promise<SessionResponseDto> {
    return this.sessions.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get session details' })
  @ApiParam({ name: 'id', example: 'SES-001', description: 'session_id' })
  @ApiOkResponse({ type: SessionResponseDto })
  @ApiNotFoundResponse({ description: 'Session not found' })
  findOne(@Param('id') id: string): Promise<SessionResponseDto> {
    return this.sessions.findOne(id);
  }
}
