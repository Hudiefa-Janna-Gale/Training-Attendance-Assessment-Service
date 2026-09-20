import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  AttendanceResponseDto,
  toAttendanceResponse,
} from './dto/attendance-response.dto.js';
import { RecordAttendanceDto } from './dto/record-attendance.dto.js';

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  /** Records (or corrects) attendance for a session. All-or-nothing. */
  async record(
    sessionId: string,
    dto: RecordAttendanceDto,
  ): Promise<AttendanceResponseDto> {
    await this.requireSession(sessionId);

    const recordedAt = new Date();
    await this.prisma.$transaction(
      dto.records.map((entry) =>
        this.prisma.attendanceRecord.upsert({
          where: {
            sessionId_participantId: {
              sessionId,
              participantId: entry.participant_id,
            },
          },
          create: {
            sessionId,
            participantId: entry.participant_id,
            status: entry.status,
            recordedAt,
          },
          update: { status: entry.status, recordedAt },
        }),
      ),
    );

    return this.list(sessionId);
  }

  async list(sessionId: string): Promise<AttendanceResponseDto> {
    await this.requireSession(sessionId);

    const rows = await this.prisma.attendanceRecord.findMany({
      where: { sessionId },
      orderBy: { participantId: 'asc' },
    });
    return toAttendanceResponse(sessionId, rows);
  }

  private async requireSession(sessionId: string): Promise<void> {
    const session = await this.prisma.session.findUnique({
      where: { sessionId },
      select: { id: true },
    });
    if (!session) throw new NotFoundException(`Session ${sessionId} not found`);
  }
}
