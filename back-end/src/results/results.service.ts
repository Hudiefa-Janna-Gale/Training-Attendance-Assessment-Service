import { Injectable, NotFoundException } from '@nestjs/common';
import { AssessmentType, AttendanceStatus } from '../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ResultResponseDto } from './dto/result-response.dto.js';
import { evaluateWorkshopResult } from './grading.js';

@Injectable()
export class ResultsService {
  constructor(private readonly prisma: PrismaService) {}

  async getResult(
    participantId: string,
    workshopId: string,
  ): Promise<ResultResponseDto> {
    const [presentRows, sessionDays, finalAssessment] = await Promise.all([
      this.prisma.attendanceRecord.findMany({
        where: {
          participantId,
          status: AttendanceStatus.present,
          session: { workshopId },
        },
        select: { session: { select: { day: true } } },
      }),
      // One row per day that has a session: how many days the workshop has.
      this.prisma.session.findMany({
        where: { workshopId },
        select: { day: true },
        distinct: ['day'],
      }),
      this.prisma.assessment.findFirst({
        where: { workshopId, type: AssessmentType.FINAL },
        include: { scores: { where: { participantId } } },
      }),
    ]);

    if (sessionDays.length === 0 && !finalAssessment) {
      throw new NotFoundException(
        `No sessions or assessments found for workshop ${workshopId}`,
      );
    }

    // Several sessions can share a day; a day counts once.
    const daysAttended = new Set(presentRows.map((r) => r.session.day)).size;
    const finalScore = finalAssessment?.scores[0]?.score ?? null;

    return {
      participant_id: participantId,
      workshop_id: workshopId,
      result: evaluateWorkshopResult({
        daysAttended,
        workshopDays: sessionDays.length,
        finalScore,
        passMark: finalAssessment?.passMark ?? 0,
      }),
      days_attended: daysAttended,
      final_score: finalScore,
    };
  }
}
