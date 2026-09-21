import { Controller, UseFilters, UsePipes } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AssessmentsService } from '../assessments/assessments.service.js';
import { AttendanceService } from '../attendance/attendance.service.js';
import { CreateAssessmentDto } from '../assessments/dto/create-assessment.dto.js';
import { CreateSessionDto } from '../sessions/dto/create-session.dto.js';
import { ResultsService } from '../results/results.service.js';
import { SessionsService } from '../sessions/sessions.service.js';
import {
  AssessmentRefDto,
  RecordAttendanceRequestDto,
  ResultRequestDto,
  SessionRefDto,
  SubmitScoreRequestDto,
} from './dto/requests.js';
import { PATTERNS } from './patterns.js';
import { RpcFailureFilter } from './rpc-failure.filter.js';
import { rpcValidationPipe } from './validation.js';

/**
 * The service's operations for RabbitMQ: the same ones as the HTTP controllers, running the same
 * services, with the same validation (unknown properties are rejected, numbers are checked…).
 */
@Controller()
@UsePipes(rpcValidationPipe())
@UseFilters(new RpcFailureFilter())
export class MessagingController {
  constructor(
    private readonly sessions: SessionsService,
    private readonly attendance: AttendanceService,
    private readonly assessments: AssessmentsService,
    private readonly results: ResultsService,
  ) {}

  @MessagePattern(PATTERNS.createSession)
  createSession(@Payload() dto: CreateSessionDto) {
    return this.sessions.create(dto);
  }

  @MessagePattern(PATTERNS.listSessions)
  listSessions() {
    return this.sessions.list();
  }

  @MessagePattern(PATTERNS.getSession)
  getSession(@Payload() { session_id }: SessionRefDto) {
    return this.sessions.findOne(session_id);
  }

  @MessagePattern(PATTERNS.recordAttendance)
  recordAttendance(
    @Payload() { session_id, ...dto }: RecordAttendanceRequestDto,
  ) {
    return this.attendance.record(session_id, dto);
  }

  @MessagePattern(PATTERNS.getAttendance)
  getAttendance(@Payload() { session_id }: SessionRefDto) {
    return this.attendance.list(session_id);
  }

  @MessagePattern(PATTERNS.createAssessment)
  createAssessment(@Payload() dto: CreateAssessmentDto) {
    return this.assessments.create(dto);
  }

  @MessagePattern(PATTERNS.listAssessments)
  listAssessments() {
    return this.assessments.list();
  }

  @MessagePattern(PATTERNS.submitScore)
  submitScore(@Payload() { assessment_id, ...dto }: SubmitScoreRequestDto) {
    return this.assessments.submitScore(assessment_id, dto);
  }

  @MessagePattern(PATTERNS.getScores)
  getScores(@Payload() { assessment_id }: AssessmentRefDto) {
    return this.assessments.listScores(assessment_id);
  }

  @MessagePattern(PATTERNS.getResult)
  getResult(@Payload() { participant_id, workshop_id }: ResultRequestDto) {
    return this.results.getResult(participant_id, workshop_id);
  }
}
