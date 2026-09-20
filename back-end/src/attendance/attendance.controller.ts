import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { AttendanceService } from './attendance.service.js';
import { AttendanceResponseDto } from './dto/attendance-response.dto.js';
import { RecordAttendanceDto } from './dto/record-attendance.dto.js';

@ApiTags('Attendance')
@ApiParam({ name: 'id', example: 'SES-001', description: 'session_id' })
@Controller('sessions/:id/attendance')
export class AttendanceController {
  constructor(private readonly attendance: AttendanceService) {}

  @Post()
  @ApiOperation({
    summary: 'Record attendance for a session',
    description:
      'Idempotent: re-sending a participant corrects their status instead of duplicating the record.',
  })
  @ApiCreatedResponse({ type: AttendanceResponseDto })
  @ApiBadRequestResponse({
    description:
      'Validation failed (unknown status, duplicate participant, empty list)',
  })
  @ApiNotFoundResponse({ description: 'Session not found' })
  record(
    @Param('id') id: string,
    @Body() dto: RecordAttendanceDto,
  ): Promise<AttendanceResponseDto> {
    return this.attendance.record(id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get the attendance list for a session' })
  @ApiOkResponse({ type: AttendanceResponseDto })
  @ApiNotFoundResponse({ description: 'Session not found' })
  list(@Param('id') id: string): Promise<AttendanceResponseDto> {
    return this.attendance.list(id);
  }
}
