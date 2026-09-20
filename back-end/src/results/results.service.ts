import { Injectable, NotFoundException } from '@nestjs/common';
import { AssessmentType, AttendanceStatus } from '../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ResultResponseDto } from './dto/result-response.dto.js';
import {
  evaluateWorkshopResult,
  REQUIRED_DAYS,
  TOTAL_DAYS,
} from './grading.js';

@Injectable()
export class ResultsService {
  constructor(private readonly prisma: PrismaService) {}

  async getResult(
    participantId: string,
    workshopId: string,
  ): Promise<ResultResponseDto> {
    const [presentRows, sessionCount, finalAssessment] = await Promise.all([
      this.prisma.attendanceRecord.findMany({
        where: {
          participantId,
          status: AttendanceStatus.present,
          session: { workshopId },
        },
        select: { session: { select: { day: true } } },
      }),
      this.prisma.session.count({ where: { workshopId } }),
      this.prisma.assessment.findFirst({
        where: { workshopId, type: AssessmentType.FINAL },
        include: { scores: { where: { participantId } } },
      }),
    ]);

    if (sessionCount === 0 && !finalAssessment) {
      throw new NotFoundException(
        `No sessions or assessments found for workshop ${workshopId}`,
      );
    }

    // Several sessions can share a day; a day counts once.
    const daysPresent = [
      ...new Set(presentRows.map((r) => r.session.day)),
    ].sort((a, b) => a - b);
    const finalScore = finalAssessment?.scores[0]?.score ?? null;

    const result = evaluateWorkshopResult({
      daysAttended: daysPresent.length,
      finalScore,
      passMark: finalAssessment?.passMark ?? 0,
    });

    return {
      participant_id: participantId,
      workshop_id: workshopId,
      result,
      attendance: {
        days_attended: daysPresent.length,
        days_present: daysPresent,
        total_days: TOTAL_DAYS,
        required_days: REQUIRED_DAYS,
        met: daysPresent.length >= REQUIRED_DAYS,
      },
      final_assessment: finalAssessment
        ? {
            assessment_id: finalAssessment.assessmentId,
            score: finalScore,
            total_marks: finalAssessment.totalMarks,
            pass_mark: finalAssessment.passMark,
            met:
              finalScore === null
                ? null
                : finalScore >= finalAssessment.passMark,
          }
        : null,
      calculated_at: new Date().toISOString(),
    };
  }
}
