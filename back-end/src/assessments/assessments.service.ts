import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AssessmentType } from '../generated/prisma/enums.js';
import { IdGeneratorService } from '../prisma/id-generator.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { scoreResult } from '../results/grading.js';
import {
  AssessmentResponseDto,
  ScoreListResponseDto,
  ScoreResponseDto,
  toAssessmentResponse,
  toScoreItem,
  toScoreResponse,
} from './dto/assessment-response.dto.js';
import { CreateAssessmentDto } from './dto/create-assessment.dto.js';
import { SubmitScoreDto } from './dto/submit-score.dto.js';

const FINAL_DAY = 3;
const DEFAULT_TOTAL_MARKS = 100;
const DEFAULT_PASS_MARK = 60;

@Injectable()
export class AssessmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ids: IdGeneratorService,
  ) {}

  async create(dto: CreateAssessmentDto): Promise<AssessmentResponseDto> {
    const type =
      dto.type ??
      (dto.day === FINAL_DAY ? AssessmentType.FINAL : AssessmentType.QUIZ);
    const totalMarks = dto.total_marks ?? DEFAULT_TOTAL_MARKS;
    const passMark = dto.pass_mark ?? DEFAULT_PASS_MARK;

    if (passMark > totalMarks) {
      throw new BadRequestException(
        `pass_mark (${passMark}) cannot exceed total_marks (${totalMarks})`,
      );
    }
    if (type === AssessmentType.FINAL && dto.day !== FINAL_DAY) {
      throw new BadRequestException(
        `The final assessment must be on day ${FINAL_DAY}`,
      );
    }

    if (dto.assessment_id && (await this.exists(dto.assessment_id))) {
      throw new ConflictException(
        `Assessment ${dto.assessment_id} already exists`,
      );
    }

    if (type === AssessmentType.FINAL) {
      const existingFinal = await this.prisma.assessment.findFirst({
        where: { workshopId: dto.workshop_id, type: AssessmentType.FINAL },
        select: { assessmentId: true },
      });
      if (existingFinal) {
        throw new ConflictException(
          `Workshop ${dto.workshop_id} already has a final assessment (${existingFinal.assessmentId})`,
        );
      }
    }

    const assessmentId =
      dto.assessment_id ??
      (await this.ids.next('assessment', (id) => this.exists(id)));

    const assessment = await this.prisma.assessment.create({
      data: {
        assessmentId,
        workshopId: dto.workshop_id,
        title: dto.title,
        day: dto.day,
        type,
        totalMarks,
        passMark,
      },
    });
    return toAssessmentResponse(assessment);
  }

  /** Every assessment, newest first, so what was just created is on top. */
  async list(): Promise<AssessmentResponseDto[]> {
    const assessments = await this.prisma.assessment.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return assessments.map(toAssessmentResponse);
  }

  async submitScore(
    assessmentId: string,
    dto: SubmitScoreDto,
  ): Promise<ScoreResponseDto> {
    const assessment = await this.requireAssessment(assessmentId);

    if (dto.score > assessment.totalMarks) {
      throw new BadRequestException(
        `score (${dto.score}) cannot exceed the assessment's total_marks (${assessment.totalMarks})`,
      );
    }

    const already = await this.prisma.score.findUnique({
      where: {
        assessmentId_participantId: {
          assessmentId,
          participantId: dto.participant_id,
        },
      },
      select: { id: true },
    });
    if (already) {
      throw new ConflictException(
        `Participant ${dto.participant_id} already has a score for assessment ${assessmentId}`,
      );
    }

    const score = await this.prisma.score.create({
      data: {
        assessmentId,
        participantId: dto.participant_id,
        score: dto.score,
        result: scoreResult(dto.score, assessment.passMark),
      },
    });
    return toScoreResponse(score);
  }

  /** The assessment with all its scores, shaped like the brief's sample data. */
  async listScores(assessmentId: string): Promise<ScoreListResponseDto> {
    const assessment = await this.requireAssessment(assessmentId);

    const scores = await this.prisma.score.findMany({
      where: { assessmentId },
      orderBy: { participantId: 'asc' },
    });

    return {
      ...toAssessmentResponse(assessment),
      scores: scores.map(toScoreItem),
    };
  }

  private async requireAssessment(assessmentId: string) {
    const assessment = await this.prisma.assessment.findUnique({
      where: { assessmentId },
    });
    if (!assessment)
      throw new NotFoundException(`Assessment ${assessmentId} not found`);
    return assessment;
  }

  private async exists(assessmentId: string): Promise<boolean> {
    const found = await this.prisma.assessment.findUnique({
      where: { assessmentId },
      select: { id: true },
    });
    return found !== null;
  }
}
